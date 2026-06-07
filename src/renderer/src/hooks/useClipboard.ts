import { useCallback, useRef, useState } from 'react'
import type { MessageKey } from '@shared/i18n'
import { useToastStore } from '@/stores/toast'
import { useTranslation } from '@/i18n/I18nProvider'

export interface CopyOptions {
  /** Show a success toast with this i18n message after copying. */
  toast?: MessageKey
  /** How long the returned `copied` flag stays true, in ms. Default 1200. */
  resetDelay?: number
}

/** The one clipboard hook. `copy(text)` writes to the clipboard and flips a
 *  transient `copied` flag (for inline checkmarks); pass `{ toast }` to also
 *  surface a success toast (for context menus / hover actions). Both surfaces
 *  share one implementation — a blocked clipboard fails silently. */
export function useClipboard(): { copied: boolean; copy: (text: string, options?: CopyOptions) => void } {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const addToast = useToastStore((s) => s.addToast)
  const { t } = useTranslation()

  const copy = useCallback((text: string, options?: CopyOptions) => {
    navigator.clipboard.writeText(text)
      .then(() => { if (options?.toast) addToast({ type: 'success', title: t(options.toast) }) })
      .catch(() => { /* clipboard blocked — silent */ })
    setCopied(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), options?.resetDelay ?? 1200)
  }, [addToast, t])

  return { copied, copy }
}
