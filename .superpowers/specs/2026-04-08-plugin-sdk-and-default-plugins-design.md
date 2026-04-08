# Plugin SDK & Default Plugins — Design Spec

Extends the existing plugin host with a typed SDK and ships three bundled plugins: SSH Tunnels, AI Chat (Claude), and NoSQL (MongoDB + Redis).

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| SDK pattern | Extension points registry | Typed, discoverable, incremental — build only what the 3 plugins need |
| AI provider | Claude API (key-based) | Best SQL generation quality, clean interface for future providers |
| AI capabilities | Schema-aware chat (no execution) | Sweet spot — generate-only is too limited, agent execution adds safety complexity |
| SSH approach | Connection middleware | Not a new driver — wraps any existing driver transparently |
| NoSQL query format | String-based (JSON for Mongo, commands for Redis) | Keeps DbAdapter interface unchanged, results grid works as-is |
| Bundled plugins | Copied to userData on first launch | Appear in Extensions panel, can be deactivated, auto-update with app |

## 1. Plugin SDK Core

### PluginContext

Every plugin's `activate()` receives a typed context object:

```typescript
interface PluginContext {
  drivers: DriverRegistry
  commands: CommandRegistry
  panels: PanelRegistry
  schema: SchemaAccess
  connections: ConnectionAccess
  settings: PluginSettings
  subscriptions: Disposable[]
}

interface Disposable {
  dispose(): void
}
```

### Lifecycle

1. Plugin host loads manifest from `plugin-manifest.json` or `package.json`
2. Validates manifest schema and resolves `main` entry point
3. Calls `activate(context: PluginContext)` — plugin registers contributions
4. Post-activation verification: checks declared contributions were actually registered
5. On shutdown or deactivate: calls `deactivate()`, then auto-disposes `context.subscriptions`

### File location

SDK types and implementation live in `src/main/plugins/sdk/`:

```
src/main/plugins/
├── types.ts              # existing manifest types (extended)
├── plugin-host.ts        # existing loader (extended)
└── sdk/
    ├── index.ts           # PluginContext factory
    ├── driver-registry.ts
    ├── command-registry.ts
    ├── panel-registry.ts
    ├── schema-access.ts
    ├── connection-access.ts
    ├── safe-call.ts       # runtime error wrapper
    └── types.ts           # SDK public types
```

## 2. Registries

### 2.1 DriverRegistry

```typescript
interface DriverRegistry {
  register(id: string, factory: DriverFactory): Disposable
  registerConnectionMiddleware(id: string, middleware: ConnectionMiddleware): Disposable
}

interface DriverFactory {
  createAdapter(config: Record<string, unknown>): DbAdapter
  connectionFields: ConnectionField[]
}

interface ConnectionField {
  key: string
  label: string
  type: 'text' | 'password' | 'number' | 'boolean' | 'file'
  required?: boolean
  default?: string | number | boolean
  group?: string  // renders fields under a collapsible section
}

interface ConnectionMiddleware {
  shouldApply(profile: ConnectionProfile): boolean
  beforeConnect(profile: ConnectionProfile): Promise<ConnectionProfile>
  onDisconnect(profileId: string): Promise<void>
}
```

- Driver plugins (MongoDB, Redis) call `register()` to add a new database type
- SSH plugin calls `registerConnectionMiddleware()` to wrap any connection
- `connectionFields` drives dynamic form rendering — no hardcoded forms per DB type
- The existing `createAdapter()` in `factory.ts` checks the driver registry for unknown types before throwing

### 2.2 CommandRegistry

```typescript
interface CommandRegistry {
  register(id: string, handler: CommandHandler): Disposable
}

type CommandHandler = () => void | Promise<void>
```

- Commands appear in the command palette (`Cmd+Shift+P`)
- Plugins declare commands in manifest `contributes.commands` with `id`, `title`, optional `keybinding`
- Handler runs in main process

### 2.3 PanelRegistry

```typescript
interface PanelRegistry {
  register(id: string, panel: PanelContribution): Disposable
}

interface PanelContribution {
  title: string
  icon: string           // lucide icon name
  location: 'sidebar' | 'bottom'
  render(): string       // HTML string or path to bundled HTML file
}
```

