import { useEffect } from 'react'
import { IPC_EVENTS } from '@shared/ipc'
import { useUiStore } from '@/stores/ui'
import { useConnectionsStore } from '@/stores/connections'
import { initialAutoCommit } from '@/lib/initial-autocommit'
import type { useTabsStore } from '@/stores/tabs'

type AddQueryTab = ReturnType<typeof useTabsStore.getState>['addQueryTab']

interface Options {
  activeConnectionId: string | null
  addQueryTab: AddQueryTab
  openConnectionForm: () => void
}

/** Subscribes to native application-menu commands (New Query Tab, New
 *  Connection, Toggle Command Palette) and the status bar's new-connection
 *  shortcut, translating each into the matching renderer action. */
export function useShellMenuEvents({ activeConnectionId, addQueryTab, openConnectionForm }: Options): void {
  useEffect(() => {
    const cleanups = [
      window.electronAPI.on(IPC_EVENTS.MENU_NEW_QUERY_TAB, () => {
        const activeProfile = useConnectionsStore.getState().connections.find(c => c.id === activeConnectionId) ?? null
        addQueryTab(activeConnectionId, null, { autoCommit: initialAutoCommit(activeProfile) })
      }),
      window.electronAPI.on(IPC_EVENTS.MENU_NEW_CONNECTION, () => openConnectionForm()),
      window.electronAPI.on(IPC_EVENTS.MENU_TOGGLE_COMMAND_PALETTE, () => useUiStore.getState().toggleCommandPalette()),
    ]

    const handleStatusBarNewConn = () => openConnectionForm()
    window.addEventListener('statusbar:new-connection', handleStatusBarNewConn)

    return () => {
      window.removeEventListener('statusbar:new-connection', handleStatusBarNewConn)
      cleanups.forEach(cleanup => cleanup())
    }
  }, [activeConnectionId, addQueryTab, openConnectionForm])
}
