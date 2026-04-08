import type { FieldInfo } from '@shared/types'

export type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'none'

export function detectChartType(fields: FieldInfo[], rows: Record<string, unknown>[]): ChartType {
  if (fields.length < 2 || rows.length === 0) return 'none'

  const textFields = fields.filter(f => isTextField(f, rows))
  const numericFields = fields.filter(f => isNumericField(f, rows))
  const dateFields = fields.filter(f => isDateField(f, rows))

  if (dateFields.length >= 1 && numericFields.length >= 1) return 'line'
  if (textFields.length === 1 && numericFields.length === 1 && rows.length <= 15) return 'pie'
  if (textFields.length >= 1 && numericFields.length >= 1) return 'bar'
  if (numericFields.length >= 2) return 'scatter'
  return 'none'
}

export function isTextField(field: FieldInfo, rows: Record<string, unknown>[]): boolean {
  const sample = rows.slice(0, 10).map(r => r[field.name])
  return sample.every(v => v === null || typeof v === 'string')
}

export function isNumericField(field: FieldInfo, rows: Record<string, unknown>[]): boolean {
  const sample = rows.slice(0, 10).map(r => r[field.name])
  return sample.some(v => typeof v === 'number') && sample.every(v => v === null || typeof v === 'number')
}

export function isDateField(field: FieldInfo, rows: Record<string, unknown>[]): boolean {
  const type = field.dataType.toLowerCase()
  if (/date|time|timestamp/.test(type)) return true
  const sample = rows.slice(0, 5).map(r => r[field.name])
  return sample.some(v => typeof v === 'string' && !isNaN(Date.parse(v as string)) && (v as string).length > 8)
}

export function suggestAxes(fields: FieldInfo[], rows: Record<string, unknown>[]): { x: string; y: string } | null {
  const textFields = fields.filter(f => isTextField(f, rows))
  const numericFields = fields.filter(f => isNumericField(f, rows))
  const dateFields = fields.filter(f => isDateField(f, rows))

  if (dateFields.length >= 1 && numericFields.length >= 1) return { x: dateFields[0].name, y: numericFields[0].name }
  if (textFields.length >= 1 && numericFields.length >= 1) return { x: textFields[0].name, y: numericFields[0].name }
  if (numericFields.length >= 2) return { x: numericFields[0].name, y: numericFields[1].name }
  return null
}
