import { mapType, generateMigrationDdl } from '../migration/type-map'
import type { TypeMapperRegistry } from '../plugins/sdk/type-mapper-registry'
import type { Handle } from './context'

export function registerMigrationHandlers(
  handle: Handle,
  typeMapperRegistry: TypeMapperRegistry
): void {
  handle('migration:type-map', async (sourceType, from, to) => {
    return mapType(typeMapperRegistry, sourceType, from, to)
  })

  handle('migration:generate-ddl', async (tableName, columns, from, to) => {
    return generateMigrationDdl(typeMapperRegistry, tableName, columns, from, to)
  })
}
