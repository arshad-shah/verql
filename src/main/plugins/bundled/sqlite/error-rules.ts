import type { DbErrorRule } from '@shared/db-errors'

// SQLite query-semantic error patterns (driver-owned classification). First
// capture group → message variable.
export const sqliteErrorRules: DbErrorRule[] = [
  { code: 'COLUMN_NOT_FOUND', pattern: "no such column:\\s*(\\S+)" },
  { code: 'TABLE_NOT_FOUND', pattern: "no such table:\\s*(\\S+)" },
  { code: 'SYNTAX_ERROR', pattern: "near [\"'`]?([^\"'`]+)[\"'`]?\\s*[:,]\\s*syntax error" },
  { code: 'UNIQUE_VIOLATION', pattern: "UNIQUE constraint failed:\\s*([^\\s,]+(?:,\\s*[^\\s,]+)*)" },
  { code: 'NOT_NULL_VIOLATION', pattern: "NOT NULL constraint failed:\\s*(\\S+)" },
  { code: 'FOREIGN_KEY_VIOLATION', pattern: "FOREIGN KEY constraint failed|REFERENCES constraint failed" },
  { code: 'CHECK_VIOLATION', pattern: "CHECK constraint failed" },
  { code: 'TYPE_MISMATCH', pattern: "datatype mismatch" },
]
