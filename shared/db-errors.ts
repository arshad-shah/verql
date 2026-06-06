// Shared, cross-process error-classification contract.
//
// `DbErrorCode` is the stable product-level error taxonomy. Query-semantic
// errors (bad column/table, syntax, constraint violations, …) are recognised by
// **driver-contributed** `DbErrorRule`s — each driver declares the regexes for
// its own dialect via `errorRules` on its factory, serialized into capabilities.
// The renderer owns the user-facing messages (i18n) and the host-level/app
// errors (connection, auth, network, keyring, AI) that span drivers.

export type DbErrorCode =
  | 'COLUMN_NOT_FOUND'
  | 'TABLE_NOT_FOUND'
  | 'SCHEMA_NOT_FOUND'
  | 'SYNTAX_ERROR'
  | 'PERMISSION_DENIED'
  | 'CONNECTION_LOST'
  | 'CONNECTION_REFUSED'
  | 'AUTH_FAILED'
  | 'TIMEOUT'
  | 'QUERY_CANCELLED'
  | 'UNIQUE_VIOLATION'
  | 'FOREIGN_KEY_VIOLATION'
  | 'NOT_NULL_VIOLATION'
  | 'CHECK_VIOLATION'
  | 'TYPE_MISMATCH'
  | 'DIVISION_BY_ZERO'
  | 'TRANSACTION_ABORTED'
  | 'DEADLOCK'
  | 'DUPLICATE_TABLE'
  // ─── App / IPC layer (not from a SQL driver; reach users via the same surface) ───
  | 'KEYRING_DECRYPT_FAILED'
  | 'AI_KEY_MISSING'
  | 'AI_RATE_LIMITED'
  | 'AI_QUOTA_EXCEEDED'
  | 'AI_PROVIDER_ERROR'
  | 'NETWORK_ERROR'
  | 'FILE_NOT_FOUND'
  | 'UNKNOWN'

/**
 * A serializable error-classification rule a driver contributes for its dialect.
 * The renderer compiles `pattern` (case-insensitive) and matches it against the
 * cleaned driver message; the first non-empty capture group fills the message's
 * interpolation variable (the renderer owns which var per code). Kept free of
 * functions so it can cross IPC and be declared by process-isolated drivers.
 */
export interface DbErrorRule {
  code: DbErrorCode
  /** Regex source, matched case-insensitively against the cleaned message. */
  pattern: string
}
