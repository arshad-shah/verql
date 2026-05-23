import { parse } from 'csv-parse/sync'
import { stringify } from 'csv-stringify/sync'

export function parseCsvFile(
  content: string,
  delimiter = ',',
): { headers: string[]; rows: Record<string, string>[] } {
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    delimiter,
    trim: true,
  }) as Record<string, string>[]

  const headers = records.length > 0 ? Object.keys(records[0]) : []
  return { headers, rows: records }
}

export function exportToCsv(rows: Record<string, unknown>[], columns: string[]): string {
  if (rows.length === 0) return columns.join(',') + '\n'

  const data = rows.map(row =>
    columns.map(col => {
      const val = row[col]
      if (val === null || val === undefined) return ''
      if (typeof val === 'object') return JSON.stringify(val)
      return String(val)
    }),
  )

  return stringify([columns, ...data])
}
