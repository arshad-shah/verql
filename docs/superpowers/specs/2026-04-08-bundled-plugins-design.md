# Bundled Plugins — SSH Tunnel, MongoDB, Redis

Three bundled plugins that ship with the app: SSH tunnel middleware, MongoDB driver, and Redis driver. Each loads through the existing PluginBootCoordinator as inline modules in `src/main/plugins/bundled/`. Includes targeted renderer changes for dynamic connection forms and editor language switching.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Packaging | Inline in `src/main/plugins/bundled/` with `plugin-manifest.json` | No separate build step, exercises real plugin system |
| Dependencies | Added to main app `package.json` | Single `node_modules`, simpler |
| SSH approach | Connection middleware, not a driver | Wraps any existing driver transparently |
| MongoDB query format | JSON string `{ collection, operation, filter }` | Keeps DbAdapter interface unchanged |
| Redis query format | Raw command text, one per line | Natural for Redis users |
| Editor language | Dynamic per connection type | `mongodb` → json, `redis` → plaintext, else → sql |
| Connection form | Merge plugin fields via IPC | No hardcoded forms for plugin types |

## 1. File Structure

```
src/main/plugins/bundled/
├── ssh-tunnel/
│   ├── plugin-manifest.json
│   └── index.ts
├── mongodb/
│   ├── plugin-manifest.json
│   ├── index.ts
│   └── mongo-adapter.ts
└── redis/
    ├── plugin-manifest.json
    ├── index.ts
    └── redis-adapter.ts
```

## 2. Bundled Plugin Loading

Bundled plugins are statically imported and registered via `registerBundledPlugin()` on the boot coordinator. This avoids filesystem discovery and `require()` complexity for code that's compiled as part of the main process bundle by electron-vite.

Each bundled plugin exports `{ manifest, activate, deactivate? }`. The coordinator injects them at startup in the `'validated'` state, then proceeds with the normal activate/verify phases.

User-installed plugins still load via filesystem discovery from `userData/plugins/` as before.

## 3. SSH Tunnel Plugin

**Name:** `dbstudio-plugin-ssh`

### Manifest

```json
{
  "name": "dbstudio-plugin-ssh",
  "version": "1.0.0",
  "displayName": "SSH Tunnels",
  "description": "SSH tunnel support for database connections",
  "main": "index.js",
  "contributes": {
    "connectionMiddleware": [{ "id": "ssh-tunnel" }],
    "connectionFields": [
      { "key": "sshHost", "label": "SSH Host", "type": "text", "group": "ssh" },
      { "key": "sshPort", "label": "SSH Port", "type": "number", "default": 22, "group": "ssh" },
      { "key": "sshUser", "label": "SSH User", "type": "text", "group": "ssh" },
      { "key": "sshPassword", "label": "SSH Password", "type": "password", "group": "ssh" },
      { "key": "sshPrivateKey", "label": "Private Key", "type": "file", "group": "ssh" }
    ]
  }
}
```

### Behavior

```typescript
// activate()
export function activate(ctx: PluginContext): void {
  ctx.drivers.registerConnectionMiddleware('ssh-tunnel', sshMiddleware)
}
```

**sshMiddleware:**

1. `shouldApply(profile)` — returns `true` if `(profile as Record<string, unknown>).sshHost` is truthy
2. `beforeConnect(profile)` — uses `ssh2` to open a tunnel:
   - Connect to `sshHost:sshPort` with `sshUser` + password or private key
   - Forward a random available local port to `profile.host:profile.port`
   - Return modified profile with `host: '127.0.0.1', port: localPort`
   - Store the `ssh2.Client` in `activeTunnels` map keyed by profile ID
3. `onDisconnect(profileId)` — closes the SSH client from `activeTunnels`, removes entry

**Tunnel tracking:** `Map<string, ssh2.Client>` — keyed by `profileId`.

**Error handling:**
- SSH auth failure → `"SSH authentication failed — check credentials or private key"`
- SSH connection refused → `"Cannot reach SSH host {host}:{port}"`
- Tunnel setup failure → `"Failed to establish SSH tunnel: {error}"`

### Dependency

- `ssh2` + `@types/ssh2` (dev)

## 4. MongoDB Plugin

**Name:** `dbstudio-plugin-mongodb`

### Manifest

```json
{
  "name": "dbstudio-plugin-mongodb",
  "version": "1.0.0",
  "displayName": "MongoDB",
  "description": "MongoDB database driver",
  "main": "index.js",
  "contributes": {
    "drivers": [{ "id": "mongodb", "name": "MongoDB" }]
  }
}
```

### activate()

