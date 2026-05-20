export type SqlDialect = 'postgresql' | 'mysql' | 'sqlite'

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

const QUOTE_CHAR: Record<SqlDialect, string> = {
  postgresql: '"',
  mysql: '`',
  sqlite: '"'
}

export function quoteIdentifier(name: string | string[], dialect: SqlDialect): string {
  if (!(dialect in QUOTE_CHAR)) {
    throw new IdentifierError(`Unknown SQL dialect: ${dialect}`)
  }
  const parts = Array.isArray(name) ? name : [name]
  const q = QUOTE_CHAR[dialect]
  return parts.map(part => {
    validateIdentifier(part)
    return q + part.split(q).join(q + q) + q
  }).join('.')
}
