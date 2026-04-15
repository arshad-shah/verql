import type { CompletionItem, CompletionContext } from '@shared/plugin-ui-types'
import type { Disposable } from './types'

export type CompletionProvider = (connectionId: string, context: CompletionContext) => Promise<CompletionItem[]>

export interface CompletionRegistry {
  register(provider: CompletionProvider): Disposable
}

export class CompletionRegistryImpl implements CompletionRegistry {
  private providers = new Map<string, CompletionProvider>()

  currentPluginName = ''

  register(provider: CompletionProvider): Disposable {
    const name = this.currentPluginName
    this.providers.set(name, provider)
    return { dispose: () => { this.providers.delete(name) } }
  }

  async getCompletions(pluginName: string, connectionId: string, context: CompletionContext): Promise<CompletionItem[]> {
    const provider = this.providers.get(pluginName)
    if (!provider) return []
    return provider(connectionId, context)
  }

  getProviderForPlugin(pluginName: string): CompletionProvider | undefined {
    return this.providers.get(pluginName)
  }

  clear(): void {
    this.providers.clear()
  }
}
