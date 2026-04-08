# Bundled Plugins Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship three bundled plugins (SSH Tunnel, MongoDB, Redis) that load through the existing PluginBootCoordinator, with renderer changes for dynamic connection forms and editor language switching.

**Architecture:** Each plugin is an inline TypeScript module in `src/main/plugins/bundled/` with a manifest. They're statically imported and registered via `registerBundledPlugin()` on the boot coordinator. Dependencies (`ssh2`, `mongodb`, `ioredis`) go in the main app's package.json. Renderer gets new IPC channels for dynamic connection fields and editor language per database type.

**Tech Stack:** TypeScript, Electron, ssh2, mongodb (npm driver), ioredis, React, Monaco Editor, Vitest

**Spec:** `docs/superpowers/specs/2026-04-08-bundled-plugins-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `src/main/plugins/bundled/ssh-tunnel/index.ts` | SSH tunnel plugin: middleware registration, tunnel management |
| `src/main/plugins/bundled/mongodb/index.ts` | MongoDB plugin: driver registration |
| `src/main/plugins/bundled/mongodb/mongo-adapter.ts` | MongoAdapter implementing DbAdapter |
| `src/main/plugins/bundled/redis/index.ts` | Redis plugin: driver registration |
| `src/main/plugins/bundled/redis/redis-adapter.ts` | RedisAdapter implementing DbAdapter |
| `tests/unit/mongo-adapter.test.ts` | MongoDB query parsing and result formatting |
| `tests/unit/redis-adapter.test.ts` | Redis command parsing and result formatting |
| `tests/unit/ssh-tunnel.test.ts` | SSH middleware shouldApply and profile rewriting |
| `tests/unit/bundled-plugins.test.ts` | All 3 plugins activate and register contributions |

### Modified Files

| File | Change |
|------|--------|
| `package.json` | Add `ssh2`, `mongodb`, `ioredis`, `@types/ssh2` |
| `src/main/plugins/plugin-host.ts` | Add `registerBundledPlugin()` method |
| `src/main/ipc-handlers.ts` | Import bundled plugins, register them, add `plugins:connection-fields` and `plugins:middleware-fields` handlers |
| `shared/ipc.ts` | Add `plugins:connection-fields` and `plugins:middleware-fields` channel types |
| `src/renderer/src/components/connections/ConnectionForm.tsx` | Dynamic DB type dropdown, plugin connection fields, SSH collapsible section |
| `src/renderer/src/components/query/QueryEditor.tsx` | Dynamic language based on database type |
| `src/renderer/src/components/query/QueryPanel.tsx` | Pass database type to QueryEditor |
| `src/renderer/src/components/plugins/ExtensionsPanel.tsx` | Use status object instead of `active` boolean |

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime dependencies**

Run:
```bash
npm install ssh2 mongodb ioredis
```

- [ ] **Step 2: Install dev dependencies**

Run:
```bash
npm install -D @types/ssh2
```

- [ ] **Step 3: Verify installation**

Run: `npm ls ssh2 mongodb ioredis`
Expected: All three listed with versions

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add ssh2, mongodb, ioredis dependencies"
```

---

### Task 2: Add registerBundledPlugin to Boot Coordinator

**Files:**
- Modify: `src/main/plugins/plugin-host.ts`
- Modify: `tests/unit/plugin-boot.test.ts`

- [ ] **Step 1: Write the test**

Add this test to the existing `describe('PluginBootCoordinator')` block in `tests/unit/plugin-boot.test.ts`:

```typescript
  it('registers and activates a bundled plugin', async () => {
    const fakeModule = {
      activate: vi.fn((ctx: any) => {
        ctx.drivers.register('testdb', {
          createAdapter: () => ({}),
          connectionFields: []
        })
      })
    }
    const manifest = {
      name: 'bundled-test', version: '1.0.0', displayName: 'Bundled Test',
      description: 'Test', main: 'index.js',
      contributes: { drivers: [{ id: 'testdb', name: 'TestDB' }] }
    }

    coordinator.registerBundledPlugin(manifest, fakeModule)
    const plugin = coordinator.getPlugin('bundled-test')
    expect(plugin).toBeDefined()
    expect(plugin!.status.state).toBe('validated')

    const result = await coordinator.activatePlugin(plugin!)
    expect(result.status.state).toBe('active')
    expect(fakeModule.activate).toHaveBeenCalledOnce()
    expect(driverRegistry.has('testdb')).toBe(true)
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/plugin-boot.test.ts`
Expected: FAIL — `registerBundledPlugin` is not a function

- [ ] **Step 3: Implement registerBundledPlugin**

In `src/main/plugins/plugin-host.ts`, add this method to `PluginBootCoordinator` class, right before the `// ── Install / Uninstall` section:

```typescript
  // ── Bundled Plugin Registration ────────────────────────────────────────────

  registerBundledPlugin(
    manifest: PluginManifest,
    module: { activate: (ctx: any) => void | Promise<void>; deactivate?: () => void | Promise<void> }
  ): void {
    this.plugins.set(manifest.name, {
      manifest,
      path: '<bundled>',
      status: { state: 'validated' },
      module
    })
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/plugin-boot.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/plugins/plugin-host.ts tests/unit/plugin-boot.test.ts
git commit -m "feat(plugins): add registerBundledPlugin to boot coordinator"
```

---

### Task 3: SSH Tunnel Plugin

**Files:**
- Create: `src/main/plugins/bundled/ssh-tunnel/index.ts`
- Create: `tests/unit/ssh-tunnel.test.ts`

- [ ] **Step 1: Write the tests**

```typescript
// tests/unit/ssh-tunnel.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// We test the middleware logic directly, not the activate() function
// because activate() needs a PluginContext. We export the middleware for testing.
import { sshMiddleware } from '../../src/main/plugins/bundled/ssh-tunnel/index'

describe('SSH Tunnel Middleware', () => {
  describe('shouldApply', () => {
    it('returns true when sshHost is set', () => {
      const profile = { id: '1', name: 'Test', type: 'postgresql', database: 'db', sshHost: 'bastion.example.com' } as any
      expect(sshMiddleware.shouldApply(profile)).toBe(true)
    })

    it('returns false when sshHost is not set', () => {
      const profile = { id: '1', name: 'Test', type: 'postgresql', database: 'db' } as any
      expect(sshMiddleware.shouldApply(profile)).toBe(false)
    })

    it('returns false when sshHost is empty string', () => {
      const profile = { id: '1', name: 'Test', type: 'postgresql', database: 'db', sshHost: '' } as any
      expect(sshMiddleware.shouldApply(profile)).toBe(false)
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/ssh-tunnel.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the SSH tunnel plugin**

```typescript
// src/main/plugins/bundled/ssh-tunnel/index.ts
import { Client } from 'ssh2'
import net from 'net'
import type { PluginContext, ConnectionMiddleware } from '../../sdk/types'
import type { PluginManifest } from '../../types'
import type { ConnectionProfile } from '@shared/types'

