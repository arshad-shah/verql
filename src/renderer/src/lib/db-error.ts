/**
 * Error normalisation for the renderer.
 *
 * Two layers classify a raw error string into a structured `DbError`:
 *   1. **Driver-owned** — query-semantic errors (bad column/table/schema,
 *      syntax, constraint violations, type mismatch, duplicate table,
 *      division-by-zero, deadlock, aborted txn). The *regexes* live in each
 *      driver plugin (`errorRules` capability); this module owns only the
 *      user-facing messages (i18n) for those codes. The active connection's
 *      `dbType` selects which driver's rules apply.
 *   2. **Host-owned** — connection-lifecycle and app-layer errors (auth,
 *      connection refused/lost, timeout, cancelled, keyring, AI, network, file)
 *      that span drivers and don't carry query semantics.
 *
 * Driver rules are tried first, then host rules; anything unmatched falls
 * through to UNKNOWN (still rendered cleanly with the raw driver text).
 */

import { t } from '@shared/i18n'
import type { DbErrorCode } from '@shared/db-errors'
import { useDriverCapabilitiesStore } from '@/stores/driver-capabilities'
import { resolveDataNouns, nounVars } from '@/lib/data-nouns'

export type { DbErrorCode } from '@shared/db-errors'

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
  s = s.replace(/^Error invoking remote method '[^']+':\s*/i, '')
  s = s.replace(/^(?:error|ERROR):\s*/i, '')
  return s
}

interface RenderedError {
  title: string
  message: string
  hint?: string
}

// Renders a friendly message for a driver-matched code. `cap` is the first
// non-empty capture group from the driver's regex (the offending name/token);
// `nv` is the driver's noun vars (object/field/record) so query-semantic copy
// reads in the driver's own terms. These mirror the original message logic 1:1;
// only the regexes moved to drivers and the nouns became driver-supplied.
type NounVars = Record<string, string>
const DRIVER_RENDERERS: Partial<Record<DbErrorCode, (cap?: string, nv?: NounVars) => RenderedError>> = {
  COLUMN_NOT_FOUND: (cap, nv) => ({
    title: t('errors.COLUMN_NOT_FOUND.title', nv),
    message: t('errors.COLUMN_NOT_FOUND.message', { name: cap || 'referenced', ...nv }),
    hint: t('errors.COLUMN_NOT_FOUND.hint', nv),
  }),
  TABLE_NOT_FOUND: (cap, nv) => ({
    title: t('errors.TABLE_NOT_FOUND.title', nv),
    message: t('errors.TABLE_NOT_FOUND.message', { name: cap || 'referenced', ...nv }),
    hint: t('errors.TABLE_NOT_FOUND.hint', nv),
  }),
  SCHEMA_NOT_FOUND: (cap) => ({
    title: t('errors.SCHEMA_NOT_FOUND.title'),
    message: t('errors.SCHEMA_NOT_FOUND.message', { name: cap ?? '?' }),
    hint: t('errors.SCHEMA_NOT_FOUND.hint'),
  }),
  SYNTAX_ERROR: (cap) => ({
    title: t('errors.SYNTAX_ERROR.title'),
    message: cap ? t('errors.SYNTAX_ERROR.message', { token: cap }) : t('errors.SYNTAX_ERROR.messageGeneric'),
    hint: t('errors.SYNTAX_ERROR.hint'),
  }),
  UNIQUE_VIOLATION: (cap, nv) => ({
    title: t('errors.UNIQUE_VIOLATION.title', nv),
    message: cap ? t('errors.UNIQUE_VIOLATION.message', { constraint: cap, ...nv }) : t('errors.UNIQUE_VIOLATION.messageGeneric', nv),
    hint: t('errors.UNIQUE_VIOLATION.hint', nv),
  }),
  NOT_NULL_VIOLATION: (cap, nv) => ({
    title: t('errors.NOT_NULL_VIOLATION.title', nv),
    message: cap ? t('errors.NOT_NULL_VIOLATION.message', { column: cap, ...nv }) : t('errors.NOT_NULL_VIOLATION.messageGeneric', nv),
  }),
  FOREIGN_KEY_VIOLATION: (_cap, nv) => ({
    title: t('errors.FOREIGN_KEY_VIOLATION.title', nv),
    message: t('errors.FOREIGN_KEY_VIOLATION.message', nv),
    hint: t('errors.FOREIGN_KEY_VIOLATION.hint', nv),
  }),
  CHECK_VIOLATION: (_cap, nv) => ({
    title: t('errors.CHECK_VIOLATION.title', nv),
    message: t('errors.CHECK_VIOLATION.message', nv),
  }),
  TYPE_MISMATCH: (_cap, nv) => ({
    title: t('errors.TYPE_MISMATCH.title', nv),
    message: t('errors.TYPE_MISMATCH.message', nv),
    hint: t('errors.TYPE_MISMATCH.hint', nv),
  }),
  DUPLICATE_TABLE: (cap, nv) => ({
    title: t('errors.DUPLICATE_TABLE.title', nv),
    message: cap ? t('errors.DUPLICATE_TABLE.message', { name: cap, ...nv }) : t('errors.DUPLICATE_TABLE.messageGeneric', nv),
    hint: t('errors.DUPLICATE_TABLE.hint', nv),
  }),
  DIVISION_BY_ZERO: () => ({
    title: t('errors.DIVISION_BY_ZERO.title'),
    message: t('errors.DIVISION_BY_ZERO.message'),
    hint: t('errors.DIVISION_BY_ZERO.hint'),
  }),
  DEADLOCK: () => ({
    title: t('errors.DEADLOCK.title'),
    message: t('errors.DEADLOCK.message'),
    hint: t('errors.DEADLOCK.hint'),
  }),
  TRANSACTION_ABORTED: () => ({
    title: t('errors.TRANSACTION_ABORTED.title'),
    message: t('errors.TRANSACTION_ABORTED.message'),
    hint: t('errors.TRANSACTION_ABORTED.hint'),
  }),
}

