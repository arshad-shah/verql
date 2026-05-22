import { app } from 'electron'
import { UpdaterRegistry } from './registry'
import { HomebrewUpdater } from './homebrew'

export { UpdaterRegistry } from './registry'
export type { Updater, UpdateInfo, UpdateProgress, UpdaterId } from './types'

/**
 * Build the registry with every channel we ship. Order = priority: the first
 * `isAvailable()` that returns true wins. Future channels (mas, win-store,
 * snap, apt) plug in here without touching the registry or IPC layer.
 */
export function createUpdaterRegistry(): UpdaterRegistry {
  const registry = new UpdaterRegistry()
  const version = app.getVersion()

  // Cask name matches the Homebrew tap entry — keep these in sync.
  registry.register(new HomebrewUpdater('verql', version))

  return registry
}
