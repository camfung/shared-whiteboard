#!/usr/bin/env bash
# Install Shared Whiteboard as a native desktop app:
#   - systemd --user service  (the always-on app server: sync + web UI + HTTP API)
#   - desktop launcher         (app-mode window, "native app" feel)
#   - control panel            (start / stop / free the server to reclaim memory)
# Idempotent. Resolves every path at runtime, so it works from any clone location.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE="$(command -v node || true)"
PORT="${WB_PORT:-5858}"
SVC=whiteboard-app.service

[ -n "$NODE" ] || { echo "node not found on PATH — install Node first"; exit 1; }

# --- deps + web UI build (fresh clone has neither; skipped if already present) ---
if [ ! -d "$REPO_DIR/node_modules" ]; then
  echo "installing backend deps..."; ( cd "$REPO_DIR" && npm install --omit=dev )
fi
if [ ! -f "$REPO_DIR/web/dist/index.html" ]; then
  echo "building web UI..."; ( cd "$REPO_DIR/web" && npm install && npm run build )
fi

mkdir -p ~/.local/bin ~/.config/systemd/user ~/.local/share/applications
chmod +x "$REPO_DIR/open-whiteboard" "$REPO_DIR/whiteboard-ctl"

# --- hand the port over from any stray backend to the managed service ---------
# An MCP session may have auto-spawned server.js/dist/server.cjs on :$PORT. Stop
# only THIS repo's server processes (never anything unrelated) so the service can
# bind the port.
pkill -f "$REPO_DIR/server.js"       2>/dev/null || true
pkill -f "$REPO_DIR/dist/server.cjs" 2>/dev/null || true
sleep 1

# --- systemd --user service (bake this clone's node + repo path in) -----------
sed -e "s#__NODE__#$NODE#g" -e "s#__REPO_DIR__#$REPO_DIR#g" \
  "$REPO_DIR/whiteboard-app.service" > ~/.config/systemd/user/"$SVC"
echo "installed ~/.config/systemd/user/$SVC"

# --- desktop entries (real files, not symlinks, so __REPO_DIR__ is baked in) --
for d in shared-whiteboard shared-whiteboard-control; do
  sed "s#__REPO_DIR__#$REPO_DIR#g" "$REPO_DIR/$d.desktop" \
    > ~/.local/share/applications/"$d.desktop"
done
command -v update-desktop-database >/dev/null && \
  update-desktop-database ~/.local/share/applications 2>/dev/null || true
echo "installed desktop apps 'Shared Whiteboard' + 'Whiteboard Control'"

# --- CLI convenience ----------------------------------------------------------
ln -sf "$REPO_DIR/open-whiteboard" ~/.local/bin/whiteboard
ln -sf "$REPO_DIR/whiteboard-ctl"  ~/.local/bin/whiteboard-ctl
echo "linked 'whiteboard' + 'whiteboard-ctl' -> ~/.local/bin/"

# --- enable + start -----------------------------------------------------------
if command -v systemctl >/dev/null; then
  systemctl --user daemon-reload
  if systemctl --user enable --now "$SVC" 2>/dev/null; then
    echo "app server running on http://0.0.0.0:$PORT/"
  else
    echo "could not auto-start; run: systemctl --user enable --now $SVC"
  fi
else
  echo "no systemctl; start manually: WB_HOST=0.0.0.0 $NODE \"$REPO_DIR/server.js\""
fi

echo
echo "done. Launch 'Shared Whiteboard' from your app menu (or run: whiteboard)."
echo "Free its memory anytime from 'Whiteboard Control' (or: whiteboard-ctl stop)."
