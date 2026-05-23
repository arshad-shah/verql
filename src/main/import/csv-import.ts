import { parse } from 'csv-parse/sync'
import type { DbAdapter } from '../db/adapter'
import { quoteIdentifier, type SqlDialect } from '../db/identifier'

export interface CsvImportOptions {
  tableName: string
  columnMapping: Record<string, string> // csvColumn -> dbColumn
  onConflict: 'skip' | 'update' | 'error'
  delimiter?: string
  /** SQL dialect to target. Defaults to `postgresql` (the only dialect that
   *  used to be supported); callers that know their connection type SHOULD
   *  pass it explicitly so identifiers/placeholders use the right escaping. */
  dialect?: SqlDialect
}

export function parseCsvFile(content: string, delimiter = ','): { headers: string[]; rows: Record<string, string>[] } {
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    delimiter,
    trim: true
  }) as Record<string, string>[]

  const headers = records.length > 0 ? Object.keys(records[0]) : []
  return { headers, rows: records }
}

function placeholder(dialect: SqlDialect, index: number): string {
  return dialect === 'postgresql' ? `$${index}` : '?'
}

export async function importCsvToTable(
  adapter: DbAdapter,
  csvRows: Record<string, string>[],
  options: CsvImportOptions
): Promise<{ inserted: number; skipped: number; errors: string[] }> {
  const { tableName, columnMapping, onConflict } = options
  const dialect: SqlDialect = options.dialect ?? 'postgresql'
  const dbColumns = Object.values(columnMapping)
  const csvColumns = Object.keys(columnMapping)

  let inserted = 0
  let skipped = 0
  const errors: string[] = []

  const colList = dbColumns.map(c => quoteIdentifier(c, dialect)).join(', ')
  const qTable = quoteIdentifier(tableName, dialect)
  const placeholders = dbColumns.map((_, idx) => placeholder(dialect, idx + 1)).join(', ')
  const sql = `INSERT INTO ${qTable} (${colList}) VALUES (${placeholders})`

  for (let i = 0; i < csvRows.length; i++) {
    const row = csvRows[i]
    const values = csvColumns.map(csvCol => row[csvCol] ?? null)
    try {
      await adapter.query(sql, values)
      inserted++
    } catch (err) {
      if (onConflict === 'skip') {
        skipped++
      } else if (onConflict === 'error') {
        errors.push(`Row ${i + 1}: ${(err as Error).message}`)
      } else {
        // 'update' mode: dialect-specific upsert isn't implemented yet, so
        // a conflict here is unrecoverable. Surface it via `errors[]`
        // rather than silently dropping the row — the previous code had
        // no branch for this case and made import look successful when
        // every row had failed.
        errors.push(`Row ${i + 1}: ${(err as Error).message}`)
      }
    }
  }

  return { inserted, skipped, errors }
}
