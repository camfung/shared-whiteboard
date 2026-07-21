# Dependency / Call Graph — how to make it good

> Read `diagram-base.md` first (short labels, atomic `apply_ops`, no `create_text` for labels,
> `check_overlap` is not a quality signal). This guide adds the type-specific layout.

## When to use (input signature)
- Entities linked by **directed relationships**: "depends on", "calls", "imports", "requires",
  "extends", "publishes to". Nodes = modules / packages / classes / functions / services.
- A **DAG or near-DAG** (mostly acyclic; a few back-edges tolerated, handled specially).
- **Fan-out / fan-in present**: one node points to many; many point to one. Convergence/divergence is the point.
- **Tell it apart from a sequence/flow:** flow = a single ordered path, read start→end, one successor
  each. Graph = branching AND converging edges, no single spine, no time axis. Heuristic: edges ÷ nodes
  near 1.0 and linear → flow; well above 1.0 with shared parents/children → graph, use this guide.

## Canonical layout — layered (Sugiyama / Graphviz `dot`)
- Nodes in parallel **layers (ranks)**; every dependency edge points **one consistent direction** —
  pick **top→bottom** (root/caller on top, most-depended-on at the bottom) or left→right. Top→bottom is
  the default and reads best on a tall canvas.
- **Why consistency is the biggest win:** when every arrow points the same way, "A is above B" *means*
  "A depends on B" at a glance — the reader decodes the relation from position alone. Mixed directions
  force tracing every arrow. Emulate the layered method by hand with the recipe below.

## Rules, ordered by impact

1. **Consistent edge direction (highest).** ONE global direction for "depends on"; every edge obeys.
   Down = "needs what's below." The only upward/back arrows are explicitly-marked cycle edges (Rule 5).
2. **Layer/rank assignment.** Reverse-mark cycle edges first (Rule 5) so ranking runs on a DAG.
   **Longest-path ranking:** a **source** (nothing depends on it) → layer 0 (top). For every other node,
   `layer(n) = 1 + max(layer(p))` over predecessors `p`, computed in topological order. The most-depended-on
   **sinks** fall to the bottom. Ties share a row.
3. **Within-layer ordering to cut crossings (hand-executable barycenter sweep):**
   1. Fix layer 0's left-to-right order (input order is fine).
   2. **Down-pass:** each next-layer node gets key = **average index of its already-placed parents above**; sort by key.
   3. **Up-pass:** sweep back up, keying by average index of children below.
   4. Repeat 2–4 sweeps or until stable; keep the best ordering. Optional: swap adjacent pairs if it cuts crossings.
   - **Before ranking, transitive-reduce:** if A→B, B→C, and A→C all exist, drop the implied A→C. Cuts clutter dramatically, changes nothing.
4. **Coordinates & spacing (~1600×1000).** **Y:** `y = 80 + layer*200` (shrink to ≥130 if >6 layers).
   **X:** spread each ordered layer centered across ~1500px (`x_i = 50 + (1500/k)*(i+0.5)`), then nudge each
   node toward the **average x of its parents** (pulls edges vertical), keeping **≥180px center-to-center**.
   ≥60px vertical gap box-to-box; ≥40px horizontal; ≤6–10 nodes per row.
5. **Edge routing & cycles.** Adjacent-layer edges: straight, parent-bottom → child-top. **Long edges**
   (span >1 layer): route through a reserved x-lane / bend them so they travel near-vertical beside nodes,
   never diagonally through a rank. **Cycle/back-edges:** draw in true direction but **dashed** + distinct
   colour (they point against flow — that's the signal). Don't route edges through boxes; one clean crossing is fine.
6. **Labels (short — boxes bloat to fit).** Use the **leaf name**, not the full path (`AuthService`, not
   `com.acme.security.internal.AuthService`). ≤~18 chars / 2–3 words. Encode namespace/package with
   **colour or row grouping**, not text. Label edges only when the relation *type* varies.
7. **Emphasis.** Highlight the **most-depended-on node** (highest in-degree, the bottom hub) — heavier
   border / fill / slightly larger. Distinguish roots (entry points) from leaves (foundational). Colour by
   subsystem (≤5 hues) as an accent; position + direction carry the meaning.

## Do / Don't
- **Do** point every dependency the same way; rank by longest-path; run 2–4 barycenter sweeps; transitively
  reduce; pull nodes toward parents' average x; shorten labels to leaf names; emphasize the hub; dash back-edges.
- **Don't** mix edge directions; overlap boxes or run edges through them; put full paths in boxes; obsess
  over eliminating every crossing at the cost of huge spacing; cram >~10 nodes in a row; colour every node
  differently; label edges when all mean the same thing; route a long edge diagonally across nodes.

## Realize it on the whiteboard (the hand-layout algorithm)
1. **Parse** nodes + directed edges. Global direction = top→bottom (down = depends on).
2. **Break cycles:** reverse-mark one edge per cycle (remember for dashed rendering).
3. **Transitive reduction:** delete any A→C implied by a longer A→…→C.
4. **Rank:** sources → layer 0; `layer(n) = 1 + max(layer of predecessors)` in topological order.
5. **Order within layers:** barycenter down/up sweeps ×2–4; keep fewest crossings.
6. **Y:** `y = 80 + layer*200`. **X:** spread centered, then nudge toward parents' avg x, ≥180px gaps.
7. **Place boxes** (short labels), emphasize hub + entry points.
8. **Draw edges** parent-bottom → child-top; long edges in a lane; cycle edges dashed. Build it all in one `apply_ops`.

**Worked micro-example — a diamond:** `App→Auth`, `App→Cache`, `Auth→DB`, `Cache→DB` (down = depends on).
- Ranks: `App` = source → layer 0. `Auth`,`Cache` → layer 1. `DB` (sink, highest in-degree) → layer 2.
- Order layer 1: no crossing either way → `[Auth, Cache]`.

| Node | layer | x | y | note |
|---|---|---|---|---|
| `App` | 0 | 760 | 80 | entry point (accent) |
| `Auth` | 1 | 560 | 280 | |
| `Cache` | 1 | 960 | 280 | |
| `DB` | 2 | 760 | 480 | hub — heavy border/fill |

- `App` fans out, `DB` fans in centered below both → symmetric, **zero crossings**; `DB` emphasized.
  (If `App→DB` also existed, transitive reduction would delete it — implied by App→Auth→DB.)

## Sources
- Layered graph drawing — https://en.wikipedia.org/wiki/Layered_graph_drawing
- The Sugiyama method — https://blog.disy.net/sugiyama-method/
- Graphviz `dot` layout — https://graphviz.org/docs/layouts/dot/
- Drawing graphs with dot (GKNV) — https://www.graphviz.org/pdf/dotguide.pdf
- Efficient Sugiyama implementation (barycenter/median sweep) — https://link.springer.com/chapter/10.1007/978-3-540-31843-9_17
- Bounds on the barycenter heuristic — https://www.sciencedirect.com/science/article/abs/pii/S0020019001002976
- Dependency graph visualization (crossings, layered, colour, transitive reduction) — https://blog.tomsawyer.com/dependency-graph-visualization
