import { create } from 'zustand'
import type { AppSettings } from '@shared/settings'
import { defaultSettings, mergeWithDefaults } from '@shared/settings'

interface SettingsState {
  settings: AppSettings
  loaded: boolean
  hydrate: () => Promise<void>
  set: (keyPath: string, value: unknown) => Promise<void>
  resetCategory: (category: keyof AppSettings) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,
  loaded: false,

  hydrate: async () => {
    const settings = await window.electronAPI.invoke('settings:get-all') as AppSettings
    set({ settings: mergeWithDefaults(settings), loaded: true })
  },

  set: async (keyPath: string, value: unknown) => {
    // Optimistic update
    set((state) => {
      const newSettings = { ...state.settings }
      const parts = keyPath.split('.')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let target: any = newSettings
      for (let i = 0; i < parts.length - 1; i++) {
        target[parts[i]] = { ...target[parts[i]] }
        target = target[parts[i]]
      }
      target[parts[parts.length - 1]] = value
      return { settings: newSettings }
    })
    // Persist via IPC (guard for storybook/test environments)
    await window.electronAPI?.invoke('settings:set', keyPath, value)
  },

  resetCategory: async (category: keyof AppSettings) => {
    const updated = await window.electronAPI.invoke('settings:reset', category)
    set((state) => ({
      settings: { ...state.settings, [category]: updated },
    }))
  },
}))

// Listen for settings changes broadcast from main process
export function initSettingsListener(): () => void {
  return window.electronAPI.on('settings:changed', (keyPath: unknown, value: unknown) => {
    const store = useSettingsStore.getState()
    const parts = (keyPath as string).split('.')
    const newSettings = { ...store.settings }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let target: any = newSettings
    for (let i = 0; i < parts.length - 1; i++) {
      target[parts[i]] = { ...target[parts[i]] }
      target = target[parts[i]]
    }
    target[parts[parts.length - 1]] = value
    useSettingsStore.setState({ settings: newSettings })
  })
}
