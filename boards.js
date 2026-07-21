// Named, persisted whiteboards.
//
// Each board is a TLSocketRoom keyed by a url-safe id. The document is written to
// data/snapshots/<id>.json (debounced) whenever it changes — from a browser OR
// from the MCP server — and reloaded on next access, so boards survive restarts.
// Board names live in data/boards.json.
import fs from 'node:fs'
import path from 'node:path'
import { TLSocketRoom } from '@tldraw/sync-core'
import { createTLSchema, defaultShapeSchemas, defaultBindingSchemas } from '@tldraw/tlschema'
import { umlProps } from './uml-schema.js'
import { DATA_DIR } from './data-dir.js'

const SNAP_DIR = path.join(DATA_DIR, 'snapshots')
const INDEX_FILE = path.join(DATA_DIR, 'boards.json')
const FOLDERS_FILE = path.join(DATA_DIR, 'folders.json')

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

// ---- folder index (id + name + timestamps) -------------------------------
// Folders are a single, flat level: a board's `folderId` is either a folder id
// or null (root). Folders never contain other folders.
function loadFolders() {
  try {
    return JSON.parse(fs.readFileSync(FOLDERS_FILE, 'utf8'))
  } catch {
    return []
  }
}
function saveFolders(f) {
  fs.writeFileSync(FOLDERS_FILE, JSON.stringify(f, null, 2))
}
let folders = loadFolders()

// A url-safe id from a name, made unique against `taken`.
function uniqueId(name, taken, fallback) {
  const base =
    String(name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || fallback
  let id = base
  let n = 2
  while (taken.has(id)) id = `${base}-${n++}`
  return id
}

function slugify(name) {
  return uniqueId(name, new Set(index.map((b) => b.id)), 'board')
}

function folderExists(id) {
  return id != null && folders.some((f) => f.id === id)
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
    .map((b) => ({ id: b.id, name: b.name, folderId: b.folderId ?? null, updatedAt: b.updatedAt, shapes: shapeCount(b.id) }))
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

export function createBoard(name, folderId) {
  const clean = String(name || '').trim() || 'Untitled'
  const id = slugify(clean)
  const now = Date.now()
  const folder = folderExists(folderId) ? folderId : null
  index.push({ id, name: clean, folderId: folder, createdAt: now, updatedAt: now })
  saveIndex(index)
  return { id, name: clean, folderId: folder }
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

// ---- folders --------------------------------------------------------------
export function listFolders() {
  return folders
    .slice()
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .map((f) => ({ id: f.id, name: f.name, updatedAt: f.updatedAt, boards: index.filter((b) => (b.folderId ?? null) === f.id).length }))
}

export function createFolder(name) {
  const clean = String(name || '').trim() || 'Untitled'
  const id = uniqueId(clean, new Set(folders.map((f) => f.id)), 'folder')
  const now = Date.now()
  folders.push({ id, name: clean, createdAt: now, updatedAt: now })
  saveFolders(folders)
  return { id, name: clean }
}

export function renameFolder(id, name) {
  const f = folders.find((x) => x.id === id)
  if (!f) throw new Error(`folder ${id} not found`)
  f.name = String(name || '').trim() || f.name
  f.updatedAt = Date.now()
  saveFolders(folders)
  return { id: f.id, name: f.name }
}

// Delete a folder AND every board inside it (recursive — closes their rooms and
// removes their snapshots). Returns the folder id plus the deleted board ids.
export function deleteFolder(id) {
  if (!folderExists(id)) throw new Error(`folder ${id} not found`)
  const inside = index.filter((b) => (b.folderId ?? null) === id).map((b) => b.id)
  for (const bid of inside) deleteBoard(bid)
  folders = folders.filter((f) => f.id !== id)
  saveFolders(folders)
  return { deleted: id, boards: inside }
}

// Move one or more boards into a folder (folderId null → root). Unknown target
// throws; unknown board ids are silently skipped.
export function moveBoards(ids, folderId) {
  const target = folderId == null ? null : folderId
  if (target != null && !folderExists(target)) throw new Error(`folder ${target} not found`)
  const set = new Set(Array.isArray(ids) ? ids : [ids])
  const now = Date.now()
  const moved = []
  for (const b of index) {
    if (!set.has(b.id)) continue
    b.folderId = target
    b.updatedAt = now
    moved.push(b.id)
  }
  saveIndex(index)
  return { moved, folderId: target }
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
