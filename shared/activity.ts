/**
 * App activity log — a unified, in-memory stream of "what's happening" that
 * both the UI (the Activity panel) and agents (the AI chat + MCP clients, via a
 * shared read-only tool) can observe.
 *
 * The log is glue owned by the main process; recording happens at the points
 * where things actually occur (db queries, connection lifecycle, tool calls,
 * notifications, outbound network). Entries are deliberately free of secrets.
 */

export type ActivityKind =
  | 'query'        // a SQL query the app ran
  | 'tool-call'    // an AI/MCP agent tool execution
  | 'connection'   // connect / disconnect / failed
  | 'notification' // something surfaced to the user
  | 'network'      // an outbound request the app initiated (AI providers, …)
  | 'ipc'          // a renderer→main IPC call (channel, timing, ok/err)
  | 'plugin'       // a plugin lifecycle event (boot/activate/deactivate/error)
  | 'store'        // a renderer state-store mutation (which keys changed)
  | 'perf'         // a performance signal (long task, slow render)
  | 'log'          // a diagnostic log line from the app/glue (for devs)

export type ActivityLevel = 'debug' | 'info' | 'success' | 'warn' | 'error'

export interface ActivityEntry {
  id: string
  /** epoch milliseconds */
  ts: number
  kind: ActivityKind
  level: ActivityLevel
  /** Short, human-readable headline. */
  title: string
  /** Optional longer text (e.g. the SQL, an error message). */
  detail?: string
  /** Where it came from: a connection id/name, provider id, or tool id. */
  source?: string
  /** Duration in ms when the event represents an operation. */
  durationMs?: number
  /** Full error stack, when the entry represents a failure. */
  stack?: string
  /** Structured payload for the detail drawer (args, request/response, diffs).
   *  Must be secret-free and JSON-serialisable. */
  metadata?: Record<string, unknown>
  /** Correlates related entries (e.g. an IPC call and the query it triggered). */
  traceId?: string
}

export interface ActivityQuery {
  /** Restrict to these kinds (default: all). */
  kinds?: ActivityKind[]
  /** Restrict to these levels (default: all). */
  levels?: ActivityLevel[]
  /** Only entries at/after this epoch-ms timestamp. */
  sinceTs?: number
  /** Cap the number of (most-recent) entries returned. */
  limit?: number
}
