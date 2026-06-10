import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type { IpcChannelMap } from '@shared/ipc'

const electronAPI = {
  /** Host OS, so the renderer can lay out the title bar / window controls to
   *  match each platform's conventions without an extra IPC round-trip. */
  platform: process.platform,

  invoke: <K extends keyof IpcChannelMap>(
    channel: K,
    ...args: IpcChannelMap[K]['args']
  ): Promise<IpcChannelMap[K]['return']> =>
    ipcRenderer.invoke(channel, ...args),

  on: (channel: string, callback: (...args: unknown[]) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => callback(...args)
    ipcRenderer.on(channel, listener)
    return () => { ipcRenderer.removeListener(channel, listener) }
  },

  /** Resolve a `File` (from a browser file picker or drag-drop) to its absolute
   *  on-disk path. Electron 32+ removed `File.path`; `webUtils.getPathForFile`
   *  is the supported replacement. Returns `''` for files with no backing path
   *  (e.g. ones synthesized in the renderer). */
  getPathForFile: (file: File): string => webUtils.getPathForFile(file)
}

export type ElectronAPI = typeof electronAPI

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
