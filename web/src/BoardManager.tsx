import { useEffect, useRef, useState } from 'react'
import { PALETTE, type Theme } from './theme'

// A board summary as delivered by GET /boards.
type Board = { id: string; name: string; shapes: number; updatedAt: number }

// A shape as delivered by GET /board?board=<id>. Boxes carry numeric x/y/w/h;
// arrows carry a `link` referencing the ids of the shapes they connect.
type Shape = {
  id: string
  type: string
  geo?: string
  x?: number
  y?: number
  w?: number
  h?: number
  color?: string
  text?: string
  name?: string
  fields?: string[]
  methods?: string[]
  link?: { start: string; end: string }
}

type Props = {
  boards: Board[]
  api: string
  theme: Theme
  onOpen: (id: string) => void
  onCreate: () => void
  onRename: (id: string) => void
  onDelete: (id: string) => void
}

// tldraw palette → hex. Fills use the same hex at ~18% alpha.
const COLORS: Record<string, string> = {
  black: '#1d1d1d',
  grey: '#9fa8b2',
  'light-violet': '#e085f4',
  violet: '#ae3ec9',
  blue: '#4465e9',
  'light-blue': '#4ba1f1',
  yellow: '#f1ac4b',
  orange: '#e16919',
  green: '#099268',
  'light-green': '#4cb05e',
  'light-red': '#f87777',
  red: '#e03131',
}
const DEFAULT_COLOR = '#9fa8b2'
const hex = (c?: string) => COLORS[c ?? ''] ?? DEFAULT_COLOR

const isNum = (n: unknown): n is number => typeof n === 'number' && isFinite(n)
const sized = (s?: Shape) => !!s && isNum(s.x) && isNum(s.y) && isNum(s.w) && isNum(s.h) && (s.w as number) > 0 && (s.h as number) > 0

