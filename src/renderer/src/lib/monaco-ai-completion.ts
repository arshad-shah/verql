import type { Monaco } from '@monaco-editor/react'
import type { editor, Position, CancellationToken, languages } from 'monaco-editor'

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let currentConnectionId: string | null = null

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
      // Don't trigger if no connection
      if (!currentConnectionId) return { items: [] }

      // Debounce — wait 300ms after last keystroke
      if (debounceTimer) clearTimeout(debounceTimer)

      return new Promise((resolve) => {
        debounceTimer = setTimeout(async () => {
          if (token.isCancellationRequested) {
            resolve({ items: [] })
            return
          }

          const fullText = model.getValue()
          const offset = model.getOffsetAt(position)

          // Don't trigger on empty or very short content
          if (fullText.trim().length < 3) {
            resolve({ items: [] })
            return
          }

          try {
            const result = await window.electronAPI.invoke('ai:complete-sql', {
              sql: fullText,
              cursorOffset: offset,
              connectionId: currentConnectionId!
            }) as { completion: string }

            if (token.isCancellationRequested || !result.completion) {
              resolve({ items: [] })
              return
            }

            resolve({
              items: [{
                insertText: result.completion,
                range: {
                  startLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endLineNumber: position.lineNumber,
                  endColumn: position.column
                }
              }]
            })
          } catch {
            resolve({ items: [] })
          }
        }, 300)
      })
    },
    freeInlineCompletions: () => { /* no-op */ },
    // Monaco renamed `freeInlineCompletions` → `disposeInlineCompletions` in
    // newer builds. Some builds call the new name and crash if it's missing.
    // Provide both so we work across the bundled Monaco versions.
    disposeInlineCompletions: () => { /* no-op */ },
  } as Parameters<typeof monaco.languages.registerInlineCompletionsProvider>[1])
}
