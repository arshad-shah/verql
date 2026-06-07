import { useCallback, useRef, useState } from 'react'

/** Clipboard copy with a transient "copied" flag that auto-resets — the
 *  inline checkmark/feedback pattern used by code blocks and chat messages.
 *  `resetDelay` controls how long the flag stays true (ms). */
export function useCopyToClipboard(resetDelay = 1200): { copied: boolean; copy: (text: string) => void } {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const copy = useCallback((text: string) => {
    void navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), resetDelay)
  }, [resetDelay])

  return { copied, copy }
}