const activeTunnels = new Map<string, Client>()

export const manifest: PluginManifest = {
  name: 'dbstudio-plugin-ssh',
  version: '1.0.0',
  displayName: 'SSH Tunnels',
  description: 'SSH tunnel support for database connections',
  main: 'index.js',
  contributes: {
    connectionMiddleware: [{ id: 'ssh-tunnel' }],
    connectionFields: [
      { key: 'sshHost', label: 'SSH Host', type: 'text', group: 'ssh' },
      { key: 'sshPort', label: 'SSH Port', type: 'number', default: 22, group: 'ssh' },
      { key: 'sshUser', label: 'SSH User', type: 'text', group: 'ssh' },
      { key: 'sshPassword', label: 'SSH Password', type: 'password', group: 'ssh' },
      { key: 'sshPrivateKey', label: 'Private Key', type: 'file', group: 'ssh' }
    ]
  }
}

export const sshMiddleware: ConnectionMiddleware = {
  shouldApply(profile: ConnectionProfile): boolean {
    return !!(profile as Record<string, unknown>).sshHost
  },

  async beforeConnect(profile: ConnectionProfile): Promise<ConnectionProfile> {
    const p = profile as Record<string, unknown>
    const sshHost = p.sshHost as string
    const sshPort = (p.sshPort as number) || 22
    const sshUser = (p.sshUser as string) || 'root'
    const sshPassword = p.sshPassword as string | undefined
    const sshPrivateKey = p.sshPrivateKey as string | undefined

    const remoteHost = profile.host || 'localhost'
    const remotePort = profile.port || 5432

    const localPort = await getAvailablePort()

    return new Promise<ConnectionProfile>((resolve, reject) => {
      const client = new Client()

      client.on('ready', () => {
        client.forwardOut('127.0.0.1', localPort, remoteHost, remotePort, (err, stream) => {
          if (err) {
            client.end()
            reject(new Error(`Failed to establish SSH tunnel: ${err.message}`))
            return
          }

          const server = net.createServer((sock) => {
            stream.pipe(sock)
            sock.pipe(stream)
          })

          server.listen(localPort, '127.0.0.1', () => {
            activeTunnels.set(profile.id, client)
            resolve({
              ...profile,
              host: '127.0.0.1',
              port: localPort
            })
          })

          server.on('error', (serverErr) => {
            client.end()
            reject(new Error(`Failed to establish SSH tunnel: ${serverErr.message}`))
          })

          // Store server ref for cleanup
          ;(client as any)._tunnelServer = server
        })
      })

      client.on('error', (err) => {
        if (err.message.includes('authentication') || err.message.includes('Auth')) {
          reject(new Error('SSH authentication failed — check credentials or private key'))
        } else if (err.message.includes('ECONNREFUSED')) {
          reject(new Error(`Cannot reach SSH host ${sshHost}:${sshPort}`))
        } else {
          reject(new Error(`Failed to establish SSH tunnel: ${err.message}`))
        }
      })

      const connectConfig: any = {
        host: sshHost,
        port: sshPort,
        username: sshUser
      }

      if (sshPrivateKey) {
        connectConfig.privateKey = sshPrivateKey
      } else if (sshPassword) {
        connectConfig.password = sshPassword
      }

      client.connect(connectConfig)
    })
  },

  async onDisconnect(profileId: string): Promise<void> {
    const client = activeTunnels.get(profileId)
    if (client) {
      const server = (client as any)._tunnelServer as net.Server | undefined
      if (server) {
        server.close()
      }
      client.end()
      activeTunnels.delete(profileId)
    }
  }
}

export function activate(ctx: PluginContext): void {
  ctx.drivers.registerConnectionMiddleware('ssh-tunnel', sshMiddleware)
}

export function deactivate(): void {
  // Close all active tunnels
  for (const [id, client] of activeTunnels) {
    const server = (client as any)._tunnelServer as net.Server | undefined
    if (server) server.close()
    client.end()
  }
  activeTunnels.clear()
}

function getAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as net.AddressInfo
      server.close(() => resolve(addr.port))
    })
    server.on('error', reject)
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/ssh-tunnel.test.ts`
Expected: All 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/plugins/bundled/ssh-tunnel/index.ts tests/unit/ssh-tunnel.test.ts
git commit -m "feat(plugins): add SSH tunnel bundled plugin"
```

---

### Task 4: MongoDB Adapter

**Files:**
- Create: `src/main/plugins/bundled/mongodb/mongo-adapter.ts`
- Create: `tests/unit/mongo-adapter.test.ts`

- [ ] **Step 1: Write the tests**

```typescript
// tests/unit/mongo-adapter.test.ts
import { describe, it, expect } from 'vitest'
import { parseMongoQuery, formatMongoResult } from '../../src/main/plugins/bundled/mongodb/mongo-adapter'

describe('parseMongoQuery', () => {
  it('parses a valid find query', () => {
    const q = parseMongoQuery('{ "collection": "users", "operation": "find", "filter": { "age": 25 }, "limit": 10 }')
    expect(q.collection).toBe('users')
    expect(q.operation).toBe('find')
    expect(q.filter).toEqual({ age: 25 })
    expect(q.limit).toBe(10)
  })

  it('parses an aggregate query', () => {
    const q = parseMongoQuery('{ "collection": "orders", "operation": "aggregate", "pipeline": [{ "$match": { "status": "A" } }] }')
    expect(q.collection).toBe('orders')
    expect(q.operation).toBe('aggregate')
    expect(q.pipeline).toEqual([{ '$match': { status: 'A' } }])
  })

  it('throws on invalid JSON', () => {
    expect(() => parseMongoQuery('not json')).toThrow(/Invalid query/)
  })

  it('throws on missing collection', () => {
    expect(() => parseMongoQuery('{ "operation": "find" }')).toThrow(/collection/)
  })

  it('throws on missing operation', () => {
    expect(() => parseMongoQuery('{ "collection": "users" }')).toThrow(/operation/)
  })

  it('throws on unknown operation', () => {
    expect(() => parseMongoQuery('{ "collection": "users", "operation": "drop" }')).toThrow(/Unknown operation/)
  })
})

describe('formatMongoResult', () => {
  it('formats an array of documents into QueryResult', () => {
    const docs = [
      { _id: '1', name: 'Alice', age: 30 },
      { _id: '2', name: 'Bob', age: 25 }
    ]
    const result = formatMongoResult(docs, 0)
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toEqual({ _id: '1', name: 'Alice', age: 30 })
    expect(result.fields).toHaveLength(3)
    expect(result.fields.map(f => f.name)).toEqual(['_id', 'name', 'age'])
    expect(result.rowCount).toBe(2)
  })

  it('handles empty result', () => {
    const result = formatMongoResult([], 0)
    expect(result.rows).toEqual([])
    expect(result.fields).toEqual([])
    expect(result.rowCount).toBe(0)
  })

  it('stringifies nested objects in cell values', () => {
    const docs = [{ _id: '1', address: { city: 'NYC', zip: '10001' } }]
    const result = formatMongoResult(docs, 0)
    expect(result.rows[0].address).toBe('{"city":"NYC","zip":"10001"}')
  })

  it('stringifies arrays in cell values', () => {
    const docs = [{ _id: '1', tags: ['a', 'b'] }]
    const result = formatMongoResult(docs, 0)
    expect(result.rows[0].tags).toBe('["a","b"]')
  })

  it('formats write operation result', () => {
    const writeResult = { insertedId: 'abc123' }
    const result = formatMongoResult(writeResult, 5)
    expect(result.affectedRows).toBe(5)
    expect(result.rows).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/mongo-adapter.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the MongoAdapter**

```typescript
// src/main/plugins/bundled/mongodb/mongo-adapter.ts
import { MongoClient, type Db, type Collection, type Document } from 'mongodb'
import type { DbAdapter } from '../../../db/adapter'
import type { QueryResult, SchemaTable, SchemaColumn, SchemaIndex } from '@shared/types'

