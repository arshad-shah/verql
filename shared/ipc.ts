import type { ConnectionProfile, QueryResult, SchemaTable, SchemaColumn, SchemaIndex, SchemaObject, DatabaseType } from './types'
import type { AppSettings } from './settings'
import type { AIChatStartRequest, AIStreamEvent, AIProviderInfo, AIModelInfo, AIChatMessage } from './ai-types'
import type { DriverCapabilities, SessionOpts, RuntimeCapabilityOverlay } from './driver-capabilities'
import type { ActivityEntry, ActivityQuery } from './activity'
import type { ConversationsSnapshot, StoredConversation, SavedQuery } from './appdata'

export interface IpcChannelMap {
  'db:connect': {
    args: [profileId: string]
    return: { success: boolean; error?: string }
  }
  'db:disconnect': {
    args: [profileId: string]
    return: void
  }
  'db:set-active-connection': {
    args: [profileId: string | null]
    return: void
  }
  'activity:list': {
    args: [query?: ActivityQuery]
    return: ActivityEntry[]
  }
  'activity:clear': {
    args: []
    return: void
  }
  'db:query': {
    args: [profileId: string, sql: string, params?: unknown[], opts?: { sessionId?: string; timeoutMs?: number }]
    return: QueryResult
  }
  'db:format-query': {
    args: [language: string, connectionType: string, source: string]
    return: { formatted: string; changed: boolean }
  }
  'db:test-connection': {
    args: [profile: ConnectionProfile]
    return: { success: boolean; error?: string; version?: string; details?: Record<string, string> }
  }
  'db:get-tables': {
    args: [profileId: string, schema?: string]
    return: SchemaTable[]
  }
  'db:get-columns': {
    args: [profileId: string, table: string, schema?: string]
    return: SchemaColumn[]
  }
  'db:get-indexes': {
    args: [profileId: string, table: string, schema?: string]
    return: SchemaIndex[]
  }
  'db:get-schemas': {
    args: [profileId: string]
    return: string[]
  }
  'db:get-databases': {
    args: [profileId: string]
    return: string[]
  }
  'db:get-row-count': {
    args: [profileId: string, table: string, schema?: string]
    return: number
  }
  'db:get-schema-objects': {
    args: [profileId: string, schema?: string]
    return: SchemaObject[]
  }
  'db:switch-database': {
    args: [profileId: string, database: string]
    return: void
  }
  'db:switch-warehouse': {
    args: [profileId: string, warehouse: string]
    return: void
  }
  'db:switch-role': {
    args: [profileId: string, role: string]
    return: void
  }
  'connections:list': {
    args: []
    return: ConnectionProfile[]
  }
  'connections:save': {
    args: [profile: ConnectionProfile]
    return: ConnectionProfile
  }
  'connections:delete': {
    args: [profileId: string]
    return: void
  }
  'db:set-schema': {
    args: [profileId: string, schema: string]
    return: void
  }
  'db:cancel-query': {
    args: [profileId: string]
    return: void
  }
  'db:get-table-names': {
    args: [profileId: string, schema?: string]
    return: string[]
  }
  'db:sample-query': {
    args: [profileId: string, table: string, schema?: string]
    return: string
  }
  'db:driver-capabilities': {
    args: [type: string]
    return: DriverCapabilities | null
  }
  'db:session:open': {
    args: [profileId: string, sessionId: string, opts?: SessionOpts]
    return: void
  }
  'db:session:close': {
    args: [profileId: string, sessionId: string]
    return: void
  }
  'db:session:set-autocommit': {
    args: [profileId: string, sessionId: string, enabled: boolean]
    return: void
  }
  'db:txn:begin': {
    args: [profileId: string, sessionId: string, opts?: SessionOpts]
    return: void
  }
  'db:txn:commit': {
    args: [profileId: string, sessionId: string]
    return: void
  }
  'db:txn:rollback': {
    args: [profileId: string, sessionId: string]
    return: void
  }
  'db:connection-capabilities': {
    args: [profileId: string]
    return: RuntimeCapabilityOverlay | null
  }
  'export:table': {
    args: [profileId: string, tableName: string, format: 'sql' | 'csv' | 'json', options?: { schema?: string; includeSchema?: boolean }]
    return: { filePath: string } | { cancelled: true }
  }
  'export:query-result': {
    args: [rows: Record<string, unknown>[], fields: string[], format: 'csv' | 'json']
    return: { filePath: string } | { cancelled: true }
  }
  'import:csv': {
    args: [profileId: string, tableName: string, columnMapping: Record<string, string>, onConflict: 'skip' | 'update' | 'error']
    return: { inserted: number; skipped: number; errors: string[] } | { cancelled: true }
  }
  'import:sql': {
    args: [profileId: string]
    return: { executed: number; errors: string[] } | { cancelled: true }
  }
  'migration:type-map': {
    args: [sourceType: string, from: DatabaseType, to: DatabaseType]
    return: { source: string; target: string; lossy: boolean; note?: string }
  }
  'migration:generate-ddl': {
    args: [tableName: string, columns: { name: string; dataType: string; nullable: boolean; isPrimaryKey: boolean; defaultValue: string | null }[], from: DatabaseType, to: DatabaseType]
    return: { ddl: string; mappings: { source: string; target: string; lossy: boolean; note?: string }[] }
  }
  'plugins:list': {
    args: []
    return: {
      name: string
      displayName: string
      version: string
      description: string
      bundled: boolean
      icon?: string
      status: { state: string; error?: string; phase?: string; contributions?: string[] }
      contributions: string[]
      /** Sensitive capabilities the plugin declared in its manifest. */
      requestedPermissions: string[]
      /** Capabilities currently granted (all of them for trusted/bundled). */
      grantedPermissions: string[]
    }[]
  }
  'plugins:get-permissions': {
    args: [name: string]
    return: {
      trusted: boolean
      declared: string[]
      granted: string[]
      info: Record<string, { title: string; description: string; enforced: boolean; sensitive: boolean }>
    } | null
  }
  'plugins:set-permissions': {
    args: [name: string, permissions: string[]]
    return: { granted: string[] }
  }
  'plugins:activate': {
    args: [name: string]
    return: { success: boolean; error?: string }
  }
  'plugins:deactivate': {
    args: [name: string]
    return: void
  }
  'plugins:install-from-path': {
    args: [path: string]
    return: { success: boolean; name?: string; error?: string }
  }
  'plugins:install-from-zip': {
    args: [zipPath: string]
    return: { success: boolean; name?: string; error?: string }
  }
  'plugins:open-install-dialog': {
    args: []
    return: string | null
  }
  'plugins:uninstall': {
    args: [name: string]
    return: void
  }
  'plugins:errors': {
    args: [name: string]
    return: { timestamp: number; error: string; stack?: string }[]
  }
  'plugins:get-settings': {
    args: [name: string]
    return: {
      schema: {
        key: string
        title: string
        type: 'text' | 'password' | 'number' | 'boolean' | 'select'
        default?: string | number | boolean
        description?: string
        min?: number
        max?: number
        step?: number
        options?: { value: string; label: string }[]
        category?: string
      }[]
      values: Record<string, unknown>
    }
  }
  'plugins:set-setting': {
    args: [name: string, key: string, value: unknown]
    return: void
  }
  'plugins:connection-fields': {
    args: []
    return: { driverId: string; driverName: string; connectionFields: { key: string; label: string; type: string; required?: boolean; default?: string | number | boolean; group?: string; fetchable?: boolean; step?: number; options?: { value: string; label: string }[] }[] }[]
  }
  'plugins:middleware-fields': {
    args: []
    return: { key: string; label: string; type: string; required?: boolean; default?: string | number | boolean; group?: string }[]
  }
  'plugins:ui:get-contributions': {
    args: [surface: string]
    return: import('./plugin-ui-types').UIContribution[]
  }
  'plugins:ui:resolve': {
    args: [pluginId: string, resolverId: string, context: import('./plugin-ui-types').ResolverContext]
    return: { value: string; label: string }[]
  }
  'plugins:ui:action': {
    args: [pluginId: string, commandId: string, payload: Record<string, unknown>]
    return: void
  }
  /** Renderer reports the outcome of a `app:action:perform` request back to the AI tool. */
  'app:action:result': {
    args: [payload: { requestId: string; success: boolean; error?: string }]
    return: void
  }
  'plugins:ui:contributions-changed': {
    args: []
    return: void
  }
  'plugins:get-commands': {
    args: []
    return: {
      pluginId: string
      pluginDisplayName: string
      commandId: string
      title: string
      keybinding?: string
    }[]
  }
  'plugins:completions': {
    args: [driverId: string, connectionId: string, context: import('./plugin-ui-types').CompletionContext]
    return: import('./plugin-ui-types').CompletionItem[]
  }
  'settings:get-all': {
    args: []
    return: AppSettings
  }
  'settings:get': {
    args: [category: string]
    return: unknown
  }
  'settings:set': {
    args: [keyPath: string, value: unknown]
    return: void
  }
  'settings:reset': {
    args: [category: string]
    return: unknown
  }
  'dialog:open-file': {
    args: [options?: { title?: string; filters?: { name: string; extensions: string[] }[] }]
    return: { filePath: string; content: string } | { cancelled: true }
  }
  'dialog:open-file-path': {
    args: [options?: { title?: string; filters?: { name: string; extensions: string[] }[] }]
    return: { filePath: string } | { cancelled: true }
  }
  'db:connection-options': {
    args: [profile: ConnectionProfile, fields: string[]]
    return: Record<string, string[]>
  }
  'keyring:store': {
    args: [profileId: string, key: string, value: string]
    return: void
  }
  'keyring:retrieve': {
    args: [profileId: string, key: string]
    return: string | null
  }
  'keyring:delete': {
    args: [profileId: string, key: string]
    return: void
  }
  // ─── AI ─────────────────────────────────────────────────────────────────────
  'ai:chat:start': {
    args: [request: AIChatStartRequest]
    return: { streamId: string }
  }
  'ai:chat:abort': {
    args: [streamId: string]
    return: void
  }
  'ai:chat:approval-response': {
    args: [requestId: string, approved: boolean]
    return: void
  }
  'ai:providers:list': {
    args: []
    return: AIProviderInfo[]
  }
  'ai:providers:list-configured': {
    args: []
    return: AIProviderInfo[]
  }
  'ai:providers:set-active': {
    args: [providerId: string]
    return: void
  }
  'ai:providers:get-active': {
    args: []
    return: AIProviderInfo | null
  }
  'ai:models:list': {
    args: []
    return: AIModelInfo[]
  }
  'ai:models:set-active': {
    args: [modelId: string]
    return: void
  }
  'ai:models:get-active': {
    args: []
    return: string | null
  }
  'ai:messages:list': {
    args: []
    return: AIChatMessage[]
  }
  'ai:messages:clear': {
    args: []
    return: void
  }
  'ai:messages:set': {
    args: [messages: AIChatMessage[]]
    return: void
  }
  'ai:tools:list': {
    args: []
    return: { id: string; name: string; description: string; permission: 'read' | 'write' }[]
  }
  'ai:keys:has': {
    args: [provider: 'openai' | 'anthropic']
    return: boolean
  }
  'ai:keys:set': {
    args: [provider: 'openai' | 'anthropic', value: string]
    return: void
  }
  /** Triggers a soft relaunch of the app. Renderer prompts the user via the
   *  plugin-lifecycle banner; only the user's confirmation calls this. */
  'app:restart': {
    args: []
    return: void
  }
  /** Returns whether any updater can manage this install + which channel. */
  'updater:status': {
    args: []
    return:
      | { available: false }
      | { available: true; id: string; displayName: string; currentVersion: string }
  }
  /** Asks the active updater whether a new version is available. */
  'updater:check': {
    args: []
    return:
      | { supported: false }
      | { supported: true; currentVersion: string; latestVersion: string | null; available: boolean }
  }
  /** Kicks off the update install. Progress streams on `updater:progress`. */
  'updater:update': {
    args: []
    return:
      | { started: true }
      | { started: false; reason: 'no-updater' }
  }
  /**
   * Returns settings contributed by active plugins, filtered to a single
   * core category. Used to render plugin-contributed rows alongside core
   * settings in their target category. Disabled plugins are excluded.
   */
  'plugins:get-categorized-settings': {
    args: [category: string]
    return: {
      pluginName: string
      pluginDisplayName: string
      schema: {
        key: string
        title: string
        type: 'text' | 'password' | 'number' | 'boolean' | 'select'
        default?: string | number | boolean
        description?: string
        min?: number
        max?: number
        step?: number
        options?: { value: string; label: string }[]
      }[]
      values: Record<string, unknown>
    }[]
  }
  // ─── AI Enhancements ────────────────────────────────────────────────────────
  'ai:generate-sql': {
    args: [request: { prompt: string; connectionId: string; schema?: string }]
    return: { sql: string }
  }
  'ai:complete-sql': {
    args: [request: { sql: string; cursorOffset: number; connectionId: string; schema?: string }]
    return: { completion: string }
  }
  'ai:explain-results': {
    args: [request: { sql: string; columns: string[]; rowCount: number; sampleRows: Record<string, unknown>[] }]
    return: { explanation: string; model: string; durationMs: number }
  }
  'ai:explain:start': {
    args: [request: { sql: string; columns: string[]; rowCount: number; sampleRows: Record<string, unknown>[] }]
    return: { streamId: string; model: string }
  }
  'ai:explain:abort': {
    args: [streamId: string]
    return: void
  }
  'ai:conversation:summarize': {
    args: [messages: AIChatMessage[]]
    return: { summary: string }
  }
  'ai:permission:get-profile': {
    args: []
    return: 'read-only' | 'ask-write' | 'auto'
  }
  'ai:permission:set-profile': {
    args: [profile: 'read-only' | 'ask-write' | 'auto']
    return: void
  }
  // ─── App-data store (SQLite) ─────────────────────────────────────────────────
  // Durable home for high-growth datasets that used to live in renderer
  // localStorage. See docs/proposals/internal-app-data-store.md.
  /** All conversations (with messages) plus the last-active id. */
  'appdata:conversations:list': {
    args: []
    return: ConversationsSnapshot
  }
  /** Replace one conversation and its messages in a single transaction. */
  'appdata:conversations:upsert': {
    args: [conversation: StoredConversation]
    return: void
  }
  'appdata:conversations:delete': {
    args: [id: string]
    return: void
  }
  /** Remember which conversation is active across restarts. */
  'appdata:conversations:set-active': {
    args: [id: string | null]
    return: void
  }
  /** One-time migration import. No-ops when conversations already exist. */
  'appdata:conversations:import': {
    args: [conversations: StoredConversation[], activeConversationId: string | null]
    return: { imported: number }
  }
  'appdata:saved-queries:list': {
    args: []
    return: SavedQuery[]
  }
  'appdata:saved-queries:upsert': {
    args: [query: SavedQuery]
    return: void
  }
  'appdata:saved-queries:delete': {
    args: [id: string]
    return: void
  }
  /** One-time migration import. No-ops when saved queries already exist. */
  'appdata:saved-queries:import': {
    args: [queries: SavedQuery[]]
    return: { imported: number }
  }
  // ─── MCP Server ─────────────────────────────────────────────────────────────
  'mcp:start': {
    args: []
    return: import('./mcp').MCPStartResult
  }
  'mcp:stop': {
    args: []
    return: void
  }
  'mcp:status': {
    args: []
    return: import('./mcp').MCPServerStatus
  }
  'mcp:tools': {
    args: []
    return: import('./mcp').MCPToolInfo[]
  }
  'mcp:set-tool-enabled': {
    args: [toolId: string, enabled: boolean]
    return: void
  }
  'mcp:activity': {
    args: []
    return: import('./mcp').MCPActivityEntry[]
  }
  'mcp:regenerate-token': {
    args: []
    return: import('./mcp').MCPServerStatus
  }
  'mcp:reload': {
    args: []
    return: import('./mcp').MCPServerStatus
  }
  'mcp:approval-response': {
    args: [requestId: string, approved: boolean]
    return: void
  }
  'themes:list': {
    args: []
    return: {
      id: string
      name: string
      type: 'dark' | 'light'
      tokens?: Record<string, string>
      css?: string
      monaco?: {
        base: 'vs' | 'vs-dark'
        colors: Record<string, string>
        rules: { token: string; foreground: string; background?: string; fontStyle?: string }[]
      }
      preview?: { bg: string; sidebar: string; text: string; accent: string }
      source?: string
    }[]
  }
  'plugins:drag-drop': {
    args: [filePath: string]
    return: { handled: boolean }
  }
}

