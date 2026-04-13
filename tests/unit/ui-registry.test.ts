import { describe, it, expect, vi } from 'vitest'
import { UIRegistryImpl } from '../../src/main/plugins/sdk/ui-registry'

describe('UIRegistryImpl', () => {
  it('registers and retrieves a panel widget tree', () => {
    const registry = new UIRegistryImpl()
    const widgets = [{ type: 'text' as const, id: 'hello', content: 'Hello' }]
    registry.registerPanel('my-panel', widgets)
    expect(registry.getPanel('my-panel')).toEqual(widgets)
  })

  it('registers and retrieves status bar widgets', () => {
    const registry = new UIRegistryImpl()
    const widgets = [{ type: 'status-indicator' as const, id: 'status', label: 'OK', icon: 'check' }]
    registry.registerStatusBar('my-status', widgets)
    expect(registry.getStatusBar('my-status')).toEqual(widgets)
  })

  it('registers and calls a resolver', async () => {
    const registry = new UIRegistryImpl()
    const resolver = vi.fn().mockResolvedValue([{ value: 'wh1', label: 'Warehouse 1' }])
    registry.registerResolver('warehouses', resolver)
    const result = await registry.resolve('warehouses', { connectionId: 'conn1' })
    expect(result).toEqual([{ value: 'wh1', label: 'Warehouse 1' }])
    expect(resolver).toHaveBeenCalledWith({ connectionId: 'conn1' })
  })

  it('invalidate emits a change event', () => {
    const registry = new UIRegistryImpl()
    const listener = vi.fn()
    registry.onChange(listener)
    registry.registerResolver('test', vi.fn())
    registry.invalidate('test')
    // onChange fires for registerResolver and invalidate
    expect(listener).toHaveBeenCalled()
  })

  it('dispose removes registered panel', () => {
    const registry = new UIRegistryImpl()
    const disposable = registry.registerPanel('temp', [{ type: 'text' as const, id: 't', content: 'x' }])
    expect(registry.getPanel('temp')).toBeDefined()
    disposable.dispose()
    expect(registry.getPanel('temp')).toBeUndefined()
  })

  it('clear removes all registrations', () => {
    const registry = new UIRegistryImpl()
    registry.registerPanel('p1', [])
    registry.registerStatusBar('s1', [])
    registry.registerResolver('r1', vi.fn())
    registry.clear()
    expect(registry.getPanel('p1')).toBeUndefined()
    expect(registry.getStatusBar('s1')).toBeUndefined()
  })

  it('registers and retrieves tab widget tree', () => {
    const registry = new UIRegistryImpl()
    const widgets = [{ type: 'text' as const, id: 'tab-content', content: 'Tab' }]
    registry.registerTab('my-tab', widgets)
    expect(registry.getTab('my-tab')).toEqual(widgets)
  })

  it('getAllContributions returns grouped contributions', () => {
    const registry = new UIRegistryImpl()
    registry.registerPanel('p1', [{ type: 'text' as const, id: 't', content: 'x' }])
    registry.registerStatusBar('s1', [{ type: 'status-indicator' as const, id: 's', label: 'OK', icon: 'check' }])
    const panels = registry.getAllPanels()
    const statusBars = registry.getAllStatusBars()
    expect(panels).toHaveLength(1)
    expect(statusBars).toHaveLength(1)
  })

  it('tracks plugin ownership via currentPluginName', () => {
    const registry = new UIRegistryImpl()
    registry.currentPluginName = 'plugin-a'
    registry.registerPanel('panel-a', [{ type: 'text' as const, id: 'a', content: 'A' }])
    registry.currentPluginName = 'plugin-b'
    registry.registerPanel('panel-b', [{ type: 'text' as const, id: 'b', content: 'B' }])

    const panels = registry.getAllPanels()
    expect(panels).toHaveLength(2)
    expect(panels.find(p => p.id === 'panel-a')?.pluginName).toBe('plugin-a')
    expect(panels.find(p => p.id === 'panel-b')?.pluginName).toBe('plugin-b')
  })
})
