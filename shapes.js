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
export function geoSizeForText(text = '', size = 'm', geo = 'rectangle', scale = 1, targetW = null, nowrap = false) {
  const fs = (FONT_SIZES[size] || 24) * (scale || 1)
  const charW = fs * GEO_CHAR
  const lines = String(text || '').split('\n')
  const maxLen = Math.max(1, ...lines.map((l) => l.length))
  // non-rectangular shapes (ellipse/diamond/…) need extra room for the label
  const roomy = geo === 'rectangle' ? 1 : 1.4
  // width that fits the longest line on a single line (no wrapping)
  const fitW = Math.round(Math.max(80, maxLen * charW + GEO_PAD_X) * roomy)
  let w, rows
  if (targetW != null && !nowrap) {
    // pinned width: text wraps to fit, height grows with the wrapped row count
    w = Math.max(80, targetW)
    const avail = Math.max(charW, w / roomy - GEO_PAD_X)
    const cpl = Math.max(1, Math.floor(avail / charW))
    rows = lines.reduce((n, l) => n + wrappedLines(l, cpl), 0)
  } else {
    // no wrap: fit the text on one line; a given targetW is treated as a minimum width
    w = targetW != null ? Math.max(fitW, targetW) : fitW
    rows = lines.length
  }
  const h = Math.round(Math.max(48, rows * fs * GEO_LINE + GEO_PAD_Y) * roomy)
  return { w, h }
}

