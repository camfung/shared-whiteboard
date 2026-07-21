// Builders that turn semantic requests into valid tldraw v5.2.5 records.
// Templates captured empirically from a live tldraw editor (see README).
import { getIndexAbove, ZERO_INDEX_KEY } from '@tldraw/utils'
import { umlHeight, umlWidth } from './uml-schema.js'

export const COLORS = [
  'black', 'grey', 'light-violet', 'violet', 'blue', 'light-blue',
  'yellow', 'orange', 'green', 'light-green', 'light-red', 'red',
]
export const FILLS = ['none', 'semi', 'solid', 'pattern', 'fill']
export const GEO = [
  'rectangle', 'ellipse', 'diamond', 'triangle', 'trapezoid', 'rhombus',
  'pentagon', 'hexagon', 'octagon', 'star', 'cloud', 'x-box', 'check-box',
  'heart', 'oval',
]
export const SIZES = ['s', 'm', 'l', 'xl']
export const DASHES = ['draw', 'solid', 'dashed', 'dotted']

const rid = (p) => p + ':' + Math.random().toString(36).slice(2, 12)

// TipTap rich-text doc. Empty string -> single empty paragraph (tldraw's default).
export function richText(str) {
  const text = String(str ?? '')
  if (!text) return { type: 'doc', content: [{ type: 'paragraph' }] }
  const content = text.split('\n').map((line) =>
    line
      ? { type: 'paragraph', content: [{ type: 'text', text: line }] }
      : { type: 'paragraph' },
  )
  return { type: 'doc', content }
}

const baseShape = (type, x, y, index, props) => ({
  id: rid('shape'),
  typeName: 'shape',
  type,
  x,
  y,
  rotation: 0,
  isLocked: false,
  opacity: 1,
  meta: {},
  parentId: 'page:page',
  index,
  props,
})

// tldraw label font sizes per size step (approx, px). Hurmit is monospace, so a
// fixed char-width factor estimates the box that fits the text without wrapping.
const FONT_SIZES = { s: 18, m: 24, l: 36, xl: 44 }

// Size ladder: everything the tools create is bumped up one step (the tiny "s"
// is never used). s->m, m->l, l->xl. tldraw has no tier above xl, so a bigger
// top is done with scale. Applied once at create time.
const SIZE_UP = {
  s: { size: 'm', scale: 1 },
  m: { size: 'l', scale: 1 },
  l: { size: 'xl', scale: 1 },
  xl: { size: 'xl', scale: 1.5 },
}
export function bumpSize(size = 'm') {
  return SIZE_UP[size] || SIZE_UP.m
}

const GEO_CHAR = 0.62   // Hurmit advance factor; width & wrapping must share it
const GEO_LINE = 1.4    // line-height factor
const GEO_PAD_X = 32    // total horizontal label padding
const GEO_PAD_Y = 24    // total vertical label padding

// Box that fits the text, given the *stored* (already-bumped) size + scale.
// When targetW is given, height is sized to the text *wrapped* at that width
// (the box is pinned wide, so a long single line becomes several visual rows) —
// otherwise the box grows wide enough that no wrapping happens.
export function geoSizeForText(text = '', size = 'm', geo = 'rectangle', scale = 1, targetW = null) {
  const fs = (FONT_SIZES[size] || 24) * (scale || 1)
  const charW = fs * GEO_CHAR
  const lines = String(text || '').split('\n')
  const maxLen = Math.max(1, ...lines.map((l) => l.length))
  // non-rectangular shapes (ellipse/diamond/…) need extra room for the label
  const roomy = geo === 'rectangle' ? 1 : 1.4
  const w = targetW != null
    ? Math.max(80, targetW)
    : Math.round(Math.max(80, maxLen * charW + GEO_PAD_X) * roomy)
  // rows = wrapped line count at the effective text width (single line if unpinned)
  let rows = lines.length
  if (targetW != null) {
    const avail = Math.max(charW, w / roomy - GEO_PAD_X)
    const cpl = Math.max(1, Math.floor(avail / charW))
    rows = lines.reduce((n, l) => n + wrappedLines(l, cpl), 0)
  }
  const h = Math.round(Math.max(48, rows * fs * GEO_LINE + GEO_PAD_Y) * roomy)
  return { w, h }
}

export function buildGeo({ text = '', x = 0, y = 0, w, geo = 'rectangle', color = 'black', fill = 'none', dash = 'draw', size = 'm', index }) {
  const { size: s, scale } = bumpSize(size)
  // height always auto-fits the text; when w is set, fit to the text wrapped at that width
  const fit = geoSizeForText(text, s, geo, scale, w != null ? w : null)
  return baseShape('geo', x, y, index, {
    w: w ?? fit.w, h: fit.h, geo, dash, growY: 0, url: '', scale,
    color, labelColor: 'black', fill, size: s, font: 'draw',
    align: 'middle', verticalAlign: 'middle', richText: richText(text),
  })
}

export function buildText({ text = '', x = 0, y = 0, color = 'black', size = 'm', index }) {
  const { size: s, scale } = bumpSize(size)
  return baseShape('text', x, y, index, {
    color, size: s, w: 8, font: 'draw', textAlign: 'start',
    autoSize: true, scale, richText: richText(text),
  })
}

