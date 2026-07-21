# State Machine — how to make it good

> Read `diagram-base.md` first (short labels, atomic `apply_ops`, no `create_text` for labels,
> `check_overlap` is not a quality signal). This guide adds the type-specific layout.

## When to use (input signature)
- The system **occupies one named state at a time** and **moves between states on events**. Signals:
  - **Named states** (nouns/adjectives: `Idle`, `Authenticating`, `Dispensing`, `Faulted`).
  - **Events/triggers** that cause moves (`cardInserted`, `timeout`, `pinOk`).
  - Exactly **one initial state**; zero or more **terminal states**. Optional **guards** (`[balance > 0]`)
    and **actions** (`/ ejectCard`). **Cycles** and **self-transitions**.
- **Tell it apart from a sequence/flow:** flow = acyclic, time-ordered, each box runs once. State
  machine = cyclic + event-driven; a box is a *condition the system rests in* until an event fires;
  the same state re-enters many times. Retry loops / "return to idle" / "on error go back to X" → state
  machine. No cycles and no named events on edges → use the flow guide instead.

## Canonical layout
- **Convention: initial top-left, final bottom-right, flow with the reading direction** (UML style).
- **Initial marker:** a small **solid/dark filled ellipse** (~36–44px, no label), one arrow out to the
  first real state. **Terminal marker:** a small **ellipse with a ring/dot** (bullseye), arrows in only.
- **Overall direction — pick by cycle structure (Rule 2).** Place states so the **dominant (happy-path)
  transitions all point the same way**; route **back-edges and error edges in a separate lane** so they
  never overlap forward arrows.

## Rules, ordered by impact

1. **Initial/terminal placement & markers.** Exactly one initial marker, top-left, small filled dark
   ellipse, single arrow out — never a rectangle, never labeled. Terminal bullseye at the natural sink.
   Every state reachable from initial; every non-terminal state has an exit (flag black-hole / miracle
   states — they're input errors).
2. **Direction & arrangement — choose by cycle shape.**
   - **One dominant happy loop** (`Idle→Selecting→Paying→Dispensing→Idle`): **racetrack/oval** — states
     clockwise around an oval; the closing back-edge is the last arc → zero crossings. Best default for
     kiosk/transaction machines.
   - **Mostly linear with a few retries/aborts** (wizard, boot): **left-to-right row**; forward edges
     along the row, back-edges bowed in a lane below.
   - **Hub-and-spoke** (many states return to one `Idle`): hub center/center-left, spokes radiating,
     returns along the outside.
   - Top-down only for a natural downward escalation; else prefer horizontal (wide canvas).
3. **Spacing (~1600×1000, 80px margins).** State box height ~60; width auto-fits — budget 120–200px,
   keep labels short. **Horizontal center-to-center ≥ 240px** (~5–6 states/row); **vertical ≥ 180px**.
   Reserve a **back-edge lane ~90px** clear on one side; **self-loop needs ~70px clear** (top preferred).
   Initial marker ~120px left of the first state; ≥40px between any two boxes.
4. **Transition routing, self-loops, back-edges.** **Solid = normal/happy; dashed = exceptional**
   (error/abort/timeout/reset) so the reader skips them first pass. Happy path = straight, same-direction,
   short edges (fewest crossings / shortest / straightest). Self-loop: small arc off the **same side**
   (top), label just outside. Back-edges: bow through the reserved lane so they arc *around* states
   (racetrack: the back-edge is the natural closing arc). Never stack two arrows on one path — offset ~20px.
5. **Labels — UML `event [guard] / action` on the arrow.** Events past-tense where natural
   (`cardInserted`). **State box labels tiny** (1–2 words, ≤~18 chars) — put verbose parts on the arrow.
   If an arrow label would be long, truncate to the event and move `[guard]/action` into a **numbered
   `create_note`** keyed `①` beside the arrow. Place labels near the source state.
6. **Emphasis.** ≤3 semantic hues: **green** = initial/entry, **red** = error/fault/terminal, neutral =
   normal. Make the happy cycle pop (heavier/accent arrows); keep error edges dashed and muted. Markers +
   dashes must read even in grayscale.
7. **Composite/nested states (only if present).** Large rounded container with children inside; label in
   a top-left tab; one inner initial marker; a transition to the container edge = "enter via inner
   initial". Collapse a busy sub-region into one composite rather than exploding 50 states.

## Do / Don't
- **Do** keep to one screenful (collapse or split past ~15–20 states); name states as nouns, events as
  verbs; make every state reachable with an exit; reserve a lane for back/error edges; use numbered notes
  for long guards.
- **Don't** put long text in state boxes; use a rectangle for initial/terminal markers; let happy-path
  and error edges cross; draw a self-loop for a no-op event; exceed 3 colours or rely on colour alone.

## Realize it on the whiteboard
1. **Classify the shape:** count cycles → one big return loop = racetrack; linear + retries = LR row;
   many-return-to-idle = hub-and-spoke. Pick the skeleton before placing anything.
2. **Initial marker:** small dark filled **ellipse** at ~(120, 120), no label.
3. **Lay the happy path:** states along the skeleton, center-to-center ≥ 240px, all forward arrows the
   same direction. Racetrack: distribute clockwise around an oval centered ~(760, 460). LR: row at y≈300,
   x = 200, 460, 720, …
4. **State labels 1–2 words** so boxes stay narrow.
5. **Forward transitions = solid**, labeled `event [guard] / action` near the source; long labels → `①`
   + a `create_note`.
6. **Back-edges** that close cycles: bow through the reserved lane (~90px below the row / outside the
   oval); reset/abort back-edges **dashed**.
7. **Self-loops:** short arc off the **top** (~70px clearance), label outside.
8. **Error/exception edges = dashed**, into a red `Faulted` state, routed in the error lane.
9. **Terminal marker(s):** bullseye ellipse at the sink (bottom-right for LR; off the loop for racetrack).
10. **Emphasis pass:** green initial, red error/terminal, accent the happy-cycle arrows; ≤3 hues.
11. **Crossing pass:** nudge a state ~40px or re-bow a back-edge to remove any crossing; confirm no label clips.
12. **Composite pass (if nested):** wrap sub-regions in a rounded container with a top-left tab and inner initial marker.

## Sources
- Agile Modeling — UML State Machine style guidelines — https://agilemodeling.com/style/statechartdiagram.htm
- uml-diagrams.org — State Machine notation (initial/final markers, `event [guard] / behavior`, composite) — https://www.uml-diagrams.org/state-machine-diagrams.html
- Mermaid — state diagram syntax (`[*]`, self-transition, composite, `direction`) — https://mermaid.js.org/syntax/stateDiagram.html
- David Harel — "Statecharts: A Visual Formalism" (hierarchy for complexity) — https://www.weizmann.ac.il/math/harel/sites/math.harel/files/users/user50/Statecharts.pdf
- GeeksforGeeks — UML State Diagrams (nouns/verbs, reachability, no black-hole/miracle, avoid spaghetti) — https://www.geeksforgeeks.org/system-design/unified-modeling-language-uml-state-diagrams/
- UW — Finite State Machine notes (self-loops, label arrows with events) — https://staff.washington.edu/jon/z/fsm.html
- Terrastruct — crossing minimization — https://terrastruct.com/blog/post/diagram-layout-engines-crossing-minimization/
- Gansner & Koren — Improved Circular Layouts (cyclic graphs) — https://graphviz.org/documentation/GK06.pdf
