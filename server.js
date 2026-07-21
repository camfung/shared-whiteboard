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
  geoSizeForText, noteBox, richText, nextIndex, COLORS, FILLS, GEO, SIZES,
} from './shapes.js'
import { umlHeight, umlWidth } from './uml-schema.js'
import { getIndexAbove } from '@tldraw/utils'
import {
  getRoom, listBoards, createBoard, renameBoard, deleteBoard, findBoards, boardExists,
  listFolders, createFolder, renameFolder, deleteFolder, moveBoards,
} from './boards.js'
import {
  listTemplates, saveTemplate, getTemplate, deleteTemplate, stampRecords,
} from './templates.js'

const PORT = Number(process.env.WB_PORT || 5858)
const HOST = process.env.WB_HOST || '127.0.0.1'

// Serve the built web UI (web/dist) when present, so an always-on deploy needs
// only this one process. In dev, run Vite on :5173 instead (dist won't exist).
const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), 'web', 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.map': 'application/json' }
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

// Flatten one shape record to the compact object the read API returns.
function mapShape(r) {
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
}
// arrowId -> {start: shapeId, end: shapeId} over every binding in the room.
function arrowLinkMap(recs) {
  const m = {}
  for (const b of recs) if (b.typeName === 'binding') (m[b.fromId] ??= {})[b.props?.terminal] = b.toId
  return m
}
function attachLinks(shapes, linkMap) {
  for (const s of shapes) if (s.type === 'arrow' && linkMap[s.id]) s.link = linkMap[s.id]
  return shapes
}
// Searchable text of a shape (box/note/text body, or a uml's name + members).
function haystack(s) {
  return (s.type === 'uml'
    ? [s.name, ...(s.fields || []), ...(s.methods || [])].join(' ')
    : s.text || '').toLowerCase()
}
// Build a predicate from the filter query ({ids, type, color, text}).
function shapeFilter({ ids, type, color, text } = {}) {
  const idSet = ids && ids.length ? new Set(ids) : null
  const needle = text != null && text !== '' ? String(text).toLowerCase() : null
  return (s) => {
    if (idSet && !idSet.has(s.id)) return false
    if (type && s.type !== type) return false
    if (color && s.color !== color) return false
    if (needle != null && !haystack(s).includes(needle)) return false
    return true
  }
}
function truncate(str, n) {
  if (str == null) return undefined
  return str.length > n ? `${str.slice(0, n - 1)}…` : str
}
// Compact one-liner for the index read (list_shapes): id + type + label.
function indexShape(s) {
  const o = { id: s.id, type: s.type, label: truncate(s.type === 'uml' ? s.name : s.text, 60) }
  if (s.link) o.link = s.link
  return o
}
// The room's logical clock. tldraw exposes it as documentClock (older
// snapshots used `clock`); per-record lastChangedClock counts on the same axis.
function clockOf(snap) {
  return snap.documentClock ?? snap.clock ?? 0
}
// Parse read-query params shared by /board, /shapes, /neighbors.
function parseQuery(url) {
  const sp = url.searchParams
  const q = {}
  for (const k of ['type', 'color', 'text', 'fields']) { const v = sp.get(k); if (v) q[k] = v }
  const ids = sp.get('ids'); if (ids) q.ids = ids.split(',').map((s) => s.trim()).filter(Boolean)
  const since = sp.get('since'); if (since != null && since !== '' && !Number.isNaN(Number(since))) q.since = Number(since)
  return q
}

