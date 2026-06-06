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

import { t } from '@shared/i18n'

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
    title: t('errors.COLUMN_NOT_FOUND.title'),
    // Postgres: `column "name" does not exist`
    // MySQL:    `Unknown column 'name' in 'field list'`
    // SQLite:   `no such column: name`
    match: /(?:column ["'`]?([^"'`]+)["'`]? does not exist|Unknown column ['"`]?([^'"`]+)['"`]?|no such column:\s*([^\s]+))/i,
    message: (g) => {
      const name = g?.[1] || g?.[2] || g?.[3] || 'referenced'
      return t('errors.COLUMN_NOT_FOUND.message', { name })
    },
    hint: t('errors.COLUMN_NOT_FOUND.hint')
  },
  {
    code: 'TABLE_NOT_FOUND',
    title: t('errors.TABLE_NOT_FOUND.title'),
    // Postgres: `relation "name" does not exist`
    // MySQL:    `Table 'db.name' doesn't exist`
    // SQLite:   `no such table: name`
    match: /(?:relation ["'`]?([^"'`]+)["'`]? does not exist|Table ['"`]?[^.'"`]+\.([^'"`]+)['"`]? doesn['']?t exist|no such table:\s*([^\s]+))/i,
    message: (g) => {
      const name = g?.[1] || g?.[2] || g?.[3] || 'referenced'
      return t('errors.TABLE_NOT_FOUND.message', { name })
    },
    hint: t('errors.TABLE_NOT_FOUND.hint')
  },
  {
    code: 'SCHEMA_NOT_FOUND',
    title: t('errors.SCHEMA_NOT_FOUND.title'),
    match: /schema ["'`]?([^"'`]+)["'`]? does not exist/i,
    message: (g) => t('errors.SCHEMA_NOT_FOUND.message', { name: g?.[1] ?? '?' }),
    hint: t('errors.SCHEMA_NOT_FOUND.hint')
  },

  // ─── Syntax ──────────────────────────────────────────────────────────────
  {
    code: 'SYNTAX_ERROR',
    title: t('errors.SYNTAX_ERROR.title'),
    // Postgres: `syntax error at or near "X"`
    // MySQL:    `You have an error in your SQL syntax; ...near 'X' at line N`
    // SQLite:   `near "X": syntax error`
    match: /(?:syntax error at or near ["'`]?([^"'`]+)["'`]?|near ["'`]?([^"'`]+)["'`]?\s*[:,]\s*syntax error|You have an error in your SQL syntax.*?near ['"`]?([^'"`]+)['"`]?)/i,
    message: (g) => {
      const tok = g?.[1] || g?.[2] || g?.[3]
      return tok ? t('errors.SYNTAX_ERROR.message', { token: tok }) : t('errors.SYNTAX_ERROR.messageGeneric')
    },
    hint: t('errors.SYNTAX_ERROR.hint')
  },

  // ─── Permissions / connectivity ──────────────────────────────────────────
  {
    code: 'PERMISSION_DENIED',
    title: t('errors.PERMISSION_DENIED.title'),
    match: /permission denied|access denied|insufficient privilege/i,
    message: () => t('errors.PERMISSION_DENIED.message'),
    hint: t('errors.PERMISSION_DENIED.hint')
  },
  {
    code: 'AUTH_FAILED',
    title: t('errors.AUTH_FAILED.title'),
    match: /password authentication failed|Access denied for user|authentication failed|invalid password/i,
    message: () => t('errors.AUTH_FAILED.message'),
    hint: t('errors.AUTH_FAILED.hint')
  },
  {
    code: 'CONNECTION_REFUSED',
    title: t('errors.CONNECTION_REFUSED.title'),
    match: /ECONNREFUSED|connection refused|getaddrinfo (?:ENOTFOUND|EAI_AGAIN)/i,
    message: () => t('errors.CONNECTION_REFUSED.message'),
    hint: t('errors.CONNECTION_REFUSED.hint')
  },
  {
    code: 'CONNECTION_LOST',
    title: t('errors.CONNECTION_LOST.title'),
    match: /(?:server closed the connection|Connection lost|connection terminated|ECONNRESET|read ECONNRESET|server has gone away|connection ended)/i,
    message: () => t('errors.CONNECTION_LOST.message'),
    hint: t('errors.CONNECTION_LOST.hint')
  },

  // ─── Timing ──────────────────────────────────────────────────────────────
  {
    code: 'TIMEOUT',
    title: t('errors.TIMEOUT.title'),
    match: /timed out after|query timeout|statement timeout|canceling statement due to statement timeout/i,
    message: () => t('errors.TIMEOUT.message'),
    hint: t('errors.TIMEOUT.hint')
  },
  {
    code: 'QUERY_CANCELLED',
    title: t('errors.QUERY_CANCELLED.title'),
    match: /(?:cancell?ing statement due to user request|query was cancelled|Interrupted)/i,
    message: () => t('errors.QUERY_CANCELLED.message'),
  },

  // ─── Constraints ─────────────────────────────────────────────────────────
  {
    code: 'UNIQUE_VIOLATION',
    title: t('errors.UNIQUE_VIOLATION.title'),
    // Postgres: `duplicate key value violates unique constraint "name"`
    // MySQL:    `Duplicate entry 'X' for key 'name'`
    // SQLite:   `UNIQUE constraint failed: t.c`
    match: /duplicate key value violates unique constraint ["'`]?([^"'`]+)["'`]?|Duplicate entry ['"`]?([^'"`]+)['"`]? for key ['"`]?([^'"`]+)['"`]?|UNIQUE constraint failed:\s*([^\s,]+(?:,\s*[^\s,]+)*)/i,
    message: (g) => {
      const detail = g?.[1] || g?.[3] || g?.[4]
      return detail
        ? t('errors.UNIQUE_VIOLATION.message', { constraint: detail })
        : t('errors.UNIQUE_VIOLATION.messageGeneric')
    },
    hint: t('errors.UNIQUE_VIOLATION.hint')
  },
  {
    code: 'NOT_NULL_VIOLATION',
    title: t('errors.NOT_NULL_VIOLATION.title'),
    match: /null value in column ["'`]?([^"'`]+)["'`]?|Column ['"`]?([^'"`]+)['"`]? cannot be null|NOT NULL constraint failed:\s*([^\s]+)/i,
    message: (g) => {
      const col = g?.[1] || g?.[2] || g?.[3]
      return col
        ? t('errors.NOT_NULL_VIOLATION.message', { column: col })
        : t('errors.NOT_NULL_VIOLATION.messageGeneric')
    }
  },
  {
    code: 'FOREIGN_KEY_VIOLATION',
    title: t('errors.FOREIGN_KEY_VIOLATION.title'),
    match: /violates foreign key constraint|Cannot add or update a child row|FOREIGN KEY constraint failed|REFERENCES constraint failed/i,
    message: () => t('errors.FOREIGN_KEY_VIOLATION.message'),
    hint: t('errors.FOREIGN_KEY_VIOLATION.hint')
  },
  {
    code: 'CHECK_VIOLATION',
    title: t('errors.CHECK_VIOLATION.title'),
    match: /violates check constraint|CHECK constraint failed/i,
    message: () => t('errors.CHECK_VIOLATION.message'),
  },
  {
    code: 'TYPE_MISMATCH',
    title: t('errors.TYPE_MISMATCH.title'),
    match: /invalid input syntax for type|Incorrect (?:integer|decimal|datetime) value|datatype mismatch/i,
    message: () => t('errors.TYPE_MISMATCH.message'),
    hint: t('errors.TYPE_MISMATCH.hint')
  },

  // ─── Runtime ─────────────────────────────────────────────────────────────
  {
    code: 'DIVISION_BY_ZERO',
    title: t('errors.DIVISION_BY_ZERO.title'),
    match: /division by zero/i,
    message: () => t('errors.DIVISION_BY_ZERO.message'),
    hint: t('errors.DIVISION_BY_ZERO.hint')
  },
  {
    code: 'DEADLOCK',
    title: t('errors.DEADLOCK.title'),
    match: /deadlock detected|Deadlock found when trying to get lock/i,
    message: () => t('errors.DEADLOCK.message'),
    hint: t('errors.DEADLOCK.hint')
  },
  {
    code: 'TRANSACTION_ABORTED',
    title: t('errors.TRANSACTION_ABORTED.title'),
    match: /current transaction is aborted/i,
    message: () => t('errors.TRANSACTION_ABORTED.message'),
    hint: t('errors.TRANSACTION_ABORTED.hint')
  },
  {
    code: 'DUPLICATE_TABLE',
    title: t('errors.DUPLICATE_TABLE.title'),
    match: /relation ["'`]?([^"'`]+)["'`]? already exists|Table ['"`]?([^'"`]+)['"`]? already exists/i,
    message: (g) => {
      const name = g?.[1] || g?.[2]
      return name
        ? t('errors.DUPLICATE_TABLE.message', { name })
        : t('errors.DUPLICATE_TABLE.messageGeneric')
    },
    hint: t('errors.DUPLICATE_TABLE.hint')
  },

  // ─── App / IPC layer ─────────────────────────────────────────────────────
  // These don't come from a SQL driver but reach users through the same toast
  // and notification surfaces, so we classify them in one place rather than
  // making every caller write friendly strings inline.
  {
    code: 'KEYRING_DECRYPT_FAILED',
    title: t('errors.KEYRING_DECRYPT_FAILED.title'),
    // Electron safeStorage error after the OS keychain key rotates (laptop
    // password change, restore from backup, dev rebuilds with a new identity).
    match: /Error while decrypting the ciphertext|safeStorage\.decryptString|EncryptionAvailable/i,
    message: () => t('errors.KEYRING_DECRYPT_FAILED.message'),
    hint: t('errors.KEYRING_DECRYPT_FAILED.hint')
  },
  {
    code: 'AI_KEY_MISSING',
    title: t('errors.AI_KEY_MISSING.title'),
    match: /(?:OPENAI_API_KEY|ANTHROPIC_API_KEY).*?(?:missing|not set|required)|No (?:OpenAI|Anthropic) API key configured|API key (?:is )?(?:missing|required|not set)/i,
    message: () => t('errors.AI_KEY_MISSING.message'),
    hint: t('errors.AI_KEY_MISSING.hint')
  },
  {
    code: 'AI_RATE_LIMITED',
    title: t('errors.AI_RATE_LIMITED.title'),
    match: /rate.?limit|429|too many requests/i,
    message: () => t('errors.AI_RATE_LIMITED.message'),
    hint: t('errors.AI_RATE_LIMITED.hint')
  },
  {
    code: 'AI_QUOTA_EXCEEDED',
    title: t('errors.AI_QUOTA_EXCEEDED.title'),
    match: /quota|insufficient_quota|billing|exceeded your current quota/i,
    message: () => t('errors.AI_QUOTA_EXCEEDED.message'),
    hint: t('errors.AI_QUOTA_EXCEEDED.hint')
  },
  {
    code: 'AI_PROVIDER_ERROR',
    title: t('errors.AI_PROVIDER_ERROR.title'),
    // Catches generic 5xx and provider names appearing in error text. Specific
    // patterns above (rate-limit, quota, key) take precedence by ordering.
    match: /(?:OpenAI|Anthropic|Gemini|provider).*?(?:error|failed|unavailable)|5\d{2}\s*(?:Internal Server Error|Bad Gateway|Service Unavailable)/i,
    message: () => t('errors.AI_PROVIDER_ERROR.message'),
    hint: t('errors.AI_PROVIDER_ERROR.hint')
  },
  {
    code: 'NETWORK_ERROR',
    title: t('errors.NETWORK_ERROR.title'),
    match: /fetch failed|network (?:error|request failed)|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|getaddrinfo/i,
    message: () => t('errors.NETWORK_ERROR.message'),
    hint: t('errors.NETWORK_ERROR.hint')
  },
  {
    code: 'FILE_NOT_FOUND',
    title: t('errors.FILE_NOT_FOUND.title'),
    match: /ENOENT|no such file or directory/i,
    message: () => t('errors.FILE_NOT_FOUND.message'),
    hint: t('errors.FILE_NOT_FOUND.hint')
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
    title: t('errors.UNKNOWN.title'),
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

