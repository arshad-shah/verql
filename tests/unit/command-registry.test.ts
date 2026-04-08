// tests/unit/command-registry.test.ts
import { describe, it, expect, vi } from 'vitest'
import { CommandRegistryImpl } from '../../src/main/plugins/sdk/command-registry'

describe('CommandRegistryImpl', () => {
  it('registers and executes a command', async () => {
    const registry = new CommandRegistryImpl()
    const handler = vi.fn()
    registry.register('do-thing', handler)
    await registry.execute('do-thing')
    expect(handler).toHaveBeenCalledOnce()
  })

  it('throws when executing unregistered command', async () => {
    const registry = new CommandRegistryImpl()
    await expect(registry.execute('nope')).rejects.toThrow(/not found/)
  })

  it('throws on duplicate command id', () => {
    const registry = new CommandRegistryImpl()
    registry.register('cmd', vi.fn())
    expect(() => registry.register('cmd', vi.fn())).toThrow(/already registered/)
  })

  it('disposes a command registration', async () => {
    const registry = new CommandRegistryImpl()
    const disposable = registry.register('cmd', vi.fn())
    disposable.dispose()
    await expect(registry.execute('cmd')).rejects.toThrow(/not found/)
  })

  it('has() returns correct values', () => {
    const registry = new CommandRegistryImpl()
    expect(registry.has('cmd')).toBe(false)
    registry.register('cmd', vi.fn())
    expect(registry.has('cmd')).toBe(true)
  })

  it('lists all registered command ids', () => {
    const registry = new CommandRegistryImpl()
    registry.register('cmd-a', vi.fn())
    registry.register('cmd-b', vi.fn())
    expect(registry.getCommandIds()).toEqual(['cmd-a', 'cmd-b'])
  })

  it('handles async command handlers', async () => {
    const registry = new CommandRegistryImpl()
    const handler = vi.fn(async () => { await new Promise(r => setTimeout(r, 10)) })
    registry.register('async-cmd', handler)
    await registry.execute('async-cmd')
    expect(handler).toHaveBeenCalledOnce()
  })

  it('clear() removes all commands', () => {
    const registry = new CommandRegistryImpl()
    registry.register('a', vi.fn())
    registry.register('b', vi.fn())
    registry.clear()
    expect(registry.getCommandIds()).toEqual([])
  })
})
