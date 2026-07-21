# Hierarchy / Layers — how to make it good

> Read `diagram-base.md` first (short labels, atomic `apply_ops`, no `create_text` for labels,
> `check_overlap` is not a quality signal). This guide adds the type-specific layout.

## When to use (input signature)
- **Strictly hierarchical:** every child has **exactly one parent**, edges are **is-a / part-of /
  reports-to / contained-in**, **no cross-links or cycles**.
- Maps here: taxonomies, org/reporting charts, file/package trees, ranked strata (tech stacks, OSI,
  layered architecture), enclosure (Clean/onion/hexagonal rings, module-contains-package).
- **Pick the sub-variant by the input's shape:**
  - **(a) Top-down TREE** — branching parent→child identity matters, depth ≤ ~4, leaves ≤ ~12. Reporting lines, taxonomies.
  - **(b) Horizontal LAYER bands** — a flat partition into a few ordered ranks; items within a rank are
    peers; "above/below" + flow across a boundary is the message. 3–6 layers. Tech stacks, n-tier, OSI.
  - **(c) Concentric RINGS / nested containment** — **enclosure** is the semantic: "inside" = more
    central / more depended-upon (rings), or pure part-of. Clean/onion architecture, modules-contain-packages.
- **Tell it apart from a graph:** hierarchy = tree or clean containment, single parent, acyclic, no
  cross-edges. The moment there are arbitrary cross-edges, multiple parents, or cycles → it's a **graph**;
  use the dependency guide. Don't force a graph into a tree.

## Canonical layout, per sub-variant
- **(a) Tree — Reingold–Tilford "tidy tree."** Four aesthetics: same-depth nodes on one horizontal line;
  children left-to-right in input order; **parent centered over its children**; identical subtrees drawn identically.
- **(b) Layer bands — n-tier strata.** Full-width stacked bands, **most-abstract on top**, each lower layer
  a dependency of the one above (Presentation → Business/Domain → Data → Infrastructure).
- **(c) Rings / nesting — Clean Architecture + Shneiderman enclosure.** Center = most abstract / most
  depended-upon; **dependencies point inward only**. Outer→inner: Frameworks & Drivers → Interface
  Adapters → Use Cases → Entities.

## Rules, ordered by impact
1. **Choose the right sub-variant.** Flat partition into ranks → bands. Branching identity → tree.
   Enclosure / center-is-most-important → rings/nesting. A "tree" wider than ~12 leaves or ~4 deep →
   **rotate to left-to-right** (root at left, depth = columns).
2. **Direction, root, sibling order.** Tree root top-center (or far-left if rotated); bands top = top of
   hierarchy; rings root = center. **Order siblings meaningfully and keep that order everywhere**;
   same-depth nodes align on one axis line. State dependency direction once with a single labeled arrow,
   not one on every edge.
3. **Spacing & symmetry (~1600×1000).** Box height 56–64. Tree **row pitch 160–200**; **leaf slot pitch
   180–220** (must exceed the widest label — raise it or rotate if labels are long). ≥40px between siblings,
   ≥60px between a connector and an unrelated box. **Symmetry by hand:** place **leaves first** at even
   pitch, then set each parent `x = mean(children x)` bottom-up.
4. **Containment/nesting OR tree connectors.** **Nesting:** inset each level by a **uniform 70–100px** all
   sides; internal padding 24–40px; ≥20px between children; inset ≥ (label height + one child box) so the
   header never collides. **Rings:** concentric rectangles sharing a center; label at each ring's
   **top-inside edge** (inner rings cover the middle). **Tree connectors:** orthogonal elbows via a shared
   **horizontal spine** at the mid-gap y (org-chart "shoulder" bus) — eliminates crossings; never diagonals.
5. **Labels (short — boxes bloat to fit).** Cap at **2–3 words / ~20 chars**, nouns only. Detail →
   a small **`create_note`** below the box, never inside the label (it bloats the row and breaks alignment).
   Keep labels roughly equal length within a depth so slot pitch stays uniform.
