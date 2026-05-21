import type { TypeMappingEntry } from '../../sdk/type-mapper-registry'

/** Types coming FROM MySQL into PostgreSQL. */
export const MYSQL_TO_PG: Record<string, TypeMappingEntry> = {
  'int': { target: 'integer', lossy: false },
  'bigint': { target: 'bigint', lossy: false },
  'smallint': { target: 'smallint', lossy: false },
  'tinyint': { target: 'smallint', lossy: false },
  'tinyint(1)': { target: 'boolean', lossy: false },
  'float': { target: 'real', lossy: false },
  'double': { target: 'double precision', lossy: false },
  'decimal': { target: 'numeric', lossy: false },
  'varchar': { target: 'varchar', lossy: false },
  'char': { target: 'char', lossy: false },
  'text': { target: 'text', lossy: false },
  'mediumtext': { target: 'text', lossy: false },
  'longtext': { target: 'text', lossy: false },
  'json': { target: 'jsonb', lossy: false },
  'datetime': { target: 'timestamp', lossy: false },
  'date': { target: 'date', lossy: false },
  'time': { target: 'time', lossy: false },
  'timestamp': { target: 'timestamptz', lossy: false },
  'blob': { target: 'bytea', lossy: false },
  'enum': { target: 'varchar', lossy: true, note: 'PostgreSQL has no enum shorthand — use CHECK or create type' }
}

export function mysqlToPgFallback(_normalized: string): TypeMappingEntry {
  return { target: 'text', lossy: true, note: 'Unmapped type' }
}

/** SQLite has only 4 storage classes — heuristic map by affinity. */
export function sqliteToPgFallback(normalized: string): TypeMappingEntry {
  // Strip any parameterization like INT(11).
  const bare = normalized.replace(/\(.+\)/, '').trim()
  if (/int/i.test(bare)) return { target: 'integer', lossy: false }
  if (/real|float|double/i.test(bare)) return { target: 'double precision', lossy: false }
  if (/blob/i.test(bare)) return { target: 'bytea', lossy: false }
  return { target: 'text', lossy: false }
}
