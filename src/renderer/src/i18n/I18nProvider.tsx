// Renderer React layer over the framework-free i18n core (shared/i18n).
//
//   • <I18nProvider> keeps the core's active locale in sync with the user's
//     `general.language` setting.
//   • useTranslation() returns a `t` that re-renders its consumers when the
//     locale changes (via useSyncExternalStore over the core's subscribe()).
//
// Components call `const { t } = useTranslation()` then `t('settings.general.…')`.
import { useEffect, useSyncExternalStore, type ReactNode } from 'react'
import {
  t as coreT,
  getLocale,
  setLocale,
  subscribeLocale,
  type MessageKey,
  type TranslationVars,
} from '@shared/i18n'
import { useSettingsStore } from '@/stores/settings'

/** Subscribe to the active locale; re-renders the caller when it changes. */
export function useLocale(): string {
  return useSyncExternalStore(subscribeLocale, getLocale, getLocale)
}

export interface Translator {
  t: (key: MessageKey, vars?: TranslationVars) => string
  locale: string
}

/** Reactive translator hook. */
export function useTranslation(): Translator {
  const locale = useLocale()
  return { t: coreT, locale }
}

/** Syncs the i18n core locale from the user's language setting. */
export function I18nProvider({ children }: { children: ReactNode }) {
  const language = useSettingsStore((s) => s.settings.general.language)
  useEffect(() => {
    setLocale(language || 'en')
  }, [language])
  return <>{children}</>
}
