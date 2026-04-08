import { describe, it, expect, vi } from 'vitest'
import { DriverRegistryImpl } from '../../src/main/plugins/sdk/driver-registry'
import type { DriverFactory, ConnectionMiddleware } from '../../src/main/plugins/sdk/types'
import type { DbAdapter } from '../../src/main/db/adapter'

function makeStubFactory(): DriverFactory {
  return {
    createAdapter: () => ({} as DbAdapter),
    connectionFields: [
      { key: 'host', label: 'Host', type: 'text' as const, required: true }
    ]
  }
}

function makeStubMiddleware(): ConnectionMiddleware {
  return {
    shouldApply: () => true,
    beforeConnect: async (profile) => profile,
    onDisconnect: async () => {}
  }
}

describe('DriverRegistryImpl', () => {
  it('registers and retrieves a driver factory', () => {
    const registry = new DriverRegistryImpl()
    const factory = makeStubFactory()
    registry.register('mongodb', factory)
    expect(registry.get('mongodb')).toBe(factory)
  })

  it('returns undefined for unregistered driver', () => {
    const registry = new DriverRegistryImpl()
    expect(registry.get('nonexistent')).toBeUndefined()
  })

  it('throws on duplicate driver id', () => {
    const registry = new DriverRegistryImpl()
    registry.register('redis', makeStubFactory())
    expect(() => registry.register('redis', makeStubFactory())).toThrow(/already registered/)
  })

  it('disposes a driver registration', () => {
    const registry = new DriverRegistryImpl()
    const disposable = registry.register('mongodb', makeStubFactory())
    disposable.dispose()
    expect(registry.get('mongodb')).toBeUndefined()
  })

  it('has() returns true for registered driver', () => {
    const registry = new DriverRegistryImpl()
    registry.register('mongodb', makeStubFactory())
    expect(registry.has('mongodb')).toBe(true)
  })

  it('has() returns false for unregistered driver', () => {
    const registry = new DriverRegistryImpl()
    expect(registry.has('mongodb')).toBe(false)
  })

  it('lists all registered driver ids', () => {
    const registry = new DriverRegistryImpl()
    registry.register('mongodb', makeStubFactory())
    registry.register('redis', makeStubFactory())
    expect(registry.getDriverIds()).toEqual(['mongodb', 'redis'])
  })

  it('registers and retrieves connection middleware', () => {
    const registry = new DriverRegistryImpl()
    const mw = makeStubMiddleware()
    registry.registerConnectionMiddleware('ssh-tunnel', mw)
    expect(registry.getMiddlewares()).toHaveLength(1)
    expect(registry.getMiddlewares()[0].middleware).toBe(mw)
  })

  it('throws on duplicate middleware id', () => {
    const registry = new DriverRegistryImpl()
    registry.registerConnectionMiddleware('ssh', makeStubMiddleware())
    expect(() => registry.registerConnectionMiddleware('ssh', makeStubMiddleware())).toThrow(/already registered/)
  })

  it('disposes a middleware registration', () => {
    const registry = new DriverRegistryImpl()
    const disposable = registry.registerConnectionMiddleware('ssh', makeStubMiddleware())
    disposable.dispose()
    expect(registry.getMiddlewares()).toHaveLength(0)
  })

  it('hasMiddleware() returns correct values', () => {
    const registry = new DriverRegistryImpl()
    expect(registry.hasMiddleware('ssh')).toBe(false)
    registry.registerConnectionMiddleware('ssh', makeStubMiddleware())
    expect(registry.hasMiddleware('ssh')).toBe(true)
  })

  it('clear() removes all registrations', () => {
    const registry = new DriverRegistryImpl()
    registry.register('mongodb', makeStubFactory())
    registry.registerConnectionMiddleware('ssh', makeStubMiddleware())
    registry.clear()
    expect(registry.getDriverIds()).toEqual([])
    expect(registry.getMiddlewares()).toHaveLength(0)
  })
})