// The board read. No `since`: the whole board (optionally filtered). With
// `since`: only shapes whose lastChangedClock > since plus ids deleted since,
// so a caller can poll the human's edits cheaply. Always returns the current
// clock — keep it and pass it back as `since` next time.
function boardView(room, q = {}) {
  const snap = room.getCurrentSnapshot()
  const clock = clockOf(snap)
  const allRecs = snap.documents.map((d) => d.state)
  const linkMap = arrowLinkMap(allRecs)
  const filter = shapeFilter(q)

  if (q.since != null) {
    const shapes = attachLinks(
      snap.documents
        .filter((d) => (d.lastChangedClock ?? 0) > q.since)
        .map((d) => d.state)
        .filter((r) => r.typeName === 'shape')
        .map(mapShape)
        .filter(filter),
      linkMap,
    )
    const deleted = Object.entries(snap.tombstones || {})
      .filter(([id, c]) => c > q.since && String(id).startsWith('shape:'))
      .map(([id]) => id)
    return { since: q.since, clock, shapes, deleted, counts: { shapes: shapes.length, deleted: deleted.length } }
  }

  const shapes = attachLinks(allRecs.filter((r) => r.typeName === 'shape').map(mapShape).filter(filter), linkMap)
  const bindings = allRecs.filter((r) => r.typeName === 'binding')
  return { shapes, clock, counts: { shapes: shapes.length, bindings: bindings.length } }
}
function summarize(room) {
  return boardView(room)
}

// Query shapes for /shapes: fields=index -> compact one-liners, else full.
function queryShapes(room, q = {}) {
  const snap = room.getCurrentSnapshot()
  const allRecs = snap.documents.map((d) => d.state)
  const linkMap = arrowLinkMap(allRecs)
  const full = attachLinks(allRecs.filter((r) => r.typeName === 'shape').map(mapShape).filter(shapeFilter(q)), linkMap)
  const shapes = q.fields === 'index' ? full.map(indexShape) : full
  return { shapes, clock: clockOf(snap), counts: { shapes: shapes.length } }
}

// Graph neighborhood: seed shapes + everything arrow-linked to them out to
// `hops` links, with the connecting arrows, full detail.
function neighborsView(room, seedIds, hops) {
  const snap = room.getCurrentSnapshot()
  const allRecs = snap.documents.map((d) => d.state)
  const linkMap = arrowLinkMap(allRecs)
  const shapeIds = new Set(allRecs.filter((r) => r.typeName === 'shape').map((r) => r.id))
  const adj = new Map() // nodeId -> [{ node, arrow }]
  const link = (a, b, arrow) => { if (!adj.has(a)) adj.set(a, []); adj.get(a).push({ node: b, arrow }) }
  for (const [arrow, ends] of Object.entries(linkMap)) {
    if (!ends.start || !ends.end) continue
    link(ends.start, ends.end, arrow)
    link(ends.end, ends.start, arrow)
  }
  const seeds = seedIds.filter((id) => shapeIds.has(id))
  const missing = seedIds.filter((id) => !shapeIds.has(id))
  const visited = new Set(seeds)
  const arrows = new Set()
  let frontier = [...seeds]
  for (let h = 0; h < Math.max(1, hops); h++) {
    const next = []
    for (const n of frontier) for (const e of adj.get(n) || []) {
      arrows.add(e.arrow)
      if (!visited.has(e.node)) { visited.add(e.node); next.push(e.node) }
    }
    frontier = next
  }
  const want = new Set([...visited, ...arrows])
  const shapes = attachLinks(allRecs.filter((r) => r.typeName === 'shape' && want.has(r.id)).map(mapShape), linkMap)
  return { seeds, ...(missing.length ? { missing } : {}), hops: Math.max(1, hops), clock: clockOf(snap), shapes, counts: { shapes: shapes.length } }
}

