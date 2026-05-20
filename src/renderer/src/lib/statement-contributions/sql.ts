import type { Statement } from '@/lib/statement-registry'

const STATEMENT_KEYWORDS = new Set([
  'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'WITH', 'CREATE', 'ALTER', 'DROP',
  'TRUNCATE', 'EXPLAIN', 'BEGIN', 'COMMIT', 'ROLLBACK', 'GRANT', 'REVOKE',
  'SHOW', 'USE', 'VACUUM', 'ANALYZE', 'SET',
])

interface Pos { line: number; col: number }

/**
 * Walks the source once, tracking line/column. Recognises strings and comments
 * so semicolons / keywords inside them don't split. Emits a statement when:
 *   (a) it hits a top-level `;`, or
 *   (b) it sees a newline whose next non-whitespace token is a STATEMENT_KEYWORDS member.
 * Empty / whitespace-only segments are dropped.
 */
export function splitSqlStatements(source: string): Statement[] {
  const out: Statement[] = []
  let i = 0
  let line = 1
  let col = 1
  let stmtStart = 0
  let stmtStartLine = 1
  let stmtStartCol = 1

  const flush = (endExclusive: number) => {
    const text = source.slice(stmtStart, endExclusive)
    const trimmed = text.trim()
    if (!trimmed) return
    const lead = text.length - text.trimStart().length
    const trail = text.length - text.trimEnd().length
    const start = advancePos(source, stmtStart, stmtStartLine, stmtStartCol, lead)
    const end = advancePos(source, stmtStart, stmtStartLine, stmtStartCol, text.length - trail)
    out.push({
      startLine: start.line,
      startColumn: start.col,
      endLine: end.line,
      endColumn: end.col,
      text: trimmed,
    })
  }

  const setStart = (idx: number, l: number, c: number) => {
    stmtStart = idx
    stmtStartLine = l
    stmtStartCol = c
  }

  while (i < source.length) {
    const c = source[i]
    const next = source[i + 1]

    if (c === '\n') {
      // Look ahead past whitespace for a statement keyword.
      let j = i + 1
      let jCol = 1
      while (j < source.length && (source[j] === ' ' || source[j] === '\t')) { j++; jCol++ }
      if (j < source.length && isKeywordStart(source, j)) {
        flush(i)
        line++; col = 1
        i++
        while (i < j) { i++; col++ }
        setStart(j, line, jCol)
        continue
      }
      line++; col = 1; i++; continue
    }
    if (c === '-' && next === '-') {
      while (i < source.length && source[i] !== '\n') { i++; col++ }
      continue
    }
    if (c === '/' && next === '*') {
      i += 2; col += 2
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) {
        if (source[i] === '\n') { line++; col = 1 } else { col++ }
        i++
      }
      if (i < source.length) { i += 2; col += 2 }
      continue
    }
    if (c === "'" || c === '"' || c === '`') {
      const quote = c
      i++; col++
      while (i < source.length) {
        if (source[i] === '\\' && source[i + 1] === quote) { i += 2; col += 2; continue }
        if (source[i] === quote) { i++; col++; break }
        if (source[i] === '\n') { line++; col = 1 } else { col++ }
        i++
      }
      continue
    }
    if (c === ';') {
      flush(i)
      i++; col++
      while (i < source.length && (source[i] === ' ' || source[i] === '\t')) { i++; col++ }
      if (source[i] === '\n') { i++; line++; col = 1 }
      setStart(i, line, col)
      continue
    }
    i++; col++
  }
  flush(source.length)
  return out
}

function isKeywordStart(source: string, from: number): boolean {
  let end = from
  while (end < source.length && /[A-Za-z]/.test(source[end])) end++
  const word = source.slice(from, end).toUpperCase()
  return STATEMENT_KEYWORDS.has(word)
}

function advancePos(source: string, baseIdx: number, baseLine: number, baseCol: number, offset: number): Pos {
  let line = baseLine
  let col = baseCol
  for (let k = 0; k < offset; k++) {
    if (source[baseIdx + k] === '\n') { line++; col = 1 } else { col++ }
  }
  return { line, col }
}
