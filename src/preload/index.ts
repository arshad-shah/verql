import { contextBridge, ipcRenderer } from 'electron'
import type { IpcChannelMap } from '@shared/ipc'

const electronAPI = {
  invoke: <K extends keyof IpcChannelMap>(
    channel: K,
    ...args: IpcChannelMap[K]['args']
  ): Promise<IpcChannelMap[K]['return']> =>
    ipcRenderer.invoke(channel, ...args),

  on: (channel: string, callback: (...args: unknown[]) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => callback(...args)
    ipcRenderer.on(channel, listener)
    return () => { ipcRenderer.removeListener(channel, listener) }
  }
}

export type ElectronAPI = typeof electronAPI

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
