import { randomBytes, timingSafeEqual } from 'crypto'
import type { IncomingMessage, ServerResponse } from 'http'

export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Constant-time validation of an `Authorization: Bearer <token>` header.
 *
 * Using `===`/`!==` here would short-circuit on the first differing byte
 * and leak the matched-prefix length via timing — enough for a local
 * process to recover the token byte-by-byte. `timingSafeEqual` compares
 * in constant time, but throws on length mismatch, so we guard the length
 * explicitly (and still run a comparison so the early-exit itself doesn't
 * become a timing oracle for the length).
 */
export function isValidBearer(authHeader: string | undefined, token: string): boolean {
  const prefix = 'Bearer '
  if (!authHeader || !authHeader.startsWith(prefix)) return false
  const provided = Buffer.from(authHeader.slice(prefix.length), 'utf8')
  const expected = Buffer.from(token, 'utf8')
  if (provided.length !== expected.length) return false
  return timingSafeEqual(provided, expected)
}

export function validateAuth(
  req: IncomingMessage,
  token: string,
  res: ServerResponse
): boolean {
  if (!isValidBearer(req.headers.authorization, token)) {
    res.writeHead(401, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Unauthorized' }))
    return false
  }
  return true
}
