// Reusable block templates.
//
// A template is a named bundle of shape (+ binding) records captured from a
// selection. Stamping clones the records with fresh ids, re-based to a target
// point, and drops them onto a board. Stored in data/templates.json.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getIndexAbove } from '@tldraw/utils'
import { nextIndex } from './shapes.js'

const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data')
const FILE = path.join(DATA_DIR, 'templates.json')
fs.mkdirSync(DATA_DIR, { recursive: true })

const rid = (p) => p + ':' + Math.random().toString(36).slice(2, 12)

function load() {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) } catch { return [] }
}
function save(list) { fs.writeFileSync(FILE, JSON.stringify(list, null, 2)) }
let templates = load()

export function listTemplates() {
  return templates.map((t) => ({
    name: t.name,
    shapes: t.records.filter((r) => r.typeName === 'shape').length,
    updatedAt: t.updatedAt,
  }))
}

export function saveTemplate(name, records) {
  const clean = String(name || '').trim()
  if (!clean) throw new Error('template name required')
  const shapes = (records || []).filter((r) => r?.typeName === 'shape')
  if (shapes.length === 0) throw new Error('template needs at least one shape')
  const entry = { name: clean, records, updatedAt: Date.now() }
  const i = templates.findIndex((t) => t.name.toLowerCase() === clean.toLowerCase())
  if (i >= 0) templates[i] = entry
  else templates.push(entry)
  save(templates)
  return { name: clean, shapes: shapes.length }
}

export function getTemplate(name) {
  const q = String(name || '').trim().toLowerCase()
  return templates.find((t) => t.name.toLowerCase() === q) || null
}

export function deleteTemplate(name) {
  const q = String(name || '').trim().toLowerCase()
  templates = templates.filter((t) => t.name.toLowerCase() !== q)
  save(templates)
  return { deleted: name }
}

// Clone a template's records with new ids, re-based so the selection's top-left
// lands at (x, y). Remaps binding endpoints; drops bindings whose endpoints
// aren't both in the template.
export function stampRecords(template, x, y, existingIndexKeys) {
  const shapes = template.records.filter((r) => r.typeName === 'shape')
  const bindings = template.records.filter((r) => r.typeName === 'binding')
  const minX = Math.min(...shapes.map((s) => s.x))
  const minY = Math.min(...shapes.map((s) => s.y))
  const idMap = {}
  for (const s of shapes) idMap[s.id] = rid('shape')

  const out = []
  let idx = nextIndex(existingIndexKeys)
  for (const s of shapes) {
    out.push({ ...s, id: idMap[s.id], parentId: 'page:page', index: idx, x: x + (s.x - minX), y: y + (s.y - minY) })
    idx = getIndexAbove(idx)
  }
  for (const b of bindings) {
    if (idMap[b.fromId] && idMap[b.toId]) {
      out.push({ ...b, id: rid('binding'), fromId: idMap[b.fromId], toId: idMap[b.toId] })
    }
  }
  return out
}
