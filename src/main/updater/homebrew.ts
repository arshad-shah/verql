import { spawn } from 'child_process'
import type { Updater, UpdateInfo, UpdateProgress } from './types'

/**
 * Homebrew cask updater. Detects "is this install managed by brew?" by
 * checking that the `brew` binary exists AND that `brew list --cask <cask>`
 * succeeds. Both conditions are required: a developer who has brew installed
 * but is running the app from `pnpm dev` or a downloaded `.app` should NOT
 * see a Homebrew update prompt that would clobber their build.
 *
 * Adding more package managers (snap, apt, mas, winget): copy this file,
 * swap the binary + commands, register in `src/main/updater/index.ts`. No
 * other changes required.
 */
export class HomebrewUpdater implements Updater {
  readonly id = 'homebrew' as const
  readonly displayName = 'Homebrew'

  constructor(
    private readonly cask: string,
    private readonly currentVersion: string,
  ) {}

  async isAvailable(): Promise<boolean> {
    // Mac/Linux only. brew on WSL exists but we don't ship there.
    if (process.platform !== 'darwin' && process.platform !== 'linux') return false
    const brewExists = await run('brew', ['--version']).then(r => r.code === 0).catch(() => false)
    if (!brewExists) return false
    const listed = await run('brew', ['list', '--cask', this.cask]).then(r => r.code === 0).catch(() => false)
    return listed
  }

  getCurrentVersion(): string {
    return this.currentVersion
  }

  async checkForUpdate(): Promise<UpdateInfo> {
    // `brew outdated --cask --json=v2 <cask>` returns structured info and is
    // stable across recent brew versions. Empty `casks` array = up to date.
    const { stdout, code } = await run('brew', ['outdated', '--cask', '--greedy', '--json=v2', this.cask])
    if (code !== 0) {
      // Non-zero often just means "not installed by brew anymore". Treat as
      // no-update rather than throwing — the UI can't act on a hard error.
      return { currentVersion: this.currentVersion, latestVersion: null, available: false }
    }
    try {
      const parsed = JSON.parse(stdout) as {
        casks?: { name: string; installed_versions?: string[]; current_version?: string }[]
      }
      const entry = parsed.casks?.find(c => c.name === this.cask)
      if (!entry) {
        return { currentVersion: this.currentVersion, latestVersion: null, available: false }
      }
      const latest = entry.current_version ?? null
      return {
        currentVersion: this.currentVersion,
        latestVersion: latest,
        available: latest !== null && latest !== this.currentVersion,
      }
    } catch {
      return { currentVersion: this.currentVersion, latestVersion: null, available: false }
    }
  }

  async update(onProgress: (p: UpdateProgress) => void): Promise<void> {
    onProgress({ phase: 'downloading' })
    const { code, stderr } = await run('brew', ['upgrade', '--cask', this.cask])
    if (code !== 0) {
      onProgress({ phase: 'error', message: stderr.trim() || `brew exited with code ${code}` })
      return
    }
    // brew replaces the .app bundle in-place. The running instance must
    // restart to pick up the new binary.
    onProgress({ phase: 'done', restartRequired: true })
  }
}

interface RunResult { code: number; stdout: string; stderr: string }

function run(cmd: string, args: string[]): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { env: process.env })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => { stdout += d.toString() })
    child.stderr.on('data', (d) => { stderr += d.toString() })
    child.on('error', () => resolve({ code: -1, stdout, stderr }))
    child.on('close', (code) => resolve({ code: code ?? -1, stdout, stderr }))
  })
}
