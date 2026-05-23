// Every bundled theme must pass the REQUIRED-tokens validation gate.
//
// The new system disables a theme in the picker when its `validation.ok` is
// false (i.e. it's missing one of the REQUIRED_THEME_TOKENS). If a bundled
// theme silently slips below the bar — say, someone forgets `--color-accent`
// when adding a new palette — the user opens Verql to find a built-in theme
// they can't actually pick. This test pins the bar against the shipped set.
import { describe, it, expect } from 'vitest'
import {
  validateTheme,
  REQUIRED_THEME_TOKENS,
  RECOMMENDED_THEME_TOKENS,
} from '../../../src/main/plugins/sdk/theme-registry'
import { CORE_THEMES } from '../../../src/main/plugins/bundled/core-themes/themes-data'

describe('bundled core-themes — all required tokens present', () => {
  for (const theme of CORE_THEMES) {
    it(`${theme.id} declares every required token`, () => {
      const report = validateTheme(theme)
      expect(report.missingRequired, `Theme '${theme.id}' is missing: ${report.missingRequired.join(', ')}`)
        .toEqual([])
      expect(report.ok).toBe(true)
    })
  }

  it('REQUIRED_THEME_TOKENS and RECOMMENDED_THEME_TOKENS don’t overlap', () => {
    const required = new Set(REQUIRED_THEME_TOKENS)
    const overlap = RECOMMENDED_THEME_TOKENS.filter((t) => required.has(t))
    expect(overlap, `Tokens appear in both lists: ${overlap.join(', ')}`).toEqual([])
  })
})
