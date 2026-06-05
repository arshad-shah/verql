import { useUiStore, type SecondaryPanelId } from '@/stores/ui'
import { SETTINGS_CATEGORY, isSettingsCategory } from '@/lib/settings-categories'
import { useTabsStore } from '@/stores/tabs'
import { useConnectionsStore } from '@/stores/connections'
import { useSchemaStore } from '@/stores/schema'
import { useSelectionStore } from '@/stores/selection'
import { useDriverCapabilitiesStore } from '@/stores/driver-capabilities'
import { editorRegistry } from '@/stores/editor'
import { pickDefaultSchema } from '@/lib/pick-default-schema'
import { initialAutoCommit } from '@/lib/initial-autocommit'
import { findSavedQuery, openSavedQuery } from '@/components/saved-queries/SavedQueriesPanel'
import { IPC_CHANNELS } from '@shared/ipc'
import { resolveConnection } from './resolve'
import { appActions } from './registry'
import type { AppAction } from './types'

const str = (v: unknown): string | undefined => (typeof v === 'string' && v ? v : undefined)

/** The active query tab's current results, or null when there's nothing to act on. */
function activeQueryResults() {
  const { tabs, activeTabId } = useTabsStore.getState()
  const tab = tabs.find((t) => t.id === activeTabId)
  return tab && tab.type === 'query' ? tab.results : null
}

/** Resolve the schema to target for the active connection, honouring an explicit
 *  value and otherwise falling back to the driver's default. */
async function resolveSchema(
  conn: { id: string; type: string; database: string },
  explicit: string | undefined
): Promise<string> {
  if (explicit) return explicit
  const schemas = await useSchemaStore.getState().fetchSchemas(conn.id, conn.database)
  const caps = await useDriverCapabilitiesStore.getState().fetch(conn.type)
  return pickDefaultSchema(caps ?? {}, schemas, conn.database) ?? conn.database ?? 'public'
}

/**
 * Built-in app actions, wired to the same store calls the command palette uses.
 * Registered once at startup. Plugins add their own via `appActions.register`.
 *
 * All are `navigation` (no data mutation): the AI may run them agentically via
 * the perform_app_action tool, and they also render as user-clickable deep-link
 * chips. Anything that would change data stays out of this list.
 */