// short relative time, e.g. "3m ago", "2d ago", falling back to a date
function shortTime(ts: number): string {
  if (!ts) return ''
  const s = Math.round((Date.now() - ts) / 1000)
  if (s < 60) return `${Math.max(s, 0)}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(ts).toLocaleDateString()
}

// A lightweight schematic SVG of a board — translucent rects for boxes, thin
// lines between the centers of linked shapes for arrows. No tldraw involved.
function Thumb({ shapes }: { shapes: Shape[] | undefined }) {
  if (shapes === undefined) return <div style={muted}>…</div>

  const boxes = shapes.filter(sized)
  if (!boxes.length) return <div style={muted}>empty</div>

  const minX = Math.min(...boxes.map((s) => s.x!))
  const minY = Math.min(...boxes.map((s) => s.y!))
  const maxX = Math.max(...boxes.map((s) => s.x! + s.w!))
  const maxY = Math.max(...boxes.map((s) => s.y! + s.h!))
  const w = maxX - minX || 1
  const h = maxY - minY || 1
  const padX = w * 0.05
  const padY = h * 0.05
  const viewBox = `${minX - padX} ${minY - padY} ${w + padX * 2} ${h + padY * 2}`
  const sw = Math.max(w, h) / 200 // stroke width in board units, so it scales sanely

  const byId = new Map(shapes.map((s) => [s.id, s]))
  const center = (s?: Shape) => (sized(s) ? { cx: s!.x! + s!.w! / 2, cy: s!.y! + s!.h! / 2 } : null)
  const arrows = shapes
    .filter((s) => s.link)
    .map((s) => ({ a: center(byId.get(s.link!.start)), b: center(byId.get(s.link!.end)), color: hex(s.color), id: s.id }))
    .filter((e) => e.a && e.b)

  return (
    <svg viewBox={viewBox} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
      {boxes.map((s) => (
        <rect key={s.id} x={s.x} y={s.y} width={s.w} height={s.h} rx={3} fill={hex(s.color)} fillOpacity={0.18} stroke={hex(s.color)} strokeWidth={sw} />
      ))}
      {arrows.map((e) => (
        <line key={e.id} x1={e.a!.cx} y1={e.a!.cy} x2={e.b!.cx} y2={e.b!.cy} stroke={e.color} strokeWidth={sw} strokeOpacity={0.7} />
      ))}
    </svg>
  )
}

export function BoardManager({ boards, api, theme, onOpen, onCreate, onRename, onDelete }: Props) {
  const p = PALETTE[theme]
  // Cached per-board shape lists for thumbnails. Key present = loaded (possibly
  // empty); key absent = still loading (renders "…").
  const [thumbs, setThumbs] = useState<Record<string, Shape[]>>({})
  const fetched = useRef<Set<string>>(new Set())

  // Fetch summaries for any board we haven't fetched yet, in parallel. Re-runs
  // when the board list changes (poll / create / delete) but only fetches the
  // newcomers.
  useEffect(() => {
    let alive = true
    const missing = boards.filter((b) => !fetched.current.has(b.id))
    if (!missing.length) return
    missing.forEach((b) => fetched.current.add(b.id))
    ;(async () => {
      const results = await Promise.all(
        missing.map(async (b) => {
          try {
            const res = await fetch(`${api}/board?board=${encodeURIComponent(b.id)}`)
            const data = await res.json()
            return [b.id, Array.isArray(data.shapes) ? (data.shapes as Shape[]) : []] as const
          } catch {
            fetched.current.delete(b.id) // allow a later retry
            return null
          }
        }),
      )
      if (!alive) return
      setThumbs((prev) => {
        const next = { ...prev }
        for (const r of results) if (r) next[r[0]] = r[1]
        return next
      })
    })()
    return () => {
      alive = false
    }
  }, [boards, api])

  const sorted = [...boards].sort((a, b) => b.updatedAt - a.updatedAt)

  // layout consts below are color-neutral; tint the ones that carry surfaces.
  const gridS: React.CSSProperties = { ...grid, background: p.appBg, color: p.text }
  const cardS: React.CSSProperties = { ...card, border: `1px solid ${p.btnBorder}`, background: p.cardBg }
  const thumbBoxS: React.CSSProperties = { ...thumbBox, border: `1px solid ${p.thumbBorder}`, background: p.thumbBg }
  const smallBtnS: React.CSSProperties = { ...smallBtn, border: `1px solid ${p.btnBorder}`, background: p.btnBg, color: p.text }
  const newCardS: React.CSSProperties = { ...newCard, border: `1px dashed ${p.btnBorder}`, color: p.muted }

  return (
    <div style={gridS}>
      {sorted.map((b) => (
        <div key={b.id} style={cardS}>
          <div style={thumbBoxS} onClick={() => onOpen(b.id)} title="Open board">
            <Thumb shapes={thumbs[b.id]} />
          </div>
          <div style={nameStyle} onClick={() => onOpen(b.id)} title={b.name}>
            {b.name}
          </div>
          <div style={metaStyle}>
            {b.shapes} shape{b.shapes === 1 ? '' : 's'} · {shortTime(b.updatedAt)}
          </div>
          <div style={actionRow}>
            <button style={smallBtnS} onClick={() => onRename(b.id)}>
              ✎ rename
            </button>
            <button
              style={smallBtnS}
              onClick={() => {
                if (confirm(`Delete board "${b.name}"? This cannot be undone.`)) onDelete(b.id)
              }}
            >
              🗑 delete
            </button>
          </div>
        </div>
      ))}
      <div style={newCardS} onClick={onCreate} title="Create a new board" role="button">
        <span style={{ fontSize: 22, lineHeight: 1 }}>＋</span>
        <span>New board</span>
      </div>
    </div>
  )
}

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
  gap: 16,
  padding: 20,
  height: '100%',
  overflowY: 'auto',
  boxSizing: 'border-box',
  alignContent: 'start',
  background: '#f7f8f1',
  color: '#3a3f2f',
}

const card: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: 10,
  border: '1px solid #b7bca8',
  borderRadius: 10,
  background: '#f7f8f1',
}

const thumbBox: React.CSSProperties = {
  height: 150,
  border: '1px solid #d8dbcf',
  borderRadius: 8,
  background: '#fdfdf8',
  overflow: 'hidden',
  cursor: 'pointer',
  display: 'grid',
  placeItems: 'center',
}

const muted: React.CSSProperties = { fontSize: 12, opacity: 0.45 }

const nameStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const metaStyle: React.CSSProperties = { fontSize: 11, opacity: 0.6 }

const actionRow: React.CSSProperties = { display: 'flex', gap: 8, marginTop: 2 }

const smallBtn: React.CSSProperties = {
  fontFamily: 'inherit',
  fontSize: 11,
  padding: '3px 8px',
  cursor: 'pointer',
  border: '1px solid #b7bca8',
  borderRadius: 6,
  background: '#eef0e6',
  color: '#3a3f2f',
  flex: 1,
}

const newCard: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  minHeight: 150,
  border: '1px dashed #b7bca8',
  borderRadius: 10,
  background: 'transparent',
  color: '#6b7059',
  cursor: 'pointer',
}
