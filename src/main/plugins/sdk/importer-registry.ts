import type { Disposable } from './types'
import type { DbAdapter } from '../../db/adapter'

export interface ImporterOptions {
  tableName?: string
  schema?: string
  connectionType: string
  /** Required when the importer drives execution itself (e.g. SQL scripts).
   *  For data-file importers (CSV/JSON/parquet) the IPC layer parses without
   *  an adapter and inserts rows afterwards. */
  adapter?: DbAdapter
  columnMapping?: Record<string, string>
  onConflict?: 'skip' | 'update' | 'error'
}

export interface ImporterResult {
  /** Rows decoded from the file. For "data" importers this is the dataset; for
   *  "script" importers (SQL) the IPC handler can ignore this. */
  rows: Record<string, unknown>[]
  columns?: string[]
  /** Importers that ran their own statements (SQL) report execution stats so
   *  the renderer can show progress without a separate bulk-insert pass. */
  executed?: number
  errors?: string[]
}

export type ImporterParseFn = (
  content: string | Buffer,
  options: ImporterOptions
) => ImporterResult | Promise<ImporterResult>

export interface RegisteredImporter {
  format: string
  extensions: string[]
  displayName: string
  appliesTo?: (connectionType: string) => boolean
  /** When true, the importer mutates the database itself via `options.adapter`.
   *  The IPC handler will not perform a follow-up bulk-insert. */
  driverExecutes?: boolean
  parse: ImporterParseFn
}

export interface ImporterRegistry {
  register(id: string, importer: RegisteredImporter): Disposable
  get(id: string): RegisteredImporter | undefined
  findByExtension(ext: string, connectionType?: string): RegisteredImporter | undefined
  list(connectionType?: string): RegisteredImporter[]
}

export class ImporterRegistryImpl implements ImporterRegistry {
  private byId = new Map<string, RegisteredImporter>()

  register(id: string, importer: RegisteredImporter): Disposable {
    if (this.byId.has(id)) {
      throw new Error(`Importer '${id}' is already registered`)
    }
    this.byId.set(id, importer)
    return { dispose: () => { this.byId.delete(id) } }
  }

  get(id: string): RegisteredImporter | undefined {
    return this.byId.get(id)
  }

  findByExtension(ext: string, connectionType?: string): RegisteredImporter | undefined {
    const target = ext.toLowerCase().replace(/^\./, '')
    for (const importer of this.byId.values()) {
      if (!importer.extensions.some(e => e.toLowerCase() === target)) continue
      if (connectionType && importer.appliesTo && !importer.appliesTo(connectionType)) continue
      return importer
    }
    return undefined
  }

  list(connectionType?: string): RegisteredImporter[] {
    const all = [...this.byId.values()]
    if (!connectionType) return all
    return all.filter(i => !i.appliesTo || i.appliesTo(connectionType))
  }
}
