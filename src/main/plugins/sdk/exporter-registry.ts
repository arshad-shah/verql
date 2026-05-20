import type { SchemaColumn } from '@shared/types'
import type { Disposable } from './types'

export interface ExporterOptions {
  tableName: string
  schema?: string
  /** The active connection's driver type (e.g. 'postgresql', 'mongodb'). Lets
   *  format-neutral exporters tag their output without consulting the driver. */
  connectionType: string
  includeSchema?: boolean
}

export type ExporterFn = (
  rows: Record<string, unknown>[],
  columns: SchemaColumn[],
  options: ExporterOptions
) => string | Buffer

export interface RegisteredExporter {
  /** Stable format identifier surfaced to the renderer (e.g. 'csv', 'sql', 'json').
   *  Multiple registrations can share a format (e.g. each SQL dialect picks a
   *  distinct `id` but advertises `format: 'sql'`); `appliesTo` decides which
   *  one runs for a given connection. */
  format: string
  extension: string
  displayName: string
  /** When present, the exporter only applies to matching connection types. */
  appliesTo?: (connectionType: string) => boolean
  execute: ExporterFn
}

export interface ExporterRegistry {
  register(id: string, exporter: RegisteredExporter): Disposable
  get(id: string): RegisteredExporter | undefined
  /** Resolve a registered exporter by its advertised format for the given
   *  connection type. Returns the first match whose `appliesTo` accepts the
   *  type (or which has no `appliesTo` predicate). */
  resolve(format: string, connectionType: string): RegisteredExporter | undefined
  list(connectionType?: string): RegisteredExporter[]
}

export class ExporterRegistryImpl implements ExporterRegistry {
  private byId = new Map<string, RegisteredExporter>()

  register(id: string, exporter: RegisteredExporter): Disposable {
    if (this.byId.has(id)) {
      throw new Error(`Exporter '${id}' is already registered`)
    }
    this.byId.set(id, exporter)
    return { dispose: () => { this.byId.delete(id) } }
  }

  get(id: string): RegisteredExporter | undefined {
    return this.byId.get(id)
  }

  resolve(format: string, connectionType: string): RegisteredExporter | undefined {
    for (const exporter of this.byId.values()) {
      if (exporter.format !== format) continue
      if (exporter.appliesTo && !exporter.appliesTo(connectionType)) continue
      return exporter
    }
    return undefined
  }

  list(connectionType?: string): RegisteredExporter[] {
    const all = [...this.byId.values()]
    if (!connectionType) return all
    return all.filter(e => !e.appliesTo || e.appliesTo(connectionType))
  }
}
