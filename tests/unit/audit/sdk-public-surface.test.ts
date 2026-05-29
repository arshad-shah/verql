// The plugin SDK is the public API third-party developers code against.
// Every contribution surface that a plugin can register must be reachable
// from the SDK barrel, and every helper a driver needs (identifier
// quoting, SQL formatting, statement splitting, etc.) must be exported.
// This test pins the barrel against accidental regressions — if someone
// removes an export the test fails before the build does.
import { describe, it, expect, vi } from 'vitest'

// The SDK barrel pulls Electron transitively (ipcMain / BrowserWindow are used
// by createPluginContext for ctx.ipc.handle and ctx.broadcast). The barrel
// loads fine at module-evaluation time though, so a minimal Electron stub
// lets us inspect what it actually exports.
vi.mock('electron', () => ({
  ipcMain: { handle: () => {}, removeHandler: () => {} },
  BrowserWindow: { getAllWindows: () => [] },
}))

import * as sdk from '../../../src/main/plugins/sdk'

const EXPECTED_EXPORTS = [
  // Registry implementations (most plugins won't need these directly, but
  // the bundled-plugin tests do, and a strict TS plugin author may want
  // them to wire fakes in their own tests).
  'DriverRegistryImpl',
  'CommandRegistryImpl',
  'PanelRegistryImpl',
  'UIRegistryImpl',
  'CompletionRegistryImpl',
  'SchemaAccessImpl',
  'ConnectionAccessImpl',
  'PluginSettingsImpl',
  'ServiceRegistryImpl',
  'ExporterRegistryImpl',
  'ImporterRegistryImpl',
  'TypeMapperRegistryImpl',
  'ThemeRegistryImpl',
  'DragDropRegistryImpl',
  // Error handling
  'safeCall',
  'ErrorBudget',
  'PluginError',
  // Context lifecycle
  'createPluginContext',
  'disposePluginContext',
  // SQL helpers — drivers compose these to build their exporters/importers
  // without touching anything in src/main/ outside src/main/plugins/.
  'quoteIdentifier',
  'validateIdentifier',
  'IdentifierError',
  'formatSqlValue',
  'generateCreateTable',
  'generateInsertStatements',
  'splitSqlStatements',
  'importCsvToTable',
  'createRelationalGetTableData',
  // Theme validation — plugin authors should be able to validate their
  // theme tokens with the same checker the host uses.
  'validateTheme',
  'REQUIRED_THEME_TOKENS',
  'RECOMMENDED_THEME_TOKENS',
  // Capability/permission model — plugin authors declare permissions in their
  // manifest and the host gates the enforced surfaces. These constants and the
  // error type are part of the public contract.
  'ALL_PERMISSIONS',
  'ENFORCED_PERMISSIONS',
  'ADVISORY_PERMISSIONS',
  'PERMISSION_INFO',
  'isPluginPermission',
  'hasPermission',
  'effectiveGrants',
  'PermissionDeniedError',
] as const

describe('SDK barrel — public surface for plugin authors', () => {
  it.each(EXPECTED_EXPORTS)('exports %s', (name) => {
    expect(
      (sdk as Record<string, unknown>)[name],
      `Expected @verql/plugin-sdk to export '${name}'`,
    ).toBeDefined()
  })
})
