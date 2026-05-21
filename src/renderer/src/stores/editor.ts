/**
 * Active-editor registry.
 *
 * Tracks every mounted query editor by tabId. Other UI (palette, run-selection,
 * CodeLens provider) pulls editors out either by "currently focused" (the most
 * recently registered) or by model URI (CodeLens needs to map a model Monaco
 * hands it back to the originating tab).
 *
 * Kept outside zustand's reactive layer (refs, not state) because Monaco editor
 * instances are mutable objects with their own change events; storing them in
 * reactive state would re-render every subscriber on every keystroke.
 */
import type { Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

interface Registered {
  editor: editor.IStandaloneCodeEditor
  monaco: Monaco
  tabId: string
}

const byTab = new Map<string, Registered>()
let mostRecentTabId: string | null = null
const listeners = new Set<() => void>()

function notify() { for (const l of listeners) l() }

export const editorRegistry = {
  register(reg: Registered) {
    byTab.set(reg.tabId, reg)
    mostRecentTabId = reg.tabId
    notify()
  },
  unregister(tabId: string) {
    byTab.delete(tabId)
    if (mostRecentTabId === tabId) {
      // Fall back to any remaining editor so palette commands still target something sensible.
      const next = byTab.keys().next()
      mostRecentTabId = next.done ? null : next.value
    }
    notify()
  },
  get(): Registered | null {
    if (!mostRecentTabId) return null
    return byTab.get(mostRecentTabId) ?? null
  },
  /** Look up the editor that owns a given Monaco text model URI. */
  getByModelUri(uri: string): Registered | null {
    for (const r of byTab.values()) {
      const m = r.editor.getModel()
      if (m && m.uri.toString() === uri) return r
    }
    return null
  },
  subscribe(fn: () => void) {
    listeners.add(fn)
    return () => { listeners.delete(fn) }
  },

  /**
   * Returns the SQL the user has visually selected, trimmed. Empty string when
   * there's no selection (or just a cursor with no range).
   */
  getSelectedSql(): string {
    const cur = this.get()
    if (!cur) return ''
    const sel = cur.editor.getSelection()
    if (!sel || sel.isEmpty()) return ''
    const model = cur.editor.getModel()
    if (!model) return ''
    return model.getValueInRange(sel).trim()
  },

  /** Returns Monaco's full action list for the active editor (id + label). */
  listActions(): { id: string; label: string }[] {
    const cur = this.get()
    if (!cur) return []
    return cur.editor.getSupportedActions().map((a) => ({ id: a.id, label: a.label }))
  },

  /** Runs a Monaco action by id on the active editor (no-op if not present). */
  runAction(id: string): void {
    const cur = this.get()
    if (!cur) return
    const action = cur.editor.getAction(id)
    if (action) void action.run()
  }
}
