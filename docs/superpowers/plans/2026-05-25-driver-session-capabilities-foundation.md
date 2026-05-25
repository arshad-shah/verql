# Driver Session & Transaction Capabilities — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a declarative driver capability surface for transactions/auto-commit, plus an end-to-end per-tab transaction runtime for PostgreSQL and SQLite with a transaction toolbar and close-guard.

**Architecture:** Drivers *declare* `session`/`explain`/`sessionInspection` capability blocks on `DriverFactory`. A functions-stripped subset is serialized over IPC; the renderer reads flags and never branches on db type. Transaction state is per-tab; flipping a tab to auto-commit-off lazily pins one dedicated connection out of the pool. An optional per-connection runtime overlay (used later by MongoDB) is merged through a single selector.

**Tech Stack:** Electron (main/preload/renderer), TypeScript, Zustand, `pg`, `better-sqlite3`, Vitest, Storybook.

**Scope of THIS plan:** Capability framework + IPC + serialization + runtime overlay merge; transaction runtime in PostgreSQL + SQLite; per-tab session state; transaction toolbar; close-guard. EXPLAIN, the sessions panel, and the MySQL/Snowflake/Mongo/Redis drivers are **separate follow-on plans** (see end).

**Spec:** `docs/superpowers/specs/2026-05-25-driver-session-capabilities-design.md`

**Conventions in this repo (follow exactly):**
- Adding an IPC channel is a 3-step edit in `shared/ipc.ts`: add to `IpcChannelMap`, add the matching constant to `IPC_CHANNELS`, then use it. The coverage test (`tests/unit/ipc-channels-coverage.test.ts`) fails if a channel lacks a constant.
- The preload bridge (`src/preload/index.ts`) is generic — **no preload edits needed** for new channels.
- Run a single test file: `pnpm test -- --run tests/unit/<file>.test.ts`
- **UI tasks only:** before using ANY design-system primitive prop, verify it with the `your-project-sb-mcp` MCP tools (`list-all-documentation`, `get-documentation`). Never assume a prop exists. This project rule overrides "write complete code" for primitive props — where a prop is unverified, use the MCP first.

---

## File Structure

**Created:**
- `shared/driver-capabilities.ts` — serializable capability/session/overlay types + `mergeCapabilities` helper
- `src/main/plugins/sdk/capabilities.ts` — `serializeStaticCapabilities(factory)`
- `src/renderer/src/components/query/TransactionToolbar.tsx` — the toolbar
- `src/renderer/src/components/query/TransactionToolbar.stories.tsx`
- `src/renderer/src/lib/initial-autocommit.ts`
- Test files under `tests/unit/`

**Modified:**
- `shared/types.ts` — `ConnectionProfile.defaultAutoCommit`, `QueryTab.txn`, `QueryTabTxnState`
- `shared/ipc.ts` — new channels + constants; `db:driver-capabilities` return → `DriverCapabilities`; `db:query` gains `opts`
- `src/main/db/adapter.ts` — optional session methods + `query` opts arg
- `src/main/plugins/sdk/types.ts` — capability blocks + `getRuntimeCapabilities?` on `DriverFactory`
- `src/main/ipc/db.ts` — session/txn/connection-capabilities handlers; use serializer
- `src/main/plugins/bundled/postgresql/{postgres-adapter,index}.ts`
- `src/main/plugins/bundled/sqlite/{sqlite-adapter,index}.ts`
- `src/renderer/src/stores/driver-capabilities.ts` — connection-scoped overlay + `resolveCapabilities`
- `src/renderer/src/stores/tabs.ts` — per-tab txn state + actions
- `src/renderer/src/stores/tab-actions.ts` — txn close-guard hooks

---

# PHASE 1 — Capability Framework

## Task 1: Shared capability types + merge helper

**Files:**
- Create: `shared/driver-capabilities.ts`
- Test: `tests/unit/driver-capabilities-merge.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/driver-capabilities-merge.test.ts
import { describe, it, expect } from 'vitest'
import { mergeCapabilities } from '../../shared/driver-capabilities'
import type { DriverCapabilities } from '../../shared/driver-capabilities'

const base: DriverCapabilities = {
  hasSampleQuery: true,
  hasGetTableData: true,
  session: { autoCommit: true, manualTransactions: false },
  sessionInspection: { canKill: false },
}

describe('mergeCapabilities', () => {
  it('returns base unchanged when overlay is null', () => {
    expect(mergeCapabilities(base, null)).toEqual(base)
  })

  it('overlays declared session fields', () => {
    const merged = mergeCapabilities(base, { session: { manualTransactions: true } })
    expect(merged.session?.manualTransactions).toBe(true)
    expect(merged.session?.autoCommit).toBe(true) // untouched
  })

  it('overlays sessionInspection.canKill', () => {
    const merged = mergeCapabilities(base, { sessionInspection: { canKill: true } })
    expect(merged.sessionInspection?.canKill).toBe(true)
  })

  it('is a no-op for a block the driver never declared', () => {
    const noSession: DriverCapabilities = { hasSampleQuery: false, hasGetTableData: false }
    const merged = mergeCapabilities(noSession, { session: { manualTransactions: true } })
    expect(merged.session).toBeUndefined()
  })

  it('does not mutate the base object', () => {
    mergeCapabilities(base, { session: { manualTransactions: true } })
    expect(base.session?.manualTransactions).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/driver-capabilities-merge.test.ts`
Expected: FAIL — cannot find module `../../shared/driver-capabilities`.

- [ ] **Step 3: Create the types + helper**

```ts
// shared/driver-capabilities.ts

/** What transaction semantics a driver supports. All fields are data-only
 *  (no functions) so this serializes cleanly over IPC. */
export interface SessionCapability {
  autoCommit: boolean
  manualTransactions: boolean
  isolationLevels?: string[]
  readOnly?: boolean
  savepoints?: boolean
  /** What this engine calls a transaction. Defaults to "Transaction". */
  transactionLabel?: string
  /** 'full' = real rollback (PG/MySQL); 'discard' = best-effort (Redis DISCARD). */
  rollbackKind?: 'full' | 'discard'
}

export interface ExplainCapability {
  supportsAnalyze: boolean
  /** 'tree' = renderer draws an ExplainNode tree; 'text' = raw plan text. */
  format: 'tree' | 'text'
}

export interface InspectionCapability {
  canKill: boolean
}

/** Options when opening a session or beginning a transaction. */
export interface SessionOpts {
  autoCommit?: boolean
  readOnly?: boolean
  isolationLevel?: string
}

/** Per-connection overlay a driver may apply at connect time. Deliberately a
 *  narrow subset — it can only flip pre-existing fields, never add new
 *  capability kinds or change explain.format. */
export interface RuntimeCapabilityOverlay {
  session?: Partial<Pick<SessionCapability, 'manualTransactions' | 'isolationLevels' | 'readOnly'>>
  sessionInspection?: Partial<InspectionCapability>
}

/** Serializable, function-free capabilities the renderer consumes. */
export interface DriverCapabilities {
  sqlDialect?: string
  editorLanguage?: string
  defaultSchemaUseConnectionDatabase?: boolean
  defaultSchemaCandidates?: string[]
  hasSampleQuery: boolean
  hasGetTableData: boolean
  session?: SessionCapability
  explain?: ExplainCapability
  sessionInspection?: InspectionCapability
}

/**
 * Merge a per-connection overlay over static capabilities. The overlay can only
 * affect a block the driver already declared structurally — you cannot enable a
 * capability a driver never advertised. Pure; never mutates `base`.
 */
export function mergeCapabilities(
  base: DriverCapabilities,
  overlay: RuntimeCapabilityOverlay | null | undefined
): DriverCapabilities {
  if (!overlay) return base
  return {
    ...base,
    session: base.session ? { ...base.session, ...overlay.session } : base.session,
    sessionInspection: base.sessionInspection
      ? { ...base.sessionInspection, ...overlay.sessionInspection }
      : base.sessionInspection,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/driver-capabilities-merge.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add shared/driver-capabilities.ts tests/unit/driver-capabilities-merge.test.ts
git commit -m "feat(caps): shared driver capability types + merge helper"
```

