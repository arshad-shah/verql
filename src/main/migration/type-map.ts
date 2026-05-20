import type { DatabaseType } from '@shared/types'
import type { TypeMapperRegistry } from '../plugins/sdk/type-mapper-registry'
import { quoteIdentifier, type SqlDialect } from '../db/identifier'

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

/** Pick the SQL dialect used to emit DDL for the target database type. */
function dialectFor(t: DatabaseType): SqlDialect | undefined {
  if (t === 'postgresql') return 'postgresql'
  if (t === 'mysql') return 'mysql'
  if (t === 'sqlite') return 'sqlite'
  if (t === 'snowflake') return 'snowflake'
  return undefined
}

/**
 * Emit a CREATE TABLE statement for a migration. Identifier escaping goes
 * through the dialect-aware `quoteIdentifier`. SQLite's `INTEGER PRIMARY KEY`
 * idiom is the one cross-dialect quirk we still encode here; everything
 * else flows from the registry-resolved type mapping.
 */
export function generateMigrationDdl(
  registry: TypeMapperRegistry,
  tableName: string,
  columns: { name: string; dataType: string; nullable: boolean; isPrimaryKey: boolean; defaultValue: string | null }[],
  from: DatabaseType,
  to: DatabaseType
): { ddl: string; mappings: TypeMapping[] } {
  const mappings = columns.map(c => mapType(registry, c.dataType, from, to))
  const dialect = dialectFor(to) ?? 'postgresql'

  const colDefs = columns.map((c, i) => {
    let def: string
    if (c.isPrimaryKey && to === 'sqlite') {
      // SQLite's rowid alias only kicks in when the column is INTEGER PRIMARY
      // KEY — anything else needs an explicit PRIMARY KEY clause.
      def = `  ${quoteIdentifier(c.name, 'sqlite')} INTEGER PRIMARY KEY`
    } else {
      def = `  ${quoteIdentifier(c.name, dialect)} ${mappings[i].target}`
      if (c.isPrimaryKey) def += ' PRIMARY KEY'
    }
    if (!c.nullable && !c.isPrimaryKey) def += ' NOT NULL'
    return def
  })

  const ddl = `CREATE TABLE ${quoteIdentifier(tableName, dialect)} (\n${colDefs.join(',\n')}\n);\n`
  return { ddl, mappings }
}
