// Shared Whiteboard sync backend.
//
// Holds every board's authoritative document in a TLSocketRoom (see boards.js
// for the named + persisted room registry).
//  - Browsers connect over WebSocket at /connect/:boardId (spoken by @tldraw/sync).
//  - The MCP server calls the semantic HTTP API (/boards, /board, /node, ...).
//    Each mutation goes through room.updateStore, which broadcasts to every
//    connected browser in real time.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { WebSocketServer } from 'ws'
import {
  buildGeo, buildText, buildNote, buildArrow, buildArrowBinding, buildUml,
  richText, nextIndex, COLORS, FILLS, GEO, SIZES,
} from './shapes.js'
import { umlHeight } from './uml-schema.js'
import {
  getRoom, listBoards, createBoard, renameBoard, deleteBoard, findBoards, boardExists,
} from './boards.js'
import {
  listTemplates, saveTemplate, getTemplate, deleteTemplate, stampRecords,
} from './templates.js'

const PORT = Number(process.env.WB_PORT || 5858)
const HOST = process.env.WB_HOST || '127.0.0.1'

// Serve the built web UI (web/dist) when present, so an always-on deploy needs
// only this one process. In dev, run Vite on :5173 instead (dist won't exist).
const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), 'web', 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.map': 'application/json' }
function serveStatic(res, pathname) {
  if (!fs.existsSync(DIST)) return false
  const rel = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
  let file = path.join(DIST, rel)
  if (!file.startsWith(DIST)) return false // path-traversal guard
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html') // SPA fallback
  if (!fs.existsSync(file)) return false
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' })
  fs.createReadStream(file).pipe(res)
  return true
}

function records(room) {
  return room.getCurrentSnapshot().documents.map((d) => d.state)
}
function shapeIndexKeys(room) {
  return records(room).filter((r) => r.typeName === 'shape').map((r) => r.index)
}

function checkEnum(name, value, allowed) {
  if (value == null) return
  if (!allowed.includes(value)) throw new Error(`invalid ${name} "${value}". allowed: ${allowed.join(', ')}`)
}

function extractText(props) {
  const rt = props?.richText
  if (!rt || !rt.content) return undefined
  const walk = (nodes) =>
    (nodes || []).map((n) => (n.type === 'text' ? n.text || '' : n.content ? walk(n.content) : '')).join('')
  return rt.content.map((p) => walk(p.content)).join('\n').trim() || undefined
}

