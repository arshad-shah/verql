import type { Updater } from './types'

/**
 * Holds every registered updater in priority order and picks the first one
 * whose `isAvailable()` returns true. Registration order matters — register
 * the most-specific channels first (e.g. mas before dmg-direct on macOS).
 *
 * `detectActive()` is cached for the lifetime of the process: an install's
 * channel doesn't change at runtime, and the check shells out to slow tools
 * like `brew`. Call `invalidate()` after operations that could move the app
 * between channels (rare; manual reinstall).
 */
export class UpdaterRegistry {
  private updaters: Updater[] = []
  private cachedActive: Updater | null | undefined

  register(updater: Updater): void {
    this.updaters.push(updater)
    this.cachedActive = undefined
  }

  list(): readonly Updater[] {
    return this.updaters
  }

  async detectActive(): Promise<Updater | null> {
    if (this.cachedActive !== undefined) return this.cachedActive
    for (const u of this.updaters) {
      try {
        if (await u.isAvailable()) {
          this.cachedActive = u
          return u
        }
      } catch {
        // A broken updater must never block the rest.
      }
    }
    this.cachedActive = null
    return null
  }

  invalidate(): void {
    this.cachedActive = undefined
  }
}
