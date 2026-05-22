import { create } from 'zustand'
import { IPC_CHANNELS, IPC_EVENTS } from '@shared/ipc'

export interface PluginCommand {
  pluginId: string
  pluginDisplayName: string
  commandId: string
  title: string
  keybinding?: string
}

interface PluginCommandsState {
  commands: PluginCommand[]
  loaded: boolean
  fetch: () => Promise<void>
  execute: (pluginId: string, commandId: string) => Promise<void>
}

export const usePluginCommands = create<PluginCommandsState>((set) => ({
  commands: [],
  loaded: false,
  fetch: async () => {
    if (typeof window === 'undefined' || !window.electronAPI) {
      set({ loaded: true })
      return
    }
    try {
      const list = await window.electronAPI.invoke(IPC_CHANNELS.PLUGINS_GET_COMMANDS)
      set({ commands: list as PluginCommand[], loaded: true })
    } catch {
      set({ loaded: true })
    }
  },
  execute: async (pluginId, commandId) => {
    await window.electronAPI.invoke(IPC_CHANNELS.PLUGINS_UI_ACTION, pluginId, commandId, {})
  }
}))

if (typeof window !== 'undefined' && window.electronAPI) {
  // Lifecycle changes (activate/deactivate/install/uninstall) can shift the
  // command list; refetch so the palette + keybinding listener stay current.
  window.electronAPI.on(IPC_EVENTS.PLUGINS_LIFECYCLE, () => {
    usePluginCommands.getState().fetch()
  })
}