interface HostPattern {
  code: DbErrorCode
  match: RegExp
  render: () => RenderedError
}

// Host-owned: connection-lifecycle + app/IPC-layer errors. These span drivers
// (or aren't DB errors at all), so the host classifies them. No query semantics.
const HOST_PATTERNS: HostPattern[] = [
  {
    code: 'PERMISSION_DENIED',
    match: /permission denied|access denied|insufficient privilege/i,
    render: () => ({ title: t('errors.PERMISSION_DENIED.title'), message: t('errors.PERMISSION_DENIED.message'), hint: t('errors.PERMISSION_DENIED.hint') }),
  },
  {
    code: 'AUTH_FAILED',
    match: /password authentication failed|Access denied for user|authentication failed|invalid password/i,
    render: () => ({ title: t('errors.AUTH_FAILED.title'), message: t('errors.AUTH_FAILED.message'), hint: t('errors.AUTH_FAILED.hint') }),
  },
  {
    code: 'CONNECTION_REFUSED',
    match: /ECONNREFUSED|connection refused|getaddrinfo (?:ENOTFOUND|EAI_AGAIN)/i,
    render: () => ({ title: t('errors.CONNECTION_REFUSED.title'), message: t('errors.CONNECTION_REFUSED.message'), hint: t('errors.CONNECTION_REFUSED.hint') }),
  },
  {
    code: 'CONNECTION_LOST',
    match: /(?:server closed the connection|Connection lost|connection terminated|ECONNRESET|read ECONNRESET|server has gone away|connection ended)/i,
    render: () => ({ title: t('errors.CONNECTION_LOST.title'), message: t('errors.CONNECTION_LOST.message'), hint: t('errors.CONNECTION_LOST.hint') }),
  },
  {
    code: 'TIMEOUT',
    match: /timed out after|query timeout|statement timeout|canceling statement due to statement timeout/i,
    render: () => ({ title: t('errors.TIMEOUT.title'), message: t('errors.TIMEOUT.message'), hint: t('errors.TIMEOUT.hint') }),
  },
  {
    code: 'QUERY_CANCELLED',
    match: /(?:cancell?ing statement due to user request|query was cancelled|Interrupted)/i,
    render: () => ({ title: t('errors.QUERY_CANCELLED.title'), message: t('errors.QUERY_CANCELLED.message') }),
  },
  {
    code: 'KEYRING_DECRYPT_FAILED',
    match: /Error while decrypting the ciphertext|safeStorage\.decryptString|EncryptionAvailable/i,
    render: () => ({ title: t('errors.KEYRING_DECRYPT_FAILED.title'), message: t('errors.KEYRING_DECRYPT_FAILED.message'), hint: t('errors.KEYRING_DECRYPT_FAILED.hint') }),
  },
  {
    code: 'AI_KEY_MISSING',
    match: /(?:OPENAI_API_KEY|ANTHROPIC_API_KEY).*?(?:missing|not set|required)|No (?:OpenAI|Anthropic) API key configured|API key (?:is )?(?:missing|required|not set)/i,
    render: () => ({ title: t('errors.AI_KEY_MISSING.title'), message: t('errors.AI_KEY_MISSING.message'), hint: t('errors.AI_KEY_MISSING.hint') }),
  },
  {
    code: 'AI_RATE_LIMITED',
    match: /rate.?limit|429|too many requests/i,
    render: () => ({ title: t('errors.AI_RATE_LIMITED.title'), message: t('errors.AI_RATE_LIMITED.message'), hint: t('errors.AI_RATE_LIMITED.hint') }),
  },
  {
    code: 'AI_QUOTA_EXCEEDED',
    match: /quota|insufficient_quota|billing|exceeded your current quota/i,
    render: () => ({ title: t('errors.AI_QUOTA_EXCEEDED.title'), message: t('errors.AI_QUOTA_EXCEEDED.message'), hint: t('errors.AI_QUOTA_EXCEEDED.hint') }),
  },
  {
    code: 'AI_PROVIDER_ERROR',
    match: /(?:OpenAI|Anthropic|Gemini|provider).*?(?:error|failed|unavailable)|5\d{2}\s*(?:Internal Server Error|Bad Gateway|Service Unavailable)/i,
    render: () => ({ title: t('errors.AI_PROVIDER_ERROR.title'), message: t('errors.AI_PROVIDER_ERROR.message'), hint: t('errors.AI_PROVIDER_ERROR.hint') }),
  },
  {
    code: 'NETWORK_ERROR',
    match: /fetch failed|network (?:error|request failed)|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|getaddrinfo/i,
    render: () => ({ title: t('errors.NETWORK_ERROR.title'), message: t('errors.NETWORK_ERROR.message'), hint: t('errors.NETWORK_ERROR.hint') }),
  },
  {
    code: 'FILE_NOT_FOUND',
    match: /ENOENT|no such file or directory/i,
    render: () => ({ title: t('errors.FILE_NOT_FOUND.title'), message: t('errors.FILE_NOT_FOUND.message'), hint: t('errors.FILE_NOT_FOUND.hint') }),
  },
]

