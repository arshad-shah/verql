import { useCallback } from 'react'
import type { MessageKey } from '@shared/i18n'
import { useToastStore } from '@/stores/toast'
import { useTranslation } from '@/i18n/I18nProvider'

/** Returns a `copy(text, successKey)` that writes to the clipboard and shows a
 *  success toast with the given i18n message — the copy-and-confirm pattern
 *  used across the explorer's context menus and hover actions. */
export function useClipboardCopy(): (text: string, successKey: MessageKey) => void {
  const addToast = useToastStore((s) => s.addToast)
  const { t } = useTranslation()
  return useCallback((text: string, successKey: MessageKey) => {
    navigator.clipboard.writeText(text).then(() => {
      addToast({ type: 'success', title: t(successKey) })
    })
  }, [addToast, t])
}
