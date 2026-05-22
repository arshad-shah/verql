/** Distribution-channel identifier. Adding a new channel is a single line. */
export type UpdaterId = 'homebrew' | 'mas' | 'win-store' | 'snap' | 'apt' | 'dmg-direct'

export interface UpdateInfo {
  /** Version currently installed on disk. */
  currentVersion: string
  /** Latest version offered by the channel, or `null` if up-to-date / unknown. */
  latestVersion: string | null
  /** True when `latestVersion > currentVersion`. */
  available: boolean
}

export type UpdateProgress =
  | { phase: 'idle' }
  | { phase: 'checking' }
  | { phase: 'downloading'; percent?: number }
  | { phase: 'installing' }
  | { phase: 'done'; restartRequired: boolean }
  | { phase: 'error'; message: string }

/**
 * One channel = one Updater. Implementations should be self-contained: they
 * own their detection logic (`isAvailable`), their version check, and their
 * apply-update step. The registry picks the first available updater at boot
 * — adding a new channel never touches existing ones.
 */
export interface Updater {
  readonly id: UpdaterId
  readonly displayName: string

  /**
   * Returns true iff this updater can manage the currently-running install.
   * Must be cheap and side-effect free (called on every status query).
   */
  isAvailable(): Promise<boolean>

  /** Version of the running app. Usually `app.getVersion()`. */
  getCurrentVersion(): string

  /** Ask the channel for the latest available version. Network call. */
  checkForUpdate(): Promise<UpdateInfo>

  /**
   * Apply the update. May spawn an external process (e.g. `brew upgrade`) and
   * may require a manual app restart afterwards. Progress is reported via the
   * `onProgress` callback; the returned promise resolves once the install
   * step finishes (success or failure).
   */
  update(onProgress: (p: UpdateProgress) => void): Promise<void>
}
