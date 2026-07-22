import { BaseBoxShapeUtil, HTMLContainer, T } from 'tldraw'

// Custom "border label" shape: a native <fieldset>/<legend> — the label sits in a
// real gap the browser cuts into the top border, the value shows inside.
// MUST match the backend schema in ../../borderlabel-schema.js (same prop keys,
// no migrations).

const HEX: Record<string, string> = {
  black: '#1d1d1d', grey: '#9fa8b2', 'light-violet': '#e085f4', violet: '#ae3ec9',
  blue: '#4465e9', 'light-blue': '#4ba1f1', yellow: '#f1ac4b', orange: '#e16919',
  green: '#099268', 'light-green': '#4cb05e', 'light-red': '#f87777', red: '#e03131',
}

// keep in sync with borderlabel-schema.js:borderLabelSize
const VALUE_FS = 18
const LABEL_FS = 12
const CHAR = 0.66      // Hurmit advance ≈ 0.63em; padded so the value never clips
const PAD_X = 34
const MIN_W = 150
const HEIGHT = 64
export function borderLabelSize(label = '', value = '', w?: number) {
  const valueW = String(value).length * VALUE_FS * CHAR
  const labelW = String(label).length * LABEL_FS * CHAR + 24
  const fit = Math.max(MIN_W, Math.ceil(Math.max(valueW, labelW)) + PAD_X)
  return { w: Math.max(fit, w ? Math.round(w) : 0), h: HEIGHT }
}

type BorderLabelProps = { label: string; value: string; w: number; h: number; color: string }

const FONT = "'Hurmit Nerd Font', ui-monospace, monospace"

export class BorderLabelShapeUtil extends BaseBoxShapeUtil<any> {
  static override type = 'borderLabel' as const
  static override props = {
    label: T.string,
    value: T.string,
    w: T.number,
    h: T.number,
    color: T.string,
  }

  override getDefaultProps() {
    return { label: 'Label', value: 'value', w: 220, h: HEIGHT, color: 'grey' }
  }

  override canEdit() { return true }
  override canResize() { return true }
  override getText(shape: any) { return `${shape.props.label} ${shape.props.value}` }

  override component(shape: any) {
    const editor = this.editor
    const isEditing = editor.getEditingShapeId() === shape.id
    const { label, value, color } = shape.props as BorderLabelProps
    const hex = HEX[color] || HEX.grey
    // Follow the canvas theme so the field doesn't glare on a dark board.
    const dark = editor.user.getIsDarkMode()
    const surface = dark ? '#26292b' : '#fff'
    const ink = dark ? '#e6e6e6' : '#1d1d1d'

    const frame: React.CSSProperties = {
      width: '100%', height: '100%', boxSizing: 'border-box', margin: 0,
      border: `2px solid ${hex}`, borderRadius: 8, padding: '0 14px',
      display: 'flex', alignItems: 'center', minInlineSize: 0,
      background: surface, color: ink, font: `${VALUE_FS}px ${FONT}`,
    }
    const legend: React.CSSProperties = {
      padding: '0 6px', marginLeft: 4, color: hex, fontSize: LABEL_FS, fontWeight: 600,
      lineHeight: 1, maxWidth: 'calc(100% - 24px)', whiteSpace: 'nowrap',
      overflow: 'hidden', textOverflow: 'ellipsis',
    }

    if (isEditing) {
      const stop = (e: any) => e.stopPropagation()
      const key = (e: any) => { e.stopPropagation(); if (e.key === 'Escape' || e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur() }
      const commit = (e: React.FocusEvent<HTMLFieldSetElement>) => {
        const box = e.currentTarget
        if (box.contains(e.relatedTarget as Node)) return // moving between the two inputs
        const l = (box.querySelector('.bl-label') as HTMLInputElement).value
        const v = (box.querySelector('.bl-value') as HTMLInputElement).value
        const size = borderLabelSize(l, v)
        editor.updateShape({ id: shape.id, type: 'borderLabel', props: { label: l, value: v, w: size.w, h: size.h } } as any)
        editor.setEditingShape(null)
      }
      const bare: React.CSSProperties = { background: 'transparent', border: 'none', outline: 'none', padding: 0, margin: 0 }
      return (
        <HTMLContainer style={{ pointerEvents: 'all' }}>
          <fieldset style={frame} onPointerDown={stop} onBlur={commit}>
            <legend style={legend}>
              <input className="bl-label" defaultValue={label} onPointerDown={stop} onKeyDown={key}
                style={{ ...bare, color: hex, font: `${LABEL_FS}px ${FONT}`, width: Math.max(40, (label.length + 2) * LABEL_FS * CHAR) }} />
            </legend>
            <input className="bl-value" autoFocus defaultValue={value} onPointerDown={stop} onKeyDown={key}
              style={{ ...bare, color: ink, font: `${VALUE_FS}px ${FONT}`, width: '100%' }} />
          </fieldset>
        </HTMLContainer>
      )
    }

    return (
      <HTMLContainer>
        <fieldset style={frame}>
          <legend style={legend}>{label || ' '}</legend>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{value}</span>
        </fieldset>
      </HTMLContainer>
    )
  }

  override getIndicatorPath(shape: any) {
    const p = new Path2D()
    p.roundRect(0, 0, shape.props.w, shape.props.h, 8)
    return p
  }
}