---

## Task 2: Wire capabilities into the SDK + static serializer

**Files:**
- Modify: `src/main/db/adapter.ts`
- Modify: `src/main/plugins/sdk/types.ts`
- Create: `src/main/plugins/sdk/capabilities.ts`
- Test: `tests/unit/driver-capabilities-serialize.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/driver-capabilities-serialize.test.ts
import { describe, it, expect } from 'vitest'
import { serializeStaticCapabilities } from '../../src/main/plugins/sdk/capabilities'
import type { DriverFactory } from '../../src/main/plugins/sdk/types'
import type { DbAdapter } from '../../src/main/db/adapter'

function factory(overrides: Partial<DriverFactory>): DriverFactory {
  return {
    createAdapter: () => ({} as DbAdapter),
    connectionFields: [],
    ...overrides,
  }
}

describe('serializeStaticCapabilities', () => {
  it('strips functions and reports their presence as flags', () => {
    const caps = serializeStaticCapabilities(factory({ sampleQuery: () => 'x', getTableData: async () => ({ rows: [], columns: [] }) }))
    expect(caps.hasSampleQuery).toBe(true)
    expect(caps.hasGetTableData).toBe(true)
    expect((caps as Record<string, unknown>).sampleQuery).toBeUndefined()
  })

  it('passes session/explain/sessionInspection blocks through verbatim', () => {
    const caps = serializeStaticCapabilities(factory({
      session: { autoCommit: true, manualTransactions: true, isolationLevels: ['READ COMMITTED'] },
      explain: { supportsAnalyze: true, format: 'tree' },
      sessionInspection: { canKill: true },
    }))
    expect(caps.session?.manualTransactions).toBe(true)
    expect(caps.explain?.format).toBe('tree')
    expect(caps.sessionInspection?.canKill).toBe(true)
  })

  it('omits capability blocks the driver did not declare', () => {
    const caps = serializeStaticCapabilities(factory({}))
    expect(caps.session).toBeUndefined()
    expect(caps.explain).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/driver-capabilities-serialize.test.ts`
Expected: FAIL — cannot find `../../src/main/plugins/sdk/capabilities`.

- [ ] **Step 3: Extend `DbAdapter` (adapter.ts)**

Add the import and optional methods. Replace the `query` signature and append session methods:

```ts
// at top of src/main/db/adapter.ts
import type { SessionOpts } from '@shared/driver-capabilities'
```

Change the `query` line to:

```ts
  query(sql: string, params?: unknown[], opts?: { sessionId?: string; timeoutMs?: number }): Promise<QueryResult>
```

Add before the closing brace of `interface DbAdapter`:

```ts
  /** Pin a dedicated connection for this session (auto-commit off / manual txn). */
  openSession?(sessionId: string, opts?: SessionOpts): Promise<void>
  /** Release the pinned connection. Rolls back any open txn first. */
  closeSession?(sessionId: string): Promise<void>
  setAutoCommit?(sessionId: string, enabled: boolean): Promise<void>
  beginTransaction?(sessionId: string, opts?: SessionOpts): Promise<void>
  commit?(sessionId: string): Promise<void>
  rollback?(sessionId: string): Promise<void>
```

- [ ] **Step 4: Extend `DriverFactory` (sdk/types.ts)**

Add the import near the top of `src/main/plugins/sdk/types.ts`:

```ts
import type { SessionCapability, ExplainCapability, InspectionCapability, RuntimeCapabilityOverlay } from '@shared/driver-capabilities'
```

Add these fields inside `interface DriverFactory` (after `generateMigrationDdl?`):

```ts
  /** Transaction / auto-commit / read-only capabilities. Omit ⇒ no txn UI. */
  session?: SessionCapability
  /** Execution-plan capabilities. Omit ⇒ no Explain action. */
  explain?: ExplainCapability
  /** Active-session (process) inspection. Omit ⇒ no Sessions panel. */
  sessionInspection?: InspectionCapability
  /** Optional per-connection overlay resolved at connect time (e.g. Mongo
   *  replica-set topology). SQL drivers omit it. */
  getRuntimeCapabilities?(adapter: DbAdapter): Promise<RuntimeCapabilityOverlay>
```

- [ ] **Step 5: Create the serializer**

```ts
// src/main/plugins/sdk/capabilities.ts
import type { DriverFactory } from './types'
import type { DriverCapabilities } from '@shared/driver-capabilities'

/** Build the function-free capability object the renderer consumes. The only
 *  place static driver capabilities are serialized for IPC. */
export function serializeStaticCapabilities(factory: DriverFactory): DriverCapabilities {
  return {
    sqlDialect: factory.sqlDialect,
    editorLanguage: factory.editorLanguage,
    defaultSchemaUseConnectionDatabase: factory.defaultSchemaUseConnectionDatabase,
    defaultSchemaCandidates: factory.defaultSchemaCandidates,
    hasSampleQuery: typeof factory.sampleQuery === 'function',
    hasGetTableData: typeof factory.getTableData === 'function',
    session: factory.session,
    explain: factory.explain,
    sessionInspection: factory.sessionInspection,
  }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/driver-capabilities-serialize.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 7: Typecheck + commit**

Run: `pnpm test -- --run tests/unit/driver-registry.test.ts` (ensure no type regressions in SDK consumers)
Expected: PASS.

```bash
git add src/main/db/adapter.ts src/main/plugins/sdk/types.ts src/main/plugins/sdk/capabilities.ts tests/unit/driver-capabilities-serialize.test.ts
git commit -m "feat(caps): declare session/explain/inspection capabilities on DriverFactory"
```

---

## Task 3: IPC channels & constants

**Files:**
- Modify: `shared/ipc.ts`
- Test: `tests/unit/ipc-channels-coverage.test.ts` (existing — must keep passing)

- [ ] **Step 1: Replace the `db:driver-capabilities` return and add `opts` to `db:query`**

At the top of `shared/ipc.ts`, add an import from `./driver-capabilities`:

```ts
import type { DriverCapabilities, SessionOpts, RuntimeCapabilityOverlay } from './driver-capabilities'
```

Change `db:query` to:

```ts
  'db:query': {
    args: [profileId: string, sql: string, params?: unknown[], opts?: { sessionId?: string; timeoutMs?: number }]
    return: QueryResult
  }
```

Replace the inline `db:driver-capabilities` return type with:

```ts
  'db:driver-capabilities': {
    args: [type: string]
    return: DriverCapabilities | null
  }
```

- [ ] **Step 2: Add the new channels to `IpcChannelMap`**

Add inside `IpcChannelMap` (near the other `db:*` entries):

```ts
  'db:session:open': {
    args: [profileId: string, sessionId: string, opts?: SessionOpts]
    return: void
  }
  'db:session:close': {
    args: [profileId: string, sessionId: string]
    return: void
  }
  'db:session:set-autocommit': {
    args: [profileId: string, sessionId: string, enabled: boolean]
    return: void
  }
  'db:txn:begin': {
    args: [profileId: string, sessionId: string, opts?: SessionOpts]
    return: void
  }
  'db:txn:commit': {
    args: [profileId: string, sessionId: string]
    return: void
  }
  'db:txn:rollback': {
    args: [profileId: string, sessionId: string]
    return: void
  }
  'db:connection-capabilities': {
    args: [profileId: string]
    return: RuntimeCapabilityOverlay | null
  }
```

- [ ] **Step 3: Add the matching constants to `IPC_CHANNELS`**

Under the `// ── Database session controls ──` group:

