/**
 * Database error normalisation.
 *
 * Errors reaching the renderer come from three layers stacked together:
 *   1. The driver (pg/mysql2/better-sqlite3/etc.) — driver-specific shape
 *   2. The DB adapter in `src/main/db` — re-throws as plain Error
 *   3. Electron IPC — wraps the message as `Error invoking remote method 'db:query': <original>`
 *
 * The renderer used to show that raw string verbatim, which is both
 * noisy ("Error invoking remote method...") and unhelpful (the user
 * has no idea what `column "X" does not exist` means in product
 * terms). This module strips the IPC envelope, runs the original
 * driver text through a pattern bank, and returns a structured
 * `DbError` with:
 *   - a stable `code` for product-level branching (analytics, hints)
 *   - a friendly `title` for the alert header
 *   - a `message` rewritten to address the user, not the DBA
 *   - an optional `hint` with a concrete next step
 *   - the `raw` text so power users can still see what the driver said
 *
 * Pattern bank order matters: more specific patterns must match first.
 * Anything that doesn't match falls through to UNKNOWN, which still
 * displays cleanly (title + raw message), so unrecognised drivers
 * don't regress UX.
 */

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
  // ─── App / IPC layer (not strictly DB but reach users via the same surfaces) ───
  | 'KEYRING_DECRYPT_FAILED'
  | 'AI_KEY_MISSING'
  | 'AI_RATE_LIMITED'
  | 'AI_QUOTA_EXCEEDED'
  | 'AI_PROVIDER_ERROR'
  | 'NETWORK_ERROR'
  | 'FILE_NOT_FOUND'
  | 'UNKNOWN'

export interface DbError {
  code: DbErrorCode
  title: string
  message: string
  hint?: string
  /** The cleaned driver message (IPC envelope stripped). */
  raw: string
}

/**
 * Strips Electron's IPC envelope and any leading `error:` / `ERROR:` prefix
 * the driver added. Returns the inner driver message ready for matching.
 */
function unwrap(input: string): string {
  let s = input.trim()
  // Electron's standard envelope: `Error invoking remote method 'db:query': <real>`
  s = s.replace(/^Error invoking remote method '[^']+':\s*/i, '')
  // Some drivers prefix their own `Error: ` — strip that too so patterns can be plain.
  s = s.replace(/^(?:error|ERROR):\s*/i, '')
  return s
}

interface Pattern {
  code: DbErrorCode
  title: string
  /** Either a string (substring test) or a RegExp. RegExp captures feed into message/hint. */
  match: RegExp | string
  /** Builds the user-facing message. Receives regex match groups if `match` is a RegExp. */
  message: (groups: RegExpMatchArray | null, raw: string) => string
  hint?: string
}

