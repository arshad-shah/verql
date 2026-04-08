# Plugin SDK Core — Design Spec

Production-grade plugin SDK infrastructure with a VSCode-style boot sequence, typed registries, runtime safety, and error budgets. Bundled plugins are deferred — this spec covers the core system only.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | SDK layer on top of existing plugin-host | Low risk — existing loader works, extend don't rewrite |
| Boot model | 5-phase boot coordinator | Deterministic phases, per-plugin error boundaries, no cascading failures |
| Registry pattern | One class per extension point | Independently testable, clear ownership |
| Error strategy | safeCall wrapper + error budget | Prevents one plugin from crashing the app |
| Context scoping | Per-plugin PluginContext instances | Isolated subscriptions, auto-cleanup on deactivate |
| Plugin naming | `^[a-z0-9-]+$` | Filesystem-safe, consistent, no conflicts |

## 1. Boot Sequence

Five distinct phases. Each plugin progresses independently — a failure in one plugin doesn't block others.

### Phases

```
Phase 1: DISCOVER    — scan directories, parse manifests
Phase 2: VALIDATE    — check manifest schema, entry point exists, exports activate()
Phase 3: RESOLVE     — dependency ordering (future-proofing, no-op for now)
Phase 4: ACTIVATE    — call activate(context), enforce 10s timeout
Phase 5: VERIFY      — check declared contributions were actually registered
```

### Plugin Status Machine

Each plugin transitions through states:

```
discovered → validated → resolved → activating → active
                                              ↘ error
                                              ↘ degraded (partial contributions)
```

```typescript
type PluginPhase = 'discover' | 'validate' | 'resolve' | 'activate' | 'verify' | 'runtime'

type PluginStatus =
  | { state: 'discovered' }
  | { state: 'validated' }
  | { state: 'resolved' }
  | { state: 'activating' }
  | { state: 'active'; contributions: string[] }
  | { state: 'error'; error: string; phase: PluginPhase }
  | { state: 'degraded'; error: string; contributions: string[] }
  | { state: 'inactive' }
```

### Error Handling Per Phase

| Phase | Failure | Behavior |
|-------|---------|----------|
| Discover | Corrupt JSON, unreadable dir | Log, skip plugin, status = error(discover) |
| Validate | Missing required fields, no `main` file, no `activate` export | Status = error(validate), specific message e.g. `"Missing activate() export in dist/index.js"` |
| Resolve | (future: circular deps) | Status = error(resolve) |
| Activate | Plugin throws during `activate()`, exceeds 10s timeout | Status = error(activate), cleanup any partial registrations |
| Verify | Declared contributions not registered | Status = degraded (still runs, but warns) |
| Runtime | safeCall catches errors post-activation | Error budget: 5 errors in 60s → auto-deactivate, status = error(runtime) |

### PluginBootCoordinator

```typescript
class PluginBootCoordinator {
  // Phase 1 — scan plugin directories, parse manifests
  discover(dirs: string[]): DiscoveredPlugin[]

  // Phase 2 — validate manifest schema and entry point
  validate(plugin: DiscoveredPlugin): ValidationResult

  // Phase 3 — dependency ordering (no-op for now)
  resolve(plugins: ValidatedPlugin[]): ResolvedPlugin[]

  // Phase 4 — create context, call activate(), enforce timeout
  activate(plugin: ResolvedPlugin, context: PluginContext): Promise<ActivationResult>

  // Phase 5 — check declared vs registered contributions
  verify(plugin: ActivatedPlugin): VerificationResult

  // Run all phases
  boot(): Promise<BootReport>

  // Shutdown — reverse order, 5s timeout per plugin
  shutdown(): Promise<void>
}

interface BootReport {
  total: number
  active: number
  degraded: number
  failed: number
  plugins: { name: string; status: PluginStatus; durationMs: number }[]
}
```

### Startup Log

```
[plugins] Discovered 4 plugins
[plugins] ✓ dbstudio-ssh: active (1 middleware, 1 command) [42ms]
[plugins] ✓ dbstudio-ai: active (1 panel, 2 commands) [128ms]
[plugins] ✓ dbstudio-mongodb: active (1 driver) [35ms]
[plugins] ✗ dbstudio-redis: error(activate) — ioredis not found [12ms]
[plugins] Boot complete: 3 active, 0 degraded, 1 failed
```

### Shutdown Sequence

Reverse of activation order. Each plugin gets 5s to run `deactivate()`. After timeout, force-dispose all `context.subscriptions`. Tracks resources (open connections, registered middleware) per plugin for guaranteed cleanup.

## 2. Manifest Validation (Phase 2)

Strict schema validation — not just field existence, but type and format checking.

### Required Fields

