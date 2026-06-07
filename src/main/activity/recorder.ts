import type { ActivityLog, RecordInput } from './log'

/**
 * Process-wide handle to the one ActivityLog, so any main-side subsystem can
 * record a diagnostic entry without threading the log through its constructor.
 * Wired once in `ipc-handlers.ts` after the log is created; a no-op until then.
 */
let sink: ActivityLog | null = null

export function setActivitySink(log: ActivityLog): void {
  sink = log
}

export function recordActivity(input: RecordInput): void {
  sink?.record(input)
}
