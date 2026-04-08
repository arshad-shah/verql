import type { PluginSettings, Disposable } from './types'

interface SettingsStore {
  get(key: string): unknown
  set(key: string, value: unknown): void
}

export class PluginSettingsImpl implements PluginSettings {
  private listeners = new Map<string, Set<(value: unknown) => void>>()

  constructor(
    private pluginName: string,
    private store: SettingsStore
  ) {}

  private scopedKey(key: string): string {
    return `plugins.${this.pluginName}.${key}`
  }

  get<T>(key: string): T | undefined {
    return this.store.get(this.scopedKey(key)) as T | undefined
  }

  set(key: string, value: unknown): void {
    this.store.set(this.scopedKey(key), value)
    const keyListeners = this.listeners.get(key)
    if (keyListeners) {
      for (const listener of keyListeners) {
        listener(value)
      }
    }
  }

  onChanged(key: string, listener: (value: unknown) => void): Disposable {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }
    this.listeners.get(key)!.add(listener)
    return {
      dispose: () => { this.listeners.get(key)?.delete(listener) }
    }
  }
}
