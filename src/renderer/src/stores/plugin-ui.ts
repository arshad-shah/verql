import { create } from 'zustand'
import type { UIContribution, ContributionSurface } from '@shared/plugin-ui-types'

interface ResolverCache {
  [key: string]: { value: string; label: string }[] | undefined
}

interface PluginUIState {
  contributions: Record<string, UIContribution[]>
  resolverCache: ResolverCache
  fetchContributions: (surface: ContributionSurface) => Promise<void>
  resolveOptions: (pluginId: string, resolverId: string, connectionId: string) => Promise<{ value: string; label: string }[]>
  executeAction: (pluginId: string, commandId: string, payload: Record<string, unknown>) => Promise<void>
  invalidateResolver: (resolverId: string, connectionId: string) => void
  invalidateAll: () => void
}

export const usePluginUIStore = create<PluginUIState>((set, get) => ({
  contributions: {},
  resolverCache: {},

  fetchContributions: async (surface) => {
    const result = await window.electronAPI.invoke('plugins:ui:get-contributions', surface)
    set((state) => ({
      contributions: { ...state.contributions, [surface]: result }
    }))
  },

  resolveOptions: async (pluginId, resolverId, connectionId) => {
    const cacheKey = `${resolverId}:${connectionId}`
    const cached = get().resolverCache[cacheKey]
    if (cached) return cached

    const result = await window.electronAPI.invoke('plugins:ui:resolve', pluginId, resolverId, { connectionId })
    set((state) => ({
      resolverCache: { ...state.resolverCache, [cacheKey]: result }
    }))
    return result
  },

  executeAction: async (pluginId, commandId, payload) => {
    await window.electronAPI.invoke('plugins:ui:action', pluginId, commandId, payload)
  },

  invalidateResolver: (resolverId, connectionId) => {
    const cacheKey = `${resolverId}:${connectionId}`
    set((state) => {
      const next = { ...state.resolverCache }
      delete next[cacheKey]
      return { resolverCache: next }
    })
  },

  invalidateAll: () => {
    set({ resolverCache: {}, contributions: {} })
  },
}))

// Listen for contribution changes from main process
if (typeof window !== 'undefined' && window.electronAPI) {
  window.electronAPI.on('plugins:ui:contributions-changed', () => {
    const store = usePluginUIStore.getState()
    store.invalidateAll()
  })
}