- Panel content renders in a sandboxed iframe in the renderer
- SDK provides a message bridge between the iframe and the main process via `postMessage`:
  - Iframe → Main: `window.parent.postMessage({ pluginId, type, payload })` → routed to plugin's message handler
  - Main → Iframe: plugin calls `panel.postMessage(payload)` → arrives as `message` event in iframe
  - This is how the AI chat panel sends user messages and receives streamed responses
- AI chat plugin registers a sidebar panel

### 2.4 SchemaAccess (read-only)

```typescript
interface SchemaAccess {
  getTables(connectionId: string, schema?: string): Promise<SchemaTable[]>
  getColumns(connectionId: string, table: string, schema?: string): Promise<SchemaColumn[]>
  getIndexes(connectionId: string, table: string, schema?: string): Promise<SchemaIndex[]>
  getSchemas(connectionId: string): Promise<string[]>
  getDatabases(connectionId: string): Promise<string[]>
  getSchemaSummary(connectionId: string, schema?: string): Promise<SchemaSummary>
}

interface SchemaSummary {
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
```

- Delegates to existing adapter methods on the active connection
- `getSchemaSummary()` builds a compact representation for AI prompt context
- All calls go through the `safeCall` wrapper

### 2.5 ConnectionAccess (read-only + query)

```typescript
interface ConnectionAccess {
  getActiveConnectionId(): string | null
  getProfile(connectionId: string): ConnectionProfile | null
  query(connectionId: string, sql: string, params?: unknown[]): Promise<QueryResult>
  onActiveConnectionChanged(listener: (id: string | null) => void): Disposable
}
```

- Plugins can run queries through existing connections
- Cannot modify connection profiles
- `onActiveConnectionChanged` lets the AI plugin refresh schema context when the user switches connections

## 3. Plugin Validation & Runtime Safety

### Load-time validation

1. **Manifest validation** — required fields exist and types are correct. Reject with specific error message if not.
2. **Entry point validation** — `main` file exists and exports an `activate` function. Error: `"Missing activate() export"`.
3. **Post-activation verification** — after `activate()` returns, SDK checks that declared contributions were registered:
   - Manifest says `"drivers": [{ "id": "mongodb" }]` → check `drivers.has("mongodb")`
   - Manifest says `"commands": [{ "id": "ssh:manage-tunnels" }]` → check `commands.has("ssh:manage-tunnels")`
   - Mismatches logged as warnings

### Plugin status

```typescript
type PluginStatus =
  | { state: 'active'; contributions: string[] }
  | { state: 'error'; error: string }
  | { state: 'inactive' }
  | { state: 'degraded'; error: string; contributions: string[] }
```

### Runtime safety

**Safe call wrapper** — all plugin code runs through:
```typescript
async function safeCall<T>(pluginName: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    pluginErrors.record(pluginName, err)
    throw new PluginError(pluginName, err)
  }
}
```

**Error budget** — if a plugin throws more than 5 errors in 60 seconds, auto-deactivate it. Toast: "{Plugin} disabled due to repeated errors. Re-enable in Extensions."

**Timeout enforcement** — plugin adapter calls (`query`, `connect`, `getTables` etc.) get a configurable timeout (default 30s). Hangs reject with timeout error.

**Adapter health checks:**
```typescript
interface DbAdapter {
  // ...existing
  ping?(): Promise<boolean>
}
```
Connection manager calls `ping()` every 30s on active connections from plugin-contributed drivers. 3 consecutive failures → mark connection stale, notify user.

**Resource cleanup** — on deactivate, force-dispose everything in `context.subscriptions`. Tracks open SSH tunnels, connections per plugin.

**Plugin error log** — queryable from Extensions panel. Click a plugin → see recent errors with timestamps and stack traces.

### Startup log

```
[plugins] Loaded 3 bundled plugins
[plugins] ✓ dbstudio-ssh: active (1 middleware, 1 command)
[plugins] ✓ dbstudio-ai: active (1 panel, 2 commands)
[plugins] ✓ dbstudio-mongodb: active (1 driver)
[plugins] ✗ dbstudio-redis: error — ioredis not found
```

