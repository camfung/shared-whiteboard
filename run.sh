#!/usr/bin/env bash
# Start the shared-whiteboard sync backend (:5858) and the web UI (:5173).
# Both bind all interfaces by default so LAN devices (e.g. an iPad on the desk)
# can reach them — open http://<this-machine-ip>:5173 there. Ctrl-C stops both.
#
# No auth: anyone on the LAN can read/edit. To keep it local-only, run:
#   WB_HOST=127.0.0.1 ./run.sh
set -euo pipefail
cd "$(dirname "$0")"

HOST="${WB_HOST:-0.0.0.0}"                                          # bind address
LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"     # first LAN IP, for the printed URL
LAN_IP="${LAN_IP:-127.0.0.1}"

echo "[whiteboard] starting sync backend on :5858 (host $HOST)"
WB_HOST="$HOST" node server.js &
SERVER_PID=$!

echo "[whiteboard] starting web UI on :5173 (host $HOST)"
( cd web && npm run dev -- --host "$HOST" ) &
WEB_PID=$!

trap 'echo; echo "[whiteboard] stopping"; kill "$SERVER_PID" "$WEB_PID" 2>/dev/null || true' EXIT INT TERM

echo "[whiteboard] local:  http://127.0.0.1:5173   (backend http://127.0.0.1:5858)"
if [ "$HOST" != "127.0.0.1" ]; then
  echo "[whiteboard] LAN:    http://$LAN_IP:5173    ← open this on the iPad (backend :5858)"
fi
wait
