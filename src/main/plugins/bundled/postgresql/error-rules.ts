import type { DbErrorRule } from '@shared/db-errors'

// Postgres query-semantic error patterns (driver-owned classification). The
// renderer compiles each `pattern` case-insensitively and uses the first capture
// group as the message variable (column/table/schema/constraint name, etc.).
// Connection/auth/app-layer errors are classified host-side (cross-driver).
export const postgresErrorRules: DbErrorRule[] = [
  { code: 'COLUMN_NOT_FOUND', pattern: "column [\"'`]?([^\"'`]+)[\"'`]? does not exist" },
  { code: 'TABLE_NOT_FOUND', pattern: "relation [\"'`]?([^\"'`]+)[\"'`]? does not exist" },
  { code: 'SCHEMA_NOT_FOUND', pattern: "schema [\"'`]?([^\"'`]+)[\"'`]? does not exist" },
  { code: 'SYNTAX_ERROR', pattern: "syntax error at or near [\"'`]?([^\"'`]+)[\"'`]?" },
  { code: 'UNIQUE_VIOLATION', pattern: "duplicate key value violates unique constraint [\"'`]?([^\"'`]+)[\"'`]?" },
  { code: 'NOT_NULL_VIOLATION', pattern: "null value in column [\"'`]?([^\"'`]+)[\"'`]?" },
  { code: 'FOREIGN_KEY_VIOLATION', pattern: "violates foreign key constraint" },
  { code: 'CHECK_VIOLATION', pattern: "violates check constraint" },
  { code: 'TYPE_MISMATCH', pattern: "invalid input syntax for type" },
  { code: 'DUPLICATE_TABLE', pattern: "relation [\"'`]?([^\"'`]+)[\"'`]? already exists" },
  { code: 'DIVISION_BY_ZERO', pattern: "division by zero" },
  { code: 'DEADLOCK', pattern: "deadlock detected" },
  { code: 'TRANSACTION_ABORTED', pattern: "current transaction is aborted" },
]
