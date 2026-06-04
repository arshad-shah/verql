import type { DatabaseType } from '@shared/types'
import type { TypeMapperRegistry } from '../plugins/sdk/type-mapper-registry'
import type { DriverRegistryImpl } from '../plugins/sdk/driver-registry'

export interface TypeMapping {
  source: string
  target: string
  lossy: boolean
  note?: string
}

/**
 * Resolve a type mapping through the plugin-contributed registry. Each driver
 * registers what it knows about translating types into/out of its own dialect,
 * so the orchestrator never has to enumerate database types.
 *
 * Falls back to identity when no mapper is registered for the direction —
 * better than silently returning TEXT, since callers can detect the
 * `lossy: true` + note and surface the issue.
 */
export function mapType(
  registry: TypeMapperRegistry,
  sourceType: string,
  from: DatabaseType,
  to: DatabaseType
): TypeMapping {
  const resolved = registry.resolve(from, to, sourceType)
  if (resolved) return resolved
  return {
    source: sourceType,
    target: sourceType,
    lossy: true,
    note: `No type mapper registered for ${from} → ${to}`
  }
}

/**
 * Emit a CREATE TABLE statement for a migration. The target driver owns the
 * dialect-specific quirks (SQLite's INTEGER PRIMARY KEY rowid alias,
 * MySQL's storage clauses, …) via its `generateMigrationDdl` capability —
 * the orchestrator just hands the resolved column types over and returns
 * whatever DDL the driver produces.
 */
export async function generateMigrationDdl(
  registry: TypeMapperRegistry,
  drivers: DriverRegistryImpl,
  tableName: string,
  columns: { name: string; dataType: string; nullable: boolean; isPrimaryKey: boolean; defaultValue: string | null }[],
  from: DatabaseType,
  to: DatabaseType
): Promise<{ ddl: string; mappings: TypeMapping[] }> {
  const mappings = columns.map(c => mapType(registry, c.dataType, from, to))
  const targetDriver = drivers.get(to)
  if (!targetDriver?.generateMigrationDdl) {
    throw new Error(
      `Target driver '${to}' does not contribute generateMigrationDdl(). ` +
      `Add it to the driver plugin's registration.`,
    )
  }
  const ddlColumns = columns.map((c, i) => ({
    name: c.name,
    dataType: mappings[i].target,
    nullable: c.nullable,
    isPrimaryKey: c.isPrimaryKey,
    defaultValue: c.defaultValue,
  }))
  const ddl = await targetDriver.generateMigrationDdl(tableName, ddlColumns)
  return { ddl, mappings }
}
