import { describe, it, expect } from 'vitest'
import type { FieldInfo } from '../../shared/types'

type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'none'

function detectChartType(fields: FieldInfo[], rows: Record<string, unknown>[]): ChartType {
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

function isTextField(field: FieldInfo, rows: Record<string, unknown>[]): boolean {
  const sample = rows.slice(0, 10).map(r => r[field.name])
  return sample.every(v => v === null || typeof v === 'string')
}

function isNumericField(field: FieldInfo, rows: Record<string, unknown>[]): boolean {
  const sample = rows.slice(0, 10).map(r => r[field.name])
  return sample.some(v => typeof v === 'number') && sample.every(v => v === null || typeof v === 'number')
}

function isDateField(field: FieldInfo, rows: Record<string, unknown>[]): boolean {
  const type = field.dataType.toLowerCase()
  if (/date|time|timestamp/.test(type)) return true
  const sample = rows.slice(0, 5).map(r => r[field.name])
  return sample.some(v => typeof v === 'string' && !isNaN(Date.parse(v as string)) && (v as string).length > 8)
}

describe('Chart detection', () => {
  const textField: FieldInfo = { name: 'name', dataType: 'varchar', nullable: false }
  const numField: FieldInfo = { name: 'count', dataType: 'int', nullable: false }
  const dateField: FieldInfo = { name: 'created_at', dataType: 'timestamp', nullable: false }
  const numField2: FieldInfo = { name: 'total', dataType: 'numeric', nullable: false }

  it('detects bar chart for text + numeric', () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({ name: `Item ${i}`, count: i * 10 }))
    expect(detectChartType([textField, numField], rows)).toBe('bar')
  })

  it('detects line chart for date + numeric', () => {
    const rows = [
      { created_at: '2024-01-01', count: 10 },
      { created_at: '2024-02-01', count: 20 }
    ]
    expect(detectChartType([dateField, numField], rows)).toBe('line')
  })

  it('detects pie chart for text + numeric with few rows', () => {
    const rows = [
      { name: 'A', count: 30 },
      { name: 'B', count: 50 },
      { name: 'C', count: 20 }
    ]
    expect(detectChartType([textField, numField], rows)).toBe('pie')
  })

  it('detects scatter for two numeric fields', () => {
    const rows = [{ count: 10, total: 100 }, { count: 20, total: 200 }]
    expect(detectChartType([numField, numField2], rows)).toBe('scatter')
  })

  it('returns none for empty results', () => {
    expect(detectChartType([textField], [])).toBe('none')
  })

  it('returns none for single field', () => {
    expect(detectChartType([numField], [{ count: 1 }])).toBe('none')
  })
})
