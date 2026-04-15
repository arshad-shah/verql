import type { AIProvider } from './types'

export class AIProviderRegistry {
  private providers = new Map<string, AIProvider>()
  private activeId: string | null = null
  private activeModelId: string | null = null

  register(provider: AIProvider): void {
    this.providers.set(provider.id, provider)
  }

  unregister(id: string): void {
    this.providers.delete(id)
    if (this.activeId === id) this.activeId = null
  }

  get(id: string): AIProvider | undefined {
    return this.providers.get(id)
  }

  list(): AIProvider[] {
    return [...this.providers.values()]
  }

  setActive(id: string): void {
    if (!this.providers.has(id)) throw new Error(`Unknown AI provider: ${id}`)
    this.activeId = id
  }

  getActive(): AIProvider | null {
    if (!this.activeId) return null
    return this.providers.get(this.activeId) ?? null
  }

  setActiveModel(modelId: string): void {
    this.activeModelId = modelId
  }

  getActiveModel(): string | null {
    return this.activeModelId
  }
}
