import type { DatabaseType } from '@shared/types'

export interface TypeMapping {
  source: string
  target: string
  lossy: boolean
  note?: string
}

const PG_TO_MYSQL: Record<string, { target: string; lossy: boolean; note?: string }> = {
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
  'macaddr': { target: 'VARCHAR(17)', lossy: true, note: 'No native macaddr type in MySQL' },
}

const PG_TO_SQLITE: Record<string, { target: string; lossy: boolean; note?: string }> = {
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
  'bytea': { target: 'BLOB', lossy: false },
}

const MYSQL_TO_PG: Record<string, { target: string; lossy: boolean; note?: string }> = {
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
  'enum': { target: 'varchar', lossy: true, note: 'PostgreSQL has no enum shorthand — use CHECK or create type' },
}

export function mapType(
  sourceType: string,
  from: DatabaseType,
  to: DatabaseType
): TypeMapping {
  const normalized = sourceType.toLowerCase().trim()

  if (from === to) return { source: sourceType, target: sourceType, lossy: false }

  let map: Record<string, { target: string; lossy: boolean; note?: string }>

  if (from === 'postgresql' && to === 'mysql') map = PG_TO_MYSQL
  else if (from === 'postgresql' && to === 'sqlite') map = PG_TO_SQLITE
  else if (from === 'mysql' && to === 'postgresql') map = MYSQL_TO_PG
  else if (from === 'mysql' && to === 'sqlite') {
    // MySQL → SQLite: go through PG as intermediate
    const toPg = MYSQL_TO_PG[normalized]
    if (toPg) {
      const toSqlite = PG_TO_SQLITE[toPg.target]
      if (toSqlite) return { source: sourceType, target: toSqlite.target, lossy: toPg.lossy || toSqlite.lossy, note: toSqlite.note }
    }
    return { source: sourceType, target: 'TEXT', lossy: true, note: 'Unmapped type, defaulting to TEXT' }
  }
  else if (from === 'sqlite') {
    // SQLite types are simple — map directly
    const sqliteNorm = normalized.replace(/\(.+\)/, '').trim()
    if (/int/i.test(sqliteNorm)) return { source: sourceType, target: to === 'postgresql' ? 'integer' : 'INT', lossy: false }
    if (/real|float|double/i.test(sqliteNorm)) return { source: sourceType, target: to === 'postgresql' ? 'double precision' : 'DOUBLE', lossy: false }
    if (/blob/i.test(sqliteNorm)) return { source: sourceType, target: to === 'postgresql' ? 'bytea' : 'BLOB', lossy: false }
    return { source: sourceType, target: to === 'postgresql' ? 'text' : 'TEXT', lossy: false }
  }
  else {
    return { source: sourceType, target: sourceType, lossy: false }
  }

  const entry = map[normalized]
  if (entry) return { source: sourceType, target: entry.target, lossy: entry.lossy, note: entry.note }

  // Fallback — use TEXT
  return { source: sourceType, target: to === 'sqlite' ? 'TEXT' : to === 'mysql' ? 'TEXT' : 'text', lossy: true, note: 'Unmapped type' }
}

export function generateMigrationDdl(
  tableName: string,
  columns: { name: string; dataType: string; nullable: boolean; isPrimaryKey: boolean; defaultValue: string | null }[],
  from: DatabaseType,
  to: DatabaseType
): { ddl: string; mappings: TypeMapping[] } {
  const mappings = columns.map(c => mapType(c.dataType, from, to))

  const colDefs = columns.map((c, i) => {
    let def = `  "${c.name}" ${mappings[i].target}`
    if (c.isPrimaryKey) {
      if (to === 'sqlite') def = `  "${c.name}" INTEGER PRIMARY KEY`
      else if (to === 'mysql') def += ' PRIMARY KEY'
      else def += ' PRIMARY KEY'
    }
    if (!c.nullable && !c.isPrimaryKey) def += ' NOT NULL'
    return def
  })

  const ddl = `CREATE TABLE "${tableName}" (\n${colDefs.join(',\n')}\n);\n`
  return { ddl, mappings }
}
