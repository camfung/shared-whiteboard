import { useEffect, useState } from 'react'
import type { Editor } from 'tldraw'

// Export a board (or selection) as PNG / JPG / SVG / PDF, drawio-style:
// a format is picked from the toolbar, then a small dialog offers scale,
// transparent background, selection-only and dark mode. Raster + SVG go
// through tldraw's native export pipeline (editor.toImage / getSvgString);
// PDF wraps a 2x PNG in a single jsPDF page sized to the image (drawio's
// "crop to content" behaviour — there is no paper size on a whiteboard).

export type ExportFormat = 'png' | 'jpg' | 'svg' | 'pdf'

type ExportOpts = {
  scale: number        // 1 | 2 | 3 — pixelRatio for raster formats
  transparent: boolean // png/svg only
  selectionOnly: boolean
  darkMode: boolean
}

const OPTS_KEY = 'wb-export-opts'

function loadOpts(): ExportOpts {
  try {
    const s = JSON.parse(localStorage.getItem(OPTS_KEY) || '')
    return { scale: [1, 2, 3].includes(s.scale) ? s.scale : 2, transparent: !!s.transparent, selectionOnly: false, darkMode: !!s.darkMode }
  } catch {
    return { scale: 2, transparent: false, selectionOnly: false, darkMode: false }
  }
}

// Safari (incl. iPad, which this app targets) silently fails above ~16.7M
// canvas pixels. Clamp the pixel ratio so bounds × scale stays under it.
const MAX_CANVAS_AREA = 16_000_000

function clampScale(editor: Editor, ids: string[] | null, scale: number): number {
  const b = ids ? editor.getSelectionPageBounds() : editor.getCurrentPageBounds()
  if (!b || b.w <= 0 || b.h <= 0) return scale
  while (scale > 1 && b.w * scale * b.h * scale > MAX_CANVAS_AREA) scale--
  return scale
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export async function exportBoard(editor: Editor, format: ExportFormat, opts: ExportOpts, boardName: string) {
  const selIds: string[] = editor.getSelectedShapeIds()
  const ids = opts.selectionOnly && selIds.length ? selIds : editor.getCurrentPageShapeIds()
  const shapeIds = [...ids]
  if (!shapeIds.length) { alert('Nothing to export — the board is empty.'); return }

  const name = `${boardName || 'board'}.${format}`
  const common = {
    darkMode: opts.darkMode,
    padding: 32,
    background: format === 'jpg' || format === 'pdf' ? true : !opts.transparent,
  }

  if (format === 'svg') {
    const res = await editor.getSvgString(shapeIds as any, common)
    if (!res) throw new Error('SVG export failed')
    download(new Blob([res.svg], { type: 'image/svg+xml' }), name)
    return
  }

  const pixelRatio = clampScale(editor, opts.selectionOnly && selIds.length ? selIds : null, opts.scale)
  const toImage = (format: 'png' | 'jpeg') =>
    editor.toImage(shapeIds as any, { ...common, format, pixelRatio, quality: 0.92 })

  if (format === 'png' || format === 'jpg') {
    const { blob } = await toImage(format === 'jpg' ? 'jpeg' : 'png')
    download(blob, name)
    return
  }

  // pdf: raster the board at the chosen scale, wrap in a single page sized to
  // it. jpeg, not png — jsPDF stores png near-uncompressed (30MB+ pages).
  const { jsPDF } = await import('jspdf')
  const { blob, width, height } = await toImage('jpeg')
  const dataUrl: string = await new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(blob)
  })
  // page in CSS px at the unscaled size, image dropped in at full resolution
  const pw = width / pixelRatio, ph = height / pixelRatio
  const pdf = new jsPDF({ orientation: pw > ph ? 'landscape' : 'portrait', unit: 'px', format: [pw, ph], hotfixes: ['px_scaling'] })
  pdf.addImage(dataUrl, 'JPEG', 0, 0, pw, ph)
  pdf.save(name)
}

export function ExportDialog({ editor, format, boardName, onClose }: {
  editor: Editor
  format: ExportFormat
  boardName: string
  onClose: () => void
}) {
  const [opts, setOpts] = useState<ExportOpts>(loadOpts)
  const [busy, setBusy] = useState(false)
  const hasSelection = editor.getSelectedShapeIds().length > 0
  const raster = format === 'png' || format === 'jpg' || format === 'pdf'
  const supportsTransparency = format === 'png' || format === 'svg'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const run = async () => {
    setBusy(true)
    try {
      localStorage.setItem(OPTS_KEY, JSON.stringify(opts))
      await exportBoard(editor, format, opts, boardName)
      onClose()
    } catch (err) {
      console.error('export failed', err)
      alert(`Export failed: ${err instanceof Error ? err.message : err}`)
      setBusy(false)
    }
  }

  const row: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }
  const btn: React.CSSProperties = {
    fontFamily: 'inherit', fontSize: 13, padding: '4px 14px', cursor: 'pointer',
    border: '1px solid #b7bca8', borderRadius: 6, background: '#f7f8f1', color: '#3a3f2f',
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(40,44,32,0.35)', zIndex: 1000, display: 'grid', placeItems: 'center' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#eef0e6', border: '1px solid #b7bca8', borderRadius: 10, padding: '16px 20px',
          minWidth: 280, fontSize: 13, color: '#3a3f2f',
          fontFamily: "'Hurmit Nerd Font', ui-monospace, monospace",
          boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 10 }}>⤓ export as {format.toUpperCase()}</div>

        {raster && (
          <label style={row}>
            <span style={{ width: 110 }}>scale</span>
            <select
              value={opts.scale}
              onChange={(e) => setOpts({ ...opts, scale: Number(e.target.value) })}
              style={{ ...btn, padding: '2px 8px' }}
            >
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={3}>3x (print)</option>
            </select>
          </label>
        )}

        {supportsTransparency && (
          <label style={row}>
            <span style={{ width: 110 }}>transparent bg</span>
            <input type="checkbox" checked={opts.transparent} onChange={(e) => setOpts({ ...opts, transparent: e.target.checked })} />
          </label>
        )}

        <label style={{ ...row, opacity: hasSelection ? 1 : 0.45 }}>
          <span style={{ width: 110 }}>selection only</span>
          <input
            type="checkbox"
            disabled={!hasSelection}
            checked={opts.selectionOnly && hasSelection}
            onChange={(e) => setOpts({ ...opts, selectionOnly: e.target.checked })}
          />
        </label>

        <label style={row}>
          <span style={{ width: 110 }}>dark mode</span>
          <input type="checkbox" checked={opts.darkMode} onChange={(e) => setOpts({ ...opts, darkMode: e.target.checked })} />
        </label>

        {format === 'jpg' && <div style={{ opacity: 0.6, fontSize: 11, marginTop: 4 }}>jpg has no transparency — background is filled</div>}
        {format === 'svg' && <div style={{ opacity: 0.6, fontSize: 11, marginTop: 4 }}>custom shapes embed as html — best viewed in a browser</div>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
          <button style={btn} onClick={onClose} disabled={busy}>cancel</button>
          <button style={{ ...btn, fontWeight: 700 }} onClick={run} disabled={busy}>
            {busy ? 'exporting…' : 'export'}
          </button>
        </div>
      </div>
    </div>
  )
}
