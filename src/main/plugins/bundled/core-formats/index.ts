import type { PluginContext } from '../../sdk/types'
import type { PluginManifest } from '../../types'
import { exportToCsv, parseCsvFile } from './csv'
import { exportToJson } from './json'

/**
 * Core formats plugin.
 *
 * Provides format-neutral exporters/importers (CSV, JSON) that don't depend on
 * a specific SQL dialect. Dialect-specific formats (e.g. SQL DDL) are
 * contributed by individual driver plugins so that adding a new database type
 * doesn't require editing the main app.
 *
 * The CSV importer is "parse-only" by default — it just turns a file into
 * rows. The orchestrator combines those rows with the target driver's
 * `quoteChar` + `placeholder` capabilities to produce dialect-correct
 * INSERT statements via {@link importCsvToTable}, which lives here too so
 * the entire generic-CSV path is owned by one plugin.
 */
export const manifest: PluginManifest = {
  name: 'verql-plugin-core-formats',
  version: '1.0.0',
  displayName: 'Core Formats',
  description: 'CSV and JSON import/export for any database',
  main: 'index.js',
  contributes: {
    exporters: [
      { id: 'csv', name: 'CSV', extension: 'csv' },
      { id: 'json', name: 'JSON', extension: 'json' }
    ],
    importers: [
      { id: 'csv', name: 'CSV', extensions: ['csv', 'tsv'] }
    ]
  }
}

export function activate(ctx: PluginContext): void {
  ctx.exporters.register('csv', {
    format: 'csv',
    extension: 'csv',
    displayName: 'CSV',
    execute(rows, columns) {
      return exportToCsv(rows, columns.map(c => c.name))
    }
  })

  ctx.exporters.register('json', {
    format: 'json',
    extension: 'json',
    displayName: 'JSON',
    execute(rows) {
      return exportToJson(rows)
    }
  })

  ctx.importers.register('csv', {
    format: 'csv',
    extensions: ['csv', 'tsv'],
    displayName: 'CSV / TSV',
    parse(content) {
      const text = typeof content === 'string' ? content : content.toString('utf-8')
      const { rows, headers } = parseCsvFile(text)
      return { rows, columns: headers }
    }
  })
}

export function deactivate(): void {
  // Subscriptions are tracked by the SDK and torn down automatically.
}
