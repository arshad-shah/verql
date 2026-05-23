// Themes must be validated when they register, not later. Storing the
// validation report on the entry at registration time means:
//   - the picker can show a broken theme as disabled without re-running
//     validateTheme() per render
//   - a strict mode can refuse registration outright so a misbuilt third-
//     party plugin gets a clear error instead of shipping a broken theme
//   - bundled themes get pinned by the unit suite (since this test exists)
import { describe, it, expect } from 'vitest'
import {
  ThemeRegistryImpl,
  REQUIRED_THEME_TOKENS,
} from '../../../src/main/plugins/sdk/theme-registry'

const FULL_TOKENS: Record<string, string> = Object.fromEntries(
  REQUIRED_THEME_TOKENS.map((k) => [k, '#000000']),
)

describe('ThemeRegistry — validates at registration time', () => {
  it('attaches a `validation` report to every entry', () => {
    const reg = new ThemeRegistryImpl()
    reg.register({ id: 'ok', name: 'OK', type: 'dark', tokens: FULL_TOKENS })
    const entry = reg.get('ok')
    expect(entry?.validation).toBeDefined()
    expect(entry?.validation?.ok).toBe(true)
    expect(entry?.validation?.missingRequired).toEqual([])
  })

  it('flags a theme missing required tokens without throwing in lenient mode', () => {
    const reg = new ThemeRegistryImpl()
    reg.register({ id: 'broken', name: 'Broken', type: 'dark', tokens: { '--unrelated': '#000' } })
    const entry = reg.get('broken')
    expect(entry?.validation?.ok).toBe(false)
    expect(entry?.validation?.missingRequired.length).toBeGreaterThan(0)
  })

  it('throws in strict mode when a theme is missing required tokens', () => {
    const reg = new ThemeRegistryImpl()
    expect(() =>
      reg.register(
        { id: 'broken', name: 'Broken', type: 'dark', tokens: { '--unrelated': '#000' } },
        { strict: true },
      ),
    ).toThrow(/missing required/i)
    // And nothing landed in the registry.
    expect(reg.has('broken')).toBe(false)
  })
})
