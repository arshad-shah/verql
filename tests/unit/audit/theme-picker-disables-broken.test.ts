// The Appearance settings theme grid must NOT let the user select a theme
// that's missing required tokens. The previous UI showed a red border but
// still fired the onClick — meaning a single mis-stroked third-party plugin
// could land the user on a half-painted UI with no obvious way back. Now:
//   - broken theme buttons are `disabled` (no click, lower contrast, hint
//     via title/aria)
//   - the `setTheme` action refuses to set a broken id, falling back to
//     the previous theme
// This is a thin contract test against the component's render output —
// no jsdom required, just inspection of the helper functions used by the
// picker.
import { describe, it, expect } from 'vitest'
import { isThemeSelectable } from '../../../src/renderer/src/components/settings/categories/theme-utils'

describe('theme picker — broken themes are not selectable', () => {
  it('marks a theme without a validation report as selectable (legacy / baseline)', () => {
    expect(isThemeSelectable({ id: 'nightshift', name: 'Nightshift', type: 'dark' })).toBe(true)
  })

  it('marks a theme whose validation says ok as selectable', () => {
    expect(
      isThemeSelectable({
        id: 'ok',
        name: 'OK',
        type: 'dark',
        validation: { ok: true, missingRequired: [], missingRecommended: [] },
      }),
    ).toBe(true)
  })

  it('marks a theme with missing required tokens as NOT selectable', () => {
    expect(
      isThemeSelectable({
        id: 'broken',
        name: 'Broken',
        type: 'dark',
        validation: { ok: false, missingRequired: ['--color-accent'], missingRecommended: [] },
      }),
    ).toBe(false)
  })

  it('marks a theme with only recommended-token gaps as selectable (warning, not block)', () => {
    expect(
      isThemeSelectable({
        id: 'warn',
        name: 'Warn',
        type: 'dark',
        validation: { ok: true, missingRequired: [], missingRecommended: ['--color-success'] },
      }),
    ).toBe(true)
  })
})
