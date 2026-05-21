import type { Monaco } from '@monaco-editor/react'
import type { editor, Position } from 'monaco-editor'
import type { CompletionItem, CompletionItemKind } from '@shared/plugin-ui-types'

let cachedItems: CompletionItem[] = []

export function updateCompletionItems(items: CompletionItem[]): void {
  cachedItems = items
}

const kindMap: Record<CompletionItemKind, number> = {
  keyword: 17,    // Monaco CompletionItemKind.Keyword
  table: 6,       // Struct (was previously used for tables)
  column: 4,      // Field
  function: 1,    // Function
  collection: 6,  // Struct
  command: 17,    // Keyword
  field: 4,       // Field
  operator: 11,   // Operator
  snippet: 27,    // Snippet
}

export function registerCompletionProvider(monaco: Monaco, language: string): void {
  monaco.languages.registerCompletionItemProvider(language, {
    triggerCharacters: ['.', ' ', '$', '"'],
    provideCompletionItems: (model: editor.ITextModel, position: Position) => {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      }

      const suggestions = cachedItems.map(item => ({
        label: item.label,
        kind: kindMap[item.kind] ?? 17,
        insertText: item.insertText ?? item.label,
        detail: item.detail,
        range,
        sortText: item.sortText ?? item.label
      }))

      return { suggestions }
    }
  })
}
