import { parse } from 'csv-parse/sync'
import type { DbAdapter } from '../db/adapter'
import type { SchemaColumn } from '@shared/types'

export interface CsvImportOptions {
  tableName: string
  columnMapping: Record<string, string> // csvColumn -> dbColumn
  onConflict: 'skip' | 'update' | 'error'
  delimiter?: string
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

export async function importCsvToTable(
  adapter: DbAdapter,
  csvRows: Record<string, string>[],
  options: CsvImportOptions
): Promise<{ inserted: number; skipped: number; errors: string[] }> {
  const { tableName, columnMapping, onConflict } = options
  const dbColumns = Object.values(columnMapping)
  const csvColumns = Object.keys(columnMapping)

  let inserted = 0
  let skipped = 0
  const errors: string[] = []

  for (let i = 0; i < csvRows.length; i++) {
    const row = csvRows[i]
    const values = csvColumns.map(csvCol => row[csvCol] ?? null)
    const placeholders = dbColumns.map((_, idx) => `$${idx + 1}`).join(', ')
    const colList = dbColumns.map(c => `"${c}"`).join(', ')
    const sql = `INSERT INTO "${tableName}" (${colList}) VALUES (${placeholders})`

    try {
      await adapter.query(sql, values)
      inserted++
    } catch (err) {
      if (onConflict === 'skip') {
        skipped++
      } else if (onConflict === 'error') {
        errors.push(`Row ${i + 1}: ${(err as Error).message}`)
      }
    }
  }

  return { inserted, skipped, errors }
}