```ts
  DB_SESSION_OPEN: 'db:session:open',
  DB_SESSION_CLOSE: 'db:session:close',
  DB_SESSION_SET_AUTOCOMMIT: 'db:session:set-autocommit',
  DB_TXN_BEGIN: 'db:txn:begin',
  DB_TXN_COMMIT: 'db:txn:commit',
  DB_TXN_ROLLBACK: 'db:txn:rollback',
  DB_CONNECTION_CAPABILITIES: 'db:connection-capabilities',
```

- [ ] **Step 4: Run the coverage + contracts tests**

Run: `pnpm test -- --run tests/unit/ipc-channels-coverage.test.ts tests/unit/ipc-contracts.test.ts`
Expected: PASS — every new channel has a constant; types compile.

- [ ] **Step 5: Commit**

```bash
git add shared/ipc.ts
git commit -m "feat(ipc): session/txn/connection-capabilities channels"
```

---

## Task 4: Main-process IPC handlers

**Files:**
- Modify: `src/main/ipc/db.ts`
- Test: `tests/unit/db-session-handlers.test.ts`

- [ ] **Step 1: Write the failing test** (drives a fake-adapter spy through the handlers)

```ts
// tests/unit/db-session-handlers.test.ts
import { describe, it, expect, vi } from 'vitest'
import { registerDbHandlers } from '../../src/main/ipc/db'

// Capture handlers registered via `handle(channel, fn)`.
function harness(adapter: Record<string, unknown>) {
  const handlers = new Map<string, (...a: unknown[]) => unknown>()
  const handle = ((ch: string, fn: (...a: unknown[]) => unknown) => handlers.set(ch, fn)) as never
  const ctx = {
    activeAdapters: new Map([['p1', adapter]]),
    driverRegistry: { get: () => undefined, getMiddlewares: () => [] },
    configStore: { getConnection: () => null },
  } as never
  const connectionAccess = { setActiveConnectionId() {}, getActiveConnectionId: () => null } as never
  registerDbHandlers(ctx, handle, connectionAccess)
  return handlers
}

describe('session/txn handlers', () => {
  it('db:txn:begin forwards to adapter.beginTransaction with sessionId + opts', async () => {
    const adapter = { beginTransaction: vi.fn(async () => {}) }
    const h = harness(adapter)
    await h.get('db:txn:begin')!('p1', 's1', { isolationLevel: 'SERIALIZABLE' })
    expect(adapter.beginTransaction).toHaveBeenCalledWith('s1', { isolationLevel: 'SERIALIZABLE' })
  })

  it('db:session:set-autocommit forwards enabled flag', async () => {
    const adapter = { setAutoCommit: vi.fn(async () => {}) }
    const h = harness(adapter)
    await h.get('db:session:set-autocommit')!('p1', 's1', false)
    expect(adapter.setAutoCommit).toHaveBeenCalledWith('s1', false)
  })

  it('db:txn:commit is a no-op when adapter lacks commit()', async () => {
    const h = harness({})
    await expect(h.get('db:txn:commit')!('p1', 's1')).resolves.toBeUndefined()
  })

  it('db:query forwards opts (sessionId) to adapter.query', async () => {
    const adapter = { query: vi.fn(async () => ({ rows: [], fields: [], rowCount: 0, duration: 0, affectedRows: 0 })) }
    const h = harness(adapter)
    await h.get('db:query')!('p1', 'SELECT 1', [], { sessionId: 's1' })
    expect(adapter.query).toHaveBeenCalledWith('SELECT 1', [], { sessionId: 's1' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/db-session-handlers.test.ts`
Expected: FAIL — handlers `db:txn:begin` etc. undefined.

- [ ] **Step 3: Implement the handlers**

In `src/main/ipc/db.ts`, change the existing `db:query` handler to forward opts:

```ts
  handle('db:query', async (profileId: string, sql: string, params?: unknown[], opts?: { sessionId?: string; timeoutMs?: number }) =>
    requireAdapter(profileId).query(sql, params, opts)
  )
```

Add (near the other `db:*` handlers, after `db:cancel-query`):

```ts
  handle('db:session:open', async (profileId, sessionId, opts) => {
    const adapter = requireAdapter(profileId)
    if (adapter.openSession) await adapter.openSession(sessionId, opts)
  })

  handle('db:session:close', async (profileId, sessionId) => {
    const adapter = ctx.activeAdapters.get(profileId)
    if (adapter?.closeSession) await adapter.closeSession(sessionId)
  })

  handle('db:session:set-autocommit', async (profileId, sessionId, enabled) => {
    const adapter = requireAdapter(profileId)
    if (adapter.setAutoCommit) await adapter.setAutoCommit(sessionId, enabled)
  })

  handle('db:txn:begin', async (profileId, sessionId, opts) => {
    const adapter = requireAdapter(profileId)
    if (adapter.beginTransaction) await adapter.beginTransaction(sessionId, opts)
  })

  handle('db:txn:commit', async (profileId, sessionId) => {
    const adapter = requireAdapter(profileId)
    if (adapter.commit) await adapter.commit(sessionId)
  })

  handle('db:txn:rollback', async (profileId, sessionId) => {
    const adapter = requireAdapter(profileId)
    if (adapter.rollback) await adapter.rollback(sessionId)
  })

  handle('db:connection-capabilities', async (profileId) => {
    const profile = ctx.configStore.getConnection(profileId)
    if (!profile) return null
    const driver = ctx.driverRegistry.get(profile.type)
    const adapter = ctx.activeAdapters.get(profileId)
    if (!driver?.getRuntimeCapabilities || !adapter) return null
    return driver.getRuntimeCapabilities(adapter)
  })
```

Replace the existing inline `db:driver-capabilities` handler body with the serializer:

```ts
  handle('db:driver-capabilities', async (type: string) => {
    const driver = ctx.driverRegistry.get(type)
    if (!driver) return null
    return serializeStaticCapabilities(driver)
  })
```

Add the import at the top of `db.ts`:

```ts
import { serializeStaticCapabilities } from '../plugins/sdk/capabilities'
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/db-session-handlers.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/main/ipc/db.ts tests/unit/db-session-handlers.test.ts
git commit -m "feat(ipc): session/txn handlers + capability serialization"
```

---

## Task 5: Renderer `resolveCapabilities` selector + overlay cache

**Files:**
- Modify: `src/renderer/src/stores/driver-capabilities.ts`
- Modify: `src/renderer/src/stores/connections.ts` (wire fetch/clear into connect/disconnect)
- Test: `tests/unit/driver-capabilities-store.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/driver-capabilities-store.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDriverCapabilitiesStore } from '../../src/renderer/src/stores/driver-capabilities'

const invoke = vi.fn()
beforeEach(() => {
  invoke.mockReset()
  ;(globalThis as { window?: unknown }).window = { electronAPI: { invoke } }
  useDriverCapabilitiesStore.setState({ byType: {}, byConnection: {}, inflight: {} })
})

describe('resolveCapabilities', () => {
  it('returns static caps when no connection overlay is present', async () => {
    invoke.mockResolvedValueOnce({ hasSampleQuery: true, hasGetTableData: false, session: { autoCommit: true, manualTransactions: false } })
    await useDriverCapabilitiesStore.getState().fetch('postgresql')
    const caps = useDriverCapabilitiesStore.getState().resolveCapabilities('conn1', 'postgresql')
    expect(caps?.session?.manualTransactions).toBe(false)
  })

  it('overlays a per-connection runtime capability', async () => {
    invoke.mockResolvedValueOnce({ hasSampleQuery: true, hasGetTableData: false, session: { autoCommit: true, manualTransactions: false } })
    await useDriverCapabilitiesStore.getState().fetch('mongodb')
    invoke.mockResolvedValueOnce({ session: { manualTransactions: true } })
    await useDriverCapabilitiesStore.getState().fetchConnection('conn1', 'mongodb')
    const caps = useDriverCapabilitiesStore.getState().resolveCapabilities('conn1', 'mongodb')
    expect(caps?.session?.manualTransactions).toBe(true)
  })

  it('clears the connection overlay on disconnect', () => {
    useDriverCapabilitiesStore.setState({ byConnection: { conn1: { session: { manualTransactions: true } } } })
    useDriverCapabilitiesStore.getState().clearConnection('conn1')
    expect(useDriverCapabilitiesStore.getState().byConnection.conn1).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/driver-capabilities-store.test.ts`
