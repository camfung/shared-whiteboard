// Custom "borderLabel" shape schema — MUST stay structurally identical to the
// browser's BorderLabelShapeUtil (web/src/borderLabel.tsx): same prop keys +
// validator types, no custom migrations on either side, so the synced schemas
// match. If you change props here, change them there too.
import { T } from '@tldraw/validate'

export const borderLabelProps = {
  label: T.string,
  value: T.string,
  w: T.number,
  h: T.number,
  color: T.string,
}

// Monospace Hurmit metrics. Box fits the value on one line (and never clips the
// legend); w acts as a minimum. Height is fixed. Kept in sync with the browser.
const VALUE_FS = 18
const LABEL_FS = 12
const CHAR = 0.66      // Hurmit advance ≈ 0.63em; padded so the value never clips
const PAD_X = 34
const MIN_W = 150
const HEIGHT = 64

export function borderLabelSize(label = '', value = '', w) {
  const valueW = String(value).length * VALUE_FS * CHAR
  const labelW = String(label).length * LABEL_FS * CHAR + 24 // legend text + side padding
  const fit = Math.max(MIN_W, Math.ceil(Math.max(valueW, labelW)) + PAD_X)
  return { w: Math.max(fit, w ? Math.round(w) : 0), h: HEIGHT }
}
