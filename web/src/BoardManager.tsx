import { useEffect, useRef, useState } from 'react'
import { PALETTE, type Theme } from './theme'

// A board summary as delivered by GET /boards. `folderId` is a folder id or null
// (root). A folder summary as delivered by GET /folders.
type Board = { id: string; name: string; folderId: string | null; shapes: number; updatedAt: number }
type Folder = { id: string; name: string; boards: number; updatedAt: number }

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
  folders: Folder[]
  api: string
  theme: Theme
  onOpen: (id: string) => void
  onCreate: (folderId?: string) => void
  onRename: (id: string) => void
  onDeleteBoards: (ids: string[]) => void
  onMoveBoards: (ids: string[], folderId: string | null) => void
  onCreateFolder: () => void
  onRenameFolder: (id: string) => void
  onDeleteFolder: (id: string) => void
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

export function BoardManager({
  boards, folders, api, theme,
  onOpen, onCreate, onRename, onDeleteBoards, onMoveBoards,
  onCreateFolder, onRenameFolder, onDeleteFolder,
}: Props) {
  const p = PALETTE[theme]
  // Cached per-board shape lists for thumbnails. Key present = loaded (possibly
  // empty); key absent = still loading (renders "…").
  const [thumbs, setThumbs] = useState<Record<string, Shape[]>>({})
  const fetched = useRef<Set<string>>(new Set())

  // Which folder is open (null = root). Selection is the set of selected board
  // ids; `anchor` is the last plainly-clicked board (shift-click range pivot).
  const [folder, setFolder] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [anchor, setAnchor] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null) // folder id or '__root__'
  const dragIds = useRef<string[]>([])

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

  // If the open folder vanishes (deleted elsewhere), fall back to root.
  useEffect(() => {
    if (folder && !folders.some((f) => f.id === folder)) setFolder(null)
  }, [folders, folder])

  // Reset selection whenever the folder view changes.
  useEffect(() => {
    setSelected(new Set())
    setAnchor(null)
  }, [folder])

  const visibleBoards = boards
    .filter((b) => (b.folderId ?? null) === folder)
    .sort((a, b) => b.updatedAt - a.updatedAt)
  const visibleFolders = folder === null ? [...folders].sort((a, b) => b.updatedAt - a.updatedAt) : []
  const orderedIds = visibleBoards.map((b) => b.id)
  const openFolder = folder ? folders.find((f) => f.id === folder) : null

  // ---- selection --------------------------------------------------------
  const toggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  const onCheckbox = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (e.shiftKey && anchor) {
      const a = orderedIds.indexOf(anchor)
      const b = orderedIds.indexOf(id)
      if (a >= 0 && b >= 0) {
        const [lo, hi] = a < b ? [a, b] : [b, a]
        setSelected((prev) => {
          const n = new Set(prev)
          for (let i = lo; i <= hi; i++) n.add(orderedIds[i])
          return n
        })
        return
      }
    }
    toggle(id)
    setAnchor(id)
  }
  const clearSel = () => {
    setSelected(new Set())
    setAnchor(null)
  }

  // ---- drag boards onto folders ----------------------------------------
  const startDrag = (id: string, e: React.DragEvent) => {
    const ids = selected.has(id) ? [...selected] : [id]
    dragIds.current = ids
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', ids.join(','))
  }
  const allowDrop = (target: string) => (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dropTarget !== target) setDropTarget(target)
  }
  const leaveDrop = (target: string) => () => setDropTarget((t) => (t === target ? null : t))
  const doDrop = (folderId: string | null) => (e: React.DragEvent) => {
    e.preventDefault()
    const ids = dragIds.current
    dragIds.current = []
    setDropTarget(null)
    if (ids.length) {
      onMoveBoards(ids, folderId)
      clearSel()
    }
  }

  const deleteFolder = (f: Folder) => {
    const suffix = f.boards ? ` and its ${f.boards} board${f.boards === 1 ? '' : 's'}` : ''
    if (confirm(`Delete folder "${f.name}"${suffix}? This cannot be undone.`)) onDeleteFolder(f.id)
  }
  const deleteSelected = () => {
    if (confirm(`Delete ${selected.size} board${selected.size === 1 ? '' : 's'}? This cannot be undone.`)) {
      onDeleteBoards([...selected])
      clearSel()
    }
  }

  // ---- styles (color-neutral base + theme tints) -----------------------
  const gridS: React.CSSProperties = { ...grid, background: p.appBg, color: p.text }
  const cardS: React.CSSProperties = { ...card, border: `1px solid ${p.btnBorder}`, background: p.cardBg }
  const thumbBoxS: React.CSSProperties = { ...thumbBox, border: `1px solid ${p.thumbBorder}`, background: p.thumbBg }
  const smallBtnS: React.CSSProperties = { ...smallBtn, border: `1px solid ${p.btnBorder}`, background: p.btnBg, color: p.text }
  const newCardS: React.CSSProperties = { ...newCard, border: `1px dashed ${p.btnBorder}`, color: p.muted }
  const barBtnS: React.CSSProperties = { ...barBtn, border: `1px solid ${p.btnBorder}`, background: p.btnBg, color: p.text }
  const barS: React.CSSProperties = { ...toolbar, background: p.cardBg, borderBottom: `1px solid ${p.btnBorder}`, color: p.text }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: p.appBg, color: p.text }}>
      {/* toolbar: breadcrumb + folder creation, or the bulk-selection bar */}
      <div style={barS}>
        {selected.size > 0 ? (
          <>
            <strong>{selected.size} selected</strong>
            <select
              value=""
              onChange={(e) => {
                const v = e.target.value
                e.currentTarget.value = ''
                if (!v) return
                onMoveBoards([...selected], v === '__root__' ? null : v)
                clearSel()
              }}
              style={barBtnS}
              title="Move selected boards to a folder"
            >
              <option value="">Move to ▾</option>
              {folder !== null && <option value="__root__">↑ Root</option>}
              {folders.filter((f) => f.id !== folder).map((f) => (
                <option key={f.id} value={f.id}>📁 {f.name}</option>
              ))}
            </select>
            <button style={barBtnS} onClick={deleteSelected}>🗑 delete</button>
            <button style={barBtnS} onClick={clearSel}>✕ clear</button>
          </>
        ) : (
          <>
            <span
              style={{ ...crumb, ...(dropTarget === '__root__' ? crumbDrop : null) }}
              onClick={() => setFolder(null)}
              onDragOver={folder !== null ? allowDrop('__root__') : undefined}
              onDragLeave={leaveDrop('__root__')}
              onDrop={folder !== null ? doDrop(null) : undefined}
              title={folder !== null ? 'Back to all boards (drop here to move to root)' : 'All boards'}
            >
              ▦ All boards
            </span>
            {openFolder && (
              <>
                <span style={{ opacity: 0.4 }}>›</span>
                <span style={{ fontWeight: 600 }}>📁 {openFolder.name}</span>
              </>
            )}
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              {folder === null && (
                <button style={barBtnS} onClick={onCreateFolder}>📁 new folder</button>
              )}
              <button style={barBtnS} onClick={() => onCreate(folder ?? undefined)}>＋ new board</button>
            </span>
          </>
        )}
      </div>

      <div style={gridS}>
        {visibleFolders.map((f) => (
          <div
            key={f.id}
            style={{ ...folderCard, border: `1px solid ${dropTarget === f.id ? p.text : p.btnBorder}`, background: dropTarget === f.id ? p.btnBg : p.cardBg }}
            onClick={() => setFolder(f.id)}
            onDragOver={allowDrop(f.id)}
            onDragLeave={leaveDrop(f.id)}
            onDrop={doDrop(f.id)}
            title={`Open folder "${f.name}"`}
          >
            <div style={folderGlyph}>📁</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={nameStyle} title={f.name}>{f.name}</div>
              <div style={metaStyle}>{f.boards} board{f.boards === 1 ? '' : 's'}</div>
            </div>
            <div style={folderActions} onClick={(e) => e.stopPropagation()}>
              <button style={smallBtnS} onClick={() => onRenameFolder(f.id)}>✎</button>
              <button style={smallBtnS} onClick={() => deleteFolder(f)}>🗑</button>
            </div>
          </div>
        ))}

        {visibleBoards.map((b) => {
          const isSel = selected.has(b.id)
          const showCheck = isSel || hovered === b.id || selected.size > 0
          return (
            <div
              key={b.id}
              style={{ ...cardS, position: 'relative', outline: isSel ? `2px solid ${p.text}` : 'none' }}
              draggable
              onDragStart={(e) => startDrag(b.id, e)}
              onMouseEnter={() => setHovered(b.id)}
              onMouseLeave={() => setHovered((h) => (h === b.id ? null : h))}
            >
              <div
                role="checkbox"
                aria-checked={isSel}
                onClick={(e) => onCheckbox(b.id, e)}
                style={{ ...checkbox, opacity: showCheck ? 1 : 0, background: isSel ? p.text : p.cardBg, color: isSel ? p.cardBg : p.muted, borderColor: p.btnBorder }}
                title="Select (shift-click for a range)"
              >
                {isSel ? '✓' : ''}
              </div>
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
                    if (confirm(`Delete board "${b.name}"? This cannot be undone.`)) onDeleteBoards([b.id])
                  }}
                >
                  🗑 delete
                </button>
              </div>
            </div>
          )
        })}

        <div style={newCardS} onClick={() => onCreate(folder ?? undefined)} title="Create a new board" role="button">
          <span style={{ fontSize: 22, lineHeight: 1 }}>＋</span>
          <span>New board</span>
        </div>
      </div>
    </div>
  )
}

