#!/usr/bin/env bash
# Start the shared-whiteboard sync backend (:5858) and the web UI (:5173).
# Ctrl-C stops both.
set -euo pipefail
cd "$(dirname "$0")"

echo "[whiteboard] starting sync backend on :5858"
node server.js &
SERVER_PID=$!

echo "[whiteboard] starting web UI on :5173"
( cd web && npm run dev ) &
WEB_PID=$!

trap 'echo; echo "[whiteboard] stopping"; kill "$SERVER_PID" "$WEB_PID" 2>/dev/null || true' EXIT INT TERM

echo "[whiteboard] open http://127.0.0.1:5173  (backend http://127.0.0.1:5858)"
wait
