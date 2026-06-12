import { dialog } from 'electron'
import { IPC_CHANNELS } from '@shared/ipc'
import fs from 'fs'
import path from 'path'
import type { Handle } from './context'

export function registerDialogHandlers(handle: Handle): void {
  handle(IPC_CHANNELS.DIALOG_OPEN_FILE, async (options) => {
    const { filePaths, canceled } = await dialog.showOpenDialog({
      title: options?.title ?? 'Open File',
      filters: options?.filters ?? [{ name: 'All Files', extensions: ['*'] }],
      properties: ['openFile']
    })
    if (canceled || filePaths.length === 0) return { cancelled: true as const }

    const fullPath = filePaths[0]
    const content = fs.readFileSync(fullPath, 'utf-8')
    return { filePath: path.basename(fullPath), content }
  })

  handle(IPC_CHANNELS.DIALOG_OPEN_FILE_PATH, async (options) => {
    const { filePaths, canceled } = await dialog.showOpenDialog({
      title: options?.title ?? 'Select File',
      filters: options?.filters ?? [{ name: 'All Files', extensions: ['*'] }],
      properties: ['openFile']
    })
    if (canceled || filePaths.length === 0) return { cancelled: true as const }
    return { filePath: filePaths[0] }
  })
}
