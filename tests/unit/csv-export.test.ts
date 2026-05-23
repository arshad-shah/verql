import { describe, it, expect } from 'vitest'
import { exportToCsv } from '../../src/main/plugins/bundled/core-formats/csv'

describe('CSV export', () => {
  it('generates CSV with headers and rows', () => {
    const rows = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 }
    ]
    const csv = exportToCsv(rows, ['name', 'age'])
    const lines = csv.trim().split('\n')
    expect(lines[0]).toBe('name,age')
    expect(lines[1]).toBe('Alice,30')
    expect(lines[2]).toBe('Bob,25')
  })

  it('handles null values as empty strings', () => {
    const rows = [{ name: 'Alice', email: null }]
    const csv = exportToCsv(rows, ['name', 'email'])
    expect(csv).toContain('Alice,')
  })

  it('handles empty rows', () => {
    const csv = exportToCsv([], ['name', 'age'])
    expect(csv.trim()).toBe('name,age')
  })
})
