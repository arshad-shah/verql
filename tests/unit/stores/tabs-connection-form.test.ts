import { describe, it, expect, beforeEach } from 'vitest'
import { useTabsStore } from '../../../src/renderer/src/stores/tabs'

describe('openConnectionForm', () => {
  beforeEach(() => {
    useTabsStore.setState({ tabs: [], activeTabId: null })
  })

  it('opens a new connection form tab', () => {
    const id = useTabsStore.getState().openConnectionForm()
    const state = useTabsStore.getState()
    expect(state.tabs).toHaveLength(1)
    expect(state.activeTabId).toBe(id)
    const tab = state.tabs[0]
    expect(tab.type).toBe('connection-form')
    expect(tab.title).toBe('New Connection')
    expect((tab as any).editingId).toBeUndefined()
  })

  it('opens an editing form tab with editingId', () => {
    const id = useTabsStore.getState().openConnectionForm('conn-123')
    const tab = useTabsStore.getState().tabs[0]
    expect(tab.type).toBe('connection-form')
    expect((tab as any).editingId).toBe('conn-123')
  })

  it('reuses existing tab for same editingId', () => {
    useTabsStore.getState().openConnectionForm('conn-123')
    useTabsStore.getState().openConnectionForm('conn-123')
    expect(useTabsStore.getState().tabs).toHaveLength(1)
  })

  it('opens separate tabs for different editingIds', () => {
    useTabsStore.getState().openConnectionForm('conn-1')
    useTabsStore.getState().openConnectionForm('conn-2')
    expect(useTabsStore.getState().tabs).toHaveLength(2)
  })

  it('reuses existing new-connection tab', () => {
    useTabsStore.getState().openConnectionForm()
    useTabsStore.getState().openConnectionForm()
    expect(useTabsStore.getState().tabs).toHaveLength(1)
  })
})