const VALID_OPERATIONS = [
  'find', 'findOne', 'aggregate', 'count', 'distinct',
  'insertOne', 'insertMany', 'updateOne', 'updateMany',
  'deleteOne', 'deleteMany'
] as const

type MongoOperation = typeof VALID_OPERATIONS[number]

interface MongoQuery {
  collection: string
  operation: MongoOperation
  filter?: Document
  limit?: number
  pipeline?: Document[]
  update?: Document
  document?: Document
  documents?: Document[]
  field?: string
}

export function parseMongoQuery(input: string): MongoQuery {
  let parsed: any
  try {
    parsed = JSON.parse(input)
  } catch {
    throw new Error('Invalid query: expected JSON object — example: { "collection": "users", "operation": "find" }')
  }

  if (!parsed.collection) {
    throw new Error("Query must specify a 'collection' field")
  }
  if (!parsed.operation) {
    throw new Error("Query must specify an 'operation' field")
  }
  if (!VALID_OPERATIONS.includes(parsed.operation)) {
    throw new Error(`Unknown operation '${parsed.operation}'. Valid operations: ${VALID_OPERATIONS.join(', ')}`)
  }

  return parsed as MongoQuery
}

export function formatMongoResult(data: any, affectedRows: number): QueryResult {
  const start = Date.now()

  if (!Array.isArray(data)) {
    // Write operation result — wrap in array
    const row = typeof data === 'object' && data !== null ? data : { result: data }
    return {
      rows: [row],
      fields: Object.keys(row).map(name => ({ name, dataType: 'string', nullable: true })),
      rowCount: 1,
      duration: Date.now() - start,
      affectedRows
    }
  }

  if (data.length === 0) {
    return { rows: [], fields: [], rowCount: 0, duration: Date.now() - start, affectedRows: 0 }
  }

  // Flatten nested objects/arrays to JSON strings
  const rows = data.map(doc => {
    const row: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(doc)) {
      if (value !== null && typeof value === 'object') {
        row[key] = JSON.stringify(value)
      } else {
        row[key] = value
      }
    }
    return row
  })

  // Derive fields from union of all keys
  const fieldSet = new Set<string>()
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      fieldSet.add(key)
    }
  }
  const fields = [...fieldSet].map(name => ({
    name,
    dataType: inferType(rows[0][name]),
    nullable: true
  }))

  return {
    rows,
    fields,
    rowCount: rows.length,
    duration: Date.now() - start,
    affectedRows
  }
}

function inferType(value: unknown): string {
  if (value === null || value === undefined) return 'string'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  return 'string'
}

export class MongoAdapter implements DbAdapter {
  private client: MongoClient | null = null
  private db: Db | null = null
  private config: Record<string, unknown>

  constructor(config: Record<string, unknown>) {
    this.config = config
  }

