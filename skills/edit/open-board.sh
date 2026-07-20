#!/usr/bin/env bash
# Ensure the Shared Whiteboard sync backend is running, then open the board in a
# browser so the user watches edits happen live. Thin wrapper over the CLI's
# `server open` (start-if-down + open), which is pure Node — no curl/node_modules
# needed, so it works from a plugin install too.
set -euo pipefail
ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
exec node "$ROOT/wb-cli.js" server open
