import { randomBytes } from 'crypto'
import type { IncomingMessage, ServerResponse } from 'http'

export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export function validateAuth(
  req: IncomingMessage,
  token: string,
  res: ServerResponse
): boolean {
  const auth = req.headers.authorization
  if (!auth || auth !== `Bearer ${token}`) {
    res.writeHead(401, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Unauthorized' }))
    return false
  }
  return true
}
