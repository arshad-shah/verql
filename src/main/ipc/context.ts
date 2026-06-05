import { ipcMain } from 'electron'
import type { IpcChannelMap } from '@shared/ipc'
import type { DbAdapter } from '../db/adapter'
import type { ConfigStore } from '../config/store'
import type { KeyringService } from '../keyring'
import type { AppDataStore } from '../appdata/store'
import type { DriverRegistryImpl } from '../plugins/sdk/driver-registry'

export interface IpcContext {
  configStore: ConfigStore
  keyring: KeyringService
  appData: AppDataStore
  driverRegistry: DriverRegistryImpl
  activeAdapters: Map<string, DbAdapter>
}

export type Handle = <K extends keyof IpcChannelMap>(
  channel: K,
  handler: (...args: IpcChannelMap[K]['args']) => IpcChannelMap[K]['return'] | Promise<IpcChannelMap[K]['return']>
) => void

export const handle: Handle = (channel, handler) => {
  ipcMain.handle(channel, (_event, ...args) =>
    handler(...(args as Parameters<typeof handler>))
  )
}
