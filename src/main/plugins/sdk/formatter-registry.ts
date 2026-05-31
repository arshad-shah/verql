import type { Disposable } from './types'

/**
 * A registered source formatter. Plugins own the formatting logic; the main app
 * only resolves and invokes them. A formatter handles one editor `language`
 * (the driver's `editorLanguage`, e.g. 'sql', 'json', 'plaintext'). Within a
 * language, a driver may register a connection-type-specific formatter
 * (`appliesTo`) that wins over a language-wide fallback (no `appliesTo`).
 *
 * Examples: SQL drivers register `{ language: 'sql', appliesTo: pg }` (via the
 * shared {@link formatSql} helper); `core-formats` registers a generic
 * `{ language: 'sql' }` fallback; MongoDB registers `{ language: 'json' }`;
 * Redis `{ language: 'plaintext' }`. Future plugins do the same for their own
 * query language.
 */
export interface RegisteredFormatter {
  /** Editor language this formats (matches the driver's `editorLanguage`). */
  language: string
  /** Human label, e.g. "SQL (PostgreSQL)". */
  displayName: string
  /** Connection types this formatter applies to; omit for a language-wide
   *  fallback used when no connection-specific formatter matches. Declarative
   *  (not a predicate) so the descriptor can cross the isolation boundary. */
  appliesToTypes?: string[]
  /** Pretty-print the source. Must return the input unchanged on failure so a
   *  formatting error never destroys the user's buffer. */
  format: (source: string) => string | Promise<string>
}

export interface FormatterRegistry {
  register(id: string, formatter: RegisteredFormatter): Disposable
  get(id: string): RegisteredFormatter | undefined
  /** Resolve the best formatter for an editor language + connection type: a
   *  connection-specific formatter (its `appliesTo` accepts the type) wins over
   *  a language-wide fallback. Never crosses languages, so a SQL fallback can't
   *  apply to a JSON/plaintext editor. */
  resolve(language: string, connectionType: string): RegisteredFormatter | undefined
  list(): RegisteredFormatter[]
}

export class FormatterRegistryImpl implements FormatterRegistry {
  private byId = new Map<string, RegisteredFormatter>()

  register(id: string, formatter: RegisteredFormatter): Disposable {
    if (this.byId.has(id)) {
      throw new Error(`Formatter '${id}' is already registered`)
    }
    this.byId.set(id, formatter)
    return { dispose: () => { this.byId.delete(id) } }
  }

  get(id: string): RegisteredFormatter | undefined {
    return this.byId.get(id)
  }

  resolve(language: string, connectionType: string): RegisteredFormatter | undefined {
    for (const f of this.byId.values()) {
      if (f.language === language && f.appliesToTypes && f.appliesToTypes.includes(connectionType)) return f
    }
    for (const f of this.byId.values()) {
      if (f.language === language && !f.appliesToTypes) return f
    }
    return undefined
  }

  list(): RegisteredFormatter[] {
    return [...this.byId.values()]
  }
}
