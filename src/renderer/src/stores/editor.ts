/**
 * Active-editor registry.
 *
 * The query editor (Monaco) registers itself here on mount. Other UI — the
 * command palette, the run-selection action, the CodeLens provider — pulls
 * the live instance and the Monaco namespace from here, so we never have to
 * thread refs through props or hoist Monaco awareness into App-level state.
 *
 * Kept outside of zustand's reactive layer (refs, not state) because Monaco
 * editor instances are mutable objects with their own change events; storing
 * them in reactive state would re-render every subscriber on every keystroke.
 */
import type { Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

type AnyEditor = editor.IStandaloneCodeEditor
type AnyMonaco = Monaco

interface Registered {
  editor: AnyEditor
  monaco: AnyMonaco
  /** Tab id this editor belongs to, so palette commands can target it. */
  tabId: string
}

let current: Registered | null = null
const listeners = new Set<() => void>()

function notify() { for (const l of listeners) l() }

export const editorRegistry = {
  register(reg: Registered) {
    current = reg
    notify()
  },
  unregister(tabId: string) {
    if (current?.tabId === tabId) {
      current = null
      notify()
    }
  },
  get(): Registered | null {
    return current
  },
  subscribe(fn: () => void) {
    listeners.add(fn)
    return () => { listeners.delete(fn) }
  },

  /**
   * Returns the SQL the user has visually selected, trimmed. Empty string when
   * there's no selection (or just a cursor with no range). The query runner
   * uses this to support "run selected query only", VS-Code-style.
   */
  getSelectedSql(): string {
    if (!current) return ''
    const sel = current.editor.getSelection()
    if (!sel || sel.isEmpty()) return ''
    const model = current.editor.getModel()
    if (!model) return ''
    return model.getValueInRange(sel).trim()
  },

  /** Returns Monaco's full action list for the active editor (id + label). */
  listActions(): { id: string; label: string }[] {
    if (!current) return []
    return current.editor.getSupportedActions().map(a => ({ id: a.id, label: a.label }))
  },

  /** Runs a Monaco action by id on the active editor (no-op if not present). */
  runAction(id: string): void {
    if (!current) return
    const action = current.editor.getAction(id)
    if (action) void action.run()
  }
}
