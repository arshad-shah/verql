/**
 * SQL CodeLens — adds inline "▶ Run" / "Explain" buttons above each statement.
 *
 * We split the model on top-level semicolons (string literals/comments are
 * preserved verbatim so semicolons inside them don't break statements). Each
 * non-empty statement gets a lens at its starting line. Triggering a lens
 * invokes a Monaco command which dispatches a window event the QueryPanel
 * listens for — keeping this lib pure (no React/store imports).
 */
import type { Monaco } from '@monaco-editor/react'
import type { editor, languages } from 'monaco-editor'

const RUN_COMMAND_ID = 'manara.runStatement'
const EXPLAIN_COMMAND_ID = 'manara.explainStatement'
const registeredLangs = new Set<string>()

interface Statement {
  startLine: number
  text: string
}

/**
 * Splits a SQL buffer into top-level statements. Handles single-quote, double-
 * quote, backtick strings, line comments (--), and block comments. Anything
 * inside a quoted/commented region is skipped so semicolons there don't slice.
 */
function splitStatements(source: string): Statement[] {
  const out: Statement[] = []
  let line = 1
  let startOffset = 0
  let i = 0
  let startLineOfStmt = 1

  const flush = (endExclusive: number) => {
    const text = source.slice(startOffset, endExclusive).trim()
    if (text) out.push({ startLine: startLineOfStmt, text })
    startOffset = endExclusive + 1
    startLineOfStmt = line
  }

  while (i < source.length) {
    const c = source[i]
    const next = source[i + 1]

    if (c === '\n') { line++; i++; continue }

    // Line comment
    if (c === '-' && next === '-') {
      while (i < source.length && source[i] !== '\n') i++
      continue
    }
    // Block comment
    if (c === '/' && next === '*') {
      i += 2
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) {
        if (source[i] === '\n') line++
        i++
      }
      i += 2
      continue
    }
    // Quoted strings — skip past matching delimiter
    if (c === "'" || c === '"' || c === '`') {
      const quote = c
      i++
      while (i < source.length) {
        if (source[i] === '\\' && source[i + 1] === quote) { i += 2; continue }
        if (source[i] === quote) { i++; break }
        if (source[i] === '\n') line++
        i++
      }
      continue
    }
    if (c === ';') {
      flush(i)
      i++
      continue
    }
    i++
  }
  // Trailing statement (no terminating ;)
  const tail = source.slice(startOffset).trim()
  if (tail) out.push({ startLine: startLineOfStmt, text: tail })
  return out
}

/**
 * Registers the CodeLens provider for the given SQL-like language. Idempotent.
 * The provider re-computes lenses whenever Monaco asks (model edits trigger
 * this via the change-event we emit from `provideCodeLenses`).
 */
export function registerSqlCodeLens(monaco: Monaco, language: string): void {
  if (registeredLangs.has(language)) return
  registeredLangs.add(language)

  monaco.languages.registerCodeLensProvider(language, {
    provideCodeLenses(model: editor.ITextModel): languages.ProviderResult<languages.CodeLensList> {
      const stmts = splitStatements(model.getValue())
      // Empty buffer — nothing to anchor lenses to.
      if (stmts.length === 0) return { lenses: [], dispose: () => {} }
      const lenses: languages.CodeLens[] = []
      for (const s of stmts) {
        const range = { startLineNumber: s.startLine, startColumn: 1, endLineNumber: s.startLine, endColumn: 1 }
        lenses.push({
          range,
          id: `run-${s.startLine}`,
          command: { id: RUN_COMMAND_ID, title: '▶ Run', arguments: [s.text] }
        })
        lenses.push({
          range,
          id: `explain-${s.startLine}`,
          command: { id: EXPLAIN_COMMAND_ID, title: 'Explain', arguments: [s.text] }
        })
      }
      return { lenses, dispose: () => {} }
    },
    resolveCodeLens(_model: editor.ITextModel, lens: languages.CodeLens) { return lens }
  })
}

/**
 * Wires the lens commands. Dispatches window events the QueryPanel listens
 * for so the lens layer stays decoupled from React. The Monaco command
 * registry is global and accepts re-registration silently, so we can call
 * this on every editor mount instead of guarding it — important during HMR
 * where a guard set lives longer than the registered commands themselves.
 */
export function installSqlCodeLensCommandHandlers(monaco: Monaco): void {
  const reg = (monaco as unknown as {
    editor: { registerCommand?: (id: string, handler: (...args: unknown[]) => void) => void }
  }).editor.registerCommand
  if (typeof reg !== 'function') return
  reg(RUN_COMMAND_ID, (..._args: unknown[]) => {
    const sql = _args[1] as string
    if (typeof sql === 'string') window.dispatchEvent(new CustomEvent('nova:run-statement', { detail: { sql } }))
  })
  reg(EXPLAIN_COMMAND_ID, (..._args: unknown[]) => {
    const sql = _args[1] as string
    if (typeof sql === 'string') window.dispatchEvent(new CustomEvent('nova:explain-statement', { detail: { sql } }))
  })
}

export const SqlCodeLensEvents = {
  run: 'nova:run-statement',
  explain: 'nova:explain-statement'
} as const
