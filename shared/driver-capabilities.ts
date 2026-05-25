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
  session?: Partial<Pick<SessionCapability, 'manualTransactions' | 'isolationLevels' | 'readOnly'>>
  sessionInspection?: Partial<InspectionCapability>
}

/** Serializable, function-free capabilities the renderer consumes. */
export interface DriverCapabilities {
  sqlDialect?: string
  editorLanguage?: string
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
