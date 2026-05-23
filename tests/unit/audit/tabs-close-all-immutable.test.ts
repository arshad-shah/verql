// Regression test for `closeAllTabs` mutating prior state.
//
// The old implementation called `s.tabs.reverse()` which mutates the existing
// array in place — and that same array reference is still held by any Zustand
// subscriber that read `tabs` before the action ran. The visible effect was
// that any selector memoizing on array identity (e.g. the tab strip) would
// see a silently reversed list after a "close all", because the previous
// reference now pointed at reversed contents.
import { describe, it, expect, beforeEach } from 'vitest'
import { useTabsStore } from '../../../src/renderer/src/stores/tabs'

describe('tabs store — closeAllTabs does not mutate the prior tabs array', () => {
  beforeEach(() => {
    useTabsStore.setState({ tabs: [], activeTabId: null, recentlyClosed: [] })
  })

  it('leaves the previously-published tabs array untouched', () => {
    const store = useTabsStore.getState()
    store.addQueryTab('conn-a')
    store.addQueryTab('conn-b')
    store.addQueryTab('conn-c')

    // Snapshot the reference renderers would have captured pre-action.
    const before = useTabsStore.getState().tabs
    const idsBefore = before.map(t => t.id)

    useTabsStore.getState().closeAllTabs()

    // The pre-action array reference must still describe the pre-action state.
    expect(before.map(t => t.id)).toEqual(idsBefore)
    // And the recently-closed list must contain the closed tabs in
    // reverse order (most recently closed first) without mutating
    // the captured `before` reference.
    const recent = useTabsStore.getState().recentlyClosed
    expect(recent.map(t => t.id)).toEqual([...idsBefore].reverse())
  })
})
