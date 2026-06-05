import { describe, it, expect } from 'vitest'
import { formatMessage } from '../../shared/i18n/format'

describe('formatMessage — interpolation', () => {
  it('substitutes named placeholders', () => {
    expect(formatMessage('Connected to {name}', { name: 'pg' })).toBe('Connected to pg')
  })

  it('coerces numbers and leaves unknown placeholders intact', () => {
    expect(formatMessage('{a} of {b}', { a: 1, b: 3 })).toBe('1 of 3')
    expect(formatMessage('Hi {missing}', {})).toBe('Hi {missing}')
  })

  it('handles a template with no placeholders', () => {
    expect(formatMessage('Just text')).toBe('Just text')
  })
})

describe('formatMessage — plurals', () => {
  const tpl = '{count, plural, one {# row} other {# rows}}'

  it('selects one vs other and substitutes #', () => {
    expect(formatMessage(tpl, { count: 1 })).toBe('1 row')
    expect(formatMessage(tpl, { count: 5 })).toBe('5 rows')
    expect(formatMessage(tpl, { count: 0 })).toBe('0 rows')
  })

  it('honours exact =N matches over category', () => {
    const t = '{count, plural, =0 {no rows} one {# row} other {# rows}}'
    expect(formatMessage(t, { count: 0 })).toBe('no rows')
    expect(formatMessage(t, { count: 1 })).toBe('1 row')
    expect(formatMessage(t, { count: 2 })).toBe('2 rows')
  })

  it('supports placeholders inside plural option bodies and surrounding text', () => {
    const t = '{n, plural, one {# client} other {# clients}} on {host}'
    expect(formatMessage(t, { n: 1, host: 'local' })).toBe('1 client on local')
    expect(formatMessage(t, { n: 3, host: 'local' })).toBe('3 clients on local')
  })

  it('defaults a missing count to zero (other)', () => {
    expect(formatMessage(tpl, {})).toBe('0 rows')
  })
})
