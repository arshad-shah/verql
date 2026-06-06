import { describe, it, expect } from 'vitest'
import { formatBoolean, formatWithPattern, truncateText } from '../../src/renderer/src/lib/format-cell'

describe('formatBoolean', () => {
  it('renders each mode', () => {
    expect(formatBoolean(true, 'true_false')).toBe('true')
    expect(formatBoolean(false, 'true_false')).toBe('false')
    expect(formatBoolean(true, 'one_zero')).toBe('1')
    expect(formatBoolean(false, 'one_zero')).toBe('0')
    expect(formatBoolean(true, 'yes_no')).toBe('Yes')
    expect(formatBoolean(false, 'yes_no')).toBe('No')
    expect(formatBoolean(true, 'checkmark')).toBe('✓')
    expect(formatBoolean(false, 'checkmark')).toBe('✗')
  })
})

describe('formatWithPattern', () => {
  const d = new Date(2024, 2, 5, 9, 7, 3, 42) // 2024-03-05 09:07:03.042 (local)

  it('replaces all supported tokens with padded values', () => {
    expect(formatWithPattern(d, 'yyyy-MM-dd HH:mm:ss')).toBe('2024-03-05 09:07:03')
    expect(formatWithPattern(d, 'dd/MM/yyyy')).toBe('05/03/2024')
    expect(formatWithPattern(d, 'HH:mm:ss.SSS')).toBe('09:07:03.042')
  })

  it('emits non-token characters verbatim', () => {
    expect(formatWithPattern(d, 'Year yyyy!')).toBe('Year 2024!')
  })
})

describe('truncateText', () => {
  it('leaves short strings untouched', () => {
    expect(truncateText('hello', 10)).toBe('hello')
    expect(truncateText('hello', 5)).toBe('hello')
  })

  it('truncates and appends an ellipsis', () => {
    expect(truncateText('hello world', 5)).toBe('hello…')
  })

  it('treats max <= 0 as disabled', () => {
    expect(truncateText('hello world', 0)).toBe('hello world')
    expect(truncateText('hello world', -1)).toBe('hello world')
  })
})
