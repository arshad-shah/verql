// Captures a KeyboardEvent into accelerator strings for the keybindings setting.
//
// The captured tokens must be understood by BOTH consumers of a keybinding:
//   - matchesAccelerator (lib/accelerators) compares against the raw `e.key`
//   - the editor's parseKeybinding maps tokens through a named table
// Only keys where those two agree are accepted; anything ambiguous (Space, Tab,
// arrows) is rejected so we never persist a binding one side can't honour.

// Keys we refuse to capture: Space/Tab/Escape have UX conflicts (Escape cancels
// capture), and arrows disagree between the two matchers.
const EXCLUDED = new Set([' ', 'Tab', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])
// Punctuation present in the editor's named map AND matched verbatim by
// matchesAccelerator (which compares the raw character).
const PUNCT = new Set([',', '.', '/', '\\', ';', "'", '[', ']', '-', '=', '`'])
// Navigation/edit keys whose `e.key` value already matches in both matchers.
const NAMED = new Set(['Enter', 'Backspace', 'Delete', 'Home', 'End', 'PageUp', 'PageDown'])

/** Resolve the non-modifier key of an event to a stored token, or null. */
function keyToken(e: KeyboardEvent): string | null {
  const k = e.key
  if (EXCLUDED.has(k)) return null
  if (k.length === 1) {
    if (/[a-z]/i.test(k)) return k.toUpperCase()
    if (/[0-9]/.test(k)) return k
    if (PUNCT.has(k)) return k
    return null
  }
  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(k)) return k
  return NAMED.has(k) ? k : null
}

/**
 * Build the keybinding strings for a captured event, or null when the chord
 * isn't acceptable. A primary modifier (Cmd/Ctrl) is required, except for bare
 * function keys, so plain typing is never hijacked. When a primary modifier is
 * used we emit BOTH platform variants (Ctrl+… and Cmd+…) to mirror the
 * defaults format and work cross-platform.
 */
export function chordFromEvent(e: KeyboardEvent): string[] | null {
  if (e.key === 'Control' || e.key === 'Shift' || e.key === 'Alt' || e.key === 'Meta') {
    return null
  }
  const token = keyToken(e)
  if (!token) return null

  const usesPrimary = e.metaKey || e.ctrlKey
  const isFunctionKey = /^F\d/.test(token)
  if (!usesPrimary && !isFunctionKey) return null

  const tail: string[] = []
  if (e.shiftKey) tail.push('Shift')
  if (e.altKey) tail.push('Alt')
  tail.push(token)
  const suffix = tail.join('+')

  return usesPrimary ? [`Ctrl+${suffix}`, `Cmd+${suffix}`] : [suffix]
}
