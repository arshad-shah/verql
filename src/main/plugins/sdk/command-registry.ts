// src/main/plugins/sdk/command-registry.ts
import type { Disposable, CommandRegistry } from './types'

export class CommandRegistryImpl implements CommandRegistry {
  private commands = new Map<string, (payload?: Record<string, unknown>) => void | Promise<void>>()

  register(id: string, handler: (payload?: Record<string, unknown>) => void | Promise<void>): Disposable {
    if (this.commands.has(id)) {
      throw new Error(`Command '${id}' is already registered`)
    }
    this.commands.set(id, handler)
    return { dispose: () => { this.commands.delete(id) } }
  }

  async execute(id: string, wrapper?: <T>(fn: () => T | Promise<T>) => Promise<T>, payload?: Record<string, unknown>): Promise<void> {
    const handler = this.commands.get(id)
    if (!handler) {
      throw new Error(`Command '${id}' not found`)
    }
    if (wrapper) {
      await wrapper(() => handler(payload))
    } else {
      await handler(payload)
    }
  }

  has(id: string): boolean {
    return this.commands.has(id)
  }

  getCommandIds(): string[] {
    return [...this.commands.keys()]
  }

  clear(): void {
    this.commands.clear()
  }
}
