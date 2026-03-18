import { theme, box } from '../ui/theme.js'

export class DbConnectionError extends Error {
  constructor(message: string, public readonly host?: string, public readonly port?: number) {
    super(message)
    this.name = 'DbConnectionError'
  }
}

export class DbQueryError extends Error {
  constructor(message: string, public readonly query: string, public readonly code?: string) {
    super(message)
    this.name = 'DbQueryError'
  }
}

export class DbTimeoutError extends Error {
  constructor(message: string, public readonly timeoutMs: number) {
    super(message)
    this.name = 'DbTimeoutError'
  }
}

export class ValidationError extends Error {
  constructor(message: string, public readonly field: string, public readonly value: any) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class UserAbortError extends Error {
  constructor(message = 'Operation cancelled by user') {
    super(message)
    this.name = 'UserAbortError'
  }
}

const W = () => process.stdout.columns ?? 120

export function printError(err: unknown, context?: string): void {
  const e = err instanceof Error ? err : new Error(String(err))
  const lines: string[] = []

  if (context) lines.push(theme.muted(context))
  lines.push(theme.error(e.message))

  if (e instanceof DbConnectionError) {
    lines.push('')
    lines.push(theme.muted('Check your host, port, and credentials.'))
  } else if (e instanceof DbTimeoutError) {
    lines.push('')
    lines.push(theme.muted(`Query timed out after ${e.timeoutMs}ms.`))
    lines.push(theme.muted('Increase timeout in connection settings.'))
  } else if (e instanceof DbQueryError) {
    lines.push('')
    const truncatedSQL = e.query.length > 200 ? e.query.slice(0, 200) + '...' : e.query
    lines.push(theme.muted(`SQL: ${truncatedSQL}`))
    if (e.code) lines.push(theme.muted(`Code: ${e.code}`))
  }

  if (process.env.DEBUG && e.stack) {
    lines.push('')
    lines.push(theme.dim(e.stack))
  }

  console.log(box('Error', lines, W(), theme.error))
}
