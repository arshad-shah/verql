import { mapType, generateMigrationDdl } from '../migration/type-map'
import type { TypeMapperRegistry } from '../plugins/sdk/type-mapper-registry'
import type { DriverRegistryImpl } from '../plugins/sdk/driver-registry'
import type { Handle } from './context'

export function registerMigrationHandlers(
  handle: Handle,
  typeMapperRegistry: TypeMapperRegistry,
  driverRegistry: DriverRegistryImpl,
): void {
  handle('migration:type-map', async (sourceType, from, to) => {
    return mapType(typeMapperRegistry, sourceType, from, to)
  })

  handle('migration:generate-ddl', async (tableName, columns, from, to) => {
    return generateMigrationDdl(typeMapperRegistry, driverRegistry, tableName, columns, from, to)
  })
}