```typescript
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

### MongoAdapter

Implements `DbAdapter` by wrapping the `mongodb` npm package.

| Method | Implementation |
|--------|---------------|
| `connect()` | Build URI from config. `MongoClient.connect(uri)`. Store `client` and `db`. |
| `disconnect()` | `client.close()` |
| `query(str)` | Parse JSON string into `{ collection, operation, filter?, limit?, pipeline?, update?, document?, documents? }`. Dispatch to collection method. Format documents as `QueryResult`. |
| `getTables(schema?)` | `db.listCollections().toArray()` — map to `SchemaTable[]` with `type: 'table'` |
| `getColumns(table)` | Sample first 100 docs from collection. Merge all keys. Infer type from JS typeof. Return as `SchemaColumn[]`. First `_id` column marked as primary key. |
| `getIndexes(table)` | `collection.indexes()` — map to `SchemaIndex[]` |
| `getSchemas()` | `client.db('admin').admin().listDatabases()` — return database names |
| `getDatabases()` | Same as `getSchemas()` |
| `switchDatabase(db)` | `this.db = this.client.db(db)` |
| `isConnected()` | Check client topology connected state |

### Query Format

JSON string parsed by MongoAdapter:

```json
{ "collection": "users", "operation": "find", "filter": { "age": { "$gt": 25 } }, "limit": 50 }
```

**Supported operations:**

| Operation | Required fields | Returns |
|-----------|----------------|---------|
| `find` | `collection`, optional `filter`, `limit` | Array of documents |
| `findOne` | `collection`, optional `filter` | Single document or empty |
| `aggregate` | `collection`, `pipeline` | Array of documents |
| `count` | `collection`, optional `filter` | `{ count: N }` |
| `distinct` | `collection`, `field`, optional `filter` | Array of values |
| `insertOne` | `collection`, `document` | `{ insertedId }` |
| `insertMany` | `collection`, `documents` | `{ insertedCount }` |
| `updateOne` | `collection`, `filter`, `update` | `{ matchedCount, modifiedCount }` |
| `updateMany` | `collection`, `filter`, `update` | `{ matchedCount, modifiedCount }` |
| `deleteOne` | `collection`, `filter` | `{ deletedCount }` |
| `deleteMany` | `collection`, `filter` | `{ deletedCount }` |

### Result Formatting

Documents are flattened to row objects. Nested objects and arrays are JSON-stringified in cell values. The `fields` array is derived from the union of all keys across returned documents.

`QueryResult.affectedRows` is populated for write operations (`insertedCount`, `modifiedCount`, `deletedCount`).

### Error Handling

- Invalid JSON → `"Invalid query: expected JSON object — example: { \"collection\": \"users\", \"operation\": \"find\" }"`
- Missing `collection` → `"Query must specify a 'collection' field"`
- Unknown operation → `"Unknown operation '{op}'. Valid operations: find, findOne, aggregate, count, distinct, insertOne, insertMany, updateOne, updateMany, deleteOne, deleteMany"`
- MongoDB driver errors → pass through message

### Dependency

- `mongodb`

## 5. Redis Plugin

**Name:** `dbstudio-plugin-redis`

### Manifest

```json
{
  "name": "dbstudio-plugin-redis",
  "version": "1.0.0",
  "displayName": "Redis",
  "description": "Redis database driver",
  "main": "index.js",
  "contributes": {
    "drivers": [{ "id": "redis", "name": "Redis" }]
  }
}
```

### activate()

```typescript
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

### RedisAdapter

Implements `DbAdapter` by wrapping `ioredis`.

| Method | Implementation |
|--------|---------------|
| `connect()` | `new Redis({ host, port, password, db, tls })`. Wait for `'ready'` event. |
| `disconnect()` | `redis.disconnect()` |
| `query(str)` | Split input into lines. For each line: split into command + args, execute via `redis.call(cmd, ...args)`. Format each result. Return combined `QueryResult`. |
| `getTables()` | `SCAN 0 MATCH * COUNT 100` in a loop (cap at 1000 keys). Group by prefix before `:`. Each prefix = a "table". Keys without `:` grouped as `"(no prefix)"`. |
| `getColumns(table)` | Find first key matching `table:*`. `TYPE key`. For hash → `HKEYS`. For string → `["value"]`. For list → `["index", "value"]`. For set/zset → `["member"]`. |
| `getIndexes()` | Return `[]` — Redis has no indexes |
| `getSchemas()` / `getDatabases()` | Return `["0", "1", "2", ..., "15"]` |
| `switchDatabase(db)` | `redis.select(parseInt(db))` |
| `isConnected()` | `redis.status === 'ready'` |

### Query Format

Raw Redis commands, one per line:

```
GET user:1
HGETALL session:abc
KEYS user:*
SET foo bar EX 300
```

### Result Formatting

Each command produces a result. Results are combined into a single `QueryResult`:

| Redis result type | Row format |
|-------------------|------------|
| String/number (scalar) | `{ command, value }` |
| `null` | `{ command, value: "(nil)" }` |
| Array (e.g. KEYS) | One row per element: `{ index, value }` |
| Hash (HGETALL) | One row per field: `{ field, value }` |
| Multiple commands | Rows separated by a `{ command: "---", value: "---" }` delimiter row |

For single-command queries, omit the `command` column for cleaner output.

### Error Handling

- Empty command → skip
- Redis error (WRONGTYPE, etc.) → include in result as error row, don't abort remaining commands
- Connection errors → propagate as adapter errors

### Dependency

- `ioredis`

## 6. Renderer Changes

### 6.1 Connection Form — Dynamic DB Types

