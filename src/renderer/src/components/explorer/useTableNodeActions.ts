import { useEffect } from 'react'
import { useSchemaStore } from '@/stores/schema'
import { useTabsStore } from '@/stores/tabs'
import { useConnectionsStore } from '@/stores/connections'
import { useDriverCapabilitiesStore } from '@/stores/driver-capabilities'
import { useToastStore } from '@/stores/toast'
import { initialAutoCommit } from '@/lib/initial-autocommit'
import { usePluginContextMenuItems } from '@/components/plugin-ui/usePluginContextMenu'
import { IPC_CHANNELS } from '@shared/ipc'
import { useTranslation } from '@/i18n/I18nProvider'

interface MenuItem {
  label: string
  onSelect: () => void
}

export interface TableNodeActions {
  /** Whether the driver exposes a data reader (browse grid available). */
  canViewData: boolean
  openData: () => void
  openInQueryTab: () => Promise<void>
  copyTableName: () => void
  copySampleQuery: () => Promise<void>
  /** Context-menu items (view/open/copy/export + plugin contributions). */
  menuItems: MenuItem[]
}

/** Owns a table tree-node's data actions: open the browse grid, open a sample
 *  query in a new tab, copy the name / sample query, and assemble the
 *  context-menu items (including capability gating and plugin contributions). */
export function useTableNodeActions(
  connectionId: string,
  tableName: string,
  schema: string,
  onExportTable?: (tableName: string) => void
): TableNodeActions {
  const { t } = useTranslation()
  const addQueryTab = useTabsStore((s) => s.addQueryTab)
  const updateTabSql = useTabsStore((s) => s.updateTabSql)
  const addToast = useToastStore((s) => s.addToast)
  const pluginTableItems = usePluginContextMenuItems('table')
  const profile = useConnectionsStore((s) => s.connections.find(c => c.id === connectionId) ?? null)
  const openTableData = useTabsStore((s) => s.openTableData)

  // Capability-gated: any driver that provides a data reader (Redis/Mongo, and
  // the relational drivers) can render the browse grid — no db-type branching.
  const caps = useDriverCapabilitiesStore((s) => profile ? s.resolveCapabilities(connectionId, profile.type) : null)
  const canViewData = Boolean(caps?.hasGetTableData)
  useEffect(() => { if (profile?.type) void useDriverCapabilitiesStore.getState().fetch(profile.type) }, [profile?.type])

  const openData = () => { openTableData(connectionId, tableName, schema) }

  async function getSampleQuery(): Promise<string> {
    try {
      return await window.electronAPI.invoke(IPC_CHANNELS.DB_SAMPLE_QUERY, connectionId, tableName, schema) as string
    } catch {
      return `SELECT * FROM ${tableName} LIMIT 100;`
    }
  }

  async function openInQueryTab() {
    const query = await getSampleQuery()
    const tabId = addQueryTab(connectionId, schema, { autoCommit: initialAutoCommit(profile) })
    updateTabSql(tabId, query)
  }

  function copyTableName() {
    navigator.clipboard.writeText(tableName).then(() => {
      addToast({ type: 'success', title: t('explorer.toast.copiedTableName') })
    })
  }

  async function copySampleQuery() {
    const query = await getSampleQuery()
    navigator.clipboard.writeText(query).then(() => {
      addToast({ type: 'success', title: t('explorer.toast.copiedSampleQuery') })
    })
  }

  const menuItems: MenuItem[] = [
    ...(canViewData
      ? [{ label: t('explorer.menu.viewData'), onSelect: openData }]
      : []),
    {
      label: t('explorer.menu.openInQueryTab'),
      onSelect: openInQueryTab,
    },
    {
      label: t('explorer.menu.copyTableName'),
      onSelect: copyTableName,
    },
    {
      label: t('explorer.menu.copySampleQuery'),
      onSelect: copySampleQuery,
    },
    ...(onExportTable
      ? [
          {
            label: t('explorer.menu.exportTable'),
            onSelect: () => onExportTable(tableName),
          },
        ]
      : []),
    ...pluginTableItems,
  ]

  return { canViewData, openData, openInQueryTab, copyTableName, copySampleQuery, menuItems }
}