Expected: FAIL — `byConnection` / `resolveCapabilities` / `fetchConnection` / `clearConnection` undefined.

- [ ] **Step 3: Rewrite the store**

```ts
// src/renderer/src/stores/driver-capabilities.ts
import { create } from 'zustand'
import type { IpcChannelMap } from '@shared/ipc'
import { mergeCapabilities } from '@shared/driver-capabilities'
import type { RuntimeCapabilityOverlay } from '@shared/driver-capabilities'

export type DriverCapabilities = NonNullable<IpcChannelMap['db:driver-capabilities']['return']>

interface DriverCapsState {
  byType: Record<string, DriverCapabilities | null>
  /** Per-connection runtime overlays, keyed by profileId. Cleared on disconnect. */
  byConnection: Record<string, RuntimeCapabilityOverlay | null>
  inflight: Record<string, Promise<DriverCapabilities | null> | undefined>
  fetch: (type: string) => Promise<DriverCapabilities | null>
  get: (type: string) => DriverCapabilities | null | undefined
  /** Fetch + cache the per-connection overlay (after connect). */
  fetchConnection: (profileId: string, type: string) => Promise<void>
  /** Drop a connection's overlay (on disconnect). */
  clearConnection: (profileId: string) => void
  /** THE single capability accessor for components. Merges the connection
   *  overlay over the static type caps. Components never merge by hand. */
  resolveCapabilities: (profileId: string | null, type: string) => DriverCapabilities | null
}

export const useDriverCapabilitiesStore = create<DriverCapsState>((set, get) => ({
  byType: {},
  byConnection: {},
  inflight: {},

  get(type) {
    return get().byType[type]
  },

  async fetch(type) {
    const cached = get().byType[type]
    if (cached !== undefined) return cached
    const inflight = get().inflight[type]
    if (inflight) return inflight
    const p = window.electronAPI
      .invoke('db:driver-capabilities', type)
      .then((caps) => {
        set((s) => ({ byType: { ...s.byType, [type]: caps }, inflight: { ...s.inflight, [type]: undefined } }))
        return caps
      })
      .catch((err) => {
        set((s) => ({ inflight: { ...s.inflight, [type]: undefined } }))
        throw err
      })
    set((s) => ({ inflight: { ...s.inflight, [type]: p } }))
    return p
  },

  async fetchConnection(profileId, type) {
    await get().fetch(type) // ensure static caps are cached
    const overlay = await window.electronAPI.invoke('db:connection-capabilities', profileId)
    set((s) => ({ byConnection: { ...s.byConnection, [profileId]: overlay } }))
  },

  clearConnection(profileId) {
    set((s) => {
      const next = { ...s.byConnection }
      delete next[profileId]
      return { byConnection: next }
    })
  },

  resolveCapabilities(profileId, type) {
    const base = get().byType[type]
    if (!base) return base ?? null
    const overlay = profileId ? get().byConnection[profileId] : null
    return mergeCapabilities(base, overlay)
  },
}))
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/driver-capabilities-store.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Wire fetchConnection/clearConnection into the connection lifecycle**

In `src/renderer/src/stores/connections.ts`, after a successful `db:connect`, call `useDriverCapabilitiesStore.getState().fetchConnection(profileId, profile.type)`; in the `db:disconnect` path call `clearConnection(profileId)`. (Locate the connect/disconnect success branches; add these two lines. No behavior change for SQL drivers — the overlay resolves to `null`.)

- [ ] **Step 6: Run the store test again + commit**

Run: `pnpm test -- --run tests/unit/driver-capabilities-store.test.ts`
Expected: PASS.

```bash
git add src/renderer/src/stores/driver-capabilities.ts src/renderer/src/stores/connections.ts tests/unit/driver-capabilities-store.test.ts
git commit -m "feat(caps): resolveCapabilities selector + per-connection overlay cache"
```

---

# PHASE 2 — Transaction Runtime & UI

## Task 6: SQLite session runtime (real in-memory TDD)

**Files:**
- Modify: `src/main/plugins/bundled/sqlite/sqlite-adapter.ts`
- Test: `tests/unit/sqlite-session.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/sqlite-session.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { SqliteAdapter } from '../../src/main/plugins/bundled/sqlite/sqlite-adapter'

async function fresh(): Promise<SqliteAdapter> {
  const a = new SqliteAdapter({ database: ':memory:' })
  await a.connect()
  await a.query('CREATE TABLE t (id INTEGER PRIMARY KEY, v TEXT)')
  return a
}

