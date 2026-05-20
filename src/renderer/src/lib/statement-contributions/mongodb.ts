import type { Statement } from '@/lib/statement-registry'

/**
 * Splits a Mongo shell buffer into one statement per top-level brace-balanced
 * JSON document. Tracks string state so '}' inside "..." doesn't close a doc.
 * Anything between documents (whitespace/newlines) is skipped.
 */
export function splitMongoStatements(source: string): Statement[] {
  const out: Statement[] = []
  let i = 0
  let line = 1
  let col = 1

  while (i < source.length) {
    const ch = source[i]
    if (ch === '\n') { line++; col = 1; i++; continue }
    if (ch === ' ' || ch === '\t' || ch === '\r') { col++; i++; continue }
    if (ch !== '{') { col++; i++; continue }

    const startLine = line
    const startCol = col
    const startIdx = i
    let depth = 0
    let inString = false
    while (i < source.length) {
      const c = source[i]
      if (inString) {
        if (c === '\\' && i + 1 < source.length) {
          if (source[i + 1] === '\n') { line++; col = 1 } else { col += 2 }
          i += 2; continue
        }
        if (c === '"') { inString = false; col++; i++; continue }
        if (c === '\n') { line++; col = 1 } else { col++ }
        i++; continue
      }
      if (c === '"') { inString = true; col++; i++; continue }
      if (c === '{') { depth++; col++; i++; continue }
      if (c === '}') {
        depth--
        col++; i++
        if (depth === 0) {
          out.push({
            startLine,
            startColumn: startCol,
            endLine: line,
            endColumn: col,
            text: source.slice(startIdx, i),
          })
          break
        }
        continue
      }
      if (c === '\n') { line++; col = 1 } else { col++ }
      i++
    }
  }
  return out
}
