import { useUiStore, type SettingsCategoryId, type SecondaryPanelId } from '@/stores/ui'
import { useTabsStore } from '@/stores/tabs'
import { useConnectionsStore } from '@/stores/connections'
import { useSchemaStore } from '@/stores/schema'
import { useDriverCapabilitiesStore } from '@/stores/driver-capabilities'
import { pickDefaultSchema } from '@/lib/pick-default-schema'
import { initialAutoCommit } from '@/lib/initial-autocommit'
import { appActions } from './registry'
import type { AppAction } from './types'

const str = (v: unknown): string | undefined => (typeof v === 'string' && v ? v : undefined)

/**
 * Built-in app actions, wired to the same store calls the command palette uses.
 * Registered once at startup. Plugins add their own via `appActions.register`.
 */
const BUILTINS: AppAction[] = [
  {
    id: 'open-settings',
    title: 'Open Settings',
    description: 'Open the settings screen, optionally at a category (general, appearance, editor, connections, data-display, keybindings, ai, mcp, plugins).',
    kind: 'navigation',
    params: { category: { type: 'string', description: 'Settings category id' } },
    run: (p) => {
      useUiStore.getState().setActivePanel('settings')
      const category = str(p.category)
      if (category) useUiStore.getState().setActiveSettingsCategory(category as SettingsCategoryId)
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
    id: 'new-query-tab',
    title: 'Open Query Tab',
    description: 'Open a new SQL query tab, optionally pre-filled with a query. Nothing runs until the user executes it.',
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
    id: 'open-er-diagram',
    title: 'Open ER Diagram',
    description: 'Open the entity-relationship diagram for the active connection.',
    kind: 'navigation',
    params: { schema: { type: 'string', description: 'Schema name (defaults to the connection default)' } },
    run: async (p) => {
      const { activeConnectionId, connections, connectedIds } = useConnectionsStore.getState()
      const conn = connections.find((c) => c.id === activeConnectionId)
      if (!conn) throw new Error('No active connection. Connect to a database first.')
      if (!connectedIds.has(conn.id)) throw new Error(`Not connected to "${conn.name}". Connect first, then open the ER diagram.`)
      let schema = str(p.schema)
      if (!schema) {
        const schemas = await useSchemaStore.getState().fetchSchemas(conn.id, conn.database)
        const caps = await useDriverCapabilitiesStore.getState().fetch(conn.type)
        schema = pickDefaultSchema(caps ?? {}, schemas, conn.database) ?? ''
      }
      useTabsStore.getState().openErDiagram(conn.id, schema)
    }
  }
]

let registered = false

/** Idempotently register the built-in app actions. Call once at startup. */
export function registerBuiltinAppActions(): void {
  if (registered) return
  registered = true
  for (const action of BUILTINS) appActions.register(action)
}