const toolbar: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 20px',
  fontSize: 13,
  minHeight: 34,
  boxSizing: 'border-box',
}

const crumb: React.CSSProperties = {
  cursor: 'pointer',
  padding: '3px 8px',
  borderRadius: 6,
  fontWeight: 600,
}

const crumbDrop: React.CSSProperties = { outline: '2px dashed currentColor', outlineOffset: -2 }

const barBtn: React.CSSProperties = {
  fontFamily: 'inherit',
  fontSize: 12,
  padding: '4px 10px',
  cursor: 'pointer',
  borderRadius: 6,
}

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
  gap: 16,
  padding: 20,
  flex: 1,
  minHeight: 0,
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

const folderCard: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: 12,
  border: '1px solid #b7bca8',
  borderRadius: 10,
  background: '#f7f8f1',
  cursor: 'pointer',
  minHeight: 64,
}

const folderGlyph: React.CSSProperties = { fontSize: 30, lineHeight: 1 }

const folderActions: React.CSSProperties = { display: 'flex', gap: 6 }

const checkbox: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  left: 16,
  width: 22,
  height: 22,
  borderRadius: 6,
  border: '1px solid #b7bca8',
  display: 'grid',
  placeItems: 'center',
  fontSize: 13,
  cursor: 'pointer',
  zIndex: 2,
  transition: 'opacity 0.1s',
  userSelect: 'none',
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
