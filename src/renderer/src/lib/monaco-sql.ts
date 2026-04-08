import type { Monaco } from '@monaco-editor/react'

const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN',
  'IS', 'NULL', 'AS', 'ON', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
  'FULL', 'CROSS', 'GROUP', 'BY', 'ORDER', 'ASC', 'DESC', 'HAVING',
  'LIMIT', 'OFFSET', 'UNION', 'ALL', 'DISTINCT', 'INSERT', 'INTO',
  'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'ALTER',
  'DROP', 'INDEX', 'VIEW', 'TRIGGER', 'FUNCTION', 'BEGIN', 'COMMIT',
  'ROLLBACK', 'TRANSACTION', 'EXPLAIN', 'ANALYZE', 'WITH', 'CASE',
  'WHEN', 'THEN', 'ELSE', 'END', 'EXISTS', 'COUNT', 'SUM', 'AVG',
  'MIN', 'MAX', 'COALESCE', 'CAST', 'TRUNCATE', 'PRIMARY', 'KEY',
  'FOREIGN', 'REFERENCES', 'CONSTRAINT', 'DEFAULT', 'CHECK', 'UNIQUE',
  'NOT NULL', 'CASCADE', 'RESTRICT', 'RETURNING'
]

let cachedTableNames: string[] = []

export function updateTableNames(names: string[]): void {
  cachedTableNames = names
}

export function registerSqlCompletionProvider(monaco: Monaco): void {
  monaco.languages.registerCompletionItemProvider('sql', {
    triggerCharacters: ['.', ' '],
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      }

      const suggestions = [
        ...SQL_KEYWORDS.map(kw => ({
          label: kw,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: kw,
          range,
          sortText: '1' + kw
        })),
        ...cachedTableNames.map(name => ({
          label: name,
          kind: monaco.languages.CompletionItemKind.Struct,
          insertText: name,
          detail: 'table',
          range,
          sortText: '0' + name
        }))
      ]

      return { suggestions }
    }
  })
}
