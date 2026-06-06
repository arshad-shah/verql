import type { DbErrorRule } from '@shared/db-errors'

// MySQL query-semantic error patterns (driver-owned classification). First
// capture group → message variable.
export const mysqlErrorRules: DbErrorRule[] = [
  { code: 'COLUMN_NOT_FOUND', pattern: "Unknown column ['\"`]?([^'\"`]+)['\"`]?" },
  { code: 'TABLE_NOT_FOUND', pattern: "Table ['\"`]?[^.'\"`]+\\.([^'\"`]+)['\"`]? doesn['’]?t exist" },
  { code: 'SYNTAX_ERROR', pattern: "You have an error in your SQL syntax.*?near ['\"`]?([^'\"`]+)['\"`]?" },
  { code: 'UNIQUE_VIOLATION', pattern: "Duplicate entry ['\"`]?[^'\"`]+['\"`]? for key ['\"`]?([^'\"`]+)['\"`]?" },
  { code: 'NOT_NULL_VIOLATION', pattern: "Column ['\"`]?([^'\"`]+)['\"`]? cannot be null" },
  { code: 'FOREIGN_KEY_VIOLATION', pattern: "Cannot add or update a child row" },
  { code: 'TYPE_MISMATCH', pattern: "Incorrect (?:integer|decimal|datetime) value" },
  { code: 'DUPLICATE_TABLE', pattern: "Table ['\"`]?([^'\"`]+)['\"`]? already exists" },
  { code: 'DIVISION_BY_ZERO', pattern: "division by zero" },
  { code: 'DEADLOCK', pattern: "Deadlock found when trying to get lock" },
]
