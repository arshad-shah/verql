# Plugin-Owned Connections & Keyring Auth — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every database an extension — promote built-in adapters to plugins, add adapter-owned test connection, fetchable dropdown fields, keyring credential storage, and hard-pin package versions.

**Architecture:** All DB-specific logic moves into bundled plugins. The app core becomes a pure shell: registry lookup, IPC dispatch, rendering. A new `KeyringService` using Electron `safeStorage` handles credential encryption. The connection form becomes fully plugin-driven with two-phase auth for fetchable fields.

**Tech Stack:** Electron `safeStorage`, TypeScript, React, Zustand, Vitest

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/main/plugins/bundled/postgresql/index.ts` | PostgreSQL plugin manifest + activate |
| `src/main/plugins/bundled/postgresql/postgres-adapter.ts` | PostgreSQL adapter (moved from `src/main/db/postgres.ts`) |
| `src/main/plugins/bundled/mysql/index.ts` | MySQL plugin manifest + activate |
| `src/main/plugins/bundled/mysql/mysql-adapter.ts` | MySQL adapter (moved from `src/main/db/mysql.ts`) |
| `src/main/plugins/bundled/sqlite/index.ts` | SQLite plugin manifest + activate |
| `src/main/plugins/bundled/sqlite/sqlite-adapter.ts` | SQLite adapter (moved from `src/main/db/sqlite.ts`) |
| `src/main/keyring.ts` | KeyringService — encrypt/decrypt credentials via safeStorage |
| `tests/unit/keyring.test.ts` | KeyringService unit tests |

### Modified Files
| File | Change |
|------|--------|
| `src/main/db/adapter.ts` | Add `testConnection()`, `TestConnectionResult`, `getConnectionOptions?()` |
| `src/main/db/factory.ts` | Remove switch statement, pure registry lookup |
| `src/main/plugins/sdk/types.ts` | Add `select` type + `fetchable` to `ConnectionField`, add `KeyringAccess` to `PluginContext` |
| `src/main/plugins/types.ts` | Add `select` type + `fetchable` to `ConnectionFieldContribution` |
| `src/main/plugins/sdk/index.ts` | Accept + pass `keyring` into `PluginContext` |
| `src/main/plugins/plugin-host.ts` | Register postgresql/mysql/sqlite as bundled plugins |
| `src/main/ipc-handlers.ts` | Simplify test-connection, add `db:connection-options` + `keyring:*` channels, register new bundled plugins, credential migration |
| `shared/ipc.ts` | Add `db:connection-options`, `keyring:*` channel types, update `db:test-connection` return type |
| `src/main/plugins/bundled/snowflake/index.ts` | Update fields to `select` + `fetchable` |
| `src/main/plugins/bundled/snowflake/snowflake-adapter.ts` | Add `testConnection()`, `getConnectionOptions()`, keyring SSO lifecycle |
| `src/main/plugins/bundled/redis/redis-adapter.ts` | Add `testConnection()` |
| `src/main/plugins/bundled/mongodb/mongo-adapter.ts` | Add `testConnection()` |
| `src/renderer/src/components/connections/ConnectionFormView.tsx` | Remove `BUILTIN_TYPES`, all types from plugins, two-phase auth UI |
| `src/renderer/src/components/connections/ConnectionTestButton.tsx` | Consume `TestConnectionResult` shape with details |
| `tests/unit/adapter.test.ts` | Update for registry-based factory |
| `tests/unit/bundled-plugins.test.ts` | Add postgresql/mysql/sqlite plugin tests |
| `package.json` | Hard-pin all dependency versions |

### Deleted Files
| File | Reason |
|------|--------|
| `src/main/db/postgres.ts` | Moved to `src/main/plugins/bundled/postgresql/postgres-adapter.ts` |
| `src/main/db/mysql.ts` | Moved to `src/main/plugins/bundled/mysql/mysql-adapter.ts` |
| `src/main/db/sqlite.ts` | Moved to `src/main/plugins/bundled/sqlite/sqlite-adapter.ts` |

---

### Task 1: Extend DbAdapter Interface with testConnection and getConnectionOptions

**Files:**
- Modify: `src/main/db/adapter.ts`
- Modify: `shared/types.ts`

- [ ] **Step 1: Add TestConnectionResult to shared types**

In `shared/types.ts`, add after the `SchemaIndex` interface (around line 80):

```ts
export interface TestConnectionResult {
  version: string
  details?: Record<string, string>
}
```

- [ ] **Step 2: Add testConnection and getConnectionOptions to DbAdapter**

Replace the entire contents of `src/main/db/adapter.ts` with:

```ts
import type { QueryResult, SchemaTable, SchemaColumn, SchemaIndex, TestConnectionResult } from '@shared/types'

export interface DbAdapter {
  connect(): Promise<void>
  disconnect(): Promise<void>
  testConnection(): Promise<TestConnectionResult>
  query(sql: string, params?: unknown[]): Promise<QueryResult>
  getTables(schema?: string): Promise<SchemaTable[]>
  getColumns(table: string, schema?: string): Promise<SchemaColumn[]>
  getIndexes(table: string, schema?: string): Promise<SchemaIndex[]>
  getRowCount(table: string, schema?: string): Promise<number>
  getSchemas(): Promise<string[]>
  getDatabases(): Promise<string[]>
  switchDatabase(database: string): Promise<void>
  setSchema?(schema: string): Promise<void>
  cancelQuery?(): void
  isConnected(): boolean
  getConnectionOptions?(field: string): Promise<string[]>
}
```

- [ ] **Step 3: Run type check to see expected failures**

Run: `npx tsc --noEmit 2>&1 | head -40`

Expected: Type errors in `postgres.ts`, `mysql.ts`, `sqlite.ts`, `snowflake-adapter.ts`, `redis-adapter.ts`, `mongo-adapter.ts` because they don't implement `testConnection()` yet. This confirms the interface change propagated correctly.

- [ ] **Step 4: Commit**

```bash
git add src/main/db/adapter.ts shared/types.ts
git commit -m "feat: add testConnection and getConnectionOptions to DbAdapter interface"
```

---

### Task 2: Extend ConnectionField Types with select and fetchable

**Files:**
- Modify: `src/main/plugins/sdk/types.ts:53-60`
- Modify: `src/main/plugins/types.ts:53-60`

- [ ] **Step 1: Update ConnectionField in SDK types**

In `src/main/plugins/sdk/types.ts`, replace lines 53-60:

```ts
export interface ConnectionField {
  key: string
  label: string
  type: 'text' | 'password' | 'number' | 'boolean' | 'file'
  required?: boolean
  default?: string | number | boolean
  group?: string
}
```

with:

```ts
export interface ConnectionField {
  key: string
  label: string
  type: 'text' | 'password' | 'number' | 'boolean' | 'file' | 'select'
  required?: boolean
  default?: string | number | boolean
  group?: string
  fetchable?: boolean
}
```

- [ ] **Step 2: Update ConnectionFieldContribution in manifest types**

In `src/main/plugins/types.ts`, replace lines 53-60:

```ts
export interface ConnectionFieldContribution {
  key: string
  label: string
  type: 'text' | 'password' | 'number' | 'boolean' | 'file'
  required?: boolean
  default?: string | number | boolean
  group?: string
}
```

with:

```ts
export interface ConnectionFieldContribution {
  key: string
  label: string
  type: 'text' | 'password' | 'number' | 'boolean' | 'file' | 'select'
  required?: boolean
  default?: string | number | boolean
  group?: string
  fetchable?: boolean
}
```

- [ ] **Step 3: Commit**

```bash
git add src/main/plugins/sdk/types.ts src/main/plugins/types.ts
git commit -m "feat: add select type and fetchable flag to ConnectionField"
```

---

### Task 3: Add KeyringAccess to PluginContext

**Files:**
- Modify: `src/main/plugins/sdk/types.ts:31-39`
- Modify: `src/main/plugins/sdk/index.ts:19-27,29-75`

- [ ] **Step 1: Add KeyringAccess interface to SDK types**

In `src/main/plugins/sdk/types.ts`, add after the `PluginSettings` interface (after line 126):

```ts
// ─── Keyring Access ─────────────────────────────────────────────────────────

export interface KeyringAccess {
  store(profileId: string, key: string, value: string): Promise<void>
  retrieve(profileId: string, key: string): Promise<string | null>
  delete(profileId: string, key: string): Promise<void>
}
```

- [ ] **Step 2: Add keyring to PluginContext**

In `src/main/plugins/sdk/types.ts`, replace lines 31-39:

```ts
export interface PluginContext {
  drivers: DriverRegistry
  commands: CommandRegistry
  panels: PanelRegistry
  schema: SchemaAccess
  connections: ConnectionAccess
  settings: PluginSettings
  subscriptions: Disposable[]
}
```

with:

```ts
export interface PluginContext {
  drivers: DriverRegistry
  commands: CommandRegistry
  panels: PanelRegistry
  schema: SchemaAccess
  connections: ConnectionAccess
  settings: PluginSettings
  keyring: KeyringAccess
  subscriptions: Disposable[]
}
```

- [ ] **Step 3: Update ContextDeps and createPluginContext in sdk/index.ts**

In `src/main/plugins/sdk/index.ts`, replace the `ContextDeps` interface (lines 19-27):

```ts
interface ContextDeps {
  pluginName: string
  driverRegistry: DriverRegistryImpl
  commandRegistry: CommandRegistryImpl
  panelRegistry: PanelRegistryImpl
  schemaAccess: SchemaAccessImpl
  connectionAccess: ConnectionAccessImpl
  settingsStore: { get(key: string): unknown; set(key: string, value: unknown): void }
}
```

with:

```ts
interface ContextDeps {
  pluginName: string
  driverRegistry: DriverRegistryImpl
  commandRegistry: CommandRegistryImpl
  panelRegistry: PanelRegistryImpl
  schemaAccess: SchemaAccessImpl
  connectionAccess: ConnectionAccessImpl
  settingsStore: { get(key: string): unknown; set(key: string, value: unknown): void }
  keyring: import('./types').KeyringAccess
}
```

- [ ] **Step 4: Pass keyring into the returned context**

In `src/main/plugins/sdk/index.ts`, replace the return block (lines 66-75):

```ts
  return {
    drivers,
    commands,
    panels,
    schema: deps.schemaAccess,
    connections: deps.connectionAccess,
    settings,
    subscriptions
  }
