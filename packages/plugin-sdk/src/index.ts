// @verql/plugin-sdk — the public surface plugin authors code against.
//
// This is a *curated* re-export of the electron-free portion of the app's
// in-repo SDK (src/main/plugins/sdk). Anything that touches Electron — most
// notably `createPluginContext` and the registry *implementations* — is the
// host's concern and is intentionally NOT published: a plugin receives a ready
// `PluginContext` in `activate(ctx)`; it never builds one.
//
// Keep this list in sync with the author-facing exports of
// `src/main/plugins/sdk/index.ts`. The `tests/unit/audit/sdk-public-surface`
// test pins the runtime exports against accidental regressions.

// ─── The type surface ───────────────────────────────────────────────────────
// Every interface a plugin codes against: PluginContext and all its sub-access
// types, DriverFactory/DbAdapter shapes, Tool/ToolRegistry, themes, etc.
export type * from '../../../src/main/plugins/sdk/types'
export type { PluginManifest } from '../../../src/main/plugins/types'

// ─── Plugin authoring ergonomics ─────────────────────────────────────────────
export { definePlugin } from '../../../src/main/plugins/sdk/define-plugin'
export type { PluginModule } from '../../../src/main/plugins/sdk/define-plugin'

// ─── Generic SQL helpers (parameterised on the driver's quote character) ──────
export { quoteIdentifier, validateIdentifier, IdentifierError, renderPlaceholder } from '../../../src/main/plugins/sdk/identifier'
export {
  formatSqlValue,
  generateCreateTable,
  generateInsertStatements,
} from '../../../src/main/plugins/sdk/sql-format'
export { splitSqlStatements } from '../../../src/main/plugins/sdk/sql-statements'
export { importCsvToTable } from '../../../src/main/plugins/sdk/csv-into-table'
export type { CsvIntoTableOptions } from '../../../src/main/plugins/sdk/csv-into-table'
export { createRelationalGetTableData } from '../../../src/main/plugins/sdk/relational-helpers'

// ─── Theme registration + validation ─────────────────────────────────────────
export {
  validateTheme,
  REQUIRED_THEME_TOKENS,
  RECOMMENDED_THEME_TOKENS,
} from '../../../src/main/plugins/sdk/theme-registry'
export type {
  RegisteredTheme,
  ThemeMonacoDef,
  ThemeMonacoRule,
  ThemePreview,
  ThemeValidationReport,
} from '../../../src/main/plugins/sdk/theme-registry'

// ─── Contribution type helpers (erased at runtime) ───────────────────────────
export type { DragDropProvider, DragDropContext } from '../../../src/main/plugins/sdk/drag-drop-registry'
export type { RegisteredExporter, ExporterFn, ExporterOptions } from '../../../src/main/plugins/sdk/exporter-registry'
export type { RegisteredImporter, ImporterParseFn, ImporterOptions, ImporterResult } from '../../../src/main/plugins/sdk/importer-registry'
export type { TypeMapping, TypeMappingEntry, TypeMappingFallback } from '../../../src/main/plugins/sdk/type-mapper-registry'

// ─── Tool schema helpers ──────────────────────────────────────────────────────
export { isWriteQuery, toJsonSchema, jsonSchemaToZodShape } from '../../../src/main/plugins/sdk/tool-schema'
export type { JsonSchemaObject } from '../../../src/main/plugins/sdk/tool-schema'

// ─── Error handling ───────────────────────────────────────────────────────────
export { safeCall, ErrorBudget, PluginError } from '../../../src/main/plugins/sdk/safe-call'

// ─── Capability / permission model ────────────────────────────────────────────
export {
  ALL_PERMISSIONS,
  ENFORCED_PERMISSIONS,
  ADVISORY_PERMISSIONS,
  PERMISSION_INFO,
  isPluginPermission,
  hasPermission,
  effectiveGrants,
  PermissionDeniedError,
} from '../../../src/main/plugins/sdk/permissions'
export type {
  PluginPermission,
  EnforcedPermission,
  AdvisoryPermission,
  PermissionInfo,
  PermissionGrant,
} from '../../../src/main/plugins/sdk/permissions'
