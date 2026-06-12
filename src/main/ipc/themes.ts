import type { Handle } from './context'
import { IPC_CHANNELS } from '@shared/ipc'
import type { ThemeRegistry, RegisteredTheme } from '../plugins/sdk/theme-registry'

export interface ThemesHandlerDeps {
  themeRegistry: ThemeRegistry
}

/** Serialisable view of a registered theme for the renderer. */
export interface SerializedTheme {
  id: string
  name: string
  type: 'dark' | 'light'
  tokens?: Record<string, string>
  css?: string
  monaco?: RegisteredTheme['monaco']
  preview?: RegisteredTheme['preview']
  source?: string
  validation?: RegisteredTheme['validation']
}

export function registerThemesHandlers(handle: Handle, deps: ThemesHandlerDeps): void {
  const { themeRegistry } = deps

  handle(IPC_CHANNELS.THEMES_LIST, async (): Promise<SerializedTheme[]> => {
    return themeRegistry.getAll().map((t) => ({
      id: t.id,
      name: t.name,
      type: t.type,
      tokens: t.tokens,
      css: t.css,
      monaco: t.monaco,
      preview: t.preview,
      source: t.source,
      validation: t.validation,
    }))
  })
}