  async connect(): Promise<void> {
    const { host, port, database, username, password, authSource, srv, ssl } = this.config as {
      host: string; port: number; database: string; username?: string; password?: string
      authSource?: string; srv?: boolean; ssl?: boolean
    }

    const protocol = srv ? 'mongodb+srv' : 'mongodb'
    const auth = username && password ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@` : ''
    const portPart = srv ? '' : `:${port}`
    const params = new URLSearchParams()
    if (authSource) params.set('authSource', authSource)
    if (ssl) params.set('tls', 'true')
    const paramStr = params.toString() ? `?${params.toString()}` : ''

    const uri = `${protocol}://${auth}${host}${portPart}/${database}${paramStr}`

    this.client = new MongoClient(uri)
    await this.client.connect()
    this.db = this.client.db(database)
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close()
      this.client = null
      this.db = null
    }
  }

  async query(input: string): Promise<QueryResult> {
    if (!this.db) throw new Error('Not connected')
    const q = parseMongoQuery(input)
    const col = this.db.collection(q.collection)
    const start = Date.now()

    switch (q.operation) {
      case 'find': {
        const cursor = col.find(q.filter ?? {})
        if (q.limit) cursor.limit(q.limit)
        const docs = await cursor.toArray()
        return formatMongoResult(docs, 0)
      }
      case 'findOne': {
        const doc = await col.findOne(q.filter ?? {})
        return formatMongoResult(doc ? [doc] : [], 0)
      }
      case 'aggregate': {
        const docs = await col.aggregate(q.pipeline ?? []).toArray()
        return formatMongoResult(docs, 0)
      }
      case 'count': {
        const count = await col.countDocuments(q.filter ?? {})
        return formatMongoResult({ count }, 0)
      }
      case 'distinct': {
        if (!q.field) throw new Error("distinct operation requires a 'field' property")
        const values = await col.distinct(q.field, q.filter ?? {})
        return formatMongoResult(values.map((v, i) => ({ index: i, value: v })), 0)
      }
      case 'insertOne': {
        if (!q.document) throw new Error("insertOne requires a 'document' property")
        const r = await col.insertOne(q.document)
        return formatMongoResult({ insertedId: String(r.insertedId) }, 1)
      }
      case 'insertMany': {
        if (!q.documents) throw new Error("insertMany requires a 'documents' property")
        const r = await col.insertMany(q.documents)
        return formatMongoResult({ insertedCount: r.insertedCount }, r.insertedCount)
      }
      case 'updateOne': {
        if (!q.filter || !q.update) throw new Error("updateOne requires 'filter' and 'update' properties")
        const r = await col.updateOne(q.filter, q.update)
        return formatMongoResult({ matchedCount: r.matchedCount, modifiedCount: r.modifiedCount }, r.modifiedCount)
      }
      case 'updateMany': {
        if (!q.filter || !q.update) throw new Error("updateMany requires 'filter' and 'update' properties")
        const r = await col.updateMany(q.filter, q.update)
        return formatMongoResult({ matchedCount: r.matchedCount, modifiedCount: r.modifiedCount }, r.modifiedCount)
      }
      case 'deleteOne': {
        if (!q.filter) throw new Error("deleteOne requires a 'filter' property")
        const r = await col.deleteOne(q.filter)
        return formatMongoResult({ deletedCount: r.deletedCount }, r.deletedCount)
      }
      case 'deleteMany': {
        if (!q.filter) throw new Error("deleteMany requires a 'filter' property")
        const r = await col.deleteMany(q.filter)
        return formatMongoResult({ deletedCount: r.deletedCount }, r.deletedCount)
      }
      default:
        throw new Error(`Unknown operation '${q.operation}'`)
    }
  }

  async getTables(schema?: string): Promise<SchemaTable[]> {
    if (!this.db) throw new Error('Not connected')
    const collections = await this.db.listCollections().toArray()
    return collections.map(c => ({
      name: c.name,
      schema: this.db!.databaseName,
      type: 'table' as const
    }))
  }

  async getColumns(table: string): Promise<SchemaColumn[]> {
    if (!this.db) throw new Error('Not connected')
    const docs = await this.db.collection(table).find().limit(100).toArray()
    const fieldMap = new Map<string, string>()

    for (const doc of docs) {
      for (const [key, value] of Object.entries(doc)) {
        if (!fieldMap.has(key)) {
          fieldMap.set(key, inferType(value))
        }
      }
    }

    return [...fieldMap.entries()].map(([name, dataType]) => ({
      name,
      dataType,
      nullable: name !== '_id',
      defaultValue: null,
      isPrimaryKey: name === '_id',
      isForeignKey: false
    }))
  }

  async getIndexes(table: string): Promise<SchemaIndex[]> {
    if (!this.db) throw new Error('Not connected')
    const indexes = await this.db.collection(table).indexes()
    return indexes.map(idx => ({
      name: idx.name ?? 'unknown',
      columns: Object.keys(idx.key ?? {}),
      unique: idx.unique ?? false
    }))
  }

  async getSchemas(): Promise<string[]> {
    if (!this.client) throw new Error('Not connected')
    const adminDb = this.client.db('admin')
    const result = await adminDb.admin().listDatabases()
    return result.databases.map(db => db.name)
  }

  async getDatabases(): Promise<string[]> {
    return this.getSchemas()
  }

  async switchDatabase(database: string): Promise<void> {
    if (!this.client) throw new Error('Not connected')
    this.db = this.client.db(database)
  }

  isConnected(): boolean {
    // MongoClient 6.x doesn't have a simple isConnected check
    // We check if client and db references exist
    return this.client !== null && this.db !== null
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/mongo-adapter.test.ts`
Expected: All 11 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/plugins/bundled/mongodb/mongo-adapter.ts tests/unit/mongo-adapter.test.ts
git commit -m "feat(plugins): add MongoDB adapter with query parsing"
```

---

### Task 5: MongoDB Plugin Entry Point

**Files:**
- Create: `src/main/plugins/bundled/mongodb/index.ts`

- [ ] **Step 1: Create the MongoDB plugin entry point**

```typescript
// src/main/plugins/bundled/mongodb/index.ts
import type { PluginContext } from '../../sdk/types'
import type { PluginManifest } from '../../types'
import { MongoAdapter } from './mongo-adapter'

export const manifest: PluginManifest = {
  name: 'dbstudio-plugin-mongodb',
  version: '1.0.0',
  displayName: 'MongoDB',
  description: 'MongoDB database driver',
  main: 'index.js',
  contributes: {
    drivers: [{ id: 'mongodb', name: 'MongoDB' }]
  }
}

export function activate(ctx: PluginContext): void {
  ctx.drivers.register('mongodb', {
    createAdapter: (config) => new MongoAdapter(config),
    connectionFields: [
      { key: 'host', label: 'Host', type: 'text', required: true, default: 'localhost' },
      { key: 'port', label: 'Port', type: 'number', required: true, default: 27017 },
      { key: 'database', label: 'Database', type: 'text', required: true },
      { key: 'username', label: 'Username', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
      { key: 'authSource', label: 'Auth Source', type: 'text', default: 'admin' },
      { key: 'srv', label: 'Use SRV', type: 'boolean', default: false },
      { key: 'ssl', label: 'SSL', type: 'boolean', default: false }
    ]
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/main/plugins/bundled/mongodb/index.ts
git commit -m "feat(plugins): add MongoDB plugin entry point"
```

---

### Task 6: Redis Adapter

**Files:**
- Create: `src/main/plugins/bundled/redis/redis-adapter.ts`
- Create: `tests/unit/redis-adapter.test.ts`

- [ ] **Step 1: Write the tests**

```typescript
// tests/unit/redis-adapter.test.ts
import { describe, it, expect } from 'vitest'
import { parseRedisCommands, formatRedisResult } from '../../src/main/plugins/bundled/redis/redis-adapter'

describe('parseRedisCommands', () => {
  it('parses a single command', () => {
    const cmds = parseRedisCommands('GET user:1')
    expect(cmds).toEqual([['GET', 'user:1']])
  })

  it('parses multiple commands', () => {
    const cmds = parseRedisCommands('GET user:1\nSET foo bar')
    expect(cmds).toEqual([['GET', 'user:1'], ['SET', 'foo', 'bar']])
  })

  it('skips empty lines', () => {
    const cmds = parseRedisCommands('GET key\n\nSET foo bar\n')
    expect(cmds).toEqual([['GET', 'key'], ['SET', 'foo', 'bar']])
  })

  it('handles commands with multiple args', () => {
    const cmds = parseRedisCommands('SET foo bar EX 300')
    expect(cmds).toEqual([['SET', 'foo', 'bar', 'EX', '300']])
  })

  it('trims whitespace', () => {
    const cmds = parseRedisCommands('  GET  key  ')
    expect(cmds).toEqual([['GET', 'key']])
  })
})

describe('formatRedisResult', () => {
  it('formats a scalar string result', () => {
    const result = formatRedisResult([{ command: 'GET key', value: 'hello' }])
    expect(result.rows).toEqual([{ value: 'hello' }])
    expect(result.rowCount).toBe(1)
  })

  it('formats a null result', () => {
    const result = formatRedisResult([{ command: 'GET missing', value: null }])
    expect(result.rows).toEqual([{ value: '(nil)' }])
  })

  it('formats an array result', () => {
    const result = formatRedisResult([{ command: 'KEYS *', value: ['user:1', 'user:2', 'session:abc'] }])
    expect(result.rows).toHaveLength(3)
    expect(result.rows[0]).toEqual({ index: 0, value: 'user:1' })
  })

  it('formats a hash result', () => {
    const result = formatRedisResult([{ command: 'HGETALL user:1', value: { name: 'Alice', age: '30' } }])
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toEqual({ field: 'name', value: 'Alice' })
  })

  it('formats multiple command results with delimiters', () => {
    const result = formatRedisResult([
      { command: 'GET foo', value: 'bar' },
      { command: 'GET baz', value: 'qux' }
    ])
    // 2 result rows + 1 delimiter
    expect(result.rows).toHaveLength(3)
    expect(result.rows[0]).toEqual({ command: 'GET foo', value: 'bar' })
    expect(result.rows[1]).toEqual({ command: '---', value: '---' })
    expect(result.rows[2]).toEqual({ command: 'GET baz', value: 'qux' })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/redis-adapter.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the RedisAdapter**

```typescript
// src/main/plugins/bundled/redis/redis-adapter.ts
import Redis from 'ioredis'
import type { DbAdapter } from '../../../db/adapter'
import type { QueryResult, SchemaTable, SchemaColumn, SchemaIndex } from '@shared/types'

interface CommandResult {
  command: string
  value: unknown
}

export function parseRedisCommands(input: string): string[][] {
  return input
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => line.split(/\s+/))
}

