// Verql i18n core — framework-free and importable from BOTH Electron processes
// (the renderer via @/i18n's React layer, the main process directly). Holds the
// active locale + registered catalogues and resolves a key to a formatted
// string, falling back to English (then to the key itself) when a translation
// is missing. English ships in-bundle; other locales register at runtime.
//
// Design notes:
//  • Tiny and dependency-free — desktop bundle stays lean.
//  • A subscribe() hook lets the renderer re-render on locale change
//    (see src/renderer/src/i18n/I18nProvider.tsx); the main process just calls
//    t() after setting the locale.
//  • Plugins can ship their own catalogues via registerLocale(locale, partial).
import { en } from './locales/en'
import { formatMessage, type TranslationVars } from './format'
import type { Locale, MessageKey, LocaleCatalog } from './types'

const DEFAULT_LOCALE: Locale = 'en'

// English is always present and is the fallback for every other locale.
const catalogs = new Map<string, unknown>([['en', en]])
let activeLocale: Locale = DEFAULT_LOCALE
const listeners = new Set<() => void>()

function notify(): void {
  for (const l of listeners) l()
}

/** Register (or merge) a locale catalogue. Partial trees are allowed; missing
 *  keys fall back to English. */
export function registerLocale(locale: string, messages: LocaleCatalog): void {
  const existing = catalogs.get(locale)
  catalogs.set(locale, existing ? deepMerge(existing, messages) : messages)
  notify()
}

/** Switch the active locale. No-op (and no notify) if unchanged. */
export function setLocale(locale: Locale): void {
  if (locale === activeLocale) return
  activeLocale = locale
  notify()
}

export function getLocale(): Locale {
  return activeLocale
}

export function availableLocales(): string[] {
  return [...catalogs.keys()]
}

/** Subscribe to locale/catalogue changes. Returns an unsubscribe. */
export function subscribeLocale(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

function lookup(catalog: unknown, key: string): string | undefined {
  let cur: unknown = catalog
  for (const part of key.split('.')) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[part]
  }
  return typeof cur === 'string' ? cur : undefined
}

/**
 * Translate a key with optional variables. Resolution order: active locale →
 * English → the raw key (so a missing string is visible, never blank).
 */
export function translate(key: MessageKey, vars?: TranslationVars): string {
  const template =
    lookup(catalogs.get(activeLocale), key) ?? lookup(en, key) ?? key
  return formatMessage(template, vars)
}

/** Short alias — the conventional `t(...)`. */
export const t = translate

function deepMerge(a: unknown, b: unknown): unknown {
  if (typeof a !== 'object' || a === null) return b
  if (typeof b !== 'object' || b === null) return b
  const out: Record<string, unknown> = { ...(a as Record<string, unknown>) }
  for (const [k, v] of Object.entries(b as Record<string, unknown>)) {
    out[k] = k in out ? deepMerge(out[k], v) : v
  }
  return out
}

export { en }
export type { Locale, MessageKey, LocaleCatalog, TranslationVars }
