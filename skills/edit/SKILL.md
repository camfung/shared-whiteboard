---
name: edit
description: Edit existing shapes on the Shared Whiteboard — move, restyle, relabel, resize, connect, re-layout, or delete nodes/UML/notes/text on a live tldraw canvas the user watches in the browser. Use whenever the user asks to change, rearrange, tidy, connect, rename, or remove things already on the whiteboard. Boots the sync backend and opens the board in a browser first.
---

# Edit the Shared Whiteboard

Change shapes already on a live tldraw board. The user watches edits happen in
real time in their browser, so **always open the board before editing**.

## 1. Open the board (required first step)

Run the bundled script — it starts the sync backend if it is down, then opens the
board in a browser:

```bash
bash "${CLAUDE_PLUGIN_ROOT}/skills/edit/open-board.sh"
```

It is idempotent: safe to run even if the server is already up.

## 2. Read the current board

Use the whiteboard MCP tools (server `shared-whiteboard`) to find what to change:

- `open_board { name }` — make the target board active (all edit tools act on it).
- `list_shapes` — compact index of id / type / label.
- `get_shapes { ids }` — full detail for specific shapes.
- `get_neighbors { ids, hops? }` — a shape plus its arrow-linked neighbors.

Always resolve real shape ids from the board before editing — never guess ids.

## 3. Edit shapes

- `update_node { id, text?, x?, y?, w?, h?, color?, fill? }` — restyle/relabel/resize/move a node.
- `update_uml { id, name?, fields?, methods?, color?, x?, y?, w? }` — edit a UML class box.
- `add_field { id, field }` / `add_method { id, method }` — append a row to a UML box.
- `connect { fromId, toId, text?, color?, dashed? }` — add an arrow.
- `move_container { id, x?, y?, dx?, dy? }` — move a container and its contents together.
- `delete_shapes { ids }` — remove shapes.
- `clear_board` — wipe the active board (destructive — confirm with the user first).
- `apply_ops { ops }` — batch many edits atomically in one call.

## Layout cleanup

- After moving or deleting shapes, run `space_board` / `space_container` to
  re-tidy spacing, then `reflow_labels` to reposition arrow labels.
- Use `check_overlap` to confirm the result is clean.
