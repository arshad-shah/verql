import type { TypeMappingEntry } from '../../sdk/type-mapper-registry'

/** Types coming FROM PostgreSQL into MySQL. */
export const PG_TO_MYSQL: Record<string, TypeMappingEntry> = {
  'serial': { target: 'INT AUTO_INCREMENT', lossy: false },
  'bigserial': { target: 'BIGINT AUTO_INCREMENT', lossy: false },
  'smallserial': { target: 'SMALLINT AUTO_INCREMENT', lossy: false },
  'integer': { target: 'INT', lossy: false },
  'bigint': { target: 'BIGINT', lossy: false },
  'smallint': { target: 'SMALLINT', lossy: false },
  'numeric': { target: 'DECIMAL', lossy: false },
  'real': { target: 'FLOAT', lossy: false },
  'double precision': { target: 'DOUBLE', lossy: false },
  'boolean': { target: 'TINYINT(1)', lossy: false },
  'text': { target: 'TEXT', lossy: false },
  'character varying': { target: 'VARCHAR(255)', lossy: false },
  'varchar': { target: 'VARCHAR(255)', lossy: false },
  'char': { target: 'CHAR', lossy: false },
  'uuid': { target: 'CHAR(36)', lossy: false },
  'json': { target: 'JSON', lossy: false },
  'jsonb': { target: 'JSON', lossy: true, note: 'jsonb operators not available in MySQL' },
  'timestamp without time zone': { target: 'DATETIME', lossy: false },
  'timestamp with time zone': { target: 'DATETIME', lossy: true, note: 'MySQL DATETIME has no timezone' },
  'timestamptz': { target: 'DATETIME', lossy: true, note: 'MySQL DATETIME has no timezone' },
  'date': { target: 'DATE', lossy: false },
  'time': { target: 'TIME', lossy: false },
  'bytea': { target: 'BLOB', lossy: false },
  'text[]': { target: 'JSON', lossy: true, note: 'Array stored as JSON' },
  'integer[]': { target: 'JSON', lossy: true, note: 'Array stored as JSON' },
  'inet': { target: 'VARCHAR(45)', lossy: true, note: 'No native inet type in MySQL' },
  'cidr': { target: 'VARCHAR(45)', lossy: true, note: 'No native cidr type in MySQL' },
  'macaddr': { target: 'VARCHAR(17)', lossy: true, note: 'No native macaddr type in MySQL' }
}

/** Fallback for anything not in PG_TO_MYSQL — store as TEXT. */
export function pgToMysqlFallback(_normalized: string): TypeMappingEntry {
  return { target: 'TEXT', lossy: true, note: 'Unmapped type' }
}
