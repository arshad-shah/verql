// src/main/plugins/sdk/command-registry.ts
import type { Disposable, CommandRegistry } from './types'

export class CommandRegistryImpl implements CommandRegistry {
  private commands = new Map<string, () => void | Promise<void>>()

  register(id: string, handler: () => void | Promise<void>): Disposable {
    if (this.commands.has(id)) {
      throw new Error(`Command '${id}' is already registered`)
    }
    this.commands.set(id, handler)
    return { dispose: () => { this.commands.delete(id) } }
  }

  async execute(id: string, wrapper?: <T>(fn: () => T | Promise<T>) => Promise<T>): Promise<void> {
    const handler = this.commands.get(id)
    if (!handler) {
      throw new Error(`Command '${id}' not found`)
    }
    if (wrapper) {
      await wrapper(handler)
    } else {
      await handler()
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
