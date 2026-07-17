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

// Box that fits the text, given the *stored* (already-bumped) size + scale.
export function geoSizeForText(text = '', size = 'm', geo = 'rectangle', scale = 1) {
  const fs = (FONT_SIZES[size] || 24) * (scale || 1)
  const lines = String(text || '').split('\n')
  const maxLen = Math.max(1, ...lines.map((l) => l.length))
  // non-rectangular shapes (ellipse/diamond/…) need extra room for the label
  const roomy = geo === 'rectangle' ? 1 : 1.4
  const w = Math.round(Math.max(80, maxLen * fs * 0.62 + 32) * roomy)
  const h = Math.round(Math.max(48, lines.length * fs * 1.4 + 24) * roomy)
  return { w, h }
}

export function buildGeo({ text = '', x = 0, y = 0, w, h, geo = 'rectangle', color = 'black', fill = 'none', dash = 'draw', size = 'm', index }) {
  const { size: s, scale } = bumpSize(size)
  const fit = geoSizeForText(text, s, geo, scale)
  return baseShape('geo', x, y, index, {
    w: w ?? fit.w, h: h ?? fit.h, geo, dash, growY: 0, url: '', scale,
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

export function buildNote({ text = '', x = 0, y = 0, color = 'yellow', size = 'm', index }) {
  const { size: s, scale } = bumpSize(size)
  return baseShape('note', x, y, index, {
    color, richText: richText(text), size: s, font: 'draw',
    align: 'middle', verticalAlign: 'middle', labelColor: 'black',
    growY: 0, fontSizeAdjustment: 1, url: '', scale, textLastEditedBy: null,
  })
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