const BUILTINS: AppAction[] = [
  // ── Navigation & panels ─────────────────────────────────────────────────
  {
    id: 'open-settings',
    title: 'Open Settings',
    description: `Open the settings screen, optionally at a category (${Object.values(SETTINGS_CATEGORY).join(', ')}). Use category "${SETTINGS_CATEGORY.PLUGINS}" to let the user enable or configure installed plugins.`,
    kind: 'navigation',
    params: { category: { type: 'string', description: 'Settings category id' } },
    run: (p) => {
      // Settings live in a dedicated editor tab (SettingsTab), not the left
      // sidebar panel. openSettings focuses the category when one is given;
      // ignore an unrecognised category rather than landing on a blank id.
      const category = str(p.category)
      useTabsStore.getState().openSettings(isSettingsCategory(category) ? category : undefined)
    }
  },
  {
    id: 'open-connections',
    title: 'Open Connections',
    description: 'Open the list of saved connections, where the user can connect to one that already exists. Use this when the user wants to connect to a database that is already saved (see the saved connections list).',
    kind: 'navigation',
    run: () => useUiStore.getState().setSecondaryActivePanel('connections')
  },
  {
    id: 'new-connection',
    title: 'Add a Connection',
    description: 'Open the form to create a brand-new connection. Only use this when the database the user wants is NOT already in the saved connections list; to connect to an existing one, use open-connections instead.',
    kind: 'navigation',
    run: () => useTabsStore.getState().openConnectionForm()
  },
  {
    id: 'open-explorer',
    title: 'Open Explorer',
    description: 'Show the explorer sidebar, where connections and schema live. Point users here to add or connect to a database.',
    kind: 'navigation',
    run: () => useUiStore.getState().setActivePanel('explorer')
  },
  {
    id: 'open-secondary-panel',
    title: 'Open Side Panel',
    description: 'Open a right-hand panel by id (e.g. connections, inspector, notifications).',
    kind: 'navigation',
    params: { id: { type: 'string', required: true, description: 'Secondary panel id' } },
    run: (p) => {
      const id = str(p.id)
      if (id) useUiStore.getState().setSecondaryActivePanel(id as SecondaryPanelId)
    }
  },
  {
    id: 'open-notifications',
    title: 'Open Notifications',
    description: 'Open the notifications panel, which lists recent errors, warnings, and activity. Use this when pointing the user to a past error or to recent diagnostics.',
    kind: 'navigation',
    run: () => {
      const ui = useUiStore.getState()
      if (!(ui.secondaryActivePanel === 'notifications' && ui.secondarySidebarVisible)) {
        ui.setSecondaryActivePanel('notifications')
      }
    }
  },

  // ── Query tabs & schema authoring ───────────────────────────────────────
  {
    id: 'new-query-tab',
    title: 'Open Query Tab',
    description: 'Open a new SQL query tab, optionally pre-filled with SQL. Use this to scaffold DDL such as CREATE TABLE, ALTER, or a migration script for the user to review. Nothing runs until the user executes it.',
    kind: 'navigation',
    params: { sql: { type: 'string', description: 'SQL to pre-fill' } },
    run: (p) => {
      const { activeConnectionId, connections } = useConnectionsStore.getState()
      const conn = connections.find((c) => c.id === activeConnectionId) ?? null
      useTabsStore.getState().addQueryTab(activeConnectionId, str(p.sql) ?? null, {
        autoCommit: initialAutoCommit(conn)
      })
    }
  },
  {
    id: 'open-saved-query',
    title: 'Open Saved Query',
    description: 'Open a saved query in a new query tab, by its name or id. Nothing runs until the user executes it.',
    kind: 'navigation',
    params: { query: { type: 'string', required: true, description: 'Saved query name or id' } },
    run: (p) => {
      const arg = str(p.query)
      if (!arg) throw new Error('Provide a saved query name or id.')
      const q = findSavedQuery(arg)
      if (!q) throw new Error(`No saved query matches "${arg}".`)
      openSavedQuery(q)
    }
  },
  {
    id: 'format-editor',
    title: 'Format Document',
    description: "Pretty-print the active editor's buffer using the connection's formatter (SQL dialect, JSON for document stores, etc.). Reformats the whole buffer; runs nothing. No-ops when the connection has no formatter.",
    kind: 'navigation',
    run: async () => {
      const reg = editorRegistry.get()
      if (!reg) throw new Error('No active editor. Open or focus a query tab first.')
      const model = reg.editor.getModel()
      if (!model) throw new Error('No editor content to format.')
      const source = model.getValue()
      if (!source.trim()) return
      const { tabs } = useTabsStore.getState()
      const tab = tabs.find((t) => t.id === reg.tabId)
      const { activeConnectionId, connections } = useConnectionsStore.getState()
      const connId = (tab && tab.type === 'query' ? tab.connectionId : null) ?? activeConnectionId
      const connType = connections.find((c) => c.id === connId)?.type ?? ''
      const { formatted, changed } = await window.electronAPI.invoke(
        IPC_CHANNELS.DB_FORMAT_QUERY, model.getLanguageId(), connType, source
      )
      if (!changed) return
      reg.editor.executeEdits('format-document', [{ range: model.getFullModelRange(), text: formatted }])
      reg.editor.focus()
    }
  },
  {
    id: 'insert-into-editor',
    title: 'Insert into Editor',
    description: 'Insert SQL into the active query editor, replacing the current selection (or inserting at the cursor when nothing is selected). The user reviews and runs it; nothing executes automatically.',
    kind: 'navigation',
    params: { sql: { type: 'string', required: true, description: 'SQL text to insert' } },
    run: (p) => {
      const sql = str(p.sql)
      if (!sql) throw new Error('Provide SQL to insert.')
      const reg = editorRegistry.get()
      if (!reg) throw new Error('No active SQL editor. Open or focus a query tab first.')
      const { editor } = reg
      const selection = editor.getSelection()
      const pos = editor.getPosition()
      const range = selection ?? (pos
        ? { startLineNumber: pos.lineNumber, startColumn: pos.column, endLineNumber: pos.lineNumber, endColumn: pos.column }
        : editor.getModel()?.getFullModelRange() ?? { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 })
      editor.executeEdits('ai-insert', [{ range, text: sql, forceMoveMarkers: true }])
      editor.focus()
    }
  },

  // ── Connection lifecycle ────────────────────────────────────────────────
  {
    id: 'connect-database',
    title: 'Connect to Database',
    description: 'Open a connection to a saved database, by connection name or id. Use this to actually connect, not just navigate to the connections list.',
    kind: 'navigation',
    params: { connection: { type: 'string', required: true, description: 'Saved connection name or id' } },
    run: async (p) => {
      const conn = resolveConnection(useConnectionsStore.getState().connections, str(p.connection))
      if (!conn) throw new Error('No matching saved connection. Use a name or id from the saved connections list.')
      const res = await useConnectionsStore.getState().connect(conn.id)
      if (!res.success) throw new Error(res.error ?? `Couldn't connect to "${conn.name}".`)
    }
  },
  {
    id: 'disconnect-database',
    title: 'Disconnect Database',
    description: 'Close the connection to a database, by name or id. Defaults to the active connection when none is given.',
    kind: 'navigation',
    params: { connection: { type: 'string', description: 'Saved connection name or id (defaults to the active one)' } },
    run: async (p) => {
      const state = useConnectionsStore.getState()
      const arg = str(p.connection)
      const conn = arg
        ? resolveConnection(state.connections, arg)
        : state.connections.find((c) => c.id === state.activeConnectionId)
      if (!conn) throw new Error('No connection to disconnect. Specify one by name or id.')
      await useConnectionsStore.getState().disconnect(conn.id)
    }
  },
  {
    id: 'switch-connection',
    title: 'Switch Active Connection',
    description: 'Make a saved connection the active one (connecting first if needed), by name or id. Subsequent queries and chat use this connection.',
    kind: 'navigation',
    params: { connection: { type: 'string', required: true, description: 'Saved connection name or id' } },
    run: async (p) => {
      const state = useConnectionsStore.getState()
      const conn = resolveConnection(state.connections, str(p.connection))
      if (!conn) throw new Error('No matching saved connection. Use a name or id from the saved connections list.')
      if (state.connectedIds.has(conn.id)) {
        state.setActiveConnection(conn.id)
      } else {
        const res = await useConnectionsStore.getState().connect(conn.id)
        if (!res.success) throw new Error(res.error ?? `Couldn't connect to "${conn.name}".`)
      }
    }
  },

  // ── Result actions ──────────────────────────────────────────────────────
  {
    id: 'export-results',
    title: 'Export Results',
    description: "Export the active query tab's current results to a file (csv or json). Opens a save dialog; data is written only to the file the user picks.",
    kind: 'navigation',
    params: { format: { type: 'string', description: 'csv or json (defaults to csv)' } },
    run: async (p) => {
      const format = (str(p.format) ?? 'csv').toLowerCase()
      if (format !== 'csv' && format !== 'json') throw new Error('Format must be "csv" or "json".')
      const results = activeQueryResults()
      if (!results) throw new Error('No query results to export. Run a query first.')
      const fields = results.fields.map((f) => f.name)
      await window.electronAPI.invoke(IPC_CHANNELS.EXPORT_QUERY_RESULT, results.rows, fields, format)
    }
  },
  {
    id: 'open-chart',
    title: 'Open Chart',
    description: 'Open the chart panel for the active query result set. Needs at least two columns and one row.',
    kind: 'navigation',
    run: () => {
      const results = activeQueryResults()
      if (!results) throw new Error('No query results to chart. Run a query first.')
      if (results.fields.length < 2 || results.rows.length === 0) {
        throw new Error('Need at least two columns and one row to chart these results.')
      }
      const ui = useUiStore.getState()
      if (!(ui.bottomDockActivePanel === 'chart' && ui.bottomDockVisible)) {
        ui.setBottomDockActivePanel('chart')
      }
    }
  },

  // ── Schema navigation ───────────────────────────────────────────────────
  {
    id: 'focus-table',
    title: 'Reveal Table in Explorer',
    description: 'Reveal a table (optionally a specific column) in the schema explorer for the active connection, expanding the tree and selecting it.',
    kind: 'navigation',
    params: {
      table: { type: 'string', required: true, description: 'Table name' },
      schema: { type: 'string', description: 'Schema name (defaults to the connection default)' },
      column: { type: 'string', description: 'Column to reveal under the table' }
    },
    run: async (p) => {
      const table = str(p.table)
      if (!table) throw new Error('Provide a table name.')
      const { activeConnectionId, connections, connectedIds } = useConnectionsStore.getState()
      const conn = connections.find((c) => c.id === activeConnectionId)
      if (!conn) throw new Error('No active connection. Connect to a database first.')
      if (!connectedIds.has(conn.id)) throw new Error(`Not connected to "${conn.name}". Connect first.`)
      const schema = await resolveSchema(conn, str(p.schema))
      const ui = useUiStore.getState()
      if (!(ui.activePanel === 'explorer' && ui.sidebarVisible)) ui.setActivePanel('explorer')
      // Expand the ancestor nodes so the table row renders. Cover both the
      // database-qualified and flat key shapes — an unused key is harmless.
      if (conn.database) {
        ui.expandTreeNode(`db:${conn.id}:${conn.database}`)
        ui.expandTreeNode(`schema:${conn.id}:${conn.database}:${schema}`)
      }
      ui.expandTreeNode(`schema:${conn.id}:${schema}`)
      if (str(p.column)) ui.expandTreeNode(`table:${conn.id}:${schema}:${table}`)
      useSelectionStore.getState().setSelection({ kind: 'table', connectionId: conn.id, schema, table })
    }
  },
  {
    id: 'open-er-diagram',
    title: 'Open ER Diagram',
    description: 'Open the entity-relationship diagram for the active connection. Optionally pass a table to select it in the diagram.',
    kind: 'navigation',
    params: {
      schema: { type: 'string', description: 'Schema name (defaults to the connection default)' },
      table: { type: 'string', description: 'Table to select/focus in the diagram' }
    },
    run: async (p) => {
      const { activeConnectionId, connections, connectedIds } = useConnectionsStore.getState()
      const conn = connections.find((c) => c.id === activeConnectionId)
      if (!conn) throw new Error('No active connection. Connect to a database first.')
      if (!connectedIds.has(conn.id)) throw new Error(`Not connected to "${conn.name}". Connect first, then open the ER diagram.`)
      const schema = (await resolveSchema(conn, str(p.schema))) || ''
      useTabsStore.getState().openErDiagram(conn.id, schema)
      const table = str(p.table)
      if (table) useSelectionStore.getState().setSelection({ kind: 'erNode', connectionId: conn.id, schema, table })
    }
  },

  // ── Plugins ─────────────────────────────────────────────────────────────
  {
    id: 'open-install-plugin',
    title: 'Install a Plugin',
    description: 'Open the plugin install screen. To enable or configure already-installed plugins instead, use open-settings with category "plugins".',
    kind: 'navigation',
    run: () => { useTabsStore.getState().openInstallPlugin() }
  }
]

let registered = false

/** Idempotently register the built-in app actions. Call once at startup. */
export function registerBuiltinAppActions(): void {
  if (registered) return
  registered = true
  for (const action of BUILTINS) appActions.register(action)
}