describe('SqliteAdapter sessions', () => {
  let a: SqliteAdapter
  beforeEach(async () => { a = await fresh() })

  it('rollback discards uncommitted inserts in an auto-commit-off session', async () => {
    await a.openSession('s1', { autoCommit: false })
    await a.query("INSERT INTO t (v) VALUES ('x')", undefined, { sessionId: 's1' })
    await a.rollback('s1')
    const res = await a.query('SELECT count(*) AS c FROM t')
    expect((res.rows[0] as { c: number }).c).toBe(0)
  })

  it('commit persists inserts', async () => {
    await a.openSession('s1', { autoCommit: false })
    await a.query("INSERT INTO t (v) VALUES ('y')", undefined, { sessionId: 's1' })
    await a.commit('s1')
    const res = await a.query('SELECT count(*) AS c FROM t')
    expect((res.rows[0] as { c: number }).c).toBe(1)
  })

  it('closeSession rolls back an open transaction', async () => {
    await a.openSession('s1', { autoCommit: false })
    await a.query("INSERT INTO t (v) VALUES ('z')", undefined, { sessionId: 's1' })
    await a.closeSession('s1')
    const res = await a.query('SELECT count(*) AS c FROM t')
    expect((res.rows[0] as { c: number }).c).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/sqlite-session.test.ts`
Expected: FAIL — `openSession` is not a function.

- [ ] **Step 3: Implement sessions in SqliteAdapter**

better-sqlite3 is synchronous and single-connection, so a "session" is just transaction bookkeeping over the one db handle. Transaction control statements are issued with `this.db.prepare('BEGIN').run()` (the repo already drives sqlite via `prepare(...).run()`).

Add a sessions field:

```ts
  private sessions = new Map<string, { autoCommit: boolean; inTxn: boolean }>()
```

Change `query` to honor an open session's implicit transaction — at the top of `query`, after the `if (!this.db)` guard:

```ts
  async query(sql: string, params?: unknown[], opts?: { sessionId?: string }): Promise<QueryResult> {
    if (!this.db) throw new Error('Not connected')
    const session = opts?.sessionId ? this.sessions.get(opts.sessionId) : undefined
    if (session && !session.autoCommit && !session.inTxn) {
      this.db.prepare('BEGIN').run()
      session.inTxn = true
    }
    // ...existing prepare/run logic unchanged...
```

Add the session methods:

```ts
  async openSession(sessionId: string, opts?: { autoCommit?: boolean }): Promise<void> {
    if (!this.db) throw new Error('Not connected')
    if (this.sessions.has(sessionId)) return
    this.sessions.set(sessionId, { autoCommit: opts?.autoCommit ?? true, inTxn: false })
  }

  async closeSession(sessionId: string): Promise<void> {
    const s = this.sessions.get(sessionId)
    if (s?.inTxn && this.db) this.db.prepare('ROLLBACK').run()
    this.sessions.delete(sessionId)
  }

  async setAutoCommit(sessionId: string, enabled: boolean): Promise<void> {
    const s = this.sessions.get(sessionId)
    if (!s) return
    if (enabled && s.inTxn && this.db) { this.db.prepare('COMMIT').run(); s.inTxn = false }
    s.autoCommit = enabled
  }

  async beginTransaction(sessionId: string): Promise<void> {
    const s = this.requireSession(sessionId)
    if (s.inTxn || !this.db) return
    this.db.prepare('BEGIN').run()
    s.inTxn = true
  }

  async commit(sessionId: string): Promise<void> {
    const s = this.sessions.get(sessionId)
    if (s?.inTxn && this.db) { this.db.prepare('COMMIT').run(); s.inTxn = false }
  }

  async rollback(sessionId: string): Promise<void> {
    const s = this.sessions.get(sessionId)
    if (s?.inTxn && this.db) { this.db.prepare('ROLLBACK').run(); s.inTxn = false }
  }

  private requireSession(sessionId: string): { autoCommit: boolean; inTxn: boolean } {
    const s = this.sessions.get(sessionId)
    if (!s) throw new Error(`No open session '${sessionId}'`)
    return s
  }
```

In `disconnect()`, roll back any open sessions before closing:

```ts
  async disconnect(): Promise<void> {
    for (const [, s] of this.sessions) { if (s.inTxn && this.db) this.db.prepare('ROLLBACK').run() }
    this.sessions.clear()
    this.db?.close()
    this.db = null
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/sqlite-session.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/main/plugins/bundled/sqlite/sqlite-adapter.ts tests/unit/sqlite-session.test.ts
git commit -m "feat(sqlite): per-session transaction runtime"
```

---

## Task 7: PostgreSQL session runtime (pinned pool client)

**Files:**
- Modify: `src/main/plugins/bundled/postgresql/postgres-adapter.ts`
- Test: `tests/unit/postgres-session.test.ts`

- [ ] **Step 1: Write the failing test** (mock `pg` so no live server is needed)

```ts
// tests/unit/postgres-session.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const clientQueries: string[] = []
const fakeClient = { query: vi.fn(async (sql: string) => { clientQueries.push(sql); return { rows: [], fields: [], rowCount: 0 } }), release: vi.fn() }
const fakePool = { connect: vi.fn(async () => fakeClient), query: vi.fn(async () => ({ rows: [], fields: [], rowCount: 0 })), end: vi.fn() }

vi.mock('pg', () => ({ default: { Pool: vi.fn(() => fakePool) } }))

import { PostgresAdapter } from '../../src/main/plugins/bundled/postgresql/postgres-adapter'

beforeEach(() => { clientQueries.length = 0; fakeClient.query.mockClear(); fakeClient.release.mockClear() })

async function connected(): Promise<PostgresAdapter> {
  const a = new PostgresAdapter({ host: 'h', port: 5432, database: 'd' })
  await a.connect()
  return a
}

describe('PostgresAdapter sessions', () => {
  it('opening an auto-commit-off session pins a client and BEGINs lazily on first query', async () => {
    const a = await connected()
    await a.openSession('s1', { autoCommit: false })
    await a.query('INSERT INTO t VALUES (1)', undefined, { sessionId: 's1' })
    expect(clientQueries).toEqual(['BEGIN', 'INSERT INTO t VALUES (1)'])
  })

  it('beginTransaction injects only allowlisted isolation levels', async () => {
    const a = await connected()
    await a.openSession('s1', { autoCommit: false })
    await a.beginTransaction('s1', { isolationLevel: 'SERIALIZABLE', readOnly: true })
    expect(clientQueries).toContain('BEGIN ISOLATION LEVEL SERIALIZABLE READ ONLY')
  })

  it('beginTransaction rejects an unknown isolation level', async () => {
    const a = await connected()
    await a.openSession('s1', { autoCommit: false })
    await expect(a.beginTransaction('s1', { isolationLevel: 'DROP TABLE' })).rejects.toThrow(/isolation/i)
  })

  it('commit issues COMMIT and closeSession releases the client', async () => {
    const a = await connected()
    await a.openSession('s1', { autoCommit: false })
    await a.query('INSERT INTO t VALUES (1)', undefined, { sessionId: 's1' })
    await a.commit('s1')
    await a.closeSession('s1')
    expect(clientQueries).toContain('COMMIT')
    expect(fakeClient.release).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/postgres-session.test.ts`
Expected: FAIL — `openSession` not a function.

- [ ] **Step 3: Implement sessions in PostgresAdapter**

Add fields and an isolation allowlist:

```ts
  private sessions = new Map<string, { client: pg.PoolClient; autoCommit: boolean; inTxn: boolean }>()
  private static ISOLATION = new Set(['READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE'])
```

Extract result shaping into a private helper used by both the pooled and session paths (preserve the existing `dataTypeID` field mapping inside it):

```ts
  private shape(result: { rows?: Record<string, unknown>[]; fields?: { name: string; dataTypeID?: number }[]; rowCount?: number }, duration: number): QueryResult {
    const fields: FieldInfo[] = (result.fields ?? []).map((f) => ({ name: f.name, dataType: String(f.dataTypeID ?? ''), nullable: true }))
    return { rows: result.rows ?? [], fields, rowCount: result.rows?.length ?? 0, duration, affectedRows: result.rowCount ?? 0 }
  }
```

Change `query` to route by session:

```ts
  async query(sql: string, params?: unknown[], opts?: { sessionId?: string }): Promise<QueryResult> {
    if (!this.pool) throw new Error('Not connected')
    const session = opts?.sessionId ? this.sessions.get(opts.sessionId) : undefined
    const start = performance.now()
    if (session) {
      if (!session.autoCommit && !session.inTxn) { await session.client.query('BEGIN'); session.inTxn = true }
      const result = await session.client.query(sql, params)
      return this.shape(result, Math.round(performance.now() - start))
    }
    const result = await this.pool.query(sql, params)
    return this.shape(result, Math.round(performance.now() - start))
  }
```

Add session methods:

```ts
  async openSession(sessionId: string, opts?: { autoCommit?: boolean }): Promise<void> {
    if (!this.pool) throw new Error('Not connected')
    if (this.sessions.has(sessionId)) return
    const client = await this.pool.connect()
    this.sessions.set(sessionId, { client, autoCommit: opts?.autoCommit ?? true, inTxn: false })
  }

  async closeSession(sessionId: string): Promise<void> {
    const s = this.sessions.get(sessionId)
    if (!s) return
    try { if (s.inTxn) await s.client.query('ROLLBACK') } finally { s.client.release(); this.sessions.delete(sessionId) }
  }

  async setAutoCommit(sessionId: string, enabled: boolean): Promise<void> {
    const s = this.requireSession(sessionId)
    if (enabled && s.inTxn) { await s.client.query('COMMIT'); s.inTxn = false }
    s.autoCommit = enabled
  }

  async beginTransaction(sessionId: string, opts?: { isolationLevel?: string; readOnly?: boolean }): Promise<void> {
    const s = this.requireSession(sessionId)
    if (s.inTxn) return
    let stmt = 'BEGIN'
    if (opts?.isolationLevel) {
      if (!PostgresAdapter.ISOLATION.has(opts.isolationLevel)) throw new Error(`Unsupported isolation level: ${opts.isolationLevel}`)
      stmt += ` ISOLATION LEVEL ${opts.isolationLevel}`
    }
    if (opts?.readOnly) stmt += ' READ ONLY'
    await s.client.query(stmt)
    s.inTxn = true
  }

  async commit(sessionId: string): Promise<void> {
    const s = this.sessions.get(sessionId)
    if (s?.inTxn) { await s.client.query('COMMIT'); s.inTxn = false }
  }

  async rollback(sessionId: string): Promise<void> {
    const s = this.sessions.get(sessionId)
    if (s?.inTxn) { await s.client.query('ROLLBACK'); s.inTxn = false }
  }

  private requireSession(sessionId: string): { client: pg.PoolClient; autoCommit: boolean; inTxn: boolean } {
    const s = this.sessions.get(sessionId)
    if (!s) throw new Error(`No open session '${sessionId}'`)
    return s
  }
```

In `disconnect()`, release all pinned clients before ending the pool:

```ts
  async disconnect(): Promise<void> {
    for (const [, s] of this.sessions) { try { if (s.inTxn) await s.client.query('ROLLBACK') } catch { /* ignore */ } s.client.release() }
    this.sessions.clear()
    await this.pool?.end()
    this.pool = null
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/postgres-session.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/main/plugins/bundled/postgresql/postgres-adapter.ts tests/unit/postgres-session.test.ts
git commit -m "feat(postgres): pinned-client per-session transaction runtime"
```

---

## Task 8: Declare capabilities in the PG & SQLite plugins

**Files:**
- Modify: `src/main/plugins/bundled/postgresql/index.ts`
- Modify: `src/main/plugins/bundled/sqlite/index.ts`
- Test: `tests/unit/bundled-session-caps.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/bundled-session-caps.test.ts
import { describe, it, expect } from 'vitest'
import { DriverRegistryImpl } from '../../src/main/plugins/sdk/driver-registry'
import { activate as activatePg } from '../../src/main/plugins/bundled/postgresql/index'
import { activate as activateSqlite } from '../../src/main/plugins/bundled/sqlite/index'

function ctxWith(registry: DriverRegistryImpl) {
  const noop = () => ({ dispose() {} })
  return {
    drivers: registry, completions: { register: noop }, exporters: { register: noop },
    importers: { register: noop }, typeMappers: { register: noop },
  } as never
}

describe('bundled driver session capabilities', () => {
  it('postgresql declares manual transactions with isolation levels and readonly', () => {
    const r = new DriverRegistryImpl()
    activatePg(ctxWith(r))
    const s = r.get('postgresql')!.session!
    expect(s.manualTransactions).toBe(true)
    expect(s.isolationLevels).toContain('SERIALIZABLE')
    expect(s.readOnly).toBe(true)
  })

  it('sqlite declares manual transactions without isolation picker', () => {
    const r = new DriverRegistryImpl()
    activateSqlite(ctxWith(r))
    const s = r.get('sqlite')!.session!
    expect(s.manualTransactions).toBe(true)
    expect(s.isolationLevels).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/bundled-session-caps.test.ts`
Expected: FAIL — `session` is undefined on the factory.

- [ ] **Step 3: Add `session` to the PG driver registration**

In `src/main/plugins/bundled/postgresql/index.ts`, inside `ctx.drivers.register('postgresql', { ... })`, add:

```ts
    session: {
      autoCommit: true,
      manualTransactions: true,
      isolationLevels: ['READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE'],
      readOnly: true,
      transactionLabel: 'Transaction',
      rollbackKind: 'full',
    },
```

- [ ] **Step 4: Add `session` to the SQLite driver registration**

In `src/main/plugins/bundled/sqlite/index.ts`, inside `ctx.drivers.register('sqlite', { ... })`, add:

```ts
    session: {
      autoCommit: true,
      manualTransactions: true,
      transactionLabel: 'Transaction',
      rollbackKind: 'full',
    },
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/bundled-session-caps.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/main/plugins/bundled/postgresql/index.ts src/main/plugins/bundled/sqlite/index.ts tests/unit/bundled-session-caps.test.ts
git commit -m "feat(drivers): declare session capabilities for postgres + sqlite"
```

---

## Task 9: Per-tab transaction state in the tabs store

**Files:**
- Modify: `shared/types.ts` (add `QueryTabTxnState`, `QueryTab.txn`, `ConnectionProfile.defaultAutoCommit`)
- Modify: `src/renderer/src/stores/tabs.ts`
- Test: `tests/unit/tabs-txn.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/tabs-txn.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useTabsStore } from '../../src/renderer/src/stores/tabs'
import type { QueryTab } from '../../shared/types'

function activeQueryTab(): QueryTab {
  const s = useTabsStore.getState()
  return s.tabs.find((t) => t.id === s.activeTabId) as QueryTab
}

describe('tabs store transaction state', () => {
  beforeEach(() => useTabsStore.setState({ tabs: [], activeTabId: null, recentlyClosed: [] }))

  it('new query tab defaults to auto-commit on, status none', () => {
    useTabsStore.getState().addQueryTab('conn1')
    expect(activeQueryTab().txn).toEqual({ autoCommit: true, status: 'none', readOnly: false })
  })

  it('addQueryTab honors an explicit autoCommit:false default', () => {
    useTabsStore.getState().addQueryTab('conn1', null, { autoCommit: false })
    expect(activeQueryTab().txn?.autoCommit).toBe(false)
  })

  it('setTabAutoCommit + setTabTxnStatus update only the target tab', () => {
    const id = useTabsStore.getState().addQueryTab('conn1')
    useTabsStore.getState().setTabAutoCommit(id, false)
    useTabsStore.getState().setTabTxnStatus(id, 'active')
    expect(activeQueryTab().txn).toMatchObject({ autoCommit: false, status: 'active' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/tabs-txn.test.ts`
Expected: FAIL — `txn` undefined / `setTabAutoCommit` not a function.

- [ ] **Step 3: Add shared types**

In `shared/types.ts`, add near `QueryTab`:

```ts
export interface QueryTabTxnState {
  autoCommit: boolean
  status: 'none' | 'active'
  isolationLevel?: string
  readOnly: boolean
}
```

Add `txn?: QueryTabTxnState` to the `QueryTab` interface, and `defaultAutoCommit?: boolean` to `ConnectionProfile`.

- [ ] **Step 4: Update the tabs store**

In `src/renderer/src/stores/tabs.ts`, change `createQueryTab` to accept an option and seed `txn`:

```ts
function createQueryTab(connectionId: string | null, schema: string | null = null, opts?: { autoCommit?: boolean }): QueryTab {
  tabCounter++
  return {
    // ...existing fields...
    txn: { autoCommit: opts?.autoCommit ?? true, status: 'none', readOnly: false },
  }
}
```

Change `addQueryTab` to `(connectionId, schema = null, opts?: { autoCommit?: boolean })` and pass `opts` through to `createQueryTab`. Update the `addQueryTab` signature in the `TabsState` interface to `(connectionId: string | null, schema?: string | null, opts?: { autoCommit?: boolean }) => string`.

Add these actions to the store object:

```ts
  setTabAutoCommit: (id, autoCommit) => set((s) => ({
    tabs: s.tabs.map((t) => t.id === id && t.type === 'query' && t.txn ? { ...t, txn: { ...t.txn, autoCommit } } : t),
  })),
  setTabTxnStatus: (id, status) => set((s) => ({
    tabs: s.tabs.map((t) => t.id === id && t.type === 'query' && t.txn ? { ...t, txn: { ...t.txn, status } } : t),
  })),
  setTabIsolation: (id, isolationLevel) => set((s) => ({
    tabs: s.tabs.map((t) => t.id === id && t.type === 'query' && t.txn ? { ...t, txn: { ...t.txn, isolationLevel } } : t),
  })),
  setTabReadOnly: (id, readOnly) => set((s) => ({
    tabs: s.tabs.map((t) => t.id === id && t.type === 'query' && t.txn ? { ...t, txn: { ...t.txn, readOnly } } : t),
  })),
```

Add the matching signatures in the `TabsState` interface:

```ts
  setTabAutoCommit: (id: string, autoCommit: boolean) => void
  setTabTxnStatus: (id: string, status: 'none' | 'active') => void
  setTabIsolation: (id: string, isolationLevel: string) => void
  setTabReadOnly: (id: string, readOnly: boolean) => void
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/tabs-txn.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add shared/types.ts src/renderer/src/stores/tabs.ts tests/unit/tabs-txn.test.ts
git commit -m "feat(tabs): per-tab transaction state + actions"
```

---

## Task 10: Default auto-commit from the connection profile

**Files:**
- Create: `src/renderer/src/lib/initial-autocommit.ts`
- Modify: the call site that opens a query tab for a connection
- Modify: the connection-form view (add a "Default auto-commit" control) — verify field controls via MCP
- Test: `tests/unit/tabs-txn-default.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/tabs-txn-default.test.ts
import { describe, it, expect } from 'vitest'
import { initialAutoCommit } from '../../src/renderer/src/lib/initial-autocommit'
import type { ConnectionProfile } from '../../shared/types'

const base = { id: 'c', name: 'c', type: 'postgresql', database: 'd', color: '#fff' } as ConnectionProfile

describe('initialAutoCommit', () => {
  it('defaults to true when the profile does not set it', () => {
    expect(initialAutoCommit(base)).toBe(true)
  })
  it('honors defaultAutoCommit:false', () => {
    expect(initialAutoCommit({ ...base, defaultAutoCommit: false })).toBe(false)
  })
  it('defaults to true for a null profile', () => {
    expect(initialAutoCommit(null)).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/tabs-txn-default.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create the helper**

```ts
// src/renderer/src/lib/initial-autocommit.ts
import type { ConnectionProfile } from '@shared/types'

/** The auto-commit mode a freshly opened query tab inherits from its
 *  connection profile. Absent ⇒ on (safe default). */
export function initialAutoCommit(profile: ConnectionProfile | null): boolean {
  return profile?.defaultAutoCommit ?? true
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/tabs-txn-default.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Use it at the tab-open call site**

Find where query tabs are opened for a connection (e.g. the sidebar "new query" action / `addQueryTab` callers). Pass the resolved default:

```ts
import { initialAutoCommit } from '@/lib/initial-autocommit'
// ...
const profile = useConnectionsStore.getState().profiles.find((p) => p.id === connectionId) ?? null
addQueryTab(connectionId, schema, { autoCommit: initialAutoCommit(profile) })
```

- [ ] **Step 6: Add the "Default auto-commit" control to the connection form**

In the connection-form view, add a boolean control bound to `profile.defaultAutoCommit`. **Verify the toggle/checkbox primitive and its props via the `your-project-sb-mcp` MCP** (`get-documentation` for the form primitive) before writing it — do not assume prop names.

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/lib/initial-autocommit.ts tests/unit/tabs-txn-default.test.ts
# plus the connection-form + call-site files you edited
git commit -m "feat(tabs): inherit default auto-commit from connection profile"
```

---

## Task 11: TransactionToolbar component + story

**Files:**
- Create: `src/renderer/src/components/query/TransactionToolbar.tsx`
- Create: `src/renderer/src/components/query/TransactionToolbar.stories.tsx`

- [ ] **Step 1: Look up primitives via MCP (required, before writing code)**

Use `your-project-sb-mcp`: `list-all-documentation`, then `get-documentation` for the button, toggle/switch, select/dropdown, and badge/pill primitives. Note exact component names and prop names. Also run `get-storybook-story-instructions` for current story conventions. Do not proceed until prop names are confirmed.

- [ ] **Step 2: Write the component**

Pure presentational — all state/handlers passed in, so it's trivially story-able. The contract:

```tsx
// src/renderer/src/components/query/TransactionToolbar.tsx
import type { DriverCapabilities } from '@/stores/driver-capabilities'
import type { QueryTabTxnState } from '@shared/types'

export interface TransactionToolbarProps {
  caps: DriverCapabilities['session'] | undefined
  txn: QueryTabTxnState
  onToggleAutoCommit: (enabled: boolean) => void
  onCommit: () => void
  onRollback: () => void
  onIsolationChange?: (level: string) => void
  onReadOnlyChange?: (readOnly: boolean) => void
}

export function TransactionToolbar(props: TransactionToolbarProps): JSX.Element | null {
  const { caps, txn } = props
  if (!caps?.autoCommit && !caps?.manualTransactions) return null // driver has no txn UX
  const txnLabel = caps.transactionLabel ?? 'Transaction'
  const rollbackLabel = caps.rollbackKind === 'discard' ? 'Discard' : 'Rollback'
  const active = txn.status === 'active'
  // Render with the MCP-verified primitives:
  //  - auto-commit toggle  (shown when caps.autoCommit), bound to txn.autoCommit → onToggleAutoCommit
  //  - Commit button       (shown when caps.manualTransactions, disabled unless active) → onCommit
  //  - Rollback/Discard btn (label = rollbackLabel, disabled unless active) → onRollback
  //  - status pill          (active ? `${txnLabel} active` : 'Auto-commit' / 'Idle'),
  //                         warning tint when active && !txn.autoCommit
  //  - isolation select     (shown when caps.isolationLevels), options = caps.isolationLevels → onIsolationChange
  //  - read-only toggle     (shown when caps.readOnly), bound to txn.readOnly → onReadOnlyChange
  // ...JSX using the confirmed primitive props...
}
```

Implement the JSX with the confirmed primitives. The visibility rules above are the contract; keep ALL branching on **capability flags**, never on db type.

- [ ] **Step 3: Write the story** (follow `get-storybook-story-instructions` conventions)

Separate stories: `AutoCommitOnly` (caps `manualTransactions:false`), `FullTransaction` (idle), `FullTransactionActive` (status active), `RedisStyle` (`rollbackKind:'discard'`, `transactionLabel:'MULTI/EXEC'`), `WithIsolationAndReadOnly`.

- [ ] **Step 4: Run story tests**

Use the Storybook MCP `run-story-tests` tool (per CLAUDE.md), or `pnpm test` (the Storybook test project validates stories + a11y).
Expected: PASS — stories render, no a11y violations.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/query/TransactionToolbar.tsx src/renderer/src/components/query/TransactionToolbar.stories.tsx
git commit -m "feat(ui): TransactionToolbar component + stories"
```

---

## Task 12: Wire the toolbar into the query editor

**Files:**
- Modify: `src/renderer/src/components/query/QueryPanel.tsx` (the query editor host — confirm exact file)

- [ ] **Step 1: Resolve caps + derive a stable sessionId per tab**

In the query panel, derive `sessionId = tab.id` and resolve capabilities via the single selector:

```tsx
const caps = useDriverCapabilitiesStore((s) => s.resolveCapabilities(tab.connectionId, connectionType))
```

(Resolve `connectionType` from the active connection profile, as the panel already does for other capability reads.)

- [ ] **Step 2: Implement the handlers (IPC calls)**

```tsx
const setAutoCommit = useTabsStore((s) => s.setTabAutoCommit)
const setTxnStatus = useTabsStore((s) => s.setTabTxnStatus)

async function onToggleAutoCommit(enabled: boolean) {
  if (!tab.connectionId) return
  if (!enabled) {
    await window.electronAPI.invoke('db:session:open', tab.connectionId, tab.id, { autoCommit: false })
  } else {
    await window.electronAPI.invoke('db:session:set-autocommit', tab.connectionId, tab.id, true)
    await window.electronAPI.invoke('db:session:close', tab.connectionId, tab.id)
    setTxnStatus(tab.id, 'none')
  }
  setAutoCommit(tab.id, enabled)
}

async function onCommit() {
  if (!tab.connectionId) return
  await window.electronAPI.invoke('db:txn:commit', tab.connectionId, tab.id)
  setTxnStatus(tab.id, 'none')
}
async function onRollback() {
  if (!tab.connectionId) return
  await window.electronAPI.invoke('db:txn:rollback', tab.connectionId, tab.id)
  setTxnStatus(tab.id, 'none')
}
```

- [ ] **Step 3: Pass `sessionId` when executing a query in a non-auto-commit tab**

Wherever the panel calls `db:query`, pass the session + flip status to active when auto-commit is off:

```tsx
const opts = tab.txn && !tab.txn.autoCommit ? { sessionId: tab.id } : undefined
const result = await window.electronAPI.invoke('db:query', tab.connectionId, sql, params, opts)
if (opts) setTxnStatus(tab.id, 'active')
```

- [ ] **Step 4: Render the toolbar**

Mount `<TransactionToolbar caps={caps?.session} txn={tab.txn!} ... />` in the editor header. Wire `onIsolationChange`/`onReadOnlyChange` to `setTabIsolation`/`setTabReadOnly`; pass those values into the next `db:txn:begin` call when a txn is started explicitly.

- [ ] **Step 5: Verify in the running app**

Use the `verify` (or `run`) skill: connect to a local Postgres, turn auto-commit off, INSERT, confirm the row is invisible to a second auto-commit tab until Commit; Rollback discards. Repeat against a SQLite file.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/components/query/QueryPanel.tsx
git commit -m "feat(ui): wire transaction toolbar + per-tab sessions into query editor"
```

---

## Task 13: Close-guard for open transactions

**Files:**
- Modify: `src/renderer/src/stores/tab-actions.ts`
- Modify: the query panel's `tabActions.register(...)` call
- Modify: `src/renderer/src/App.tsx` close-confirm wiring — confirm dialog via MCP-verified primitive
- Test: `tests/unit/tab-actions-txn.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/tab-actions-txn.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { tabActions } from '../../src/renderer/src/stores/tab-actions'

describe('tabActions transaction guard', () => {
  beforeEach(() => tabActions.unregister('t1'))

  it('hasOpenTransaction reflects the registered txnStatus', () => {
    tabActions.register('t1', { txnStatus: () => 'active' })
    expect(tabActions.hasOpenTransaction('t1')).toBe(true)
  })

  it('hasOpenTransaction is false when no handler registered', () => {
    expect(tabActions.hasOpenTransaction('t1')).toBe(false)
  })

  it('commitTransaction delegates to the registered handler', async () => {
    const commit = vi.fn()
    tabActions.register('t1', { commitTransaction: commit })
    await tabActions.commitTransaction('t1')
    expect(commit).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/tab-actions-txn.test.ts`
Expected: FAIL — `hasOpenTransaction` not a function.

- [ ] **Step 3: Extend the registry**

In `src/renderer/src/stores/tab-actions.ts`, add to the `TabActions` interface:

```ts
  /** Returns 'active' when the tab has an open, uncommitted transaction. */
  txnStatus?: () => 'none' | 'active'
  commitTransaction?: () => void | Promise<void>
  rollbackTransaction?: () => void | Promise<void>
```

Add to the `tabActions` object:

```ts
  hasOpenTransaction(tabId: string): boolean {
    return handlers.get(tabId)?.txnStatus?.() === 'active'
  },
  async commitTransaction(tabId: string): Promise<void> {
    await handlers.get(tabId)?.commitTransaction?.()
  },
  async rollbackTransaction(tabId: string): Promise<void> {
    await handlers.get(tabId)?.rollbackTransaction?.()
  },
```

Extend `requestCloseTab` so an open transaction also raises the pending-close dialog:

```ts
export function requestCloseTab(tabId: string, actuallyClose: (id: string) => void): void {
  if (tabActions.isDirty(tabId) || tabActions.hasOpenTransaction(tabId)) {
    usePendingClose.getState().request(tabId)
  } else {
    actuallyClose(tabId)
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/tab-actions-txn.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Register the handlers in the query panel**

In the query panel's `tabActions.register(tab.id, { ... })` call, add `txnStatus: () => tab.txn?.status ?? 'none'`, `commitTransaction: onCommit`, `rollbackTransaction: onRollback`.

- [ ] **Step 6: Update the close-confirm dialog (App.tsx)**

When the pending-close tab `hasOpenTransaction`, the dialog must offer **Commit / Rollback / Cancel** (not just Discard/Cancel). Wire the buttons to `tabActions.commitTransaction` / `tabActions.rollbackTransaction`, then close the tab. After commit/rollback, call `db:session:close` so the pinned client is released. **Verify the dialog/button primitives via the MCP** before editing.

- [ ] **Step 7: Run the full suite + commit**

Run: `pnpm test`
Expected: PASS — full unit + storybook suite green.

```bash
git add src/renderer/src/stores/tab-actions.ts src/renderer/src/components/query/QueryPanel.tsx src/renderer/src/App.tsx tests/unit/tab-actions-txn.test.ts
git commit -m "feat(ui): close-guard for tabs with an open transaction"
```

---

# Self-Review (completed during authoring)

- **Spec coverage:** §1 framework → Tasks 1–3; §2 runtime → Tasks 6,7; serialization/overlay → Tasks 2,4,5; §4 UX (toolbar, tabs state, default mode, close-guard) → Tasks 9–13; §5 PG+SQLite caps → Task 8; §5 overlay isolation → Tasks 1,4,5. EXPLAIN (§3/§4.4), the sessions panel (§4.5), and MySQL/Snowflake/Mongo/Redis (§5) are intentionally deferred to the follow-on plans below.
- **Type consistency:** `DriverCapabilities`, `SessionCapability`, `SessionOpts`, `RuntimeCapabilityOverlay`, `mergeCapabilities`, `serializeStaticCapabilities`, `QueryTabTxnState`, `resolveCapabilities`, and the `openSession/closeSession/setAutoCommit/beginTransaction/commit/rollback` method names are used identically across tasks. The `query(sql, params?, opts?)` signature is consistent in the adapter interface, IPC, handlers, and call sites.
- **Placeholders:** UI tasks (10, 11, 13) intentionally gate primitive props behind the `your-project-sb-mcp` MCP per the project's overriding CLAUDE.md rule; the component contract (props, visibility rules, states) is fully specified so the structure is unambiguous.

---

# Follow-on plans (write after this foundation lands)

Each produces working, testable software on its own and is unblocked by this plan:

1. **EXPLAIN execution plans** — add `db:explain` + `ExplainResult`/`ExplainNode`, `explain()` on PG (`FORMAT JSON`, analyze) and SQLite (`EXPLAIN QUERY PLAN`, text). **Must reconcile with the existing `src/renderer/src/lib/plan-parser.ts`, `components/query-plan/{QueryPlanView,PlanNode}.tsx`, and the `tab-actions.explainStatement` hook** rather than duplicate them. Lean tree for v1; the rich visualizer (per-node timing bars, % of total) is documented future work in the spec.
2. **Active sessions panel** — `db:sessions:list` / `db:sessions:kill` + `DbSession`, a panel via `PanelRegistry`/`UIRegistry`, with `isCurrent` self-kill protection. PG (`pg_stat_activity`/`pg_terminate_backend`) + MySQL first.
3. **Remaining drivers** — MySQL (pinned `mysql2` connection, 4 isolation levels, `SHOW PROCESSLIST`/`KILL`), Snowflake (session `AUTOCOMMIT`, READ COMMITTED only), MongoDB (replica-set sessions via the **runtime overlay**, `transactionLabel:"Session"`, `currentOp`/`killOp`), Redis (`MULTI`/`EXEC`/`DISCARD`, `rollbackKind:'discard'`, `CLIENT LIST`/`KILL`). Each lights up by declaring capabilities + implementing the optional adapter methods; verify each client library's transaction/session API during implementation.
