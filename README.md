---
tags:
  - whiteboard
  - tldraw
  - mcp
  - tool
---

# Shared Whiteboard

Named, persistent draw.io-style whiteboards in the browser that **you and Claude
edit at the same time**. Boards live on a small sync server; the browser renders
them with [tldraw](https://tldraw.dev); an MCP server lets Claude open a board by
name and mutate it. Your edits and Claude's edits appear on the same canvas.

## The workflow it's built for
1. Open the web UI, pick a board from the dropdown (or `＋ new`). The dropdown
   name is what you tell Claude.
2. Tell Claude: *"open the **Auth Redesign** board and add a node for the session store"*.
3. Claude calls `open_board("Auth Redesign")` then edits — you watch it happen live.
4. Either side can create boards; new boards show up in the other's list.

## Architecture

### One authoritative document per board
- Each board is a `TLSocketRoom` (`@tldraw/sync-core`), keyed by a url-safe id.
- Two kinds of client mutate the same room: browsers (WebSocket, `@tldraw/sync`)
  and Claude (HTTP, via the MCP server).
- Every mutation runs through `room.updateStore(...)`, which broadcasts to all
  connected browsers — so Claude's edits show up live, and `get_board` reflects
  edits you just made.
- **Persistence**: any change (browser or Claude) debounce-writes the board's
  snapshot to `data/snapshots/<id>.json`; it's reloaded on next access. Board
  names live in `data/boards.json`. Restarting the server keeps every board.

```
 browser (tldraw useSync) ──WS──┐
                                ├── server.js (TLSocketRoom per board) ── data/*.json
 Claude (mcp-server.js) ──HTTP──┘
```

### Pieces
- `server.js` — sync backend. Browser WS at `/connect/:boardId`; semantic HTTP API;
  also serves the built web UI from `web/dist` when present (one port for everything).
- `boards.js` — named + persisted room registry (create/rename/delete/load/save).
- `shapes.js` — builders → valid tldraw v5.2.5 records (captured from a live editor).
- `uml-schema.js` — the custom `uml` shape's props (backend half; see caveat below).
- `templates.js` — reusable block store + stamp/clone (id remap, re-base to a point).
- `mcp-server.js` — stdio MCP. Holds a per-session "current board"; each tool = one HTTP call.
- `web/` — Vite + React + tldraw client. Board picker, `＋UML`, save/stamp templates.
  - `web/src/uml.tsx` — the `UmlShapeUtil` (browser half of the custom shape + double-click editing).

### Custom UML shape — the one gotcha
A custom tldraw shape must be registered in **three** places, all agreeing on the
same props (no migrations, so the synced schemas match):
1. `web/src/uml.tsx` — `UmlShapeUtil.props` (browser render + validation).
2. `uml-schema.js` → `boards.js` `createTLSchema({ shapes: { uml: {props} } })` (server validation).
3. `shapes.js` `buildUml` (the record the MCP server writes).
Change the props in one, change them in all three, or sync breaks.

### Reuse model
No Figma-style linked masters (tldraw has none). A template is a captured bundle
of records; stamping clones them with new ids at a target point. Copies are
independent. Edit `data/templates.json` to inspect/prune.

## Run

### Dev (hot reload)
```bash
./run.sh            # backend :5858 + Vite dev UI :5173  → open http://127.0.0.1:5173
```

### Always-on (one process serves UI + API on :5858)
```bash
cd web && npm run build          # build the UI once (rerun after web/ changes)
# then install the user service:
cp whiteboard.service ~/.config/systemd/user/whiteboard.service
systemctl --user daemon-reload
systemctl --user enable --now whiteboard.service
# UI + API now live at http://127.0.0.1:5858
```

## Claude / MCP

Registered at **user scope** (works in every project), pointing at the backend:
```bash
claude mcp add --scope user whiteboard --env WB_URL=http://127.0.0.1:5858 \
  -- node "/home/camer/ClaudeChats/Shared Whiteboard/mcp-server.js"
```
The MCP server just proxies HTTP, so the **backend must be running** (that's why
always-on is recommended). Restart Claude Code to load the server after adding it.

### Tools
Board management:
- `list_boards` — every board (name, id, shape count, updated).
- `open_board {name}` — open by name/id, make it active, return its contents.
- `create_board {name}` — create + open + make active.
- `rename_board {name, id?}` / `delete_board {name}`.

Editing the active board (call `open_board` or `create_board` first):
- `get_board` — all shapes (id, type, x/y, w/h, color, text; uml shapes also give name/fields/methods) + arrow links.
- `create_node {text,x,y,w?,h?,shape?,color?,fill?}` → id.
- `create_text {text,x,y,color?,size?}` → id.
- `create_note {text,x,y,color?}` → id.
- `create_uml {name,x,y,fields?,methods?,color?}` → id. A UML class block (title + fields + methods compartments).
- `update_uml {id,name?,fields?,methods?,color?,x?,y?,w?}` — replace name/fields/methods.
- `add_field {id,field}` / `add_method {id,method}` — append one row (auto-grows).
- `connect {fromId,toId,text?,color?,dashed?}` → arrow that follows the shapes.
- `update_node {id,text?,x?,y?,w?,h?,color?,fill?}`.
- `delete_shapes {ids}` — also removes bound arrows.
- `clear_board` — wipe shapes/arrows (keeps the board).

Reusable templates (save a block once, stamp copies anywhere):
- `list_templates` — saved templates (name + shape count).
- `save_template {name, ids}` — capture the given shapes (+ arrows between them) from the active board as a template.
- `stamp_template {name, x, y}` — drop a fresh independent copy onto the active board.
- `delete_template {name}`.

### Enums
- **colors**: black, grey, light-violet, violet, blue, light-blue, yellow, orange, green, light-green, light-red, red
- **shapes** (geo): rectangle, ellipse, diamond, triangle, hexagon, cloud, star, oval, pentagon, octagon, rhombus, trapezoid, x-box, check-box, heart
- **fills**: none, semi, solid, pattern
- Invalid enum → error (it would otherwise crash the browser's validator).

## HTTP API (what the MCP server calls)
- `GET /boards` · `POST /boards {name}` · `POST /boards/rename {id,name}` · `POST /boards/delete {id}` · `GET /boards/find?q=`
- `GET /board?board=<id>` — semantic summary · `GET /snapshot?board=<id>` — raw
- `POST /node|/text|/note|/connect|/update|/delete|/clear?board=<id>`
- `POST /mutate?board=<id>` — low-level `{puts, deletes}` escape hatch

## Notes / limits
- Coordinates are tldraw page pixels; `create_*` place shapes at `x,y` (top-left).
- Conflict model is last-write-wins per record — fine for a human + Claude taking
  turns, not CRDT-grade for two people typing in the same text field at once.
- Backend binds `127.0.0.1`. For LAN, set `WB_HOST=0.0.0.0` and open the host's IP.
