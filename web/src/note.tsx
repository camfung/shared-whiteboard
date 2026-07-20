import { NoteShapeUtil } from 'tldraw'

// tldraw notes are hard-wired to 200px wide (NoteShapeUtil.getDefaultDisplayValues
// returns noteWidth:200) and only grow taller. We let them grow *horizontally*:
// the server measures each note's text, picks a width (200–520px), and stores it in
// shape.meta.w (see ../../shapes.js:noteBox). This util feeds that width back through
// getCustomDisplayValues so geometry, text wrapping, and rendering all honor it.
// Notes without meta.w (e.g. created with the toolbar) stay stock 200px.
export class StickyNoteUtil extends NoteShapeUtil {
  constructor(editor: any) {
    super(editor)
    this.options = {
      ...this.options,
      getCustomDisplayValues: (_editor: any, shape: any) => {
        const w = shape.meta?.w
        return typeof w === 'number' && w > 0 ? { noteWidth: w } : {}
      },
    }
  }
}
