# Plan 1: Project Scaffold, Electron Shell & Connection Manager

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the foundational Electron + React application with the VS Code-style shell layout, typed IPC layer, database adapter layer (PostgreSQL, MySQL, SQLite), and a working connection manager — the base everything else builds on.

**Architecture:** Electron main process handles database connections and file I/O. React renderer with Zustand state management handles the UI. Typed IPC contracts in a shared directory ensure type safety across the process boundary. electron-vite handles the build pipeline.

**Tech Stack:** Electron, React 19, TypeScript (strict), Vite (via electron-vite), Zustand, Tailwind CSS, Lucide React, pg, mysql2, better-sqlite3, Vitest, Playwright

---

## File Structure

```
dbstudio/
├── package.json
├── electron.vite.config.ts
├── electron-builder.yml
├── tsconfig.json
├── tsconfig.node.json
├── tsconfig.web.json
├── tailwind.config.ts
├── postcss.config.js
├── vitest.config.ts
├── playwright.config.ts
├── build/
│   └── entitlements.mac.plist
├── shared/
│   ├── ipc.ts                          # Typed IPC channel contracts
│   └── types.ts                        # Shared types (ConnectionProfile, etc.)
├── src/
│   ├── main/
│   │   ├── index.ts                    # Electron app lifecycle, window creation
│   │   ├── ipc-handlers.ts             # IPC handler registration
│   │   ├── db/
│   │   │   ├── adapter.ts              # DbAdapter interface
│   │   │   ├── postgres.ts             # PostgreSQL adapter
│   │   │   ├── mysql.ts                # MySQL adapter
│   │   │   ├── sqlite.ts               # SQLite adapter
│   │   │   └── factory.ts              # Create adapter from connection profile
│   │   └── config/
│   │       └── store.ts                # Connection profile persistence (JSON file)
│   ├── preload/
│   │   ├── index.ts                    # contextBridge + typed API
│   │   └── index.d.ts                  # Type declarations for renderer
│   └── renderer/
│       ├── index.html
│       └── src/
│           ├── main.tsx                # React entry point
│           ├── App.tsx                 # Root component with shell layout
│           ├── styles/
│           │   └── globals.css         # Tailwind imports + dark theme base
│           ├── stores/
│           │   ├── connections.ts      # Zustand store for connections
│           │   └── ui.ts              # Zustand store for UI state (active panel, sidebar)
│           ├── components/
│           │   ├── shell/
│           │   │   ├── ActivityBar.tsx  # Left icon rail
│           │   │   ├── Sidebar.tsx      # Collapsible secondary sidebar
│           │   │   ├── TabBar.tsx       # Top tab bar
│           │   │   ├── StatusBar.tsx    # Bottom status bar
│           │   │   └── TitleBar.tsx     # Custom frameless title bar
│           │   └── connections/
│           │       ├── ConnectionList.tsx       # Sidebar connection tree
│           │       ├── ConnectionForm.tsx       # Add/edit connection modal
│           │       └── ConnectionTestButton.tsx # Test connection button
│           └── hooks/
│               └── use-ipc.ts          # Typed hook for IPC calls
├── tests/
│   ├── unit/
│   │   ├── adapter.test.ts             # DbAdapter interface tests
│   │   ├── sqlite-adapter.test.ts      # SQLite adapter integration tests
│   │   ├── config-store.test.ts        # Config store CRUD tests
│   │   └── ipc-contracts.test.ts       # IPC type contract validation
│   └── e2e/
│       └── app-launch.test.ts          # Playwright: app launches, shell renders
└── resources/
    └── icon.png                        # App icon placeholder
```

---

### Task 1: Scaffold the Electron + React + Vite Project

**Files:**
- Create: `dbstudio/package.json`
- Create: `dbstudio/electron.vite.config.ts`
- Create: `dbstudio/tsconfig.json`
- Create: `dbstudio/tsconfig.node.json`
- Create: `dbstudio/tsconfig.web.json`
- Create: `dbstudio/electron-builder.yml`
- Create: `dbstudio/build/entitlements.mac.plist`

- [ ] **Step 1: Create project directory and initialize**

```bash
mkdir -p dbstudio
cd dbstudio
npm init -y
```

- [ ] **Step 2: Install core dependencies**

```bash
npm install electron electron-vite vite @vitejs/plugin-react react react-dom zustand tailwindcss @tailwindcss/vite postcss lucide-react --save
npm install typescript @types/react @types/react-dom @types/node electron-builder vitest @testing-library/react @testing-library/jest-dom jsdom --save-dev
```

- [ ] **Step 3: Create `package.json` scripts and main field**

Replace the generated `package.json` content with:

```json
{
  "name": "dbstudio",
  "version": "0.1.0",
  "description": "A fast, extensible desktop database client",
  "main": "./out/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "postinstall": "electron-builder install-app-deps",
    "test": "vitest run",
    "test:watch": "vitest",
    "build:mac": "npm run build && electron-builder --mac",
    "build:win": "npm run build && electron-builder --win",
    "build:linux": "npm run build && electron-builder --linux"
  }
}
```

Note: Keep the `dependencies` and `devDependencies` that npm installed. Only replace the top-level fields shown above.

- [ ] **Step 4: Create `electron.vite.config.ts`**

```typescript
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        external: ['better-sqlite3', 'pg', 'mysql2']
      }
    },
    resolve: {
      alias: { '@shared': resolve('shared') }
    }
  },
  preload: {
    build: {
      rollupOptions: {
        external: ['better-sqlite3']
      }
    },
    resolve: {
      alias: { '@shared': resolve('shared') }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src'),
        '@shared': resolve('shared')
      }
    },
    plugins: [react(), tailwindcss()]
  }
})
```

- [ ] **Step 5: Create TypeScript configs**

`tsconfig.json`:
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.web.json" }
  ]
}
```

`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./out",
    "declaration": true,
    "paths": {
      "@shared/*": ["./shared/*"]
    }
  },
  "include": ["src/main/**/*", "src/preload/**/*", "shared/**/*", "electron.vite.config.ts"]
}
```

`tsconfig.web.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "paths": {
      "@/*": ["./src/renderer/src/*"],
      "@shared/*": ["./shared/*"]
    }
  },
  "include": ["src/renderer/src/**/*", "src/preload/index.d.ts", "shared/**/*"]
}
```

- [ ] **Step 6: Create `electron-builder.yml`**

```yaml
appId: com.dbstudio.app
productName: dbstudio
directories:
  buildResources: build
  output: dist
files:
  - out/**/*
asarUnpack:
  - "**/*.{node,dylib}"
mac:
  category: public.app-category.developer-tools
  target:
    - target: dmg
      arch: [x64, arm64]
  hardenedRuntime: true
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist
win:
  target:
    - target: nsis
      arch: [x64]
linux:
  target:
    - AppImage
  category: Development
```

- [ ] **Step 7: Create `build/entitlements.mac.plist`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key><true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key><true/>
  <key>com.apple.security.cs.allow-dyld-environment-variables</key><true/>
</dict>
</plist>
```

- [ ] **Step 8: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    alias: {
      '@shared': resolve(__dirname, 'shared')
    }
  }
})
```

- [ ] **Step 9: Verify the project compiles**

```bash
npx tsc --noEmit -p tsconfig.node.json
```

Expected: No errors (or only errors about missing source files which we create next).

- [ ] **Step 10: Commit**

```bash
git init
echo "node_modules/\nout/\ndist/\n.DS_Store\n*.node" > .gitignore
git add -A
git commit -m "chore: scaffold electron-vite project with react and typescript"
```

---

### Task 2: Shared Types and IPC Contracts

**Files:**
- Create: `dbstudio/shared/types.ts`
- Create: `dbstudio/shared/ipc.ts`
- Test: `dbstudio/tests/unit/ipc-contracts.test.ts`

- [ ] **Step 1: Write the test for shared types**

```typescript
// tests/unit/ipc-contracts.test.ts
import { describe, it, expect } from 'vitest'
import type { ConnectionProfile, DatabaseType, QueryResult } from '../../shared/types'
import type { IpcChannelMap } from '../../shared/ipc'

