import type { Monaco } from '@monaco-editor/react'
import type { editor, Position, CancellationToken, languages } from 'monaco-editor'
import { IPC_CHANNELS } from '@shared/ipc'

export type InlineAIState = 'idle' | 'thinking' | 'ready'

type Listener = (s: InlineAIState) => void

let currentConnectionId: string | null = null
let state: InlineAIState = 'idle'
const listeners = new Set<Listener>()
let debounceTimer: ReturnType<typeof setTimeout> | null = null
const ENABLED_KEY = 'verql:ai-inline-completion-enabled'
let enabled = readEnabled()

function readEnabled(): boolean {
  try {
    if (typeof localStorage === 'undefined') return true
    const raw = localStorage.getItem(ENABLED_KEY)
    return raw == null ? true : raw === 'true'
  } catch {
    return true
  }
}

export function isInlineCompletionEnabled(): boolean {
  return enabled
}

export function setInlineCompletionEnabled(next: boolean): void {
  enabled = next
  try { localStorage.setItem(ENABLED_KEY, String(next)) } catch { /* quota */ }
  if (!next) setState('idle')
}

function setState(next: InlineAIState): void {
  if (state === next) return
  state = next
  for (const l of listeners) l(state)
}

export function getInlineAIState(): InlineAIState {
  return state
}

export function subscribeInlineAIState(l: Listener): () => void {
  listeners.add(l)
  return () => { listeners.delete(l) }
}

export function setAICompletionContext(connectionId: string | null): void {
  currentConnectionId = connectionId
}

export function registerAIInlineCompletionProvider(monaco: Monaco, language: string): void {
  monaco.languages.registerInlineCompletionsProvider(language, {
    provideInlineCompletions: async (
      model: editor.ITextModel,
      position: Position,
      _context: languages.InlineCompletionContext,
      token: CancellationToken
    ) => {
      if (!enabled) return { items: [] }
      if (!currentConnectionId) return { items: [] }
      if (debounceTimer) clearTimeout(debounceTimer)

      return new Promise((resolve) => {
        debounceTimer = setTimeout(async () => {
          if (token.isCancellationRequested) { resolve({ items: [] }); return }
          const fullText = model.getValue()
          if (fullText.trim().length < 3) { resolve({ items: [] }); return }

          setState('thinking')
          try {
            const result = await window.electronAPI.invoke(IPC_CHANNELS.AI_COMPLETE_SQL, {
              sql: fullText,
              cursorOffset: model.getOffsetAt(position),
              connectionId: currentConnectionId!,
            }) as { completion: string }

            if (token.isCancellationRequested || !result.completion) {
              setState('idle'); resolve({ items: [] }); return
            }
            setState('ready')
            resolve({
              items: [{
                insertText: result.completion,
                range: {
                  startLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endLineNumber: position.lineNumber,
                  endColumn: position.column,
                },
              }],
            })
          } catch {
            setState('idle')
            resolve({ items: [] })
          }
        }, 300)
      })
    },
    freeInlineCompletions: () => { setState('idle') },
    disposeInlineCompletions: () => { setState('idle') },
  } as Parameters<typeof monaco.languages.registerInlineCompletionsProvider>[1])
}
