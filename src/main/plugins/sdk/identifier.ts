// Generic SQL-identifier escaping for plugin authors.
//
// The orchestrator (main app) doesn't know what quote character your dialect
// uses — your driver does. Pass it explicitly. Postgres / SQLite / Snowflake
// use the double quote, MySQL uses the backtick; that knowledge belongs to
// each driver's `quoteChar` capability, not to a central enum.

export class IdentifierError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'IdentifierError'
  }
}

const MAX_IDENTIFIER_LENGTH = 255

// Control characters never appear in a real identifier from a database, and
// allowing them through `quoteIdentifier` would let an attacker terminate the
// surrounding SQL statement with a newline / NULL even after we escape quotes.
// eslint-disable-next-line no-control-regex
const FORBIDDEN_CHAR_RE = /[\x00-\x1F\x7F]/

export function validateIdentifier(name: string): void {
  if (typeof name !== 'string') {
    throw new IdentifierError(`Identifier must be a string, got ${typeof name}`)
  }
  if (name.length === 0) {
    throw new IdentifierError('Identifier must not be empty')
  }
  if (name.length > MAX_IDENTIFIER_LENGTH) {
    throw new IdentifierError(`Identifier exceeds ${MAX_IDENTIFIER_LENGTH} characters`)
  }
  if (FORBIDDEN_CHAR_RE.test(name)) {
    throw new IdentifierError('Identifier contains forbidden control character')
  }
}

/**
 * Quote and (when needed) qualify an identifier for use in a SQL statement.
 *
 * - `name` may be a single segment (`"users"`) or a dotted path
 *   (`["public", "users"]` → `"public"."users"`).
 * - `quoteChar` is the dialect's quote character: `"` for Postgres / SQLite /
 *   Snowflake, `` ` `` for MySQL. The driver passes its own — main never
 *   guesses.
 *
 * Each segment is validated to reject embedded control characters that
 * could otherwise terminate the surrounding statement, and any embedded
 * quote characters are doubled per the SQL standard.
 */
export function quoteIdentifier(name: string | string[], quoteChar: string): string {
  if (typeof quoteChar !== 'string' || quoteChar.length !== 1) {
    throw new IdentifierError(
      `quoteChar must be a single character (got ${JSON.stringify(quoteChar)})`,
    )
  }
  const parts = Array.isArray(name) ? name : [name]
  return parts
    .map(part => {
      validateIdentifier(part)
      return quoteChar + part.split(quoteChar).join(quoteChar + quoteChar) + quoteChar
    })
    .join('.')
}

/**
 * Render a prepared-statement placeholder for a 1-based parameter index in the
 * driver's declared style. `'numbered'` ⇒ `$1`, `$2`, … (Postgres);
 * `'positional'` ⇒ `?` (MySQL / SQLite / Snowflake). Replaces the old per-driver
 * `placeholder(index)` function so the driver descriptor is plain, serializable
 * data that can cross the process-isolation boundary.
 */
export function renderPlaceholder(style: 'numbered' | 'positional', index: number): string {
  return style === 'numbered' ? `$${index}` : '?'
}
