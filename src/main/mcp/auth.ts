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

/**
 * Guard against DNS-rebinding: even though the server binds 127.0.0.1, a
 * malicious web page can resolve an attacker-controlled domain to 127.0.0.1
 * and `fetch()` the loopback port. Requiring the Host header to be loopback
 * (the address the user's own client actually uses) rejects requests that
 * arrived via a rebound hostname. Exported for tests.
 */
export function isAllowedMcpHost(hostHeader: string | undefined, port: number): boolean {
  if (!hostHeader) return false
  // Strip the port; handle bracketed IPv6 ([::1]:port) and host:port.
  let host = hostHeader.trim().toLowerCase()
  if (host.startsWith('[')) {
    const end = host.indexOf(']')
    if (end === -1) return false
    const portPart = host.slice(end + 1)
    if (portPart && portPart !== `:${port}`) return false
    host = host.slice(1, end)
  } else {
    const colon = host.lastIndexOf(':')
    if (colon !== -1) {
      const portPart = host.slice(colon + 1)
      if (portPart && portPart !== String(port)) return false
      host = host.slice(0, colon)
    }
  }
  return host === '127.0.0.1' || host === 'localhost' || host === '::1'
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
