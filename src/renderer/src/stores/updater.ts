import { create } from 'zustand'

/** A newer version reported by the one-shot launch check (see main's
 *  `runLaunchUpdateCheck`). Session-only — not persisted. */
export interface PendingUpdate {
  displayName: string
  currentVersion: string
  latestVersion: string
}

interface UpdaterState {
  /** The pending update, or null when up to date / not yet checked. */
  pending: PendingUpdate | null
  setPending: (pending: PendingUpdate | null) => void
}

/**
 * Holds the "an update is available" flag at app scope so the Settings →
 * Updates banner can show it regardless of whether Settings was open when the
 * launch check fired. Populated once by `useUpdateNotifier`.
 */
export const useUpdaterStore = create<UpdaterState>((set) => ({
  pending: null,
  setPending: (pending) => set({ pending }),
}))
