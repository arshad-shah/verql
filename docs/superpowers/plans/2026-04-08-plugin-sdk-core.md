# Plugin SDK Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build production-grade plugin SDK infrastructure with a 5-phase boot coordinator, typed registries, runtime safety (safeCall, error budgets, timeouts), and PluginContext — without bundled plugins.

**Architecture:** Layered SDK on top of existing plugin-host. New `src/main/plugins/sdk/` directory adds PluginContext, registries, and runtime safety. The existing plugin-host becomes the PluginBootCoordinator with phased loading. Integration points in `factory.ts` and `ipc-handlers.ts` are updated minimally.

**Tech Stack:** TypeScript, Electron, Vitest

**Spec:** `docs/superpowers/specs/2026-04-08-plugin-sdk-core-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `src/main/plugins/sdk/types.ts` | Public SDK types: PluginContext, Disposable, PluginStatus, PluginPhase, registry interfaces, ErrorBudget types |
| `src/main/plugins/sdk/safe-call.ts` | `safeCall()` wrapper, `ErrorBudget` class, timeout enforcement |
| `src/main/plugins/sdk/driver-registry.ts` | `DriverRegistryImpl` — stores driver factories and connection middleware |
| `src/main/plugins/sdk/command-registry.ts` | `CommandRegistryImpl` — stores command handlers |
| `src/main/plugins/sdk/panel-registry.ts` | `PanelRegistryImpl` — stores panel contributions |
| `src/main/plugins/sdk/schema-access.ts` | `SchemaAccessImpl` — read-only proxy to adapter schema methods |
| `src/main/plugins/sdk/connection-access.ts` | `ConnectionAccessImpl` — read-only connection proxy + query |
| `src/main/plugins/sdk/settings.ts` | `PluginSettingsImpl` — scoped plugin settings on top of ConfigStore |
| `src/main/plugins/sdk/index.ts` | `createPluginContext()` factory |
| `tests/unit/safe-call.test.ts` | Tests for safeCall, timeout, error budget |
| `tests/unit/driver-registry.test.ts` | Tests for driver registry |
| `tests/unit/command-registry.test.ts` | Tests for command registry |
| `tests/unit/panel-registry.test.ts` | Tests for panel registry |
| `tests/unit/manifest-validation.test.ts` | Tests for manifest validation |
| `tests/unit/plugin-boot.test.ts` | Tests for boot coordinator phases |

### Modified Files

| File | Change |
|------|--------|
| `src/main/plugins/types.ts` | Add new contributes fields, PluginStatus, rework LoadedPlugin |
| `src/main/plugins/plugin-host.ts` | Rewrite to PluginBootCoordinator with 5-phase boot |
| `shared/types.ts` | `DatabaseType` becomes extensible with `(string & {})` |
| `shared/ipc.ts` | Expand `plugins:list` return type, add `plugins:errors` channel |
| `src/main/db/factory.ts` | Default case checks driver registry |
| `src/main/ipc-handlers.ts` | Use boot coordinator, add middleware chain to `db:connect` |

---

### Task 1: SDK Types

**Files:**
- Create: `src/main/plugins/sdk/types.ts`

- [ ] **Step 1: Create the SDK types file**

```typescript
// src/main/plugins/sdk/types.ts
import type { ConnectionProfile, QueryResult, SchemaTable, SchemaColumn, SchemaIndex } from '@shared/types'
import type { DbAdapter } from '../../db/adapter'

// ─── Core ────────────────────────────────────────────────────────────────────

export interface Disposable {
  dispose(): void
}

export type PluginPhase = 'discover' | 'validate' | 'resolve' | 'activate' | 'verify' | 'runtime'

export type PluginStatus =
  | { state: 'discovered' }
  | { state: 'validated' }
  | { state: 'resolved' }
  | { state: 'activating' }
  | { state: 'active'; contributions: string[] }
  | { state: 'error'; error: string; phase: PluginPhase }
  | { state: 'degraded'; error: string; contributions: string[] }
  | { state: 'inactive' }

export interface PluginErrorRecord {
  timestamp: number
  error: string
  stack?: string
}

// ─── Plugin Context ──────────────────────────────────────────────────────────

export interface PluginContext {
  drivers: DriverRegistry
  commands: CommandRegistry
  panels: PanelRegistry
  schema: SchemaAccess
  connections: ConnectionAccess
  settings: PluginSettings
  subscriptions: Disposable[]
}

// ─── Driver Registry ─────────────────────────────────────────────────────────

export interface DriverRegistry {
  register(id: string, factory: DriverFactory): Disposable
  registerConnectionMiddleware(id: string, middleware: ConnectionMiddleware): Disposable
}

export interface DriverFactory {
  createAdapter(config: Record<string, unknown>): DbAdapter
  connectionFields: ConnectionField[]
}

export interface ConnectionField {
  key: string
  label: string
  type: 'text' | 'password' | 'number' | 'boolean' | 'file'
  required?: boolean
  default?: string | number | boolean
  group?: string
}

export interface ConnectionMiddleware {
  shouldApply(profile: ConnectionProfile): boolean
  beforeConnect(profile: ConnectionProfile): Promise<ConnectionProfile>
  onDisconnect(profileId: string): Promise<void>
}

// ─── Command Registry ────────────────────────────────────────────────────────

export interface CommandRegistry {
  register(id: string, handler: () => void | Promise<void>): Disposable
}

// ─── Panel Registry ──────────────────────────────────────────────────────────

export interface PanelRegistry {
  register(id: string, panel: PanelContribution): Disposable
}

export interface PanelContribution {
  title: string
  icon: string
  location: 'sidebar' | 'bottom'
  render(): string
}

// ─── Schema Access ───────────────────────────────────────────────────────────

export interface SchemaSummary {
  tables: {
    name: string
    columns: {
      name: string
      dataType: string
      isPrimaryKey: boolean
      isForeignKey: boolean
      references?: { table: string; column: string }
    }[]
  }[]
}

export interface SchemaAccess {
  getTables(connectionId: string, schema?: string): Promise<SchemaTable[]>
  getColumns(connectionId: string, table: string, schema?: string): Promise<SchemaColumn[]>
  getIndexes(connectionId: string, table: string, schema?: string): Promise<SchemaIndex[]>
  getSchemas(connectionId: string): Promise<string[]>
  getDatabases(connectionId: string): Promise<string[]>
  getSchemaSummary(connectionId: string, schema?: string): Promise<SchemaSummary>
}

// ─── Connection Access ───────────────────────────────────────────────────────

export interface ConnectionAccess {
  getActiveConnectionId(): string | null
  getProfile(connectionId: string): ConnectionProfile | null
  query(connectionId: string, sql: string, params?: unknown[]): Promise<QueryResult>
  onActiveConnectionChanged(listener: (id: string | null) => void): Disposable
}

// ─── Plugin Settings ─────────────────────────────────────────────────────────

export interface PluginSettings {
  get<T>(key: string): T | undefined
  set(key: string, value: unknown): void
  onChanged(key: string, listener: (value: unknown) => void): Disposable
}

// ─── Boot Report ─────────────────────────────────────────────────────────────

export interface BootReport {
  total: number
  active: number
  degraded: number
  failed: number
  plugins: { name: string; status: PluginStatus; durationMs: number }[]
}
```

- [ ] **Step 2: Commit**

```bash
git add src/main/plugins/sdk/types.ts
git commit -m "feat(plugins): add SDK public types"
```

---

### Task 2: Extend Manifest Types

**Files:**
- Modify: `src/main/plugins/types.ts`
- Modify: `shared/types.ts:1`

- [ ] **Step 1: Rewrite the manifest types file**

Replace the entire contents of `src/main/plugins/types.ts`:

```typescript
// src/main/plugins/types.ts
import type { PluginStatus, PluginContext } from './sdk/types'

export interface PluginManifest {
  name: string
  version: string
  displayName: string
  description: string
  main: string
  contributes: {
    drivers?: DriverContribution[]
    themes?: ThemeContribution[]
    commands?: CommandContribution[]
    exporters?: ExporterContribution[]
    importers?: ImporterContribution[]
    connectionMiddleware?: { id: string }[]
    connectionFields?: ConnectionFieldContribution[]
    panels?: PanelContributionManifest[]
    settings?: SettingContribution[]
  }
}

export interface DriverContribution {
  id: string
  name: string
  icon?: string
}

export interface ThemeContribution {
  id: string
  name: string
  type: 'dark' | 'light'
}

export interface CommandContribution {
  id: string
  title: string
  keybinding?: string
}

export interface ExporterContribution {
  id: string
  name: string
  extension: string
}

export interface ImporterContribution {
  id: string
  name: string
  extensions: string[]
}

