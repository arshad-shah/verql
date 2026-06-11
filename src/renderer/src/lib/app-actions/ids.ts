/**
 * Central registry of built-in app-action ids — the single source of truth for
 * every action the app registers itself. Mirrors the project's other id
 * registries (`KEYBINDING_ACTION`, `SETTINGS_CATEGORY`, `IPC_CHANNELS`): code
 * never spells an action id as a raw string literal, it imports the constant.
 *
 * Ids are stable — they appear in `verql://action/<id>` deep links and in the
 * AI tool catalogue — so renaming a value is a breaking change. Plugin-
 * contributed actions use composite ids (`pluginId:commandId`) and are NOT
 * listed here; `AppAction.id` therefore stays a permissive `string`.
 */
export const APP_ACTION = {
  // Navigation & panels
  OPEN_SETTINGS: 'open-settings',
  OPEN_CONNECTIONS: 'open-connections',
  NEW_CONNECTION: 'new-connection',
  OPEN_EXPLORER: 'open-explorer',
  OPEN_SECONDARY_PANEL: 'open-secondary-panel',
  OPEN_NOTIFICATIONS: 'open-notifications',
  // Query tabs & schema authoring
  NEW_QUERY_TAB: 'new-query-tab',
  OPEN_SAVED_QUERY: 'open-saved-query',
  FORMAT_EDITOR: 'format-editor',
  INSERT_INTO_EDITOR: 'insert-into-editor',
  // Connections
  CONNECT_DATABASE: 'connect-database',
  DISCONNECT_DATABASE: 'disconnect-database',
  SWITCH_CONNECTION: 'switch-connection',
  // Results
  EXPORT_RESULTS: 'export-results',
  OPEN_CHART: 'open-chart',
  // Schema
  FOCUS_TABLE: 'focus-table',
  OPEN_ER_DIAGRAM: 'open-er-diagram',
  // Plugins
  OPEN_INSTALL_PLUGIN: 'open-install-plugin',
  // Onboarding & release notes
  OPEN_WELCOME: 'open-welcome',
  OPEN_RELEASE_NOTES: 'open-release-notes',
} as const

/** Union of the built-in app-action id literals. */
export type AppActionId = (typeof APP_ACTION)[keyof typeof APP_ACTION]
