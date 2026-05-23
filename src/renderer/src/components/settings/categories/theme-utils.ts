interface ThemeForSelectability {
  id: string
  validation?: {
    ok: boolean
    missingRequired: string[]
    missingRecommended: string[]
  }
}

/**
 * Returns true iff the theme can be selected from the picker.
 *
 * A theme without a `validation` field is assumed selectable — that's how
 * the baseline Nightshift entry (no plugin, no validation run) is treated.
 * Anything that ran through `validateTheme()` and came back with required
 * tokens missing is considered broken and the picker disables its tile.
 */
export function isThemeSelectable(theme: ThemeForSelectability): boolean {
  if (!theme.validation) return true
  return theme.validation.ok
}