| Field | Type | Validation |
|-------|------|------------|
| `name` | string | Non-empty, matches `^[a-z0-9-]+$` |
| `version` | string | Valid semver (x.y.z) |
| `displayName` | string | Non-empty |
| `description` | string | Non-empty |
| `main` | string | File exists relative to plugin dir, ends in `.js` |
| `contributes` | object | Valid structure per contribution type |

### Entry Point Validation

1. `require()` the `main` file — must not throw
2. `typeof module.activate === 'function'` — must be true
3. Error messages are specific: `"main file not found: dist/index.js"`, `"Missing activate() export"`

### Contributes Validation

Each contribution entry must have a valid `id` field. Per-type checks:

- `drivers[]` — `id` and `name` required
- `commands[]` — `id` and `title` required
- `panels[]` — `id`, `title`, `icon`, `location` required
- `connectionMiddleware[]` — `id` required
- `connectionFields[]` — `key`, `label`, `type` required
- `settings[]` — `key`, `title`, `type` required

## 3. Runtime Safety

### safeCall Wrapper

All plugin code executes through `safeCall`:

```typescript
async function safeCall<T>(
  pluginName: string,
  fn: () => T | Promise<T>,
  options?: { timeoutMs?: number }
): Promise<T>
```

- Wraps every plugin callback in try/catch
- Enforces timeout (default 30s for queries, 10s for activation, 5s for deactivation)
- Records errors with timestamps per plugin
- All errors queryable via `getPluginErrors(name): PluginErrorRecord[]`

### Error Budget

```typescript
interface ErrorBudget {
  maxErrors: number     // default: 5
  windowMs: number      // default: 60_000
  record(pluginName: string, error: Error): boolean  // returns true if budget exceeded
  isExceeded(pluginName: string): boolean
  getErrors(pluginName: string): PluginErrorRecord[]
  reset(pluginName: string): void
}

interface PluginErrorRecord {
  timestamp: number
  error: string
  stack?: string
}
```

When budget is exceeded:
1. Auto-deactivate the plugin
2. Set status to `error(runtime)` with message `"Disabled due to repeated errors (5 in 60s)"`
3. Emit event for UI toast: `"{Plugin} disabled due to repeated errors. Re-enable in Extensions."`

### Timeout Enforcement

| Operation | Default Timeout |
|-----------|----------------|
| `activate()` | 10s |
| `deactivate()` | 5s |
| Driver `query()` | 30s |
| Driver `connect()` | 15s |
| Schema methods | 10s |
| Middleware `beforeConnect()` | 15s |

Timeouts reject with: `"Plugin '{name}' timed out during {operation} after {ms}ms"`

## 4. Plugin SDK Types

### PluginContext

Every plugin's `activate()` receives a typed context:

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

`subscriptions` is auto-populated as registrations happen. On deactivate, all subscriptions are disposed in reverse order.

### PluginContext Factory

```typescript
function createPluginContext(
  pluginName: string,
  driverRegistry: DriverRegistryImpl,
  commandRegistry: CommandRegistryImpl,
  panelRegistry: PanelRegistryImpl,
  schemaAccess: SchemaAccessImpl,
  connectionAccess: ConnectionAccessImpl,
  configStore: ConfigStore
): PluginContext
```

Creates scoped views per plugin. Each registry method automatically adds the returned `Disposable` to the context's `subscriptions` array.

## 5. Registries

### 5.1 DriverRegistry

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
  group?: string
}

interface ConnectionMiddleware {
  shouldApply(profile: ConnectionProfile): boolean
  beforeConnect(profile: ConnectionProfile): Promise<ConnectionProfile>
  onDisconnect(profileId: string): Promise<void>
}
```

- `register()` adds a new database type. The `id` becomes a valid `DatabaseType` string.
- `registerConnectionMiddleware()` adds middleware that wraps any connection.
- Duplicate `id` registration throws immediately (fail-fast, not silent overwrite).
- `Disposable` removes the registration and cleans up.

### 5.2 CommandRegistry

```typescript
interface CommandRegistry {
  register(id: string, handler: () => void | Promise<void>): Disposable
}
```

- Commands namespaced by plugin: `pluginName:commandId`
- Handler runs through `safeCall`
- Future: exposed to command palette via IPC

### 5.3 PanelRegistry

```typescript
interface PanelRegistry {
  register(id: string, panel: PanelContribution): Disposable
}

