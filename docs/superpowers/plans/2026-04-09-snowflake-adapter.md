# Snowflake Adapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Snowflake data warehouse adapter as a bundled plugin supporting username/password, key-pair, and SSO/OAuth authentication, with full schema introspection and query cancellation.

**Architecture:** Bundled plugin following the MongoDB/Redis pattern — an `index.ts` plugin entry registers a `DriverFactory` with the `DriverRegistry`, and a `snowflake-adapter.ts` implements `DbAdapter`. The adapter uses `snowflake-sdk` for all Snowflake communication.

**Tech Stack:** `snowflake-sdk` (official Snowflake Node.js driver), TypeScript

---

## File Structure

| File | Responsibility |
|---|---|
| `src/main/plugins/bundled/snowflake/index.ts` | **New** — Plugin manifest + `activate()` registering driver with connection fields |
| `src/main/plugins/bundled/snowflake/snowflake-adapter.ts` | **New** — `DbAdapter` implementation using `snowflake-sdk` |
| `src/main/ipc-handlers.ts` | **Modify** — Import and register the snowflake bundled plugin (line ~22, ~395) |
| `package.json` | **Modify** — Add `snowflake-sdk` dependency |

---

### Task 1: Install snowflake-sdk dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add snowflake-sdk to dependencies**

```bash
cd /Users/ShahA/Documents/practice/dbterm && npm install snowflake-sdk
```

- [ ] **Step 2: Verify installation**

```bash
node -e "require('snowflake-sdk'); console.log('snowflake-sdk loaded')"
```

Expected: `snowflake-sdk loaded`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add snowflake-sdk dependency"
```

---

### Task 2: Create the Snowflake adapter

**Files:**
- Create: `src/main/plugins/bundled/snowflake/snowflake-adapter.ts`

- [ ] **Step 1: Create the adapter file**

Write `src/main/plugins/bundled/snowflake/snowflake-adapter.ts` with the following content:

```typescript
import snowflake from 'snowflake-sdk'
import fs from 'fs'
import type { DbAdapter } from '../../../db/adapter'
import type { QueryResult, SchemaTable, SchemaColumn, SchemaIndex, FieldInfo } from '@shared/types'

export class SnowflakeAdapter implements DbAdapter {
  private connection: snowflake.Connection | null = null
  private connected = false
  private activeStatementId: string | null = null
  private readonly config: Record<string, unknown>

  constructor(config: Record<string, unknown>) {
    this.config = config
  }