describe('Shared types', () => {
  it('ConnectionProfile has required fields', () => {
    const profile: ConnectionProfile = {
      id: 'test-1',
      name: 'Local Dev',
      type: 'postgresql',
      host: 'localhost',
      port: 5432,
      database: 'mydb',
      username: 'user',
      password: 'pass',
      color: '#7c6ff7',
      ssl: false,
      group: 'Development'
    }
    expect(profile.id).toBe('test-1')
    expect(profile.type).toBe('postgresql')
  })

  it('ConnectionProfile works for SQLite (file-based)', () => {
    const profile: ConnectionProfile = {
      id: 'sqlite-1',
      name: 'Local SQLite',
      type: 'sqlite',
      database: '/path/to/db.sqlite',
      color: '#28c840'
    }
    expect(profile.host).toBeUndefined()
    expect(profile.database).toBe('/path/to/db.sqlite')
  })

  it('QueryResult has rows, fields, and timing', () => {
    const result: QueryResult = {
      rows: [{ id: 1, name: 'Alice' }],
      fields: [
        { name: 'id', dataType: 'int4', nullable: false },
        { name: 'name', dataType: 'varchar', nullable: true }
      ],
      rowCount: 1,
      duration: 23,
      affectedRows: 0
    }
    expect(result.rows).toHaveLength(1)
    expect(result.fields[0].name).toBe('id')
  })

  it('IpcChannelMap defines required channels', () => {
    // Type-level test: this just ensures the types compile correctly.
    // If the channels don't exist in IpcChannelMap, TypeScript will error.
    type AssertChannel<K extends keyof IpcChannelMap> = K
    type _a = AssertChannel<'db:connect'>
    type _b = AssertChannel<'db:disconnect'>
    type _c = AssertChannel<'db:query'>
    type _d = AssertChannel<'db:test-connection'>
    type _e = AssertChannel<'connections:list'>
    type _f = AssertChannel<'connections:save'>
    type _g = AssertChannel<'connections:delete'>
    expect(true).toBe(true) // runtime assertion so vitest counts this
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd dbstudio && npx vitest run tests/unit/ipc-contracts.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Create `shared/types.ts`**

```typescript
export type DatabaseType = 'postgresql' | 'mysql' | 'sqlite'

export interface ConnectionProfile {
  id: string
  name: string
  type: DatabaseType
  host?: string
  port?: number
  database: string
  username?: string
  password?: string
  ssl?: boolean
  color?: string
  group?: string
  queryTimeout?: number
  readOnly?: boolean
}

export interface FieldInfo {
  name: string
  dataType: string
  nullable: boolean
}

export interface QueryResult {
  rows: Record<string, unknown>[]
  fields: FieldInfo[]
  rowCount: number
  duration: number
  affectedRows: number
}

export interface SchemaTable {
  name: string
  schema: string
  type: 'table' | 'view'
  rowCount?: number
}

export interface SchemaColumn {
  name: string
  dataType: string
  nullable: boolean
  defaultValue: string | null
  isPrimaryKey: boolean
  isForeignKey: boolean
  references?: { table: string; column: string }
}

export interface SchemaIndex {
  name: string
  columns: string[]
  unique: boolean
}
```

- [ ] **Step 4: Create `shared/ipc.ts`**

```typescript
import type { ConnectionProfile, QueryResult, SchemaTable, SchemaColumn, SchemaIndex } from './types'

export interface IpcChannelMap {
  'db:connect': {
    args: [profileId: string]
    return: { success: boolean; error?: string }
  }
  'db:disconnect': {
    args: [profileId: string]
    return: void
  }
  'db:query': {
    args: [profileId: string, sql: string, params?: unknown[]]
    return: QueryResult
  }
  'db:test-connection': {
    args: [profile: ConnectionProfile]
    return: { success: boolean; error?: string; version?: string }
  }
  'db:get-tables': {
    args: [profileId: string, schema?: string]
    return: SchemaTable[]
  }
  'db:get-columns': {
    args: [profileId: string, table: string, schema?: string]
    return: SchemaColumn[]
  }
  'db:get-indexes': {
    args: [profileId: string, table: string, schema?: string]
    return: SchemaIndex[]
  }
  'db:get-schemas': {
    args: [profileId: string]
    return: string[]
  }
  'connections:list': {
    args: []
    return: ConnectionProfile[]
  }
  'connections:save': {
    args: [profile: ConnectionProfile]
    return: ConnectionProfile
  }
  'connections:delete': {
    args: [profileId: string]
    return: void
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd dbstudio && npx vitest run tests/unit/ipc-contracts.test.ts
```

Expected: PASS — all 4 tests pass.

- [ ] **Step 6: Commit**

```bash
cd dbstudio && git add shared/ tests/unit/ipc-contracts.test.ts && git commit -m "feat: add shared types and typed IPC contracts"
```

---

### Task 3: Database Adapter Interface and SQLite Adapter

**Files:**
- Create: `dbstudio/src/main/db/adapter.ts`
- Create: `dbstudio/src/main/db/sqlite.ts`
- Create: `dbstudio/src/main/db/factory.ts`
- Test: `dbstudio/tests/unit/sqlite-adapter.test.ts`

- [ ] **Step 1: Write the failing tests for DbAdapter + SQLite**

```typescript
// tests/unit/sqlite-adapter.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createAdapter } from '../../src/main/db/factory'
import type { DbAdapter } from '../../src/main/db/adapter'
import type { ConnectionProfile } from '../../shared/types'
import fs from 'fs'
import path from 'path'

const TEST_DB = path.join(__dirname, 'test-sqlite.db')

describe('SQLite Adapter', () => {
  let adapter: DbAdapter

  beforeAll(async () => {
    const profile: ConnectionProfile = {
      id: 'test-sqlite',
      name: 'Test DB',
      type: 'sqlite',
      database: TEST_DB
    }
    adapter = createAdapter(profile)
    await adapter.connect()
  })

  afterAll(async () => {
    await adapter.disconnect()
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB)
  })

  it('connects and returns version', async () => {
    const result = await adapter.query('SELECT sqlite_version() as version')
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].version).toBeDefined()
    expect(result.fields[0].name).toBe('version')
    expect(result.duration).toBeGreaterThanOrEqual(0)
  })

  it('creates a table and inserts data', async () => {
    await adapter.query('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT)')
    const insert = await adapter.query("INSERT INTO users (name, email) VALUES ('Alice', 'alice@test.com')")
    expect(insert.affectedRows).toBe(1)
  })

  it('queries data with params', async () => {
    const result = await adapter.query('SELECT * FROM users WHERE name = ?', ['Alice'])
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].name).toBe('Alice')
    expect(result.rowCount).toBe(1)
  })

  it('lists tables', async () => {
    const tables = await adapter.getTables()
    const userTable = tables.find(t => t.name === 'users')
    expect(userTable).toBeDefined()
    expect(userTable!.type).toBe('table')
  })

  it('lists columns', async () => {
    const columns = await adapter.getColumns('users')
    expect(columns).toHaveLength(3)
    const idCol = columns.find(c => c.name === 'id')!
    expect(idCol.isPrimaryKey).toBe(true)
    expect(idCol.dataType).toMatch(/INTEGER/i)
  })

  it('lists schemas (SQLite returns main)', async () => {
    const schemas = await adapter.getSchemas()
    expect(schemas).toContain('main')
  })

  it('lists indexes', async () => {
    await adapter.query('CREATE INDEX idx_users_email ON users(email)')
    const indexes = await adapter.getIndexes('users')
    const emailIdx = indexes.find(i => i.name === 'idx_users_email')
    expect(emailIdx).toBeDefined()
    expect(emailIdx!.columns).toContain('email')
  })

  it('handles errors gracefully', async () => {
    await expect(adapter.query('SELECT * FROM nonexistent_table')).rejects.toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd dbstudio && npx vitest run tests/unit/sqlite-adapter.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Install better-sqlite3**

```bash
cd dbstudio && npm install better-sqlite3 && npm install -D @types/better-sqlite3
```

- [ ] **Step 4: Create `src/main/db/adapter.ts`**

```typescript
import type { QueryResult, SchemaTable, SchemaColumn, SchemaIndex } from '@shared/types'

export interface DbAdapter {
  connect(): Promise<void>
  disconnect(): Promise<void>
  query(sql: string, params?: unknown[]): Promise<QueryResult>
  getTables(schema?: string): Promise<SchemaTable[]>
  getColumns(table: string, schema?: string): Promise<SchemaColumn[]>
  getIndexes(table: string, schema?: string): Promise<SchemaIndex[]>
  getSchemas(): Promise<string[]>
  isConnected(): boolean
}
```

- [ ] **Step 5: Create `src/main/db/sqlite.ts`**

```typescript
import Database from 'better-sqlite3'
import type { DbAdapter } from './adapter'
import type { QueryResult, SchemaTable, SchemaColumn, SchemaIndex, FieldInfo } from '@shared/types'

export class SqliteAdapter implements DbAdapter {
  private db: Database.Database | null = null
  private dbPath: string

  constructor(dbPath: string) {
    this.dbPath = dbPath
  }

  async connect(): Promise<void> {
    this.db = new Database(this.dbPath)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')
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

  async getSchemas(): Promise<string[]> {
    if (!this.db) throw new Error('Not connected')
    const rows = this.db.prepare('PRAGMA database_list').all() as { name: string }[]
    return rows.map(r => r.name)
  }
}
```

- [ ] **Step 6: Create `src/main/db/factory.ts`**

```typescript
import type { ConnectionProfile } from '@shared/types'
import type { DbAdapter } from './adapter'
import { SqliteAdapter } from './sqlite'

export function createAdapter(profile: ConnectionProfile): DbAdapter {
  switch (profile.type) {
    case 'sqlite':
      return new SqliteAdapter(profile.database)
    case 'postgresql':
      throw new Error('PostgreSQL adapter not yet implemented')
    case 'mysql':
      throw new Error('MySQL adapter not yet implemented')
    default:
      throw new Error(`Unsupported database type: ${profile.type}`)
  }
}
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
cd dbstudio && npx vitest run tests/unit/sqlite-adapter.test.ts
```

Expected: PASS — all 8 tests pass.

- [ ] **Step 8: Commit**

```bash
cd dbstudio && git add src/main/db/ tests/unit/sqlite-adapter.test.ts && git commit -m "feat: add database adapter interface and SQLite implementation"
```

---

### Task 4: PostgreSQL and MySQL Adapters

**Files:**
- Create: `dbstudio/src/main/db/postgres.ts`
- Create: `dbstudio/src/main/db/mysql.ts`
- Modify: `dbstudio/src/main/db/factory.ts`
- Test: `dbstudio/tests/unit/adapter.test.ts`

- [ ] **Step 1: Write unit tests for adapter factory**

These tests verify the factory creates the right adapter type and that the adapter interface is consistent. We can't integration-test PostgreSQL/MySQL without real servers, so we test construction and the factory logic.

```typescript
// tests/unit/adapter.test.ts
import { describe, it, expect } from 'vitest'
import { createAdapter } from '../../src/main/db/factory'
import { SqliteAdapter } from '../../src/main/db/sqlite'
import { PostgresAdapter } from '../../src/main/db/postgres'
import { MysqlAdapter } from '../../src/main/db/mysql'
import type { ConnectionProfile } from '../../shared/types'

describe('createAdapter factory', () => {
  it('creates SQLite adapter', () => {
    const profile: ConnectionProfile = {
      id: '1', name: 'test', type: 'sqlite', database: ':memory:'
    }
    const adapter = createAdapter(profile)
    expect(adapter).toBeInstanceOf(SqliteAdapter)
  })

  it('creates PostgreSQL adapter', () => {
    const profile: ConnectionProfile = {
      id: '2', name: 'test', type: 'postgresql',
      host: 'localhost', port: 5432, database: 'testdb',
      username: 'user', password: 'pass'
    }
    const adapter = createAdapter(profile)
    expect(adapter).toBeInstanceOf(PostgresAdapter)
  })

  it('creates MySQL adapter', () => {
    const profile: ConnectionProfile = {
      id: '3', name: 'test', type: 'mysql',
      host: 'localhost', port: 3306, database: 'testdb',
      username: 'root', password: 'pass'
    }
    const adapter = createAdapter(profile)
    expect(adapter).toBeInstanceOf(MysqlAdapter)
  })

  it('throws on unsupported type', () => {
    const profile = {
      id: '4', name: 'test', type: 'oracle' as any, database: 'test'
    }
    expect(() => createAdapter(profile)).toThrow('Unsupported database type')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd dbstudio && npx vitest run tests/unit/adapter.test.ts
```

Expected: FAIL — PostgresAdapter and MysqlAdapter not found.

- [ ] **Step 3: Install PostgreSQL and MySQL drivers**

```bash
cd dbstudio && npm install pg mysql2 && npm install -D @types/pg
```

- [ ] **Step 4: Create `src/main/db/postgres.ts`**

```typescript
import pg from 'pg'
import type { DbAdapter } from './adapter'
import type { QueryResult, SchemaTable, SchemaColumn, SchemaIndex, FieldInfo } from '@shared/types'

export class PostgresAdapter implements DbAdapter {
  private pool: pg.Pool | null = null
  private config: pg.PoolConfig

  constructor(config: { host: string; port: number; database: string; user?: string; password?: string; ssl?: boolean }) {
    this.config = {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: 5,
      idleTimeoutMillis: 30000
    }
  }

  async connect(): Promise<void> {
    this.pool = new pg.Pool(this.config)
    // Verify connection
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
      `SELECT table_name as name, table_type
       FROM information_schema.tables
       WHERE table_schema = $1
       ORDER BY table_name`,
      [s]
    )
    return result.rows.map((r: { name: string; table_type: string }) => ({
      name: r.name,
      schema: s,
      type: r.table_type === 'VIEW' ? 'view' as const : 'table' as const
    }))
  }

  async getColumns(table: string, schema?: string): Promise<SchemaColumn[]> {
    if (!this.pool) throw new Error('Not connected')
    const s = schema ?? 'public'

    // Get columns
    const colResult = await this.pool.query(
      `SELECT c.column_name as name, c.data_type, c.is_nullable, c.column_default
       FROM information_schema.columns c
       WHERE c.table_schema = $1 AND c.table_name = $2
       ORDER BY c.ordinal_position`,
      [s, table]
    )

    // Get primary keys
    const pkResult = await this.pool.query(
      `SELECT a.attname as column_name
       FROM pg_index i
       JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
       JOIN pg_class c ON c.oid = i.indrelid
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE i.indisprimary AND c.relname = $1 AND n.nspname = $2`,
      [table, s]
    )
    const pkCols = new Set(pkResult.rows.map((r: { column_name: string }) => r.column_name))

    // Get foreign keys
    const fkResult = await this.pool.query(
      `SELECT kcu.column_name, ccu.table_name AS ref_table, ccu.column_name AS ref_column
       FROM information_schema.key_column_usage kcu
       JOIN information_schema.table_constraints tc ON tc.constraint_name = kcu.constraint_name
       JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
       WHERE tc.constraint_type = 'FOREIGN KEY' AND kcu.table_schema = $1 AND kcu.table_name = $2`,
      [s, table]
    )
    const fkMap = new Map(
      fkResult.rows.map((r: { column_name: string; ref_table: string; ref_column: string }) => [
        r.column_name,
        { table: r.ref_table, column: r.ref_column }
      ])
    )

    return colResult.rows.map((r: { name: string; data_type: string; is_nullable: string; column_default: string | null }) => ({
      name: r.name,
      dataType: r.data_type,
      nullable: r.is_nullable === 'YES',
      defaultValue: r.column_default,
      isPrimaryKey: pkCols.has(r.name),
      isForeignKey: fkMap.has(r.name),
      references: fkMap.get(r.name)
    }))
  }

  async getIndexes(table: string, schema?: string): Promise<SchemaIndex[]> {
    if (!this.pool) throw new Error('Not connected')
    const s = schema ?? 'public'
    const result = await this.pool.query(
      `SELECT i.relname as index_name, ix.indisunique as is_unique,
              array_agg(a.attname ORDER BY array_position(ix.indkey, a.attnum)) as columns
       FROM pg_class t
       JOIN pg_index ix ON t.oid = ix.indrelid
       JOIN pg_class i ON i.oid = ix.indexrelid
       JOIN pg_namespace n ON n.oid = t.relnamespace
       JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
       WHERE t.relname = $1 AND n.nspname = $2 AND NOT ix.indisprimary
       GROUP BY i.relname, ix.indisunique`,
      [table, s]
    )
    return result.rows.map((r: { index_name: string; is_unique: boolean; columns: string[] }) => ({
      name: r.index_name,
      columns: r.columns,
      unique: r.is_unique
    }))
  }

  async getSchemas(): Promise<string[]> {
    if (!this.pool) throw new Error('Not connected')
    const result = await this.pool.query(
      `SELECT schema_name FROM information_schema.schemata
       WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
       ORDER BY schema_name`
    )
    return result.rows.map((r: { schema_name: string }) => r.schema_name)
  }
}
```

- [ ] **Step 5: Create `src/main/db/mysql.ts`**

```typescript
import mysql from 'mysql2/promise'
import type { DbAdapter } from './adapter'
import type { QueryResult, SchemaTable, SchemaColumn, SchemaIndex, FieldInfo } from '@shared/types'

export class MysqlAdapter implements DbAdapter {
  private pool: mysql.Pool | null = null
  private config: mysql.PoolOptions

  constructor(config: { host: string; port: number; database: string; user?: string; password?: string; ssl?: boolean }) {
    this.config = {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl ? {} : undefined,
      waitForConnections: true,
      connectionLimit: 5
    }
  }

  async connect(): Promise<void> {
    this.pool = mysql.createPool(this.config)
    // Verify connection
    const conn = await this.pool.getConnection()
    conn.release()
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
    const [result, fields] = await this.pool.query(sql, params)
    const duration = Math.round(performance.now() - start)

    const isRows = Array.isArray(result)
    const rows = isRows ? (result as Record<string, unknown>[]) : []
    const fieldInfo: FieldInfo[] = (fields as mysql.FieldPacket[] ?? []).map(f => ({
      name: f.name,
      dataType: String(f.type),
      nullable: (f.flags ?? 0 & 1) === 0
    }))

    return {
      rows,
      fields: fieldInfo,
      rowCount: rows.length,
      duration,
      affectedRows: isRows ? 0 : (result as mysql.ResultSetHeader).affectedRows ?? 0
    }
  }

  async getTables(schema?: string): Promise<SchemaTable[]> {
    if (!this.pool) throw new Error('Not connected')
    const db = schema ?? this.config.database
    const [rows] = await this.pool.query(
      `SELECT table_name as name, table_type
       FROM information_schema.tables
       WHERE table_schema = ?
       ORDER BY table_name`,
      [db]
    )
    return (rows as { name: string; table_type: string }[]).map(r => ({
      name: r.name,
      schema: db as string,
      type: r.table_type === 'VIEW' ? 'view' as const : 'table' as const
    }))
  }

  async getColumns(table: string, schema?: string): Promise<SchemaColumn[]> {
    if (!this.pool) throw new Error('Not connected')
    const db = schema ?? this.config.database

    const [cols] = await this.pool.query(
      `SELECT column_name as name, data_type, is_nullable, column_default, column_key
       FROM information_schema.columns
       WHERE table_schema = ? AND table_name = ?
       ORDER BY ordinal_position`,
      [db, table]
    )

    const [fks] = await this.pool.query(
      `SELECT column_name, referenced_table_name, referenced_column_name
       FROM information_schema.key_column_usage
       WHERE table_schema = ? AND table_name = ? AND referenced_table_name IS NOT NULL`,
      [db, table]
    )
    const fkMap = new Map(
      (fks as { column_name: string; referenced_table_name: string; referenced_column_name: string }[])
        .map(r => [r.column_name, { table: r.referenced_table_name, column: r.referenced_column_name }])
    )

    return (cols as { name: string; data_type: string; is_nullable: string; column_default: string | null; column_key: string }[]).map(r => ({
      name: r.name,
      dataType: r.data_type,
      nullable: r.is_nullable === 'YES',
      defaultValue: r.column_default,
      isPrimaryKey: r.column_key === 'PRI',
      isForeignKey: fkMap.has(r.name),
      references: fkMap.get(r.name)
    }))
  }

  async getIndexes(table: string, schema?: string): Promise<SchemaIndex[]> {
    if (!this.pool) throw new Error('Not connected')
    const db = schema ?? this.config.database
    const [rows] = await this.pool.query(
      `SELECT index_name, non_unique, GROUP_CONCAT(column_name ORDER BY seq_in_index) as columns
       FROM information_schema.statistics
       WHERE table_schema = ? AND table_name = ? AND index_name != 'PRIMARY'
       GROUP BY index_name, non_unique`,
      [db, table]
    )
    return (rows as { index_name: string; non_unique: number; columns: string }[]).map(r => ({
      name: r.index_name,
      columns: r.columns.split(','),
      unique: r.non_unique === 0
    }))
  }

  async getSchemas(): Promise<string[]> {
    if (!this.pool) throw new Error('Not connected')
    const [rows] = await this.pool.query(
      `SELECT schema_name FROM information_schema.schemata
       WHERE schema_name NOT IN ('mysql', 'information_schema', 'performance_schema', 'sys')
       ORDER BY schema_name`
    )
    return (rows as { schema_name: string }[]).map(r => r.schema_name)
  }
}
```

- [ ] **Step 6: Update `src/main/db/factory.ts`**

```typescript
import type { ConnectionProfile } from '@shared/types'
import type { DbAdapter } from './adapter'
import { SqliteAdapter } from './sqlite'
import { PostgresAdapter } from './postgres'
import { MysqlAdapter } from './mysql'

export function createAdapter(profile: ConnectionProfile): DbAdapter {
  switch (profile.type) {
    case 'sqlite':
      return new SqliteAdapter(profile.database)
    case 'postgresql':
      return new PostgresAdapter({
        host: profile.host!,
        port: profile.port!,
        database: profile.database,
        user: profile.username,
        password: profile.password,
        ssl: profile.ssl
      })
    case 'mysql':
      return new MysqlAdapter({
        host: profile.host!,
        port: profile.port!,
        database: profile.database,
        user: profile.username,
        password: profile.password,
        ssl: profile.ssl
      })
    default:
      throw new Error(`Unsupported database type: ${(profile as any).type}`)
  }
}
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
cd dbstudio && npx vitest run tests/unit/adapter.test.ts
```

Expected: PASS — all 4 factory tests pass.

- [ ] **Step 8: Commit**

```bash
cd dbstudio && git add src/main/db/ tests/unit/adapter.test.ts && git commit -m "feat: add PostgreSQL and MySQL adapters"
```

---

### Task 5: Connection Profile Config Store

**Files:**
- Create: `dbstudio/src/main/config/store.ts`
- Test: `dbstudio/tests/unit/config-store.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/unit/config-store.test.ts
import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { ConfigStore } from '../../src/main/config/store'
import type { ConnectionProfile } from '../../shared/types'
import fs from 'fs'
import path from 'path'

const TEST_CONFIG = path.join(__dirname, 'test-config.json')

describe('ConfigStore', () => {
  let store: ConfigStore

  beforeEach(() => {
    if (fs.existsSync(TEST_CONFIG)) fs.unlinkSync(TEST_CONFIG)
    store = new ConfigStore(TEST_CONFIG)
  })

  afterAll(() => {
    if (fs.existsSync(TEST_CONFIG)) fs.unlinkSync(TEST_CONFIG)
  })

  it('starts with empty connections', () => {
    expect(store.listConnections()).toEqual([])
  })

  it('saves and retrieves a connection', () => {
    const profile: ConnectionProfile = {
      id: 'test-1',
      name: 'Local Dev',
      type: 'postgresql',
      host: 'localhost',
      port: 5432,
      database: 'mydb',
      username: 'user',
      password: 'pass'
    }
    store.saveConnection(profile)
    const list = store.listConnections()
    expect(list).toHaveLength(1)
    expect(list[0].name).toBe('Local Dev')
  })

  it('updates an existing connection', () => {
    const profile: ConnectionProfile = {
      id: 'test-1', name: 'Original', type: 'sqlite', database: '/tmp/a.db'
    }
    store.saveConnection(profile)
    store.saveConnection({ ...profile, name: 'Updated' })
    const list = store.listConnections()
    expect(list).toHaveLength(1)
    expect(list[0].name).toBe('Updated')
  })

  it('deletes a connection', () => {
    store.saveConnection({ id: 'a', name: 'A', type: 'sqlite', database: '/a.db' })
    store.saveConnection({ id: 'b', name: 'B', type: 'sqlite', database: '/b.db' })
    store.deleteConnection('a')
    const list = store.listConnections()
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe('b')
  })

  it('gets a connection by id', () => {
    store.saveConnection({ id: 'x', name: 'X', type: 'sqlite', database: '/x.db' })
    const conn = store.getConnection('x')
    expect(conn).toBeDefined()
    expect(conn!.name).toBe('X')
  })

  it('returns undefined for non-existent connection', () => {
    expect(store.getConnection('nonexistent')).toBeUndefined()
  })

  it('persists across instances', () => {
    store.saveConnection({ id: 'p', name: 'Persistent', type: 'sqlite', database: '/p.db' })
    const store2 = new ConfigStore(TEST_CONFIG)
    expect(store2.listConnections()).toHaveLength(1)
    expect(store2.listConnections()[0].name).toBe('Persistent')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd dbstudio && npx vitest run tests/unit/config-store.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/main/config/store.ts`**

```typescript
import fs from 'fs'
import path from 'path'
import type { ConnectionProfile } from '@shared/types'

interface ConfigData {
  connections: ConnectionProfile[]
}

export class ConfigStore {
  private filePath: string
  private data: ConfigData

  constructor(filePath: string) {
    this.filePath = filePath
    this.data = this.load()
  }

  private load(): ConfigData {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8')
        return JSON.parse(raw)
      }
    } catch {
      // Corrupted file — start fresh
    }
    return { connections: [] }
  }

  private save(): void {
    const dir = path.dirname(this.filePath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8')
  }

  listConnections(): ConnectionProfile[] {
    return [...this.data.connections]
  }

  getConnection(id: string): ConnectionProfile | undefined {
    return this.data.connections.find(c => c.id === id)
  }

  saveConnection(profile: ConnectionProfile): ConnectionProfile {
    const idx = this.data.connections.findIndex(c => c.id === profile.id)
    if (idx >= 0) {
      this.data.connections[idx] = profile
    } else {
      this.data.connections.push(profile)
    }
    this.save()
    return profile
  }

  deleteConnection(id: string): void {
    this.data.connections = this.data.connections.filter(c => c.id !== id)
    this.save()
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd dbstudio && npx vitest run tests/unit/config-store.test.ts
```

Expected: PASS — all 7 tests pass.

- [ ] **Step 5: Commit**

```bash
cd dbstudio && git add src/main/config/ tests/unit/config-store.test.ts && git commit -m "feat: add connection profile config store with JSON persistence"
```

---

### Task 6: Preload Script and Typed IPC Bridge

**Files:**
- Create: `dbstudio/src/preload/index.ts`
- Create: `dbstudio/src/preload/index.d.ts`

- [ ] **Step 1: Create `src/preload/index.ts`**

```typescript
import { contextBridge, ipcRenderer } from 'electron'
import type { IpcChannelMap } from '@shared/ipc'

const electronAPI = {
  invoke: <K extends keyof IpcChannelMap>(
    channel: K,
    ...args: IpcChannelMap[K]['args']
  ): Promise<IpcChannelMap[K]['return']> =>
    ipcRenderer.invoke(channel, ...args),

  on: (channel: string, callback: (...args: unknown[]) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => callback(...args)
    ipcRenderer.on(channel, listener)
    return () => { ipcRenderer.removeListener(channel, listener) }
  }
}

export type ElectronAPI = typeof electronAPI

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
```

- [ ] **Step 2: Create `src/preload/index.d.ts`**

```typescript
import type { ElectronAPI } from './index'

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
```

- [ ] **Step 3: Commit**

```bash
cd dbstudio && git add src/preload/ && git commit -m "feat: add preload script with typed IPC bridge"
```

---

### Task 7: Electron Main Process with IPC Handlers

**Files:**
- Create: `dbstudio/src/main/index.ts`
- Create: `dbstudio/src/main/ipc-handlers.ts`

- [ ] **Step 1: Create `src/main/ipc-handlers.ts`**

```typescript
import { ipcMain } from 'electron'
import { ConfigStore } from './config/store'
import { createAdapter } from './db/factory'
import type { DbAdapter } from './db/adapter'
import type { ConnectionProfile } from '@shared/types'
import type { IpcChannelMap } from '@shared/ipc'
import { app } from 'electron'
import path from 'path'

const configPath = path.join(app.getPath('userData'), 'config.json')
const configStore = new ConfigStore(configPath)
const activeAdapters = new Map<string, DbAdapter>()

function handle<K extends keyof IpcChannelMap>(
  channel: K,
  handler: (...args: IpcChannelMap[K]['args']) => IpcChannelMap[K]['return'] | Promise<IpcChannelMap[K]['return']>
) {
  ipcMain.handle(channel, (_event, ...args) =>
    handler(...(args as IpcChannelMap[K]['args']))
  )
}

export function registerIpcHandlers(): void {
  // Connection profile CRUD
  handle('connections:list', () => configStore.listConnections())

  handle('connections:save', (profile: ConnectionProfile) =>
    configStore.saveConnection(profile)
  )

  handle('connections:delete', (profileId: string) => {
    const adapter = activeAdapters.get(profileId)
    if (adapter) {
      adapter.disconnect()
      activeAdapters.delete(profileId)
    }
    configStore.deleteConnection(profileId)
  })

  // Database operations
  handle('db:connect', async (profileId: string) => {
    try {
      const profile = configStore.getConnection(profileId)
      if (!profile) return { success: false, error: 'Connection profile not found' }

      if (activeAdapters.has(profileId)) {
        return { success: true }
      }

      const adapter = createAdapter(profile)
      await adapter.connect()
      activeAdapters.set(profileId, adapter)
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  handle('db:disconnect', async (profileId: string) => {
    const adapter = activeAdapters.get(profileId)
    if (adapter) {
      await adapter.disconnect()
      activeAdapters.delete(profileId)
    }
  })

  handle('db:query', async (profileId: string, sql: string, params?: unknown[]) => {
    const adapter = activeAdapters.get(profileId)
    if (!adapter) throw new Error('Not connected. Connect first.')
    return adapter.query(sql, params)
  })

  handle('db:test-connection', async (profile: ConnectionProfile) => {
    let adapter: DbAdapter | null = null
    try {
      adapter = createAdapter(profile)
      await adapter.connect()
      const result = await adapter.query(
        profile.type === 'sqlite'
          ? 'SELECT sqlite_version() as version'
          : profile.type === 'postgresql'
            ? 'SELECT version() as version'
            : 'SELECT VERSION() as version'
      )
      const version = String(result.rows[0]?.version ?? 'unknown')
      return { success: true, version }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    } finally {
      await adapter?.disconnect()
    }
  })

  handle('db:get-tables', async (profileId: string, schema?: string) => {
    const adapter = activeAdapters.get(profileId)
    if (!adapter) throw new Error('Not connected')
    return adapter.getTables(schema)
  })

  handle('db:get-columns', async (profileId: string, table: string, schema?: string) => {
    const adapter = activeAdapters.get(profileId)
    if (!adapter) throw new Error('Not connected')
    return adapter.getColumns(table, schema)
  })

  handle('db:get-indexes', async (profileId: string, table: string, schema?: string) => {
    const adapter = activeAdapters.get(profileId)
    if (!adapter) throw new Error('Not connected')
    return adapter.getIndexes(table, schema)
  })

  handle('db:get-schemas', async (profileId: string) => {
    const adapter = activeAdapters.get(profileId)
    if (!adapter) throw new Error('Not connected')
    return adapter.getSchemas()
  })
}
```

- [ ] **Step 2: Create `src/main/index.ts`**

```typescript
import { app, BrowserWindow } from 'electron'
import path from 'path'
import { registerIpcHandlers } from './ipc-handlers'

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 10 },
    backgroundColor: '#0d0d1a',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  return win
}

app.whenReady().then(() => {
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
```

- [ ] **Step 3: Commit**

```bash
cd dbstudio && git add src/main/index.ts src/main/ipc-handlers.ts && git commit -m "feat: add Electron main process with IPC handlers"
```

---

### Task 8: React App Shell — Entry Point, Tailwind, and Global Styles

**Files:**
- Create: `dbstudio/src/renderer/index.html`
- Create: `dbstudio/src/renderer/src/main.tsx`
- Create: `dbstudio/src/renderer/src/styles/globals.css`
- Create: `dbstudio/src/renderer/src/App.tsx`
- Create: `dbstudio/postcss.config.js`
- Create: `dbstudio/tailwind.config.ts`

- [ ] **Step 1: Create `src/renderer/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>dbstudio</title>
  </head>
  <body class="bg-[#0d0d1a] text-white overflow-hidden">
    <div id="root"></div>
    <script type="module" src="./src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Create `src/renderer/src/styles/globals.css`**

```css
@import "tailwindcss";

@theme {
  --color-bg-primary: #0d0d1a;
  --color-bg-secondary: #12121f;
  --color-bg-tertiary: #1a1a2e;
  --color-border: #2a2a3e;
  --color-accent: #7c6ff7;
  --color-accent-hover: #9b8fff;
  --color-success: #28c840;
  --color-warning: #e5c07b;
  --color-error: #ff5f57;
  --color-info: #61afef;
  --color-text-primary: #ffffff;
  --color-text-secondary: #888888;
  --color-text-muted: #666666;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  user-select: none;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: var(--color-bg-primary);
}
::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-muted);
}

/* Drag region for custom title bar */
.drag-region {
  -webkit-app-region: drag;
}
.no-drag {
  -webkit-app-region: no-drag;
}
```

- [ ] **Step 3: Create `src/renderer/src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 4: Create `src/renderer/src/App.tsx`**

A placeholder shell that proves the layout works. We'll build out each component in subsequent steps.

```tsx
export function App() {
  return (
    <div className="flex flex-col h-screen bg-bg-primary text-text-primary">
      {/* Title Bar */}
      <div className="drag-region h-10 bg-bg-primary flex items-center px-4 border-b border-border shrink-0">
        <span className="text-text-muted text-sm ml-20">dbstudio</span>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <div className="w-12 bg-bg-primary border-r border-border flex flex-col items-center pt-3 gap-4 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent cursor-pointer">
            ⚡
          </div>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted cursor-pointer hover:text-text-primary">
            ✏️
          </div>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted cursor-pointer hover:text-text-primary">
            ◈
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-60 bg-bg-secondary border-r border-border flex flex-col shrink-0">
          <div className="px-3 py-2 text-xs text-text-muted uppercase tracking-wider">
            Connections
          </div>
          <div className="flex-1 overflow-y-auto px-2">
            <p className="text-text-muted text-sm px-2 py-8 text-center">No connections yet</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab Bar */}
          <div className="h-9 bg-bg-primary border-b border-border flex items-center px-2 shrink-0">
            <span className="text-text-muted text-xs px-3">Welcome</span>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex items-center justify-center bg-bg-tertiary">
            <div className="text-center">
              <h1 className="text-2xl font-semibold mb-2">dbstudio</h1>
              <p className="text-text-secondary">Connect to a database to get started</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-accent flex items-center px-3 text-xs text-white shrink-0">
        <span>Disconnected</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Verify the app launches**

```bash
cd dbstudio && npm run dev
```

Expected: An Electron window opens with the dark shell layout — activity bar on the left, sidebar, main content area with "dbstudio" welcome text, and a purple status bar at the bottom.

- [ ] **Step 6: Commit**

```bash
cd dbstudio && git add src/renderer/ postcss.config.js tailwind.config.ts && git commit -m "feat: add React shell with Tailwind dark theme and VS Code-style layout"
```

Note: if `postcss.config.js` and `tailwind.config.ts` weren't needed (Tailwind v4 with `@tailwindcss/vite` handles it), only commit the renderer files.

---

### Task 9: Shell Components — Activity Bar, Sidebar, Title Bar, Status Bar

**Files:**
- Create: `dbstudio/src/renderer/src/stores/ui.ts`
- Create: `dbstudio/src/renderer/src/components/shell/ActivityBar.tsx`
- Create: `dbstudio/src/renderer/src/components/shell/Sidebar.tsx`
- Create: `dbstudio/src/renderer/src/components/shell/TitleBar.tsx`
- Create: `dbstudio/src/renderer/src/components/shell/StatusBar.tsx`
- Create: `dbstudio/src/renderer/src/components/shell/TabBar.tsx`
- Modify: `dbstudio/src/renderer/src/App.tsx`

- [ ] **Step 1: Create `src/renderer/src/stores/ui.ts`**

```typescript
import { create } from 'zustand'

export type ActivityPanel = 'explorer' | 'query' | 'schema' | 'charts' | 'extensions'

interface UiState {
  activePanel: ActivityPanel
  sidebarVisible: boolean
  setActivePanel: (panel: ActivityPanel) => void
  toggleSidebar: () => void
}

export const useUiStore = create<UiState>((set) => ({
  activePanel: 'explorer',
  sidebarVisible: true,
  setActivePanel: (panel) =>
    set((state) => ({
      activePanel: panel,
      sidebarVisible: state.activePanel === panel ? !state.sidebarVisible : true
    })),
  toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible }))
}))
```

- [ ] **Step 2: Install lucide-react (if not already installed)**

```bash
cd dbstudio && npm list lucide-react || npm install lucide-react
```

- [ ] **Step 3: Create `src/renderer/src/components/shell/ActivityBar.tsx`**

```tsx
import { Database, PenSquare, GitFork, BarChart3, Puzzle } from 'lucide-react'
import { useUiStore, type ActivityPanel } from '@/stores/ui'

const items: { id: ActivityPanel; icon: typeof Database; label: string }[] = [
  { id: 'explorer', icon: Database, label: 'Explorer' },
  { id: 'query', icon: PenSquare, label: 'Query' },
  { id: 'schema', icon: GitFork, label: 'Schema' },
  { id: 'charts', icon: BarChart3, label: 'Charts' },
  { id: 'extensions', icon: Puzzle, label: 'Extensions' }
]

export function ActivityBar() {
  const { activePanel, sidebarVisible, setActivePanel } = useUiStore()

  return (
    <div className="w-12 bg-bg-primary border-r border-border flex flex-col items-center pt-2 gap-1 shrink-0">
      {items.map(({ id, icon: Icon, label }) => {
        const isActive = activePanel === id && sidebarVisible
        return (
          <button
            key={id}
            onClick={() => setActivePanel(id)}
            title={label}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              isActive
                ? 'bg-accent/10 text-accent'
                : 'text-text-muted hover:text-text-primary hover:bg-white/5'
            }`}
          >
            <Icon size={20} />
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Create `src/renderer/src/components/shell/Sidebar.tsx`**

```tsx
import { useUiStore } from '@/stores/ui'

export function Sidebar() {
  const { activePanel, sidebarVisible } = useUiStore()

  if (!sidebarVisible) return null

  const titles: Record<string, string> = {
    explorer: 'Explorer',
    query: 'Saved Queries',
    schema: 'Schema',
    charts: 'Charts',
    extensions: 'Extensions'
  }

  return (
    <div className="w-60 bg-bg-secondary border-r border-border flex flex-col shrink-0">
      <div className="px-3 py-2 text-xs text-text-muted uppercase tracking-wider border-b border-border">
        {titles[activePanel] ?? 'Explorer'}
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {activePanel === 'explorer' && (
          <p className="text-text-muted text-sm px-2 py-8 text-center">
            No connections yet
          </p>
        )}
        {activePanel !== 'explorer' && (
          <p className="text-text-muted text-sm px-2 py-8 text-center">
            Coming soon
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create `src/renderer/src/components/shell/TitleBar.tsx`**

```tsx
export function TitleBar() {
  return (
    <div className="drag-region h-10 bg-bg-primary flex items-center px-4 border-b border-border shrink-0">
      <span className="text-text-muted text-sm ml-20 no-drag">dbstudio</span>
    </div>
  )
}
```

- [ ] **Step 6: Create `src/renderer/src/components/shell/StatusBar.tsx`**

```tsx
import { useConnectionsStore } from '@/stores/connections'

export function StatusBar() {
  const { activeConnectionId, connections } = useConnectionsStore()
  const active = connections.find(c => c.id === activeConnectionId)

  return (
    <div className="h-6 bg-accent flex items-center px-3 text-xs text-white shrink-0 justify-between">
      <div className="flex items-center gap-3">
        {active ? (
          <>
            <span>{active.type === 'postgresql' ? 'PostgreSQL' : active.type === 'mysql' ? 'MySQL' : 'SQLite'}</span>
            <span>·</span>
            <span>{active.name}</span>
            <span>·</span>
            <span>{active.database}</span>
          </>
        ) : (
          <span>Disconnected</span>
        )}
      </div>
      <span>UTF-8</span>
    </div>
  )
}
```

- [ ] **Step 7: Create `src/renderer/src/components/shell/TabBar.tsx`**

```tsx
export function TabBar() {
  return (
    <div className="h-9 bg-bg-primary border-b border-border flex items-center shrink-0">
      <div className="px-4 py-1.5 text-sm text-text-primary border-b-2 border-accent">
        Welcome
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Create `src/renderer/src/stores/connections.ts`** (minimal store for StatusBar)

```typescript
import { create } from 'zustand'
import type { ConnectionProfile } from '@shared/types'

interface ConnectionsState {
  connections: ConnectionProfile[]
  activeConnectionId: string | null
  loading: boolean
  setConnections: (connections: ConnectionProfile[]) => void
  setActiveConnection: (id: string | null) => void
  setLoading: (loading: boolean) => void
}

export const useConnectionsStore = create<ConnectionsState>((set) => ({
  connections: [],
  activeConnectionId: null,
  loading: false,
  setConnections: (connections) => set({ connections }),
  setActiveConnection: (id) => set({ activeConnectionId: id }),
  setLoading: (loading) => set({ loading })
}))
```

- [ ] **Step 9: Update `src/renderer/src/App.tsx` to use shell components**

```tsx
import { ActivityBar } from '@/components/shell/ActivityBar'
import { Sidebar } from '@/components/shell/Sidebar'
import { TitleBar } from '@/components/shell/TitleBar'
import { StatusBar } from '@/components/shell/StatusBar'
import { TabBar } from '@/components/shell/TabBar'

export function App() {
  return (
    <div className="flex flex-col h-screen bg-bg-primary text-text-primary">
      <TitleBar />

      <div className="flex flex-1 overflow-hidden">
        <ActivityBar />
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <TabBar />

          <div className="flex-1 flex items-center justify-center bg-bg-tertiary">
            <div className="text-center">
              <h1 className="text-2xl font-semibold mb-2">dbstudio</h1>
              <p className="text-text-secondary">Connect to a database to get started</p>
            </div>
          </div>
        </div>
      </div>

      <StatusBar />
    </div>
  )
}
```

- [ ] **Step 10: Verify the app renders correctly**

```bash
cd dbstudio && npm run dev
```

Expected: The full shell layout renders — activity bar with 5 icons on the left, clicking icons toggles the sidebar context, title bar with drag region, tab bar, welcome content area, and accent-colored status bar.

- [ ] **Step 11: Commit**

```bash
cd dbstudio && git add src/renderer/src/ && git commit -m "feat: add shell components — activity bar, sidebar, title bar, status bar, tab bar"
```

---

### Task 10: Connection Manager UI — List, Add, Edit, Delete, Test

**Files:**
- Create: `dbstudio/src/renderer/src/components/connections/ConnectionList.tsx`
- Create: `dbstudio/src/renderer/src/components/connections/ConnectionForm.tsx`
- Create: `dbstudio/src/renderer/src/components/connections/ConnectionTestButton.tsx`
- Create: `dbstudio/src/renderer/src/hooks/use-ipc.ts`
- Modify: `dbstudio/src/renderer/src/stores/connections.ts`
- Modify: `dbstudio/src/renderer/src/components/shell/Sidebar.tsx`

- [ ] **Step 1: Create `src/renderer/src/hooks/use-ipc.ts`**

```typescript
import type { IpcChannelMap } from '@shared/ipc'

export function useIpc() {
  return {
    invoke: <K extends keyof IpcChannelMap>(
      channel: K,
      ...args: IpcChannelMap[K]['args']
    ): Promise<IpcChannelMap[K]['return']> =>
      window.electronAPI.invoke(channel, ...args)
  }
}
```

- [ ] **Step 2: Update `src/renderer/src/stores/connections.ts` with actions**

```typescript
import { create } from 'zustand'
import type { ConnectionProfile } from '@shared/types'

interface ConnectionsState {
  connections: ConnectionProfile[]
  activeConnectionId: string | null
  connectedIds: Set<string>
  loading: boolean
  setConnections: (connections: ConnectionProfile[]) => void
  setActiveConnection: (id: string | null) => void
  addConnected: (id: string) => void
  removeConnected: (id: string) => void
  setLoading: (loading: boolean) => void
  loadConnections: () => Promise<void>
  saveConnection: (profile: ConnectionProfile) => Promise<void>
  deleteConnection: (id: string) => Promise<void>
  connect: (id: string) => Promise<{ success: boolean; error?: string }>
  disconnect: (id: string) => Promise<void>
}

export const useConnectionsStore = create<ConnectionsState>((set, get) => ({
  connections: [],
  activeConnectionId: null,
  connectedIds: new Set(),
  loading: false,
  setConnections: (connections) => set({ connections }),
  setActiveConnection: (id) => set({ activeConnectionId: id }),
  addConnected: (id) => set((s) => ({ connectedIds: new Set([...s.connectedIds, id]) })),
  removeConnected: (id) => set((s) => {
    const next = new Set(s.connectedIds)
    next.delete(id)
    return { connectedIds: next }
  }),
  setLoading: (loading) => set({ loading }),

  loadConnections: async () => {
    set({ loading: true })
    const connections = await window.electronAPI.invoke('connections:list')
    set({ connections, loading: false })
  },

  saveConnection: async (profile) => {
    await window.electronAPI.invoke('connections:save', profile)
    await get().loadConnections()
  },

  deleteConnection: async (id) => {
    await window.electronAPI.invoke('connections:delete', id)
    const state = get()
    if (state.activeConnectionId === id) set({ activeConnectionId: null })
    await state.loadConnections()
  },

  connect: async (id) => {
    const result = await window.electronAPI.invoke('db:connect', id)
    if (result.success) {
      get().addConnected(id)
      set({ activeConnectionId: id })
    }
    return result
  },

  disconnect: async (id) => {
    await window.electronAPI.invoke('db:disconnect', id)
    get().removeConnected(id)
    if (get().activeConnectionId === id) set({ activeConnectionId: null })
  }
}))
```

- [ ] **Step 3: Create `src/renderer/src/components/connections/ConnectionTestButton.tsx`**

```tsx
import { useState } from 'react'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import type { ConnectionProfile } from '@shared/types'

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
      setMessage(result.version ?? 'Connected')
    } else {
      setStatus('error')
      setMessage(result.error ?? 'Connection failed')
    }
    setTimeout(() => setStatus('idle'), 3000)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={test}
        disabled={status === 'testing'}
        className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-white/5 transition-colors disabled:opacity-50"
      >
        {status === 'testing' ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          'Test Connection'
        )}
      </button>
      {status === 'success' && (
        <span className="text-success text-xs flex items-center gap-1">
          <CheckCircle size={12} /> {message}
        </span>
      )}
      {status === 'error' && (
        <span className="text-error text-xs flex items-center gap-1">
          <XCircle size={12} /> {message}
        </span>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create `src/renderer/src/components/connections/ConnectionForm.tsx`**

```tsx
import { useState } from 'react'
import { X } from 'lucide-react'
import { ConnectionTestButton } from './ConnectionTestButton'
import type { ConnectionProfile, DatabaseType } from '@shared/types'

interface Props {
  initial?: ConnectionProfile
  onSave: (profile: ConnectionProfile) => void
  onClose: () => void
}

const DB_TYPES: { value: DatabaseType; label: string; defaultPort: number }[] = [
  { value: 'postgresql', label: 'PostgreSQL', defaultPort: 5432 },
  { value: 'mysql', label: 'MySQL', defaultPort: 3306 },
  { value: 'sqlite', label: 'SQLite', defaultPort: 0 }
]

const COLORS = ['#7c6ff7', '#28c840', '#e5c07b', '#61afef', '#ff5f57', '#c678dd']

export function ConnectionForm({ initial, onSave, onClose }: Props) {
  const [profile, setProfile] = useState<ConnectionProfile>(
    initial ?? {
      id: crypto.randomUUID(),
      name: '',
      type: 'postgresql',
      host: 'localhost',
      port: 5432,
      database: '',
      username: '',
      password: '',
      color: '#7c6ff7'
    }
  )

  const update = (patch: Partial<ConnectionProfile>) =>
    setProfile((p) => ({ ...p, ...patch }))

  const isSqlite = profile.type === 'sqlite'

  const handleTypeChange = (type: DatabaseType) => {
    const defaultPort = DB_TYPES.find(t => t.value === type)?.defaultPort ?? 5432
    update({ type, port: defaultPort })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(profile)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-bg-secondary border border-border rounded-xl w-[480px] max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">
            {initial ? 'Edit Connection' : 'New Connection'}
          </h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Database Type */}
          <div className="flex gap-2">
            {DB_TYPES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleTypeChange(value)}
                className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                  profile.type === value
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-text-muted hover:text-text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs text-text-muted mb-1">Connection Name</label>
            <input
              required
              value={profile.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="My Database"
              className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs text-text-muted mb-1">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => update({ color: c })}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    profile.color === c ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {isSqlite ? (
            /* SQLite: just file path */
            <div>
              <label className="block text-xs text-text-muted mb-1">Database File</label>
              <input
                required
                value={profile.database}
                onChange={(e) => update({ database: e.target.value })}
                placeholder="/path/to/database.sqlite"
                className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
              />
            </div>
          ) : (
            /* PostgreSQL / MySQL: host, port, db, user, pass */
            <>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-text-muted mb-1">Host</label>
                  <input
                    required
                    value={profile.host ?? ''}
                    onChange={(e) => update({ host: e.target.value })}
                    placeholder="localhost"
                    className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs text-text-muted mb-1">Port</label>
                  <input
                    required
                    type="number"
                    value={profile.port ?? ''}
                    onChange={(e) => update({ port: parseInt(e.target.value) || 0 })}
                    className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Database</label>
                <input
                  required
                  value={profile.database}
                  onChange={(e) => update({ database: e.target.value })}
                  placeholder="mydb"
                  className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-text-muted mb-1">Username</label>
                  <input
                    value={profile.username ?? ''}
                    onChange={(e) => update({ username: e.target.value })}
                    placeholder="postgres"
                    className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-text-muted mb-1">Password</label>
                  <input
                    type="password"
                    value={profile.password ?? ''}
                    onChange={(e) => update({ password: e.target.value })}
                    className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.ssl ?? false}
                  onChange={(e) => update({ ssl: e.target.checked })}
                  className="accent-accent"
                />
                Use SSL
              </label>
            </>
          )}

          <ConnectionTestButton profile={profile} />
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-sm rounded-lg border border-border hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 text-sm rounded-lg bg-accent text-white hover:bg-accent-hover"
          >
            {initial ? 'Save Changes' : 'Add Connection'}
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 5: Create `src/renderer/src/components/connections/ConnectionList.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { Plus, PlugZap, Unplug, Pencil, Trash2 } from 'lucide-react'
import { useConnectionsStore } from '@/stores/connections'
import { ConnectionForm } from './ConnectionForm'
import type { ConnectionProfile } from '@shared/types'

export function ConnectionList() {
  const { connections, connectedIds, activeConnectionId, loadConnections, saveConnection, deleteConnection, connect, disconnect, setActiveConnection } = useConnectionsStore()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ConnectionProfile | undefined>()

  useEffect(() => { loadConnections() }, [loadConnections])

  const handleSave = async (profile: ConnectionProfile) => {
    await saveConnection(profile)
    setShowForm(false)
    setEditing(undefined)
  }

  const handleConnect = async (id: string) => {
    if (connectedIds.has(id)) {
      setActiveConnection(id)
    } else {
      const result = await connect(id)
      if (!result.success) {
        alert(`Connection failed: ${result.error}`)
      }
    }
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="px-2 py-1">
          <button
            onClick={() => { setEditing(undefined); setShowForm(true) }}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-md transition-colors"
          >
            <Plus size={14} /> New Connection
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-1">
          {connections.length === 0 && (
            <p className="text-text-muted text-xs px-3 py-6 text-center">
              No connections yet
            </p>
          )}
          {connections.map((conn) => {
            const isConnected = connectedIds.has(conn.id)
            const isActive = activeConnectionId === conn.id
            return (
              <div
                key={conn.id}
                className={`group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                  isActive ? 'bg-accent/10 text-accent' : 'hover:bg-white/5 text-text-secondary'
                }`}
                onClick={() => handleConnect(conn.id)}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: isConnected ? (conn.color ?? '#7c6ff7') : '#444' }}
                />
                <span className="text-sm truncate flex-1">{conn.name}</span>
                <div className="hidden group-hover:flex items-center gap-0.5">
                  {isConnected ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); disconnect(conn.id) }}
                      className="p-1 text-text-muted hover:text-error rounded"
                      title="Disconnect"
                    >
                      <Unplug size={12} />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleConnect(conn.id) }}
                      className="p-1 text-text-muted hover:text-success rounded"
                      title="Connect"
                    >
                      <PlugZap size={12} />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditing(conn); setShowForm(true) }}
                    className="p-1 text-text-muted hover:text-text-primary rounded"
                    title="Edit"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Delete "${conn.name}"?`)) deleteConnection(conn.id)
                    }}
                    className="p-1 text-text-muted hover:text-error rounded"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showForm && (
        <ConnectionForm
          initial={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(undefined) }}
        />
      )}
    </>
  )
}
```

- [ ] **Step 6: Update `src/renderer/src/components/shell/Sidebar.tsx`**

```tsx
import { useUiStore } from '@/stores/ui'
import { ConnectionList } from '@/components/connections/ConnectionList'

export function Sidebar() {
  const { activePanel, sidebarVisible } = useUiStore()

  if (!sidebarVisible) return null

  const titles: Record<string, string> = {
    explorer: 'Explorer',
    query: 'Saved Queries',
    schema: 'Schema',
    charts: 'Charts',
    extensions: 'Extensions'
  }

  return (
    <div className="w-60 bg-bg-secondary border-r border-border flex flex-col shrink-0">
      <div className="px-3 py-2 text-xs text-text-muted uppercase tracking-wider border-b border-border">
        {titles[activePanel] ?? 'Explorer'}
      </div>
      <div className="flex-1 overflow-y-auto">
        {activePanel === 'explorer' && <ConnectionList />}
        {activePanel !== 'explorer' && (
          <p className="text-text-muted text-sm px-2 py-8 text-center">
            Coming soon
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Verify the full connection flow works**

```bash
cd dbstudio && npm run dev
```

Expected:
1. App launches with the shell layout
2. Click "New Connection" → modal opens with database type selector (PostgreSQL, MySQL, SQLite)
3. Select SQLite, enter a file path, click "Test Connection" → shows version
4. Click "Add Connection" → connection appears in sidebar
5. Click the connection → it connects (dot turns colored)
6. Hover shows edit/delete/disconnect buttons
7. Status bar shows the active connection info

- [ ] **Step 8: Commit**

```bash
cd dbstudio && git add src/renderer/ && git commit -m "feat: add connection manager UI — list, add, edit, delete, test, connect"
```

---

### Task 11: E2E Test — App Launches and Shell Renders

**Files:**
- Create: `dbstudio/tests/e2e/app-launch.test.ts`
- Create: `dbstudio/playwright.config.ts`

- [ ] **Step 1: Install Playwright and Electron support**

```bash
cd dbstudio && npm install -D @playwright/test electron
```

- [ ] **Step 2: Create `playwright.config.ts`**

```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30000,
  use: {
    trace: 'on-first-retry'
  }
})
```

- [ ] **Step 3: Create `tests/e2e/app-launch.test.ts`**

```typescript
import { test, expect, _electron as electron } from '@playwright/test'
import path from 'path'

test('app launches and shows shell', async () => {
  const app = await electron.launch({
    args: [path.join(__dirname, '../../out/main/index.js')]
  })

  const window = await app.firstWindow()
  await window.waitForLoadState('domcontentloaded')

  // Title bar exists
  await expect(window.locator('text=dbstudio').first()).toBeVisible()

  // Activity bar has icons
  const activityButtons = window.locator('[title="Explorer"], [title="Query"], [title="Schema"]')
  await expect(activityButtons.first()).toBeVisible()

  // Sidebar shows "Explorer" header
  await expect(window.locator('text=Explorer').first()).toBeVisible()

  // Status bar shows "Disconnected"
  await expect(window.locator('text=Disconnected')).toBeVisible()

  await app.close()
})

test('can open new connection form', async () => {
  const app = await electron.launch({
    args: [path.join(__dirname, '../../out/main/index.js')]
  })

  const window = await app.firstWindow()
  await window.waitForLoadState('domcontentloaded')

  // Click "New Connection"
  await window.click('text=New Connection')

  // Form opens
  await expect(window.locator('text=New Connection').nth(1)).toBeVisible()
  await expect(window.locator('text=PostgreSQL')).toBeVisible()
  await expect(window.locator('text=MySQL')).toBeVisible()
  await expect(window.locator('text=SQLite')).toBeVisible()

  await app.close()
})
```

- [ ] **Step 4: Build the app and run E2E tests**

```bash
cd dbstudio && npm run build && npx playwright test
```

Expected: Both tests pass — app launches, shell components render, connection form opens.

- [ ] **Step 5: Commit**

```bash
cd dbstudio && git add tests/e2e/ playwright.config.ts && git commit -m "test: add E2E tests for app launch and connection form"
```

---

### Task 12: Run All Tests and Final Verification

- [ ] **Step 1: Run all unit tests**

```bash
cd dbstudio && npx vitest run
```

Expected: All unit tests pass (ipc-contracts, sqlite-adapter, adapter factory, config-store).

- [ ] **Step 2: Run E2E tests**

```bash
cd dbstudio && npm run build && npx playwright test
```

Expected: All E2E tests pass.

- [ ] **Step 3: Verify dev mode works end-to-end**

```bash
cd dbstudio && npm run dev
```

Expected: App launches, full shell renders, connections can be created/edited/deleted/tested/connected.

- [ ] **Step 4: Final commit with all tests passing**

```bash
cd dbstudio && git add -A && git commit -m "chore: plan 1 complete — scaffold, shell, connection manager"
```

---

## Plan Index

This is Plan 1 of 7. Subsequent plans build on this foundation:

- **Plan 2:** Query editor (Monaco) + query execution + results grid (AG Grid)
- **Plan 3:** Schema browser + ER diagram visualization (React Flow + Dagre + ELK.js)
- **Plan 4:** Data charts (Recharts) + query plan visualization
- **Plan 5:** Import/export + cross-database migration
- **Plan 6:** Plugin system (npm-based + SDK)
- **Plan 7:** Polish — command palette, keybindings, settings
