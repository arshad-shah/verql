import type { TypeMappingEntry } from '../../sdk/type-mapper-registry'

/** Types coming FROM PostgreSQL into SQLite. */
export const PG_TO_SQLITE: Record<string, TypeMappingEntry> = {
  'serial': { target: 'INTEGER', lossy: false },
  'bigserial': { target: 'INTEGER', lossy: false },
  'integer': { target: 'INTEGER', lossy: false },
  'bigint': { target: 'INTEGER', lossy: false },
  'smallint': { target: 'INTEGER', lossy: false },
  'numeric': { target: 'REAL', lossy: true, note: 'SQLite has no DECIMAL type' },
  'real': { target: 'REAL', lossy: false },
  'double precision': { target: 'REAL', lossy: false },
  'boolean': { target: 'INTEGER', lossy: false },
  'text': { target: 'TEXT', lossy: false },
  'character varying': { target: 'TEXT', lossy: false },
  'varchar': { target: 'TEXT', lossy: false },
  'uuid': { target: 'TEXT', lossy: false },
  'json': { target: 'TEXT', lossy: true, note: 'Stored as text, no JSON functions' },
  'jsonb': { target: 'TEXT', lossy: true, note: 'Stored as text, no JSON functions' },
  'timestamp without time zone': { target: 'TEXT', lossy: true, note: 'SQLite has no date type' },
  'timestamp with time zone': { target: 'TEXT', lossy: true, note: 'SQLite has no date type' },
  'timestamptz': { target: 'TEXT', lossy: true, note: 'SQLite has no date type' },
  'date': { target: 'TEXT', lossy: true, note: 'SQLite has no date type' },
  'bytea': { target: 'BLOB', lossy: false }
}

export function pgToSqliteFallback(_normalized: string): TypeMappingEntry {
  return { target: 'TEXT', lossy: true, note: 'Unmapped type' }
}

/** Types coming FROM MySQL into SQLite. MySQL → SQLite has no rich
 *  affinity rules; mostly map int/decimal families to INTEGER/REAL/TEXT. */
export const MYSQL_TO_SQLITE: Record<string, TypeMappingEntry> = {
  'int': { target: 'INTEGER', lossy: false },
  'bigint': { target: 'INTEGER', lossy: false },
  'smallint': { target: 'INTEGER', lossy: false },
  'tinyint': { target: 'INTEGER', lossy: false },
  'tinyint(1)': { target: 'INTEGER', lossy: false },
  'float': { target: 'REAL', lossy: false },
  'double': { target: 'REAL', lossy: false },
  'decimal': { target: 'REAL', lossy: true, note: 'SQLite has no DECIMAL type' },
  'varchar': { target: 'TEXT', lossy: false },
  'char': { target: 'TEXT', lossy: false },
  'text': { target: 'TEXT', lossy: false },
  'mediumtext': { target: 'TEXT', lossy: false },
  'longtext': { target: 'TEXT', lossy: false },
  'json': { target: 'TEXT', lossy: true, note: 'Stored as text' },
  'datetime': { target: 'TEXT', lossy: true, note: 'SQLite has no date type' },
  'date': { target: 'TEXT', lossy: true, note: 'SQLite has no date type' },
  'time': { target: 'TEXT', lossy: true, note: 'SQLite has no date type' },
  'timestamp': { target: 'TEXT', lossy: true, note: 'SQLite has no date type' },
  'blob': { target: 'BLOB', lossy: false }
}

export function mysqlToSqliteFallback(_normalized: string): TypeMappingEntry {
  return { target: 'TEXT', lossy: true, note: 'Unmapped type, defaulting to TEXT' }
}

/** SQLite → MySQL (affinity heuristic). */
export function sqliteToMysqlFallback(normalized: string): TypeMappingEntry {
  const bare = normalized.replace(/\(.+\)/, '').trim()
  if (/int/i.test(bare)) return { target: 'INT', lossy: false }
  if (/real|float|double/i.test(bare)) return { target: 'DOUBLE', lossy: false }
  if (/blob/i.test(bare)) return { target: 'BLOB', lossy: false }
  return { target: 'TEXT', lossy: false }
}
