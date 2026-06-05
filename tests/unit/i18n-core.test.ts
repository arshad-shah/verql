import { describe, it, expect, beforeEach } from 'vitest'
import {
  t,
  setLocale,
  getLocale,
  registerLocale,
  availableLocales,
  subscribeLocale,
} from '../../shared/i18n'

describe('i18n core', () => {
  beforeEach(() => {
    setLocale('en')
  })

  it('resolves an English key', () => {
    expect(t('common.resetToDefaults')).toBe('Reset to Defaults')
  })

  it('interpolates variables', () => {
    expect(t('connections.connected', { name: 'pg' })).toBe('Connected to pg')
  })

  it('falls back to the raw key when missing', () => {
    // @ts-expect-error — intentionally unknown key
    expect(t('does.not.exist')).toBe('does.not.exist')
  })

  it('registers a locale and switches to it, falling back to English per-key', () => {
    registerLocale('xx', {
      common: { resetToDefaults: 'XX-RESET' },
      connections: { connected: 'XX {name}' },
    })
    expect(availableLocales()).toContain('xx')

    setLocale('xx')
    expect(getLocale()).toBe('xx')
    expect(t('common.resetToDefaults')).toBe('XX-RESET')
    expect(t('connections.connected', { name: 'db' })).toBe('XX db')
    // A key not in xx falls back to English.
    expect(t('common.cancel')).toBe('Cancel')
  })

  it('notifies subscribers on locale change only when it actually changes', () => {
    let calls = 0
    const off = subscribeLocale(() => { calls++ })
    setLocale('en') // already en — no notify
    expect(calls).toBe(0)
    setLocale('xx')
    expect(calls).toBe(1)
    off()
    setLocale('en')
    expect(calls).toBe(1) // unsubscribed
  })
})
