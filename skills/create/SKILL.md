---
name: create
description: Create shapes on the Shared Whiteboard — boxes/nodes, UML class boxes, sticky notes, plain text, and arrows — on a live tldraw canvas the user watches in the browser. Use whenever the user asks to draw, diagram, sketch, map out, or add anything to the whiteboard. Boots the sync backend and opens the board in a browser first.
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

## Layout tips

- Coordinates are top-left origin, y grows downward. Space nodes generously
  (~200px apart) so arrows read cleanly.
- After a batch of creates, run `space_board` / `space_container` to auto-tidy
  spacing, then `reflow_labels` to reposition arrow labels.
- Use `check_overlap` to verify nothing collides before finishing.