// Deterministic overlap metric for a board. Containers are treated as FRAMES,
// not boxes: any box that fully encloses another node is a container and is
// excluded from the measure (a frame is meant to sit over its contents). Only
// overlaps between leaf (non-container) boxes are counted. Returns a scalar
// `overlapRatio` (overlap area / total leaf area) plus the worst offenders, so
// an agent can decide whether to run "space"/reflow and verify afterward.
function overlapReport(room) {
  const NODE = new Set(['geo', 'uml', 'note', 'text'])
  const all = records(room)
    .filter((r) => r.typeName === 'shape' && NODE.has(r.type) && r.props?.w != null)
    .map((r) => ({ id: r.id, x: r.x, y: r.y, w: r.props.w, h: r.props.h }))
  const contains = (a, b) => a.id !== b.id && a.x <= b.x + 0.5 && a.y <= b.y + 0.5 && a.x + a.w >= b.x + b.w - 0.5 && a.y + a.h >= b.y + b.h - 0.5
  const containerIds = new Set(all.filter((a) => all.some((b) => contains(a, b))).map((a) => a.id))
  const rects = all.filter((r) => !containerIds.has(r.id)) // leaves only
  let overlapArea = 0, pairs = 0, worst = null
  const offenders = {}
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const A = rects[i], B = rects[j]
      const ix = Math.max(0, Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x))
      const iy = Math.max(0, Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y))
      const area = ix * iy
      if (area <= 0) continue
      overlapArea += area
      pairs++
      offenders[A.id] = (offenders[A.id] || 0) + area
      offenders[B.id] = (offenders[B.id] || 0) + area
      if (!worst || area > worst.area) worst = { a: A.id, b: B.id, area: Math.round(area) }
    }
  }
  const totalArea = rects.reduce((s, r) => s + r.w * r.h, 0) || 1
  const ratio = overlapArea / totalArea
  const topOffenders = Object.entries(offenders).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, a]) => ({ id, area: Math.round(a) }))
  return {
    leafNodes: rects.length,
    containers: containerIds.size,
    overlappingPairs: pairs,
    overlapArea: Math.round(overlapArea),
    overlapRatio: Math.round(ratio * 1000) / 1000,
    verdict: pairs === 0 ? 'clean' : ratio < 0.03 ? 'minor' : 'bad',
    worstPair: worst,
    topOffenders,
  }
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

// Apply one update to a shape already in the store. Auto-fits box/uml size to
// its text unless an explicit w/h is given. Shared by /update and /batch.
function applyUpdate(store, b) {
  checkEnum('color', b.color, COLORS)
  checkEnum('fill', b.fill, FILLS)
  const rec = store.get(b.id)
  if (!rec) throw new Error(`shape ${b.id} not found`)
  const next = { ...rec, props: { ...rec.props } }
  if (b.x != null) next.x = b.x
  if (b.y != null) next.y = b.y
  if (b.w != null && 'w' in next.props) next.props.w = b.w
  if (b.color != null && 'color' in next.props) next.props.color = b.color
  if (b.fill != null && 'fill' in next.props) next.props.fill = b.fill
  if (b.text != null && 'richText' in next.props) next.props.richText = richText(b.text)
  if (b.name != null && 'name' in next.props) next.props.name = String(b.name)
  if (Array.isArray(b.fields) && 'fields' in next.props) next.props.fields = b.fields.map(String)
  if (Array.isArray(b.methods) && 'methods' in next.props) next.props.methods = b.methods.map(String)
  if (rec.type === 'geo') {
    // height always auto-fits: keep the effective width (caller's new w, else the
    // box's current w) and refit height to the text wrapped at that width, so an
    // in-place text edit never overflows and never explodes the author's layout.
    const targetW = b.w != null ? b.w : next.props.w
    const fit = geoSizeForText(extractText(next.props) || '', next.props.size, next.props.geo, next.props.scale, targetW)
    next.props.w = fit.w
    next.props.h = fit.h
  }
  if (rec.type === 'uml') {
    next.props.h = umlHeight(next.props.fields, next.props.methods)
    if (b.w == null) next.props.w = umlWidth(next.props.name, next.props.fields, next.props.methods)
  }
  if (rec.type === 'note' && b.text != null) {
    const box = noteBox(extractText(next.props) || '', next.props.size)
    next.props.growY = box.growY
    next.meta = { ...next.meta, w: box.w }
  }
  store.put(next)
  return next.id
}

// Move a container box and everything geometrically inside it by (dx, dy).
// Enclosed = geo/uml/note/text shapes whose box sits within the container's box
// (transitive, so nested groups come along). Arrows bound to moved shapes follow
// automatically. Returns the ids that moved (container first).
function moveEnclosed(store, id, dx, dy) {
  const c = store.get(id)
  if (!c || c.props?.w == null) throw new Error(`container "${id}" not found (must be a box with a size)`)
  const NODE = new Set(['geo', 'uml', 'note', 'text'])
  const cx = c.x, cy = c.y, cw = c.props.w, ch = c.props.h
  const inside = (s) =>
    s.id !== id && s.typeName === 'shape' && NODE.has(s.type) && s.props?.w != null &&
    s.x >= cx - 0.5 && s.y >= cy - 0.5 && s.x + s.props.w <= cx + cw + 0.5 && s.y + s.props.h <= cy + ch + 0.5
  const targets = [c, ...store.getAll().filter(inside)]
  for (const s of targets) store.put({ ...s, x: s.x + dx, y: s.y + dy })
  return targets.map((s) => s.id)
}

