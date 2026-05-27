import type { AppAction } from './types'

/**
 * Holds the catalog of {@link AppAction}s. Built-in actions are registered at
 * startup; plugins register their own so the AI can reference plugin surfaces
 * without any AI-side changes. Last-wins on duplicate ids.
 */
export class AppActionRegistry {
  private actions = new Map<string, AppAction>()
  private listeners = new Set<() => void>()

  register(action: AppAction): () => void {
    this.actions.set(action.id, action)
    this.emit()
    return () => {
      if (this.actions.delete(action.id)) this.emit()
    }
  }

  get(id: string): AppAction | undefined {
    return this.actions.get(id)
  }

  list(): AppAction[] {
    return [...this.actions.values()]
  }

  async run(id: string, params: Record<string, unknown> = {}): Promise<void> {
    const action = this.actions.get(id)
    if (!action) throw new Error(`Unknown app action: ${id}`)
    await action.run(params)
  }

  /** Catalog text appended to the AI system prompt. */
  describeForPrompt(): string {
    if (this.actions.size === 0) return ''
    const lines = this.list().map((a) => {
      const params = a.params
        ? Object.entries(a.params)
            .map(([k, p]) => `${k}${p.required ? '' : '?'}`)
            .join(', ')
        : ''
      // id is what goes in the verql://action/<id> href; title is the
      // human label the AI must use as the visible link text.
      return `- ${a.id}(${params}) [${a.kind}] — title "${a.title}": ${a.description}`
    })
    return lines.join('\n')
  }

  onChange(cb: () => void): () => void {
    this.listeners.add(cb)
    return () => { this.listeners.delete(cb) }
  }

  private emit(): void {
    for (const cb of this.listeners) cb()
  }
}

/** Process-wide singleton used by the renderer. */
export const appActions = new AppActionRegistry()