```

with:

```ts
  return {
    drivers,
    commands,
    panels,
    schema: deps.schemaAccess,
    connections: deps.connectionAccess,
    settings,
    keyring: deps.keyring,
    subscriptions
  }
```

- [ ] **Step 5: Commit**

```bash
git add src/main/plugins/sdk/types.ts src/main/plugins/sdk/index.ts
git commit -m "feat: add KeyringAccess to PluginContext"
```

---

### Task 4: Implement KeyringService

**Files:**
- Create: `src/main/keyring.ts`
- Create: `tests/unit/keyring.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/keyring.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Electron's safeStorage — tests run in Node, not Electron
vi.mock('electron', () => ({
  safeStorage: {
    isEncryptionAvailable: () => true,
    encryptString: (text: string) => Buffer.from(`encrypted:${text}`),
    decryptString: (buffer: Buffer) => buffer.toString().replace('encrypted:', '')
  },
  app: {
    getPath: () => '/tmp/dbstudio-test'
  }
}))

// Mock fs to avoid real file I/O
const mockStore: Record<string, string> = {}
vi.mock('fs', () => ({
  default: {
    existsSync: () => Object.keys(mockStore).length > 0,
    readFileSync: () => JSON.stringify(mockStore),
    writeFileSync: (_path: string, data: string) => {
      const parsed = JSON.parse(data)
      for (const key of Object.keys(mockStore)) delete mockStore[key]
      Object.assign(mockStore, parsed)
    },
    mkdirSync: () => {}
  }
}))

import { KeyringService } from '../../src/main/keyring'