6. **Emphasis.** Root (tree) / top band / center-or-outermost ring gets a bolder border and/or one step
   darker fill — one emphasized element only. Encode **depth with a monotonic colour ramp** (≤4 levels).
   Only the root may be larger; all other same-level boxes stay the same size.

## Do / Don't
- **Do** center every parent over its children; align same-depth nodes on one line; keep box size uniform
  within a level; use orthogonal elbow connectors via a shared spine; keep labels 2–3 words; uniform nesting
  insets with top-edge ring labels; state dependency direction once; rotate a wide tree to L-R.
- **Don't** left-align parents over child groups (looks lopsided); let depth nodes drift off their line;
  size boxes by importance mid-tree; use diagonal connectors or let edges cross; put sentences in a box;
  center a label where an inner box covers it; arrow every edge; cram >12 leaves into 1600px; add
  cross-links (if the data has them, it's a graph — switch types).

## Realize it on the whiteboard

**(a) Top-down tree**
1. Assign each depth a y: `y_d = 100 + d*180`.
2. Leaves left-to-right: `x_i = 300 + i*220`.
3. Bottom-up, each internal node `x = mean(children x)`.
4. Place boxes (h ~60); elbow connectors parent-bottom → spine at `y_parent + 90` → child-top.
- **Micro-example** — A→{B, C}, C→{D, E}. Leaves B=300, D=520, E=740. C=mean(520,740)=630. A=mean(300,630)=465.
  `A(465,100)` · `B(300,280)` `C(630,280)` · `D(520,460)` `E(740,460)`. Spines at y=190 (A→B,C) and y=370 (C→D,E).

**(b) Horizontal layer bands**
1. Side margin 40; band width `1520`, x=40.
2. N bands, height ~215, pitch 235: `y_L = 40 + L*235`. Top band = top layer.
3. Peer boxes in a row inside each band: `x = 80 + k*240`, vertically centered.
4. One downward labeled arrow at the left edge: "depends ↓".
- **Micro-example** — `Presentation(40,40,1520×215)`, `Domain(40,275,…)`, `Data(40,510,…)`; peer `Fare Rules(80,355)`.

**(c) Concentric rings / nested boxes**
1. Outer box, then inset each inner level by a uniform 100px (x,y) → concentric.
2. Label each ring top-inside (top-center). One inward arrow "depend inward."
- **Micro-example** — Clean Architecture, inset 100: `Frameworks & Drivers(300,120,1000×760)`,
  `Interface Adapters(400,220,800×560)`, `Use Cases(500,320,600×360)`, `Entities(600,420,400×160)` center.
- **Pure part-of nesting:** container with header at top, children below — `Module(300,150,500×300)`, header
  y≈165, `Pkg A(330,215)`, `Pkg B(330,295)`, 24px padding, 20px gap.

## Sources
- Reingold & Tilford, *Tidier Drawings of Trees* — https://reingold.co/tidier-drawings.pdf
- Walker / Reingold–Tilford node positioning (UNC TR89-034) — https://www.cs.unc.edu/techreports/89-034.pdf
- Reingold–Tilford explained — https://towardsdatascience.com/reingold-tilford-algorithm-explained-with-walkthrough-be5810e8ed93/
- SmartDraw — org-chart formatting rules (uniform box size, alignment) — https://www.smartdraw.com/organizational-chart/organizational-chart-rules.htm
- Creately — org-chart best practices — https://creately.com/guides/organizational-chart-best-practices/
- Robert C. Martin — The Clean Architecture (concentric rings, dependency-inward) — https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
- Hexagonal architecture — https://en.wikipedia.org/wiki/Hexagonal_architecture_(software)
- Johnson & Shneiderman — Tree-maps (enclosure/nesting) — https://www.cs.umd.edu/projects/hcil/treemap/tutorial.html
- Ontology visualization: node-link vs containment (Gestalt) — https://ceur-ws.org/Vol-529/owled2009_submission_9.pdf
- Layered architecture pattern (horizontal tiers) — https://priyalwalpita.medium.com/software-architecture-patterns-layered-architecture-a3b89b71a057