function summarize(room) {
  const recs = records(room)
  const shapes = recs
    .filter((r) => r.typeName === 'shape')
    .map((r) => {
      const s = {
        id: r.id, type: r.type, geo: r.props?.geo,
        x: Math.round(r.x), y: Math.round(r.y),
        w: r.props?.w, h: r.props?.h, color: r.props?.color,
        text: extractText(r.props),
      }
      if (r.type === 'uml') {
        s.name = r.props?.name
        s.fields = r.props?.fields
        s.methods = r.props?.methods
        delete s.text
      }
      return s
    })
  const bindings = recs.filter((r) => r.typeName === 'binding')
  const arrowLinks = {}
  for (const b of bindings) (arrowLinks[b.fromId] ??= {})[b.props?.terminal] = b.toId
  for (const s of shapes) if (s.type === 'arrow' && arrowLinks[s.id]) s.link = arrowLinks[s.id]
  return { shapes, counts: { shapes: shapes.length, bindings: bindings.length } }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (c) => (data += c))
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}) } catch (e) { reject(e) } })
    req.on('error', reject)
  })
}
function json(res, code, obj) {
  res.writeHead(code, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
  res.end(JSON.stringify(obj))
}
async function put(room, ...recs) {
  await room.updateStore((store) => { for (const r of recs) store.put(r) })
}

// resolve the ?board= id, requiring it to exist for mutation routes
function boardId(url) {
  return url.searchParams.get('board') || url.searchParams.get('room') || 'main'
}
function roomFor(url) {
  return getRoom(boardId(url))
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const p = url.pathname
  const M = req.method

  try {
    if (M === 'GET' && p === '/health') return json(res, 200, { ok: true })

    // ---- board management ----
    if (M === 'GET' && p === '/boards') return json(res, 200, { boards: listBoards() })
    if (M === 'POST' && p === '/boards') {
      const b = await readBody(req)
      return json(res, 200, createBoard(b.name))
    }
    if (M === 'POST' && p === '/boards/rename') {
      const b = await readBody(req)
      return json(res, 200, renameBoard(b.id, b.name))
    }
    if (M === 'POST' && p === '/boards/delete') {
      const b = await readBody(req)
      return json(res, 200, deleteBoard(b.id))
    }
    if (M === 'GET' && p === '/boards/find') {
      return json(res, 200, { matches: findBoards(url.searchParams.get('q')) })
    }

    // ---- templates ----
    if (M === 'GET' && p === '/templates') return json(res, 200, { templates: listTemplates() })
    if (M === 'POST' && p === '/templates') {
      const b = await readBody(req)
      return json(res, 200, saveTemplate(b.name, b.records))
    }
    if (M === 'POST' && p === '/templates/delete') {
      const b = await readBody(req)
      return json(res, 200, deleteTemplate(b.name))
    }
    if (M === 'POST' && p === '/templates/save-from') {
      // save from shape ids already on a board (used by the MCP server)
      const b = await readBody(req)
      const recs = records(roomFor(url))
      const idSet = new Set(b.ids || [])
      const shapes = recs.filter((r) => r.typeName === 'shape' && idSet.has(r.id))
      const bindings = recs.filter((r) => r.typeName === 'binding' && idSet.has(r.fromId) && idSet.has(r.toId))
      return json(res, 200, saveTemplate(b.name, [...shapes, ...bindings]))
    }
    if (M === 'POST' && p === '/templates/stamp') {
      const b = await readBody(req)
      const t = getTemplate(b.name)
      if (!t) throw new Error(`no template "${b.name}"`)
      const room = roomFor(url)
      const out = stampRecords(t, b.x ?? 0, b.y ?? 0, shapeIndexKeys(room))
      await put(room, ...out)
      return json(res, 200, { stamped: t.name, count: out.length })
    }

    // ---- document read ----
    if (M === 'GET' && p === '/snapshot') return json(res, 200, roomFor(url).getCurrentSnapshot())
    if (M === 'GET' && p === '/board') {
      if (!boardExists(boardId(url))) return json(res, 404, { error: `board "${boardId(url)}" not found` })
      return json(res, 200, { board: boardId(url), ...summarize(roomFor(url)) })
    }

    // ---- document mutation ----
    if (M === 'POST') {
      const b = await readBody(req)
      const room = roomFor(url)

      if (p === '/node') {
        checkEnum('color', b.color, COLORS); checkEnum('fill', b.fill, FILLS)
        checkEnum('shape', b.shape, GEO); checkEnum('size', b.size, SIZES)
        const rec = buildGeo({ text: b.text, x: b.x ?? 0, y: b.y ?? 0, w: b.w, h: b.h, geo: b.shape, color: b.color, fill: b.fill, size: b.size, index: nextIndex(shapeIndexKeys(room)) })
        await put(room, rec)
        return json(res, 200, { id: rec.id })
      }
      if (p === '/text') {
        checkEnum('color', b.color, COLORS); checkEnum('size', b.size, SIZES)
        const rec = buildText({ text: b.text, x: b.x ?? 0, y: b.y ?? 0, color: b.color, size: b.size, index: nextIndex(shapeIndexKeys(room)) })
        await put(room, rec)
        return json(res, 200, { id: rec.id })
      }
      if (p === '/note') {
        checkEnum('color', b.color, COLORS)
        const rec = buildNote({ text: b.text, x: b.x ?? 0, y: b.y ?? 0, color: b.color, index: nextIndex(shapeIndexKeys(room)) })
        await put(room, rec)
        return json(res, 200, { id: rec.id })
      }
      if (p === '/uml') {
        checkEnum('color', b.color, COLORS)
        const rec = buildUml({
          name: b.name, fields: b.fields || [], methods: b.methods || [],
          x: b.x ?? 0, y: b.y ?? 0, w: b.w, color: b.color,
          index: nextIndex(shapeIndexKeys(room)),
        })
        await put(room, rec)
        return json(res, 200, { id: rec.id })
      }
      if (p === '/uml/add') {
        let out = null
        await room.updateStore((store) => {
          const rec = store.get(b.id)
          if (!rec || rec.type !== 'uml') throw new Error(`uml shape ${b.id} not found`)
          const props = { ...rec.props, fields: [...rec.props.fields], methods: [...rec.props.methods] }
          if (b.field != null) props.fields.push(String(b.field))
          if (b.method != null) props.methods.push(String(b.method))
          props.h = umlHeight(props.fields, props.methods)
          store.put({ ...rec, props })
          out = rec.id
        })
        return json(res, 200, { id: out })
      }
      if (p === '/connect') {
        checkEnum('color', b.color, COLORS)
        const ids = new Set(records(room).map((r) => r.id))
        if (!ids.has(b.fromId) || !ids.has(b.toId)) throw new Error(`fromId/toId not found (${b.fromId} -> ${b.toId})`)
        const arrow = buildArrow({ text: b.text, color: b.color, dash: b.dashed ? 'dashed' : 'draw', index: nextIndex(shapeIndexKeys(room)) })
        await put(room, arrow,
          buildArrowBinding({ arrowId: arrow.id, shapeId: b.fromId, terminal: 'start' }),
          buildArrowBinding({ arrowId: arrow.id, shapeId: b.toId, terminal: 'end' }))
        return json(res, 200, { id: arrow.id })
      }
      if (p === '/update') {
        checkEnum('color', b.color, COLORS); checkEnum('fill', b.fill, FILLS)
        let updated = null
        await room.updateStore((store) => {
          const rec = store.get(b.id)
          if (!rec) throw new Error(`shape ${b.id} not found`)
          const next = { ...rec, props: { ...rec.props } }
          if (b.x != null) next.x = b.x
          if (b.y != null) next.y = b.y
          if (b.w != null && 'w' in next.props) next.props.w = b.w
          if (b.h != null && 'h' in next.props) next.props.h = b.h
          if (b.color != null && 'color' in next.props) next.props.color = b.color
          if (b.fill != null && 'fill' in next.props) next.props.fill = b.fill
          if (b.text != null && 'richText' in next.props) next.props.richText = richText(b.text)
          // uml-specific props
          if (b.name != null && 'name' in next.props) next.props.name = String(b.name)
          if (Array.isArray(b.fields) && 'fields' in next.props) next.props.fields = b.fields.map(String)
          if (Array.isArray(b.methods) && 'methods' in next.props) next.props.methods = b.methods.map(String)
          if (rec.type === 'uml' && (b.fields != null || b.methods != null)) {
            next.props.h = umlHeight(next.props.fields, next.props.methods)
          }
          store.put(next)
          updated = next.id
        })
        return json(res, 200, { id: updated })
      }
      if (p === '/delete') {
        const ids = Array.isArray(b.ids) ? b.ids : b.id ? [b.id] : []
        await room.updateStore((store) => {
          const idSet = new Set(ids)
          for (const r of store.getAll()) {
            if (r.typeName === 'binding' && (idSet.has(r.fromId) || idSet.has(r.toId))) store.delete(r.id)
          }
          for (const id of ids) store.delete(id)
        })
        return json(res, 200, { deleted: ids })
      }
      if (p === '/clear') {
        await room.updateStore((store) => {
          for (const r of store.getAll()) if (r.typeName === 'shape' || r.typeName === 'binding') store.delete(r.id)
        })
        return json(res, 200, { ok: true })
      }
      if (p === '/mutate') {
        await room.updateStore((store) => {
          for (const rec of b.puts || []) store.put(rec)
          for (const d of b.deletes || []) store.delete(d)
        })
        return json(res, 200, { ok: true, ...summarize(room) })
      }
    }

    if (M === 'GET' && serveStatic(res, p)) return
    json(res, 404, { error: 'not found' })
  } catch (err) {
    json(res, 400, { error: String(err?.message || err) })
  }
})

// ---- WebSocket (spoken by @tldraw/sync in the browser) -------------------
const wss = new WebSocketServer({ noServer: true })
server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const m = url.pathname.match(/^\/connect\/(.+)$/)
  if (!m) return socket.destroy()
  const id = decodeURIComponent(m[1])
  const sessionId = url.searchParams.get('sessionId') || `sess-${Math.random().toString(36).slice(2)}`
  wss.handleUpgrade(req, socket, head, (ws) => {
    getRoom(id).handleSocketConnect({ sessionId, socket: ws })
  })
})

server.listen(PORT, HOST, () => {
  console.log(`[whiteboard] sync backend on http://${HOST}:${PORT}`)
  console.log(`[whiteboard] boards: ${listBoards().map((b) => b.id).join(', ') || '(none yet)'}`)
})