describe('KeyringService', () => {
  let keyring: KeyringService

  beforeEach(() => {
    for (const key of Object.keys(mockStore)) delete mockStore[key]
    keyring = new KeyringService()
  })

  it('stores and retrieves a credential', async () => {
    await keyring.store('conn1', 'password', 'secret123')
    const result = await keyring.retrieve('conn1', 'password')
    expect(result).toBe('secret123')
  })

  it('returns null for missing credential', async () => {
    const result = await keyring.retrieve('conn1', 'password')
    expect(result).toBeNull()
  })

  it('deletes a credential', async () => {
    await keyring.store('conn1', 'password', 'secret123')
    await keyring.delete('conn1', 'password')
    const result = await keyring.retrieve('conn1', 'password')
    expect(result).toBeNull()
  })

  it('deleteAll removes all credentials for a profile', async () => {
    await keyring.store('conn1', 'password', 'secret')
    await keyring.store('conn1', 'ssoToken', 'token')
    await keyring.store('conn2', 'password', 'other')
    await keyring.deleteAll('conn1')
    expect(await keyring.retrieve('conn1', 'password')).toBeNull()
    expect(await keyring.retrieve('conn1', 'ssoToken')).toBeNull()
    expect(await keyring.retrieve('conn2', 'password')).toBe('other')
  })

  it('overwrites existing credential', async () => {
    await keyring.store('conn1', 'password', 'old')
    await keyring.store('conn1', 'password', 'new')
    expect(await keyring.retrieve('conn1', 'password')).toBe('new')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/keyring.test.ts`

Expected: FAIL — `KeyringService` module does not exist.

- [ ] **Step 3: Implement KeyringService**

Create `src/main/keyring.ts`:

```ts
import { safeStorage, app } from 'electron'
import fs from 'fs'
import path from 'path'

export class KeyringService {
  private filePath: string
  private cache: Record<string, string> = {}

  constructor() {
    const userDataPath = app.getPath('userData')
    fs.mkdirSync(userDataPath, { recursive: true })
    this.filePath = path.join(userDataPath, 'credentials.enc')
    this.load()
  }

  async store(profileId: string, key: string, value: string): Promise<void> {
    const compositeKey = `${profileId}:${key}`
    const encrypted = safeStorage.encryptString(value)
    this.cache[compositeKey] = encrypted.toString('base64')
    this.save()
  }

  async retrieve(profileId: string, key: string): Promise<string | null> {
    const compositeKey = `${profileId}:${key}`
    const encoded = this.cache[compositeKey]
    if (!encoded) return null
    const buffer = Buffer.from(encoded, 'base64')
    return safeStorage.decryptString(buffer)
  }

  async delete(profileId: string, key: string): Promise<void> {
    const compositeKey = `${profileId}:${key}`
    delete this.cache[compositeKey]
    this.save()
  }

  async deleteAll(profileId: string): Promise<void> {
    const prefix = `${profileId}:`
    for (const key of Object.keys(this.cache)) {
      if (key.startsWith(prefix)) {
        delete this.cache[key]
      }
    }
    this.save()
  }

  private load(): void {
    if (fs.existsSync(this.filePath)) {
      try {
        this.cache = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'))
      } catch {
        this.cache = {}
      }
    }
  }

  private save(): void {
    fs.writeFileSync(this.filePath, JSON.stringify(this.cache), 'utf-8')
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/keyring.test.ts`

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/keyring.ts tests/unit/keyring.test.ts
git commit -m "feat: implement KeyringService using Electron safeStorage"
```

---

### Task 5: Promote PostgreSQL to Bundled Plugin

**Files:**
- Create: `src/main/plugins/bundled/postgresql/index.ts`
- Create: `src/main/plugins/bundled/postgresql/postgres-adapter.ts`
- Delete: `src/main/db/postgres.ts`

- [ ] **Step 1: Create PostgreSQL plugin index**

Create `src/main/plugins/bundled/postgresql/index.ts`:

```ts
import type { PluginManifest } from '../../types'
import type { PluginContext } from '../../sdk/types'
import { PostgresAdapter } from './postgres-adapter'

export const manifest: PluginManifest = {
  name: 'dbstudio-plugin-postgresql',
  version: '1.0.0',
  displayName: 'PostgreSQL',
  description: 'PostgreSQL database driver',
  main: 'index.js',
  contributes: {
    drivers: [{ id: 'postgresql', name: 'PostgreSQL' }]
  }
}

export function activate(ctx: PluginContext): void {
  ctx.drivers.register('postgresql', {
    createAdapter: (config) => new PostgresAdapter(config),
    connectionFields: [
      { key: 'host', label: 'Host', type: 'text', required: true, default: 'localhost' },
      { key: 'port', label: 'Port', type: 'number', required: true, default: 5432 },
      { key: 'database', label: 'Database', type: 'text', required: true },
      { key: 'username', label: 'Username', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
      { key: 'ssl', label: 'SSL', type: 'boolean', default: false },
    ]
  })
}
```

- [ ] **Step 2: Move and update postgres adapter**

Create `src/main/plugins/bundled/postgresql/postgres-adapter.ts`. This is the contents of `src/main/db/postgres.ts` with `testConnection()` added and constructor changed to accept `Record<string, unknown>`:

```ts
import pg from 'pg'
import type { DbAdapter } from '../../../db/adapter'
import type { QueryResult, SchemaTable, SchemaColumn, SchemaIndex, FieldInfo, TestConnectionResult } from '@shared/types'

export class PostgresAdapter implements DbAdapter {
  private pool: pg.Pool | null = null
  private config: pg.PoolConfig

  constructor(config: Record<string, unknown>) {
    this.config = {
      host: config.host as string,
      port: config.port as number,
      database: config.database as string,
      user: config.username as string | undefined,
      password: config.password as string | undefined,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: 5,
      idleTimeoutMillis: 30000
    }
  }

  async connect(): Promise<void> {
    this.pool = new pg.Pool(this.config)
    const client = await this.pool.connect()
    client.release()
  }

  async testConnection(): Promise<TestConnectionResult> {
    if (!this.pool) throw new Error('Not connected')
    const result = await this.pool.query('SELECT version() as version')
    return { version: String(result.rows[0]?.version ?? 'unknown') }
  }

  async setSchema(schema: string): Promise<void> {
    if (!this.pool) throw new Error('Not connected')
    await this.pool.query(`SET search_path TO "${schema}"`)
  }

  async switchDatabase(database: string): Promise<void> {
    await this.pool?.end()
    this.config = { ...this.config, database }
    this.pool = new pg.Pool(this.config)
    const client = await this.pool.connect()
    client.release()
  }

  async disconnect(): Promise<void> {
    await this.pool?.end()
    this.pool = null
  }

  isConnected(): boolean {
    return this.pool !== null
  }

  async query(sql: string, params?: unknown[]): Promise<QueryResult> {
    if (!this.pool) throw new Error('Not connected')
    const start = performance.now()
    const result = await this.pool.query(sql, params)
    const duration = Math.round(performance.now() - start)
    const fields: FieldInfo[] = (result.fields ?? []).map(f => ({
      name: f.name,
      dataType: String(f.dataTypeID),
      nullable: true
    }))
    return {
      rows: result.rows ?? [],
      fields,
      rowCount: result.rows?.length ?? 0,
      duration,
      affectedRows: result.rowCount ?? 0
    }
  }

  async getTables(schema?: string): Promise<SchemaTable[]> {
    if (!this.pool) throw new Error('Not connected')
    const s = schema ?? 'public'
    const result = await this.pool.query(
      `SELECT table_name as name, table_type FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name`, [s]
    )
    return result.rows.map((r: { name: string; table_type: string }) => ({
      name: r.name, schema: s, type: r.table_type === 'VIEW' ? 'view' as const : 'table' as const
    }))
  }

  async getColumns(table: string, schema?: string): Promise<SchemaColumn[]> {
    if (!this.pool) throw new Error('Not connected')
    const s = schema ?? 'public'
    const colResult = await this.pool.query(
      `SELECT c.column_name as name, c.data_type, c.is_nullable, c.column_default FROM information_schema.columns c WHERE c.table_schema = $1 AND c.table_name = $2 ORDER BY c.ordinal_position`, [s, table]
    )
    const pkResult = await this.pool.query(
      `SELECT a.attname as column_name FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) JOIN pg_class c ON c.oid = i.indrelid JOIN pg_namespace n ON n.oid = c.relnamespace WHERE i.indisprimary AND c.relname = $1 AND n.nspname = $2`, [table, s]
    )
    const pkCols = new Set(pkResult.rows.map((r: { column_name: string }) => r.column_name))
    const fkResult = await this.pool.query(
      `SELECT kcu.column_name, ccu.table_name AS ref_table, ccu.column_name AS ref_column FROM information_schema.key_column_usage kcu JOIN information_schema.table_constraints tc ON tc.constraint_name = kcu.constraint_name JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name WHERE tc.constraint_type = 'FOREIGN KEY' AND kcu.table_schema = $1 AND kcu.table_name = $2`, [s, table]
    )
    const fkMap = new Map(fkResult.rows.map((r: { column_name: string; ref_table: string; ref_column: string }) => [r.column_name, { table: r.ref_table, column: r.ref_column }]))
    return colResult.rows.map((r: { name: string; data_type: string; is_nullable: string; column_default: string | null }) => ({
      name: r.name, dataType: r.data_type, nullable: r.is_nullable === 'YES', defaultValue: r.column_default, isPrimaryKey: pkCols.has(r.name), isForeignKey: fkMap.has(r.name), references: fkMap.get(r.name)
    }))
  }

  async getIndexes(table: string, schema?: string): Promise<SchemaIndex[]> {
    if (!this.pool) throw new Error('Not connected')
    const s = schema ?? 'public'
    const result = await this.pool.query(
      `SELECT i.relname as index_name, ix.indisunique as is_unique, array_agg(a.attname ORDER BY array_position(ix.indkey, a.attnum)) as columns FROM pg_class t JOIN pg_index ix ON t.oid = ix.indrelid JOIN pg_class i ON i.oid = ix.indexrelid JOIN pg_namespace n ON n.oid = t.relnamespace JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey) WHERE t.relname = $1 AND n.nspname = $2 AND NOT ix.indisprimary GROUP BY i.relname, ix.indisunique`, [table, s]
    )
    return result.rows.map((r: { index_name: string; is_unique: boolean; columns: string[] }) => ({
      name: r.index_name, columns: r.columns, unique: r.is_unique
    }))
  }

  async getSchemas(): Promise<string[]> {
    if (!this.pool) throw new Error('Not connected')
    const result = await this.pool.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast') ORDER BY schema_name`
    )
    return result.rows.map((r: { schema_name: string }) => r.schema_name)
  }

  async getDatabases(): Promise<string[]> {
    if (!this.pool) throw new Error('Not connected')
    const result = await this.pool.query(
      `SELECT datname FROM pg_database WHERE datistemplate = false AND datallowconn = true ORDER BY datname`
    )
    return result.rows.map((r: { datname: string }) => r.datname)
  }

  async getRowCount(table: string, schema?: string): Promise<number> {
    if (!this.pool) throw new Error('Not connected')
    const s = schema ?? 'public'
    const result = await this.pool.query(
      `SELECT count(*) as cnt FROM "${s}"."${table}"`
    )
    return parseInt(result.rows[0].cnt, 10)
  }
}
```

- [ ] **Step 3: Delete the old postgres adapter**

Run: `rm src/main/db/postgres.ts`

- [ ] **Step 4: Commit**

```bash
git add src/main/plugins/bundled/postgresql/ && git rm src/main/db/postgres.ts
git commit -m "feat: promote PostgreSQL adapter to bundled plugin"
```

---

### Task 6: Promote MySQL to Bundled Plugin

**Files:**
- Create: `src/main/plugins/bundled/mysql/index.ts`
- Create: `src/main/plugins/bundled/mysql/mysql-adapter.ts`
- Delete: `src/main/db/mysql.ts`

- [ ] **Step 1: Create MySQL plugin index**

Create `src/main/plugins/bundled/mysql/index.ts`:

```ts
import type { PluginManifest } from '../../types'
import type { PluginContext } from '../../sdk/types'
import { MysqlAdapter } from './mysql-adapter'

export const manifest: PluginManifest = {
  name: 'dbstudio-plugin-mysql',
  version: '1.0.0',
  displayName: 'MySQL',
  description: 'MySQL database driver',
  main: 'index.js',
  contributes: {
    drivers: [{ id: 'mysql', name: 'MySQL' }]
  }
}

export function activate(ctx: PluginContext): void {
  ctx.drivers.register('mysql', {
    createAdapter: (config) => new MysqlAdapter(config),
    connectionFields: [
      { key: 'host', label: 'Host', type: 'text', required: true, default: 'localhost' },
      { key: 'port', label: 'Port', type: 'number', required: true, default: 3306 },
      { key: 'database', label: 'Database', type: 'text', required: true },
      { key: 'username', label: 'Username', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
      { key: 'ssl', label: 'SSL', type: 'boolean', default: false },
    ]
  })
}
```

- [ ] **Step 2: Move and update MySQL adapter**

Create `src/main/plugins/bundled/mysql/mysql-adapter.ts`:

```ts
import mysql from 'mysql2/promise'
import type { DbAdapter } from '../../../db/adapter'
import type { QueryResult, SchemaTable, SchemaColumn, SchemaIndex, FieldInfo, TestConnectionResult } from '@shared/types'

export class MysqlAdapter implements DbAdapter {
  private pool: mysql.Pool | null = null
  private config: mysql.PoolOptions

  constructor(config: Record<string, unknown>) {
    this.config = {
      host: config.host as string,
      port: config.port as number,
      database: config.database as string,
      user: config.username as string | undefined,
      password: config.password as string | undefined,
      ssl: config.ssl ? {} : undefined,
      waitForConnections: true,
      connectionLimit: 5
    }
  }

  async connect(): Promise<void> {
    this.pool = mysql.createPool(this.config)
    const conn = await this.pool.getConnection()
    conn.release()
  }

  async testConnection(): Promise<TestConnectionResult> {
    if (!this.pool) throw new Error('Not connected')
    const [rows] = await this.pool.query('SELECT VERSION() as version')
    const version = String((rows as Record<string, unknown>[])[0]?.version ?? 'unknown')
    return { version }
  }

  async switchDatabase(database: string): Promise<void> {
    if (!this.pool) throw new Error('Not connected')
    await this.pool.query(`USE \`${database}\``)
    this.config = { ...this.config, database }
  }

  async setSchema(schema: string): Promise<void> {
    if (!this.pool) throw new Error('Not connected')
    await this.pool.query(`USE \`${schema}\``)
  }

  async disconnect(): Promise<void> {
    await this.pool?.end()
    this.pool = null
  }

  isConnected(): boolean { return this.pool !== null }

  async query(sql: string, params?: unknown[]): Promise<QueryResult> {
    if (!this.pool) throw new Error('Not connected')
    const start = performance.now()
    const [result, fields] = await this.pool.query(sql, params)
    const duration = Math.round(performance.now() - start)
    const isRows = Array.isArray(result)
    const rows = isRows ? (result as Record<string, unknown>[]) : []
    const fieldInfo: FieldInfo[] = (fields as mysql.FieldPacket[] ?? []).map(f => ({
      name: f.name, dataType: String(f.type), nullable: (f.flags ?? 0 & 1) === 0
    }))
    return { rows, fields: fieldInfo, rowCount: rows.length, duration, affectedRows: isRows ? 0 : (result as mysql.ResultSetHeader).affectedRows ?? 0 }
  }

  async getTables(schema?: string): Promise<SchemaTable[]> {
    if (!this.pool) throw new Error('Not connected')
    const db = schema ?? this.config.database
    const [rows] = await this.pool.query(`SELECT table_name as name, table_type FROM information_schema.tables WHERE table_schema = ? ORDER BY table_name`, [db])
    return (rows as { name: string; table_type: string }[]).map(r => ({
      name: r.name, schema: db as string, type: r.table_type === 'VIEW' ? 'view' as const : 'table' as const
    }))
  }

  async getColumns(table: string, schema?: string): Promise<SchemaColumn[]> {
    if (!this.pool) throw new Error('Not connected')
    const db = schema ?? this.config.database
    const [cols] = await this.pool.query(`SELECT column_name as name, data_type, is_nullable, column_default, column_key FROM information_schema.columns WHERE table_schema = ? AND table_name = ? ORDER BY ordinal_position`, [db, table])
    const [fks] = await this.pool.query(`SELECT column_name, referenced_table_name, referenced_column_name FROM information_schema.key_column_usage WHERE table_schema = ? AND table_name = ? AND referenced_table_name IS NOT NULL`, [db, table])
    const fkMap = new Map((fks as { column_name: string; referenced_table_name: string; referenced_column_name: string }[]).map(r => [r.column_name, { table: r.referenced_table_name, column: r.referenced_column_name }]))
    return (cols as { name: string; data_type: string; is_nullable: string; column_default: string | null; column_key: string }[]).map(r => ({
      name: r.name, dataType: r.data_type, nullable: r.is_nullable === 'YES', defaultValue: r.column_default, isPrimaryKey: r.column_key === 'PRI', isForeignKey: fkMap.has(r.name), references: fkMap.get(r.name)
    }))
  }

  async getIndexes(table: string, schema?: string): Promise<SchemaIndex[]> {
    if (!this.pool) throw new Error('Not connected')
    const db = schema ?? this.config.database
    const [rows] = await this.pool.query(`SELECT index_name, non_unique, GROUP_CONCAT(column_name ORDER BY seq_in_index) as columns FROM information_schema.statistics WHERE table_schema = ? AND table_name = ? AND index_name != 'PRIMARY' GROUP BY index_name, non_unique`, [db, table])
    return (rows as { index_name: string; non_unique: number; columns: string }[]).map(r => ({
      name: r.index_name, columns: r.columns.split(','), unique: r.non_unique === 0
    }))
  }

  async getSchemas(): Promise<string[]> {
    if (!this.pool) throw new Error('Not connected')
    const [rows] = await this.pool.query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('mysql', 'information_schema', 'performance_schema', 'sys') ORDER BY schema_name`)
    return (rows as { schema_name: string }[]).map(r => r.schema_name)
  }

  async getDatabases(): Promise<string[]> {
    if (!this.pool) throw new Error('Not connected')
    const [rows] = await this.pool.query(`SELECT schema_name FROM information_schema.schemata ORDER BY schema_name`)
    return (rows as { schema_name: string }[]).map(r => r.schema_name)
  }

  async getRowCount(table: string, schema?: string): Promise<number> {
    if (!this.pool) throw new Error('Not connected')
    const db = schema ?? this.config.database
    const [rows] = await this.pool.query(`SELECT count(*) as cnt FROM \`${db}\`.\`${table}\``)
    return (rows as { cnt: number }[])[0].cnt
  }
}
```

- [ ] **Step 3: Delete the old MySQL adapter**

Run: `rm src/main/db/mysql.ts`

- [ ] **Step 4: Commit**

```bash
git add src/main/plugins/bundled/mysql/ && git rm src/main/db/mysql.ts
git commit -m "feat: promote MySQL adapter to bundled plugin"
```

---

### Task 7: Promote SQLite to Bundled Plugin

**Files:**
- Create: `src/main/plugins/bundled/sqlite/index.ts`
- Create: `src/main/plugins/bundled/sqlite/sqlite-adapter.ts`
- Delete: `src/main/db/sqlite.ts`

- [ ] **Step 1: Create SQLite plugin index**

Create `src/main/plugins/bundled/sqlite/index.ts`:

```ts
import type { PluginManifest } from '../../types'
import type { PluginContext } from '../../sdk/types'
import { SqliteAdapter } from './sqlite-adapter'

export const manifest: PluginManifest = {
  name: 'dbstudio-plugin-sqlite',
  version: '1.0.0',
  displayName: 'SQLite',
  description: 'SQLite database driver',
  main: 'index.js',
  contributes: {
    drivers: [{ id: 'sqlite', name: 'SQLite' }]
  }
}

export function activate(ctx: PluginContext): void {
  ctx.drivers.register('sqlite', {
    createAdapter: (config) => new SqliteAdapter(config),
    connectionFields: [
      { key: 'database', label: 'Database File', type: 'file', required: true },
    ]
  })
}
```

- [ ] **Step 2: Move and update SQLite adapter**

Create `src/main/plugins/bundled/sqlite/sqlite-adapter.ts`:

```ts
import Database from 'better-sqlite3'
import type { DbAdapter } from '../../../db/adapter'
import type { QueryResult, SchemaTable, SchemaColumn, SchemaIndex, FieldInfo, TestConnectionResult } from '@shared/types'

export class SqliteAdapter implements DbAdapter {
  private db: Database.Database | null = null
  private dbPath: string

  constructor(config: Record<string, unknown>) {
    this.dbPath = config.database as string
  }

  async connect(): Promise<void> {
    this.db = new Database(this.dbPath)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')
  }

  async testConnection(): Promise<TestConnectionResult> {
    if (!this.db) throw new Error('Not connected')
    const row = this.db.prepare('SELECT sqlite_version() as version').get() as { version: string }
    return { version: row.version }
  }

  async disconnect(): Promise<void> {
    this.db?.close()
    this.db = null
  }

  isConnected(): boolean {
    return this.db !== null
  }

  async query(sql: string, params?: unknown[]): Promise<QueryResult> {
    if (!this.db) throw new Error('Not connected')

    const start = performance.now()
    const trimmed = sql.trim().toUpperCase()
    const isSelect = trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA') || trimmed.startsWith('WITH')

    if (isSelect) {
      const stmt = this.db.prepare(sql)
      const rows = params ? stmt.all(...params) : stmt.all()
      const duration = Math.round(performance.now() - start)
      const columns = stmt.columns()
      const fields: FieldInfo[] = columns.map(c => ({
        name: c.name,
        dataType: c.type ?? 'unknown',
        nullable: true
      }))
      return { rows: rows as Record<string, unknown>[], fields, rowCount: rows.length, duration, affectedRows: 0 }
    } else {
      const stmt = this.db.prepare(sql)
      const info = params ? stmt.run(...params) : stmt.run()
      const duration = Math.round(performance.now() - start)
      return { rows: [], fields: [], rowCount: 0, duration, affectedRows: info.changes }
    }
  }

  async getTables(schema?: string): Promise<SchemaTable[]> {
    if (!this.db) throw new Error('Not connected')
    const rows = this.db.prepare(
      "SELECT name, type FROM sqlite_master WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).all() as { name: string; type: string }[]
    return rows.map(r => ({
      name: r.name,
      schema: schema ?? 'main',
      type: r.type as 'table' | 'view'
    }))
  }

  async getColumns(table: string, _schema?: string): Promise<SchemaColumn[]> {
    if (!this.db) throw new Error('Not connected')
    const rows = this.db.prepare(`PRAGMA table_info("${table}")`).all() as {
      cid: number; name: string; type: string; notnull: number; dflt_value: string | null; pk: number
    }[]
    const fkRows = this.db.prepare(`PRAGMA foreign_key_list("${table}")`).all() as {
      from: string; table: string; to: string
    }[]
    const fkMap = new Map(fkRows.map(fk => [fk.from, { table: fk.table, column: fk.to }]))
    return rows.map(r => ({
      name: r.name,
      dataType: r.type || 'TEXT',
      nullable: r.notnull === 0,
      defaultValue: r.dflt_value,
      isPrimaryKey: r.pk > 0,
      isForeignKey: fkMap.has(r.name),
      references: fkMap.get(r.name)
    }))
  }

  async getIndexes(table: string, _schema?: string): Promise<SchemaIndex[]> {
    if (!this.db) throw new Error('Not connected')
    const idxRows = this.db.prepare(`PRAGMA index_list("${table}")`).all() as {
      name: string; unique: number
    }[]
    return idxRows.map(idx => {
      const cols = this.db!.prepare(`PRAGMA index_info("${idx.name}")`).all() as { name: string }[]
      return {
        name: idx.name,
        columns: cols.map(c => c.name),
        unique: idx.unique === 1
      }
    })
  }

  async getRowCount(table: string, _schema?: string): Promise<number> {
    if (!this.db) throw new Error('Not connected')
    const row = this.db.prepare(`SELECT count(*) as cnt FROM "${table}"`).get() as { cnt: number }
    return row.cnt
  }

  async getSchemas(): Promise<string[]> {
    if (!this.db) throw new Error('Not connected')
    const rows = this.db.prepare('PRAGMA database_list').all() as { name: string }[]
    return rows.map(r => r.name)
  }

  async getDatabases(): Promise<string[]> {
    return [this.dbPath.split('/').pop() ?? this.dbPath]
  }

  async switchDatabase(_database: string): Promise<void> {
    throw new Error('SQLite does not support switching databases')
  }
}
```

- [ ] **Step 3: Delete the old SQLite adapter**

Run: `rm src/main/db/sqlite.ts`

- [ ] **Step 4: Commit**

```bash
git add src/main/plugins/bundled/sqlite/ && git rm src/main/db/sqlite.ts
git commit -m "feat: promote SQLite adapter to bundled plugin"
```

---

### Task 8: Add testConnection to Snowflake, Redis, and MongoDB Adapters

**Files:**
- Modify: `src/main/plugins/bundled/snowflake/snowflake-adapter.ts`
- Modify: `src/main/plugins/bundled/redis/redis-adapter.ts`
- Modify: `src/main/plugins/bundled/mongodb/mongo-adapter.ts`

- [ ] **Step 1: Add testConnection to SnowflakeAdapter**

In `src/main/plugins/bundled/snowflake/snowflake-adapter.ts`, add the import for `TestConnectionResult`:

Change the import line from:
```ts
import type { QueryResult, SchemaTable, SchemaColumn, SchemaIndex, FieldInfo } from '@shared/types'
```
to:
```ts
import type { QueryResult, SchemaTable, SchemaColumn, SchemaIndex, FieldInfo, TestConnectionResult } from '@shared/types'
```

Add `testConnection()` method after the `connect()` method:

```ts
  async testConnection(): Promise<TestConnectionResult> {
    const result = await this.query('SELECT CURRENT_VERSION() as version')
    return { version: String(result.rows[0]?.version ?? 'unknown') }
  }
```

- [ ] **Step 2: Add testConnection to RedisAdapter**

In `src/main/plugins/bundled/redis/redis-adapter.ts`, add the import for `TestConnectionResult`:

Change the import line from:
```ts
import type { QueryResult, SchemaTable, SchemaColumn, SchemaIndex, FieldInfo } from '@shared/types'
```
to:
```ts
import type { QueryResult, SchemaTable, SchemaColumn, SchemaIndex, FieldInfo, TestConnectionResult } from '@shared/types'
```

Add `testConnection()` method after the `connect()` method:

```ts
  async testConnection(): Promise<TestConnectionResult> {
    if (!this.client) throw new Error('Not connected')
    const pong = await this.client.ping()
    const info = await this.client.info('server')
    const versionMatch = info.match(/redis_version:(.+)/)
    const version = versionMatch ? versionMatch[1].trim() : pong
    return { version: `Redis ${version}` }
  }
```

- [ ] **Step 3: Add testConnection to MongoAdapter**

In `src/main/plugins/bundled/mongodb/mongo-adapter.ts`, add the import for `TestConnectionResult`:

Change the import line from:
```ts
import type { QueryResult, SchemaTable, SchemaColumn, SchemaIndex, FieldInfo } from '@shared/types'
```
to:
```ts
import type { QueryResult, SchemaTable, SchemaColumn, SchemaIndex, FieldInfo, TestConnectionResult } from '@shared/types'
```

Add `testConnection()` method after the `connect()` method:

```ts
  async testConnection(): Promise<TestConnectionResult> {
    if (!this.db) throw new Error('Not connected')
    const result = await this.db.admin().serverInfo()
    return { version: `MongoDB ${result.version ?? 'unknown'}` }
  }
```

- [ ] **Step 4: Run type check**

Run: `npx tsc --noEmit 2>&1 | head -20`

Expected: No errors related to missing `testConnection` on any adapter.

- [ ] **Step 5: Commit**

```bash
git add src/main/plugins/bundled/snowflake/snowflake-adapter.ts src/main/plugins/bundled/redis/redis-adapter.ts src/main/plugins/bundled/mongodb/mongo-adapter.ts
git commit -m "feat: add testConnection to snowflake, redis, and mongodb adapters"
```

---

### Task 9: Simplify Factory and Update IPC Handlers

**Files:**
- Modify: `src/main/db/factory.ts`
- Modify: `src/main/ipc-handlers.ts`
- Modify: `shared/ipc.ts`

- [ ] **Step 1: Replace factory.ts with pure registry lookup**

Replace the entire contents of `src/main/db/factory.ts`:

```ts
import type { ConnectionProfile } from '@shared/types'
import type { DbAdapter } from './adapter'
import type { DriverRegistryImpl } from '../plugins/sdk/driver-registry'

let pluginDriverRegistry: DriverRegistryImpl | null = null

export function setDriverRegistry(registry: DriverRegistryImpl): void {
  pluginDriverRegistry = registry
}

export function createAdapter(profile: ConnectionProfile): DbAdapter {
  if (!pluginDriverRegistry) {
    throw new Error('Driver registry not initialized')
  }
  const factory = pluginDriverRegistry.get(profile.type)
  if (!factory) {
    throw new Error(`No driver registered for type: ${profile.type}`)
  }
  return factory.createAdapter(profile as unknown as Record<string, unknown>)
}
```

- [ ] **Step 2: Add new IPC channel types to shared/ipc.ts**

In `shared/ipc.ts`, update the `db:test-connection` return type (line 19) from:
```ts
    return: { success: boolean; error?: string; version?: string }
```
to:
```ts
    return: { success: boolean; error?: string; version?: string; details?: Record<string, string> }
```

Add new channels before the closing `}` of `IpcChannelMap` (before line 157):

```ts
  'db:connection-options': {
    args: [profile: ConnectionProfile, field: string]
    return: string[]
  }
  'keyring:store': {
    args: [profileId: string, key: string, value: string]
    return: void
  }
  'keyring:retrieve': {
    args: [profileId: string, key: string]
    return: string | null
  }
  'keyring:delete': {
    args: [profileId: string, key: string]
    return: void
  }
```

- [ ] **Step 3: Update ipc-handlers.ts imports**

In `src/main/ipc-handlers.ts`, replace the import block (lines 1-24) with:

```ts
import { ipcMain, app, dialog, BrowserWindow } from 'electron'
import fs from 'fs'
import { ConfigStore } from './config/store'
import type { AppSettings } from '@shared/settings'
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
import { KeyringService } from './keyring'
import * as sshPlugin from './plugins/bundled/ssh-tunnel'
import * as mongoPlugin from './plugins/bundled/mongodb'
import * as redisPlugin from './plugins/bundled/redis'
import * as snowflakePlugin from './plugins/bundled/snowflake'
import * as postgresqlPlugin from './plugins/bundled/postgresql'
import * as mysqlPlugin from './plugins/bundled/mysql'
import * as sqlitePlugin from './plugins/bundled/sqlite'
```

- [ ] **Step 4: Simplify db:test-connection handler**

In `src/main/ipc-handlers.ts`, replace the `db:test-connection` handler (lines 189-210):

```ts
  handle('db:test-connection', async (profile: ConnectionProfile) => {
    let adapter: DbAdapter | null = null
    try {
      adapter = createAdapter(profile)
      await adapter.connect()
      const versionQuery =
        profile.type === 'sqlite'
          ? 'SELECT sqlite_version() as version'
          : profile.type === 'postgresql'
            ? 'SELECT version() as version'
            : profile.type === 'snowflake'
              ? 'SELECT CURRENT_VERSION() as version'
              : 'SELECT VERSION() as version'
      const result = await adapter.query(versionQuery)
      const version = String(result.rows[0]?.version ?? 'unknown')
      return { success: true, version }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    } finally {
      await adapter?.disconnect()
    }
  })
```

with:

```ts
  handle('db:test-connection', async (profile: ConnectionProfile) => {
    let adapter: DbAdapter | null = null
    try {
      adapter = createAdapter(profile)
      await adapter.connect()
      const result = await adapter.testConnection()
      return { success: true, ...result }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    } finally {
      await adapter?.disconnect()
    }
  })
```

- [ ] **Step 5: Add db:connection-options handler**

Add after the `db:test-connection` handler:

```ts
  handle('db:connection-options', async (profile: ConnectionProfile, field: string) => {
    let adapter: DbAdapter | null = null
    try {
      adapter = createAdapter(profile)
      await adapter.connect()
      if (!adapter.getConnectionOptions) {
        return []
      }
      return await adapter.getConnectionOptions(field)
    } finally {
      await adapter?.disconnect()
    }
  })
```

- [ ] **Step 6: Add keyring handlers and register new bundled plugins**

Add a keyring instance near the top of the `registerIpcHandlers` function (after the `activeAdapters` line):

```ts
  const keyring = new KeyringService()
```

Add keyring IPC handlers after the `db:connection-options` handler:

```ts
  handle('keyring:store', async (profileId: string, key: string, value: string) => {
    await keyring.store(profileId, key, value)
  })

  handle('keyring:retrieve', async (profileId: string, key: string) => {
    return keyring.retrieve(profileId, key)
  })

  handle('keyring:delete', async (profileId: string, key: string) => {
    await keyring.delete(profileId, key)
  })
```

Update the bundled plugin registration block (lines 436-439) to include the new plugins:

```ts
  // Register bundled plugins
  pluginCoordinator.registerBundledPlugin(sshPlugin.manifest, sshPlugin)
  pluginCoordinator.registerBundledPlugin(mongoPlugin.manifest, mongoPlugin)
  pluginCoordinator.registerBundledPlugin(redisPlugin.manifest, redisPlugin)
  pluginCoordinator.registerBundledPlugin(snowflakePlugin.manifest, snowflakePlugin)
  pluginCoordinator.registerBundledPlugin(postgresqlPlugin.manifest, postgresqlPlugin)
  pluginCoordinator.registerBundledPlugin(mysqlPlugin.manifest, mysqlPlugin)
  pluginCoordinator.registerBundledPlugin(sqlitePlugin.manifest, sqlitePlugin)
```

Pass `keyring` to the `PluginBootCoordinator` constructor deps — add it to the config object passed on line 418:

In the `PluginBootCoordinator` constructor call, add `keyring` to the deps:

```ts
  const pluginCoordinator = new PluginBootCoordinator({
    driverRegistry,
    commandRegistry,
    panelRegistry,
    getAdapter: (id) => activeAdapters.get(id),
    getProfile: (id) => configStore.getConnection(id),
    keyring,
    settingsStore: {
      get: (key) => {
        const pluginSettings = configStore.getSettingsCategory('plugins')
        return pluginSettings[key]
      },
      set: (key, value) => {
        configStore.setSetting(`plugins.${key}`, value)
      }
    }
  })
```

> **Note:** The `PluginBootCoordinator` constructor in `plugin-host.ts` needs to accept and pass through the `keyring` to `createPluginContext`. This is handled in Task 10.

- [ ] **Step 7: Commit**

```bash
git add src/main/db/factory.ts src/main/ipc-handlers.ts shared/ipc.ts
git commit -m "feat: simplify factory to registry lookup, add connection-options and keyring IPC"
```

---

### Task 10: Wire Keyring Through Plugin Boot Coordinator

**Files:**
- Modify: `src/main/plugins/plugin-host.ts`

- [ ] **Step 1: Update PluginBootCoordinator deps type**

In `src/main/plugins/plugin-host.ts`, find the `BootDeps` interface (or the constructor parameter type) and add `keyring`:

Find the deps interface/type that includes `driverRegistry`, `commandRegistry`, `panelRegistry`, `getAdapter`, `getProfile`, `settingsStore` and add:

```ts
  keyring: import('./sdk/types').KeyringAccess
```

- [ ] **Step 2: Pass keyring to createPluginContext**

Find where `createPluginContext` is called in `plugin-host.ts` and add `keyring: this.deps.keyring` to its argument object.

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit 2>&1 | head -20`

Expected: No type errors. The keyring flows from `ipc-handlers.ts` → `PluginBootCoordinator` → `createPluginContext` → `PluginContext`.

- [ ] **Step 4: Commit**

```bash
git add src/main/plugins/plugin-host.ts
git commit -m "feat: wire keyring through plugin boot coordinator"
```

---

### Task 11: Add getConnectionOptions to Snowflake Adapter

**Files:**
- Modify: `src/main/plugins/bundled/snowflake/snowflake-adapter.ts`
- Modify: `src/main/plugins/bundled/snowflake/index.ts`

- [ ] **Step 1: Update Snowflake connection fields to use select + fetchable**

In `src/main/plugins/bundled/snowflake/index.ts`, replace the `connectionFields` array:

```ts
    connectionFields: [
      { key: 'account', label: 'Account Identifier', type: 'text', required: true },
      { key: 'host', label: 'Host Override', type: 'text' },
      { key: 'database', label: 'Database', type: 'text', required: true },
      { key: 'schema', label: 'Schema', type: 'text', default: 'PUBLIC' },
      { key: 'warehouse', label: 'Warehouse', type: 'text' },
      { key: 'role', label: 'Role', type: 'text' },
      { key: 'username', label: 'Username', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
      { key: 'privateKeyPath', label: 'Private Key File', type: 'file' },
      { key: 'passphrase', label: 'Key Passphrase', type: 'password' },
      { key: 'authenticator', label: 'Authenticator', type: 'text', default: 'externalbrowser' },
    ]
```

with:

```ts
    connectionFields: [
      { key: 'account', label: 'Account Identifier', type: 'text', required: true },
      { key: 'host', label: 'Host Override', type: 'text' },
      { key: 'username', label: 'Username', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
      { key: 'authenticator', label: 'Authenticator', type: 'text', default: 'externalbrowser' },
      { key: 'privateKeyPath', label: 'Private Key File', type: 'file' },
      { key: 'passphrase', label: 'Key Passphrase', type: 'password' },
      { key: 'database', label: 'Database', type: 'select', fetchable: true },
      { key: 'warehouse', label: 'Warehouse', type: 'select', fetchable: true },
      { key: 'role', label: 'Role', type: 'select', fetchable: true },
      { key: 'schema', label: 'Schema', type: 'select', fetchable: true, default: 'PUBLIC' },
    ]
```

- [ ] **Step 2: Add getConnectionOptions to SnowflakeAdapter**

In `src/main/plugins/bundled/snowflake/snowflake-adapter.ts`, add after the `testConnection()` method:

```ts
  async getConnectionOptions(field: string): Promise<string[]> {
    switch (field) {
      case 'warehouse': {
        const result = await this.query('SHOW WAREHOUSES')
        return result.rows.map((r: Record<string, unknown>) => String(r.name))
      }
      case 'role': {
        const result = await this.query('SHOW ROLES')
        return result.rows.map((r: Record<string, unknown>) => String(r.name))
      }
      case 'database': {
        const result = await this.query('SHOW DATABASES')
        return result.rows.map((r: Record<string, unknown>) => String(r.name))
      }
      case 'schema': {
        const result = await this.query('SHOW SCHEMAS')
        return result.rows.map((r: Record<string, unknown>) => String(r.name))
      }
      default:
        return []
    }
  }
```

- [ ] **Step 3: Commit**

```bash
git add src/main/plugins/bundled/snowflake/snowflake-adapter.ts src/main/plugins/bundled/snowflake/index.ts
git commit -m "feat: add fetchable dropdowns and getConnectionOptions to snowflake"
```

---

### Task 12: Update Connection Form — Plugin-Driven Fields and Two-Phase Auth

**Files:**
- Modify: `src/renderer/src/components/connections/ConnectionFormView.tsx`
- Modify: `src/renderer/src/components/connections/ConnectionTestButton.tsx`

- [ ] **Step 1: Update ConnectionTestButton to show details**

Replace the entire contents of `src/renderer/src/components/connections/ConnectionTestButton.tsx`:

```tsx
import { useState } from 'react'
import type { ConnectionProfile } from '@shared/types'
import { Stack, Button, Spinner, Alert } from '@/primitives'

interface Props {
  profile: ConnectionProfile
}

export function ConnectionTestButton({ profile }: Props) {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const test = async () => {
    setStatus('testing')
    const result = await window.electronAPI.invoke('db:test-connection', profile)
    if (result.success) {
      setStatus('success')
      const parts = [result.version ?? 'Connected']
      if (result.details) {
        for (const [k, v] of Object.entries(result.details)) {
          parts.push(`${k}: ${v}`)
        }
      }
      setMessage(parts.join(' | '))
    } else {
      setStatus('error')
      setMessage(result.error ?? 'Connection failed')
    }
    setTimeout(() => setStatus('idle'), 3000)
  }

  return (
    <Stack gap="sm">
      <div>
        <Button
          variant="outline"
          size="lg"
          onClick={test}
          disabled={status === 'testing'}
          className="flex items-center gap-1.5"
        >
          {status === 'testing' ? <Spinner size="xs" /> : null}
          Test Connection
        </Button>
      </div>
      {status === 'success' && (
        <Alert variant="success" title="Connection successful">{message}</Alert>
      )}
      {status === 'error' && (
        <Alert variant="error" title="Connection failed">{message}</Alert>
      )}
    </Stack>
  )
}
```

- [ ] **Step 2: Rewrite ConnectionFormView — all types from plugins**

Replace the entire contents of `src/renderer/src/components/connections/ConnectionFormView.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { ConnectionTestButton } from './ConnectionTestButton'
import { useConnectionsStore } from '@/stores/connections'
import { useTabsStore } from '@/stores/tabs'
import type { ConnectionProfile, DatabaseType } from '@shared/types'
import {
  ScrollArea, Container, Stack, Flex, Box, Divider,
  Heading, Text,
  FormField, Input, NumberInput, PasswordInput, Select, Switch, ColorInput, FileContentInput,
  Button, Spinner
} from '@/primitives'

interface Props {
  tabId: string
  editingId?: string
}

interface PluginDriver {
  driverId: string
  driverName: string
  connectionFields: { key: string; label: string; type: string; required?: boolean; default?: string | number | boolean; group?: string; fetchable?: boolean }[]
}

interface MiddlewareField {
  key: string; label: string; type: string; required?: boolean; default?: string | number | boolean; group?: string
}

const COLOR_PRESETS = ['#7c6ff7', '#28c840', '#e5c07b', '#61afef', '#ff5f57', '#c678dd']

export function ConnectionFormView({ tabId, editingId }: Props) {
  const saveConnection = useConnectionsStore(s => s.saveConnection)
  const connections = useConnectionsStore(s => s.connections)
  const closeTab = useTabsStore(s => s.closeTab)

  const [pluginDrivers, setPluginDrivers] = useState<PluginDriver[]>([])
  const [middlewareFields, setMiddlewareFields] = useState<MiddlewareField[]>([])
  const [sshExpanded, setSshExpanded] = useState(false)
  const [fetchableOptions, setFetchableOptions] = useState<Record<string, string[]>>({})
  const [authStatus, setAuthStatus] = useState<'idle' | 'authenticating' | 'authenticated' | 'error'>('idle')
  const [authError, setAuthError] = useState('')

  const existingProfile = editingId ? connections.find(c => c.id === editingId) : undefined

  const [profile, setProfile] = useState<Record<string, unknown>>({
    id: crypto.randomUUID(),
    name: '',
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: '',
    username: '',
    password: '',
    color: '#7c6ff7',
    ...(existingProfile ?? {})
  })

  useEffect(() => {
    window.electronAPI.invoke('plugins:connection-fields').then(setPluginDrivers).catch(() => {})
    window.electronAPI.invoke('plugins:middleware-fields').then(setMiddlewareFields).catch(() => {})
  }, [])

  const allTypes = pluginDrivers.map(d => ({
    value: d.driverId as DatabaseType,
    label: d.driverName.charAt(0).toUpperCase() + d.driverName.slice(1)
  }))

  const activePluginDriver = pluginDrivers.find(d => d.driverId === profile.type)
  const sshFields = middlewareFields.filter(f => f.group === 'ssh')
  const hasFetchableFields = activePluginDriver?.connectionFields.some(f => f.fetchable) ?? false

  const update = (patch: Record<string, unknown>) => setProfile(p => ({ ...p, ...patch }))

  const handleTypeChange = (type: DatabaseType) => {
    const driver = pluginDrivers.find(d => d.driverId === type)
    const defaults: Record<string, unknown> = { type }
    if (driver) {
      for (const field of driver.connectionFields) {
        if (field.default !== undefined && profile[field.key] === undefined) {
          defaults[field.key] = field.default
        }
      }
    }
    update(defaults)
    // Reset auth state when type changes
    setAuthStatus('idle')
    setFetchableOptions({})
  }

  const handleAuthenticate = async () => {
    if (!activePluginDriver) return
    setAuthStatus('authenticating')
    setAuthError('')
    try {
      const fetchableFields = activePluginDriver.connectionFields.filter(f => f.fetchable)
      const options: Record<string, string[]> = {}
      for (const field of fetchableFields) {
        const result = await window.electronAPI.invoke('db:connection-options', profile as ConnectionProfile, field.key)
        options[field.key] = result
      }
      setFetchableOptions(options)
      setAuthStatus('authenticated')
    } catch (err) {
      setAuthStatus('error')
      setAuthError((err as Error).message)
    }
  }

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    await saveConnection(profile as ConnectionProfile)
    closeTab(tabId)
  }

  const handleCancel = () => closeTab(tabId)

  const renderPluginField = (field: { key: string; label: string; type: string; required?: boolean; default?: string | number | boolean; fetchable?: boolean }) => {
    const value = profile[field.key] ?? field.default ?? ''

    // Fetchable select fields
    if (field.fetchable && field.type === 'select') {
      const options = fetchableOptions[field.key]
      const isAuthenticated = authStatus === 'authenticated' && options !== undefined

      if (isAuthenticated && options.length > 0) {
        return (
          <FormField key={field.key} label={field.label}>
            <Select
              size="lg"
              value={String(value)}
              onChange={(v) => update({ [field.key]: v })}
              options={options.map(o => ({ value: o, label: o }))}
            />
          </FormField>
        )
      }

      // Before auth or if fetch returned empty — show disabled text input
      return (
        <FormField key={field.key} label={field.label}>
          <Input
            value={String(value)}
            onChange={(e) => update({ [field.key]: e.target.value })}
            placeholder={authStatus === 'authenticated' ? 'Type a value' : 'Authenticate first'}
            disabled={authStatus !== 'authenticated'}
            size="lg"
          />
        </FormField>
      )
    }

    if (field.type === 'boolean') {
      return (
        <Flex key={field.key} direction="row" align="center" gap="md">
          <Switch
            label={field.label}
            checked={!!profile[field.key]}
            onChange={(e) => update({ [field.key]: e.target.checked })}
          />
          <Text size="lg" color="secondary">{field.label}</Text>
        </Flex>
      )
    }

    if (field.type === 'password') {
      return (
        <FormField key={field.key} label={field.label}>
          <PasswordInput
            value={String(value)}
            onChange={(e) => update({ [field.key]: e.target.value })}
            size="lg"
          />
        </FormField>
      )
    }

    if (field.type === 'number') {
      return (
        <FormField key={field.key} label={field.label}>
          <NumberInput
            value={Number(value) || 0}
            onChange={(v) => update({ [field.key]: v })}
            size="lg"
          />
        </FormField>
      )
    }

    if (field.type === 'file') {
      return (
        <FormField key={field.key} label={field.label}>
          <FileContentInput
            value={String(value)}
            onChange={(content) => update({ [field.key]: content })}
            accept=".pem,.key"
            size="lg"
          />
        </FormField>
      )
    }

    return (
      <FormField key={field.key} label={field.label}>
        <Input
          required={field.required}
          value={String(value)}
          onChange={(e) => update({ [field.key]: e.target.value })}
          size="lg"
        />
      </FormField>
    )
  }

  return (
    <ScrollArea direction="vertical" className="h-full bg-bg-primary">
      <Container size="md" className="py-8">
        <form onSubmit={handleSubmit}>
          <Stack gap="xl">
            {/* Header */}
            <Flex direction="row" align="center" justify="between">
              <Heading level={2}>{editingId ? 'Edit Connection' : 'New Connection'}</Heading>
              <Flex direction="row" gap="md">
                <Button type="button" variant="outline" size="md" onClick={handleCancel}>Cancel</Button>
                <Button type="submit" variant="solid" size="md">
                  {editingId ? 'Save Changes' : 'Add Connection'}
                </Button>
              </Flex>
            </Flex>

            <Divider />

            {/* Database Type */}
            <Stack gap="md">
              <Text size="xs" color="muted" weight="semibold" className="uppercase tracking-wider">Database Type</Text>
              <FormField label="Database Type">
                <Select
                  size="lg"
                  value={String(profile.type)}
                  onChange={(v) => handleTypeChange(v as DatabaseType)}
                  options={allTypes}
                />
              </FormField>
            </Stack>

            {/* General */}
            <Stack gap="md">
              <Text size="sm" color="muted" weight="semibold" className="uppercase tracking-wider">General</Text>
              <FormField label="Connection Name">
                <Input
                  required
                  value={String(profile.name ?? '')}
                  onChange={(e) => update({ name: e.target.value })}
                  placeholder="My Database"
                  size="lg"
                />
              </FormField>
              <FormField label="Color">
                <ColorInput
                  value={String(profile.color ?? '#7c6ff7')}
                  onChange={(v) => update({ color: v })}
                  presets={COLOR_PRESETS}
                  size="lg"
                />
              </FormField>
            </Stack>

            {/* Connection fields — all from plugins */}
            {activePluginDriver && (
              <Stack gap="md">
                <Text size="xs" color="muted" weight="semibold" className="uppercase tracking-wider">Connection</Text>
                {activePluginDriver.connectionFields.filter(f => !f.group && !f.fetchable).map(renderPluginField)}
              </Stack>
            )}

            {/* Authenticate button for fetchable fields */}
            {hasFetchableFields && (
              <Stack gap="md">
                <Text size="xs" color="muted" weight="semibold" className="uppercase tracking-wider">Authenticate to load options</Text>
                <Flex direction="row" align="center" gap="md">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={handleAuthenticate}
                    disabled={authStatus === 'authenticating'}
                    className="flex items-center gap-1.5"
                  >
                    {authStatus === 'authenticating' ? <Spinner size="xs" /> : null}
                    {authStatus === 'authenticated' ? 'Re-authenticate' : 'Authenticate'}
                  </Button>
                  {authStatus === 'authenticated' && (
                    <Text size="sm" color="success">Authenticated — select options below</Text>
                  )}
                </Flex>
                {authStatus === 'error' && (
                  <Text size="sm" color="error">{authError}</Text>
                )}
              </Stack>
            )}

            {/* Fetchable fields (dropdowns after auth) */}
            {activePluginDriver && activePluginDriver.connectionFields.some(f => f.fetchable) && (
              <Stack gap="md">
                <Text size="xs" color="muted" weight="semibold" className="uppercase tracking-wider">Configuration</Text>
                {activePluginDriver.connectionFields.filter(f => f.fetchable).map(renderPluginField)}
              </Stack>
            )}

            {/* SSH Tunnel */}
            {sshFields.length > 0 && (
              <Box className="border border-border-default rounded-lg overflow-hidden">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSshExpanded(!sshExpanded)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-none border-0 h-auto justify-start"
                >
                  {sshExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <Text size="lg" color="secondary">SSH Tunnel</Text>
                </Button>
                {sshExpanded && (
                  <Stack gap="md" className="px-3 pb-3">
                    {sshFields.map(renderPluginField)}
                  </Stack>
                )}
              </Box>
            )}

            {/* Test Connection */}
            <ConnectionTestButton profile={profile as ConnectionProfile} />
          </Stack>
        </form>
      </Container>
    </ScrollArea>
  )
}
```

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit 2>&1 | head -20`

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/connections/ConnectionFormView.tsx src/renderer/src/components/connections/ConnectionTestButton.tsx
git commit -m "feat: plugin-driven connection form with two-phase auth for fetchable fields"
```

---

### Task 13: Update Tests

**Files:**
- Modify: `tests/unit/adapter.test.ts`
- Modify: `tests/unit/bundled-plugins.test.ts`

- [ ] **Step 1: Update adapter factory tests**

Replace the entire contents of `tests/unit/adapter.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createAdapter, setDriverRegistry } from '../../src/main/db/factory'
import { DriverRegistryImpl } from '../../src/main/plugins/sdk/driver-registry'
import type { DbAdapter } from '../../src/main/db/adapter'
import type { ConnectionProfile } from '../../shared/types'

function makeStubAdapter(): DbAdapter {
  return {
    connect: async () => {},
    disconnect: async () => {},
    testConnection: async () => ({ version: '1.0' }),
    query: async () => ({ rows: [], fields: [], rowCount: 0, duration: 0, affectedRows: 0 }),
    getTables: async () => [],
    getColumns: async () => [],
    getIndexes: async () => [],
    getRowCount: async () => 0,
    getSchemas: async () => [],
    getDatabases: async () => [],
    switchDatabase: async () => {},
    isConnected: () => true
  }
}

describe('createAdapter factory', () => {
  let registry: DriverRegistryImpl

  beforeEach(() => {
    registry = new DriverRegistryImpl()
    setDriverRegistry(registry)
  })

  it('creates adapter from registered driver', () => {
    registry.register('postgresql', {
      createAdapter: () => makeStubAdapter(),
      connectionFields: []
    })
    const profile: ConnectionProfile = { id: '1', name: 'test', type: 'postgresql', database: 'testdb' }
    const adapter = createAdapter(profile)
    expect(adapter.isConnected()).toBe(true)
  })

  it('throws on unregistered type', () => {
    const profile: ConnectionProfile = { id: '2', name: 'test', type: 'oracle' as any, database: 'test' }
    expect(() => createAdapter(profile)).toThrow('No driver registered for type: oracle')
  })

  it('throws if registry not initialized', () => {
    setDriverRegistry(null as any)
    const profile: ConnectionProfile = { id: '3', name: 'test', type: 'postgresql', database: 'test' }
    expect(() => createAdapter(profile)).toThrow('Driver registry not initialized')
  })
})
```

- [ ] **Step 2: Update bundled plugins tests**

Replace the entire contents of `tests/unit/bundled-plugins.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { PluginBootCoordinator } from '../../src/main/plugins/plugin-host'
import { DriverRegistryImpl } from '../../src/main/plugins/sdk/driver-registry'
import { CommandRegistryImpl } from '../../src/main/plugins/sdk/command-registry'
import { PanelRegistryImpl } from '../../src/main/plugins/sdk/panel-registry'

import * as sshPlugin from '../../src/main/plugins/bundled/ssh-tunnel/index'
import * as mongoPlugin from '../../src/main/plugins/bundled/mongodb/index'
import * as redisPlugin from '../../src/main/plugins/bundled/redis/index'
import * as snowflakePlugin from '../../src/main/plugins/bundled/snowflake/index'
import * as postgresqlPlugin from '../../src/main/plugins/bundled/postgresql/index'
import * as mysqlPlugin from '../../src/main/plugins/bundled/mysql/index'
import * as sqlitePlugin from '../../src/main/plugins/bundled/sqlite/index'

const noopKeyring = {
  store: async () => {},
  retrieve: async () => null,
  delete: async () => {}
}

describe('Bundled Plugins', () => {
  let coordinator: PluginBootCoordinator
  let driverRegistry: DriverRegistryImpl

  beforeEach(() => {
    driverRegistry = new DriverRegistryImpl()
    const commandRegistry = new CommandRegistryImpl()
    const panelRegistry = new PanelRegistryImpl()
    coordinator = new PluginBootCoordinator({
      driverRegistry,
      commandRegistry,
      panelRegistry,
      getAdapter: () => undefined,
      getProfile: () => undefined,
      keyring: noopKeyring,
      settingsStore: { get: () => undefined, set: () => {} }
    })
  })

  it('SSH plugin registers middleware', async () => {
    coordinator.registerBundledPlugin(sshPlugin.manifest, sshPlugin)
    const plugin = coordinator.getPlugin('dbstudio-plugin-ssh')!
    await coordinator.activatePlugin(plugin)
    expect(plugin.status.state).toBe('active')
    expect(driverRegistry.hasMiddleware('ssh-tunnel')).toBe(true)
  })

  it('MongoDB plugin registers driver', async () => {
    coordinator.registerBundledPlugin(mongoPlugin.manifest, mongoPlugin)
    const plugin = coordinator.getPlugin('dbstudio-plugin-mongodb')!
    await coordinator.activatePlugin(plugin)
    expect(plugin.status.state).toBe('active')
    expect(driverRegistry.has('mongodb')).toBe(true)
  })

  it('Redis plugin registers driver', async () => {
    coordinator.registerBundledPlugin(redisPlugin.manifest, redisPlugin)
    const plugin = coordinator.getPlugin('dbstudio-plugin-redis')!
    await coordinator.activatePlugin(plugin)
    expect(plugin.status.state).toBe('active')
    expect(driverRegistry.has('redis')).toBe(true)
  })

  it('Snowflake plugin registers driver', async () => {
    coordinator.registerBundledPlugin(snowflakePlugin.manifest, snowflakePlugin)
    const plugin = coordinator.getPlugin('dbstudio-plugin-snowflake')!
    await coordinator.activatePlugin(plugin)
    expect(plugin.status.state).toBe('active')
    expect(driverRegistry.has('snowflake')).toBe(true)
  })

  it('PostgreSQL plugin registers driver', async () => {
    coordinator.registerBundledPlugin(postgresqlPlugin.manifest, postgresqlPlugin)
    const plugin = coordinator.getPlugin('dbstudio-plugin-postgresql')!
    await coordinator.activatePlugin(plugin)
    expect(plugin.status.state).toBe('active')
    expect(driverRegistry.has('postgresql')).toBe(true)
  })

  it('MySQL plugin registers driver', async () => {
    coordinator.registerBundledPlugin(mysqlPlugin.manifest, mysqlPlugin)
    const plugin = coordinator.getPlugin('dbstudio-plugin-mysql')!
    await coordinator.activatePlugin(plugin)
    expect(plugin.status.state).toBe('active')
    expect(driverRegistry.has('mysql')).toBe(true)
  })

  it('SQLite plugin registers driver', async () => {
    coordinator.registerBundledPlugin(sqlitePlugin.manifest, sqlitePlugin)
    const plugin = coordinator.getPlugin('dbstudio-plugin-sqlite')!
    await coordinator.activatePlugin(plugin)
    expect(plugin.status.state).toBe('active')
    expect(driverRegistry.has('sqlite')).toBe(true)
  })

  it('all plugins can be activated together', async () => {
    coordinator.registerBundledPlugin(sshPlugin.manifest, sshPlugin)
    coordinator.registerBundledPlugin(mongoPlugin.manifest, mongoPlugin)
    coordinator.registerBundledPlugin(redisPlugin.manifest, redisPlugin)
    coordinator.registerBundledPlugin(snowflakePlugin.manifest, snowflakePlugin)
    coordinator.registerBundledPlugin(postgresqlPlugin.manifest, postgresqlPlugin)
    coordinator.registerBundledPlugin(mysqlPlugin.manifest, mysqlPlugin)
    coordinator.registerBundledPlugin(sqlitePlugin.manifest, sqlitePlugin)

    for (const name of [
      'dbstudio-plugin-ssh', 'dbstudio-plugin-mongodb', 'dbstudio-plugin-redis',
      'dbstudio-plugin-snowflake', 'dbstudio-plugin-postgresql', 'dbstudio-plugin-mysql',
      'dbstudio-plugin-sqlite'
    ]) {
      const plugin = coordinator.getPlugin(name)!
      await coordinator.activatePlugin(plugin)
      expect(plugin.status.state).toBe('active')
    }

    expect(driverRegistry.hasMiddleware('ssh-tunnel')).toBe(true)
    expect(driverRegistry.has('mongodb')).toBe(true)
    expect(driverRegistry.has('redis')).toBe(true)
    expect(driverRegistry.has('snowflake')).toBe(true)
    expect(driverRegistry.has('postgresql')).toBe(true)
    expect(driverRegistry.has('mysql')).toBe(true)
    expect(driverRegistry.has('sqlite')).toBe(true)
  })
})
```

- [ ] **Step 3: Run tests**

Run: `pnpm test -- --run tests/unit/adapter.test.ts tests/unit/bundled-plugins.test.ts tests/unit/keyring.test.ts`

Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add tests/unit/adapter.test.ts tests/unit/bundled-plugins.test.ts
git commit -m "test: update factory and bundled plugin tests for registry-based architecture"
```

---

### Task 14: Run Full Test Suite and Fix Breakage

**Files:** Various — depends on what breaks

- [ ] **Step 1: Run full test suite**

Run: `pnpm test`

- [ ] **Step 2: Fix any test failures**

Common expected issues:
- `tests/unit/sqlite-adapter.test.ts` may import from old path `../../src/main/db/sqlite` — update to `../../src/main/plugins/bundled/sqlite/sqlite-adapter`
- Any other file importing `PostgresAdapter`, `MysqlAdapter`, or `SqliteAdapter` from `src/main/db/` needs path updates
- `tests/unit/ipc-contracts.test.ts` may need new channel types

Fix each failure, re-run tests after each fix.

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`

Expected: Clean — no type errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "fix: update remaining imports and tests for plugin-based architecture"
```

---

### Task 15: Hard-Pin Package Versions

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Strip semver range prefixes from all dependencies**

In `package.json`, remove all `^`, `~`, and `>=` prefixes from every entry in both `dependencies` and `devDependencies`. For example:

```diff
-    "@dagrejs/dagre": "^3.0.0",
+    "@dagrejs/dagre": "3.0.0",
-    "@floating-ui/react": "^0.27.19",
+    "@floating-ui/react": "0.27.19",
```

Apply this to every single dependency and devDependency entry.

- [ ] **Step 2: Regenerate lockfile**

Run: `pnpm install`

Expected: Installs successfully with pinned versions. `pnpm-lock.yaml` is regenerated.

- [ ] **Step 3: Run tests to verify nothing broke**

Run: `pnpm test`

Expected: All tests PASS — pinning versions shouldn't change anything since the lockfile already had exact versions.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: hard-pin all dependency versions in package.json"
```

---

### Task 16: Manual Verification

- [ ] **Step 1: Start the dev server**

Run: `pnpm dev`

- [ ] **Step 2: Verify connection form**

- Open the connection form
- Verify the database type dropdown shows all types (PostgreSQL, MySQL, SQLite, Snowflake, MongoDB, Redis)
- Select PostgreSQL — verify host/port/database/username/password/ssl fields appear (from plugin)
- Select SQLite — verify only database file field appears
- Select Snowflake — verify auth fields appear first, then fetchable fields (database, warehouse, role, schema) are shown but disabled with "Authenticate first" placeholder

- [ ] **Step 3: Test a SQLite connection**

- Create a SQLite connection with `:memory:` as database
- Click "Test Connection" — should show version from `testConnection()` on the adapter

- [ ] **Step 4: Verify no regressions**

- Check that existing connections still work
- Check that the explorer tree loads normally after connecting
- Check that queries execute normally

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: manual verification fixes"
```