// ─── Central channel registry ───────────────────────────────────────────────
//
// Use these constants instead of inline string literals at every IPC call
// site. Adding a new channel is a three-step operation, all in this file:
//
//   1. Add the channel definition to `IpcChannelMap` above (args + return).
//   2. Add the matching constant to `IPC_CHANNELS` below.
//   3. Use `IPC_CHANNELS.<NAME>` from both main and renderer.
//
// The `satisfies` clause makes TypeScript reject any constant whose value
// isn't a key of `IpcChannelMap`. The coverage test (tests/unit/ipc-channels-
// coverage.test.ts) makes TypeScript reject any IpcChannelMap key that
// doesn't appear in IPC_CHANNELS. Together they keep this registry the
// single source of truth.

export type IpcChannel = keyof IpcChannelMap

export const IPC_CHANNELS = {
  // ── Database lifecycle ─────────────────────────────────────────────────
  DB_CONNECT: 'db:connect',
  DB_DISCONNECT: 'db:disconnect',
  DB_SET_ACTIVE_CONNECTION: 'db:set-active-connection',
  ACTIVITY_LIST: 'activity:list',
  ACTIVITY_CLEAR: 'activity:clear',
  DB_QUERY: 'db:query',
  DB_FORMAT_QUERY: 'db:format-query',
  DB_TEST_CONNECTION: 'db:test-connection',
  DB_CONNECTION_OPTIONS: 'db:connection-options',
  DB_CANCEL_QUERY: 'db:cancel-query',
  DB_SAMPLE_QUERY: 'db:sample-query',
  DB_DRIVER_CAPABILITIES: 'db:driver-capabilities',
  // ── Schema introspection ───────────────────────────────────────────────
  DB_GET_TABLES: 'db:get-tables',
  DB_GET_COLUMNS: 'db:get-columns',
  DB_GET_INDEXES: 'db:get-indexes',
  DB_GET_SCHEMAS: 'db:get-schemas',
  DB_GET_DATABASES: 'db:get-databases',
  DB_GET_ROW_COUNT: 'db:get-row-count',
  DB_GET_SCHEMA_OBJECTS: 'db:get-schema-objects',
  DB_GET_TABLE_NAMES: 'db:get-table-names',
  // ── Database session controls ─────────────────────────────────────────
  DB_SWITCH_DATABASE: 'db:switch-database',
  DB_SWITCH_WAREHOUSE: 'db:switch-warehouse',
  DB_SWITCH_ROLE: 'db:switch-role',
  DB_SET_SCHEMA: 'db:set-schema',
  DB_SESSION_OPEN: 'db:session:open',
  DB_SESSION_CLOSE: 'db:session:close',
  DB_SESSION_SET_AUTOCOMMIT: 'db:session:set-autocommit',
  DB_TXN_BEGIN: 'db:txn:begin',
  DB_TXN_COMMIT: 'db:txn:commit',
  DB_TXN_ROLLBACK: 'db:txn:rollback',
  DB_CONNECTION_CAPABILITIES: 'db:connection-capabilities',
  // ── Connection profiles ────────────────────────────────────────────────
  CONNECTIONS_LIST: 'connections:list',
  CONNECTIONS_SAVE: 'connections:save',
  CONNECTIONS_DELETE: 'connections:delete',
  // ── Export / Import ────────────────────────────────────────────────────
  EXPORT_TABLE: 'export:table',
  EXPORT_QUERY_RESULT: 'export:query-result',
  IMPORT_CSV: 'import:csv',
  IMPORT_SQL: 'import:sql',
  // ── Migration ──────────────────────────────────────────────────────────
  MIGRATION_TYPE_MAP: 'migration:type-map',
  MIGRATION_GENERATE_DDL: 'migration:generate-ddl',
  // ── Plugins ────────────────────────────────────────────────────────────
  PLUGINS_LIST: 'plugins:list',
  PLUGINS_GET_PERMISSIONS: 'plugins:get-permissions',
  PLUGINS_SET_PERMISSIONS: 'plugins:set-permissions',
  PLUGINS_ACTIVATE: 'plugins:activate',
  PLUGINS_DEACTIVATE: 'plugins:deactivate',
  PLUGINS_INSTALL_FROM_PATH: 'plugins:install-from-path',
  PLUGINS_INSTALL_FROM_ZIP: 'plugins:install-from-zip',
  PLUGINS_OPEN_INSTALL_DIALOG: 'plugins:open-install-dialog',
  PLUGINS_UNINSTALL: 'plugins:uninstall',
  PLUGINS_ERRORS: 'plugins:errors',
  PLUGINS_GET_SETTINGS: 'plugins:get-settings',
  PLUGINS_SET_SETTING: 'plugins:set-setting',
  PLUGINS_CONNECTION_FIELDS: 'plugins:connection-fields',
  PLUGINS_MIDDLEWARE_FIELDS: 'plugins:middleware-fields',
  PLUGINS_GET_COMMANDS: 'plugins:get-commands',
  PLUGINS_COMPLETIONS: 'plugins:completions',
  PLUGINS_GET_CATEGORIZED_SETTINGS: 'plugins:get-categorized-settings',
  PLUGINS_UI_GET_CONTRIBUTIONS: 'plugins:ui:get-contributions',
  PLUGINS_UI_RESOLVE: 'plugins:ui:resolve',
  PLUGINS_UI_ACTION: 'plugins:ui:action',
  PLUGINS_UI_CONTRIBUTIONS_CHANGED: 'plugins:ui:contributions-changed',
  // ── App settings ───────────────────────────────────────────────────────
  SETTINGS_GET_ALL: 'settings:get-all',
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_RESET: 'settings:reset',
  // ── File dialogs ───────────────────────────────────────────────────────
  DIALOG_OPEN_FILE: 'dialog:open-file',
  DIALOG_OPEN_FILE_PATH: 'dialog:open-file-path',
  // ── Keyring ────────────────────────────────────────────────────────────
  KEYRING_STORE: 'keyring:store',
  KEYRING_RETRIEVE: 'keyring:retrieve',
  KEYRING_DELETE: 'keyring:delete',
  // ── AI ─────────────────────────────────────────────────────────────────
  AI_CHAT_START: 'ai:chat:start',
  AI_CHAT_ABORT: 'ai:chat:abort',
  AI_CHAT_APPROVAL_RESPONSE: 'ai:chat:approval-response',
  AI_PROVIDERS_LIST: 'ai:providers:list',
  AI_PROVIDERS_LIST_CONFIGURED: 'ai:providers:list-configured',
  AI_PROVIDERS_SET_ACTIVE: 'ai:providers:set-active',
  AI_PROVIDERS_GET_ACTIVE: 'ai:providers:get-active',
  AI_MODELS_LIST: 'ai:models:list',
  AI_MODELS_SET_ACTIVE: 'ai:models:set-active',
  AI_MODELS_GET_ACTIVE: 'ai:models:get-active',
  AI_MESSAGES_LIST: 'ai:messages:list',
  AI_MESSAGES_CLEAR: 'ai:messages:clear',
  AI_MESSAGES_SET: 'ai:messages:set',
  AI_TOOLS_LIST: 'ai:tools:list',
  AI_KEYS_HAS: 'ai:keys:has',
  AI_KEYS_SET: 'ai:keys:set',
  AI_GENERATE_SQL: 'ai:generate-sql',
  AI_COMPLETE_SQL: 'ai:complete-sql',
  AI_EXPLAIN_RESULTS: 'ai:explain-results',
  AI_EXPLAIN_START: 'ai:explain:start',
  AI_EXPLAIN_ABORT: 'ai:explain:abort',
  AI_CONVERSATION_SUMMARIZE: 'ai:conversation:summarize',
  AI_PERMISSION_GET_PROFILE: 'ai:permission:get-profile',
  AI_PERMISSION_SET_PROFILE: 'ai:permission:set-profile',
  // ── App-data store (SQLite) ────────────────────────────────────────────
  APPDATA_CONVERSATIONS_LIST: 'appdata:conversations:list',
  APPDATA_CONVERSATIONS_UPSERT: 'appdata:conversations:upsert',
  APPDATA_CONVERSATIONS_DELETE: 'appdata:conversations:delete',
  APPDATA_CONVERSATIONS_SET_ACTIVE: 'appdata:conversations:set-active',
  APPDATA_CONVERSATIONS_IMPORT: 'appdata:conversations:import',
  APPDATA_SAVED_QUERIES_LIST: 'appdata:saved-queries:list',
  APPDATA_SAVED_QUERIES_UPSERT: 'appdata:saved-queries:upsert',
  APPDATA_SAVED_QUERIES_DELETE: 'appdata:saved-queries:delete',
  APPDATA_SAVED_QUERIES_IMPORT: 'appdata:saved-queries:import',
  // ── MCP server ─────────────────────────────────────────────────────────
  MCP_START: 'mcp:start',
  MCP_STOP: 'mcp:stop',
  MCP_STATUS: 'mcp:status',
  MCP_TOOLS: 'mcp:tools',
  MCP_SET_TOOL_ENABLED: 'mcp:set-tool-enabled',
  MCP_ACTIVITY: 'mcp:activity',
  MCP_REGENERATE_TOKEN: 'mcp:regenerate-token',
  MCP_RELOAD: 'mcp:reload',
  MCP_APPROVAL_RESPONSE: 'mcp:approval-response',
  // ── App lifecycle ──────────────────────────────────────────────────────
  APP_RESTART: 'app:restart',
  // ── Updater ────────────────────────────────────────────────────────────
  UPDATER_STATUS: 'updater:status',
  UPDATER_CHECK: 'updater:check',
  UPDATER_UPDATE: 'updater:update',
  // ── Themes ──────────────────────────────────────────────────────────────
  THEMES_LIST: 'themes:list',
  // ── Drag and drop ──────────────────────────────────────────────────────
  PLUGINS_DRAG_DROP: 'plugins:drag-drop',
  // ── AI app actions ─────────────────────────────────────────────────────
  APP_ACTION_RESULT: 'app:action:result'
} as const satisfies Record<string, IpcChannel>

