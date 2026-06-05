import type { en } from './locales/en'

export type { TranslationVars } from './format'

/** Locale id. Open so additional locales register without a type change. */
export type Locale = 'en' | (string & {})

/** The catalogue shape (English is the structural source of truth). */
export type Messages = typeof en

/** Dotted paths to string leaves of a nested message object, e.g.
 *  `'settings.general.queryTimeout.label'`. Gives `t()` autocomplete and
 *  compile-time errors on unknown keys. */
export type MessageKey<T = Messages> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${MessageKey<T[K]>}`
}[keyof T & string]

/** A partial locale catalogue — any subset of the English tree. */
export type LocaleCatalog = DeepPartial<Messages>

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}
