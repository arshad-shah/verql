// src/main/plugins/sdk/service-registry.ts
import type { Disposable } from './types'

/**
 * Generic publish/subscribe for cross-plugin services.
 *
 * A plugin that wants to expose functionality to other plugins calls
 * `provide('id', impl)`. Other plugins call `consume('id')` to grab it,
 * or `onAvailable('id', cb)` to be notified when it shows up later
 * (useful when activation order isn't guaranteed).
 */
export interface ServiceRegistry {
  provide<T>(serviceId: string, impl: T): Disposable
  consume<T>(serviceId: string): T | null
  onAvailable<T>(serviceId: string, cb: (impl: T) => void): Disposable
}

export class ServiceRegistryImpl implements ServiceRegistry {
  private services = new Map<string, unknown>()
  private listeners = new Map<string, Array<(impl: unknown) => void>>()

  provide<T>(serviceId: string, impl: T): Disposable {
    this.services.set(serviceId, impl)
    const waiting = this.listeners.get(serviceId)
    if (waiting) {
      for (const cb of waiting) {
        try { cb(impl) } catch { /* ignore listener errors */ }
      }
      this.listeners.delete(serviceId)
    }
    return {
      dispose: () => {
        if (this.services.get(serviceId) === impl) this.services.delete(serviceId)
      }
    }
  }

  consume<T>(serviceId: string): T | null {
    return (this.services.get(serviceId) as T | undefined) ?? null
  }

  onAvailable<T>(serviceId: string, cb: (impl: T) => void): Disposable {
    const existing = this.services.get(serviceId) as T | undefined
    if (existing !== undefined) {
      try { cb(existing) } catch { /* ignore */ }
      return { dispose: () => {} }
    }
    const list = this.listeners.get(serviceId) ?? []
    const wrapped = cb as (impl: unknown) => void
    list.push(wrapped)
    this.listeners.set(serviceId, list)
    return {
      dispose: () => {
        const arr = this.listeners.get(serviceId)
        if (!arr) return
        const idx = arr.indexOf(wrapped)
        if (idx >= 0) arr.splice(idx, 1)
      }
    }
  }
}
