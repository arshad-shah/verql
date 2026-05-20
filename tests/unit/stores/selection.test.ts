import { describe, it, expect, beforeEach } from 'vitest'
import { useSelectionStore } from '../../../src/renderer/src/stores/selection'

describe('useSelectionStore', () => {
  beforeEach(() => {
    useSelectionStore.setState({ selection: null })
  })

  it('selection defaults to null', () => {
    expect(useSelectionStore.getState().selection).toBeNull()
  })

  it('setSelection stores a row selection', () => {
    useSelectionStore.getState().setSelection({
      kind: 'row',
      tabId: 'tab-1',
      row: { id: 42, name: 'Alice' },
      columns: [
        { name: 'id', dataType: 'int' },
        { name: 'name', dataType: 'text' },
      ],
    })
    const s = useSelectionStore.getState().selection
    expect(s?.kind).toBe('row')
    if (s?.kind === 'row') {
      expect(s.row.id).toBe(42)
      expect(s.columns).toHaveLength(2)
    }
  })

  it('setSelection(null) clears selection', () => {
    useSelectionStore.setState({
      selection: { kind: 'erNode', connectionId: 'c1', table: 'users' },
    })
    useSelectionStore.getState().setSelection(null)
    expect(useSelectionStore.getState().selection).toBeNull()
  })

  it('clearForTab clears row selection belonging to that tab', () => {
    useSelectionStore.setState({
      selection: { kind: 'row', tabId: 'tab-1', row: {}, columns: [] },
    })
    useSelectionStore.getState().clearForTab('tab-1')
    expect(useSelectionStore.getState().selection).toBeNull()
  })

  it('clearForTab leaves selection alone if tabId does not match', () => {
    useSelectionStore.setState({
      selection: { kind: 'row', tabId: 'tab-1', row: {}, columns: [] },
    })
    useSelectionStore.getState().clearForTab('tab-2')
    expect(useSelectionStore.getState().selection).not.toBeNull()
  })

  it('clearForTab leaves non-row selections alone', () => {
    useSelectionStore.setState({
      selection: { kind: 'erNode', connectionId: 'c1', table: 'users' },
    })
    useSelectionStore.getState().clearForTab('tab-1')
    expect(useSelectionStore.getState().selection).not.toBeNull()
  })
})
