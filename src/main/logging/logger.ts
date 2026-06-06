import type { RecordInput } from '../activity/log'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/** Minimal sink the logger records into — the app activity log implements it. */
export interface LogSink {
  record(input: RecordInput): unknown
}

export interface Logger {
  debug(message: string, detail?: unknown): void
  info(message: string, detail?: unknown): void
  warn(message: string, detail?: unknown): void
  error(message: string, detail?: unknown): void
  /** A logger that prefixes a narrower scope (e.g. `app` → `app:plugins`). */
  child(scope: string): Logger
}

/** debug logs print via console but stay out of the UI unless explicitly kept. */
const CONSOLE: Record<LogLevel, (...args: unknown[]) => void> = {
  debug: (...a) => console.debug(...a),
  info: (...a) => console.log(...a),
  warn: (...a) => console.warn(...a),
  error: (...a) => console.error(...a),
}

/** Turn an arbitrary detail value into a readable, secret-free-ish string. */
function stringifyDetail(detail: unknown): string | undefined {
  if (detail === undefined || detail === null) return undefined
  if (typeof detail === 'string') return detail
  if (detail instanceof Error) return detail.stack ?? `${detail.name}: ${detail.message}`
  try {
    return JSON.stringify(detail, null, 2)
  } catch {
    return String(detail)
  }
}

/**
 * App logger (glue). Every line is mirrored to the console (so terminal /
 * devtools workflows are unchanged) *and* recorded into the unified activity
 * stream as a `log` entry, so users and developers can read, filter, search,
 * and export diagnostics from the in-app Activity panel — no log files to dig
 * out. Scope is carried as the entry `source`.
 */
export function createLogger(sink: LogSink, scope = 'app'): Logger {
  const emit = (level: LogLevel, message: string, detail?: unknown): void => {
    const detailStr = stringifyDetail(detail)
    CONSOLE[level](`[${scope}] ${message}`, ...(detailStr !== undefined ? [detailStr] : []))
    sink.record({
      kind: 'log',
      level: level === 'debug' ? 'debug' : level,
      title: message,
      detail: detailStr,
      source: scope,
    })
  }
  return {
    debug: (message, detail) => emit('debug', message, detail),
    info: (message, detail) => emit('info', message, detail),
    warn: (message, detail) => emit('warn', message, detail),
    error: (message, detail) => emit('error', message, detail),
    child: (sub) => createLogger(sink, `${scope}:${sub}`),
  }
}
