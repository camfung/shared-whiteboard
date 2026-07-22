---
tags:
  - whiteboard
  - tldraw
  - mcp
  - tool
  - plugin
---

# Shared Whiteboard

Named, persistent draw.io-style whiteboards in the browser that **you and Claude
edit at the same time**. Boards live on a small sync server; the browser renders
them with [tldraw](https://tldraw.dev); an MCP server lets Claude open a board by
name and mutate it. Your edits and Claude's edits appear on the same canvas.

## Install (Claude Code plugin)

The quickest way. Installs the MCP server **and** the sync backend + web UI in
one step — no clone, no `npm install` (the plugin ships a self-contained bundle).
Run these in Claude Code:

```
/plugin marketplace add camfung/shared-whiteboard
/plugin install shared-whiteboard@camfung-plugins
```

- Restart Claude Code when prompted so it loads the MCP server.
- On first use the plugin boots a local backend + web UI at
  **http://127.0.0.1:5858** — open that in your browser to watch Claude draw live.
- Nothing else to configure: the plugin auto-spawns the backend for you. The
  manual **Run** and **Claude / MCP** sections below are only for running from
  source (development).

**Update later**: re-pull the marketplace, then reinstall:
```
/plugin marketplace update camfung-plugins
/plugin install shared-whiteboard@camfung-plugins
```

## The workflow it's built for
1. Open the web UI, pick a board from the dropdown (or `＋ new`). The dropdown
   name is what you tell Claude.
2. Tell Claude: *"open the **Auth Redesign** board and add a node for the session store"*.
3. Claude calls `open_board("Auth Redesign")` then edits — you watch it happen live.
4. Either side can create boards; new boards show up in the other's list.

## Skills

The plugin ships two skills that give Claude a scripted first step: **boot the
backend if it's down, then open the board in your browser** — so you never end up
with Claude drawing to a window you can't see.

- **create** — triggered when you ask Claude to draw, diagram, or add anything to
  the whiteboard. Opens the board, then guides Claude through `create_node` /
  `create_uml` / `create_note` / `create_text` / `connect`.
- **edit** — triggered when you ask Claude to move, restyle, connect, rename,
  re-layout, or delete existing shapes. Opens the board, then reads the current
  shapes before mutating them.

Each skill's `open-board.sh` is a thin wrapper over `wb server open` (pure Node —
no `curl` or `node_modules` needed), so it works the same from a plugin install
or a source clone.

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

## Run (from source / development)

> Skip this if you installed the plugin above — it bundles and boots everything.
> These steps are for hacking on the code or running a checkout by hand.

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
The bundled `whiteboard.service` binds `WB_HOST=0.0.0.0`, so the board is
reachable from other devices on the LAN (see *On an iPad* below).

### On an iPad (installs as a full-screen app)
The UI is a PWA — added to the Home Screen it launches chromeless (no address
bar, no tabs), locks out browser page-zoom so pinch drives the canvas, and kills
the rubber-band bounce. It feels like a native app.

1. **Serve on the LAN.** The always-on service already binds `0.0.0.0`. If you
   run it by hand instead, pass the bind explicitly:
   ```bash
   cd web && npm run build
   WB_HOST=0.0.0.0 node server.js      # UI + API on every interface, port 5858
   ```
   > No auth — anyone on the LAN can read/edit. To scope it to your Tailscale
   > net, use that interface's IP instead of `0.0.0.0`.
2. **Open it on the iPad.** In Safari go to `http://<this-machine-ip>:5858`
   (e.g. `http://10.0.2.52:5858`). `hostname -I` prints the machine's IPs.
3. **Install.** Share button → **Add to Home Screen** → *Add*. Launch it from the
   new "Whiteboard" icon — it opens full-screen.

Keep the iPad and host on the same network. The page and its WebSocket both talk
to `<the-host-you-opened>:5858`, so LAN over plain `http`/`ws` just works.

## Claude / MCP (from source)

> Plugin users can skip this — `/plugin install` registers the MCP server via the
> bundled `.mcp.json`. This is the manual registration for a source checkout.

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
- `open_board {name}` — open by name/id, make it active. Returns a compact **summary** (shape/binding counts, per-type breakdown, `clock`) — not the shapes, so it stays cheap on huge boards. Read the content on demand with the tools below.
- `create_board {name}` — create + open + make active.
- `rename_board {name, id?}` / `delete_board {name}`.

Reading the active board (call `open_board` or `create_board` first):
- `get_board {since?, type?, color?, text?, ids?}` — the whole board (shapes with id, type, x/y, w/h, color, text; uml shapes also give name/fields/methods) + arrow links + the board `clock`. Filters narrow it; `since=<clock>` returns only what changed. See *Reading big boards efficiently* below.
- `list_shapes {type?, color?, text?}` — compact index: one `{id, type, label}` line per shape (+ arrow links). A cheap map of a large board.
- `read_text {type?, color?, text?}` — all the words on the board: each shape's full (untruncated) text + arrow links (the graph), no geometry/color/size. ~half the tokens of `get_board`; best for reading/summarizing content.
- `get_shapes {ids?, type?, color?, text?}` — full detail for specific shapes (by id, or by filter).
- `get_neighbors {ids, hops?}` — a shape plus everything arrow-linked to it, out to `hops` links (default 1), with the connecting arrows.
- `check_overlap` — layout-quality metrics (overlap ratio, worst offenders); decide/verify a re-layout.

