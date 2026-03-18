import { describe, it, expect } from 'vitest'
import { renderTable, highlightSQL, box, stripAnsi } from '../src/ui/theme.js'

describe('renderTable', () => {
  it('returns no-results message for 0 columns', () => {
    const result = renderTable([], [])
    expect(result.output).toContain('no results')
    expect(result.displayedRows).toBe(0)
  })

  it('renders headers only for 0 rows', () => {
    const result = renderTable(['id', 'name'], [])
    const plain = stripAnsi(result.output)
    expect(plain).toContain('id')
    expect(plain).toContain('name')
    expect(result.displayedRows).toBe(0)
    expect(result.totalRows).toBe(0)
  })

  it('paginates correctly', () => {
    const rows = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `user${i}` }))
    const page0 = renderTable(['id', 'name'], rows, { page: 0, pageSize: 30 })
    expect(page0.displayedRows).toBe(30)
    expect(page0.pageCount).toBe(4)
    expect(page0.totalRows).toBe(100)

    const page1 = renderTable(['id', 'name'], rows, { page: 1, pageSize: 30 })
    expect(page1.displayedRows).toBe(30)

    const lastPage = renderTable(['id', 'name'], rows, { page: 3, pageSize: 30 })
    expect(lastPage.displayedRows).toBe(10) // 100 - 90
  })
})

describe('highlightSQL', () => {
  it('returns string containing SQL keywords', () => {
    const result = highlightSQL('SELECT * FROM users WHERE id = 1')
    // The output should still contain the actual words (whether colorized or not)
    const plain = stripAnsi(result)
    expect(plain).toContain('SELECT')
    expect(plain).toContain('FROM')
    expect(plain).toContain('WHERE')
    expect(plain).toContain('users')
    expect(plain).toContain('id')
  })
})

describe('box', () => {
  it('has correct border characters', () => {
    const result = box('Test', ['Hello'], 40)
    const plain = stripAnsi(result)
    expect(plain[0]).toBe('╭')
    expect(plain).toContain('╰')
    expect(plain).toContain('│')
  })
})

describe('stripAnsi', () => {
  it('strips all escape sequences', () => {
    const colored = '\x1b[31mHello\x1b[0m \x1b[1;32mWorld\x1b[0m'
    expect(stripAnsi(colored)).toBe('Hello World')
  })

  it('returns plain string unchanged', () => {
    expect(stripAnsi('Hello World')).toBe('Hello World')
  })

  it('handles empty string', () => {
    expect(stripAnsi('')).toBe('')
  })
})
