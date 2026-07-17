// Builders that turn semantic requests into valid tldraw v5.2.5 records.
// Templates captured empirically from a live tldraw editor (see README).
import { getIndexAbove, ZERO_INDEX_KEY } from '@tldraw/utils'
import { umlHeight } from './uml-schema.js'

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

export function buildGeo({ text = '', x = 0, y = 0, w = 200, h = 120, geo = 'rectangle', color = 'black', fill = 'none', dash = 'draw', size = 'm', index }) {
  return baseShape('geo', x, y, index, {
    w, h, geo, dash, growY: 0, url: '', scale: 1,
    color, labelColor: 'black', fill, size, font: 'draw',
    align: 'middle', verticalAlign: 'middle', richText: richText(text),
  })
}

export function buildText({ text = '', x = 0, y = 0, color = 'black', size = 'm', index }) {
  return baseShape('text', x, y, index, {
    color, size, w: 8, font: 'draw', textAlign: 'start',
    autoSize: true, scale: 1, richText: richText(text),
  })
}

export function buildNote({ text = '', x = 0, y = 0, color = 'yellow', size = 'm', index }) {
  return baseShape('note', x, y, index, {
    color, richText: richText(text), size, font: 'draw',
    align: 'middle', verticalAlign: 'middle', labelColor: 'black',
    growY: 0, fontSizeAdjustment: 1, url: '', scale: 1, textLastEditedBy: null,
  })
}

export function buildUml({ name = 'ClassName', fields = [], methods = [], x = 0, y = 0, w = 220, h, color = 'blue', index }) {
  return baseShape('uml', x, y, index, {
    name, fields, methods, w,
    h: h ?? umlHeight(fields, methods),
    color,
  })
}

export function buildArrow({ text = '', color = 'black', dash = 'draw', size = 'm', index, bend = 0 }) {
  return baseShape('arrow', 0, 0, index, {
    kind: 'arc', elbowMidPoint: 0.5, dash, size, fill: 'none',
    color, labelColor: 'black', bend,
    start: { x: 0, y: 0 }, end: { x: 2, y: 0 },
    arrowheadStart: 'none', arrowheadEnd: 'arrow',
    richText: richText(text), labelPosition: 0.5, font: 'draw', scale: 1,
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