Editing the active board:
- `create_node {text,x,y,w?,h?,shape?,color?,fill?}` → id.
- `create_text {text,x,y,color?,size?}` → id.
- `create_note {text,x,y,color?}` → id.
- `create_uml {name,x,y,fields?,methods?,color?}` → id. A UML class block (title + fields + methods compartments).
- `create_border_label {label,value,x,y,w?,color?}` → id. A fieldset-style field: the `label` sits in a real gap cut into the top border (like an HTML `<fieldset>`/`<legend>`), the `value` shows inside. Box auto-fits the value (`w` = minimum width); an over-long label truncates with an ellipsis. Frame + label take `color`; renders as an SVG image (not text-editable; tuned for the dark canvas).
- `update_uml {id,name?,fields?,methods?,color?,x?,y?,w?}` — replace name/fields/methods.
- `add_field {id,field}` / `add_method {id,method}` — append one row (auto-grows).
- `create_svg {x,y,svg?,file?,w?,h?,name?}` → id. Drop an SVG onto the board as an image — pass the markup inline (`svg`) or a `.svg` path (`file`); `w`/`h` default to the SVG `viewBox`. Ideal for a skill-generated diagram (e.g. the sequence-diagram / flow-diagram skills) kept in its own house style. Renders in image mode (system fonts only — embed the font in the SVG for an exact webfont match).
- `connect {fromId,toId,text?,color?,dashed?}` → arrow that follows the shapes.
- `update_node {id,text?,x?,y?,w?,h?,color?,fill?}`.
- `space_evenly {ids, axis}` — distribute 3+ nodes so the gaps between them are equal along one axis (`horizontal` evens the left→right gaps, `vertical` the top→bottom); the two end nodes stay put and a container carries its contents. Like Figma "distribute spacing". In the web UI: the `↔ even` / `↕ even` toolbar buttons act on the current selection.
- `delete_shapes {ids}` — also removes bound arrows.
- `clear_board` — wipe shapes/arrows (keeps the board).

Bulk (build a whole diagram in one transaction):
- `apply_ops {ops[], defaults?}` — an ordered list of ops (`node`/`text`/`note`/`uml`/`svg`/`connect`/`update`/`move`/`delete`); a create op's `ref` lets later ops connect/move it in the same call. Keep it compact:
  - `defaults` — an object merged under every op (the `op` type too), so shared props aren't repeated: `defaults:{op:"node",w:250,fill:"semi"}`.
  - `{op:"col"|"row", x, y, step?, items[]}` — lay many boxes out from `(x,y)`, stepping down `y` (`col`) or along `x` (`row`); each item is a string or `{text,color?,…}` and inherits the layout op's shared props. Collapses a whole uniform column/grid into one op (irregular spacing → use plain `node` ops).

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

### Reading big boards efficiently
On a large board, don't re-read the whole thing every time:
- **Map first, then drill.** `list_shapes` gives a cheap index; pull full detail for only the ids you need with `get_shapes`, or expand outward from a node with `get_neighbors`.
- **Filter server-side.** `type` / `color` / `text` (substring, case-insensitive) / `ids` on `get_board`, `list_shapes`, and `get_shapes` narrow the result before it's sent.
- **Poll changes with the clock.** Every read returns a `clock`. Pass it back as `get_board {since: clock}` to get only shapes changed since (plus `deleted` ids from tombstones) — the cheap way to see the human's latest edits instead of re-reading the board. The response carries the new `clock`; keep it for the next poll.

## HTTP API (what the MCP server calls)
- `GET /boards` · `POST /boards {name}` · `POST /boards/rename {id,name}` · `POST /boards/delete {id}` · `GET /boards/find?q=`
- `GET /board?board=<id>` — semantic summary + `clock`. Optional `since=<clock>` (delta: changed shapes + `deleted` ids), and `type` / `color` / `text` / `ids` filters.
- `GET /shapes?board=<id>&fields=index|full` — `index` = compact `{id,type,label}`, `full` = full detail; same `type`/`color`/`text`/`ids` filters.
- `GET /neighbors?board=<id>&ids=a,b&hops=1` — graph neighborhood of the given shape ids.
- `GET /snapshot?board=<id>` — raw tldraw snapshot.
- `POST /node|/text|/note|/connect|/update|/delete|/clear?board=<id>`
- `POST /mutate?board=<id>` — low-level `{puts, deletes}` escape hatch

## Notes / limits
- Coordinates are tldraw page pixels; `create_*` place shapes at `x,y` (top-left).
- Conflict model is last-write-wins per record — fine for a human + Claude taking
  turns, not CRDT-grade for two people typing in the same text field at once.
- Backend host defaults to `127.0.0.1` (the `server.js` default); the bundled
  service overrides it to `0.0.0.0` for LAN/iPad use. Override with `WB_HOST`.
