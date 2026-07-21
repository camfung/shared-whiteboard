# Diagramming base rules — read this first

Applies to **every** structured diagram on this whiteboard. Read this, then read the ONE
type guide that matches your input:

- `diagram-sequence-flow.md` — flowcharts, process/pipeline flows, UML sequence diagrams
- `diagram-state-machine.md` — states + event transitions, cycles, self-loops
- `diagram-dependency-graph.md` — directed dependency / call graphs (DAGs)
- `diagram-hierarchy-layers.md` — trees, layer bands, concentric rings / nesting

## Step 1 — Classify the input into ONE type

Pick the single type whose structure dominates. Do not try to be everything at once.

| Input is mostly… | Type | Guide |
|---|---|---|
| Time-ordered steps, a pipeline, or messages between actors | Sequence / flow | `diagram-sequence-flow.md` |
| Named states with event-driven transitions, cycles, initial/terminal states | State machine | `diagram-state-machine.md` |
| Entities with directed `depends-on` / `calls` / `imports` edges (branching, converging) | Dependency / call graph | `diagram-dependency-graph.md` |
| Parent/child containment, is-a / part-of, ranked layers, nesting/rings | Hierarchy / layers | `diagram-hierarchy-layers.md` |

**Heterogeneous input** (several structures at once — common trap): pick the type of the
**dominant relationship** the reader most needs; demote the rest to short annotations or a
separate clearly-separated section. A rule/spec list with no relationships is usually a
**hierarchy** grouped by section, not a graph. Never force four structures into one shape soup.

## Step 2 — The three rules that decide consumability

These outrank layout choice. Every unreadable board in testing broke one of them.

### 1. Short labels / controlled box width (the #1 driver)
- A node box **auto-fits its size to the label**: width grows to the text on one line, height
  auto-fits (you cannot force height). Long labels therefore produce **very wide boxes that
  collide and break column alignment**.
- Keep node labels to **≤ ~5 words / ~24 chars**. Put detail in the diagram *structure*
  (position, grouping, edges), not in box text. If a concept needs a sentence, it is two nodes,
  or a node plus a short annotation — not one long box.
- When you want a clean grid of equal boxes, **pin a uniform width** (`create_node w: 180`): the
  text wraps to that width and the height grows automatically — no clipping, and every box aligns.

### 2. Few elements
- Aim for **7 ± 2 top-level nodes** in the primary view. Collapse detail into grouped nodes
  rather than emitting one box per input bullet. A 100-shape board reads as noise regardless of layout.

### 3. One direction, one entry point
- Commit to a single reading direction (top→down or left→right) and make the start obvious
  (top-left, top-center, or a marked entry). Avoid 2-D scatter with no reading order.

## Step 3 — Build reliably (whiteboard-specific hazards)

Learned the hard way; ignoring these produces empty or broken boards that still "pass" the checks.

### Write in ONE atomic batch
- Prefer a **single `apply_ops` transaction** that creates all nodes + connections at once; wire
  arrows with ref names inside the batch.
- **Do not** fire many separate one-shape CLI processes in rapid succession — the CLI returns the
  client-generated id *before* the write flushes, so bursts of independent creates can silently
  drop. If creating one at a time, wait for each call's result before the next.
- After building, re-read the board (`get_board` / `read board`) and **confirm the shape count
  matches** what you intended. An empty board is not a clean board.

### Never use `create_text` for titles or labels
- `text` shapes store an unmeasurable width (`w: 8`). Consequence: they **poison `check_overlap`**
  (each text is flagged against *every* other shape → dozens of phantom "overlapping pairs").
- For a title or standalone label, use a **no-fill `create_node` box** (`fill: none`). For a
  callout/annotation beside the diagram, use **`create_note`** (sticky notes carry a real width and
  are safe). Reserve `create_text` for throwaway scratch only.

### `check_overlap` / `read overlap` is not a quality signal
- It compares **box bounds only** — it cannot see how a diagram reads, and it mismeasures `text`
  shapes. A `verdict: clean` does **not** mean the diagram looks good. Use it only for "do two
  boxes physically collide." For real quality, keep labels short (rule 1) and sanity-check by eye.

### Auto-layout (`edit space` / `space_board`) is a nudge, not a solution
- The spacing engine can converge to a *stable bad* state on wide, unevenly-sized boxes (it will
  not fix a layout you didn't design). **Compute your own coordinates** per the type guide; use
  `reflow_labels` at the end to settle edge labels, and `space_board` only for a final gentle tidy.

## Step 4 — Colour & emphasis (light touch)
- Colour to encode **meaning** (category, layer, group), not decoration. Cap at **~5 colours**.
  Available: `black, grey, blue, green, red, orange, violet, light-blue, yellow, light-green,
  light-red, light-violet`.
- Use one accent to mark what matters (entry point, error/terminal, the most-depended-on node).
- Add a small **legend** node only when the encoding is non-trivial; a 5-node diagram needs none.

## Step 5 — Finish
- Run `reflow_labels` (`edit reflow`) so edge labels settle.
- Re-read the board and verify: intended shape count present, no box bloated so wide it collides,
  one clear reading direction. Fix by shortening labels / pinning width — not by adding shapes.
