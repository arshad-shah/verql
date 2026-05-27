import type { Disposable } from './types'

/**
 * A registered source formatter. Plugins own the actual formatting logic; the
 * main app only resolves and invokes them. SQL drivers register a
 * dialect-specific formatter (via the shared {@link formatSql} helper), while
 * `core-formats` registers a generic SQL fallback with no `appliesTo`. A new
 * database plugin can register whatever formatter suits its query language.
 */
export interface RegisteredFormatter {
  /** Human label, e.g. "SQL (PostgreSQL)". */
  displayName: string
  /** Restrict to matching connection types; omit for a generic fallback that
   *  applies when no dialect-specific formatter matches. */
  appliesTo?: (connectionType: string) => boolean
  /** Pretty-print the source. Must return the input unchanged on failure so a
   *  formatting error never destroys the user's buffer. */
  format: (source: string) => string | Promise<string>
}

export interface FormatterRegistry {
  register(id: string, formatter: RegisteredFormatter): Disposable
  get(id: string): RegisteredFormatter | undefined
  /** Resolve the best formatter for a connection type: a dialect-specific one
   *  (its `appliesTo` accepts the type) wins over a generic fallback. */
  resolve(connectionType: string): RegisteredFormatter | undefined
  list(connectionType?: string): RegisteredFormatter[]
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

  resolve(connectionType: string): RegisteredFormatter | undefined {
    for (const f of this.byId.values()) {
      if (f.appliesTo && f.appliesTo(connectionType)) return f
    }
    for (const f of this.byId.values()) {
      if (!f.appliesTo) return f
    }
    return undefined
  }

  list(connectionType?: string): RegisteredFormatter[] {
    const all = [...this.byId.values()]
    if (!connectionType) return all
    return all.filter(f => !f.appliesTo || f.appliesTo(connectionType))
  }
}
