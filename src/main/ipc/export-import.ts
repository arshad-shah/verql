import { dialog } from 'electron'
import fs from 'fs'
import type { SchemaColumn } from '@shared/types'
import type { ExporterRegistry } from '../plugins/sdk/exporter-registry'
import type { ImporterRegistry } from '../plugins/sdk/importer-registry'
import { importCsvToTable } from '../import/csv-import'
import type { IpcContext, Handle } from './context'

interface RegistryDeps {
  exporterRegistry: ExporterRegistry
  importerRegistry: ImporterRegistry
}

function safeFileName(name: string): string {
  // Strip path separators, NUL, control chars, and Windows-reserved characters
  // from a user-supplied "table" name before using it as a filename. Anything
  // that survives is then constrained by the save dialog, but defense in depth.
  return name.replace(/[\x00-\x1F<>:"/\\|?*]/g, '_').slice(0, 200) || 'export'
}

async function readRowsForExport(
  ctx: IpcContext,
  profileId: string,
  table: string,
  schema?: string
): Promise<{ rows: Record<string, unknown>[]; columns: SchemaColumn[] }> {
  const adapter = ctx.activeAdapters.get(profileId)
  if (!adapter) throw new Error('Not connected')
  const profile = ctx.configStore.getConnection(profileId)
  const connectionType = profile?.type ?? ''
  const driver = ctx.driverRegistry.get(connectionType)
  if (!driver?.getTableData) {
    throw new Error(
      `Driver '${connectionType}' does not implement getTableData(). ` +
      `Cannot export this connection type without a driver-provided data fetcher.`
    )
  }
  return driver.getTableData(adapter, table, schema)
}

export function registerExportImportHandlers(
  ctx: IpcContext,
  handle: Handle,
  deps: RegistryDeps
): void {
  const { exporterRegistry, importerRegistry } = deps

  handle('export:table', async (profileId, tableName, format, options) => {
    const profile = ctx.configStore.getConnection(profileId)
    const connectionType = profile?.type ?? ''
    const exporter = exporterRegistry.resolve(format, connectionType)
    if (!exporter) {
      throw new Error(`No exporter registered for format '${format}' on '${connectionType}' connections`)
    }

    const { rows, columns } = await readRowsForExport(ctx, profileId, tableName, options?.schema)
    const content = await exporter.execute(rows, columns, {
      tableName,
      schema: options?.schema,
      connectionType,
      includeSchema: options?.includeSchema
    })

    const { filePath, canceled } = await dialog.showSaveDialog({
      defaultPath: `${safeFileName(tableName)}.${exporter.extension}`,
      filters: [{ name: exporter.displayName, extensions: [exporter.extension] }]
    })
    if (canceled || !filePath) return { cancelled: true as const }
    fs.writeFileSync(filePath, content)
    return { filePath }
  })

  handle('export:query-result', async (rows, fields, format) => {
    const exporter = exporterRegistry.resolve(format, '')
    if (!exporter) {
      throw new Error(`No exporter registered for format '${format}'`)
    }
    const columns: SchemaColumn[] = fields.map(name => ({
      name, dataType: 'unknown', nullable: true,
      isPrimaryKey: false, isForeignKey: false, defaultValue: null
    }))
    const content = await exporter.execute(rows, columns, {
      tableName: 'query-result',
      connectionType: ''
    })

    const { filePath, canceled } = await dialog.showSaveDialog({
      defaultPath: `query-result.${exporter.extension}`,
      filters: [{ name: exporter.displayName, extensions: [exporter.extension] }]
    })
    if (canceled || !filePath) return { cancelled: true as const }
    fs.writeFileSync(filePath, content)
    return { filePath }
  })

  handle('import:csv', async (profileId, tableName, columnMapping, onConflict) => {
    const adapter = ctx.activeAdapters.get(profileId)
    if (!adapter) throw new Error('Not connected')
    const profile = ctx.configStore.getConnection(profileId)
    const connectionType = profile?.type ?? ''

    const { filePaths, canceled } = await dialog.showOpenDialog({
      filters: [{ name: 'CSV', extensions: ['csv', 'tsv'] }],
      properties: ['openFile']
    })
    if (canceled || filePaths.length === 0) return { cancelled: true as const }

    const importer = importerRegistry.findByExtension('csv', connectionType)
    if (!importer) {
      throw new Error('No CSV importer is registered')
    }
    const content = fs.readFileSync(filePaths[0], 'utf-8')
    const result = await importer.parse(content, {
      tableName, connectionType, adapter, columnMapping, onConflict
    })
    if (!importer.driverExecutes) {
      // Generic CSV-into-relational-table fallback. The driver tells us its
      // dialect; if it has none, we can't generate INSERT statements, so the
      // importer plugin must register with driverExecutes:true and handle
      // insertion itself.
      const driver = ctx.driverRegistry.get(connectionType)
      if (!driver?.sqlDialect) {
        throw new Error(
          `Driver '${connectionType}' has no sqlDialect. The generic CSV → table ` +
          `importer cannot be used; register a driverExecutes importer instead.`
        )
      }
      return importCsvToTable(adapter, result.rows as Record<string, string>[], {
        tableName, columnMapping, onConflict,
        dialect: driver.sqlDialect
      })
    }
    return {
      inserted: result.executed ?? result.rows.length,
      skipped: 0,
      errors: result.errors ?? []
    }
  })

  handle('import:sql', async (profileId) => {
    const adapter = ctx.activeAdapters.get(profileId)
    if (!adapter) throw new Error('Not connected')
    const profile = ctx.configStore.getConnection(profileId)
    const connectionType = profile?.type ?? ''

    const { filePaths, canceled } = await dialog.showOpenDialog({
      filters: [{ name: 'SQL', extensions: ['sql'] }],
      properties: ['openFile']
    })
    if (canceled || filePaths.length === 0) return { cancelled: true as const }

    const importer = importerRegistry.findByExtension('sql', connectionType)
    if (!importer) {
      throw new Error(`No SQL importer is registered for '${connectionType}' connections`)
    }
    const content = fs.readFileSync(filePaths[0], 'utf-8')
    const result = await importer.parse(content, { connectionType, adapter })
    return {
      executed: result.executed ?? 0,
      errors: result.errors ?? []
    }
  })
}
