import { mapType, generateMigrationDdl } from '../migration/type-map'
import type { Handle } from './context'

export function registerMigrationHandlers(handle: Handle): void {
  handle('migration:type-map', async (sourceType, from, to) => {
    return mapType(sourceType, from, to)
  })

  handle('migration:generate-ddl', async (tableName, columns, from, to) => {
    return generateMigrationDdl(tableName, columns, from, to)
  })
}
