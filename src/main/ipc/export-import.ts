import { dialog } from 'electron'
import fs from 'fs'
import { quoteIdentifier, type SqlDialect } from '../db/identifier'
import type { ExporterRegistry } from '../plugins/sdk/exporter-registry'
import type { ImporterRegistry } from '../plugins/sdk/importer-registry'
import type { IpcContext, Handle } from './context'

const DIALECT_BY_TYPE: Record<string, SqlDialect> = {
  postgresql: 'postgresql',
  postgres: 'postgresql',
  mysql: 'mysql',
  sqlite: 'sqlite'
}

interface RegistryDeps {
  exporterRegistry: ExporterRegistry
  importerRegistry: ImporterRegistry
}

export function registerExportImportHandlers(
  ctx: IpcContext,
  handle: Handle,
  deps: RegistryDeps
): void {
  const { exporterRegistry, importerRegistry } = deps

  handle('export:table', async (profileId, tableName, format, options) => {
    const adapter = ctx.activeAdapters.get(profileId)
    if (!adapter) throw new Error('Not connected')
    const profile = ctx.configStore.getConnection(profileId)
    const connectionType = profile?.type ?? ''

    const exporter = exporterRegistry.resolve(format, connectionType)
    if (!exporter) {
      throw new Error(`No exporter registered for format '${format}' on '${connectionType}' connections`)
    }

    const schema = options?.schema
    const columns = await adapter.getColumns(tableName, schema)

    // Read the row data through the adapter. For relational drivers we
    // generate a safely-quoted SELECT; non-relational drivers fall back to
    // their driver-provided sample query.
    let rows: Record<string, unknown>[] = []
    const dialect = DIALECT_BY_TYPE[connectionType]
    if (dialect) {
      const qualifiedTable = schema
        ? quoteIdentifier([schema, tableName], dialect)
        : quoteIdentifier(tableName, dialect)
      const result = await adapter.query(`SELECT * FROM ${qualifiedTable}`)
      rows = result.rows
    } else {
      const driver = ctx.driverRegistry.get(connectionType)
      if (driver?.sampleQuery) {
        const result = await adapter.query(driver.sampleQuery(tableName, schema))
        rows = result.rows
      }
    }

    const content = await exporter.execute(rows, columns, {
      tableName,
      schema,
      connectionType,
      includeSchema: options?.includeSchema
    })

    const { filePath, canceled } = await dialog.showSaveDialog({
      defaultPath: `${tableName}.${exporter.extension}`,
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
    const columns = fields.map(name => ({
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
    // Data importers return rows; the driver is responsible for the actual
    // INSERT loop. We fall back to a shared insert helper for relational
    // drivers when the importer didn't run statements itself.
    if (!importer.driverExecutes) {
      const { importCsvToTable } = await import('../import/csv-import')
      return importCsvToTable(adapter, result.rows as Record<string, string>[], {
        tableName, columnMapping, onConflict,
        dialect: DIALECT_BY_TYPE[connectionType]
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