// Resolve a container move request {id, x?, y?, dx?, dy?} to a delta and apply it.
function applyMoveContainer(store, b) {
  const c = store.get(b.id)
  if (!c || c.props?.w == null) throw new Error(`container "${b.id}" not found (must be a box with a size)`)
  const dx = b.x != null ? b.x - c.x : (b.dx || 0)
  const dy = b.y != null ? b.y - c.y : (b.dy || 0)
  return moveEnclosed(store, b.id, dx, dy)
}

// Space node boxes apart to a minimum gap (server-side port of the UI's "space"
// button). Whole board (containerId omitted): space each container's children,
// grow the container to wrap them, then space containers against each other
// (contents move with them). Scoped (containerId given): space just that
// container's contents and grow it, keeping its top-left anchored. Returns the
// number of shapes touched.
function spaceLayout(store, gap, containerId) {
  const NODE = new Set(['geo', 'uml', 'note', 'text'])
  const rects = store.getAll()
    .filter((r) => r.typeName === 'shape' && NODE.has(r.type) && r.props?.w != null)
    .map((r) => ({ id: r.id, type: r.type, x: r.x, y: r.y, w: r.props.w, h: r.props.h }))
  if (rects.length < 2) return 0
  const PAD = Math.max(16, Math.round(gap / 2))
  const byId = new Map(rects.map((r) => [r.id, r]))
  const areaOf = (r) => r.w * r.h
  const contains = (a, b) => a.id !== b.id && a.x <= b.x + 0.5 && a.y <= b.y + 0.5 && a.x + a.w >= b.x + b.w - 0.5 && a.y + a.h >= b.y + b.h - 0.5
  const parent = new Map()
  for (const r of rects) { let best = null; for (const c of rects) if (contains(c, r) && (!best || areaOf(c) < areaOf(best))) best = c; parent.set(r.id, best) }
  const children = new Map()
  for (const r of rects) { const p = parent.get(r.id); if (p) { const a = children.get(p.id) || []; a.push(r); children.set(p.id, a) } }
  const isC = (r) => children.has(r.id)
  const desc = (r) => { const o = []; const st = [...(children.get(r.id) || [])]; while (st.length) { const x = st.pop(); o.push(x); if (children.has(x.id)) st.push(...children.get(x.id)) } return o }
  const move = (r, dx, dy) => { r.x += dx; r.y += dy; if (isC(r)) for (const d of desc(r)) { d.x += dx; d.y += dy } }
  const sep = (m) => {
    for (let it = 0; it < 400; it++) {
      let mv = false
      for (let i = 0; i < m.length; i++) for (let j = i + 1; j < m.length; j++) {
        const A = m[i], B = m[j]
        const dx = (B.x + B.w / 2) - (A.x + A.w / 2), dy = (B.y + B.h / 2) - (A.y + A.h / 2)
        const ox = (A.w + B.w) / 2 + gap - Math.abs(dx), oy = (A.h + B.h) / 2 + gap - Math.abs(dy)
        if (ox > 0 && oy > 0) {
          if (ox <= oy) { const p = (ox / 2) * (dx < 0 ? -1 : 1); move(A, -p, 0); move(B, p, 0) }
          else { const p = (oy / 2) * (dy < 0 ? -1 : 1); move(A, 0, -p); move(B, 0, p) }
          mv = true
        }
      }
      if (!mv) break
    }
  }
  const grow = (c) => {
    const k = children.get(c.id); if (!k || !k.length) return
    const mnX = Math.min(...k.map((x) => x.x)), mnY = Math.min(...k.map((x) => x.y))
    const mxX = Math.max(...k.map((x) => x.x + x.w)), mxY = Math.max(...k.map((x) => x.y + x.h))
    c.x = mnX - PAD; c.y = mnY - PAD; c.w = (mxX - mnX) + 2 * PAD; c.h = (mxY - mnY) + 2 * PAD
  }
  const layout = (m) => { for (const x of m) if (isC(x)) { layout(children.get(x.id)); grow(x) } if (m.length > 1) sep(m) }

  let affected
  if (containerId) {
    const c = byId.get(containerId)
    if (!c) throw new Error(`container "${containerId}" not found`)
    if (!isC(c)) throw new Error(`"${containerId}" has no nodes inside it to space`)
    const ox = c.x, oy = c.y
    layout(children.get(c.id))
    grow(c)
    move(c, ox - c.x, oy - c.y) // re-anchor top-left
    affected = new Set([c.id, ...desc(c).map((d) => d.id)])
  } else {
    layout(rects.filter((r) => !parent.get(r.id)))
    affected = new Set(rects.map((r) => r.id))
  }

  for (const id of affected) {
    const r = byId.get(id)
    const rec = store.get(id)
    if (!rec) continue
    const next = { ...rec, x: Math.round(r.x), y: Math.round(r.y) }
    if (isC(r) && rec.type === 'geo') next.props = { ...rec.props, w: Math.round(r.w), h: Math.round(r.h) }
    store.put(next)
  }
  return affected.size
}

