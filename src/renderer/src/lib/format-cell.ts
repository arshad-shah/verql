// Pure cell-formatting helpers used by the results grid. Kept free of any
// AG-Grid / React imports so they're trivially unit-testable and reusable.
import type { DataDisplaySettings } from '@shared/settings'

/** Render a boolean according to the user's `dataDisplay.booleanDisplay` choice. */
export function formatBoolean(
  value: boolean,
  mode: DataDisplaySettings['booleanDisplay'],
): string {
  switch (mode) {
    case 'one_zero':
      return value ? '1' : '0'
    case 'yes_no':
      return value ? 'Yes' : 'No'
    case 'checkmark':
      return value ? '✓' : '✗'
    case 'true_false':
    default:
      return value ? 'true' : 'false'
  }
}

/**
 * Format a Date with a small, dependency-free token pattern. Supported tokens:
 *   yyyy  4-digit year      MM  2-digit month   dd  2-digit day
 *   HH    2-digit hour(24)  mm  2-digit minute  ss  2-digit second
 *   SSS   3-digit millis
 * Anything else in the pattern is emitted verbatim, so separators like
 * `yyyy-MM-dd HH:mm:ss` or `dd/MM/yyyy` work as written.
 */
export function formatWithPattern(date: Date, pattern: string): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, '0')
  const map: Record<string, string> = {
    yyyy: String(date.getFullYear()),
    SSS: pad(date.getMilliseconds(), 3),
    MM: pad(date.getMonth() + 1),
    dd: pad(date.getDate()),
    HH: pad(date.getHours()),
    mm: pad(date.getMinutes()),
    ss: pad(date.getSeconds()),
  }
  return pattern.replace(/yyyy|SSS|MM|dd|HH|mm|ss/g, (token) => map[token] ?? token)
}

/**
 * Truncate a display string to `max` characters, appending an ellipsis when
 * trimmed. `max <= 0` disables truncation (returns the string unchanged).
 */
export function truncateText(value: string, max: number): string {
  if (max <= 0 || value.length <= max) return value
  return value.slice(0, max) + '…'
}
