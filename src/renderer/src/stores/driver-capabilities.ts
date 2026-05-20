import { create } from 'zustand'
import type { IpcChannelMap } from '@shared/ipc'

export type DriverCapabilities = NonNullable<IpcChannelMap['db:driver-capabilities']['return']>

interface DriverCapsState {
  /** Cache keyed by driver type ('postgresql', 'mongodb', …). `null` means
   *  "we asked the main process and the driver wasn't registered" — distinct
   *  from `undefined` which means "we haven't asked yet". */
  byType: Record<string, DriverCapabilities | null>
  inflight: Record<string, Promise<DriverCapabilities | null> | undefined>
  /** Fetch driver capabilities by type, with single-flight caching. The
   *  renderer NEVER branches on db type directly — it reads the capability
   *  flags returned here. */
  fetch: (type: string) => Promise<DriverCapabilities | null>
  /** Synchronous lookup — returns the cached value or undefined if it hasn't
   *  been fetched yet. Useful in render paths that have already pre-fetched. */
  get: (type: string) => DriverCapabilities | null | undefined
}

export const useDriverCapabilitiesStore = create<DriverCapsState>((set, get) => ({
  byType: {},
  inflight: {},

  get(type: string) {
    return get().byType[type]
  },

  async fetch(type: string) {
    const cached = get().byType[type]
    if (cached !== undefined) return cached
    const inflight = get().inflight[type]
    if (inflight) return inflight
    const p = window.electronAPI
      .invoke('db:driver-capabilities', type)
      .then((caps) => {
        set((s) => ({
          byType: { ...s.byType, [type]: caps },
          inflight: { ...s.inflight, [type]: undefined }
        }))
        return caps
      })
      .catch((err) => {
        set((s) => ({ inflight: { ...s.inflight, [type]: undefined } }))
        throw err
      })
    set((s) => ({ inflight: { ...s.inflight, [type]: p } }))
    return p
  }
}))