/**
 * Classify a raw error string into a structured DbError. Pass the active
 * connection's `dbType` so the driver's query-semantic rules apply; without it,
 * only host (connection/app) rules run. Always returns a result — unmatched
 * errors get UNKNOWN with the cleaned message.
 */
export function parseDbError(input: string | Error | unknown, dbType?: string): DbError {
  const inputStr =
    input instanceof Error ? input.message :
    typeof input === 'string' ? input :
    String(input ?? '')
  const raw = unwrap(inputStr) || 'Unknown error'

  // 1. Driver-owned query-semantic classification (regexes from the driver's
  //    errorRules capability; messages from DRIVER_RENDERERS here).
  if (dbType) {
    const caps = useDriverCapabilitiesStore.getState().byType[dbType]
    const rules = caps?.errorRules ?? []
    // The driver's own nouns (table/column/row, collection/field/document, …),
    // so query-semantic messages read in its terms; generic words otherwise.
    const nv = nounVars(resolveDataNouns(caps?.nouns, t))
    for (const rule of rules) {
      const render = DRIVER_RENDERERS[rule.code]
      if (!render) continue
      let re: RegExp
      try { re = new RegExp(rule.pattern, 'i') } catch { continue }
      const m = raw.match(re)
      if (m) {
        const cap = m.slice(1).find((x) => x != null && x !== '')
        const r = render(cap, nv)
        return { code: rule.code, title: r.title, message: r.message, hint: r.hint, raw }
      }
    }
  }

  // 2. Host-owned connection/app classification.
  for (const p of HOST_PATTERNS) {
    if (p.match.test(raw)) {
      const r = p.render()
      return { code: p.code, title: r.title, message: r.message, hint: r.hint, raw }
    }
  }

  return { code: 'UNKNOWN', title: t('errors.UNKNOWN.title'), message: raw, raw }
}

/**
 * Convenience alias — the same parser is the canonical app-wide error
 * classifier, not just a DB helper. (App/network errors need no `dbType`.)
 */
export const parseAppError = parseDbError
