import { describe, it, expect } from 'vitest'
import { diffTabs } from '../../../src/renderer/src/lib/tab-persistence/diff'
import type { OpenTabsSnapshot, PersistedTab, TabOp } from '../../../shared/appdata'

function tab(id: string, over: Partial<PersistedTab> = {}): PersistedTab {
  return {
    id,
    title: id,
    sql: '',
    connectionId: null,
    database: null,
    schema: null,
    autoCommit: true,
    ...over,
  }
}
function snap(tabs: PersistedTab[], activeId: string | null = null): OpenTabsSnapshot {
  return { tabs, activeId }
}
const upserts = (ops: TabOp[]): Extract<TabOp, { kind: 'upsert' }>[] =>
  ops.filter((o): o is Extract<TabOp, { kind: 'upsert' }> => o.kind === 'upsert')

describe('diffTabs', () => {
  it('returns no ops when nothing changed', () => {
    const s = snap([tab('a'), tab('b')], 'a')
    expect(diffTabs(s, s)).toEqual([])
  })

  it('emits a single upsert for a one-tab content edit (the hot path)', () => {
    const prev = snap([tab('a'), tab('b'), tab('c')])
    const next = snap([tab('a'), tab('b', { sql: 'SELECT 1' }), tab('c')])
    const ops = diffTabs(prev, next)
    expect(ops).toEqual([{ kind: 'upsert', tab: tab('b', { sql: 'SELECT 1' }), position: 1 }])
  })

  it('emits an upsert for a newly added tab at its position', () => {
    const prev = snap([tab('a')])
    const next = snap([tab('a'), tab('b')])
    expect(diffTabs(prev, next)).toEqual([{ kind: 'upsert', tab: tab('b'), position: 1 }])
  })

  it('emits a delete for a removed tab', () => {
    const prev = snap([tab('a'), tab('b')])
    const next = snap([tab('a')])
    expect(diffTabs(prev, next)).toEqual([{ kind: 'delete', id: 'b' }])
  })

  it('re-upserts tabs whose position changed on reorder', () => {
    const prev = snap([tab('a'), tab('b'), tab('c')])
    const next = snap([tab('c'), tab('a'), tab('b')])
    // All three moved → three upserts carrying their new positions.
    const ops = upserts(diffTabs(prev, next))
    expect(ops.map((o) => [o.tab.id, o.position])).toEqual([
      ['c', 0],
      ['a', 1],
      ['b', 2],
    ])
  })

  it('orders deletes before upserts so positions repack cleanly', () => {
    // Remove the middle tab; the trailing tab shifts left.
    const prev = snap([tab('a'), tab('b'), tab('c')])
    const next = snap([tab('a'), tab('c')])
    const ops = diffTabs(prev, next)
    expect(ops[0]).toEqual({ kind: 'delete', id: 'b' })
    expect(ops.slice(1)).toEqual([{ kind: 'upsert', tab: tab('c'), position: 1 }])
  })

  it('emits an active op only when the focused id changes, last', () => {
    const prev = snap([tab('a'), tab('b')], 'a')
    const next = snap([tab('a'), tab('b')], 'b')
    expect(diffTabs(prev, next)).toEqual([{ kind: 'active', id: 'b' }])

    const cleared = snap([tab('a'), tab('b')], null)
    expect(diffTabs(prev, cleared)).toEqual([{ kind: 'active', id: null }])
  })

  it('combines delete + upsert + active in one batch', () => {
    const prev = snap([tab('a'), tab('b')], 'a')
    const next = snap([tab('a', { sql: 'x' }), tab('c')], 'c')
    const ops = diffTabs(prev, next)
    expect(ops).toEqual([
      { kind: 'delete', id: 'b' },
      { kind: 'upsert', tab: tab('a', { sql: 'x' }), position: 0 },
      { kind: 'upsert', tab: tab('c'), position: 1 },
      { kind: 'active', id: 'c' },
    ])
  })

  it('treats every persisted field as content (savedQueryId, autoCommit, conn…)', () => {
    const prev = snap([tab('a')])
    for (const over of [
      { title: 'renamed' },
      { connectionId: 'c1' },
      { database: 'db' },
      { schema: 's' },
      { savedQueryId: 'sq' },
      { autoCommit: false },
    ] as Partial<PersistedTab>[]) {
      const ops = diffTabs(prev, snap([tab('a', over)]))
      expect(ops).toHaveLength(1)
      expect(ops[0].kind).toBe('upsert')
    }
  })
})
