# Sequence / Flow — how to make it good

> Read `diagram-base.md` first (short labels, atomic `apply_ops`, no `create_text` for labels,
> `check_overlap` is not a quality signal). This guide adds the type-specific layout.

## When to use (input signature)
- **The content is ORDERED IN TIME.** If you can number it 1-2-3, it's a flow/sequence.
- **Flowchart / process flow** — one thread of control through steps and decisions: "do A, if X
  then B else C, then D." Pipelines (stage → stage), request/response as a single path, boot sequences.
- **Swimlane flowchart** — same, but steps are OWNED by different roles/systems and you must show handoffs.
- **UML sequence diagram** — MESSAGE EXCHANGE between 2+ persistent actors over time: API
  conversations, protocols, sagas. Participants live for the whole diagram; the arrows are the events.
- **Distinguish from a dependency graph:** a dep graph answers "what connects to what" (node order
  is meaningless, edges are static, cycles are normal). A flow answers "what happens, in what order"
  (reordering breaks meaning, edges are transitions, it's largely acyclic with a start and end). If
  removing arrow direction destroys the meaning → it's a flow, not a dep graph.
- Pick **sequence** when the interaction between actors is the point; **flowchart** when the branching
  logic of one process is the point; add **swimlanes** when ownership/handoff is the point.

## Canonical layout
- **Flowchart — ranked / layered (Sugiyama-style, what Graphviz `dot` produces).** Single dominant
  direction: **top-to-bottom** (or left-to-right), never mixed. Every step on a rank/row; edges all
  point the same way — a consistent flow axis is the biggest readability lever. One **Start** terminal
  (ellipse) at top, one **End** at bottom. The **happy path is a straight vertical spine**; branches
  peel off sideways and rejoin. Decisions = diamonds; I/O = rhombus/trapezoid; actions = rectangles.
- **Swimlane — ranked flow crossed with ownership bands.** Vertical lanes (columns), flow top-to-bottom
  is the technical convention. A step lives in its owner's lane; **cross-lane arrows are the handoffs**
  (the most important marks).
- **UML sequence — lifelines.** Participants across the TOP as header boxes, none overlapping, a
  **dashed vertical lifeline** dropping from each. **Time runs strictly top-to-bottom.** Messages are
  horizontal arrows: **solid = synchronous call, dashed = return/reply**. Order left-to-right with the
  **initiator leftmost** so most arrows flow rightward-then-back.

## Rules, ordered by impact

1. **Direction & reading order (highest).** One axis, never violated. Flowchart top→bottom; sequence
   participants left→right, time top→bottom. Any backward arrow (loop/retry/return) must be visually
   distinct (dashed). Entry top-left, exit bottom.
2. **Alignment.** Snap to a grid. Share one x for all boxes on the vertical spine; share one y for all
   boxes on a rank. Misalignment reads as "different kinds of thing." Cap participants: **3–5 lifelines**,
   **3–7 swimlanes**.
3. **Spacing (~1600×1000, 80px margins → ~1440×840 usable).**
   - Flowchart (vertical): box height ~60; **vertical pitch ~120** → 7 ranks at y = 100, 220, …, 820.
     Spine x ≈ 560; branch/error column x ≈ 1080; rejoins share the spine x.
   - Sequence: header boxes y ≈ 60. Lifelines evenly spaced: `x_i = 200 + i*(1200/(M-1))` → 4 actors at
     200, 600, 1000, 1400. Message slot ~60px: `y_k = 160 + k*60` → ~11 messages before the bottom.
   - Keep ≥40px gutter between any box edge and the next box/arrow.
4. **Routing & crossings.** Prefer orthogonal (right-angle) routing. Design crossings out by reordering
   (put frequent talkers adjacent; place a branch's target on the side it exits). If unavoidable, cross
   at 90°. Never route an arrow *through* a box.
5. **Labels (keep short — boxes bloat wide to fit).** Node labels: **verb + object, 1–4 words**
   ("Validate invoice", not "The system validates the submitted invoice"). Decisions: a short
   question ("Funds OK?"); **label every exit arrow** ("Yes"/"No"). Sequence messages: method-style,
   verb-first ("getBalance()", "ACK"), just above the arrow. Label an edge only when it carries info.
   Overflow → move detail into a **`create_note`** beside the box (never `create_text`).
6. **Emphasis.** Start/End get the terminal ellipse + distinct fill. **Happy path = straight, solid,
   dominant spine; error/alternate branches = dashed, peeled to the side.** ≤3 hues, colour redundant
   with shape/position. Sequence: box an `alt`/`loop` fragment or shade a phase band to chunk.

## Do / Don't
- **Do** commit to one axis and one grid; make the happy path a straight solid spine; label every
  decision branch; cap it (≤5 lifelines, ≤7 lanes, ≤~15–20 flow shapes); order participants to put
  frequent talkers adjacent; use solid vs dashed for normal vs exception.
- **Don't** mix top-down and left-right; write sentences in boxes; let arrows cross shallow or pass
  through boxes; exceed ~3 colours; cram one giant diagram (split past ~20 shapes); use generic names
  ("Step 2", "Process").

## Realize it on the whiteboard

**A. Flowchart (N steps, vertical)**
1. Linearize input into an ordered step list; tag each action / decision / I/O / terminal; find the ONE happy path.
2. Spine x = 560. **Start** ellipse at (560, 100).
3. Step k on the happy path: box at **y = 220 + k*120**, x = 560; solid arrow from previous box's bottom to this top.
4. Labels ≤4 words. Long detail → a **`create_note`** at x ≈ 900 (same y).
5. **Decision:** diamond at spine x. "Yes" continues straight down (solid, labeled). "No"/error exits the
   diamond's RIGHT → box at (1080, sameY) (dashed, labeled); route back orthogonally to the next spine box to rejoin.
6. **End** ellipse one pitch below the last step. Distinct fills for Start/End/error.
7. Past ~7 ranks / 20 shapes: cut at a clean boundary, end with "→ cont. in Diagram 2".

**B. Swimlane:** M vertical lane rectangles as columns, `laneWidth = 1440/M`, header at top of each. Each
step in its owner's lane at its time-rank y. Cross-lane arrows = handoffs (solid, prominent).

**C. UML sequence (M actors, K messages)**
1. Order actors left→right, initiator leftmost; frequent partners adjacent; cap 5.
2. Header boxes at y=60, `x_i = 200 + i*(1200/(M-1))`; drop a **dashed** lifeline from each to ~y=880.
3. Message k: y = 160 + k*60; horizontal arrow sender→receiver. **Solid = call, dashed = return.** Label above, ≤3 words.
4. Self-message: small arrow that leaves the lifeline, drops ~30px, returns; label to the right.
5. Conditional/loop: a labeled container rectangle (`alt [cond]` / `loop [n]`) around the governed messages.
6. K > ~11: split the scenario into two diagrams.

**Label-clip/bloat safeguard (all types):** before finalizing, check each label; if > ~24 chars, shorten
to verb+object or offload to an adjacent `create_note`, or pin a uniform `w` so it wraps.

## Sources
- UML sequence notation & conventions — https://www.uml-diagrams.org/sequence-diagrams.html
- Sequence best practices (3–5 participants, chronological order, activation) — https://zenuml.com/blog/2024/02/12/2024/best-practices-for-effective-sequence-diagrams/
- Sequence tutorials — https://creately.com/guides/sequence-diagram-tutorial/ , https://www.lucidchart.com/pages/uml-sequence-diagram
- ISO 5807 / ANSI flowchart symbols — https://www.iso.org/standard/11955.html , https://www.useworkspace.dk/en/blog/iso-5807-flowchart-symbols-guide
- Flowchart layout rules — https://graphmake.com/blog/flowchart-best-practices , https://creately.com/guides/flowchart-rules/
- Process-flow design — https://www.conceptdraw.com/How-To-Guide/flowchart-design , https://community.lucid.co/inspiration-5/best-practices-for-flowchart-design-6250
- Swimlane best practices — https://www.lucidchart.com/pages/tutorial/swimlane-diagram , https://miro.com/diagramming/what-is-a-swimlane-diagram/
- Graphviz `dot` ranked/layered layout — https://graphviz.org/docs/layouts/dot/ , https://www.graphviz.org/pdf/dotguide.pdf
- Gestalt principles — https://emeeks.github.io/gestaltdataviz/section2.html
- Tufte data-ink / chartjunk — https://www.data-action-lab.com/wp-content/uploads/2021/05/ACFO-DV-4.pdf