## 4. SSH Tunnel Plugin

**Name:** `dbstudio-plugin-ssh`

### Approach

Not a new driver. Registers connection middleware that intercepts any connection with SSH fields set.

### Manifest

```json
{
  "name": "dbstudio-plugin-ssh",
  "version": "1.0.0",
  "displayName": "SSH Tunnels",
  "description": "SSH tunnel support for database connections",
  "main": "dist/index.js",
  "contributes": {
    "commands": [{ "id": "ssh:manage-tunnels", "title": "Manage SSH Tunnels" }],
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

1. `shouldApply(profile)` — returns `true` if `profile.sshHost` is set
2. `beforeConnect(profile)` — uses `ssh2` to open tunnel, forwards a random local port to remote `host:port`, returns modified profile with `host: '127.0.0.1', port: localPort`
3. `onDisconnect(profileId)` — tears down the tunnel, frees the port
4. Tracks active tunnels in a `Map<string, ssh2.Client>`

### Dependencies

- `ssh2` — SSH client for Node.js

### Connection form

SSH fields render in a collapsible "SSH Tunnel" section in the connection form. The `group: "ssh"` field in `connectionFields` tells the form renderer to group them.

## 5. AI Chat Plugin

**Name:** `dbstudio-plugin-ai`

### Architecture

```
Renderer (sidebar iframe)           Main Process (plugin)
┌─────────────────────┐            ┌──────────────────────┐
│  Chat UI             │───IPC────▶│  AI Plugin            │
│  - message list      │            │  - builds prompt      │
│  - input box         │            │  - injects schema ctx │
│  - "Insert to editor"│◀──IPC────│  - calls Claude API   │
│  - "Copy SQL" btn    │            │  - streams response   │
└─────────────────────┘            └──────────────────────┘
```

### Prompt construction

1. **System prompt:** "You are a SQL assistant for a {dbType} database. Generate valid {dialect} SQL. When generating SQL, wrap it in ```sql code blocks."
2. **Schema context:** `sdk.schema.getSchemaSummary()` — compact representation of tables, columns, types, PKs, FKs, relationships
3. **User message:** natural language question
4. **Conversation history:** last N turns for multi-turn context

### Panel features

- Message list with markdown rendering, SQL blocks get syntax highlighting
- Generated SQL has "Insert to Editor" button (sends SQL to active query tab) and "Copy" button
- "Explain this query" — user pastes SQL, AI explains it
- "Optimize" — AI suggests index additions, query rewrites
- Schema auto-refreshes when active connection changes via `sdk.connections.onActiveConnectionChanged()`
- Detects driver type for NoSQL connections — adjusts prompt to "Generate MongoDB queries" instead of SQL

### Settings

| Key | Default | Description |
|-----|---------|-------------|
| `ai.apiKey` | (none) | Anthropic API key |
| `ai.model` | `claude-sonnet-4-20250514` | Model to use |
| `ai.maxSchemaTokens` | 4000 | Cap on schema context size |

Settings stored in app config. `PluginContext` includes a `settings` accessor:

```typescript
interface PluginSettings {
  get<T>(key: string): T | undefined
  set(key: string, value: unknown): void
  onChanged(key: string, listener: (value: unknown) => void): Disposable
}
```

Added to `PluginContext` as `settings: PluginSettings`. Scoped per-plugin — `get("apiKey")` reads `plugins.dbstudio-plugin-ai.apiKey` from the config store.

### Manifest

```json
{
  "name": "dbstudio-plugin-ai",
  "version": "1.0.0",
  "displayName": "AI Assistant",
  "description": "Schema-aware AI chat powered by Claude",
  "main": "dist/index.js",
  "contributes": {
    "commands": [
      { "id": "ai:open-chat", "title": "Open AI Chat" },
      { "id": "ai:explain-query", "title": "Explain Current Query" }
    ],
    "panels": [
      { "id": "ai-chat", "title": "AI Chat", "icon": "sparkles", "location": "sidebar" }
    ],
    "settings": [
      { "key": "ai.apiKey", "title": "API Key", "type": "password" },
      { "key": "ai.model", "title": "Model", "type": "text", "default": "claude-sonnet-4-20250514" }
    ]
  }
}
```