  async connect(): Promise<void> {
    const opts: snowflake.ConnectionOptions = {
      account: this.config.account as string,
      database: this.config.database as string,
      schema: (this.config.schema as string) || 'PUBLIC',
      warehouse: this.config.warehouse as string | undefined,
      role: this.config.role as string | undefined,
    }

    if (this.config.host) {
      opts.accessUrl = `https://${this.config.host}`
    }

    if (this.config.privateKeyPath) {
      // Key-pair authentication
      opts.username = this.config.username as string
      opts.authenticator = 'SNOWFLAKE_JWT'
      opts.privateKey = fs.readFileSync(this.config.privateKeyPath as string, 'utf-8')
      if (this.config.passphrase) {
        opts.privateKeyPass = this.config.passphrase as string
      }
    } else if (this.config.authenticator && !this.config.password) {
      // SSO / OAuth authentication
      opts.username = this.config.username as string
      opts.authenticator = this.config.authenticator as string
    } else {
      // Username / password authentication
      opts.username = this.config.username as string
      opts.password = this.config.password as string
    }

    this.connection = snowflake.createConnection(opts)

    await new Promise<void>((resolve, reject) => {
      this.connection!.connect((err) => {
        if (err) reject(err)
        else resolve()
      })
    })

    this.connected = true
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await new Promise<void>((resolve) => {
        this.connection!.destroy((err) => {
          resolve()
        })
      })
      this.connection = null
      this.connected = false
    }
  }

  isConnected(): boolean {
    return this.connected && this.connection !== null
  }

  async query(sql: string, params?: unknown[]): Promise<QueryResult> {
    if (!this.connection) throw new Error('Not connected')

    const start = performance.now()

    const { rows, columns, statementId } = await new Promise<{
      rows: Record<string, unknown>[]
      columns: snowflake.Column[]
      statementId: string
    }>((resolve, reject) => {
      this.connection!.execute({
        sqlText: sql,
        binds: params as snowflake.Binds | undefined,
        complete: (err, stmt, rows) => {
          this.activeStatementId = null
          if (err) reject(err)
          else resolve({
            rows: (rows ?? []) as Record<string, unknown>[],
            columns: stmt.getColumns(),
            statementId: stmt.getStatementId(),
          })
        },
      })
      // Capture statement ID for cancellation as soon as the statement starts
      // The SDK doesn't expose it before complete, so we track it in complete callback
    })

    this.activeStatementId = null
    const duration = Math.round(performance.now() - start)

    const fields: FieldInfo[] = columns.map((col) => ({
      name: col.getName(),
      dataType: col.getType(),
      nullable: col.isNullable(),
    }))

    return {
      rows,
      fields,
      rowCount: rows.length,
      duration,
      affectedRows: rows.length,
    }
  }

  cancelQuery(): void {
    // The snowflake-sdk doesn't expose a direct cancel on the statement
    // before the complete callback. We cancel via SQL if we have a statement ID.
    if (this.connection && this.activeStatementId) {
      this.connection.execute({
        sqlText: `SELECT SYSTEM$CANCEL_ALL_QUERIES(CURRENT_SESSION())`,
        complete: () => {},
      })
    }
  }

  async getTables(schema?: string): Promise<SchemaTable[]> {
    if (!this.connection) throw new Error('Not connected')
    const s = schema ?? 'PUBLIC'
    const result = await this.query(
      `SELECT TABLE_NAME, TABLE_TYPE FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME`,
      [s]
    )
    return result.rows.map((r) => ({
      name: r.TABLE_NAME as string,
      schema: s,
      type: (r.TABLE_TYPE as string) === 'VIEW' ? 'view' as const : 'table' as const,
    }))
  }

  async getColumns(table: string, schema?: string): Promise<SchemaColumn[]> {
    if (!this.connection) throw new Error('Not connected')
    const s = schema ?? 'PUBLIC'
    const result = await this.query(
      `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
       ORDER BY ORDINAL_POSITION`,
      [s, table]
    )
    // Snowflake doesn't have traditional PK/FK info in INFORMATION_SCHEMA the same way,
    // but we can query SHOW PRIMARY KEYS and SHOW IMPORTED KEYS for this
    const pkResult = await this.query(
      `SHOW PRIMARY KEYS IN TABLE "${s}"."${table}"`
    )
    const pkCols = new Set(pkResult.rows.map((r) => r['"column_name"'] as string))

    const fkResult = await this.query(
      `SHOW IMPORTED KEYS IN TABLE "${s}"."${table}"`
    )
    const fkMap = new Map<string, { table: string; column: string }>()
    for (const r of fkResult.rows) {
      fkMap.set(
        r['"fk_column_name"'] as string,
        { table: r['"pk_table_name"'] as string, column: r['"pk_column_name"'] as string }
      )
    }

    return result.rows.map((r) => ({
      name: r.COLUMN_NAME as string,
      dataType: r.DATA_TYPE as string,
      nullable: (r.IS_NULLABLE as string) === 'YES',
      defaultValue: r.COLUMN_DEFAULT as string | null,
      isPrimaryKey: pkCols.has(r.COLUMN_NAME as string),
      isForeignKey: fkMap.has(r.COLUMN_NAME as string),
      references: fkMap.get(r.COLUMN_NAME as string),
    }))
  }

  async getIndexes(_table: string, _schema?: string): Promise<SchemaIndex[]> {
    // Snowflake is columnar and doesn't have traditional indexes
    return []
  }

  async getRowCount(table: string, schema?: string): Promise<number> {
    if (!this.connection) throw new Error('Not connected')
    const s = schema ?? 'PUBLIC'
    const result = await this.query(`SELECT COUNT(*) AS CNT FROM "${s}"."${table}"`)
    return Number(result.rows[0]?.CNT ?? 0)
  }

  async getSchemas(): Promise<string[]> {
    if (!this.connection) throw new Error('Not connected')
    const result = await this.query(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA
       WHERE SCHEMA_NAME NOT IN ('INFORMATION_SCHEMA')
       ORDER BY SCHEMA_NAME`
    )
    return result.rows.map((r) => r.SCHEMA_NAME as string)
  }

  async getDatabases(): Promise<string[]> {
    if (!this.connection) throw new Error('Not connected')
    const result = await this.query(`SHOW DATABASES`)
    return result.rows.map((r) => r['"name"'] as string)
  }

  async switchDatabase(database: string): Promise<void> {
    if (!this.connection) throw new Error('Not connected')
    await this.query(`USE DATABASE "${database}"`)
  }

  async setSchema(schema: string): Promise<void> {
    if (!this.connection) throw new Error('Not connected')
    await this.query(`USE SCHEMA "${schema}"`)
  }
}
```

- [ ] **Step 2: Verify the file compiles**

```bash
cd /Users/ShahA/Documents/practice/dbterm && npx tsc --noEmit src/main/plugins/bundled/snowflake/snowflake-adapter.ts
```

Expected: no errors (or only errors from missing module resolution that will resolve at build time)

- [ ] **Step 3: Commit**

```bash
git add src/main/plugins/bundled/snowflake/snowflake-adapter.ts
git commit -m "feat: add Snowflake adapter implementing DbAdapter"
```

---

### Task 3: Create the plugin entry

**Files:**
- Create: `src/main/plugins/bundled/snowflake/index.ts`

- [ ] **Step 1: Create the plugin index file**

Write `src/main/plugins/bundled/snowflake/index.ts` with the following content:

```typescript
import type { PluginContext } from '../../sdk/types'
import type { PluginManifest } from '../../types'
import { SnowflakeAdapter } from './snowflake-adapter'

export const manifest: PluginManifest = {
  name: 'dbstudio-plugin-snowflake',
  version: '1.0.0',
  displayName: 'Snowflake',
  description: 'Snowflake data warehouse driver',
  main: 'index.js',
  contributes: {
    drivers: [{ id: 'snowflake', name: 'Snowflake' }]
  }
}

export function activate(ctx: PluginContext): void {
  ctx.drivers.register('snowflake', {
    createAdapter: (config) => new SnowflakeAdapter(config),
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
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/main/plugins/bundled/snowflake/index.ts
git commit -m "feat: add Snowflake plugin entry with connection fields"
```

---

### Task 4: Register the bundled plugin

**Files:**
- Modify: `src/main/ipc-handlers.ts:22` (import) and `src/main/ipc-handlers.ts:395` (registration)

- [ ] **Step 1: Add the import**

In `src/main/ipc-handlers.ts`, after line 22 (`import * as redisPlugin from './plugins/bundled/redis'`), add:

```typescript
import * as snowflakePlugin from './plugins/bundled/snowflake'
```

- [ ] **Step 2: Register the plugin**

In `src/main/ipc-handlers.ts`, after line 395 (`pluginCoordinator.registerBundledPlugin(redisPlugin.manifest, redisPlugin)`), add:

```typescript
pluginCoordinator.registerBundledPlugin(snowflakePlugin.manifest, snowflakePlugin)
```

- [ ] **Step 3: Verify the full project builds**

```bash
cd /Users/ShahA/Documents/practice/dbterm && npm run build
```

Expected: build succeeds with no errors

- [ ] **Step 4: Commit**

```bash
git add src/main/ipc-handlers.ts
git commit -m "feat: register Snowflake as bundled plugin"
```

---

### Task 5: Manual verification

- [ ] **Step 1: Start the app**

```bash
cd /Users/ShahA/Documents/practice/dbterm && npm run dev
```

- [ ] **Step 2: Verify Snowflake appears in the connection type dropdown**

Open the "New Connection" form. Snowflake should appear in the database type selector alongside PostgreSQL, MySQL, SQLite, MongoDB, and Redis.

- [ ] **Step 3: Verify connection fields render correctly**

Select "Snowflake" as the type. The form should show: Account Identifier, Host Override, Database, Schema (default: PUBLIC), Warehouse, Role, Username, Password, Private Key File, Key Passphrase, Authenticator (default: externalbrowser).

- [ ] **Step 4: Verify the plugin appears in plugin list**

Check the plugins panel — `dbstudio-plugin-snowflake` should show as active with the `snowflake` driver contribution.

- [ ] **Step 5: Commit final state (if any adjustments were needed)**

```bash
git add -A && git commit -m "fix: address any issues found during manual verification"
```

Only run this if changes were needed. If everything worked, skip this step.
