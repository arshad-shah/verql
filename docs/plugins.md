# Writing a plugin

Verql's main process is an **orchestrator**. The actual database logic,
import/export formats, type translation, UI panels, AI tools, and
connection middleware all come from **plugins**. Adding a new database or
feature should not require editing the main app.

This document covers:

1. [What a plugin looks like](#what-a-plugin-looks-like) — the
   manifest + activate function
2. [Plugin types](#plugin-types) — the contribution surfaces (driver,
   exporter, importer, type mapper, theme, panel, command, …) with worked
   examples
3. [Lifecycle](#plugin-lifecycle) — how plugins are discovered, validated,
   resolved, activated
4. [Where things live](#repository-layout) — directory and naming
   conventions for bundled plugins

For adding a new IPC channel after the contribution surface is built, see
[IPC channels](./ipc.md).

## What a plugin looks like

A plugin is a directory with two files at minimum:

```
my-plugin/
├── manifest.json     # what the plugin contributes (declarative)
└── index.ts          # activate(ctx) function (runtime wiring)
```

The manifest is purely declarative — it tells the orchestrator *what* the
plugin will provide. The `activate(ctx)` function is invoked once at boot
and is where the plugin *registers* those contributions through the SDK.

### Manifest

```json
{
  "name": "verql-plugin-cassandra",
  "version": "1.0.0",
  "displayName": "Cassandra",
  "description": "Apache Cassandra driver",
  "main": "index.js",
  "contributes": {
    "drivers": [{ "id": "cassandra", "name": "Cassandra" }],
    "exporters": [{ "id": "cql", "name": "CQL", "extension": "cql" }],
    "importers": [{ "id": "cql", "name": "CQL", "extensions": ["cql"] }]
  }
}
```

The `contributes` block tells the orchestrator what to expect. After
activation the orchestrator verifies that everything declared here was
actually registered through the SDK — if a plugin promises a `cassandra`
driver and `activate()` doesn't register one, the plugin ends up in
`'degraded'` state with a clear error.

Manifest validation rules:

- `name` matches `^[a-z0-9-]+$` and is unique
- `version` is valid semver
- `main` ends in `.js`
- `displayName` and `description` are non-empty

These are enforced for **every** plugin, including the bundled ones in
this repo (since the audit; see `tests/unit/plugin-boot.test.ts`).

### activate(ctx)

```ts
// my-plugin/index.ts
import type { PluginContext } from '@verql/plugin-sdk'
import { CassandraAdapter } from './cassandra-adapter'

export function activate(ctx: PluginContext): void {
  ctx.drivers.register('cassandra', {
    createAdapter: (config) => new CassandraAdapter(config),
    sqlDialect: undefined,           // not SQL — keep this undefined
    editorLanguage: 'cql',
    defaultSchemaCandidates: ['system'],
    connectionFields: [
      { key: 'contactPoints', label: 'Contact Points', type: 'text', required: true },
      { key: 'keyspace', label: 'Keyspace', type: 'text', required: true },
      { key: 'username', label: 'Username', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' }
    ],
    getTableData: async (adapter, table, keyspace) => {
      const result = await adapter.query(/* safely-escaped CQL */)
      return { rows: result.rows, columns: /* … */ [] }
    }
  })
}

export function deactivate(): void {
  // Optional. The SDK already tears down subscriptions tracked through
  // ctx.* registries. Use this for anything else (timers, sockets, …).
}
```

`ctx` is a sandboxed view of the orchestrator. Everything a plugin can do
goes through one of its sub-registries:

| `ctx.X` | What it lets the plugin do |
|---------|----------------------------|
| `drivers` | Register a database driver (see [Driver](#1-driver)) |
| `drivers.registerConnectionMiddleware` | Pre-/post-connect hooks (e.g. SSH tunnel) |
| `commands` | Register a command palette entry |
| `panels` | Register a UI panel slot |
| `ui` | Register declarative widgets (status-bar items, toolbar selectors, slot resolvers) |
| `completions` | Contribute autocomplete items to the query editor |
| `exporters` | Register an export format (CSV, JSON, SQL DDL, …) |
| `importers` | Register an import format |
| `typeMappers` | Translate column types between dialects |
| `ai` | Provide AI tools, providers, or context |
| `services` | Provide / consume named cross-plugin services |
| `settings` | Read & subscribe to plugin-scoped settings |
| `schema` | Read introspected schema for a connection |
| `connections` | Read active connection profile / run queries on it |
| `keyring` | Read/write secrets in the OS keyring |
| `ipc` | Own typed IPC channels (only if your plugin needs renderer↔plugin RPC outside the SDK) |
| `broadcast` | Push events to the renderer |

Disposable returns. Every `ctx.X.register(...)` returns a `Disposable` and
is automatically tracked under `ctx.subscriptions`. When the plugin is
deactivated, those subscriptions are disposed in LIFO order — so the
plugin doesn't have to manage cleanup explicitly.

## Plugin types

This section is the **menu** of contribution surfaces. Each shows the
manifest declaration, the `activate()` registration call, and where in
this repo to find a worked example.

### 1. Driver

A driver makes a new database type available. It must implement the
`DbAdapter` interface (`src/main/db/adapter.ts`).

**Manifest**

```json
"contributes": {
  "drivers": [{ "id": "cassandra", "name": "Cassandra" }]
}
```

**Activation**

```ts
ctx.drivers.register('cassandra', {
  createAdapter: (config) => new CassandraAdapter(config),
  connectionFields: [...],
  // Optional but recommended:
  sqlDialect: 'postgresql' | 'mysql' | 'sqlite' | 'snowflake',
  editorLanguage: 'cql',                // Monaco language id
  defaultSchemaCandidates: ['system'],  // renderer picks first match
  defaultSchemaUseConnectionDatabase: false,
  sampleQuery: (table) => `SELECT * FROM ${table} LIMIT 100;`,
  getTableData: async (adapter, table, schema) => { ... }
})
```

Look at any of the bundled drivers for a full example:
[postgresql](../src/main/plugins/bundled/postgresql/index.ts),
[mysql](../src/main/plugins/bundled/mysql/index.ts),
[sqlite](../src/main/plugins/bundled/sqlite/index.ts),
[snowflake](../src/main/plugins/bundled/snowflake/index.ts),
[mongodb](../src/main/plugins/bundled/mongodb/index.ts),
[redis](../src/main/plugins/bundled/redis/index.ts).

The orchestrator never branches on driver type. If you need behaviour the
existing capability flags don't cover, **add a flag to `DriverFactory`**
(in `src/main/plugins/sdk/types.ts`) rather than adding a special case in
the main app or the renderer.

### 2. Exporter

Lets the user save table or query data in a new file format.

**Manifest**

```json
"contributes": {
  "exporters": [{ "id": "parquet", "name": "Parquet", "extension": "parquet" }]
}
```

**Activation**

```ts
ctx.exporters.register('parquet', {
  format: 'parquet',
  extension: 'parquet',
  displayName: 'Parquet',
  appliesTo: (connectionType) => connectionType === 'cassandra', // optional
  execute(rows, columns, options) {
    return serializeParquet(rows, columns)  // string | Buffer
  }
})
```

The `appliesTo` predicate lets you restrict the exporter to connections of
a specific type. Omit it for neutral formats (CSV, JSON, Parquet).

Worked examples:
[core-formats](../src/main/plugins/bundled/core-formats/index.ts) (CSV/JSON),
[postgresql/sql-format.ts](../src/main/plugins/bundled/postgresql/sql-format.ts),
[mongodb/data-format.ts](../src/main/plugins/bundled/mongodb/data-format.ts).

### 3. Importer

The mirror of an exporter — bring data in from a file.

**Manifest**

```json
"contributes": {
  "importers": [{ "id": "parquet", "name": "Parquet", "extensions": ["parquet"] }]
}
```

**Activation**

```ts
ctx.importers.register('parquet', {
  format: 'parquet',
  extensions: ['parquet'],
  displayName: 'Parquet',
  appliesTo: (t) => t === 'cassandra',
  // When the importer drives execution itself (e.g. SQL scripts), set this:
  driverExecutes: false,
  parse(content, options) {
    return { rows: deserializeParquet(content), columns: ['id', 'name'] }
  }
})
```

If `driverExecutes` is `true`, the IPC layer calls `parse()` with
`options.adapter` set and skips the default bulk-insert pass — useful for
SQL scripts that need to be executed statement-by-statement.

### 4. Type mapper

Translate a column type from one dialect to another during migration.
Drivers register what they know about translating into / out of their
own dialect — the orchestrator has no hardcoded translation table.

**Activation**

```ts
ctx.typeMappers.register('postgresql', 'cassandra', {
  'integer': { target: 'int', lossy: false },
  'text': { target: 'text', lossy: false },
  'jsonb': { target: 'text', lossy: true, note: 'Stored as text' }
}, /* optional fallback */ (normalizedSource) => {
  return { target: 'text', lossy: true, note: 'Unmapped' }
})
```

`from` is the source dialect name (e.g. `'postgresql'`), `to` is the
target. The table looks up the lowercased source type. The fallback runs
when nothing in the table matches.

Worked examples (each ships its own `type-maps.ts`):
[postgresql](../src/main/plugins/bundled/postgresql/type-maps.ts),
[mysql](../src/main/plugins/bundled/mysql/type-maps.ts),
[sqlite](../src/main/plugins/bundled/sqlite/type-maps.ts).

### 5. Connection middleware

Wrap the connect/disconnect lifecycle for a particular configuration —
e.g. open an SSH tunnel before connecting and tear it down afterwards.

**Manifest**

```json
"contributes": {
  "connectionMiddleware": [{ "id": "ssh-tunnel" }],
  "connectionFields": [
    { "key": "sshHost", "label": "SSH Host", "type": "text", "group": "SSH Tunnel" },
    { "key": "sshUser", "label": "SSH User", "type": "text", "group": "SSH Tunnel" }
  ]
}
```

**Activation**

```ts
ctx.drivers.registerConnectionMiddleware('ssh-tunnel', {
  shouldApply(profile) { return !!profile.sshHost },
  async beforeConnect(profile) {
    const localPort = await openTunnel(profile)
    return { ...profile, host: '127.0.0.1', port: localPort }
  },
  async onDisconnect(profileId) { await closeTunnel(profileId) }
})
```

Worked example: [ssh-tunnel](../src/main/plugins/bundled/ssh-tunnel/index.ts).

### 6. Completion provider

Contribute autocomplete items (keywords, functions, table/column names)
to the Monaco editor for a particular connection.

**Activation**

```ts
ctx.completions.register(async (connectionId, context) => {
  const items: CompletionItem[] = []
  for (const kw of MY_DIALECT_KEYWORDS) {
    items.push({ label: kw, kind: 'keyword', sortText: '3' })
  }
  return items
})
```

Worked examples: every relational driver plugin contributes its own
completion provider. See [postgresql/index.ts](../src/main/plugins/bundled/postgresql/index.ts).

### 7. Theme

Themes are *raw token overrides*, layered on top of the design system's
semantic tokens.

**Manifest**

```json
"contributes": {
  "themes": [{ "id": "solarized-dark", "name": "Solarized Dark", "base": "dark" }]
}
```

**Activation**

The plugin contributes a token dictionary via the theme registry (see
`src/renderer/src/primitives/theme/`). The renderer applies it by setting
`data-theme=<id>` on the document root.

### 8. Panel (UI surface)

Add a panel into the primary or secondary sidebar, the bottom dock, or a
plugin-defined slot.

**Manifest**

```json
"contributes": {
  "panels": [
    { "id": "snowflake-context", "location": "secondary", "title": "Snowflake" }
  ]
}
```

**Activation**

```ts
ctx.panels.register('snowflake-context', {
  // a renderer component path (plugin UI is React) or a contribution-id
  // that pairs with a renderer-side mounted component
})
```

Or, for purely declarative UI (no React component bundle), use
`ctx.ui.registerToolbar` / `registerStatusBar` / `registerSlot` /
`registerResolver` to compose widgets out of primitives like buttons,
selectors, and labels. See [snowflake/index.ts](../src/main/plugins/bundled/snowflake/index.ts)
for the role/warehouse selectors driven entirely through declarative UI.

### 9. Command

Register a command palette entry.

**Manifest**

```json
"contributes": {
  "commands": [{ "id": "format-sql", "title": "Format SQL", "keybinding": "Cmd+Shift+F" }]
}
```

**Activation**

```ts
ctx.commands.register('format-sql', async () => {
  /* implementation */
})
```

The orchestrator prepends the plugin name to the command id, so the
palette ends up running `verql-plugin-foo:format-sql`.

### 10. AI provider / tool

Plugins can register additional AI providers (alongside OpenAI, Anthropic,
Ollama) or new AI tools (alongside the built-in `schema_list_tables`,
`query_execute`, …).

**Activation**

```ts
ctx.ai.registerProvider({
  id: 'mistral',
  name: 'Mistral',
  supportsToolCalling: true,
  async models() { … },
  async *chat(request) { … }
})

ctx.ai.registerTool({
  id: 'count_rows',
  name: 'Count Rows',
  description: 'Count rows in a table',
  parameters: { type: 'object', properties: { table: { type: 'string' } } },
  permission: 'read',
  async execute(params, ctx) { … }
})
```

The MongoDB and Redis bundled plugins both register an AI **context
provider** so Claude knows how to format queries for those connections.

### 11. Setting

A plugin can declare settings that appear in the app's Settings panel
under any category it likes.

**Manifest**

```json
"contributes": {
  "settings": [
    {
      "key": "queryTimeoutMs",
      "title": "Query timeout (ms)",
      "type": "number",
      "default": 30000,
      "category": "performance"
    }
  ]
}
```

Settings are scoped per-plugin (`plugins.<name>.queryTimeoutMs`) and
accessed via `ctx.settings.get('queryTimeoutMs')`.

## Plugin lifecycle

The boot coordinator runs every plugin through a five-phase pipeline.

| Phase | What happens | Failure mode |
|-------|-------------|--------------|
| **Discover** | Scan plugin directories, read manifests, register bundled plugins | `'error'`, phase `discover` |
| **Validate** | Run `validateManifest()` — name, version, main, contributes | `'error'`, phase `validate` |
| **Resolve** | Hold for dependency resolution (currently a passthrough) | `'error'`, phase `resolve` |
| **Activate** | Call `module.activate(ctx)` with a 10s timeout | `'error'`, phase `activate` |
| **Verify** | Compare actual registrations against manifest's `contributes` | `'degraded'` (kept running with whatever it did register) |

After verification each plugin is in one of these states:

- `'active'` — everything declared in the manifest was registered
- `'degraded'` — some contributions are missing; the rest still work
- `'error'` — the phase listed in `error.phase` failed
- `'inactive'` — user-disabled

Activation errors are caught by `safeCall()` (10s timeout) so a stuck
plugin cannot wedge the boot. An `ErrorBudget` opens / closes around
each plugin and auto-disables one that throws repeatedly at runtime
(default: 5 errors in a 60s window).

## Repository layout

Bundled plugins live under `src/main/plugins/bundled/`. The naming
convention is:

```
src/main/plugins/bundled/<plugin-id>/
├── index.ts         # manifest export + activate()
├── *-adapter.ts     # DbAdapter implementation (for driver plugins)
├── sql-format.ts    # exporter/importer (for SQL drivers)
├── data-format.ts   # exporter/importer (for non-SQL drivers)
└── type-maps.ts     # type translation tables (for SQL drivers)
```

To **add a new bundled plugin**:

1. Create the directory under `src/main/plugins/bundled/<your-id>/`
2. Export `manifest` and `activate` from `index.ts`
3. Register it in [`src/main/ipc-handlers.ts`](../src/main/ipc-handlers.ts)
   via `pluginCoordinator.registerBundledPlugin(yourPlugin.manifest, yourPlugin)`.
   Order matters when one plugin consumes another's `service` — register
   producers first (the AI plugin is registered first because mongo/redis
   plugins consume its `ai` service at activate time).
4. Write tests under `tests/unit/`. The pattern is in
   `tests/unit/bundled-plugins.test.ts` (single plugin) and
   `tests/unit/export-import-plugin-driven.test.ts` (cross-plugin).

To **add an external plugin** (third-party, installed by the user at
runtime), package the directory as a zip and use the Plugins panel inside
Verql → Install from Zip. The same `manifest.json` + compiled `index.js`
applies.

## When to add a new contribution surface

If you find yourself reaching for `process.platform === 'darwin'`,
`profile.type === 'postgresql'`, or similar branching inside the main app
or the renderer — **stop**. That's a sign you should be adding a new
`DriverFactory` flag (data-driven, like `defaultSchemaCandidates`) or a
new registry on `PluginContext`. The orchestrator stays generic; the
plugin owns the knowledge.

There's a regression test (`tests/unit/export-import-no-hardcoding.test.ts`)
that fails the build if anyone reintroduces this pattern in the
core IPC handlers or renderer hot paths.