### Dependencies

- `@anthropic-ai/sdk` — Claude API client

### Safety

AI generates SQL but never executes it. User must explicitly run generated queries. No query execution by the AI.

## 6. MongoDB Plugin

**Name:** `dbstudio-plugin-mongodb`

### Driver registration

Registers driver `"mongodb"` with `sdk.drivers.register()`.

### Connection fields

```typescript
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
```

### DbAdapter mapping

| Method | MongoDB implementation |
|--------|----------------------|
| `connect()` | `MongoClient.connect()` |
| `disconnect()` | `client.close()` |
| `query(str)` | Parse JSON query: `{ collection, operation, filter, limit }`. Execute via collection methods. Return documents as rows. |
| `getTables(schema)` | `db.listCollections()` — collections = tables |
| `getColumns(table)` | Sample first 100 docs, merge all keys to infer schema |
| `getIndexes(table)` | `collection.indexes()` |
| `getSchemas()` | `adminDb.listDatabases()` |
| `getDatabases()` | Same as `getSchemas()` |
| `switchDatabase(db)` | Switch the `Db` reference |
| `ping()` | `db.command({ ping: 1 })` |

### Query format

Since MongoDB isn't SQL, the query editor switches to JSON mode when connected to MongoDB. Query format:

```json
{ "collection": "users", "operation": "find", "filter": { "age": { "$gt": 25 } }, "limit": 50 }
```

Supported operations: `find`, `findOne`, `aggregate`, `count`, `distinct`, `insertOne`, `insertMany`, `updateOne`, `updateMany`, `deleteOne`, `deleteMany`.

### Dependencies

- `mongodb` — official MongoDB driver

## 7. Redis Plugin

**Name:** `dbstudio-plugin-redis`

### Driver registration

Registers driver `"redis"` with `sdk.drivers.register()`.

### Connection fields

```typescript
connectionFields: [
  { key: 'host', label: 'Host', type: 'text', required: true, default: 'localhost' },
  { key: 'port', label: 'Port', type: 'number', required: true, default: 6379 },
  { key: 'password', label: 'Password', type: 'password' },
  { key: 'database', label: 'Database (0-15)', type: 'number', default: 0 },
  { key: 'ssl', label: 'SSL', type: 'boolean', default: false }
]
```

### DbAdapter mapping

| Method | Redis implementation |
|--------|---------------------|
| `connect()` | `new Redis(config)` |
| `disconnect()` | `redis.disconnect()` |
| `query(str)` | Parse Redis command text: `GET user:1`, `HGETALL session:abc`. Execute via ioredis. Format result as rows. |
| `getTables()` | `SCAN` with pattern `*`, group by key prefix (e.g., `user:*` → "user") |
| `getColumns(table)` | Inspect key type (`TYPE key`), then `HKEYS` for hashes, range info for sorted sets |
| `getIndexes()` | Empty — Redis has no traditional indexes |
| `getSchemas()` | Databases 0-15 |
| `getDatabases()` | Same as `getSchemas()` |
| `switchDatabase(db)` | `redis.select(dbNumber)` |
| `ping()` | `redis.ping()` |

### Query format

Editor switches to a custom Redis language mode. User types raw Redis commands:

```
GET user:1
HGETALL session:abc
KEYS user:*
SET foo bar EX 300
```

Multi-line: each line is a separate command. Results displayed per-command.

### Dependencies

- `ioredis` — Redis client for Node.js

## 8. Bundled Plugin Loading

### Directory structure

```
resources/
└── bundled-plugins/
    ├── dbstudio-plugin-ssh/
    │   ├── plugin-manifest.json
    │   └── dist/index.js
    ├── dbstudio-plugin-ai/
    │   ├── plugin-manifest.json
    │   └── dist/index.js
    ├── dbstudio-plugin-mongodb/
    │   ├── plugin-manifest.json
    │   └── dist/index.js
    └── dbstudio-plugin-redis/
        ├── plugin-manifest.json
        └── dist/index.js
```