const PATTERNS: Pattern[] = [
  // ─── Column / table not found ────────────────────────────────────────────
  {
    code: 'COLUMN_NOT_FOUND',
    title: 'Column not found',
    // Postgres: `column "name" does not exist`
    // MySQL:    `Unknown column 'name' in 'field list'`
    // SQLite:   `no such column: name`
    match: /(?:column ["'`]?([^"'`]+)["'`]? does not exist|Unknown column ['"`]?([^'"`]+)['"`]?|no such column:\s*([^\s]+))/i,
    message: (g) => {
      const name = g?.[1] || g?.[2] || g?.[3] || 'referenced'
      return `The column \`${name}\` doesn't exist in any of the tables in this query.`
    },
    hint: 'Check the spelling, confirm the column belongs to a table you\'ve referenced, and that you\'re using the right alias if columns share names.'
  },
  {
    code: 'TABLE_NOT_FOUND',
    title: 'Table not found',
    // Postgres: `relation "name" does not exist`
    // MySQL:    `Table 'db.name' doesn't exist`
    // SQLite:   `no such table: name`
    match: /(?:relation ["'`]?([^"'`]+)["'`]? does not exist|Table ['"`]?[^.'"`]+\.([^'"`]+)['"`]? doesn['']?t exist|no such table:\s*([^\s]+))/i,
    message: (g) => {
      const name = g?.[1] || g?.[2] || g?.[3] || 'referenced'
      return `The table \`${name}\` doesn't exist in the active schema.`
    },
    hint: 'Verify the table name and the schema/database selector at the top of the tab.'
  },
  {
    code: 'SCHEMA_NOT_FOUND',
    title: 'Schema not found',
    match: /schema ["'`]?([^"'`]+)["'`]? does not exist/i,
    message: (g) => `The schema \`${g?.[1] ?? '?'}\` doesn't exist on this connection.`,
    hint: 'Pick a schema from the selector, or check that you connected to the right database.'
  },

  // ─── Syntax ──────────────────────────────────────────────────────────────
  {
    code: 'SYNTAX_ERROR',
    title: 'SQL syntax error',
    // Postgres: `syntax error at or near "X"`
    // MySQL:    `You have an error in your SQL syntax; ...near 'X' at line N`
    // SQLite:   `near "X": syntax error`
    match: /(?:syntax error at or near ["'`]?([^"'`]+)["'`]?|near ["'`]?([^"'`]+)["'`]?\s*[:,]\s*syntax error|You have an error in your SQL syntax.*?near ['"`]?([^'"`]+)['"`]?)/i,
    message: (g) => {
      const tok = g?.[1] || g?.[2] || g?.[3]
      return tok ? `The parser choked near \`${tok}\`.` : 'The SQL parser couldn\'t make sense of this query.'
    },
    hint: 'Look just before the highlighted token — most SQL syntax errors come from the line above, not the line reported.'
  },

  // ─── Permissions / connectivity ──────────────────────────────────────────
  {
    code: 'PERMISSION_DENIED',
    title: 'Permission denied',
    match: /permission denied|access denied|insufficient privilege/i,
    message: () => 'Your database user isn\'t allowed to run this query.',
    hint: 'Use a role with the required privileges, or grant them explicitly (GRANT SELECT, ...).'
  },
  {
    code: 'AUTH_FAILED',
    title: 'Authentication failed',
    match: /password authentication failed|Access denied for user|authentication failed|invalid password/i,
    message: () => 'The database refused the credentials for this connection.',
    hint: 'Re-enter the password in the connection editor, or check that the user still exists.'
  },
  {
    code: 'CONNECTION_REFUSED',
    title: 'Can\'t reach the database',
    match: /ECONNREFUSED|connection refused|getaddrinfo (?:ENOTFOUND|EAI_AGAIN)/i,
    message: () => 'No database is listening at the configured host and port.',
    hint: 'Confirm the host/port, the database is running, and a firewall isn\'t blocking the connection.'
  },
  {
    code: 'CONNECTION_LOST',
    title: 'Connection lost',
    match: /(?:server closed the connection|Connection lost|connection terminated|ECONNRESET|read ECONNRESET|server has gone away|connection ended)/i,
    message: () => 'The database closed the connection unexpectedly.',
    hint: 'Reconnect from the connection picker. If this keeps happening, check the server\'s idle-timeout / max-connections settings.'
  },

  // ─── Timing ──────────────────────────────────────────────────────────────
  {
    code: 'TIMEOUT',
    title: 'Query timed out',
    match: /timed out after|query timeout|statement timeout|canceling statement due to statement timeout/i,
    message: () => 'The query ran longer than the configured timeout.',
    hint: 'Increase the query timeout in Settings → General, or narrow the query (add a WHERE / LIMIT).'
  },
  {
    code: 'QUERY_CANCELLED',
    title: 'Query cancelled',
    match: /(?:cancell?ing statement due to user request|query was cancelled|Interrupted)/i,
    message: () => 'You cancelled this query before it finished.',
  },

  // ─── Constraints ─────────────────────────────────────────────────────────
  {
    code: 'UNIQUE_VIOLATION',
    title: 'Duplicate value',
    // Postgres: `duplicate key value violates unique constraint "name"`
    // MySQL:    `Duplicate entry 'X' for key 'name'`
    // SQLite:   `UNIQUE constraint failed: t.c`
    match: /duplicate key value violates unique constraint ["'`]?([^"'`]+)["'`]?|Duplicate entry ['"`]?([^'"`]+)['"`]? for key ['"`]?([^'"`]+)['"`]?|UNIQUE constraint failed:\s*([^\s,]+(?:,\s*[^\s,]+)*)/i,
    message: (g) => {
      const detail = g?.[1] || g?.[3] || g?.[4]
      return detail
        ? `A row with this value already exists (constraint \`${detail}\`).`
        : 'A row with this value already exists.'
    },
    hint: 'Use a different unique value, or update the existing row instead of inserting.'
  },
  {
    code: 'NOT_NULL_VIOLATION',
    title: 'Required column missing',
    match: /null value in column ["'`]?([^"'`]+)["'`]?|Column ['"`]?([^'"`]+)['"`]? cannot be null|NOT NULL constraint failed:\s*([^\s]+)/i,
    message: (g) => {
      const col = g?.[1] || g?.[2] || g?.[3]
      return col
        ? `Column \`${col}\` is required but no value was provided.`
        : 'A required column is missing a value.'
    }
  },
  {
    code: 'FOREIGN_KEY_VIOLATION',
    title: 'Foreign key constraint failed',
    match: /violates foreign key constraint|Cannot add or update a child row|FOREIGN KEY constraint failed|REFERENCES constraint failed/i,
    message: () => 'A referenced row in another table doesn\'t exist (or you\'re deleting a row that other tables still point to).',
    hint: 'Insert the parent row first, or remove the referencing rows before deleting.'
  },
  {
    code: 'CHECK_VIOLATION',
    title: 'Check constraint failed',
    match: /violates check constraint|CHECK constraint failed/i,
    message: () => 'A column value violates a CHECK constraint defined on the table.',
  },
  {
    code: 'TYPE_MISMATCH',
    title: 'Type mismatch',
    match: /invalid input syntax for type|Incorrect (?:integer|decimal|datetime) value|datatype mismatch/i,
    message: () => 'A value doesn\'t match the column\'s declared type.',
    hint: 'Cast explicitly (e.g. `value::int`) or fix the input — quoted numbers, malformed dates, and NULL where NOT NULL is expected are the usual culprits.'
  },

  // ─── Runtime ─────────────────────────────────────────────────────────────
  {
    code: 'DIVISION_BY_ZERO',
    title: 'Division by zero',
    match: /division by zero/i,
    message: () => 'Something in the query divided by zero.',
    hint: 'Guard the denominator with NULLIF(x, 0) or a CASE.'
  },
  {
    code: 'DEADLOCK',
    title: 'Deadlock',
    match: /deadlock detected|Deadlock found when trying to get lock/i,
    message: () => 'Two transactions blocked each other and the database aborted one of them.',
    hint: 'Retry the query — deadlocks are usually transient.'
  },
  {
    code: 'TRANSACTION_ABORTED',
    title: 'Transaction aborted',
    match: /current transaction is aborted/i,
    message: () => 'An earlier statement in this transaction failed and the whole transaction is now poisoned.',
    hint: 'Run `ROLLBACK` to clear the transaction, then re-run your statements.'
  },
  {
    code: 'DUPLICATE_TABLE',
    title: 'Table already exists',
    match: /relation ["'`]?([^"'`]+)["'`]? already exists|Table ['"`]?([^'"`]+)['"`]? already exists/i,
    message: (g) => {
      const t = g?.[1] || g?.[2]
      return t ? `A table named \`${t}\` already exists.` : 'A table with that name already exists.'
    },
    hint: 'Use `CREATE TABLE IF NOT EXISTS` or drop the existing one first.'
  },

  // ─── App / IPC layer ─────────────────────────────────────────────────────
  // These don't come from a SQL driver but reach users through the same toast
  // and notification surfaces, so we classify them in one place rather than
  // making every caller write friendly strings inline.
  {
    code: 'KEYRING_DECRYPT_FAILED',
    title: 'Couldn\'t unlock saved credentials',
    // Electron safeStorage error after the OS keychain key rotates (laptop
    // password change, restore from backup, dev rebuilds with a new identity).
    match: /Error while decrypting the ciphertext|safeStorage\.decryptString|EncryptionAvailable/i,
    message: () => 'The OS keychain refused to decrypt the credentials Nova has on file.',
    hint: 'Open the connection or AI provider settings and re-enter the password / API key.'
  },
  {
    code: 'AI_KEY_MISSING',
    title: 'AI provider not configured',
    match: /(?:OPENAI_API_KEY|ANTHROPIC_API_KEY).*?(?:missing|not set|required)|No (?:OpenAI|Anthropic) API key configured|API key (?:is )?(?:missing|required|not set)/i,
    message: () => 'No API key is configured for the selected AI provider.',
    hint: 'Open Settings → AI and paste your provider key, then try again.'
  },
  {
    code: 'AI_RATE_LIMITED',
    title: 'AI rate limit hit',
    match: /rate.?limit|429|too many requests/i,
    message: () => 'The AI provider is rate-limiting requests from your key.',
    hint: 'Wait a few seconds and retry, or switch to a different provider/model in Settings → AI.'
  },
  {
    code: 'AI_QUOTA_EXCEEDED',
    title: 'AI quota exhausted',
    match: /quota|insufficient_quota|billing|exceeded your current quota/i,
    message: () => 'Your AI provider account is out of credits.',
    hint: 'Top up at the provider dashboard, or switch providers in Settings → AI.'
  },
  {
    code: 'AI_PROVIDER_ERROR',
    title: 'AI provider error',
    // Catches generic 5xx and provider names appearing in error text. Specific
    // patterns above (rate-limit, quota, key) take precedence by ordering.
    match: /(?:OpenAI|Anthropic|Gemini|provider).*?(?:error|failed|unavailable)|5\d{2}\s*(?:Internal Server Error|Bad Gateway|Service Unavailable)/i,
    message: () => 'The AI provider returned an error.',
    hint: 'Try again in a moment, or switch models if the error persists.'
  },
  {
    code: 'NETWORK_ERROR',
    title: 'Network error',
    match: /fetch failed|network (?:error|request failed)|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|getaddrinfo/i,
    message: () => 'Couldn\'t reach the remote service over the network.',
    hint: 'Check your internet connection. If you\'re behind a VPN or proxy, verify it\'s configured.'
  },
  {
    code: 'FILE_NOT_FOUND',
    title: 'File not found',
    match: /ENOENT|no such file or directory/i,
    message: () => 'The file Nova tried to open isn\'t at that path anymore.',
    hint: 'Confirm the file still exists and you have read access to it.'
  },
]

/**
 * Classifies a raw error string from a DB query into a structured DbError.
 * Always returns a result — unrecognised errors get a UNKNOWN code with the
 * cleaned driver message so the UI still has something useful to render.
 */
export function parseDbError(input: string | Error | unknown): DbError {
  const inputStr =
    input instanceof Error ? input.message :
    typeof input === 'string' ? input :
    String(input ?? '')
  const raw = unwrap(inputStr) || 'Unknown error'

  for (const p of PATTERNS) {
    const match = typeof p.match === 'string'
      ? raw.toLowerCase().includes(p.match.toLowerCase()) ? raw.match(new RegExp(p.match, 'i')) : null
      : raw.match(p.match)
    if (match) {
      return {
        code: p.code,
        title: p.title,
        message: p.message(match, raw),
        hint: p.hint,
        raw
      }
    }
  }

  return {
    code: 'UNKNOWN',
    title: 'Something went wrong',
    message: raw,
    raw
  }
}

/**
 * Convenience alias — the same parser is now the canonical app-wide error
 * classifier, not just a DB-error helper. Use whichever name reads better at
 * the call site.
 */
export const parseAppError = parseDbError