**File:** `src/renderer/src/components/connections/ConnectionForm.tsx`

Currently has hardcoded `DB_TYPES` array. Changes:

1. On mount, call `plugins:connection-fields` IPC to get plugin-contributed drivers
2. Merge plugin drivers into the type dropdown after the built-in types
3. When a plugin type is selected, render `connectionFields` from the plugin dynamically
4. Render middleware fields (SSH) in a collapsible section, filtered by `group`

Built-in types (pg/mysql/sqlite) keep their hardcoded field rendering — no regression.

### 6.2 Query Editor — Dynamic Language

**File:** `src/renderer/src/components/query/QueryEditor.tsx`

Currently hardcodes `defaultLanguage="sql"`. Changes:

1. Accept a `databaseType` prop from the parent
2. Map type to Monaco language:
   - `'mongodb'` → `'json'`
   - `'redis'` → `'plaintext'`
   - everything else → `'sql'`
3. When language is not `'sql'`, skip SQL completion provider registration

### 6.3 Extensions Panel — Status Update

**File:** `src/renderer/src/components/plugins/ExtensionsPanel.tsx`

Update `PluginInfo` interface from `active: boolean; error?: string` to use the new `status` object. Show colored status indicator:

- Green dot: `state === 'active'`
- Yellow dot: `state === 'degraded'`
- Red dot: `state === 'error'`
- Grey dot: `state === 'inactive'`

Show contributions list under description. Show error details when state is error/degraded.

### 6.4 New IPC Channels

```typescript
'plugins:connection-fields': {
  args: []
  return: { driverId: string; driverName: string; connectionFields: ConnectionFieldContribution[] }[]
}
'plugins:middleware-fields': {
  args: []
  return: ConnectionFieldContribution[]
}
```

These channels query the driver registry for registered drivers and their connection fields, and collect all middleware connection fields (SSH fields).

## 7. Boot Coordinator Changes

### Bundled Plugin Directory

`PluginBootCoordinator.boot()` scans two directories:

```typescript
async boot(): Promise<BootReport> {
  const userDir = this.getPluginDir()
  const bundledDir = this.getBundledPluginDir()
  this.discover([bundledDir, userDir])
  // ... rest unchanged
}

private getBundledPluginDir(): string {
  // In dev: path.join(__dirname, 'plugins/bundled')
  // In prod: path.join(process.resourcesPath, 'bundled-plugins')
  return app.isPackaged
    ? path.join(process.resourcesPath, 'bundled-plugins')
    : path.join(__dirname, 'plugins', 'bundled')
}
```

### Manifest `main` Resolution

Currently the boot coordinator does `require(path.join(plugin.path, plugin.manifest.main))`. For bundled plugins in the source tree, the `main` field points to `index.js` but the actual source is `index.ts`. In the dev build, electron-vite compiles TypeScript, so the coordinator loads the compiled output. The manifest `main` field should be `index.js` for consistency.

However, since bundled plugins live inside `src/main/` and are compiled by electron-vite as part of the main process bundle, the `require()` approach won't work directly. Instead, bundled plugins should be imported statically and registered manually in the boot coordinator, bypassing filesystem discovery for the bundled directory.

**Revised approach:** Add a `registerBundledPlugin(manifest, module)` method that injects a plugin directly into the coordinator without filesystem discovery:

```typescript
registerBundledPlugin(manifest: PluginManifest, module: { activate: Function; deactivate?: Function }): void {
  this.plugins.set(manifest.name, {
    manifest,
    path: '<bundled>',
    status: { state: 'validated' },
    module
  })
}
```

Then in `ipc-handlers.ts`, before calling `boot()`:

```typescript
import sshPlugin from './plugins/bundled/ssh-tunnel'
import mongoPlugin from './plugins/bundled/mongodb'
import redisPlugin from './plugins/bundled/redis'

pluginCoordinator.registerBundledPlugin(sshPlugin.manifest, sshPlugin)
pluginCoordinator.registerBundledPlugin(mongoPlugin.manifest, mongoPlugin)
pluginCoordinator.registerBundledPlugin(redisPlugin.manifest, redisPlugin)
```

This avoids filesystem/require complexity for bundled plugins while still exercising the same activation/verification pipeline.

## 8. Dependencies to Add

```json
{
  "dependencies": {
    "ssh2": "^1.16.0",
    "mongodb": "^6.12.0",
    "ioredis": "^5.4.0"
  },
  "devDependencies": {
    "@types/ssh2": "^1.15.0"
  }
}
```

## 9. Testing Strategy

| Test | What it validates |
|------|-------------------|
| `mongo-adapter.test.ts` | Query parsing, result formatting, error messages for invalid input (no real MongoDB needed — mock the `mongodb` client) |
| `redis-adapter.test.ts` | Command parsing, result formatting, multi-command handling (mock `ioredis`) |
| `ssh-tunnel.test.ts` | Middleware shouldApply logic, profile rewriting (mock `ssh2`) |
| `bundled-plugins.test.ts` | All 3 plugins activate successfully, register expected contributions, verify via coordinator |
