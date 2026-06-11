import { useEffect, type RefObject } from 'react'

interface UseClickOutsideOptions {
  /** When false, the listener isn't attached (e.g. while the popover is closed). Default true. */
  enabled?: boolean
  /** Attach the listener on a `setTimeout(0)` so the opening click that mounted
   *  the element doesn't immediately trigger `onOutside`. Default false. */
  deferAttach?: boolean
}

/**
 * Fire `onOutside` when a `mousedown` lands outside `ref`'s element — the one
 * home for the dismiss-on-outside-click pattern that dropdowns/popovers used to
 * hand-roll. A null ref (unmounted element) treats every click as outside.
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onOutside: () => void,
  options?: UseClickOutsideOptions,
): void {
  const enabled = options?.enabled ?? true
  const deferAttach = options?.deferAttach ?? false

  useEffect(() => {
    if (!enabled) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside()
    }
    if (deferAttach) {
      const timer = setTimeout(() => document.addEventListener('mousedown', handler), 0)
      return () => {
        clearTimeout(timer)
        document.removeEventListener('mousedown', handler)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ref, onOutside, enabled, deferAttach])
}