// tldraw note geometry (from NoteShapeUtil): a note is a fixed 200px-wide square
// that only grows *taller* to fit its text via props.growY. We let it grow
// *horizontally* too — StickyNoteUtil on the client feeds a per-note width back
// through getCustomDisplayValues keyed off shape.meta.w. The editor's auto-size
// hooks (onBeforeCreate/onBeforeUpdate) never run on records we inject into the
// sync store, so we measure the text and set both meta.w and growY here.
const NOTE_SIZE = 200                                    // base width & height
const NOTE_MAX_W = 520                                   // widen up to here, then wrap down
const NOTE_LABEL_FONT = { s: 18, m: 22, l: 26, xl: 32 }  // theme.fontSize(16) * LABEL_FONT_SIZES
const NOTE_LINE_HEIGHT = 1.35                            // theme.lineHeight
const NOTE_PADDING = 16                                  // LABEL_PADDING
const NOTE_CHAR = 0.62                                   // Hurmit advance ≈ 0.6em, padded to avoid clipping

// Visual line count for one line of text wrapped (word-aware) into `cpl` columns.
function wrappedLines(line, cpl) {
  if (!line) return 1
  let lines = 1, col = 0
  for (const word of line.split(' ')) {
    const wlen = word.length || 1
    const need = col === 0 ? wlen : col + 1 + wlen
    if (need <= cpl) { col = need; continue }
    if (col > 0) lines++                        // push word to a fresh line
    if (wlen <= cpl) { col = wlen; continue }
    lines += Math.ceil(wlen / cpl) - 1          // word longer than a line: break it
    col = wlen % cpl || cpl
  }
  return lines
}

// Pick a note width (grows outward to fit the longest line, clamped to
// [200, NOTE_MAX_W]) and the growY needed once text wraps at that width. Mirrors
// tldraw's measureNoteLabelSize; monospace Hurmit makes char-count a good proxy.
export function noteBox(text = '', size = 'm') {
  const fontSize = NOTE_LABEL_FONT[size] || NOTE_LABEL_FONT.m
  const charW = fontSize * NOTE_CHAR
  const lineHeightPx = Math.round(fontSize * NOTE_LINE_HEIGHT)
  const lines = String(text || '').split('\n')
  const longest = Math.max(1, ...lines.map((l) => l.length))
  const w = Math.min(NOTE_MAX_W, Math.max(NOTE_SIZE, Math.ceil(longest * charW + NOTE_PADDING * 2)))
  const cpl = Math.max(1, Math.floor((w - NOTE_PADDING * 2) / charW))
  const rows = lines.reduce((n, l) => n + wrappedLines(l, cpl), 0)
  const labelHeight = rows * lineHeightPx + NOTE_PADDING * 2
  return { w, growY: Math.max(0, Math.round(labelHeight - NOTE_SIZE)) }
}

export function buildNote({ text = '', x = 0, y = 0, color = 'yellow', size = 'm', index }) {
  const { size: s, scale } = bumpSize(size)
  const box = noteBox(text, s)
  const shape = baseShape('note', x, y, index, {
    color, richText: richText(text), size: s, font: 'draw',
    align: 'middle', verticalAlign: 'middle', labelColor: 'black',
    growY: box.growY, fontSizeAdjustment: 1, url: '', scale, textLastEditedBy: null,
  })
  shape.meta = { w: box.w }
  return shape
}

export function buildUml({ name = 'ClassName', fields = [], methods = [], x = 0, y = 0, w, h, color = 'blue', index }) {
  return baseShape('uml', x, y, index, {
    name, fields, methods,
    w: w ?? umlWidth(name, fields, methods),
    h: h ?? umlHeight(fields, methods),
    color,
  })
}

export function buildArrow({ text = '', color = 'black', dash = 'draw', size = 'm', index, bend = 0 }) {
  const { size: s, scale } = bumpSize(size)
  return baseShape('arrow', 0, 0, index, {
    kind: 'arc', elbowMidPoint: 0.5, dash, size: s, fill: 'none',
    color, labelColor: 'black', bend,
    start: { x: 0, y: 0 }, end: { x: 2, y: 0 },
    arrowheadStart: 'none', arrowheadEnd: 'arrow',
    richText: richText(text), labelPosition: 0.5, font: 'draw', scale,
  })
}

export function buildArrowBinding({ arrowId, shapeId, terminal }) {
  return {
    id: rid('binding'),
    typeName: 'binding',
    type: 'arrow',
    fromId: arrowId,
    toId: shapeId,
    meta: {},
    props: {
      isPrecise: false,
      isExact: false,
      normalizedAnchor: { x: 0.5, y: 0.5 },
      snap: 'none',
      terminal,
    },
  }
}

// Next fractional index above the current highest shape index.
// Fractional index keys sort lexicographically, so a plain string sort works.
export function nextIndex(existingIndexKeys) {
  const max = existingIndexKeys.filter(Boolean).sort().pop()
  return getIndexAbove(max || ZERO_INDEX_KEY)
}
