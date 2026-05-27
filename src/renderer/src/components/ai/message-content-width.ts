/**
 * Decides whether an assistant message should render full-width instead of as a
 * snug bubble. Rich content — fenced code or a markdown table — needs the room
 * so it doesn't wrap or clip; short prose stays compact.
 */
export function isWideMessageContent(content: string): boolean {
  if (content.includes('```')) return true

  // A markdown table delimiter row is made only of pipes, dashes, colons and
  // spaces, with several dashes. Prose with a stray "|" or "-" won't match.
  for (const line of content.split('\n')) {
    const t = line.trim()
    if (
      t.includes('|') &&
      /^[|\s:-]+$/.test(t) &&
      (t.match(/-/g)?.length ?? 0) >= 3
    ) {
      return true
    }
  }
  return false
}
