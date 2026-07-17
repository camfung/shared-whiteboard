// MCP server for the Shared Whiteboard.
//
// Thin stdio proxy over the sync backend's HTTP API. Holds a per-session
// "current board": open_board / create_board set it, and every edit tool targets
// it. Because all sessions hit the same backend (WB_URL), boards are shared —
// open the same board in two sessions (or in the web UI) and you co-edit it live.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const BASE = process.env.WB_URL || 'http://127.0.0.1:5858'

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
  description: 'Read the active board: every shape (id, type, position, size, color, text) and arrow links. Call after open_board, and again to see edits the human just made.',
  inputSchema: {},
}, wrap(() => bapi('/board')))

server.registerTool('create_node', {
  description: `Create a labeled box/shape on the active board. Returns its id. Colors: ${COLORS}. Shapes: ${GEOS}. Fills: ${FILLS}.`,
  inputSchema: {
    text: z.string(), x: z.number(), y: z.number(),
    w: z.number().optional(), h: z.number().optional(),
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
  description: 'Update a UML block by id. Pass name/fields/methods/color to replace them (fields/methods replace the whole list). Also moves/resizes via x,y,w.',
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
  description: 'Update a shape on the active board by id: text, position (x,y), size (w,h), color, fill. Pass only fields to change.',
  inputSchema: {
    id: z.string(), text: z.string().optional(),
    x: z.number().optional(), y: z.number().optional(),
    w: z.number().optional(), h: z.number().optional(),
    color: z.string().optional(), fill: z.string().optional(),
  },
}, wrap((a) => bapi('/update', 'POST', a)))

server.registerTool('delete_shapes', {
  description: 'Delete shapes on the active board by id. Also removes arrows bound to them.',
  inputSchema: { ids: z.array(z.string()) },
}, wrap((a) => bapi('/delete', 'POST', a)))

server.registerTool('clear_board', {
  description: 'Delete every shape and arrow on the active board (keeps the board itself).',
  inputSchema: {},
}, wrap(() => bapi('/clear', 'POST', {})))

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

const transport = new StdioServerTransport()
await server.connect(transport)