export function buildGeo({ text = '', x = 0, y = 0, w, geo = 'rectangle', color = 'black', fill = 'none', dash = 'draw', size = 'm', nowrap = false, index }) {
  const { size: s, scale } = bumpSize(size)
  // height always auto-fits the text. With w set: fit to the text wrapped at that
  // width — unless nowrap, where w is a minimum and the box widens to keep one line.
  const fit = geoSizeForText(text, s, geo, scale, w != null ? w : null, nowrap)
  const shape = baseShape('geo', x, y, index, {
    w: fit.w, h: fit.h, geo, dash, growY: 0, url: '', scale,
    color, labelColor: 'black', fill, size: s, font: 'draw',
    align: 'middle', verticalAlign: 'middle', richText: richText(text),
  })
  // persist nowrap so a later text edit (update) keeps honoring single-line width
  if (nowrap) shape.meta = { nowrap: true }
  return shape
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
const NOTE_MAX_W = 900                                   // widen up to here, then wrap down
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

// Parse an SVG's intrinsic size. Prefer viewBox (its w/h are the 3rd/4th numbers);
// fall back to width/height attrs; else a square default. The sequence-diagram and
// flow-diagram skills emit viewBox-only SVGs, so viewBox is the common path.
export function svgViewBox(svg = '') {
  const s = String(svg)
  const vb = s.match(/viewBox\s*=\s*["']\s*[\d.+-]+\s+[\d.+-]+\s+([\d.]+)\s+([\d.]+)/i)
  if (vb) return { w: Math.max(1, Math.round(+vb[1])), h: Math.max(1, Math.round(+vb[2])) }
  const wm = s.match(/\bwidth\s*=\s*["']?\s*([\d.]+)/i)
  const hm = s.match(/\bheight\s*=\s*["']?\s*([\d.]+)/i)
  if (wm && hm) return { w: Math.max(1, Math.round(+wm[1])), h: Math.max(1, Math.round(+hm[1])) }
  return { w: 400, h: 300 }
}

// Embed an SVG as a tldraw image: an image ASSET (data-URI src) + an image SHAPE
// referencing it. The client's inlineBase64AssetStore returns props.src verbatim,
// so a data: URI renders with no upload. w/h default to the SVG's viewBox size.
// Returns { asset, shape } — put BOTH into the store (asset first).
export function buildSvg({ svg, x = 0, y = 0, w, h, name = 'diagram.svg', index }) {
  const str = String(svg ?? '')
  const box = svgViewBox(str)
  const W = w != null ? Math.max(1, Math.round(w)) : box.w
  const H = h != null ? Math.max(1, Math.round(h)) : box.h
  const src = 'data:image/svg+xml;base64,' + Buffer.from(str, 'utf8').toString('base64')
  const asset = {
    id: rid('asset'),
    typeName: 'asset',
    type: 'image',
    meta: {},
    props: { name, src, w: W, h: H, mimeType: 'image/svg+xml', isAnimated: false },
  }
  const shape = baseShape('image', x, y, index, {
    w: W, h: H, playing: true, url: '', assetId: asset.id,
    crop: null, flipX: false, flipY: false, altText: '',
  })
  return { asset, shape }
}

// Fieldset-style "border label" field: a rounded frame with the LABEL sitting in
// a real gap cut into the top stroke (like HTML <fieldset>/<legend>) and the
// VALUE inside. Rendered as an SVG image (reuses buildSvg), so it needs no client
// shape-util or sync-schema change. Monospace metrics size the box to the value,
// truncate an over-long label to keep the gap inside the frame, and truncate an
// over-long value with an ellipsis. w is a MINIMUM width; the box grows to fit
// the value up to BL_MAX_W. Returns { asset, shape } — put BOTH (asset first).
// Colors are baked (an image can't read the board theme): the frame + label take
// `color`, the value stays near-white for the dark canvas this board uses.
const BL_HEX = {
  grey: '#a9b0b8', black: '#d7dbe0', blue: '#6b8cff', 'light-blue': '#63b3ed',
  green: '#7cc47c', 'light-green': '#9ad19a', red: '#e06a6a', 'light-red': '#e89a9a',
  orange: '#e0975a', yellow: '#d8c25a', violet: '#b48cff', 'light-violet': '#cbb4ff',
}
const BL_LABEL_FS = 15
const BL_VALUE_FS = 24
const BL_CHAR = 0.6                 // monospace advance factor (matches SVG font)
const BL_PAD_L = 28
const BL_PAD_R = 22
const BL_MIN_W = 160
const BL_MAX_W = 680
const BL_H = 96
const BL_Y0 = 14                    // top stroke (label rides this line)
const BL_R = 14                     // corner radius
const BL_SW = 2.5                   // stroke width
const BL_GAP_X = 22                 // gap starts this far from the left corner
const BL_MIN_RSEG = 26              // min visible top-border segment right of the gap

const xmlEsc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const clip = (s, max) => (s.length > max ? s.slice(0, Math.max(1, max - 1)) + '…' : s)

export function buildBorderLabel({ label = '', value = '', x = 0, y = 0, w, color = 'grey', index }) {
  const labelCW = BL_LABEL_FS * BL_CHAR
  const valueCW = BL_VALUE_FS * BL_CHAR
  const Y1 = BL_H - 10

  const valStr = String(value ?? '')
  // width fits the value on one line, honors w as a minimum, clamped to BL_MAX_W
  const W = Math.min(BL_MAX_W, Math.max(BL_MIN_W, w ? Math.round(w) : 0, Math.ceil(valStr.length * valueCW) + BL_PAD_L + BL_PAD_R))

  const valMax = Math.max(1, Math.floor((W - BL_PAD_L - BL_PAD_R) / valueCW))
  const value2 = xmlEsc(clip(valStr, valMax))

  // label must fit the top edge and always leave a visible top-right segment
  // (BL_MIN_RSEG) so the gap never swallows the whole top border
  const rightStop = W - BL_R - BL_MIN_RSEG
  const lblMax = Math.max(1, Math.floor((rightStop - BL_GAP_X - 8) / labelCW))
  const label2 = xmlEsc(clip(String(label ?? ''), lblMax))
  const gapW = Math.ceil(label2.length * labelCW) + 12
  const gx1 = Math.min(rightStop, BL_GAP_X + gapW)

  const stroke = BL_HEX[color] || BL_HEX.grey
  const labelBase = BL_Y0 + BL_LABEL_FS * 0.34
  const valueBase = (BL_Y0 + Y1) / 2 + BL_VALUE_FS * 0.34

  // rounded frame with a gap in the top edge between BL_GAP_X and gx1
  const path = [
    `M ${gx1} ${BL_Y0}`,
    `L ${W - BL_SW - BL_R} ${BL_Y0}`,
    `A ${BL_R} ${BL_R} 0 0 1 ${W - BL_SW} ${BL_Y0 + BL_R}`,
    `L ${W - BL_SW} ${Y1 - BL_R}`,
    `A ${BL_R} ${BL_R} 0 0 1 ${W - BL_SW - BL_R} ${Y1}`,
    `L ${BL_SW + BL_R} ${Y1}`,
    `A ${BL_R} ${BL_R} 0 0 1 ${BL_SW} ${Y1 - BL_R}`,
    `L ${BL_SW} ${BL_Y0 + BL_R}`,
    `A ${BL_R} ${BL_R} 0 0 1 ${BL_SW + BL_R} ${BL_Y0}`,
    `L ${BL_GAP_X} ${BL_Y0}`,
  ].join(' ')

  const FONT = "ui-monospace,'DejaVu Sans Mono',monospace"
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${BL_H}">
  <path d="${path}" fill="none" stroke="${stroke}" stroke-width="${BL_SW}" stroke-linejoin="round" stroke-linecap="round"/>
  <text x="${BL_GAP_X + 8}" y="${labelBase}" font-family="${FONT}" font-size="${BL_LABEL_FS}" fill="${stroke}">${label2}</text>
  <text x="${BL_PAD_L}" y="${valueBase}" font-family="${FONT}" font-size="${BL_VALUE_FS}" fill="#ededed">${value2}</text>
</svg>`

  return buildSvg({ svg, x, y, w: W, h: BL_H, name: 'border-label.svg', index })
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
