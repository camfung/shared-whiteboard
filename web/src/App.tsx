import { useCallback, useEffect, useState } from 'react'
import { Tldraw, defaultShapeUtils, defaultBindingUtils } from 'tldraw'
import { useSync } from '@tldraw/sync'
import { inlineBase64AssetStore } from '@tldraw/editor'
import 'tldraw/tldraw.css'
import './hurmit.css' // override tldraw fonts with Hurmit (after tldraw.css)
import { UmlShapeUtil } from './uml'

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
function BoardCanvas({ boardId }: { boardId: string }) {
  const store = useSync({ uri: WS(boardId), assets: inlineBase64AssetStore, shapeUtils: SHAPE_UTILS, bindingUtils: BINDING_UTILS })
  return <Tldraw store={store} shapeUtils={SHAPE_UTILS} bindingUtils={BINDING_UTILS} onMount={(editor) => { (window as any).editor = editor }} />
}

type Template = { name: string; shapes: number }

export default function App() {
  const [boards, setBoards] = useState<Board[]>([])
  const [current, setCurrent] = useState<string | null>(hashBoard())
  const [templates, setTemplates] = useState<Template[]>([])
  const [copied, setCopied] = useState(false)

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
  }

  const renameBoard = async () => {
    if (!current) return
    const b = boards.find((x) => x.id === current)
    const name = prompt('Rename board:', b?.name || '')
    if (!name) return
    await fetch(`${API}/boards/rename`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: current, name }) })
    refresh()
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
      <div style={bar}>
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
        <span style={{ width: 1, height: 20, background: '#c7cbb8' }} />
        <button style={btn} onClick={addUml} disabled={!current}>＋ UML</button>
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
        {current ? (
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
