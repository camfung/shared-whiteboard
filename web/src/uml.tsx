import { BaseBoxShapeUtil, HTMLContainer, T } from 'tldraw'

// Custom UML class shape: a title bar + fields compartment + methods compartment.
// MUST match the backend schema in ../../uml-schema.js (same prop keys, no migrations).

const HEX: Record<string, string> = {
  black: '#1d1d1d', grey: '#9fa8b2', 'light-violet': '#e085f4', violet: '#ae3ec9',
  blue: '#4465e9', 'light-blue': '#4ba1f1', yellow: '#f1ac4b', orange: '#e16919',
  green: '#099268', 'light-green': '#4cb05e', 'light-red': '#f87777', red: '#e03131',
}

// keep in sync with uml-schema.js:umlHeight
export function umlHeight(fields: string[] = [], methods: string[] = []) {
  const rows = fields.length + methods.length
  return 36 + rows * 20 + (methods.length ? 12 : 0) + 12
}

type UmlProps = { name: string; fields: string[]; methods: string[]; w: number; h: number; color: string }

function serialize(p: UmlProps) {
  return [p.name, '--', ...p.fields, '--', ...p.methods].join('\n')
}
function parse(text: string) {
  const parts = text.split(/^\s*--\s*$/m)
  const name = (parts[0] || '').trim() || 'ClassName'
  const fields = (parts[1] || '').split('\n').map((s) => s.trim()).filter(Boolean)
  const methods = (parts[2] || '').split('\n').map((s) => s.trim()).filter(Boolean)
  return { name, fields, methods, h: umlHeight(fields, methods) }
}

const FONT = "'Hurmit Nerd Font', ui-monospace, monospace"

export class UmlShapeUtil extends BaseBoxShapeUtil<any> {
  static override type = 'uml' as const
  static override props = {
    name: T.string,
    fields: T.arrayOf(T.string),
    methods: T.arrayOf(T.string),
    w: T.number,
    h: T.number,
    color: T.string,
  }

  override getDefaultProps() {
    const fields = ['+ id: string']
    const methods = ['+ save()']
    return { name: 'ClassName', fields, methods, w: 240, h: umlHeight(fields, methods), color: 'blue' }
  }

  override canEdit() { return true }
  override canResize() { return true }

  override component(shape: any) {
    const editor = this.editor
    const isEditing = editor.getEditingShapeId() === shape.id
    const { name, fields, methods, color } = shape.props as UmlProps
    const hex = HEX[color] || HEX.blue

    if (isEditing) {
      return (
        <HTMLContainer style={{ pointerEvents: 'all' }}>
          <textarea
            autoFocus
            defaultValue={serialize(shape.props)}
            onPointerDown={(e) => e.stopPropagation()}
            onBlur={(e) => {
              editor.updateShape({ id: shape.id, type: 'uml', props: parse(e.currentTarget.value) } as any)
              editor.setEditingShape(null)
            }}
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === 'Escape') e.currentTarget.blur()
            }}
            style={{
              width: '100%', height: '100%', boxSizing: 'border-box', border: `2px solid ${hex}`,
              borderRadius: 6, padding: 8, font: `12px ${FONT}`, resize: 'none', outline: 'none',
              background: '#fff', color: '#1d1d1d',
            }}
          />
        </HTMLContainer>
      )
    }

    const row: React.CSSProperties = { padding: '2px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
    return (
      <HTMLContainer
        style={{
          width: shape.props.w, height: shape.props.h, border: `2px solid ${hex}`, borderRadius: 6,
          background: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          font: `12px ${FONT}`, color: '#1d1d1d', boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        }}
      >
        <div style={{ background: hex, color: '#fff', fontWeight: 700, textAlign: 'center', padding: '6px 8px' }}>
          {name}
        </div>
        <div style={{ padding: '4px 0', flex: fields.length ? '0 0 auto' : undefined }}>
          {fields.map((f, i) => <div key={i} style={row}>{f}</div>)}
        </div>
        {methods.length > 0 && <div style={{ borderTop: `1px solid ${hex}` }} />}
        <div style={{ padding: '4px 0' }}>
          {methods.map((m, i) => <div key={i} style={row}>{m}</div>)}
        </div>
      </HTMLContainer>
    )
  }

  override getIndicatorPath(shape: any) {
    const p = new Path2D()
    p.roundRect(0, 0, shape.props.w, shape.props.h, 6)
    return p
  }
}