export interface ConnectionFieldContribution {
  key: string
  label: string
  type: 'text' | 'password' | 'number' | 'boolean' | 'file'
  required?: boolean
  default?: string | number | boolean
  group?: string
}

export interface PanelContributionManifest {
  id: string
  title: string
  icon: string
  location: 'sidebar' | 'bottom'
}

export interface SettingContribution {
  key: string
  title: string
  type: 'text' | 'password' | 'number' | 'boolean'
  default?: string | number | boolean
}

export interface LoadedPlugin {
  manifest: PluginManifest
  path: string
  status: PluginStatus
  module?: { activate: (ctx: PluginContext) => void | Promise<void>; deactivate?: () => void | Promise<void> }
  context?: PluginContext
}
```

- [ ] **Step 2: Extend DatabaseType in shared/types.ts**

In `shared/types.ts`, change line 1 from:

```typescript
export type DatabaseType = 'postgresql' | 'mysql' | 'sqlite'
```

to:

```typescript
export type DatabaseType = 'postgresql' | 'mysql' | 'sqlite' | (string & {})
```

- [ ] **Step 3: Run the existing tests to verify nothing breaks**

Run: `npx vitest run`
Expected: All existing tests pass (the `(string & {})` pattern preserves autocomplete for known types while accepting any string).

- [ ] **Step 4: Commit**

```bash
git add src/main/plugins/types.ts shared/types.ts
git commit -m "feat(plugins): extend manifest types and make DatabaseType extensible"
```

---

### Task 3: safeCall, Timeout, and Error Budget

**Files:**
- Create: `src/main/plugins/sdk/safe-call.ts`
- Create: `tests/unit/safe-call.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/unit/safe-call.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { safeCall, ErrorBudget, PluginError } from '../../src/main/plugins/sdk/safe-call'

describe('safeCall', () => {
  it('returns the result of a successful sync function', async () => {
    const result = await safeCall('test-plugin', () => 42)
    expect(result).toBe(42)
  })

  it('returns the result of a successful async function', async () => {
    const result = await safeCall('test-plugin', async () => 'hello')
    expect(result).toBe('hello')
  })

  it('wraps thrown errors in PluginError', async () => {
    await expect(
      safeCall('test-plugin', () => { throw new Error('boom') })
    ).rejects.toThrow(PluginError)
  })

  it('includes plugin name in PluginError', async () => {
    try {
      await safeCall('my-plugin', () => { throw new Error('boom') })
    } catch (err) {
      expect(err).toBeInstanceOf(PluginError)
      expect((err as PluginError).pluginName).toBe('my-plugin')
      expect((err as PluginError).message).toContain('boom')
    }
  })

  it('rejects with timeout error when function exceeds timeoutMs', async () => {
    await expect(
      safeCall('slow-plugin', () => new Promise(r => setTimeout(r, 5000)), { timeoutMs: 50 })
    ).rejects.toThrow(/timed out/)
  }, 10_000)

  it('does not timeout when function completes in time', async () => {
    const result = await safeCall('fast-plugin', async () => {
      await new Promise(r => setTimeout(r, 10))
      return 'done'
    }, { timeoutMs: 5000 })
    expect(result).toBe('done')
  })
})

