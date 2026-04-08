import { stringify } from 'csv-stringify/sync'

export function exportToCsv(
  rows: Record<string, unknown>[],
  columns: string[]
): string {
  if (rows.length === 0) return columns.join(',') + '\n'

  const data = rows.map(row => columns.map(col => {
    const val = row[col]
    if (val === null || val === undefined) return ''
    if (typeof val === 'object') return JSON.stringify(val)
    return String(val)
  }))

  return stringify([columns, ...data])
}
