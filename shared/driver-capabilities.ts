import type { DbErrorRule } from './db-errors'

/** What transaction semantics a driver supports. All fields are data-only
 *  (no functions) so this serializes cleanly over IPC. */
export interface SessionCapability {
  autoCommit: boolean
  manualTransactions: boolean
  isolationLevels?: string[]
  readOnly?: boolean
  savepoints?: boolean
  /** What this engine calls a transaction. Defaults to "Transaction". */
  transactionLabel?: string
  /** 'full' = real rollback (PG/MySQL); 'discard' = best-effort (Redis DISCARD). */
  rollbackKind?: 'full' | 'discard'
}

export interface ExplainCapability {
  supportsAnalyze: boolean
  /** 'tree' = renderer draws an ExplainNode tree; 'text' = raw plan text. */
  format: 'tree' | 'text'
  /** The statement prepended to a query to produce its plan — e.g.
   *  'EXPLAIN ANALYZE' (Postgres/MySQL), 'EXPLAIN QUERY PLAN' (SQLite),
   *  'EXPLAIN' (Snowflake). The renderer prepends this verbatim and never
   *  hardcodes an EXPLAIN dialect. Drivers that can't explain omit the whole
   *  `explain` capability, which hides the Explain action. */
  statement: string
}

export interface InspectionCapability {
  canKill: boolean
}

/** Options when opening a session or beginning a transaction. */
export interface SessionOpts {
  autoCommit?: boolean
  readOnly?: boolean
  isolationLevel?: string
}

/** Per-connection overlay a driver may apply at connect time. Deliberately a
 *  narrow subset — it can only flip pre-existing fields, never add new
 *  capability kinds or change explain.format. */
export interface RuntimeCapabilityOverlay {
  // structural fields (rollbackKind, transactionLabel, savepoints, autoCommit) are set at factory time and never overridden at connect time
  session?: Partial<Pick<SessionCapability, 'manualTransactions' | 'isolationLevels' | 'readOnly'>>
  sessionInspection?: Partial<InspectionCapability>
}

/** Serializable, function-free capabilities the renderer consumes. */
export interface DriverCapabilities {
  /** Free-form dialect tag — the renderer treats this as a label, not a
   *  discriminator. Branching on the connection's `type` is forbidden;
   *  see tests/unit/export-import-no-hardcoding.test.ts. */
  sqlDialect?: string
  editorLanguage?: string
  /** Which built-in statement-splitting dialect the renderer's statement gutter
   *  (CodeLens "Run/Explain" overlay) should use for this driver — e.g. `'sql'`,
   *  `'redis'`, `'mongodb'`. The driver *declares* it; the renderer owns the
   *  generic, Monaco-coupled splitter implementations and selects one by this id
   *  (no hardcoded db-type enumeration). Omit for drivers with no statements. */
  statementSyntax?: string
  /** Driver-contributed error-classification rules for this dialect's
   *  query-semantic errors (bad column/table, syntax, constraints, …). The
   *  renderer matches them to classify errors and pick a friendly message,
   *  instead of hardcoding per-dialect error text. */
  errorRules?: DbErrorRule[]
  defaultSchemaUseConnectionDatabase?: boolean
  defaultSchemaCandidates?: string[]
  hasSampleQuery: boolean
  hasGetTableData: boolean
  session?: SessionCapability
  explain?: ExplainCapability
  sessionInspection?: InspectionCapability
}

/**
 * Merge a per-connection overlay over static capabilities. The overlay can only
 * affect a block the driver already declared structurally — you cannot enable a
 * capability a driver never advertised. Pure; never mutates `base`.
 */
export function mergeCapabilities(
  base: DriverCapabilities,
  overlay: RuntimeCapabilityOverlay | null | undefined
): DriverCapabilities {
  if (!overlay) return base
  return {
    ...base,
    session: base.session ? { ...base.session, ...overlay.session } : base.session,
    sessionInspection: base.sessionInspection
      ? { ...base.sessionInspection, ...overlay.sessionInspection }
      : base.sessionInspection,
  }
}