### Loading sequence

1. On app start, scan `resources/bundled-plugins/`
2. For each bundled plugin, check if it exists in `userData/plugins/`:
   - Not present → copy it, mark as `firstInstall: true`
   - Present but older version → overwrite, preserve user settings
   - Present and same/newer version → skip
3. Load all plugins from `userData/plugins/`
4. Auto-activate any plugin with `firstInstall: true`
5. Build `PluginContext` for each active plugin
6. Call `activate(context)` on each
7. Run post-activation verification
8. Log startup summary

## 9. Renderer Integration

### Dynamic connection form

The connection form currently hardcodes fields for PostgreSQL/MySQL/SQLite. With the SDK:

1. When user selects a database type, the form renders `connectionFields` from:
   - Built-in types (pg, mysql, sqlite) — hardcoded fields as today
   - Plugin-contributed drivers — fields from `DriverFactory.connectionFields`
2. Connection middleware fields (SSH) render in a collapsible section below, grouped by `group` field
3. The `DatabaseType` union type extends with plugin driver IDs

### Editor language mode

When connected to a plugin-contributed driver:
- MongoDB → Monaco language `json`
- Redis → Monaco language `plaintext` (or custom `redis` if we register one)
- SQL databases → Monaco language `sql` (as today)

The `QueryEditor` reads the driver type from the connection profile and switches accordingly.

### Extensions panel enhancements

Current panel shows name/version/description. Enhanced to show:
- Plugin status: green dot (active), red (error), yellow (degraded), grey (inactive)
- Contributions list: "1 driver, 2 commands" under the description
- Error details: expandable error log per plugin
- Runtime stats: error count, last error time

## 10. Changes to Existing Code

### `DatabaseType` extension

```typescript
// shared/types.ts — before
export type DatabaseType = 'postgresql' | 'mysql' | 'sqlite'

// after — plugin types are strings, validated at runtime
export type DatabaseType = 'postgresql' | 'mysql' | 'sqlite' | (string & {})
```

The `(string & {})` pattern allows any string while preserving autocomplete for known types.

### `createAdapter()` in factory.ts

```typescript
export function createAdapter(profile: ConnectionProfile): DbAdapter {
  switch (profile.type) {
    case 'sqlite': return new SqliteAdapter(profile.database)
    case 'postgresql': return new PostgresAdapter(...)
    case 'mysql': return new MysqlAdapter(...)
    default:
      // Check plugin driver registry
      const factory = driverRegistry.get(profile.type)
      if (factory) return factory.createAdapter(profile as Record<string, unknown>)
      throw new Error(`Unsupported database type: ${profile.type}`)
  }
}
```

### Connection middleware integration

In `ipc-handlers.ts`, the `db:connect` handler runs middleware:

```typescript
handle('db:connect', async (profileId) => {
  let profile = configStore.getConnection(profileId)
  // Run connection middleware
  for (const mw of connectionMiddlewares) {
    if (mw.shouldApply(profile)) {
      profile = await mw.beforeConnect(profile)
    }
  }
  const adapter = createAdapter(profile)
  await adapter.connect()
  activeAdapters.set(profileId, adapter)
})
```

### Plugin manifest types extension

```typescript
// src/main/plugins/types.ts — add to PluginManifest.contributes
contributes: {
  drivers?: DriverContribution[]
  themes?: ThemeContribution[]
  commands?: CommandContribution[]
  exporters?: ExporterContribution[]
  importers?: ImporterContribution[]
  connectionMiddleware?: { id: string }[]          // NEW
  connectionFields?: ConnectionFieldContribution[]  // NEW
  panels?: PanelContribution[]                      // NEW
  settings?: SettingContribution[]                   // NEW
}

interface ConnectionFieldContribution {
  key: string
  label: string
  type: 'text' | 'password' | 'number' | 'boolean' | 'file'
  required?: boolean
  default?: string | number | boolean
  group?: string
}

interface SettingContribution {
  key: string
  title: string
  type: 'text' | 'password' | 'number' | 'boolean'
  default?: string | number | boolean
}
```