// Nudge each arrow's label along its arrow so it doesn't sit on top of node
// boxes. Pure heuristic: it approximates every arrow as a straight line between
// the CENTERS of its two bound shapes and ignores tldraw's actual curve. The
// label bbox estimate (~20px monospace) is intentionally rough.
function reflowArrowLabels(store) {
  const all = store.getAll()
  const NODE_TYPES = new Set(['geo', 'uml', 'note', 'text'])
  const nodeRects = []
  for (const r of all) {
    if (r.typeName !== 'shape' || !NODE_TYPES.has(r.type)) continue
    const w = r.props?.w, h = r.props?.h
    if (w == null || h == null) continue
    nodeRects.push({ x: r.x, y: r.y, w, h })
  }
  // total intersection area of a label rect against every node rect
  const overlapArea = (ax, ay, aw, ah) => {
    let area = 0
    for (const b of nodeRects) {
      const ix = Math.max(0, Math.min(ax + aw, b.x + b.w) - Math.max(ax, b.x))
      const iy = Math.max(0, Math.min(ay + ah, b.y + b.h) - Math.max(ay, b.y))
      area += ix * iy
    }
    return area
  }
  const byId = new Map(all.map((r) => [r.id, r]))
  const bindings = all.filter((r) => r.typeName === 'binding' && r.type === 'arrow')
  for (const arrow of all) {
    if (arrow.typeName !== 'shape' || arrow.type !== 'arrow') continue
    const text = extractText(arrow.props)
    if (!text) continue
    const own = bindings.filter((b) => b.fromId === arrow.id)
    const startB = own.find((b) => b.props?.terminal === 'start')
    const endB = own.find((b) => b.props?.terminal === 'end')
    if (!startB || !endB) continue
    const s = byId.get(startB.toId), e = byId.get(endB.toId)
    if (!s || !e) continue
    if (s.props?.w == null || s.props?.h == null || e.props?.w == null || e.props?.h == null) continue
    const sx = s.x + s.props.w / 2, sy = s.y + s.props.h / 2
    const ex = e.x + e.props.w / 2, ey = e.y + e.props.h / 2
    const lines = text.split('\n')
    const labelW = Math.max(...lines.map((l) => l.length)) * 11 + 16
    const labelH = lines.length * 24 + 8
    let bestT = 0.5, bestArea = Infinity
    for (const t of [0.5, 0.35, 0.65, 0.25, 0.75, 0.15, 0.85]) {
      const cx = sx + (ex - sx) * t, cy = sy + (ey - sy) * t
      const area = overlapArea(cx - labelW / 2, cy - labelH / 2, labelW, labelH)
      if (area < bestArea) { bestArea = area; bestT = t }
    }
    const t = Math.max(0.05, Math.min(0.95, bestT))
    if (Math.abs(t - (arrow.props?.labelPosition ?? 0.5)) > 0.001) {
      store.put({ ...arrow, props: { ...arrow.props, labelPosition: t } })
    }
  }
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
      return json(res, 200, createBoard(b.name, b.folderId))
    }
    if (M === 'POST' && p === '/boards/rename') {
      const b = await readBody(req)
      return json(res, 200, renameBoard(b.id, b.name))
    }
    if (M === 'POST' && p === '/boards/delete') {
      const b = await readBody(req)
      const ids = Array.isArray(b.ids) ? b.ids : b.id ? [b.id] : []
      return json(res, 200, { deleted: ids.map((id) => deleteBoard(id).deleted) })
    }
    if (M === 'POST' && p === '/boards/move') {
      const b = await readBody(req)
      return json(res, 200, moveBoards(b.ids ?? b.id, b.folderId ?? null))
    }
    if (M === 'GET' && p === '/boards/find') {
      return json(res, 200, { matches: findBoards(url.searchParams.get('q')) })
    }

    // ---- folders ----
    if (M === 'GET' && p === '/folders') return json(res, 200, { folders: listFolders() })
    if (M === 'POST' && p === '/folders') {
      const b = await readBody(req)
      return json(res, 200, createFolder(b.name))
    }
    if (M === 'POST' && p === '/folders/rename') {
      const b = await readBody(req)
      return json(res, 200, renameFolder(b.id, b.name))
    }
    if (M === 'POST' && p === '/folders/delete') {
      const b = await readBody(req)
      return json(res, 200, deleteFolder(b.id))
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
      return json(res, 200, { board: boardId(url), ...boardView(roomFor(url), parseQuery(url)) })
    }
    if (M === 'GET' && p === '/shapes') {
      if (!boardExists(boardId(url))) return json(res, 404, { error: `board "${boardId(url)}" not found` })
      return json(res, 200, { board: boardId(url), ...queryShapes(roomFor(url), parseQuery(url)) })
    }
    if (M === 'GET' && p === '/neighbors') {
      if (!boardExists(boardId(url))) return json(res, 404, { error: `board "${boardId(url)}" not found` })
      const ids = (url.searchParams.get('ids') || '').split(',').map((s) => s.trim()).filter(Boolean)
      if (!ids.length) return json(res, 400, { error: 'neighbors needs ids' })
      const hops = Number(url.searchParams.get('hops')) || 1
      return json(res, 200, { board: boardId(url), ...neighborsView(roomFor(url), ids, hops) })
    }
    if (M === 'GET' && p === '/overlap') {
      if (!boardExists(boardId(url))) return json(res, 404, { error: `board "${boardId(url)}" not found` })
      return json(res, 200, overlapReport(roomFor(url)))
    }

    // ---- document mutation ----
    if (M === 'POST') {
      const b = await readBody(req)
      const room = roomFor(url)

      if (p === '/node') {
        checkEnum('color', b.color, COLORS); checkEnum('fill', b.fill, FILLS)
        checkEnum('shape', b.shape, GEO); checkEnum('size', b.size, SIZES)
        const rec = buildGeo({ text: b.text, x: b.x ?? 0, y: b.y ?? 0, w: b.w, geo: b.shape, color: b.color, fill: b.fill, size: b.size, index: nextIndex(shapeIndexKeys(room)) })
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
          props.w = umlWidth(props.name, props.fields, props.methods)
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
        let updated = null
        await room.updateStore((store) => { updated = applyUpdate(store, b) })
        return json(res, 200, { id: updated })
      }
      if (p === '/move-container') {
        let moved = []
        await room.updateStore((store) => { moved = applyMoveContainer(store, b) })
        return json(res, 200, { moved })
      }
      if (p === '/space') {
        const gap = Number.isFinite(b.gap) ? b.gap : 60
        let touched = 0
        await room.updateStore((store) => {
          touched = spaceLayout(store, gap, b.container)
          reflowArrowLabels(store)
        })
        return json(res, 200, { touched, gap, ...(b.container ? { container: b.container } : {}) })
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

      // Apply many ops in ONE transaction. Create-ops may set a "ref" that later
      // ops reference in place of an id (build + connect in a single call).
      if (p === '/batch') {
        const ops = Array.isArray(b.ops) ? b.ops : []
        const refs = {}
        await room.updateStore((store) => {
          let idx = nextIndex(store.getAll().filter((r) => r.typeName === 'shape').map((r) => r.index))
          const takeIdx = () => { const cur = idx; idx = getIndexAbove(idx); return cur }
          const rid = (x) => (x != null && refs[x] != null ? refs[x] : x)
          for (const op of ops) {
            const k = op.op
            if (k === 'node') {
              checkEnum('color', op.color, COLORS); checkEnum('fill', op.fill, FILLS); checkEnum('shape', op.shape, GEO); checkEnum('size', op.size, SIZES)
              const rec = buildGeo({ text: op.text, x: op.x ?? 0, y: op.y ?? 0, w: op.w, geo: op.shape, color: op.color, fill: op.fill, size: op.size, index: takeIdx() })
              store.put(rec); if (op.ref) refs[op.ref] = rec.id
            } else if (k === 'text') {
              checkEnum('color', op.color, COLORS); checkEnum('size', op.size, SIZES)
              const rec = buildText({ text: op.text, x: op.x ?? 0, y: op.y ?? 0, color: op.color, size: op.size, index: takeIdx() })
              store.put(rec); if (op.ref) refs[op.ref] = rec.id
            } else if (k === 'note') {
              checkEnum('color', op.color, COLORS)
              const rec = buildNote({ text: op.text, x: op.x ?? 0, y: op.y ?? 0, color: op.color, index: takeIdx() })
              store.put(rec); if (op.ref) refs[op.ref] = rec.id
            } else if (k === 'uml') {
              checkEnum('color', op.color, COLORS)
              const rec = buildUml({ name: op.name, fields: op.fields || [], methods: op.methods || [], x: op.x ?? 0, y: op.y ?? 0, w: op.w, color: op.color, index: takeIdx() })
              store.put(rec); if (op.ref) refs[op.ref] = rec.id
            } else if (k === 'connect') {
              checkEnum('color', op.color, COLORS)
              const from = rid(op.from ?? op.fromId), to = rid(op.to ?? op.toId)
              if (!store.get(from) || !store.get(to)) throw new Error(`connect: from/to not found (${from} -> ${to})`)
              const arrow = buildArrow({ text: op.text, color: op.color, dash: op.dashed ? 'dashed' : 'draw', index: takeIdx() })
              store.put(arrow)
              store.put(buildArrowBinding({ arrowId: arrow.id, shapeId: from, terminal: 'start' }))
              store.put(buildArrowBinding({ arrowId: arrow.id, shapeId: to, terminal: 'end' }))
              if (op.ref) refs[op.ref] = arrow.id
            } else if (k === 'update' || k === 'move') {
              applyUpdate(store, { ...op, id: rid(op.id) })
            } else if (k === 'move_container') {
              applyMoveContainer(store, { ...op, id: rid(op.id) })
            } else if (k === 'space') {
              spaceLayout(store, Number.isFinite(op.gap) ? op.gap : 60, op.container ? rid(op.container) : undefined)
            } else if (k === 'delete') {
              const ids = (Array.isArray(op.ids) ? op.ids : [op.id]).map(rid)
              const idSet = new Set(ids)
              for (const r of store.getAll()) if (r.typeName === 'binding' && (idSet.has(r.fromId) || idSet.has(r.toId))) store.delete(r.id)
              for (const id of ids) store.delete(id)
            } else {
              throw new Error(`unknown op "${k}" (use node|text|note|uml|connect|update|move|delete)`)
            }
          }
          reflowArrowLabels(store)
        })
        return json(res, 200, { refs, count: ops.length })
      }
      if (p === '/mutate') {
        await room.updateStore((store) => {
          for (const rec of b.puts || []) store.put(rec)
          for (const d of b.deletes || []) store.delete(d)
        })
        return json(res, 200, { ok: true, ...summarize(room) })
      }
      if (p === '/reflow-labels') {
        await room.updateStore((store) => reflowArrowLabels(store))
        return json(res, 200, { ok: true })
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
