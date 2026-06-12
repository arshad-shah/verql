// Renderer-facing descriptors for the export/import formats a connection
// supports. The main process derives these from the exporter/importer
// registries (filtered by the connection's driver type), so the modals render
// the actually-available formats instead of a hardcoded `sql | csv | json`
// list — a Mongo connection won't be offered a SQL export, etc.

export interface ExportFormatInfo {
  /** Stable format id passed back to `export:*` (e.g. 'csv', 'json', 'sql'). */
  format: string
  /** Human label for the format button. */
  displayName: string
  /** File extension the exporter writes. */
  extension: string
  /** Whether this format honours the "include schema definition" option. */
  supportsSchema: boolean
}

export interface ImportFormatInfo {
  /** Stable format id (e.g. 'csv', 'sql'). */
  format: string
  /** Human label for the format button. */
  displayName: string
  /** File extensions the importer accepts. */
  extensions: string[]
  /** True when the importer runs its own statements against the driver (SQL
   *  scripts) — the modal then skips the target-object field a data import needs. */
  driverExecutes: boolean
}
