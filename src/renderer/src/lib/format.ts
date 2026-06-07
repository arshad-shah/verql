/** Compact thousands/millions formatting: 1_234 → "1.2k", 2_000_000 → "2.0M".
 *  Used for row counts, token counts, and any large tally where a terse label
 *  reads better than the full integer. */
export function formatCompactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}
