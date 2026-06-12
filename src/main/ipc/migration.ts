import { mapType, generateMigrationDdl } from '../migration/type-map'
import { IPC_CHANNELS } from '@shared/ipc'
import type { TypeMapperRegistry } from '../plugins/sdk/type-mapper-registry'
import type { DriverRegistryImpl } from '../plugins/sdk/driver-registry'
import type { Handle } from './context'

export function registerMigrationHandlers(
  handle: Handle,
  typeMapperRegistry: TypeMapperRegistry,
  driverRegistry: DriverRegistryImpl,
): void {
  handle(IPC_CHANNELS.MIGRATION_TYPE_MAP, async (sourceType, from, to) => {
    return mapType(typeMapperRegistry, sourceType, from, to)
  })

  handle(IPC_CHANNELS.MIGRATION_GENERATE_DDL, async (tableName, columns, from, to) => {
    return generateMigrationDdl(typeMapperRegistry, driverRegistry, tableName, columns, from, to)
  })
}
