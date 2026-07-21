// MCP server for the Shared Whiteboard.
//
// Thin stdio proxy over the sync backend's HTTP API. Holds a per-session
// "current board": open_board / create_board set it, and every edit tool targets
// it. Because all sessions hit the same backend (WB_URL), boards are shared —
// open the same board in two sessions (or in the web UI) and you co-edit it live.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = process.env.WB_URL || 'http://127.0.0.1:5858'
const DIR = path.dirname(fileURLToPath(import.meta.url))
// The backend entry sits beside us: server.cjs in a built plugin bundle, else
// the server.js source in dev.
const SERVER_ENTRY = ['server.cjs', 'server.js']
  .map((f) => path.join(DIR, f))
  .find((f) => fs.existsSync(f))

// The sync backend (server.js) holds the boards and serves the web UI. When this
// MCP server runs standalone (e.g. installed as a Claude Code plugin) there may
// be no backend up yet. Reuse one if it's already healthy, otherwise spawn it as
// a DETACHED child — never in-process: server.js logs to stdout, which would
// corrupt this process's stdio JSON-RPC stream. stdio:'ignore' keeps its output
// off our channel. The child outlives us so a browser stays connected between
// MCP sessions; the next session reuses it via the health check.
async function healthy() {
  try { return (await fetch(`${BASE}/health`)).ok } catch { return false }
}
async function ensureBackend() {
  if (process.env.WB_URL) return // caller pointed us at an external backend; don't manage it
  if (await healthy()) return
  if (!SERVER_ENTRY) throw new Error('whiteboard backend entry (server.cjs/server.js) not found next to mcp-server')
  spawn(process.execPath, [SERVER_ENTRY], {
    cwd: DIR, stdio: 'ignore', detached: true, env: process.env,
  }).unref()
  for (let i = 0; i < 100; i++) {
    if (await healthy()) return
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error(`whiteboard backend failed to start on ${BASE}`)
}

let current = null // { id, name }

async function api(path, method = 'GET', body) {
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (e) {
    throw new Error(`whiteboard backend unreachable at ${BASE} (is the sync server running?): ${e.message}`)
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

async function requireBoard() {
  if (current?.id) return current.id
  const { boards } = await api('/boards')
  const names = boards.map((b) => `"${b.name}"`).join(', ') || '(none — use create_board)'
  throw new Error(`No board open. Use open_board or create_board first. Available: ${names}`)
}

// board-scoped call: appends ?board=<current>
async function bapi(path, method, body) {
  const id = await requireBoard()
  const sep = path.includes('?') ? '&' : '?'
  return api(`${path}${sep}board=${encodeURIComponent(id)}`, method, body)
}

// Build a read query-string from tool args (board= is appended later by bapi).
function qs(a = {}) {
  const p = new URLSearchParams()
  if (a.since != null) p.set('since', String(a.since))
  if (a.type) p.set('type', a.type)
  if (a.color) p.set('color', a.color)
  if (a.text) p.set('text', a.text)
  if (Array.isArray(a.ids) && a.ids.length) p.set('ids', a.ids.join(','))
  if (a.hops != null) p.set('hops', String(a.hops))
  if (a.fields) p.set('fields', a.fields)
  const s = p.toString()
  return s ? `?${s}` : ''
}

const ok = (obj) => ({ content: [{ type: 'text', text: JSON.stringify(obj) }] })
const wrap = (fn) => async (args) => {
  try { return ok(await fn(args || {})) } catch (e) { return { isError: true, content: [{ type: 'text', text: String(e.message || e) }] } }
}

const COLORS = 'black, grey, light-violet, violet, blue, light-blue, yellow, orange, green, light-green, light-red, red'
const GEOS = 'rectangle, ellipse, diamond, triangle, hexagon, cloud, star, oval, pentagon, octagon, rhombus, trapezoid, x-box, check-box, heart'
const FILLS = 'none, semi, solid, pattern'

const server = new McpServer({ name: 'shared-whiteboard', version: '0.2.0' })

// ---- boards ----
server.registerTool('list_boards', {
  description: 'List all whiteboards (name, id, shape count, last updated). The name is what you open by.',
  inputSchema: {},
}, wrap(() => api('/boards')))

server.registerTool('open_board', {
  description: 'Open a board by name (or id) and make it the active board for this session. Returns the board contents. All create/edit tools act on the open board. If several boards share a name, returns the matches without opening.',
  inputSchema: { name: z.string().describe('board name (as shown in the web UI) or id') },
}, wrap(async ({ name }) => {
  const { matches } = await api(`/boards/find?q=${encodeURIComponent(name)}`)
  if (matches.length === 0) {
    const { boards } = await api('/boards')
    throw new Error(`no board named "${name}". Available: ${boards.map((b) => b.name).join(', ') || '(none)'}. Use create_board to make one.`)
  }
  if (matches.length > 1) return { ambiguous: matches, note: 'multiple boards share this name — open by id' }
  current = matches[0]
  const board = await api(`/board?board=${encodeURIComponent(current.id)}`)
  return { opened: current, ...board }
}))

server.registerTool('create_board', {
  description: 'Create a new board with the given name, open it, and make it active. Returns its id.',
  inputSchema: { name: z.string().describe('human-readable board name') },
}, wrap(async ({ name }) => {
  current = await api('/boards', 'POST', { name })
  return { created: current }
}))

server.registerTool('rename_board', {
  description: 'Rename the active board (or a board by id). The id stays the same.',
  inputSchema: { name: z.string(), id: z.string().optional() },
}, wrap(async ({ name, id }) => {
  const target = id || (await requireBoard())
  const r = await api('/boards/rename', 'POST', { id: target, name })
  if (current && current.id === target) current = r
  return { renamed: r }
}))

server.registerTool('delete_board', {
  description: 'Delete a board by name or id (permanent). If it was the active board, clears the active selection.',
  inputSchema: { name: z.string().describe('board name or id') },
}, wrap(async ({ name }) => {
  const { matches } = await api(`/boards/find?q=${encodeURIComponent(name)}`)
  if (matches.length !== 1) throw new Error(matches.length ? 'ambiguous name — delete by id' : `no board "${name}"`)
  await api('/boards/delete', 'POST', { id: matches[0].id })
  if (current && current.id === matches[0].id) current = null
  return { deleted: matches[0] }
}))

// ---- document (act on the active board) ----
server.registerTool('get_board', {
  description: 'Read the active board: every shape (id, type, position, size, color, text) and arrow links, plus the board "clock". To poll the human\'s edits cheaply, keep the clock and pass it back as `since` — you then get ONLY shapes changed after it plus ids deleted since (not the whole board). Narrow with type/color/text/ids. On a big board prefer list_shapes (a cheap index) then get_shapes/get_neighbors.',
  inputSchema: {
    since: z.number().optional().describe('a clock from a previous read; returns only shapes changed after it + deleted ids'),
    type: z.string().optional().describe('only this type: geo | uml | note | text | arrow'),
    color: z.string().optional().describe('only shapes of this color'),
    text: z.string().optional().describe('only shapes whose text/label contains this (case-insensitive)'),
    ids: z.array(z.string()).optional().describe('only these shape ids'),
  },
}, wrap((a) => bapi(`/board${qs(a)}`)))

server.registerTool('list_shapes', {
  description: 'Compact INDEX of the active board — one line per shape { id, type, label } (label = text or UML name, truncated) plus arrow links. Much cheaper than get_board on a large board: use it to map what exists, then pull full detail on just the ids you need with get_shapes or get_neighbors. Filter with type/color/text.',
  inputSchema: {
    type: z.string().optional(), color: z.string().optional(), text: z.string().optional(),
  },
}, wrap((a) => bapi(`/shapes${qs({ ...a, fields: 'index' })}`)))

server.registerTool('get_shapes', {
  description: 'Full detail (id, type, position, size, color, text, links) for specific shapes on the active board. Pass ids (e.g. from list_shapes), or a type/color/text filter to pull every match. Use to zoom into a few shapes without reading the whole board.',
  inputSchema: {
    ids: z.array(z.string()).optional().describe('shape ids to fetch'),
    type: z.string().optional(), color: z.string().optional(), text: z.string().optional(),
  },
}, wrap((a) => bapi(`/shapes${qs({ ...a, fields: 'full' })}`)))

server.registerTool('get_neighbors', {
  description: 'Graph neighborhood of one or more shapes: the seeds plus everything connected to them by arrows out to `hops` links (default 1), with the connecting arrows, full detail. Explore outward from a node without loading the whole board.',
  inputSchema: {
    ids: z.array(z.string()).describe('seed shape ids'),
    hops: z.number().optional().describe('arrow-links to expand outward (default 1)'),
  },
}, wrap((a) => bapi(`/neighbors${qs(a)}`)))

server.registerTool('check_overlap', {
  description: 'Deterministic layout-quality check for the active board. Returns overlapRatio (bad-overlap area ÷ total node area — a scalar; ~0 = clean), overlappingPairs, verdict (clean|minor|bad), worstPair, and topOffenders (shape ids with the most overlap). Container↔child nesting is intentional and NOT counted. Use it to decide whether to rearrange (move/space/reflow) and to verify the result afterward.',
  inputSchema: {},
}, wrap(() => bapi('/overlap')))

server.registerTool('create_node', {
  description: `Create a labeled box/shape on the active board. The box auto-sizes to fit its text (pass w only to force a width). Returns its id. Colors: ${COLORS}. Shapes: ${GEOS}. Fills: ${FILLS}.`,
  inputSchema: {
    text: z.string(), x: z.number(), y: z.number(),
    w: z.number().optional().describe('width; omit to auto-fit text'),
    shape: z.string().optional().describe('geo shape, default rectangle'),
    color: z.string().optional(), fill: z.string().optional(),
  },
}, wrap((a) => bapi('/node', 'POST', a)))

server.registerTool('create_text', {
  description: `Create free-standing text on the active board. Returns its id. Colors: ${COLORS}.`,
  inputSchema: { text: z.string(), x: z.number(), y: z.number(), color: z.string().optional(), size: z.string().optional().describe('s, m, l, xl') },
}, wrap((a) => bapi('/text', 'POST', a)))

server.registerTool('create_note', {
  description: `Create a sticky note on the active board. Returns its id. Colors: ${COLORS} (default yellow).`,
  inputSchema: { text: z.string(), x: z.number(), y: z.number(), color: z.string().optional() },
}, wrap((a) => bapi('/note', 'POST', a)))

server.registerTool('create_uml', {
  description: `Create a UML class block on the active board: a title bar + fields compartment + methods compartment. Returns its id. Colors: ${COLORS}. Convention: prefix members with + (public), - (private), # (protected), e.g. "+ id: string", "+ login(): void".`,
  inputSchema: {
    name: z.string().describe('class/interface name (title bar)'),
    x: z.number(), y: z.number(),
    fields: z.array(z.string()).optional().describe('attribute rows, e.g. ["+ id: string"]'),
    methods: z.array(z.string()).optional().describe('method rows, e.g. ["+ save(): void"]'),
    color: z.string().optional(),
  },
}, wrap((a) => bapi('/uml', 'POST', a)))

server.registerTool('update_uml', {
  description: 'Update a UML block by id. Pass name/fields/methods/color to replace them (fields/methods replace the whole list). The block auto-resizes to fit its rows (width + height) unless you pass an explicit w. Also moves via x,y.',
  inputSchema: {
    id: z.string(),
    name: z.string().optional(),
    fields: z.array(z.string()).optional(),
    methods: z.array(z.string()).optional(),
    color: z.string().optional(),
    x: z.number().optional(), y: z.number().optional(), w: z.number().optional(),
  },
}, wrap((a) => bapi('/update', 'POST', a)))

server.registerTool('add_field', {
  description: 'Append one field row to a UML block (auto-grows its height).',
  inputSchema: { id: z.string(), field: z.string() },
}, wrap((a) => bapi('/uml/add', 'POST', a)))

server.registerTool('add_method', {
  description: 'Append one method row to a UML block (auto-grows its height).',
  inputSchema: { id: z.string(), method: z.string() },
}, wrap((a) => bapi('/uml/add', 'POST', a)))

server.registerTool('connect', {
  description: 'Draw an arrow between two existing shapes on the active board. Optional label/color/dashed. The arrow follows the shapes when moved.',
  inputSchema: { fromId: z.string(), toId: z.string(), text: z.string().optional(), color: z.string().optional(), dashed: z.boolean().optional() },
}, wrap((a) => bapi('/connect', 'POST', a)))

server.registerTool('update_node', {
  description: 'Update a shape on the active board by id: text, position (x,y), width (w), color, fill. Pass only fields to change. Boxes always auto-fit their height to the text (wrapped at w if you set one).',
  inputSchema: {
    id: z.string(), text: z.string().optional(),
    x: z.number().optional(), y: z.number().optional(),
    w: z.number().optional(),
    color: z.string().optional(), fill: z.string().optional(),
  },
}, wrap((a) => bapi('/update', 'POST', a)))

server.registerTool('move_container', {
  description: 'Move a container box AND every node inside it together (like grabbing the frame in the UI). Pass an absolute target for the container top-left (x,y) OR a relative delta (dx,dy). Arrows bound to moved nodes follow automatically. The container is any box; everything geometrically inside its bounds moves with it.',
  inputSchema: {
    id: z.string(),
    x: z.number().optional().describe('new top-left x (absolute)'),
    y: z.number().optional().describe('new top-left y (absolute)'),
    dx: z.number().optional().describe('move by this much on x (relative)'),
    dy: z.number().optional().describe('move by this much on y (relative)'),
  },
}, wrap((a) => bapi('/move-container', 'POST', a)))

server.registerTool('space_board', {
  description: 'Tidy the whole active board: space every node apart to a minimum gap, grow each container to wrap its contents, and separate containers from each other (contents move with them). Also reflows arrow labels. Pairs with check_overlap: measure → space_board → re-measure.',
  inputSchema: { gap: z.number().optional().describe('minimum px gap between nodes (default 60)') },
}, wrap((a) => bapi('/space', 'POST', a)))

server.registerTool('space_container', {
  description: 'Space apart ONLY the nodes inside one container (given its box id) and grow that container to fit, keeping its top-left anchored. The rest of the board is left untouched.',
  inputSchema: { id: z.string().describe('the container box id'), gap: z.number().optional().describe('minimum px gap (default 60)') },
}, wrap((a) => bapi('/space', 'POST', { gap: a.gap, container: a.id })))

server.registerTool('delete_shapes', {
  description: 'Delete shapes on the active board by id. Also removes arrows bound to them.',
  inputSchema: { ids: z.array(z.string()) },
}, wrap((a) => bapi('/delete', 'POST', a)))

server.registerTool('clear_board', {
  description: 'Delete every shape and arrow on the active board (keeps the board itself).',
  inputSchema: {},
}, wrap(() => bapi('/clear', 'POST', {})))

server.registerTool('reflow_labels', {
  description: 'Reposition every arrow label on the active board so labels avoid overlapping node boxes. Runs automatically after apply_ops; call this to tidy an existing board.',
  inputSchema: {},
}, wrap(() => bapi('/reflow-labels', 'POST', {})))

// ---- bulk: many edits in one call ----
server.registerTool('apply_ops', {
  description: `Apply MANY board edits in ONE call (single transaction) — use this instead of many separate create/move/connect calls when building or rearranging a diagram. Pass an ordered "ops" array. A create op may set a "ref" (temporary name) that later ops use in place of an id, so you can create nodes AND connect/move them in the same call.
Ops:
- {op:"node", ref?, text, x, y, w?, shape?, color?, fill?}  (box auto-fits its text; height always auto-fits)
- {op:"text", ref?, text, x, y, color?, size?}
- {op:"note", ref?, text, x, y, color?}
- {op:"uml",  ref?, name, x, y, fields?, methods?, color?}
- {op:"connect", from, to, text?, color?, dashed?}   (from/to = a ref or a real id)
- {op:"update", id, text?, x?, y?, w?, color?, fill?, name?, fields?, methods?}  (id = ref or real id; box height always auto-fits, re-fits to text at w if given)
- {op:"move", id, x, y}
- {op:"move_container", id, x?, y?, dx?, dy?}   (moves the box + everything inside it)
- {op:"space", gap?, container?}   (tidy spacing; whole board, or scoped to a container id)
- {op:"delete", ids:[...]}
Returns {refs:{ref:createdId}, count}. Colors: ${COLORS}. Shapes: ${GEOS}.`,
  inputSchema: { ops: z.array(z.object({ op: z.string() }).catchall(z.any())).describe('ordered list of operations') },
}, wrap((a) => bapi('/batch', 'POST', a)))

// ---- reusable templates ----
server.registerTool('list_templates', {
  description: 'List saved reusable block templates (name + shape count). Stamp one onto the active board with stamp_template.',
  inputSchema: {},
}, wrap(() => api('/templates')))

server.registerTool('save_template', {
  description: 'Save shapes from the active board as a reusable template. Give the shape ids (e.g. from get_board) to capture; arrows between them are captured too. Overwrites a template of the same name.',
  inputSchema: { name: z.string(), ids: z.array(z.string()).describe('shape ids on the active board to save as the template') },
}, wrap((a) => bapi('/templates/save-from', 'POST', a)))

server.registerTool('stamp_template', {
  description: 'Stamp a saved template onto the active board at (x,y) as a fresh independent copy (new ids). Returns how many shapes were placed.',
  inputSchema: { name: z.string(), x: z.number(), y: z.number() },
}, wrap((a) => bapi('/templates/stamp', 'POST', a)))

server.registerTool('delete_template', {
  description: 'Delete a saved template by name (does not affect boards).',
  inputSchema: { name: z.string() },
}, wrap((a) => api('/templates/delete', 'POST', a)))

// Wrapped in an async IIFE (not top-level await) so this file bundles to CJS,
// which the plugin ships. CJS has no top-level await.
;(async () => {
  await ensureBackend()
  const transport = new StdioServerTransport()
  await server.connect(transport)
})().catch((e) => { console.error(String(e?.stack || e)); process.exit(1) })
