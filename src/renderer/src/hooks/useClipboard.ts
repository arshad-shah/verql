import { useCallback, useRef, useState } from 'react'
import type { MessageKey, TranslationVars } from '@shared/i18n'
import { toast } from '@arshad-shah/cynosure-react/toast'
import { useTranslation } from '@/i18n/I18nProvider'

export interface CopyOptions {
  /** Show a success toast after copying. Pass a bare message key, or
   *  `{ key, vars }` when the message interpolates values (e.g. driver nouns). */
  toast?: MessageKey | { key: MessageKey; vars: TranslationVars }
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
  const { t } = useTranslation()

  const copy = useCallback((text: string, options?: CopyOptions) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        const tt = options?.toast
        if (!tt) return
        const title = typeof tt === 'string' ? t(tt) : t(tt.key, tt.vars)
        toast.success(title)
      })
      .catch(() => { /* clipboard blocked — silent */ })
    setCopied(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), options?.resetDelay ?? 1200)
  }, [t])

  return { copied, copy }
}
