// tests/unit/panel-registry.test.ts
import { describe, it, expect } from 'vitest'
import { PanelRegistryImpl } from '../../src/main/plugins/sdk/panel-registry'
import type { PanelContribution } from '../../src/main/plugins/sdk/types'

function makePanel(overrides?: Partial<PanelContribution>): PanelContribution {
  return {
    title: 'Test Panel',
    icon: 'sparkles',
    location: 'sidebar',
    render: () => '<div>hello</div>',
    ...overrides
  }
}

describe('PanelRegistryImpl', () => {
  it('registers and retrieves a panel', () => {
    const registry = new PanelRegistryImpl()
    const panel = makePanel()
    registry.register('my-panel', panel)
    expect(registry.get('my-panel')).toBe(panel)
  })

  it('returns undefined for unregistered panel', () => {
    const registry = new PanelRegistryImpl()
    expect(registry.get('nope')).toBeUndefined()
  })

  it('throws on duplicate panel id', () => {
    const registry = new PanelRegistryImpl()
    registry.register('p', makePanel())
    expect(() => registry.register('p', makePanel())).toThrow(/already registered/)
  })

  it('disposes a panel registration', () => {
    const registry = new PanelRegistryImpl()
    const disposable = registry.register('p', makePanel())
    disposable.dispose()
    expect(registry.get('p')).toBeUndefined()
  })

  it('has() returns correct values', () => {
    const registry = new PanelRegistryImpl()
    expect(registry.has('p')).toBe(false)
    registry.register('p', makePanel())
    expect(registry.has('p')).toBe(true)
  })

  it('lists all panels', () => {
    const registry = new PanelRegistryImpl()
    registry.register('a', makePanel({ title: 'A' }))
    registry.register('b', makePanel({ title: 'B', location: 'bottom' }))
    const all = registry.getAll()
    expect(all).toHaveLength(2)
    expect(all.map(p => p.id)).toEqual(['a', 'b'])
  })

  it('clear() removes all panels', () => {
    const registry = new PanelRegistryImpl()
    registry.register('a', makePanel())
    registry.clear()
    expect(registry.getAll()).toEqual([])
  })
})
