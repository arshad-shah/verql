import { dialog } from 'electron'
import fs from 'fs'
import { exportTableToSql } from '../export/sql-export'
import { exportToCsv } from '../export/csv-export'
import { exportToJson } from '../export/json-export'
import { parseCsvFile, importCsvToTable } from '../import/csv-import'
import { executeSqlFile } from '../import/sql-import'
import type { IpcContext, Handle } from './context'

export function registerExportImportHandlers(ctx: IpcContext, handle: Handle): void {
  handle('export:table', async (profileId, tableName, format, options) => {
    const adapter = ctx.activeAdapters.get(profileId)
    if (!adapter) throw new Error('Not connected')
    const schema = options?.schema
    const columns = await adapter.getColumns(tableName, schema)
    const result = await adapter.query(`SELECT * FROM "${tableName}"`)
    const profile = ctx.configStore.getConnection(profileId)

    let content: string
    let defaultExt: string
    if (format === 'sql') {
      content = exportTableToSql(tableName, columns, result.rows, { includeSchema: options?.includeSchema, dbType: profile?.type })
      defaultExt = 'sql'
    } else if (format === 'csv') {
      content = exportToCsv(result.rows, columns.map(c => c.name))
      defaultExt = 'csv'
    } else {
      content = exportToJson(result.rows)
      defaultExt = 'json'
    }

    const { filePath, canceled } = await dialog.showSaveDialog({
      defaultPath: `${tableName}.${defaultExt}`,
      filters: [{ name: format.toUpperCase(), extensions: [defaultExt] }]
    })
    if (canceled || !filePath) return { cancelled: true as const }
    fs.writeFileSync(filePath, content, 'utf-8')
    return { filePath }
  })

  handle('export:query-result', async (rows, fields, format) => {
    let content: string
    let defaultExt: string
    if (format === 'csv') {
      content = exportToCsv(rows, fields)
      defaultExt = 'csv'
    } else {
      content = exportToJson(rows)
      defaultExt = 'json'
    }

    const { filePath, canceled } = await dialog.showSaveDialog({
      defaultPath: `query-result.${defaultExt}`,
      filters: [{ name: format.toUpperCase(), extensions: [defaultExt] }]
    })
    if (canceled || !filePath) return { cancelled: true as const }
    fs.writeFileSync(filePath, content, 'utf-8')
    return { filePath }
  })

  handle('import:csv', async (profileId, tableName, columnMapping, onConflict) => {
    const adapter = ctx.activeAdapters.get(profileId)
    if (!adapter) throw new Error('Not connected')

    const { filePaths, canceled } = await dialog.showOpenDialog({
      filters: [{ name: 'CSV', extensions: ['csv', 'tsv'] }],
      properties: ['openFile']
    })
    if (canceled || filePaths.length === 0) return { cancelled: true as const }

    const content = fs.readFileSync(filePaths[0], 'utf-8')
    const { rows } = parseCsvFile(content)
    return importCsvToTable(adapter, rows, { tableName, columnMapping, onConflict })
  })

  handle('import:sql', async (profileId) => {
    const adapter = ctx.activeAdapters.get(profileId)
    if (!adapter) throw new Error('Not connected')

    const { filePaths, canceled } = await dialog.showOpenDialog({
      filters: [{ name: 'SQL', extensions: ['sql'] }],
      properties: ['openFile']
    })
    if (canceled || filePaths.length === 0) return { cancelled: true as const }

    const content = fs.readFileSync(filePaths[0], 'utf-8')
    return executeSqlFile(adapter, content)
  })
}