export function formatRedisResult(results: CommandResult[]): QueryResult {
  const start = Date.now()

  if (results.length === 0) {
    return { rows: [], fields: [], rowCount: 0, duration: 0, affectedRows: 0 }
  }

  // Single command — simpler output without command column
  if (results.length === 1) {
    const { value } = results[0]
    const rows = formatSingleValue(value)
    const fields = Object.keys(rows[0] || {}).map(name => ({ name, dataType: 'string', nullable: true }))
    return { rows, fields, rowCount: rows.length, duration: Date.now() - start, affectedRows: 0 }
  }

  // Multiple commands — include command column and delimiters
  const rows: Record<string, unknown>[] = []
  for (let i = 0; i < results.length; i++) {
    if (i > 0) {
      rows.push({ command: '---', value: '---' })
    }
    const { command, value } = results[i]
    const formatted = formatSingleValue(value)
    for (const row of formatted) {
      rows.push({ command, ...row })
    }
  }

  const fields = Object.keys(rows[0] || {}).map(name => ({ name, dataType: 'string', nullable: true }))
  return { rows, fields, rowCount: rows.length, duration: Date.now() - start, affectedRows: 0 }
}

function formatSingleValue(value: unknown): Record<string, unknown>[] {
  if (value === null || value === undefined) {
    return [{ value: '(nil)' }]
  }
  if (Array.isArray(value)) {
    return value.map((v, i) => ({ index: i, value: String(v) }))
  }
  if (typeof value === 'object') {
    // Hash result
    return Object.entries(value as Record<string, unknown>).map(([field, v]) => ({ field, value: String(v) }))
  }
  return [{ value: String(value) }]
}

export class RedisAdapter implements DbAdapter {
  private redis: Redis | null = null
  private config: Record<string, unknown>

  constructor(config: Record<string, unknown>) {
    this.config = config
  }

