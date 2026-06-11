import type { OpenTabsSnapshot, PersistedTab, TabOp } from '@shared/appdata'

/** Content equality of a tab, ignoring order (position is compared separately
 *  by the diff). Cheap field-by-field compare — these are small flat records. */
function sameContent(a: PersistedTab, b: PersistedTab): boolean {
  return (
    a.title === b.title &&
    a.sql === b.sql &&
    a.connectionId === b.connectionId &&
    a.database === b.database &&
    a.schema === b.schema &&
    a.savedQueryId === b.savedQueryId &&
    a.autoCommit === b.autoCommit
  )
}

/**
 * Compute the minimal batch of ops that turns `prev` into `next`. The result is
 * grouped **deletes → upserts (in target order) → active** so it applies cleanly
 * in a single transaction (rows are removed before positions are re-packed, and
 * the active id is recorded last).
 *
 * A tab is re-`upsert`ed when it is new, its content changed, **or** its
 * position moved — so the common hot path (editing one tab's SQL) yields exactly
 * one `upsert`, independent of how many tabs are open. Returns `[]` when nothing
 * changed, letting the engine skip the write entirely.
 */
export function diffTabs(prev: OpenTabsSnapshot, next: OpenTabsSnapshot): TabOp[] {
  const deletes: TabOp[] = []
  const upserts: TabOp[] = []

  const prevById = new Map<string, { tab: PersistedTab; position: number }>()
  prev.tabs.forEach((tab, position) => prevById.set(tab.id, { tab, position }))
  const nextIds = new Set(next.tabs.map((t) => t.id))

  for (const tab of prev.tabs) {
    if (!nextIds.has(tab.id)) deletes.push({ kind: 'delete', id: tab.id })
  }

  next.tabs.forEach((tab, position) => {
    const before = prevById.get(tab.id)
    if (!before || before.position !== position || !sameContent(before.tab, tab)) {
      upserts.push({ kind: 'upsert', tab, position })
    }
  })

  const ops = [...deletes, ...upserts]
  if (prev.activeId !== next.activeId) ops.push({ kind: 'active', id: next.activeId })
  return ops
}
