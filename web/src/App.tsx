import { useCallback, useEffect, useState } from 'react'
import { Tldraw, defaultShapeUtils, defaultBindingUtils } from 'tldraw'
import { useSync } from '@tldraw/sync'
import { inlineBase64AssetStore } from '@tldraw/editor'
import 'tldraw/tldraw.css'
import './hurmit.css' // override tldraw fonts with Hurmit (after tldraw.css)
import { UmlShapeUtil } from './uml'
import { BoardManager } from './BoardManager'

// Full util sets — the custom uml shape alongside the defaults. useSync builds
// the store schema from these (it replaces, not merges, so defaults must be
// included); the same lists go to Tldraw for rendering. Matches the server schema.
const SHAPE_UTILS = [...defaultShapeUtils, UmlShapeUtil]
const BINDING_UTILS = defaultBindingUtils

const API = `http://${location.hostname}:5858`
const WS = (id: string) => `ws://${location.hostname}:5858/connect/${encodeURIComponent(id)}`

type Board = { id: string; name: string; shapes: number; updatedAt: number }

function hashBoard(): string | null {
  const m = location.hash.match(/board=([^&]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

// The canvas is a separate component keyed by board id, so switching boards
// tears down and recreates the sync connection.
const NODE_TYPES = new Set(['geo', 'uml', 'note', 'text'])

// Make containers behave like frames: when a container box (one enclosing other
// nodes) is DRAGGED (translated), its contents move with it — but when it's
// RESIZED, the contents are left alone. The container itself stays a single
// selection, so resizing scales only the frame, not the nodes inside.
// Uses a source:'user' store listener so remote (synced) edits never re-trigger
// it (no cross-client feedback loop).
function installContainerDrag(editor: any) {
  let busy = false
  return editor.store.listen((entry: any) => {
    if (busy) return
    const updated = entry.changes?.updated
    if (!updated) return
    const moves: any[] = []
    for (const id in updated) {
      const [from, to] = updated[id]
      if (!from || !to || to.typeName !== 'shape' || !NODE_TYPES.has(to.type)) continue
      if (from.props?.w == null || to.props?.w == null) continue
      const dx = to.x - from.x, dy = to.y - from.y
      if (dx === 0 && dy === 0) continue                                   // not a move
      if (from.props.w !== to.props.w || from.props.h !== to.props.h) continue // resize → leave contents
      // shapes enclosed by the container's PREVIOUS bounds (contents haven't moved yet)
      const px = from.x, py = from.y, pw = from.props.w, ph = from.props.h
      for (const s of editor.getCurrentPageShapes()) {
        if (s.id === id || !NODE_TYPES.has(s.type) || s.props?.w == null) continue
        const b = editor.getShapePageBounds(s.id)
        if (b && b.x >= px - 0.5 && b.y >= py - 0.5 && b.maxX <= px + pw + 0.5 && b.maxY <= py + ph + 0.5) {
          moves.push({ id: s.id, type: s.type, x: s.x + dx, y: s.y + dy })
        }
      }
    }
    if (moves.length) { busy = true; try { editor.updateShapes(moves) } finally { busy = false } }
  }, { source: 'user', scope: 'document' })
}

function BoardCanvas({ boardId }: { boardId: string }) {
  const store = useSync({ uri: WS(boardId), assets: inlineBase64AssetStore, shapeUtils: SHAPE_UTILS, bindingUtils: BINDING_UTILS })
  return <Tldraw store={store} shapeUtils={SHAPE_UTILS} bindingUtils={BINDING_UTILS} onMount={(editor) => { (window as any).editor = editor; return installContainerDrag(editor) }} />
}

type Template = { name: string; shapes: number }

export default function App() {
  const [boards, setBoards] = useState<Board[]>([])
  const [current, setCurrent] = useState<string | null>(hashBoard())
  const [view, setView] = useState<'board' | 'manager'>('board')
  const [templates, setTemplates] = useState<Template[]>([])
  const [copied, setCopied] = useState(false)
  const [minGap, setMinGap] = useState(60)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${API}/boards`)
      const data = await res.json()
      if (Array.isArray(data.boards)) {
        setBoards(data.boards)
        return data.boards as Board[]
      }
    } catch {
      /* backend momentarily down (e.g. restart) — keep the current list */
    }
    return [] as Board[]
  }, [])

  const refreshTemplates = useCallback(async () => {
    try {
      const { templates } = await (await fetch(`${API}/templates`)).json()
      if (Array.isArray(templates)) setTemplates(templates)
    } catch { /* ignore transient */ }
  }, [])

  // initial load + light polling so boards/templates made elsewhere appear
  useEffect(() => {
    let alive = true
    ;(async () => {
      const bs = await refresh()
      await refreshTemplates()
      if (!alive) return
      setCurrent((c) => c || hashBoard() || bs[0]?.id || null)
    })()
    const t = setInterval(() => { refresh(); refreshTemplates() }, 4000)
    return () => { alive = false; clearInterval(t) }
  }, [refresh, refreshTemplates])

  // keep the URL hash in sync with the selection (reload-safe, shareable)
  useEffect(() => { if (current) location.hash = `board=${encodeURIComponent(current)}` }, [current])

  const select = (id: string) => setCurrent(id)

  const copyId = async () => {
    if (!current || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(current)
      setCopied(true)
      setTimeout(() => setCopied(false), 1000)
    } catch { /* clipboard blocked — ignore */ }
  }

  const addUml = () => {
    const ed = (window as any).editor
    if (!ed) return
    const b = ed.getViewportPageBounds()
    ed.createShape({ type: 'uml', x: b.midX - 120, y: b.midY - 60 })
  }

  // "Space nodes" — push nodes apart to a minimum gap.
  //  - Selection includes a container (box enclosing other nodes): space just
  //    THAT container's contents and grow it, keeping it anchored. (Grabbing a
  //    container auto-selects its contents, so clicking a container then Space
  //    tidies only that container.)
  //  - Selection of loose shapes: space just those (flat).
  //  - No selection: lay out the whole board hierarchically — children spaced,
  //    each container grown to wrap them, then containers spaced against each
  //    other (contents move with them).
  //  Undoable in-canvas with Ctrl/Cmd-Z.
  const spaceNodes = () => {
    const ed = (window as any).editor
    if (!ed) return
    const input = prompt('Minimum gap between nodes (px):', String(minGap))
    if (input == null) return
    const gap = Math.max(0, Number(input) || 0)
    setMinGap(gap)
    const PAD = Math.max(16, Math.round(gap / 2)) // padding a container keeps around its contents

    type R = { id: string; type: string; x: number; y: number; w: number; h: number }
    const NODE = new Set(['geo', 'uml', 'note', 'text'])
    const rects: R[] = ed.getCurrentPageShapes()
      .filter((s: any) => NODE.has(s.type))
      .map((s: any) => { const b = ed.getShapePageBounds(s.id); return b ? { id: s.id, type: s.type, x: b.x, y: b.y, w: b.w, h: b.h } : null })
      .filter(Boolean)
    if (rects.length < 2) { alert('Need at least 2 nodes to space.'); return }
    const byId = new Map<string, R>(rects.map((r) => [r.id, r]))

    // relaxation over a set of sibling rects; `move` lets a container drag its subtree
    const separate = (members: R[], move: (r: R, dx: number, dy: number) => void) => {
      for (let it = 0; it < 400; it++) {
        let moved = false
        for (let i = 0; i < members.length; i++) {
          for (let j = i + 1; j < members.length; j++) {
            const A = members[i], B = members[j]
            const dx = (B.x + B.w / 2) - (A.x + A.w / 2)
            const dy = (B.y + B.h / 2) - (A.y + A.h / 2)
            const ox = (A.w + B.w) / 2 + gap - Math.abs(dx)
            const oy = (A.h + B.h) / 2 + gap - Math.abs(dy)
            if (ox > 0 && oy > 0) {
              if (ox <= oy) { const p = (ox / 2) * (dx < 0 ? -1 : 1); move(A, -p, 0); move(B, p, 0) }
              else { const p = (oy / 2) * (dy < 0 ? -1 : 1); move(A, 0, -p); move(B, 0, p) }
              moved = true
            }
          }
        }
        if (!moved) break
      }
    }

    // ---- containment graph over all node rects ----
    const areaOf = (r: R) => r.w * r.h
    const contains = (a: R, b: R) => a.id !== b.id && a.x <= b.x + 0.5 && a.y <= b.y + 0.5 && a.x + a.w >= b.x + b.w - 0.5 && a.y + a.h >= b.y + b.h - 0.5
    const parent = new Map<string, R | null>()
    for (const r of rects) {
      let best: R | null = null
      for (const c of rects) if (contains(c, r) && (!best || areaOf(c) < areaOf(best))) best = c
      parent.set(r.id, best)
    }
    const children = new Map<string, R[]>()
    for (const r of rects) { const p = parent.get(r.id); if (p) { const a = children.get(p.id) || []; a.push(r); children.set(p.id, a) } }
    const isContainer = (r: R) => children.has(r.id)
    const descendants = (r: R): R[] => { const out: R[] = []; const st = [...(children.get(r.id) || [])]; while (st.length) { const x = st.pop() as R; out.push(x); if (children.has(x.id)) st.push(...(children.get(x.id) as R[])) } return out }
    const move = (r: R, dx: number, dy: number) => { r.x += dx; r.y += dy; if (isContainer(r)) for (const d of descendants(r)) { d.x += dx; d.y += dy } }
    const grow = (c: R) => {
      const kids = children.get(c.id) as R[]
      if (!kids.length) return
      const minX = Math.min(...kids.map((k) => k.x)), minY = Math.min(...kids.map((k) => k.y))
      const maxX = Math.max(...kids.map((k) => k.x + k.w)), maxY = Math.max(...kids.map((k) => k.y + k.h))
      c.x = minX - PAD; c.y = minY - PAD; c.w = (maxX - minX) + 2 * PAD; c.h = (maxY - minY) + 2 * PAD
    }
    const layout = (members: R[]) => {
      for (const m of members) if (isContainer(m)) { layout(children.get(m.id) as R[]); grow(m) }
      if (members.length > 1) separate(members, move)
    }
    const toUpdate = (r: R) => {
      const u: any = { id: r.id, type: r.type, x: Math.round(r.x), y: Math.round(r.y) }
      if (isContainer(r) && r.type === 'geo') u.props = { w: Math.round(r.w), h: Math.round(r.h) }
      return u
    }

    const sel = new Set<string>(ed.getSelectedShapeIds())
    if (sel.size) {
      // top-level selected containers (a selected box enclosing other selected boxes)
      const selContainers = rects.filter((r) => sel.has(r.id) && isContainer(r))
      const topC = selContainers.filter((c) => !selContainers.some((o) => o !== c && contains(o, c)))
      if (topC.length) {
        const affected = new Set<string>()
        for (const c of topC) {
          const ox = c.x, oy = c.y
          layout(children.get(c.id) as R[]) // space this container's contents
          grow(c)                            // wrap them
          move(c, ox - c.x, oy - c.y)        // re-anchor the container's top-left
          affected.add(c.id)
          for (const d of descendants(c)) affected.add(d.id)
        }
        ed.updateShapes([...affected].map((id) => toUpdate(byId.get(id) as R)))
        return
      }
      // no container in selection → flat-space the selected shapes
      const movers = rects.filter((r) => sel.has(r.id))
      if (movers.length < 2) { alert('Select 2+ shapes (or a container) to space, or clear the selection to tidy the whole board.'); return }
      separate(movers, (r, dx, dy) => { r.x += dx; r.y += dy })
      ed.updateShapes(movers.map(toUpdate))
      return
    }

    // no selection → whole-board hierarchical layout
    layout(rects.filter((r) => !parent.get(r.id)))
    ed.updateShapes(rects.map(toUpdate))
  }

  const saveTemplate = async () => {
    const ed = (window as any).editor
    if (!ed) return
    const ids: string[] = ed.getSelectedShapeIds()
    if (!ids.length) { alert('Select one or more shapes first, then save as template.'); return }
    const name = prompt('Template name:')
    if (!name) return
    const idSet = new Set(ids)
    const shapes = ids.map((id) => ed.getShape(id)).filter(Boolean)
    const bindings = ed.store.allRecords().filter((r: any) => r.typeName === 'binding' && idSet.has(r.fromId) && idSet.has(r.toId))
    await fetch(`${API}/templates`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, records: [...shapes, ...bindings] }) })
    refreshTemplates()
  }

  const stampTemplate = async (name: string) => {
    if (!name || !current) return
    const ed = (window as any).editor
    const b = ed?.getViewportPageBounds()
    const x = b ? b.midX - 100 : 100
    const y = b ? b.midY - 60 : 100
    await fetch(`${API}/templates/stamp?board=${encodeURIComponent(current)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, x, y }) })
  }

  const newBoard = async () => {
    const name = prompt('New board name:')
    if (!name) return
    const b = await (await fetch(`${API}/boards`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name }) })).json()
    await refresh()
    setCurrent(b.id)
    setView('board') // land in the freshly created board (also when created from the manager)
  }

  const renameBoardById = async (id: string) => {
    const b = boards.find((x) => x.id === id)
    const name = prompt('Rename board:', b?.name || '')
    if (!name) return
    await fetch(`${API}/boards/rename`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, name }) })
    refresh()
  }

  const renameBoard = () => { if (current) renameBoardById(current) }

  const deleteBoard = async (id: string) => {
    await fetch(`${API}/boards/delete`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) })
    await refresh()
    if (id === current) setCurrent(null)
  }

  const bar: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px',
    borderBottom: '1px solid #d8dbcf', background: '#eef0e6', fontSize: 13,
    fontFamily: "'Hurmit Nerd Font', ui-monospace, monospace", color: '#3a3f2f',
  }
  const btn: React.CSSProperties = {
    fontFamily: 'inherit', fontSize: 13, padding: '3px 10px', cursor: 'pointer',
    border: '1px solid #b7bca8', borderRadius: 6, background: '#f7f8f1', color: '#3a3f2f',
  }
  const chip: React.CSSProperties = {
    fontFamily: 'inherit', fontSize: 11, padding: '2px 8px', cursor: 'pointer',
    border: '1px solid #b7bca8', borderRadius: 999, background: '#f7f8f1', color: '#3a3f2f',
    opacity: 0.85, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 5,
  }

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column' }}>
      <div className="wb-chrome" style={bar}>
        <strong style={{ letterSpacing: 0.3 }}>▦ whiteboard</strong>
        <span style={{ opacity: 0.6 }}>board:</span>
        <select value={current ?? ''} onChange={(e) => select(e.target.value)} style={{ ...btn, minWidth: 180 }}>
          {boards.length === 0 && <option value="">— none —</option>}
          {boards.map((b) => (
            <option key={b.id} value={b.id}>{b.name} · {b.shapes}</option>
          ))}
        </select>
        {current && (
          <span
            className="wb-chip"
            style={chip}
            onClick={copyId}
            title="Copy this board's id"
            role="button"
          >
            {copied ? 'copied ✓' : <>{current} <span style={{ opacity: 0.6 }}>⧉</span></>}
          </span>
        )}
        <button style={btn} onClick={newBoard}>＋ new</button>
        <button style={btn} onClick={renameBoard} disabled={!current}>✎ rename</button>
        <button style={btn} onClick={() => setView('manager')} title="Browse all boards as a gallery">⊞ boards</button>
        <span style={{ width: 1, height: 20, background: '#c7cbb8' }} />
        <button style={btn} onClick={addUml} disabled={!current}>＋ UML</button>
        <button style={btn} onClick={spaceNodes} disabled={!current} title="Space nodes apart to a minimum gap — selected shapes, or all nodes (container frames stay put)">⇔ space</button>
        <span style={{ width: 1, height: 20, background: '#c7cbb8' }} />
        <button style={btn} onClick={saveTemplate} disabled={!current} title="Save selected shapes as a reusable template">💾 save tmpl</button>
        <select
          value=""
          disabled={!current || templates.length === 0}
          onChange={(e) => { const n = e.target.value; e.target.value = ''; stampTemplate(n) }}
          style={{ ...btn, minWidth: 120 }}
          title="Stamp a saved template onto this board"
        >
          <option value="">stamp ▾</option>
          {templates.map((t) => <option key={t.name} value={t.name}>{t.name} · {t.shapes}</option>)}
        </select>
        {!current && (
          <span style={{ marginLeft: 'auto', opacity: 0.5 }}>
            select or create a board
          </span>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {view === 'manager' ? (
          <BoardManager
            boards={boards}
            api={API}
            onOpen={(id) => { setCurrent(id); setView('board') }}
            onCreate={newBoard}
            onRename={(id) => renameBoardById(id)}
            onDelete={deleteBoard}
          />
        ) : current ? (
          <BoardCanvas key={current} boardId={current} />
        ) : (
          <div style={{ display: 'grid', placeItems: 'center', height: '100%', fontFamily: "'Hurmit Nerd Font', monospace", color: '#6b7059' }}>
            <div style={{ textAlign: 'center' }}>
              <p>No board selected.</p>
              <button style={btn} onClick={newBoard}>＋ create a board</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
