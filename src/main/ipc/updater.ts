import { BrowserWindow } from 'electron'
import type { Handle } from './context'
import type { UpdaterRegistry } from '../updater'
import type { UpdateProgress } from '../updater/types'

export function registerUpdaterHandlers(handle: Handle, registry: UpdaterRegistry): void {
  handle('updater:status', async () => {
    const active = await registry.detectActive()
    if (!active) return { available: false }
    return {
      available: true,
      id: active.id,
      displayName: active.displayName,
      currentVersion: active.getCurrentVersion(),
    }
  })

  handle('updater:check', async () => {
    const active = await registry.detectActive()
    if (!active) {
      return { supported: false as const }
    }
    const info = await active.checkForUpdate()
    return { supported: true as const, ...info }
  })

  handle('updater:update', async () => {
    const active = await registry.detectActive()
    if (!active) {
      return { started: false as const, reason: 'no-updater' as const }
    }

    const broadcast = (payload: UpdateProgress) => {
      for (const win of BrowserWindow.getAllWindows()) {
        if (!win.isDestroyed()) win.webContents.send('updater:progress', payload)
      }
    }

    // Fire-and-forget: long-running shell command. Progress is streamed via
    // the `updater:progress` event so the UI can show a spinner without
    // blocking the IPC reply.
    active.update(broadcast).catch((err) => {
      broadcast({ phase: 'error', message: err instanceof Error ? err.message : String(err) })
    })

    return { started: true as const }
  })
}
