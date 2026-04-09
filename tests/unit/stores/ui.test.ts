import { describe, it, expect, beforeEach } from 'vitest'
import { useUiStore } from '../../../src/renderer/src/stores/ui'

describe('useUiStore', () => {
  beforeEach(() => {
    useUiStore.setState({
      activePanel: 'explorer',
      sidebarVisible: true,
      expandedTreeNodes: new Set<string>(),
    })
  })

  // ── expandedTreeNodes ────────────────────────────────────────────────────

  it('toggleTreeNode adds a node when not present', () => {
    useUiStore.getState().toggleTreeNode('db:myapp_prod')
    expect(useUiStore.getState().expandedTreeNodes.has('db:myapp_prod')).toBe(true)
  })

  it('toggleTreeNode removes a node when already present', () => {
    useUiStore.setState({ expandedTreeNodes: new Set(['db:myapp_prod']) })
    useUiStore.getState().toggleTreeNode('db:myapp_prod')
    expect(useUiStore.getState().expandedTreeNodes.has('db:myapp_prod')).toBe(false)
  })

  it('expandTreeNode adds a node without toggling (calling twice keeps it)', () => {
    useUiStore.getState().expandTreeNode('schema:myapp_prod.public')
    expect(useUiStore.getState().expandedTreeNodes.has('schema:myapp_prod.public')).toBe(true)

    // Second call must not remove it
    useUiStore.getState().expandTreeNode('schema:myapp_prod.public')
    expect(useUiStore.getState().expandedTreeNodes.has('schema:myapp_prod.public')).toBe(true)
  })

  it('collapseAllTreeNodes clears all expanded nodes', () => {
    useUiStore.setState({
      expandedTreeNodes: new Set(['db:a', 'schema:a.public', 'table:a.public.users']),
    })
    useUiStore.getState().collapseAllTreeNodes()
    expect(useUiStore.getState().expandedTreeNodes.size).toBe(0)
  })

  // ── removed API no longer exists ─────────────────────────────────────────

  it('expandedSections does not exist on the store', () => {
    const state = useUiStore.getState() as Record<string, unknown>
    expect(state['expandedSections']).toBeUndefined()
  })

  it('toggleSection does not exist on the store', () => {
    const state = useUiStore.getState() as Record<string, unknown>
    expect(state['toggleSection']).toBeUndefined()
  })

  // ── existing API still works ──────────────────────────────────────────────

  it('setActivePanel updates activePanel', () => {
    useUiStore.getState().setActivePanel('settings')
    expect(useUiStore.getState().activePanel).toBe('settings')
  })

  it('toggleSidebar flips sidebarVisible', () => {
    useUiStore.getState().toggleSidebar()
    expect(useUiStore.getState().sidebarVisible).toBe(false)
    useUiStore.getState().toggleSidebar()
    expect(useUiStore.getState().sidebarVisible).toBe(true)
  })
})
