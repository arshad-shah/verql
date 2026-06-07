import { IPC_EVENTS } from '@shared/ipc'
import { errorMessage } from '@shared/errors'
import { broadcast } from './broadcast'
import type { Handle } from './context'
import type { UpdaterRegistry } from '../updater'
import type { UpdateProgress } from '../updater/types'

export function registerUpdaterHandlers(handle: Handle, registry: UpdaterRegistry): void {
  handle('updater:status', async () => {
    const active = await registry.detectActive()
    if (!active) return { available: false as const }
    return {
      available: true as const,
      id: active.id as string,
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

    const sendProgress = (payload: UpdateProgress) => broadcast(IPC_EVENTS.UPDATER_PROGRESS, payload)

    // Fire-and-forget: long-running shell command. Progress is streamed via
    // the `updater:progress` event so the UI can show a spinner without
    // blocking the IPC reply.
    active.update(sendProgress).catch((err) => {
      sendProgress({ phase: 'error', message: errorMessage(err) })
    })

    return { started: true as const }
  })
}