interface PanelContribution {
  title: string
  icon: string
  location: 'sidebar' | 'bottom'
  render(): string
}
```

- Stores panel metadata
- Renderer queries registered panels via IPC
- Panel content rendered in sandboxed iframe

### 5.4 SchemaAccess (read-only)

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

- Delegates to existing adapter methods on active connections
- All calls go through `safeCall`
- Plugins cannot modify schema

### 5.5 ConnectionAccess (read-only + query)

```typescript
interface ConnectionAccess {
  getActiveConnectionId(): string | null
  getProfile(connectionId: string): ConnectionProfile | null
  query(connectionId: string, sql: string, params?: unknown[]): Promise<QueryResult>
  onActiveConnectionChanged(listener: (id: string | null) => void): Disposable
}
```

- Can run queries, cannot modify connection profiles
- Event subscription for connection changes

### 5.6 PluginSettings

```typescript
interface PluginSettings {
  get<T>(key: string): T | undefined
  set(key: string, value: unknown): void
  onChanged(key: string, listener: (value: unknown) => void): Disposable
}
```

- Scoped per plugin: `get("apiKey")` reads `plugins.<pluginName>.apiKey` from config store
- Change listeners auto-disposed on deactivate

## 6. Post-Activation Verification (Phase 5)

After `activate()` returns, the coordinator checks that declared contributions were actually registered:

- Manifest says `"drivers": [{ "id": "mongodb" }]` → check `driverRegistry.has("mongodb")`
- Manifest says `"commands": [{ "id": "manage-tunnels" }]` → check `commandRegistry.has("ssh:manage-tunnels")`
- Manifest says `"panels": [{ "id": "ai-chat" }]` → check `panelRegistry.has("ai-chat")`

**All declared, all registered** → status = `active`, contributions list populated.

**Some missing** → status = `degraded`, error describes what's missing, contributions list has what did register.

**None registered** → status = `error(verify)`, error: `"Plugin activated but registered no contributions"`.

## 7. Manifest Types Extension

```typescript
// src/main/plugins/types.ts

interface PluginManifest {
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

interface ConnectionFieldContribution {
  key: string
  label: string
  type: 'text' | 'password' | 'number' | 'boolean' | 'file'
  required?: boolean
  default?: string | number | boolean
  group?: string
}

interface PanelContributionManifest {
  id: string
  title: string
  icon: string
  location: 'sidebar' | 'bottom'
}

interface SettingContribution {
  key: string
  title: string
  type: 'text' | 'password' | 'number' | 'boolean'
  default?: string | number | boolean
}

interface LoadedPlugin {
  manifest: PluginManifest
  path: string
  status: PluginStatus
  module?: { activate: Function; deactivate?: Function }
  context?: PluginContext
}
```

## 8. Changes to Existing Code

### `shared/types.ts` — DatabaseType

```typescript
// Before
export type DatabaseType = 'postgresql' | 'mysql' | 'sqlite'

// After — plugin types are strings, validated at runtime
export type DatabaseType = 'postgresql' | 'mysql' | 'sqlite' | (string & {})
```

### `src/main/db/factory.ts` — createAdapter

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

### `shared/ipc.ts` — Plugin channels

```typescript
'plugins:list': {
  args: []
  return: {
    name: string
    displayName: string
    version: string
    description: string
    status: PluginStatus
    contributions: string[]
  }[]
}
'plugins:errors': {
  args: [name: string]
  return: PluginErrorRecord[]
}
```

### `src/main/ipc-handlers.ts` — Connection middleware

```typescript
handle('db:connect', async (profileId) => {
  let profile = configStore.getConnection(profileId)
  // Run connection middleware chain
  for (const mw of driverRegistry.getMiddlewares()) {
    if (mw.shouldApply(profile)) {
      profile = await safeCall(mw.pluginName, () => mw.beforeConnect(profile), { timeoutMs: 15_000 })
    }
  }
  const adapter = createAdapter(profile)
  await adapter.connect()
  activeAdapters.set(profileId, adapter)
})
```

## 9. File Layout

```
src/main/plugins/
├── types.ts                 # manifest types (extended)
├── plugin-host.ts           # PluginBootCoordinator + discovery + lifecycle
└── sdk/
    ├── types.ts             # public SDK types (PluginContext, Disposable, registries)
    ├── index.ts             # createPluginContext() factory
    ├── driver-registry.ts   # DriverRegistry implementation
    ├── command-registry.ts  # CommandRegistry implementation
    ├── panel-registry.ts    # PanelRegistry implementation
    ├── schema-access.ts     # SchemaAccess implementation
    ├── connection-access.ts # ConnectionAccess implementation
    ├── settings.ts          # PluginSettings implementation
    └── safe-call.ts         # safeCall wrapper, ErrorBudget, timeout
```

## 10. Testing Strategy

| Test | What it validates |
|------|-------------------|
| `safe-call.test.ts` | Error catching, timeout rejection, error budget threshold, budget reset |
| `driver-registry.test.ts` | Register/get/dispose, duplicate ID throws, middleware ordering |
| `command-registry.test.ts` | Register/execute/dispose, namespacing |
| `panel-registry.test.ts` | Register/list/dispose |
| `manifest-validation.test.ts` | Valid manifests pass, each invalid field produces specific error |
| `plugin-boot.test.ts` | Mock plugins through all 5 phases, error in each phase handled correctly |
| `plugin-host-integration.test.ts` | Fake plugin registers driver, `createAdapter()` finds it, deactivate cleans up |