// ─── Broadcast events (main → renderer push) ────────────────────────────────
//
// Unlike invoke channels these are one-way notifications without a return
// value. The renderer subscribes via `window.electronAPI.on(IPC_EVENTS.X, …)`.
// The contract here keeps both sides honest about payload shape.

export interface IpcEventMap {
  /** Stream events for an in-flight AI chat (delta tokens, tool calls, …). */
  'ai:chat:event': [event: AIStreamEvent]
  /** Stream events for an in-flight explain-results stream. */
  'ai:explain:event': [event:
    | { streamId: string; kind: 'token'; text: string }
    | { streamId: string; kind: 'done'; durationMs: number }
    | { streamId: string; kind: 'error'; message: string }
  ]
  /** MCP server requested user approval for a sensitive action. */
  'mcp:approval-request': [request: import('./mcp').MCPApprovalRequest]
  /** MCP server recorded a tool call. */
  'mcp:activity-event': [entry: import('./mcp').MCPActivityEntry]
  /** A new entry was appended to the app activity log. */
  'activity:event': [entry: ActivityEntry]
  /** App menu accelerator: focus / create a new query tab. */
  'menu:new-query-tab': []
  /** App menu accelerator: open the new-connection form. */
  'menu:new-connection': []
  /** App menu accelerator: toggle the command palette. */
  'menu:toggle-command-palette': []
  /** A plugin transitioned through its lifecycle. */
  'plugins:lifecycle': [payload: { name: string; event: 'activated' | 'deactivated' | 'installed' | 'uninstalled' }]
  /** Plugin UI contributions have changed; renderer should refetch. */
  'plugins:ui:contributions-changed': []
  /** A setting changed; renderer mirrors should refresh. */
  'settings:changed': [payload: { keyPath: string; value: unknown }]
  /** A plugin requested a toast notification. */
  'notifications:show': [payload: { kind?: 'info' | 'success' | 'warning' | 'error'; title: string; message?: string; durationMs?: number }]
  /** The set of registered themes changed. */
  'themes:changed': []
  /** The AI asked to perform an in-app action; the renderer runs it. */
  'app:action:perform': [payload: { requestId: string; actionId: string; params: Record<string, unknown> }]
  /** Progress update for an in-flight `updater:update` install. */
  'updater:progress': [payload:
    | { phase: 'idle' }
    | { phase: 'checking' }
    | { phase: 'downloading'; percent?: number }
    | { phase: 'installing' }
    | { phase: 'done'; restartRequired: boolean }
    | { phase: 'error'; message: string }
  ]
}

export type IpcEvent = keyof IpcEventMap

export const IPC_EVENTS = {
  AI_CHAT_EVENT: 'ai:chat:event',
  AI_EXPLAIN_EVENT: 'ai:explain:event',
  MCP_APPROVAL_REQUEST: 'mcp:approval-request',
  MCP_ACTIVITY_EVENT: 'mcp:activity-event',
  ACTIVITY_EVENT: 'activity:event',
  MENU_NEW_QUERY_TAB: 'menu:new-query-tab',
  MENU_NEW_CONNECTION: 'menu:new-connection',
  MENU_TOGGLE_COMMAND_PALETTE: 'menu:toggle-command-palette',
  PLUGINS_LIFECYCLE: 'plugins:lifecycle',
  PLUGINS_UI_CONTRIBUTIONS_CHANGED: 'plugins:ui:contributions-changed',
  SETTINGS_CHANGED: 'settings:changed',
  NOTIFICATIONS_SHOW: 'notifications:show',
  THEMES_CHANGED: 'themes:changed',
  UPDATER_PROGRESS: 'updater:progress',
  APP_ACTION_PERFORM: 'app:action:perform'
} as const satisfies Record<string, IpcEvent>
