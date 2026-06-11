import type { OpenTabsSnapshot, TabOp } from '@shared/appdata'
import { useTabsStore, type QueryTabSnapshot } from '@/stores/tabs'
import { TabPersistenceEngine } from './engine'
import { selectPersistableTabs } from './select'
import { readAndClearLegacyTabs } from './migrate'
import { resolveTabStore, type TabPersistenceStore } from './transport'

export { TabPersistenceEngine } from './engine'
export { selectPersistableTabs } from './select'
export { diffTabs } from './diff'
export type { TabPersistenceTransport, TabPersistenceEngineDeps } from './engine'
export type { TabPersistenceStore } from './transport'

export interface InitTabPersistenceOptions {
  /** Re-open the previous session's tabs at startup (Settings → General). */
  restoreOnStartup: boolean
  /** Override the storage backend (tests inject a fake). Defaults to IPC. */
  store?: TabPersistenceStore
  /** Debounce window for coalescing edits. */
  debounceMs?: number
}

/** Re-open persisted query tabs into the live store, preserving their ids so the
 *  engine's baseline matches what's on screen. */
function restoreIntoStore(snapshot: OpenTabsSnapshot): void {
  const snaps: QueryTabSnapshot[] = snapshot.tabs.map((t) => ({
    id: t.id,
    title: t.title,
    sql: t.sql,
    connectionId: t.connectionId,
    database: t.database,
    schema: t.schema,
    ...(t.savedQueryId ? { savedQueryId: t.savedQueryId } : {}),
    autoCommit: t.autoCommit,
  }))
  const activeIndex = snapshot.activeId
    ? snapshot.tabs.findIndex((t) => t.id === snapshot.activeId)
    : -1
  useTabsStore.getState().restoreQueryTabs(snaps, activeIndex >= 0 ? activeIndex : null)
}

/** Whole-snapshot seed used once to migrate the legacy localStorage payload. */
function snapshotToOps(snapshot: OpenTabsSnapshot): TabOp[] {
  const ops: TabOp[] = snapshot.tabs.map((tab, position) => ({ kind: 'upsert', tab, position }))
  if (snapshot.activeId) ops.push({ kind: 'active', id: snapshot.activeId })
  return ops
}

/**
 * Stand up tab persistence: hydrate the durable snapshot (migrating the legacy
 * localStorage payload on first run), optionally restore those tabs, then start
 * the incremental engine watching the live store. Returns a stop function that
 * flushes any pending write and detaches the watcher.
 *
 * This is the single entry point — the engine, diff, selector, transport, and
 * migration are wired here so callers (and `main.tsx`) deal with one async call.
 */
export async function initTabPersistence(
  options: InitTabPersistenceOptions,
): Promise<() => Promise<void>> {
  const store = options.store ?? resolveTabStore()

  // 1. Hydrate from durable storage; fall back to migrating legacy localStorage.
  let snapshot = await store.list().catch(() => ({ tabs: [], activeId: null }))
  if (snapshot.tabs.length === 0) {
    const legacy = readAndClearLegacyTabs()
    if (legacy) {
      await store.apply(snapshotToOps(legacy)).catch(() => {})
      snapshot = legacy
    }
  }

  // 2. Re-open tabs if the user opted in (persistence still runs either way, so
  //    the durable set tracks live tabs and a later opt-in has something to show).
  if (options.restoreOnStartup && snapshot.tabs.length > 0) {
    restoreIntoStore(snapshot)
  }

  // 3. Watch the live store and persist incrementally. Baseline is the durable
  //    snapshot so the first diff reflects only post-startup changes.
  const engine = new TabPersistenceEngine({
    subscribe: (run) => useTabsStore.subscribe(run),
    getSnapshot: () => selectPersistableTabs(useTabsStore.getState()),
    transport: store,
    debounceMs: options.debounceMs,
    onError: (err) => console.warn('[tab-persistence] write failed', err),
  })
  engine.setBaseline(snapshot)
  const stop = engine.start()

  // Best-effort durability on quit: flush the debounce before the page unloads.
  const onHide = (): void => { void engine.flush() }
  if (typeof window !== 'undefined') window.addEventListener('pagehide', onHide)

  return async () => {
    if (typeof window !== 'undefined') window.removeEventListener('pagehide', onHide)
    await engine.flush()
    stop()
  }
}
