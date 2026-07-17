// Custom "uml" shape schema — MUST stay structurally identical to the browser's
// UmlShapeUtil (web/src/uml.tsx): same prop keys + validator types, no custom
// migrations on either side, so the synced schemas match. If you change props
// here, change them there too.
import { T } from '@tldraw/validate'

export const umlProps = {
  name: T.string,
  fields: T.arrayOf(T.string),
  methods: T.arrayOf(T.string),
  w: T.number,
  h: T.number,
  color: T.string,
}

// Height that fits the header + field rows + divider + method rows. Kept in sync
// with the browser so server-created blocks aren't clipped.
export function umlHeight(fields = [], methods = []) {
  const rows = fields.length + methods.length
  return 36 + rows * 20 + (methods.length ? 12 : 0) + 12
}

// Width that fits the widest row (title / field / method). 12px Hurmit is
// monospace, so ~7.6px/char is a good estimate. Kept in sync with the browser.
export function umlWidth(name = '', fields = [], methods = []) {
  const rows = [name, ...fields, ...methods]
  const maxLen = Math.max(8, ...rows.map((r) => String(r).length))
  return Math.max(180, Math.round(maxLen * 7.6) + 28)
}