describe('ErrorBudget', () => {
  let budget: ErrorBudget

  beforeEach(() => {
    budget = new ErrorBudget({ maxErrors: 3, windowMs: 1000 })
  })

  it('starts with no errors', () => {
    expect(budget.isExceeded('test')).toBe(false)
    expect(budget.getErrors('test')).toEqual([])
  })

  it('records errors and returns false when under budget', () => {
    const exceeded = budget.record('test', new Error('err1'))
    expect(exceeded).toBe(false)
    expect(budget.getErrors('test')).toHaveLength(1)
  })

  it('returns true when error budget is exceeded', () => {
    budget.record('test', new Error('err1'))
    budget.record('test', new Error('err2'))
    const exceeded = budget.record('test', new Error('err3'))
    expect(exceeded).toBe(true)
    expect(budget.isExceeded('test')).toBe(true)
  })

  it('tracks errors per plugin independently', () => {
    budget.record('plugin-a', new Error('err'))
    budget.record('plugin-a', new Error('err'))
    budget.record('plugin-b', new Error('err'))
    expect(budget.isExceeded('plugin-a')).toBe(false)
    expect(budget.isExceeded('plugin-b')).toBe(false)
  })

  it('resets errors for a plugin', () => {
    budget.record('test', new Error('err1'))
    budget.record('test', new Error('err2'))
    budget.reset('test')
    expect(budget.getErrors('test')).toEqual([])
    expect(budget.isExceeded('test')).toBe(false)
  })

  it('expires old errors outside the window', async () => {
    const shortBudget = new ErrorBudget({ maxErrors: 2, windowMs: 50 })
    shortBudget.record('test', new Error('old'))
    shortBudget.record('test', new Error('old'))
    // Wait for window to expire
    await new Promise(r => setTimeout(r, 100))
    const exceeded = shortBudget.record('test', new Error('new'))
    expect(exceeded).toBe(false)
    // Only the new error remains within the window
    expect(shortBudget.getErrors('test').length).toBeGreaterThanOrEqual(1)
  })

  it('stores error details with timestamp and stack', () => {
    const err = new Error('test error')
    budget.record('test', err)
    const errors = budget.getErrors('test')
    expect(errors[0].error).toBe('test error')
    expect(errors[0].timestamp).toBeTypeOf('number')
    expect(errors[0].stack).toBeTypeOf('string')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/safe-call.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement safeCall and ErrorBudget**

```typescript
// src/main/plugins/sdk/safe-call.ts
import type { PluginErrorRecord } from './types'

export class PluginError extends Error {
  constructor(
    public readonly pluginName: string,
    public readonly cause: Error
  ) {
    super(`Plugin '${pluginName}': ${cause.message}`)
    this.name = 'PluginError'
  }
}

export async function safeCall<T>(
  pluginName: string,
  fn: () => T | Promise<T>,
  options?: { timeoutMs?: number }
): Promise<T> {
  const timeoutMs = options?.timeoutMs

  try {
    if (timeoutMs == null) {
      return await fn()
    }

    return await new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new PluginError(pluginName, new Error(
          `timed out during operation after ${timeoutMs}ms`
        )))
      }, timeoutMs)

      Promise.resolve(fn())
        .then(result => {
          clearTimeout(timer)
          resolve(result)
        })
        .catch(err => {
          clearTimeout(timer)
          reject(err instanceof PluginError ? err : new PluginError(pluginName, err instanceof Error ? err : new Error(String(err))))
        })
    })
  } catch (err) {
    if (err instanceof PluginError) throw err
    const cause = err instanceof Error ? err : new Error(String(err))
    throw new PluginError(pluginName, cause)
  }
}

export class ErrorBudget {
  private maxErrors: number
  private windowMs: number
  private errors = new Map<string, PluginErrorRecord[]>()

  constructor(options?: { maxErrors?: number; windowMs?: number }) {
    this.maxErrors = options?.maxErrors ?? 5
    this.windowMs = options?.windowMs ?? 60_000
  }

  record(pluginName: string, error: Error): boolean {
    const records = this.errors.get(pluginName) ?? []
    records.push({
      timestamp: Date.now(),
      error: error.message,
      stack: error.stack
    })
    this.errors.set(pluginName, records)
    return this.isExceeded(pluginName)
  }

  isExceeded(pluginName: string): boolean {
    const records = this.errors.get(pluginName) ?? []
    const now = Date.now()
    const recent = records.filter(r => now - r.timestamp < this.windowMs)
    return recent.length >= this.maxErrors
  }

  getErrors(pluginName: string): PluginErrorRecord[] {
    return [...(this.errors.get(pluginName) ?? [])]
  }

  reset(pluginName: string): void {
    this.errors.delete(pluginName)
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/safe-call.test.ts`
Expected: All 13 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/plugins/sdk/safe-call.ts tests/unit/safe-call.test.ts
git commit -m "feat(plugins): add safeCall wrapper with timeout and error budget"
```

---

### Task 4: Driver Registry

**Files:**
- Create: `src/main/plugins/sdk/driver-registry.ts`
- Create: `tests/unit/driver-registry.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/unit/driver-registry.test.ts
import { describe, it, expect, vi } from 'vitest'
import { DriverRegistryImpl } from '../../src/main/plugins/sdk/driver-registry'
import type { DriverFactory, ConnectionMiddleware } from '../../src/main/plugins/sdk/types'
import type { DbAdapter } from '../../src/main/db/adapter'

function makeStubFactory(): DriverFactory {
  return {
    createAdapter: () => ({} as DbAdapter),
    connectionFields: [
      { key: 'host', label: 'Host', type: 'text' as const, required: true }
    ]
  }
}

function makeStubMiddleware(): ConnectionMiddleware {
  return {
    shouldApply: () => true,
    beforeConnect: async (profile) => profile,
    onDisconnect: async () => {}
  }
}

describe('DriverRegistryImpl', () => {
  it('registers and retrieves a driver factory', () => {
    const registry = new DriverRegistryImpl()
    const factory = makeStubFactory()
    registry.register('mongodb', factory)
    expect(registry.get('mongodb')).toBe(factory)
  })

  it('returns undefined for unregistered driver', () => {
    const registry = new DriverRegistryImpl()
    expect(registry.get('nonexistent')).toBeUndefined()
  })

  it('throws on duplicate driver id', () => {
    const registry = new DriverRegistryImpl()
    registry.register('redis', makeStubFactory())
    expect(() => registry.register('redis', makeStubFactory())).toThrow(/already registered/)
  })

  it('disposes a driver registration', () => {
    const registry = new DriverRegistryImpl()
    const disposable = registry.register('mongodb', makeStubFactory())
    disposable.dispose()
    expect(registry.get('mongodb')).toBeUndefined()
  })

  it('has() returns true for registered driver', () => {
    const registry = new DriverRegistryImpl()
    registry.register('mongodb', makeStubFactory())
    expect(registry.has('mongodb')).toBe(true)
  })

  it('has() returns false for unregistered driver', () => {
    const registry = new DriverRegistryImpl()
    expect(registry.has('mongodb')).toBe(false)
  })

  it('lists all registered driver ids', () => {
    const registry = new DriverRegistryImpl()
    registry.register('mongodb', makeStubFactory())
    registry.register('redis', makeStubFactory())
    expect(registry.getDriverIds()).toEqual(['mongodb', 'redis'])
  })

  it('registers and retrieves connection middleware', () => {
    const registry = new DriverRegistryImpl()
    const mw = makeStubMiddleware()
    registry.registerConnectionMiddleware('ssh-tunnel', mw)
    expect(registry.getMiddlewares()).toHaveLength(1)
    expect(registry.getMiddlewares()[0].middleware).toBe(mw)
  })

  it('throws on duplicate middleware id', () => {
    const registry = new DriverRegistryImpl()
    registry.registerConnectionMiddleware('ssh', makeStubMiddleware())
    expect(() => registry.registerConnectionMiddleware('ssh', makeStubMiddleware())).toThrow(/already registered/)
  })

  it('disposes a middleware registration', () => {
    const registry = new DriverRegistryImpl()
    const disposable = registry.registerConnectionMiddleware('ssh', makeStubMiddleware())
    disposable.dispose()
    expect(registry.getMiddlewares()).toHaveLength(0)
  })

  it('hasMiddleware() returns correct values', () => {
    const registry = new DriverRegistryImpl()
    expect(registry.hasMiddleware('ssh')).toBe(false)
    registry.registerConnectionMiddleware('ssh', makeStubMiddleware())
    expect(registry.hasMiddleware('ssh')).toBe(true)
  })

  it('clear() removes all registrations', () => {
    const registry = new DriverRegistryImpl()
    registry.register('mongodb', makeStubFactory())
    registry.registerConnectionMiddleware('ssh', makeStubMiddleware())
    registry.clear()
    expect(registry.getDriverIds()).toEqual([])
    expect(registry.getMiddlewares()).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/driver-registry.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement DriverRegistryImpl**

```typescript
// src/main/plugins/sdk/driver-registry.ts
import type { Disposable, DriverFactory, DriverRegistry, ConnectionMiddleware } from './types'

interface MiddlewareEntry {
  id: string
  middleware: ConnectionMiddleware
}

export class DriverRegistryImpl implements DriverRegistry {
  private drivers = new Map<string, DriverFactory>()
  private middlewares = new Map<string, MiddlewareEntry>()

  register(id: string, factory: DriverFactory): Disposable {
    if (this.drivers.has(id)) {
      throw new Error(`Driver '${id}' is already registered`)
    }
    this.drivers.set(id, factory)
    return { dispose: () => { this.drivers.delete(id) } }
  }

  get(id: string): DriverFactory | undefined {
    return this.drivers.get(id)
  }

  has(id: string): boolean {
    return this.drivers.has(id)
  }

  getDriverIds(): string[] {
    return [...this.drivers.keys()]
  }

  registerConnectionMiddleware(id: string, middleware: ConnectionMiddleware): Disposable {
    if (this.middlewares.has(id)) {
      throw new Error(`Connection middleware '${id}' is already registered`)
    }
    const entry: MiddlewareEntry = { id, middleware }
    this.middlewares.set(id, entry)
    return { dispose: () => { this.middlewares.delete(id) } }
  }

  getMiddlewares(): MiddlewareEntry[] {
    return [...this.middlewares.values()]
  }

  hasMiddleware(id: string): boolean {
    return this.middlewares.has(id)
  }

  clear(): void {
    this.drivers.clear()
    this.middlewares.clear()
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/driver-registry.test.ts`
Expected: All 12 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/plugins/sdk/driver-registry.ts tests/unit/driver-registry.test.ts
git commit -m "feat(plugins): add DriverRegistry with middleware support"
```

---

### Task 5: Command Registry

**Files:**
- Create: `src/main/plugins/sdk/command-registry.ts`
- Create: `tests/unit/command-registry.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/unit/command-registry.test.ts
import { describe, it, expect, vi } from 'vitest'
import { CommandRegistryImpl } from '../../src/main/plugins/sdk/command-registry'

describe('CommandRegistryImpl', () => {
  it('registers and executes a command', async () => {
    const registry = new CommandRegistryImpl()
    const handler = vi.fn()
    registry.register('do-thing', handler)
    await registry.execute('do-thing')
    expect(handler).toHaveBeenCalledOnce()
  })

  it('throws when executing unregistered command', async () => {
    const registry = new CommandRegistryImpl()
    await expect(registry.execute('nope')).rejects.toThrow(/not found/)
  })

  it('throws on duplicate command id', () => {
    const registry = new CommandRegistryImpl()
    registry.register('cmd', vi.fn())
    expect(() => registry.register('cmd', vi.fn())).toThrow(/already registered/)
  })

  it('disposes a command registration', async () => {
    const registry = new CommandRegistryImpl()
    const disposable = registry.register('cmd', vi.fn())
    disposable.dispose()
    await expect(registry.execute('cmd')).rejects.toThrow(/not found/)
  })

  it('has() returns correct values', () => {
    const registry = new CommandRegistryImpl()
    expect(registry.has('cmd')).toBe(false)
    registry.register('cmd', vi.fn())
    expect(registry.has('cmd')).toBe(true)
  })

  it('lists all registered command ids', () => {
    const registry = new CommandRegistryImpl()
    registry.register('cmd-a', vi.fn())
    registry.register('cmd-b', vi.fn())
    expect(registry.getCommandIds()).toEqual(['cmd-a', 'cmd-b'])
  })

  it('handles async command handlers', async () => {
    const registry = new CommandRegistryImpl()
    const handler = vi.fn(async () => { await new Promise(r => setTimeout(r, 10)) })
    registry.register('async-cmd', handler)
    await registry.execute('async-cmd')
    expect(handler).toHaveBeenCalledOnce()
  })

  it('clear() removes all commands', () => {
    const registry = new CommandRegistryImpl()
    registry.register('a', vi.fn())
    registry.register('b', vi.fn())
    registry.clear()
    expect(registry.getCommandIds()).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/command-registry.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement CommandRegistryImpl**

```typescript
// src/main/plugins/sdk/command-registry.ts
import type { Disposable, CommandRegistry } from './types'

export class CommandRegistryImpl implements CommandRegistry {
  private commands = new Map<string, () => void | Promise<void>>()

  register(id: string, handler: () => void | Promise<void>): Disposable {
    if (this.commands.has(id)) {
      throw new Error(`Command '${id}' is already registered`)
    }
    this.commands.set(id, handler)
    return { dispose: () => { this.commands.delete(id) } }
  }

  async execute(id: string): Promise<void> {
    const handler = this.commands.get(id)
    if (!handler) {
      throw new Error(`Command '${id}' not found`)
    }
    await handler()
  }

  has(id: string): boolean {
    return this.commands.has(id)
  }

  getCommandIds(): string[] {
    return [...this.commands.keys()]
  }

  clear(): void {
    this.commands.clear()
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/command-registry.test.ts`
Expected: All 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/plugins/sdk/command-registry.ts tests/unit/command-registry.test.ts
git commit -m "feat(plugins): add CommandRegistry"
```

---

### Task 6: Panel Registry

**Files:**
- Create: `src/main/plugins/sdk/panel-registry.ts`
- Create: `tests/unit/panel-registry.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/panel-registry.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement PanelRegistryImpl**

```typescript
// src/main/plugins/sdk/panel-registry.ts
import type { Disposable, PanelContribution, PanelRegistry } from './types'

interface PanelEntry {
  id: string
  panel: PanelContribution
}

export class PanelRegistryImpl implements PanelRegistry {
  private panels = new Map<string, PanelContribution>()

  register(id: string, panel: PanelContribution): Disposable {
    if (this.panels.has(id)) {
      throw new Error(`Panel '${id}' is already registered`)
    }
    this.panels.set(id, panel)
    return { dispose: () => { this.panels.delete(id) } }
  }

  get(id: string): PanelContribution | undefined {
    return this.panels.get(id)
  }

  has(id: string): boolean {
    return this.panels.has(id)
  }

  getAll(): PanelEntry[] {
    return [...this.panels.entries()].map(([id, panel]) => ({ id, panel }))
  }

  clear(): void {
    this.panels.clear()
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/panel-registry.test.ts`
Expected: All 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/plugins/sdk/panel-registry.ts tests/unit/panel-registry.test.ts
git commit -m "feat(plugins): add PanelRegistry"
```

---

### Task 7: SchemaAccess, ConnectionAccess, and PluginSettings

These three are thin proxies over existing app internals. They share a task because each is small.

**Files:**
- Create: `src/main/plugins/sdk/schema-access.ts`
- Create: `src/main/plugins/sdk/connection-access.ts`
- Create: `src/main/plugins/sdk/settings.ts`

- [ ] **Step 1: Implement SchemaAccessImpl**

```typescript
// src/main/plugins/sdk/schema-access.ts
import type { SchemaAccess, SchemaSummary } from './types'
import type { DbAdapter } from '../../db/adapter'
import type { SchemaTable, SchemaColumn, SchemaIndex } from '@shared/types'

export class SchemaAccessImpl implements SchemaAccess {
  constructor(private getAdapter: (connectionId: string) => DbAdapter | undefined) {}

  private requireAdapter(connectionId: string): DbAdapter {
    const adapter = this.getAdapter(connectionId)
    if (!adapter) throw new Error(`No active connection: ${connectionId}`)
    return adapter
  }

  async getTables(connectionId: string, schema?: string): Promise<SchemaTable[]> {
    return this.requireAdapter(connectionId).getTables(schema)
  }

  async getColumns(connectionId: string, table: string, schema?: string): Promise<SchemaColumn[]> {
    return this.requireAdapter(connectionId).getColumns(table, schema)
  }

  async getIndexes(connectionId: string, table: string, schema?: string): Promise<SchemaIndex[]> {
    return this.requireAdapter(connectionId).getIndexes(table, schema)
  }

  async getSchemas(connectionId: string): Promise<string[]> {
    return this.requireAdapter(connectionId).getSchemas()
  }

  async getDatabases(connectionId: string): Promise<string[]> {
    return this.requireAdapter(connectionId).getDatabases()
  }

  async getSchemaSummary(connectionId: string, schema?: string): Promise<SchemaSummary> {
    const adapter = this.requireAdapter(connectionId)
    const tables = await adapter.getTables(schema)
    const result: SchemaSummary = { tables: [] }

    for (const table of tables) {
      const columns = await adapter.getColumns(table.name, schema)
      result.tables.push({
        name: table.name,
        columns: columns.map(col => ({
          name: col.name,
          dataType: col.dataType,
          isPrimaryKey: col.isPrimaryKey,
          isForeignKey: col.isForeignKey,
          references: col.references
        }))
      })
    }

    return result
  }
}
```

- [ ] **Step 2: Implement ConnectionAccessImpl**

```typescript
// src/main/plugins/sdk/connection-access.ts
import type { ConnectionAccess, Disposable } from './types'
import type { ConnectionProfile, QueryResult } from '@shared/types'
import type { DbAdapter } from '../../db/adapter'

export class ConnectionAccessImpl implements ConnectionAccess {
  private activeConnectionId: string | null = null
  private listeners = new Set<(id: string | null) => void>()

  constructor(
    private getAdapter: (connectionId: string) => DbAdapter | undefined,
    private getProfileFn: (connectionId: string) => ConnectionProfile | undefined
  ) {}

  getActiveConnectionId(): string | null {
    return this.activeConnectionId
  }

  setActiveConnectionId(id: string | null): void {
    this.activeConnectionId = id
    for (const listener of this.listeners) {
      listener(id)
    }
  }

  getProfile(connectionId: string): ConnectionProfile | null {
    return this.getProfileFn(connectionId) ?? null
  }

  async query(connectionId: string, sql: string, params?: unknown[]): Promise<QueryResult> {
    const adapter = this.getAdapter(connectionId)
    if (!adapter) throw new Error(`No active connection: ${connectionId}`)
    return adapter.query(sql, params)
  }

  onActiveConnectionChanged(listener: (id: string | null) => void): Disposable {
    this.listeners.add(listener)
    return { dispose: () => { this.listeners.delete(listener) } }
  }
}
```

- [ ] **Step 3: Implement PluginSettingsImpl**

```typescript
// src/main/plugins/sdk/settings.ts
import type { PluginSettings, Disposable } from './types'

interface SettingsStore {
  get(key: string): unknown
  set(key: string, value: unknown): void
}

export class PluginSettingsImpl implements PluginSettings {
  private listeners = new Map<string, Set<(value: unknown) => void>>()

  constructor(
    private pluginName: string,
    private store: SettingsStore
  ) {}

  private scopedKey(key: string): string {
    return `plugins.${this.pluginName}.${key}`
  }

  get<T>(key: string): T | undefined {
    return this.store.get(this.scopedKey(key)) as T | undefined
  }

  set(key: string, value: unknown): void {
    this.store.set(this.scopedKey(key), value)
    const keyListeners = this.listeners.get(key)
    if (keyListeners) {
      for (const listener of keyListeners) {
        listener(value)
      }
    }
  }

  onChanged(key: string, listener: (value: unknown) => void): Disposable {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }
    this.listeners.get(key)!.add(listener)
    return {
      dispose: () => { this.listeners.get(key)?.delete(listener) }
    }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/main/plugins/sdk/schema-access.ts src/main/plugins/sdk/connection-access.ts src/main/plugins/sdk/settings.ts
git commit -m "feat(plugins): add SchemaAccess, ConnectionAccess, and PluginSettings"
```

---

### Task 8: PluginContext Factory

**Files:**
- Create: `src/main/plugins/sdk/index.ts`

- [ ] **Step 1: Implement createPluginContext**

```typescript
// src/main/plugins/sdk/index.ts
import type { PluginContext, Disposable } from './types'
import { DriverRegistryImpl } from './driver-registry'
import { CommandRegistryImpl } from './command-registry'
import { PanelRegistryImpl } from './panel-registry'
import { SchemaAccessImpl } from './schema-access'
import { ConnectionAccessImpl } from './connection-access'
import { PluginSettingsImpl } from './settings'

export { DriverRegistryImpl } from './driver-registry'
export { CommandRegistryImpl } from './command-registry'
export { PanelRegistryImpl } from './panel-registry'
export { SchemaAccessImpl } from './schema-access'
export { ConnectionAccessImpl } from './connection-access'
export { PluginSettingsImpl } from './settings'
export { safeCall, ErrorBudget, PluginError } from './safe-call'
export type * from './types'

interface ContextDeps {
  pluginName: string
  driverRegistry: DriverRegistryImpl
  commandRegistry: CommandRegistryImpl
  panelRegistry: PanelRegistryImpl
  schemaAccess: SchemaAccessImpl
  connectionAccess: ConnectionAccessImpl
  settingsStore: { get(key: string): unknown; set(key: string, value: unknown): void }
}

export function createPluginContext(deps: ContextDeps): PluginContext {
  const subscriptions: Disposable[] = []
  const { pluginName } = deps

  // Create scoped wrappers that auto-track subscriptions
  const drivers = {
    register(id: string, factory: Parameters<DriverRegistryImpl['register']>[1]) {
      const disposable = deps.driverRegistry.register(id, factory)
      subscriptions.push(disposable)
      return disposable
    },
    registerConnectionMiddleware(id: string, middleware: Parameters<DriverRegistryImpl['registerConnectionMiddleware']>[1]) {
      const disposable = deps.driverRegistry.registerConnectionMiddleware(id, middleware)
      subscriptions.push(disposable)
      return disposable
    }
  }

  const commands = {
    register(id: string, handler: () => void | Promise<void>) {
      const namespacedId = `${pluginName}:${id}`
      const disposable = deps.commandRegistry.register(namespacedId, handler)
      subscriptions.push(disposable)
      return disposable
    }
  }

  const panels = {
    register(id: string, panel: Parameters<PanelRegistryImpl['register']>[1]) {
      const disposable = deps.panelRegistry.register(id, panel)
      subscriptions.push(disposable)
      return disposable
    }
  }

  const settings = new PluginSettingsImpl(pluginName, deps.settingsStore)

  return {
    drivers,
    commands,
    panels,
    schema: deps.schemaAccess,
    connections: deps.connectionAccess,
    settings,
    subscriptions
  }
}

export function disposePluginContext(context: PluginContext): void {
  // Dispose in reverse order
  const subs = [...context.subscriptions].reverse()
  for (const sub of subs) {
    try {
      sub.dispose()
    } catch {
      // Ignore disposal errors
    }
  }
  context.subscriptions.length = 0
}
```

- [ ] **Step 2: Commit**

```bash
git add src/main/plugins/sdk/index.ts
git commit -m "feat(plugins): add PluginContext factory"
```

---

### Task 9: Manifest Validation

**Files:**
- Create: `tests/unit/manifest-validation.test.ts`
- The validation logic will be added to plugin-host.ts in Task 10, but we define the validation function here first.

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/unit/manifest-validation.test.ts
import { describe, it, expect } from 'vitest'
import { validateManifest } from '../../src/main/plugins/plugin-host'
import type { PluginManifest } from '../../src/main/plugins/types'

function validManifest(overrides?: Partial<PluginManifest>): PluginManifest {
  return {
    name: 'test-plugin',
    version: '1.0.0',
    displayName: 'Test Plugin',
    description: 'A test plugin',
    main: 'dist/index.js',
    contributes: {},
    ...overrides
  }
}

describe('validateManifest', () => {
  it('accepts a valid manifest', () => {
    const result = validateManifest(validManifest())
    expect(result.valid).toBe(true)
  })

  it('rejects missing name', () => {
    const result = validateManifest(validManifest({ name: '' }))
    expect(result.valid).toBe(false)
    expect(result.error).toContain('name')
  })

  it('rejects invalid name format', () => {
    const result = validateManifest(validManifest({ name: 'My Plugin!' }))
    expect(result.valid).toBe(false)
    expect(result.error).toContain('name')
  })

  it('accepts valid name with hyphens and numbers', () => {
    const result = validateManifest(validManifest({ name: 'my-plugin-2' }))
    expect(result.valid).toBe(true)
  })

  it('rejects invalid semver version', () => {
    const result = validateManifest(validManifest({ version: 'abc' }))
    expect(result.valid).toBe(false)
    expect(result.error).toContain('version')
  })

  it('accepts valid semver version', () => {
    const result = validateManifest(validManifest({ version: '2.1.3' }))
    expect(result.valid).toBe(true)
  })

  it('rejects missing displayName', () => {
    const result = validateManifest(validManifest({ displayName: '' }))
    expect(result.valid).toBe(false)
    expect(result.error).toContain('displayName')
  })

  it('rejects missing description', () => {
    const result = validateManifest(validManifest({ description: '' }))
    expect(result.valid).toBe(false)
    expect(result.error).toContain('description')
  })

  it('rejects missing main', () => {
    const result = validateManifest(validManifest({ main: '' }))
    expect(result.valid).toBe(false)
    expect(result.error).toContain('main')
  })

  it('rejects main not ending in .js', () => {
    const result = validateManifest(validManifest({ main: 'index.ts' }))
    expect(result.valid).toBe(false)
    expect(result.error).toContain('.js')
  })

  it('rejects command contributions missing required fields', () => {
    const result = validateManifest(validManifest({
      contributes: { commands: [{ id: '', title: 'Do Thing' }] }
    }))
    expect(result.valid).toBe(false)
    expect(result.error).toContain('id')
  })

  it('rejects driver contributions missing required fields', () => {
    const result = validateManifest(validManifest({
      contributes: { drivers: [{ id: 'mongo', name: '' }] }
    }))
    expect(result.valid).toBe(false)
    expect(result.error).toContain('name')
  })

  it('rejects panel contributions missing required fields', () => {
    const result = validateManifest(validManifest({
      contributes: { panels: [{ id: 'p', title: '', icon: 'x', location: 'sidebar' }] }
    }))
    expect(result.valid).toBe(false)
    expect(result.error).toContain('title')
  })

  it('accepts valid contributions', () => {
    const result = validateManifest(validManifest({
      contributes: {
        commands: [{ id: 'cmd', title: 'Do Thing' }],
        drivers: [{ id: 'mongo', name: 'MongoDB' }],
        panels: [{ id: 'p', title: 'Panel', icon: 'star', location: 'sidebar' }]
      }
    }))
    expect(result.valid).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/manifest-validation.test.ts`
Expected: FAIL — `validateManifest` not exported from plugin-host

- [ ] **Step 3: Note — the implementation will be done in Task 10 (plugin-host rewrite). Continue to Task 10.**

---

### Task 10: PluginBootCoordinator (Plugin Host Rewrite)

**Files:**
- Modify: `src/main/plugins/plugin-host.ts` (full rewrite)
- Create: `tests/unit/plugin-boot.test.ts`

- [ ] **Step 1: Write the boot coordinator tests**

```typescript
// tests/unit/plugin-boot.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateManifest, PluginBootCoordinator } from '../../src/main/plugins/plugin-host'
import { DriverRegistryImpl } from '../../src/main/plugins/sdk/driver-registry'
import { CommandRegistryImpl } from '../../src/main/plugins/sdk/command-registry'
import { PanelRegistryImpl } from '../../src/main/plugins/sdk/panel-registry'

describe('PluginBootCoordinator', () => {
  let coordinator: PluginBootCoordinator
  let driverRegistry: DriverRegistryImpl
  let commandRegistry: CommandRegistryImpl
  let panelRegistry: PanelRegistryImpl

  beforeEach(() => {
    driverRegistry = new DriverRegistryImpl()
    commandRegistry = new CommandRegistryImpl()
    panelRegistry = new PanelRegistryImpl()
    coordinator = new PluginBootCoordinator({
      driverRegistry,
      commandRegistry,
      panelRegistry,
      getAdapter: () => undefined,
      getProfile: () => undefined,
      settingsStore: { get: () => undefined, set: () => {} }
    })
  })

  it('validates a correct manifest', () => {
    const result = validateManifest({
      name: 'test-plugin', version: '1.0.0', displayName: 'Test',
      description: 'Desc', main: 'dist/index.js', contributes: {}
    })
    expect(result.valid).toBe(true)
  })

  it('rejects an invalid manifest', () => {
    const result = validateManifest({
      name: '', version: '1.0.0', displayName: 'Test',
      description: 'Desc', main: 'dist/index.js', contributes: {}
    })
    expect(result.valid).toBe(false)
  })

  it('activates a plugin that exports activate()', async () => {
    const fakeModule = { activate: vi.fn() }
    const plugin = {
      manifest: {
        name: 'good-plugin', version: '1.0.0', displayName: 'Good',
        description: 'Works', main: 'index.js', contributes: {}
      },
      path: '/fake/path',
      status: { state: 'validated' as const },
      module: fakeModule
    }

    const result = await coordinator.activatePlugin(plugin)
    expect(result.status.state).toBe('active')
    expect(fakeModule.activate).toHaveBeenCalledOnce()
  })

  it('sets error status when activate() throws', async () => {
    const fakeModule = { activate: vi.fn(() => { throw new Error('boom') }) }
    const plugin = {
      manifest: {
        name: 'bad-plugin', version: '1.0.0', displayName: 'Bad',
        description: 'Fails', main: 'index.js', contributes: {}
      },
      path: '/fake/path',
      status: { state: 'validated' as const },
      module: fakeModule
    }

    const result = await coordinator.activatePlugin(plugin)
    expect(result.status.state).toBe('error')
    if (result.status.state === 'error') {
      expect(result.status.phase).toBe('activate')
      expect(result.status.error).toContain('boom')
    }
  })

  it('sets degraded status when contributions are partially registered', async () => {
    const fakeModule = {
      activate: vi.fn((ctx: any) => {
        // Register driver but not the command declared in manifest
        ctx.drivers.register('mongo', {
          createAdapter: () => ({}),
          connectionFields: []
        })
      })
    }
    const plugin = {
      manifest: {
        name: 'partial-plugin', version: '1.0.0', displayName: 'Partial',
        description: 'Partial', main: 'index.js',
        contributes: {
          drivers: [{ id: 'mongo', name: 'MongoDB' }],
          commands: [{ id: 'missing-cmd', title: 'Missing' }]
        }
      },
      path: '/fake/path',
      status: { state: 'validated' as const },
      module: fakeModule
    }

    const result = await coordinator.activatePlugin(plugin)
    expect(result.status.state).toBe('degraded')
  })

  it('deactivates a plugin and disposes subscriptions', async () => {
    const deactivateFn = vi.fn()
    const fakeModule = { activate: vi.fn(), deactivate: deactivateFn }
    const plugin = {
      manifest: {
        name: 'deact-plugin', version: '1.0.0', displayName: 'Deact',
        description: 'Desc', main: 'index.js', contributes: {}
      },
      path: '/fake/path',
      status: { state: 'validated' as const },
      module: fakeModule
    }

    const activated = await coordinator.activatePlugin(plugin)
    coordinator.deactivatePlugin(activated)
    expect(deactivateFn).toHaveBeenCalledOnce()
    expect(activated.status.state).toBe('inactive')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/plugin-boot.test.ts tests/unit/manifest-validation.test.ts`
Expected: FAIL — exports not found

- [ ] **Step 3: Rewrite plugin-host.ts**

Replace the entire contents of `src/main/plugins/plugin-host.ts`:

```typescript
// src/main/plugins/plugin-host.ts
import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import type { PluginManifest, LoadedPlugin } from './types'
import type { PluginStatus, PluginContext, BootReport } from './sdk/types'
import { createPluginContext, disposePluginContext } from './sdk/index'
import { safeCall, ErrorBudget } from './sdk/safe-call'
import type { DriverRegistryImpl } from './sdk/driver-registry'
import type { CommandRegistryImpl } from './sdk/command-registry'
import type { PanelRegistryImpl } from './sdk/panel-registry'
import type { SchemaAccessImpl } from './sdk/schema-access'
import type { ConnectionAccessImpl } from './sdk/connection-access'
import type { DbAdapter } from '../db/adapter'
import type { ConnectionProfile } from '@shared/types'

// ─── Manifest Validation ─────────────────────────────────────────────────────

const NAME_PATTERN = /^[a-z0-9-]+$/
const SEMVER_PATTERN = /^\d+\.\d+\.\d+/

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateManifest(manifest: PluginManifest): ValidationResult {
  if (!manifest.name || !NAME_PATTERN.test(manifest.name)) {
    return { valid: false, error: `Invalid name: must match ${NAME_PATTERN} (got "${manifest.name}")` }
  }
  if (!manifest.version || !SEMVER_PATTERN.test(manifest.version)) {
    return { valid: false, error: `Invalid version: must be semver x.y.z (got "${manifest.version}")` }
  }
  if (!manifest.displayName) {
    return { valid: false, error: 'Missing required field: displayName' }
  }
  if (!manifest.description) {
    return { valid: false, error: 'Missing required field: description' }
  }
  if (!manifest.main) {
    return { valid: false, error: 'Missing required field: main' }
  }
  if (!manifest.main.endsWith('.js')) {
    return { valid: false, error: `main must end in .js (got "${manifest.main}")` }
  }

  // Validate contributions
  const c = manifest.contributes
  if (c.drivers) {
    for (const d of c.drivers) {
      if (!d.id) return { valid: false, error: 'Driver contribution missing required field: id' }
      if (!d.name) return { valid: false, error: 'Driver contribution missing required field: name' }
    }
  }
  if (c.commands) {
    for (const cmd of c.commands) {
      if (!cmd.id) return { valid: false, error: 'Command contribution missing required field: id' }
      if (!cmd.title) return { valid: false, error: 'Command contribution missing required field: title' }
    }
  }
  if (c.panels) {
    for (const p of c.panels) {
      if (!p.id) return { valid: false, error: 'Panel contribution missing required field: id' }
      if (!p.title) return { valid: false, error: 'Panel contribution missing required field: title' }
      if (!p.icon) return { valid: false, error: 'Panel contribution missing required field: icon' }
      if (!p.location) return { valid: false, error: 'Panel contribution missing required field: location' }
    }
  }
  if (c.connectionMiddleware) {
    for (const mw of c.connectionMiddleware) {
      if (!mw.id) return { valid: false, error: 'Connection middleware contribution missing required field: id' }
    }
  }
  if (c.connectionFields) {
    for (const f of c.connectionFields) {
      if (!f.key) return { valid: false, error: 'Connection field contribution missing required field: key' }
      if (!f.label) return { valid: false, error: 'Connection field contribution missing required field: label' }
      if (!f.type) return { valid: false, error: 'Connection field contribution missing required field: type' }
    }
  }
  if (c.settings) {
    for (const s of c.settings) {
      if (!s.key) return { valid: false, error: 'Setting contribution missing required field: key' }
      if (!s.title) return { valid: false, error: 'Setting contribution missing required field: title' }
      if (!s.type) return { valid: false, error: 'Setting contribution missing required field: type' }
    }
  }

  return { valid: true }
}

// ─── Boot Coordinator ─────────────────────────────────────────────────────────

interface BootDeps {
  driverRegistry: DriverRegistryImpl
  commandRegistry: CommandRegistryImpl
  panelRegistry: PanelRegistryImpl
  getAdapter: (connectionId: string) => DbAdapter | undefined
  getProfile: (connectionId: string) => ConnectionProfile | undefined
  settingsStore: { get(key: string): unknown; set(key: string, value: unknown): void }
}

export class PluginBootCoordinator {
  private plugins = new Map<string, LoadedPlugin>()
  private activationOrder: string[] = []
  private errorBudget = new ErrorBudget()
  private deps: BootDeps

  constructor(deps: BootDeps) {
    this.deps = deps
  }

  // ── Phase 1: Discover ──────────────────────────────────────────────────────

  discover(dirs: string[]): void {
    this.plugins.clear()

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) continue

      let entries: string[]
      try {
        entries = fs.readdirSync(dir)
      } catch {
        continue
      }

      for (const entry of entries) {
        const pluginPath = path.join(dir, entry)
        try {
          const stat = fs.statSync(pluginPath)
          if (!stat.isDirectory()) continue
        } catch {
          continue
        }

        const manifest = this.parseManifest(pluginPath, entry)
        if (manifest) {
          this.plugins.set(manifest.name, {
            manifest,
            path: pluginPath,
            status: { state: 'discovered' }
          })
        }
      }
    }
  }

  private parseManifest(pluginPath: string, fallbackName: string): PluginManifest | null {
    const manifestPath = path.join(pluginPath, 'plugin-manifest.json')
    const pkgPath = path.join(pluginPath, 'package.json')

    if (fs.existsSync(manifestPath)) {
      try {
        return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
      } catch (err) {
        this.plugins.set(fallbackName, {
          manifest: { name: fallbackName, version: '0.0.0', displayName: fallbackName, description: '', main: '', contributes: {} },
          path: pluginPath,
          status: { state: 'error', error: `Invalid manifest JSON: ${(err as Error).message}`, phase: 'discover' }
        })
        return null
      }
    }

    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
        if (!pkg.keywords?.includes('dbstudio-plugin')) return null
        return {
          name: pkg.name,
          version: pkg.version ?? '0.0.0',
          displayName: pkg.displayName ?? pkg.name,
          description: pkg.description ?? '',
          main: pkg.main ?? 'index.js',
          contributes: pkg.contributes ?? {}
        }
      } catch (err) {
        this.plugins.set(fallbackName, {
          manifest: { name: fallbackName, version: '0.0.0', displayName: fallbackName, description: '', main: '', contributes: {} },
          path: pluginPath,
          status: { state: 'error', error: `Invalid package.json: ${(err as Error).message}`, phase: 'discover' }
        })
        return null
      }
    }

    return null
  }

  // ── Phase 2: Validate ──────────────────────────────────────────────────────

  validateAll(): void {
    for (const [name, plugin] of this.plugins) {
      if (plugin.status.state !== 'discovered') continue

      const result = validateManifest(plugin.manifest)
      if (!result.valid) {
        plugin.status = { state: 'error', error: result.error!, phase: 'validate' }
        continue
      }

      // Check entry point exists
      const mainPath = path.join(plugin.path, plugin.manifest.main)
      if (!fs.existsSync(mainPath)) {
        plugin.status = { state: 'error', error: `main file not found: ${plugin.manifest.main}`, phase: 'validate' }
        continue
      }

      // Check exports
      try {
        const mod = require(mainPath)
        if (typeof mod.activate !== 'function') {
          plugin.status = { state: 'error', error: 'Missing activate() export', phase: 'validate' }
          continue
        }
        plugin.module = mod
      } catch (err) {
        plugin.status = { state: 'error', error: `Failed to load module: ${(err as Error).message}`, phase: 'validate' }
        continue
      }

      plugin.status = { state: 'validated' }
    }
  }

  // ── Phase 3: Resolve (no-op for now) ───────────────────────────────────────

  resolveAll(): void {
    for (const plugin of this.plugins.values()) {
      if (plugin.status.state === 'validated') {
        plugin.status = { state: 'resolved' }
      }
    }
  }

  // ── Phase 4: Activate ──────────────────────────────────────────────────────

  async activatePlugin(plugin: LoadedPlugin): Promise<LoadedPlugin> {
    if (!plugin.module) {
      plugin.status = { state: 'error', error: 'No module loaded', phase: 'activate' }
      return plugin
    }

    plugin.status = { state: 'activating' }

    const context = createPluginContext({
      pluginName: plugin.manifest.name,
      driverRegistry: this.deps.driverRegistry,
      commandRegistry: this.deps.commandRegistry,
      panelRegistry: this.deps.panelRegistry,
      schemaAccess: new (require('./sdk/schema-access').SchemaAccessImpl)(this.deps.getAdapter),
      connectionAccess: new (require('./sdk/connection-access').ConnectionAccessImpl)(this.deps.getAdapter, this.deps.getProfile),
      settingsStore: this.deps.settingsStore
    })
    plugin.context = context

    try {
      await safeCall(plugin.manifest.name, () => plugin.module!.activate(context), { timeoutMs: 10_000 })
    } catch (err) {
      // Cleanup partial registrations
      disposePluginContext(context)
      plugin.context = undefined
      plugin.status = {
        state: 'error',
        error: err instanceof Error ? err.message : String(err),
        phase: 'activate'
      }
      return plugin
    }

    // Phase 5: Verify
    const verification = this.verifyContributions(plugin)
    plugin.status = verification
    if (verification.state === 'active' || verification.state === 'degraded') {
      this.activationOrder.push(plugin.manifest.name)
    }

    return plugin
  }

  // ── Phase 5: Verify ────────────────────────────────────────────────────────

  private verifyContributions(plugin: LoadedPlugin): PluginStatus {
    const declared: string[] = []
    const registered: string[] = []
    const missing: string[] = []
    const c = plugin.manifest.contributes

    if (c.drivers) {
      for (const d of c.drivers) {
        declared.push(`driver:${d.id}`)
        if (this.deps.driverRegistry.has(d.id)) {
          registered.push(`driver:${d.id}`)
        } else {
          missing.push(`driver:${d.id}`)
        }
      }
    }

    if (c.commands) {
      for (const cmd of c.commands) {
        const namespacedId = `${plugin.manifest.name}:${cmd.id}`
        declared.push(`command:${cmd.id}`)
        if (this.deps.commandRegistry.has(namespacedId)) {
          registered.push(`command:${cmd.id}`)
        } else {
          missing.push(`command:${cmd.id}`)
        }
      }
    }

    if (c.panels) {
      for (const p of c.panels) {
        declared.push(`panel:${p.id}`)
        if (this.deps.panelRegistry.has(p.id)) {
          registered.push(`panel:${p.id}`)
        } else {
          missing.push(`panel:${p.id}`)
        }
      }
    }

    if (c.connectionMiddleware) {
      for (const mw of c.connectionMiddleware) {
        declared.push(`middleware:${mw.id}`)
        if (this.deps.driverRegistry.hasMiddleware(mw.id)) {
          registered.push(`middleware:${mw.id}`)
        } else {
          missing.push(`middleware:${mw.id}`)
        }
      }
    }

    if (declared.length === 0) {
      // Plugin with no declared contributions — just mark active
      return { state: 'active', contributions: [] }
    }

    if (missing.length === 0) {
      return { state: 'active', contributions: registered }
    }

    if (registered.length === 0) {
      return { state: 'error', error: `Plugin activated but registered no contributions. Expected: ${declared.join(', ')}`, phase: 'verify' }
    }

    return { state: 'degraded', error: `Missing contributions: ${missing.join(', ')}`, contributions: registered }
  }

  // ── Full Boot ──────────────────────────────────────────────────────────────

  async boot(): Promise<BootReport> {
    const pluginDir = this.getPluginDir()
    this.discover([pluginDir])
    this.validateAll()
    this.resolveAll()

    const report: BootReport = { total: 0, active: 0, degraded: 0, failed: 0, plugins: [] }

    for (const plugin of this.plugins.values()) {
      report.total++
      if (plugin.status.state !== 'resolved') {
        report.failed++
        report.plugins.push({ name: plugin.manifest.name, status: plugin.status, durationMs: 0 })
        continue
      }

      const start = performance.now()
      await this.activatePlugin(plugin)
      const durationMs = Math.round(performance.now() - start)

      if (plugin.status.state === 'active') report.active++
      else if (plugin.status.state === 'degraded') report.degraded++
      else report.failed++

      report.plugins.push({ name: plugin.manifest.name, status: plugin.status, durationMs })
    }

    this.logBootReport(report)
    return report
  }

  // ── Deactivate ─────────────────────────────────────────────────────────────

  deactivatePlugin(plugin: LoadedPlugin): void {
    if (plugin.module?.deactivate) {
      try {
        plugin.module.deactivate()
      } catch {
        // Ignore deactivation errors
      }
    }
    if (plugin.context) {
      disposePluginContext(plugin.context)
      plugin.context = undefined
    }
    plugin.status = { state: 'inactive' }
    this.activationOrder = this.activationOrder.filter(n => n !== plugin.manifest.name)
  }

  async shutdown(): Promise<void> {
    // Deactivate in reverse order
    const reversed = [...this.activationOrder].reverse()
    for (const name of reversed) {
      const plugin = this.plugins.get(name)
      if (plugin) {
        try {
          await safeCall(name, async () => this.deactivatePlugin(plugin), { timeoutMs: 5_000 })
        } catch {
          // Force cleanup on timeout
          if (plugin.context) {
            disposePluginContext(plugin.context)
            plugin.context = undefined
          }
          plugin.status = { state: 'inactive' }
        }
      }
    }
    this.activationOrder = []
  }

  // ── Public Accessors ───────────────────────────────────────────────────────

  getLoadedPlugins(): LoadedPlugin[] {
    return Array.from(this.plugins.values())
  }

  getPlugin(name: string): LoadedPlugin | undefined {
    return this.plugins.get(name)
  }

  getErrorBudget(): ErrorBudget {
    return this.errorBudget
  }

  // ── Install / Uninstall ────────────────────────────────────────────────────

  installFromPath(sourcePath: string): { success: boolean; name?: string; error?: string } {
    try {
      const manifestPath = path.join(sourcePath, 'plugin-manifest.json')
      const pkgPath = path.join(sourcePath, 'package.json')

      let name: string
      if (fs.existsSync(manifestPath)) {
        name = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')).name
      } else if (fs.existsSync(pkgPath)) {
        name = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')).name
      } else {
        return { success: false, error: 'No plugin-manifest.json or package.json found' }
      }

      const destDir = path.join(this.getPluginDir(), name)
      if (fs.existsSync(destDir)) {
        fs.rmSync(destDir, { recursive: true })
      }
      fs.cpSync(sourcePath, destDir, { recursive: true })

      // Re-discover after install
      this.discover([this.getPluginDir()])
      return { success: true, name }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  }

  uninstall(name: string): void {
    const plugin = this.plugins.get(name)
    if (!plugin) return
    this.deactivatePlugin(plugin)
    fs.rmSync(plugin.path, { recursive: true, force: true })
    this.plugins.delete(name)
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  private getPluginDir(): string {
    const dir = path.join(app.getPath('userData'), 'plugins')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    return dir
  }

  private logBootReport(report: BootReport): void {
    console.log(`[plugins] Discovered ${report.total} plugins`)
    for (const p of report.plugins) {
      if (p.status.state === 'active') {
        const contribs = p.status.contributions.length > 0
          ? ` (${p.status.contributions.join(', ')})`
          : ''
        console.log(`[plugins] \u2713 ${p.name}: active${contribs} [${p.durationMs}ms]`)
      } else if (p.status.state === 'degraded') {
        console.log(`[plugins] ~ ${p.name}: degraded — ${p.status.error} [${p.durationMs}ms]`)
      } else if (p.status.state === 'error') {
        console.log(`[plugins] \u2717 ${p.name}: error(${p.status.phase}) — ${p.status.error} [${p.durationMs}ms]`)
      }
    }
    console.log(`[plugins] Boot complete: ${report.active} active, ${report.degraded} degraded, ${report.failed} failed`)
  }
}
```

- [ ] **Step 4: Run all plugin tests**

Run: `npx vitest run tests/unit/manifest-validation.test.ts tests/unit/plugin-boot.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Run the full test suite**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/main/plugins/plugin-host.ts tests/unit/manifest-validation.test.ts tests/unit/plugin-boot.test.ts
git commit -m "feat(plugins): rewrite plugin-host as PluginBootCoordinator with 5-phase boot"
```

---

### Task 11: Update IPC Channels

**Files:**
- Modify: `shared/ipc.ts:92-112`

- [ ] **Step 1: Update the plugin IPC channel types**

In `shared/ipc.ts`, replace lines 92-112 (the plugin channels section) with:

```typescript
  'plugins:list': {
    args: []
    return: {
      name: string
      displayName: string
      version: string
      description: string
      status: import('./types').PluginStatus
      contributions: string[]
    }[]
  }
  'plugins:activate': {
    args: [name: string]
    return: { success: boolean; error?: string }
  }
  'plugins:deactivate': {
    args: [name: string]
    return: void
  }
  'plugins:install-from-path': {
    args: [path: string]
    return: { success: boolean; name?: string; error?: string }
  }
  'plugins:uninstall': {
    args: [name: string]
    return: void
  }
  'plugins:errors': {
    args: [name: string]
    return: { timestamp: number; error: string; stack?: string }[]
  }
```

Note: Since `PluginStatus` is a union type from the main process, and `shared/ipc.ts` shouldn't depend on main process code, we'll inline the status type. Replace the `status` field above with:

```typescript
      status: { state: string; error?: string; phase?: string; contributions?: string[] }
```

- [ ] **Step 2: Run existing tests to verify nothing breaks**

Run: `npx vitest run`
Expected: All tests PASS (the IPC type changes are backwards-compatible since we're widening the return type)

- [ ] **Step 3: Commit**

```bash
git add shared/ipc.ts
git commit -m "feat(plugins): expand plugin IPC channels with status and error log"
```

---

### Task 12: Integrate with factory.ts and ipc-handlers.ts

**Files:**
- Modify: `src/main/db/factory.ts`
- Modify: `src/main/ipc-handlers.ts`

- [ ] **Step 1: Update factory.ts to check driver registry**

Replace the entire contents of `src/main/db/factory.ts`:

```typescript
import type { ConnectionProfile } from '@shared/types'
import type { DbAdapter } from './adapter'
import { SqliteAdapter } from './sqlite'
import { PostgresAdapter } from './postgres'
import { MysqlAdapter } from './mysql'
import type { DriverRegistryImpl } from '../plugins/sdk/driver-registry'

let pluginDriverRegistry: DriverRegistryImpl | null = null

export function setDriverRegistry(registry: DriverRegistryImpl): void {
  pluginDriverRegistry = registry
}

export function createAdapter(profile: ConnectionProfile): DbAdapter {
  switch (profile.type) {
    case 'sqlite':
      return new SqliteAdapter(profile.database)
    case 'postgresql':
      return new PostgresAdapter({
        host: profile.host!, port: profile.port!, database: profile.database,
        user: profile.username, password: profile.password, ssl: profile.ssl
      })
    case 'mysql':
      return new MysqlAdapter({
        host: profile.host!, port: profile.port!, database: profile.database,
        user: profile.username, password: profile.password, ssl: profile.ssl
      })
    default: {
      if (pluginDriverRegistry) {
        const factory = pluginDriverRegistry.get(profile.type)
        if (factory) {
          return factory.createAdapter(profile as unknown as Record<string, unknown>)
        }
      }
      throw new Error(`Unsupported database type: ${profile.type}`)
    }
  }
}
```

- [ ] **Step 2: Update ipc-handlers.ts**

Replace the imports at the top of `src/main/ipc-handlers.ts` (lines 1-15):

```typescript
import { ipcMain, app, dialog } from 'electron'
import fs from 'fs'
import { ConfigStore } from './config/store'
import { createAdapter, setDriverRegistry } from './db/factory'
import type { DbAdapter } from './db/adapter'
import type { ConnectionProfile, DatabaseType } from '@shared/types'
import type { IpcChannelMap } from '@shared/ipc'
import path from 'path'
import { exportTableToSql } from './export/sql-export'
import { exportToCsv } from './export/csv-export'
import { exportToJson } from './export/json-export'
import { parseCsvFile, importCsvToTable } from './import/csv-import'
import { executeSqlFile } from './import/sql-import'
import { mapType, generateMigrationDdl } from './migration/type-map'
import { PluginBootCoordinator } from './plugins/plugin-host'
import { DriverRegistryImpl } from './plugins/sdk/driver-registry'
import { CommandRegistryImpl } from './plugins/sdk/command-registry'
import { PanelRegistryImpl } from './plugins/sdk/panel-registry'
import { safeCall } from './plugins/sdk/safe-call'
```

Replace the plugin section (lines 334-364) in `registerIpcHandlers()` with:

```typescript
  // ─── Plugins ─────────────────────────────────────────────────────────────────

  const driverRegistry = new DriverRegistryImpl()
  const commandRegistry = new CommandRegistryImpl()
  const panelRegistry = new PanelRegistryImpl()

  setDriverRegistry(driverRegistry)

  const pluginCoordinator = new PluginBootCoordinator({
    driverRegistry,
    commandRegistry,
    panelRegistry,
    getAdapter: (id) => activeAdapters.get(id),
    getProfile: (id) => configStore.getConnection(id),
    settingsStore: {
      get: (key) => (configStore as any).data?.[key],
      set: (key, value) => {
        (configStore as any).data = (configStore as any).data ?? {}
        ;(configStore as any).data[key] = value
        ;(configStore as any).save?.()
      }
    }
  })

  pluginCoordinator.boot().catch(err => {
    console.error('[plugins] Boot failed:', err)
  })

  handle('plugins:list', async () => {
    return pluginCoordinator.getLoadedPlugins().map(p => ({
      name: p.manifest.name,
      displayName: p.manifest.displayName,
      version: p.manifest.version,
      description: p.manifest.description,
      status: p.status as { state: string; error?: string; phase?: string; contributions?: string[] },
      contributions: p.status.state === 'active' ? p.status.contributions
        : p.status.state === 'degraded' ? p.status.contributions
        : []
    }))
  })

  handle('plugins:activate', async (name) => {
    const plugin = pluginCoordinator.getPlugin(name)
    if (!plugin) return { success: false, error: 'Plugin not found' }
    const result = await pluginCoordinator.activatePlugin(plugin)
    if (result.status.state === 'error') {
      return { success: false, error: result.status.error }
    }
    return { success: true }
  })

  handle('plugins:deactivate', async (name) => {
    const plugin = pluginCoordinator.getPlugin(name)
    if (plugin) pluginCoordinator.deactivatePlugin(plugin)
  })

  handle('plugins:install-from-path', async (pluginPath) => {
    return pluginCoordinator.installFromPath(pluginPath)
  })

  handle('plugins:uninstall', async (name) => {
    pluginCoordinator.uninstall(name)
  })

  handle('plugins:errors', async (name) => {
    return pluginCoordinator.getErrorBudget().getErrors(name)
  })
```

- [ ] **Step 3: Update the db:connect handler to run middleware**

In `src/main/ipc-handlers.ts`, replace the `db:connect` handler (lines 102-114) with:

```typescript
  handle('db:connect', async (profileId: string) => {
    try {
      let profile = configStore.getConnection(profileId)
      if (!profile) return { success: false, error: 'Connection profile not found — it may have been deleted' }
      if (activeAdapters.has(profileId)) return { success: true }

      // Run connection middleware chain
      for (const { middleware } of driverRegistry.getMiddlewares()) {
        if (middleware.shouldApply(profile)) {
          profile = await safeCall('middleware', () => middleware.beforeConnect(profile!), { timeoutMs: 15_000 })
        }
      }

      const adapter = createAdapter(profile)
      await adapter.connect()
      activeAdapters.set(profileId, adapter)
      return { success: true }
    } catch (err) {
      return { success: false, error: formatDbError(err) }
    }
  })
```

- [ ] **Step 4: Run the full test suite**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/db/factory.ts src/main/ipc-handlers.ts
git commit -m "feat(plugins): integrate boot coordinator with factory and IPC handlers"
```

---

### Task 13: Final Verification

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 2: Run TypeScript type check**

Run: `npx tsc --noEmit`
Expected: No type errors (or only pre-existing ones)

- [ ] **Step 3: Run the dev build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit any fixes if needed**

If any issues were found in steps 1-3, fix them and commit:

```bash
git add -A
git commit -m "fix(plugins): address type/build issues from SDK integration"
```