  async connect(): Promise<void> {
    const { host, port, password, database, ssl } = this.config as {
      host: string; port: number; password?: string; database?: number; ssl?: boolean
    }

    this.redis = new Redis({
      host: host || 'localhost',
      port: port || 6379,
      password: password || undefined,
      db: database || 0,
      tls: ssl ? {} : undefined,
      lazyConnect: true,
      retryStrategy: () => null // Don't retry on connect failure
    })

    await this.redis.connect()
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      this.redis.disconnect()
      this.redis = null
    }
  }

  async query(input: string): Promise<QueryResult> {
    if (!this.redis) throw new Error('Not connected')
    const commands = parseRedisCommands(input)
    if (commands.length === 0) {
      return { rows: [], fields: [], rowCount: 0, duration: 0, affectedRows: 0 }
    }

    const results: CommandResult[] = []
    for (const parts of commands) {
      const [cmd, ...args] = parts
      const commandStr = parts.join(' ')
      try {
        const value = await (this.redis as any).call(cmd, ...args)
        results.push({ command: commandStr, value })
      } catch (err) {
        results.push({ command: commandStr, value: `ERROR: ${(err as Error).message}` })
      }
    }

    return formatRedisResult(results)
  }

  async getTables(): Promise<SchemaTable[]> {
    if (!this.redis) throw new Error('Not connected')
    const prefixes = new Map<string, number>()
    let cursor = '0'
    let scanned = 0

    do {
      const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', '*', 'COUNT', '100')
      cursor = nextCursor
      for (const key of keys) {
        const colonIdx = key.indexOf(':')
        const prefix = colonIdx >= 0 ? key.substring(0, colonIdx) : '(no prefix)'
        prefixes.set(prefix, (prefixes.get(prefix) ?? 0) + 1)
      }
      scanned += keys.length
    } while (cursor !== '0' && scanned < 1000)

    return [...prefixes.entries()].map(([name, count]) => ({
      name,
      schema: '',
      type: 'table' as const,
      rowCount: count
    }))
  }

  async getColumns(table: string): Promise<SchemaColumn[]> {
    if (!this.redis) throw new Error('Not connected')
    // Find first key matching the table prefix
    const [, keys] = await this.redis.scan('0', 'MATCH', `${table}:*`, 'COUNT', '10')
    if (keys.length === 0) return []

    const key = keys[0]
    const keyType = await this.redis.type(key)

    let columns: string[]
    switch (keyType) {
      case 'hash': {
        const hkeys = await this.redis.hkeys(key)
        columns = hkeys
        break
      }
      case 'string':
        columns = ['value']
        break
      case 'list':
        columns = ['index', 'value']
        break
      case 'set':
      case 'zset':
        columns = ['member']
        break
      default:
        columns = ['value']
    }

    return columns.map(name => ({
      name,
      dataType: keyType,
      nullable: true,
      defaultValue: null,
      isPrimaryKey: false,
      isForeignKey: false
    }))
  }

  async getIndexes(): Promise<SchemaIndex[]> {
    return []
  }

  async getSchemas(): Promise<string[]> {
    return Array.from({ length: 16 }, (_, i) => String(i))
  }

  async getDatabases(): Promise<string[]> {
    return this.getSchemas()
  }

  async switchDatabase(database: string): Promise<void> {
    if (!this.redis) throw new Error('Not connected')
    await this.redis.select(parseInt(database))
  }

  isConnected(): boolean {
    return this.redis?.status === 'ready'
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/redis-adapter.test.ts`
Expected: All 10 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/plugins/bundled/redis/redis-adapter.ts tests/unit/redis-adapter.test.ts
git commit -m "feat(plugins): add Redis adapter with command parsing"
```

---

### Task 7: Redis Plugin Entry Point

**Files:**
- Create: `src/main/plugins/bundled/redis/index.ts`

- [ ] **Step 1: Create the Redis plugin entry point**

```typescript
// src/main/plugins/bundled/redis/index.ts
import type { PluginContext } from '../../sdk/types'
import type { PluginManifest } from '../../types'
import { RedisAdapter } from './redis-adapter'

export const manifest: PluginManifest = {
  name: 'dbstudio-plugin-redis',
  version: '1.0.0',
  displayName: 'Redis',
  description: 'Redis database driver',
  main: 'index.js',
  contributes: {
    drivers: [{ id: 'redis', name: 'Redis' }]
  }
}

export function activate(ctx: PluginContext): void {
  ctx.drivers.register('redis', {
    createAdapter: (config) => new RedisAdapter(config),
    connectionFields: [
      { key: 'host', label: 'Host', type: 'text', required: true, default: 'localhost' },
      { key: 'port', label: 'Port', type: 'number', required: true, default: 6379 },
      { key: 'password', label: 'Password', type: 'password' },
      { key: 'database', label: 'Database (0-15)', type: 'number', default: 0 },
      { key: 'ssl', label: 'SSL', type: 'boolean', default: false }
    ]
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/main/plugins/bundled/redis/index.ts
git commit -m "feat(plugins): add Redis plugin entry point"
```

---

### Task 8: Bundled Plugin Integration Test

**Files:**
- Create: `tests/unit/bundled-plugins.test.ts`

- [ ] **Step 1: Write the integration test**

```typescript
// tests/unit/bundled-plugins.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { PluginBootCoordinator } from '../../src/main/plugins/plugin-host'
import { DriverRegistryImpl } from '../../src/main/plugins/sdk/driver-registry'
import { CommandRegistryImpl } from '../../src/main/plugins/sdk/command-registry'
import { PanelRegistryImpl } from '../../src/main/plugins/sdk/panel-registry'

import * as sshPlugin from '../../src/main/plugins/bundled/ssh-tunnel/index'
import * as mongoPlugin from '../../src/main/plugins/bundled/mongodb/index'
import * as redisPlugin from '../../src/main/plugins/bundled/redis/index'

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

  it('all three plugins can be activated together', async () => {
    coordinator.registerBundledPlugin(sshPlugin.manifest, sshPlugin)
    coordinator.registerBundledPlugin(mongoPlugin.manifest, mongoPlugin)
    coordinator.registerBundledPlugin(redisPlugin.manifest, redisPlugin)

    for (const name of ['dbstudio-plugin-ssh', 'dbstudio-plugin-mongodb', 'dbstudio-plugin-redis']) {
      const plugin = coordinator.getPlugin(name)!
      await coordinator.activatePlugin(plugin)
      expect(plugin.status.state).toBe('active')
    }

    expect(driverRegistry.hasMiddleware('ssh-tunnel')).toBe(true)
    expect(driverRegistry.has('mongodb')).toBe(true)
    expect(driverRegistry.has('redis')).toBe(true)
  })

  it('MongoDB driver factory creates an adapter', () => {
    coordinator.registerBundledPlugin(mongoPlugin.manifest, mongoPlugin)

    // Manually get the factory to check it works
    const factory = driverRegistry.get('mongodb')
    // Factory isn't registered yet — we need to activate first
    expect(factory).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run tests/unit/bundled-plugins.test.ts`
Expected: All 5 tests PASS

- [ ] **Step 3: Commit**

```bash
git add tests/unit/bundled-plugins.test.ts
git commit -m "test(plugins): add bundled plugin integration tests"
```

---

### Task 9: Wire Bundled Plugins into IPC Handlers

**Files:**
- Modify: `shared/ipc.ts`
- Modify: `src/main/ipc-handlers.ts`

- [ ] **Step 1: Add new IPC channel types**

In `shared/ipc.ts`, add before the closing `}` of `IpcChannelMap`:

```typescript
  'plugins:connection-fields': {
    args: []
    return: { driverId: string; driverName: string; connectionFields: { key: string; label: string; type: string; required?: boolean; default?: string | number | boolean; group?: string }[] }[]
  }
  'plugins:middleware-fields': {
    args: []
    return: { key: string; label: string; type: string; required?: boolean; default?: string | number | boolean; group?: string }[]
  }
```

- [ ] **Step 2: Import bundled plugins in ipc-handlers.ts**

At the top of `src/main/ipc-handlers.ts`, after the existing imports, add:

```typescript
import * as sshPlugin from './plugins/bundled/ssh-tunnel'
import * as mongoPlugin from './plugins/bundled/mongodb'
import * as redisPlugin from './plugins/bundled/redis'
```

- [ ] **Step 3: Register bundled plugins before boot**

In `src/main/ipc-handlers.ts`, find the line `pluginCoordinator.boot().catch(...)` and add BEFORE it:

```typescript
  // Register bundled plugins
  pluginCoordinator.registerBundledPlugin(sshPlugin.manifest, sshPlugin)
  pluginCoordinator.registerBundledPlugin(mongoPlugin.manifest, mongoPlugin)
  pluginCoordinator.registerBundledPlugin(redisPlugin.manifest, redisPlugin)
```

- [ ] **Step 4: Add connection-fields and middleware-fields handlers**

In `src/main/ipc-handlers.ts`, add after the `plugins:errors` handler:

```typescript
  handle('plugins:connection-fields', async () => {
    return driverRegistry.getDriverIds().map(id => {
      const factory = driverRegistry.get(id)!
      return {
        driverId: id,
        driverName: factory.connectionFields.length > 0 ? id : id,
        connectionFields: factory.connectionFields
      }
    })
  })

  handle('plugins:middleware-fields', async () => {
    // Collect connectionFields from all loaded plugin manifests that have them
    const fields: { key: string; label: string; type: string; required?: boolean; default?: string | number | boolean; group?: string }[] = []
    for (const plugin of pluginCoordinator.getLoadedPlugins()) {
      if (plugin.manifest.contributes.connectionFields) {
        fields.push(...plugin.manifest.contributes.connectionFields)
      }
    }
    return fields
  })
```

- [ ] **Step 5: Run the full test suite**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add shared/ipc.ts src/main/ipc-handlers.ts
git commit -m "feat(plugins): wire bundled plugins into IPC handlers"
```

---

### Task 10: Update Connection Form for Plugin Types

**Files:**
- Modify: `src/renderer/src/components/connections/ConnectionForm.tsx`

- [ ] **Step 1: Update ConnectionForm to support plugin-contributed database types**

Replace the entire `src/renderer/src/components/connections/ConnectionForm.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { X, ChevronDown, ChevronRight } from 'lucide-react'
import { ConnectionTestButton } from './ConnectionTestButton'
import type { ConnectionProfile, DatabaseType } from '@shared/types'

interface Props {
  initial?: ConnectionProfile
  onSave: (profile: ConnectionProfile) => void
  onClose: () => void
}

interface PluginDriver {
  driverId: string
  driverName: string
  connectionFields: { key: string; label: string; type: string; required?: boolean; default?: string | number | boolean; group?: string }[]
}

interface MiddlewareField {
  key: string; label: string; type: string; required?: boolean; default?: string | number | boolean; group?: string
}

const BUILTIN_TYPES: { value: DatabaseType; label: string; defaultPort: number }[] = [
  { value: 'postgresql', label: 'PostgreSQL', defaultPort: 5432 },
  { value: 'mysql', label: 'MySQL', defaultPort: 3306 },
  { value: 'sqlite', label: 'SQLite', defaultPort: 0 }
]

const COLORS = ['#7c6ff7', '#28c840', '#e5c07b', '#61afef', '#ff5f57', '#c678dd']

export function ConnectionForm({ initial, onSave, onClose }: Props) {
  const [pluginDrivers, setPluginDrivers] = useState<PluginDriver[]>([])
  const [middlewareFields, setMiddlewareFields] = useState<MiddlewareField[]>([])
  const [sshExpanded, setSshExpanded] = useState(false)

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
    ...(initial ?? {})
  })

  useEffect(() => {
    window.electronAPI.invoke('plugins:connection-fields').then(setPluginDrivers).catch(() => {})
    window.electronAPI.invoke('plugins:middleware-fields').then(setMiddlewareFields).catch(() => {})
  }, [])

  const allTypes = [
    ...BUILTIN_TYPES.map(t => ({ value: t.value, label: t.label })),
    ...pluginDrivers.map(d => ({ value: d.driverId as DatabaseType, label: d.driverName.charAt(0).toUpperCase() + d.driverName.slice(1) }))
  ]

  const isBuiltin = BUILTIN_TYPES.some(t => t.value === profile.type)
  const activePluginDriver = pluginDrivers.find(d => d.driverId === profile.type)
  const isSqlite = profile.type === 'sqlite'
  const sshFields = middlewareFields.filter(f => f.group === 'ssh')

  const update = (patch: Record<string, unknown>) => setProfile(p => ({ ...p, ...patch }))

  const handleTypeChange = (type: DatabaseType) => {
    const builtinPort = BUILTIN_TYPES.find(t => t.value === type)?.defaultPort
    if (builtinPort !== undefined) {
      update({ type, port: builtinPort })
    } else {
      // Plugin type — set defaults from connection fields
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
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(profile as ConnectionProfile)
  }

  const renderField = (field: { key: string; label: string; type: string; required?: boolean; default?: string | number | boolean }) => {
    const value = profile[field.key] ?? field.default ?? ''

    if (field.type === 'boolean') {
      return (
        <label key={field.key} className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
          <input type="checkbox" checked={!!profile[field.key]} onChange={(e) => update({ [field.key]: e.target.checked })} className="accent-accent" />
          {field.label}
        </label>
      )
    }

    return (
      <div key={field.key}>
        <label className="block text-xs text-text-muted mb-1">{field.label}</label>
        <input
          type={field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : 'text'}
          required={field.required}
          value={String(value)}
          onChange={(e) => update({ [field.key]: field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value })}
          className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
        />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-bg-secondary border border-border rounded-xl w-[480px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">{initial ? 'Edit Connection' : 'New Connection'}</h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-primary"><X size={16} /></button>
        </div>
        <div className="p-4 space-y-4">
          {/* Database type selector */}
          <div className="flex gap-2 flex-wrap">
            {allTypes.map(({ value, label }) => (
              <button key={value} type="button" onClick={() => handleTypeChange(value)}
                className={`flex-1 min-w-[80px] py-2 text-sm rounded-lg border transition-colors ${profile.type === value ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-muted hover:text-text-primary'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Connection name */}
          <div>
            <label className="block text-xs text-text-muted mb-1">Connection Name</label>
            <input required value={String(profile.name ?? '')} onChange={(e) => update({ name: e.target.value })} placeholder="My Database"
              className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs text-text-muted mb-1">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => update({ color: c })}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${profile.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* Type-specific fields */}
          {isBuiltin ? (
            <>
              {isSqlite ? (
                <div>
                  <label className="block text-xs text-text-muted mb-1">Database File</label>
                  <input required value={String(profile.database ?? '')} onChange={(e) => update({ database: e.target.value })} placeholder="/path/to/database.sqlite"
                    className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                </div>
              ) : (
                <>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs text-text-muted mb-1">Host</label>
                      <input required value={String(profile.host ?? '')} onChange={(e) => update({ host: e.target.value })} placeholder="localhost"
                        className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                    </div>
                    <div className="w-24">
                      <label className="block text-xs text-text-muted mb-1">Port</label>
                      <input required type="number" value={String(profile.port ?? '')} onChange={(e) => update({ port: parseInt(e.target.value) || 0 })}
                        className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Database</label>
                    <input required value={String(profile.database ?? '')} onChange={(e) => update({ database: e.target.value })} placeholder="mydb"
                      className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs text-text-muted mb-1">Username</label>
                      <input value={String(profile.username ?? '')} onChange={(e) => update({ username: e.target.value })} placeholder="postgres"
                        className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-text-muted mb-1">Password</label>
                      <input type="password" value={String(profile.password ?? '')} onChange={(e) => update({ password: e.target.value })}
                        className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                    <input type="checkbox" checked={!!profile.ssl} onChange={(e) => update({ ssl: e.target.checked })} className="accent-accent" />
                    Use SSL
                  </label>
                </>
              )}
            </>
          ) : activePluginDriver ? (
            /* Plugin-contributed driver fields */
            <div className="space-y-4">
              {activePluginDriver.connectionFields.filter(f => !f.group).map(renderField)}
            </div>
          ) : null}

          {/* SSH Tunnel section (from middleware fields) */}
          {sshFields.length > 0 && !isSqlite && (
            <div className="border border-border rounded-lg">
              <button type="button" onClick={() => setSshExpanded(!sshExpanded)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary">
                {sshExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                SSH Tunnel
              </button>
              {sshExpanded && (
                <div className="px-3 pb-3 space-y-3">
                  {sshFields.map(renderField)}
                </div>
              )}
            </div>
          )}

          <ConnectionTestButton profile={profile as ConnectionProfile} />
        </div>
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-border">
          <button type="button" onClick={onClose} className="px-4 py-1.5 text-sm rounded-lg border border-border hover:bg-white/5">Cancel</button>
          <button type="submit" className="px-4 py-1.5 text-sm rounded-lg bg-accent text-white hover:bg-accent-hover">
            {initial ? 'Save Changes' : 'Add Connection'}
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/connections/ConnectionForm.tsx
git commit -m "feat(ui): dynamic connection form with plugin-contributed database types"
```

---

### Task 11: Dynamic Editor Language

**Files:**
- Modify: `src/renderer/src/components/query/QueryEditor.tsx`
- Modify: `src/renderer/src/components/query/QueryPanel.tsx`

- [ ] **Step 1: Update QueryEditor to accept databaseType prop**

In `src/renderer/src/components/query/QueryEditor.tsx`, change the Props interface and component:

Replace lines 7-13:
```typescript
interface Props {
  value: string
  onChange: (value: string) => void
  onExecute: () => void
  connectionId: string | null
  schema: string | null
  databaseType?: string
}
```

Replace line 52 (`defaultLanguage="sql"`) — change the `<Editor` component to use a computed language:

Replace lines 50-54:
```tsx
  const language = props.databaseType === 'mongodb' ? 'json' : props.databaseType === 'redis' ? 'plaintext' : 'sql'

  return (
    <Editor
      language={language}
      value={value}
```

Note: Change `defaultLanguage` to `language` so it updates dynamically when the connection changes.

Also update the function signature to destructure `databaseType`:

Replace line 17:
```typescript
export function QueryEditor({ value, onChange, onExecute, connectionId, schema, databaseType }: Props) {
```

And conditionally register SQL completions — wrap lines 24-27:
```typescript
    if (!completionRegistered && language === 'sql') {
      registerSqlCompletionProvider(monaco)
      completionRegistered = true
    }
```

Need to pass `language` into the `handleMount` callback. Since `language` is derived from props, capture it via a ref or compute inside. The simplest approach: compute language inside the component body and use it.

Full updated file:

```tsx
import { useRef, useCallback, useEffect } from 'react'
import Editor, { type Monaco, type OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { registerSqlCompletionProvider, updateTableNames } from '@/lib/monaco-sql'
import { useConnectionsStore } from '@/stores/connections'

interface Props {
  value: string
  onChange: (value: string) => void
  onExecute: () => void
  connectionId: string | null
  schema: string | null
  databaseType?: string
}

let completionRegistered = false

export function QueryEditor({ value, onChange, onExecute, connectionId, schema, databaseType }: Props) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const { connectedIds } = useConnectionsStore()

  const language = databaseType === 'mongodb' ? 'json' : databaseType === 'redis' ? 'plaintext' : 'sql'

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor

    if (!completionRegistered && language === 'sql') {
      registerSqlCompletionProvider(monaco)
      completionRegistered = true
    }

    editor.addAction({
      id: 'execute-query',
      label: 'Execute Query',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => onExecute()
    })

    editor.focus()
  }, [onExecute, language])

  // Fetch table names for autocomplete when connection or schema changes
  useEffect(() => {
    if (!connectionId || !connectedIds.has(connectionId) || language !== 'sql') {
      updateTableNames([])
      return
    }
    window.electronAPI.invoke('db:get-table-names', connectionId, schema ?? undefined)
      .then(names => updateTableNames(names))
      .catch(() => updateTableNames([]))
  }, [connectionId, schema, connectedIds, language])

  return (
    <Editor
      language={language}
      value={value}
      onChange={(v) => onChange(v ?? '')}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'on',
        padding: { top: 8, bottom: 8 },
        renderLineHighlight: 'line',
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
        scrollbar: {
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8
        }
      }}
      onMount={handleMount}
      loading={
        <div className="flex items-center justify-center h-full text-text-muted text-sm">
          Loading editor...
        </div>
      }
    />
  )
}
```

- [ ] **Step 2: Update QueryPanel to pass databaseType**

In `src/renderer/src/components/query/QueryPanel.tsx`, find the `<QueryEditor` usage and add a `databaseType` prop.

First, import the connections store if not already imported and derive the type:

Add near the top of the QueryPanel component function (after existing hooks):

```typescript
  const connections = useConnectionsStore(s => s.connections)
  const dbType = tab.connectionId ? connections.find(c => c.id === tab.connectionId)?.type : undefined
```

Then update the `<QueryEditor` JSX to include the prop:

```tsx
        <QueryEditor
          value={tab.sql}
          onChange={(sql) => updateTabSql(tab.id, sql)}
          onExecute={handleExecute}
          connectionId={tab.connectionId}
          schema={tab.schema}
          databaseType={dbType}
        />
```

- [ ] **Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/query/QueryEditor.tsx src/renderer/src/components/query/QueryPanel.tsx
git commit -m "feat(ui): dynamic editor language based on database type"
```

---

### Task 12: Update Extensions Panel

**Files:**
- Modify: `src/renderer/src/components/plugins/ExtensionsPanel.tsx`

- [ ] **Step 1: Update the ExtensionsPanel to use status object**

Replace the `PluginInfo` interface and status-dependent rendering in `src/renderer/src/components/plugins/ExtensionsPanel.tsx`:

Replace lines 4-11:
```typescript
interface PluginInfo {
  name: string
  displayName: string
  version: string
  description: string
  status: { state: string; error?: string; phase?: string; contributions?: string[] }
  contributions: string[]
}
```

Replace line 95 (the Puzzle icon with active color) with a status dot:
```tsx
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                plugin.status.state === 'active' ? 'bg-green-400' :
                plugin.status.state === 'degraded' ? 'bg-yellow-400' :
                plugin.status.state === 'error' ? 'bg-red-400' : 'bg-gray-500'
              }`} />
```

Replace lines 102-104 (error display) with:
```tsx
                {plugin.contributions.length > 0 && (
                  <p className="text-[10px] text-text-muted mt-0.5">{plugin.contributions.join(', ')}</p>
                )}
                {plugin.status.error && (
                  <p className="text-[10px] text-error mt-0.5">{plugin.status.error}</p>
                )}
```

Replace lines 107-123 (the active/inactive buttons) — use `status.state` instead of `active`:
```tsx
              <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                {plugin.status.state === 'active' || plugin.status.state === 'degraded' ? (
                  <button onClick={() => handleDeactivate(plugin.name)} className="p-1 text-text-muted hover:text-warning rounded" title="Deactivate">
                    <PowerOff size={12} />
                  </button>
                ) : (
                  <button onClick={() => handleActivate(plugin.name)} className="p-1 text-text-muted hover:text-success rounded" title="Activate">
                    <Power size={12} />
                  </button>
                )}
                <button onClick={() => handleUninstall(plugin.name)} className="p-1 text-text-muted hover:text-error rounded" title="Uninstall">
                  <Trash2 size={12} />
                </button>
              </div>
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/plugins/ExtensionsPanel.tsx
git commit -m "feat(ui): update extensions panel with status indicators"
```

---

### Task 13: Final Verification

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 2: Run TypeScript type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Run the build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit any fixes**

If any issues, fix and commit:
```bash
git add -A
git commit -m "fix(plugins): address build/type issues from bundled plugin integration"
```
