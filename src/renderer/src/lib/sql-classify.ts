// Pure SQL classification helpers — no React/i18n, so they're trivially
// unit-testable. The renderer maps `destructiveKind` to a localized confirm
// message; schema-mutation detection drives the schema-cache invalidation.

const DDL_PATTERN = /(^|;)\s*(CREATE|ALTER|DROP|TRUNCATE|RENAME|COMMENT|GRANT|REVOKE)\b/i
const DESTRUCTIVE_PATTERN = /(^|;)\s*(DELETE|DROP|TRUNCATE)\b/i
const UPDATE_NO_WHERE_PATTERN = /(^|;)\s*UPDATE\b(?![\s\S]*\bWHERE\b)/i

/** Strip line (`-- …`) and block (`/* … *​/`) comments before pattern matching. */
export function stripSqlNoise(sql: string): string {
  return sql
    .replace(/--[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
}

/** True when the SQL contains DDL that changes schema shape (drives cache busting). */
export function isSchemaMutatingSql(sql: string): boolean {
  return DDL_PATTERN.test(stripSqlNoise(sql))
}

/** Why a statement is considered destructive, or null when it isn't. The caller
 *  turns the kind into a localized confirm prompt. */
export type DestructiveKind = 'delete-drop-truncate' | 'update-no-where'

export function destructiveKind(sql: string): DestructiveKind | null {
  const clean = stripSqlNoise(sql)
  if (DESTRUCTIVE_PATTERN.test(clean)) return 'delete-drop-truncate'
  if (UPDATE_NO_WHERE_PATTERN.test(clean)) return 'update-no-where'
  return null
}
