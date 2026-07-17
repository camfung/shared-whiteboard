// Named, persisted whiteboards.
//
// Each board is a TLSocketRoom keyed by a url-safe id. The document is written to
// data/snapshots/<id>.json (debounced) whenever it changes — from a browser OR
// from the MCP server — and reloaded on next access, so boards survive restarts.
// Board names live in data/boards.json.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { TLSocketRoom } from '@tldraw/sync-core'
import { createTLSchema, defaultShapeSchemas, defaultBindingSchemas } from '@tldraw/tlschema'
import { umlProps } from './uml-schema.js'

const DIR = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(DIR, 'data')
const SNAP_DIR = path.join(DATA_DIR, 'snapshots')
const INDEX_FILE = path.join(DATA_DIR, 'boards.json')

fs.mkdirSync(SNAP_DIR, { recursive: true })

// Register the custom uml shape alongside the defaults (must match the browser).
const schema = createTLSchema({
  shapes: { ...defaultShapeSchemas, uml: { props: umlProps } },
  bindings: defaultBindingSchemas,
})
const rooms = new Map() // id -> TLSocketRoom
const saveTimers = new Map() // id -> timeout

// ---- board index (id + name + timestamps) --------------------------------
function loadIndex() {
  try {
    return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'))
  } catch {
    return []
  }
}
function saveIndex(index) {
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2))
}
let index = loadIndex()

function slugify(name) {
  const base =
    String(name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'board'
  let id = base
  let n = 2
  const taken = new Set(index.map((b) => b.id))
  while (taken.has(id)) id = `${base}-${n++}`
  return id
}

function touch(id) {
  const b = index.find((x) => x.id === id)
  if (b) {
    b.updatedAt = Date.now()
    saveIndex(index)
  }
}

// ---- snapshot IO ----------------------------------------------------------
function snapPath(id) {
  return path.join(SNAP_DIR, `${id}.json`)
}
function readSnapshot(id) {
  try {
    return JSON.parse(fs.readFileSync(snapPath(id), 'utf8'))
  } catch {
    return null
  }
}
function scheduleSave(id) {
  clearTimeout(saveTimers.get(id))
  saveTimers.set(
    id,
    setTimeout(() => {
      const room = rooms.get(id)
      if (!room) return
      try {
        fs.writeFileSync(snapPath(id), JSON.stringify(room.getCurrentSnapshot()))
        touch(id)
      } catch (e) {
        console.error(`[whiteboard] save failed for ${id}:`, e.message)
      }
    }, 800),
  )
}

// ---- public API -----------------------------------------------------------
export function listBoards() {
  return index
    .slice()
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .map((b) => ({ id: b.id, name: b.name, updatedAt: b.updatedAt, shapes: shapeCount(b.id) }))
}

function shapeCount(id) {
  const room = rooms.get(id)
  const snap = room ? room.getCurrentSnapshot() : readSnapshot(id)
  if (!snap?.documents) return 0
  return snap.documents.filter((d) => d.state?.typeName === 'shape').length
}

export function boardExists(id) {
  return index.some((b) => b.id === id)
}

// Find a board by id (exact) or name (case-insensitive). Returns [] / [one] / [many].
export function findBoards(query) {
  const q = String(query || '').trim().toLowerCase()
  const byId = index.find((b) => b.id.toLowerCase() === q)
  if (byId) return [{ id: byId.id, name: byId.name }]
  return index.filter((b) => b.name.toLowerCase() === q).map((b) => ({ id: b.id, name: b.name }))
}

export function createBoard(name) {
  const clean = String(name || '').trim() || 'Untitled'
  const id = slugify(clean)
  const now = Date.now()
  index.push({ id, name: clean, createdAt: now, updatedAt: now })
  saveIndex(index)
  return { id, name: clean }
}

export function renameBoard(id, name) {
  const b = index.find((x) => x.id === id)
  if (!b) throw new Error(`board ${id} not found`)
  b.name = String(name || '').trim() || b.name
  b.updatedAt = Date.now()
  saveIndex(index)
  return { id: b.id, name: b.name }
}

export function deleteBoard(id) {
  const room = rooms.get(id)
  if (room) {
    try { room.close() } catch {}
    rooms.delete(id)
  }
  clearTimeout(saveTimers.get(id))
  try { fs.rmSync(snapPath(id)) } catch {}
  index = index.filter((b) => b.id !== id)
  saveIndex(index)
  return { deleted: id }
}

// Get (or lazily create + load) the room for a board id. Auto-registers a board
// entry for ids that arrive via a raw WS connect (name defaults to the id).
export function getRoom(id) {
  let room = rooms.get(id)
  if (room) return room
  if (!boardExists(id)) {
    const now = Date.now()
    index.push({ id, name: id, createdAt: now, updatedAt: now })
    saveIndex(index)
  }
  const initialSnapshot = readSnapshot(id) || undefined
  room = new TLSocketRoom({ schema, initialSnapshot, onDataChange: () => scheduleSave(id) })
  rooms.set(id, room)
  return room
}
