import { BrowserWindow } from 'electron'
import type { AppSettings } from '@shared/settings'
import type { IpcContext, Handle } from './context'
import { redactAi, redactSettings } from './secrets'

export function registerSettingsHandlers(ctx: IpcContext, handle: Handle): void {
  handle('settings:get-all', async () => {
    return redactSettings(ctx.configStore.getAllSettings())
  })

  handle('settings:get', async (category) => {
    const value = ctx.configStore.getSettingsCategory(category as keyof AppSettings)
    return category === 'ai' ? redactAi(value as Record<string, unknown>) : value
  })

  handle('settings:set', async (keyPath, value) => {
    // Legacy callers writing AI keys via settings:set route into the keyring.
    if (keyPath === 'ai.openaiKey' || keyPath === 'ai.anthropicKey') {
      const provider = keyPath === 'ai.openaiKey' ? 'openai' : 'anthropic'
      ctx.keyring.storeSync('__ai__', provider, String(value ?? ''))
      return
    }
    ctx.configStore.setSetting(keyPath as string, value)
    const mainWindow = BrowserWindow.getAllWindows()[0]
    mainWindow?.webContents.send('settings:changed', keyPath, value)
  })

  handle('settings:reset', async (category) => {
    ctx.configStore.resetCategory(category as keyof AppSettings)
    const updated = ctx.configStore.getSettingsCategory(category as keyof AppSettings)
    const mainWindow = BrowserWindow.getAllWindows()[0]
    mainWindow?.webContents.send('settings:changed', category, updated)
    return updated
  })
}
