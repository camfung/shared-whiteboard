---
name: create
description: Create shapes and diagrams on the Shared Whiteboard — boxes/nodes, UML class boxes, sticky notes, plain text, and arrows — on a live tldraw canvas the user watches in the browser. Use whenever the user asks to draw, diagram, sketch, map out, or visualize anything — a flowchart, pipeline, sequence diagram, state machine, dependency or call graph, architecture, tree, or layered/hierarchy diagram — or to add shapes to the whiteboard. Boots the sync backend and opens the board in a browser first.
---

# Create on the Shared Whiteboard

Add shapes to a live tldraw board. The user watches them appear in real time in
their browser, so **always open the board before drawing**.

## 1. Open the board (required first step)

Run the bundled script — it starts the sync backend if it is down, then opens the
board in a browser:

```bash
bash "${CLAUDE_PLUGIN_ROOT}/skills/create/open-board.sh"
```

It is idempotent: if the server is already up and a window is open, running it
again is harmless.

## 2. Select the target board

Use the whiteboard MCP tools (server `shared-whiteboard`):

- `list_boards` — see existing boards.
- `open_board { name }` — make an existing board active. All create tools act on
  the active board.
- `create_board { name }` — make a new board and set it active.

If the user did not name a board, create or open a sensibly-named one and tell
them which.

## 3. Create shapes

- `create_node { text, x, y, w?, h?, shape?, color?, fill? }` — a box/node.
- `create_uml { name, x, y, fields?, methods?, color? }` — a UML class box.
- `create_note { text, x, y, color? }` — a sticky note.
- `create_text { text, x, y, color?, size? }` — free-floating text.
- `connect { fromId, toId, text?, color?, dashed? }` — an arrow between two shapes.
- `apply_ops { ops }` — batch many creates/edits in one call (fastest for big diagrams).

## Drawing a structured diagram? Use the type guides

When the user wants an actual **diagram** — a flowchart, pipeline, sequence, state
machine, dependency/call graph, architecture, tree, or layered structure — do NOT
free-hand it. Diagram quality per type is a solved problem; follow the researched
guides:

1. **Always read `references/diagram-base.md` first** — the shared rules (short
   labels, build in one atomic `apply_ops`, never `create_text` for labels,
   `check_overlap` is not a quality signal, compute your own coordinates).
2. **Classify the input into ONE type**, then read the matching guide and follow it:

   | Input is mostly… | Read |
   |---|---|
   | Time-ordered steps / pipeline / messages between actors | `references/diagram-sequence-flow.md` |
   | Named states + event transitions, cycles, initial/terminal | `references/diagram-state-machine.md` |
   | Entities with directed depends-on / calls / imports edges | `references/diagram-dependency-graph.md` |
   | Parent/child containment, ranked layers, nesting/rings | `references/diagram-hierarchy-layers.md` |

   Read files under `${CLAUDE_PLUGIN_ROOT}/skills/create/references/`. Heterogeneous
   input: pick the dominant relationship's type, demote the rest (see the base guide).

## Layout tips (freeform / quick sketches)

- Coordinates are top-left origin, y grows downward. Space nodes generously
  (~200px apart) so arrows read cleanly.
- Node boxes auto-fit to their label (width grows to the text, height auto-fits).
  Keep labels short, or pin a uniform `w` so text wraps into equal-width boxes.
- `reflow_labels` settles arrow labels after a batch. `space_board` /
  `space_container` only *nudge* spacing — they will not fix a layout you didn't
  design, and can converge to a stable-but-bad state on wide, unevenly-sized boxes.
- `check_overlap` tests box-bounds collisions only — it is not a read-quality
  signal, and it mismeasures `text` shapes. For anything structured, use the
  diagram guides above instead of relying on it.
