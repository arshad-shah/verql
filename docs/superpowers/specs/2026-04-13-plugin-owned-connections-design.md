# Plugin-Owned Connections & Keyring Auth

**Date:** 2026-04-13
**Status:** Approved
**Scope:** All databases as extensions, adapter-owned test connection, fetchable dropdown fields, keyring credential storage, hard-pinned package versions

---

## Core Principle

**Every database is an extension.** The app is a shell that provides integration points — rendering, IPC dispatch, keyring, plugin lifecycle — and extensions own all database-specific logic. The app has zero knowledge of postgres, mysql, snowflake, etc. There are no `case 'postgresql'` branches in app code.

This means:
- PostgreSQL, MySQL, and SQLite become bundled plugins, same as Snowflake/Redis/MongoDB
- The adapter factory has no switch statement — it only looks up the driver registry
- IPC handlers are pure dispatchers — call interface methods, never contain DB-specific logic
- Each plugin implements a shared contract (`DbAdapter`) with validation and checks
- The app validates at load time (manifest contributions registered) and runtime (error budgets) that extensions conform

---

## 1. Promote Built-In Adapters to Bundled Plugins

### Problem

PostgreSQL, MySQL, and SQLite are hardcoded in `src/main/db/factory.ts` with a switch statement. They bypass the plugin system entirely. This creates two classes of database support and forces DB-specific logic into the app core.

### Design

#### New Plugin Structure

Move each built-in adapter into `src/main/plugins/bundled/`:

```
src/main/plugins/bundled/
  postgresql/
    index.ts          — manifest + activate()
    postgres-adapter.ts  — moved from src/main/db/postgres.ts
  mysql/
    index.ts
    mysql-adapter.ts     — moved from src/main/db/mysql.ts
  sqlite/
    index.ts
    sqlite-adapter.ts    — moved from src/main/db/sqlite.ts
```

Each follows the same pattern as Snowflake/Redis/MongoDB:

```ts
// src/main/plugins/bundled/postgresql/index.ts
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

Same for MySQL (default port 3306) and SQLite (single `database` field with `type: 'file'`).

#### Simplified Adapter Factory

```ts
// src/main/db/factory.ts
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

No switch. No imports of adapter classes. Pure registry lookup.

#### Connection Form

The `ConnectionFormView` currently hardcodes field layouts for built-in types (`BUILTIN_TYPES` constant, special SQLite handling). After this change, **all** database types render their fields from `connectionFields` declared by the plugin. The `BUILTIN_TYPES` constant and type-specific branches in the form are removed.

#### Delete Old Files

Remove `src/main/db/postgres.ts`, `src/main/db/mysql.ts`, `src/main/db/sqlite.ts` after migration. Only `src/main/db/adapter.ts` (interface) and `src/main/db/factory.ts` (registry lookup) remain in `src/main/db/`.

---

## 2. Adapter-Owned Test Connection

### Problem

The `db:test-connection` IPC handler hardcodes version queries per database type. Plugins should own their own test logic.

### Design

Add a required `testConnection()` method to the `DbAdapter` interface:

```ts
// src/main/db/adapter.ts

interface DbAdapter {
  // ... existing methods ...
  testConnection(): Promise<TestConnectionResult>
}

interface TestConnectionResult {
  version: string
  details?: Record<string, string>
}
```

Each adapter implements its own diagnostic:

| Adapter | Implementation |
|---------|---------------|
| `PostgresAdapter` | `SELECT version()` |
| `MysqlAdapter` | `SELECT VERSION()` |
| `SqliteAdapter` | `SELECT sqlite_version()` |
| `SnowflakeAdapter` | `SELECT CURRENT_VERSION()` |
| `RedisAdapter` | `PING` + `INFO server` |
| `MongoDBAdapter` | `db.admin().serverStatus()` |

The IPC handler becomes a pure dispatcher:

```ts
handle('db:test-connection', async (profile) => {
  const adapter = createAdapter(profile)
  try {
    await adapter.connect()
    const result = await adapter.testConnection()
    return { success: true, ...result }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  } finally {
    await adapter.disconnect()
  }
})
```

No DB-specific logic in the handler. The adapter owns connection, diagnostic, and error semantics.

### Validation

`testConnection()` is a required interface method — TypeScript enforces it at compile time. The existing `PluginBootCoordinator` verify phase checks that declared driver contributions are registered at load time. At runtime, the IPC handler catches any errors and returns them to the UI.

---

## 3. Fetchable Dropdown Fields

### Problem

Snowflake connection requires warehouse, role, database, and schema selection. These are currently plain text inputs. The plugin should declare fields that populate dynamically after authentication.

### Design

#### ConnectionField Extension

Add `fetchable` flag and `select` type:

```ts
interface ConnectionField {
  key: string
  label: string
  type: 'text' | 'password' | 'number' | 'boolean' | 'file' | 'select'
  required?: boolean
  default?: string | number | boolean
  group?: string
  fetchable?: boolean  // populate after auth via getConnectionOptions()
}
```

#### DbAdapter Extension

Add optional `getConnectionOptions()`:

```ts
interface DbAdapter {
  // ... existing methods ...
  getConnectionOptions?(field: string): Promise<string[]>
}
```

#### Snowflake Plugin Fields

```ts
connectionFields: [
  { key: 'account', label: 'Account Identifier', type: 'text', required: true },
  { key: 'authenticator', label: 'Authenticator', type: 'text', default: 'externalbrowser' },
  { key: 'username', label: 'Username', type: 'text' },
  { key: 'password', label: 'Password', type: 'password' },
  { key: 'database', label: 'Database', type: 'select', fetchable: true },
  { key: 'warehouse', label: 'Warehouse', type: 'select', fetchable: true },
  { key: 'role', label: 'Role', type: 'select', fetchable: true },
  { key: 'schema', label: 'Schema', type: 'select', fetchable: true, default: 'PUBLIC' },
  { key: 'privateKeyPath', label: 'Private Key File', type: 'file' },
  { key: 'passphrase', label: 'Key Passphrase', type: 'password' },
]
```

#### Snowflake Adapter Implementation

```ts
async getConnectionOptions(field: string): Promise<string[]> {
  switch (field) {
    case 'warehouse': // SHOW WAREHOUSES → pluck names
    case 'role':      // SHOW ROLES → pluck names
    case 'database':  // SHOW DATABASES → pluck names
    case 'schema':    // SHOW SCHEMAS IN DATABASE → pluck names
    default: return []
  }
}
```

#### New IPC Channel

```ts
'db:connection-options': {
  args: [profile: ConnectionProfile, field: string]
  return: string[]
}
```

Handler creates a temporary adapter, connects, calls `getConnectionOptions(field)`, disconnects. Pure dispatch.

#### Two-Phase Connection Form UX

1. User fills in account + credentials (non-fetchable fields)
2. Clicks "Authenticate" button
3. App creates temporary adapter, connects, fetches options for all `fetchable: true` fields
4. Fields flip from disabled text inputs to populated `<Select>` dropdowns (combobox pattern — user can also type a custom value as fallback)
5. User picks warehouse/role/database/schema, then saves
6. If fetch fails for a field, falls back to text input with error hint

---

## 4. Keyring-Based Credential Storage

### Problem

Passwords and tokens are stored in plaintext in the config file. Snowflake SSO tokens aren't persisted, forcing browser re-auth on every connect.

### Design

#### KeyringService Module

New module at `src/main/keyring.ts` using Electron's `safeStorage` API:

```ts
interface KeyringService {
  store(profileId: string, key: string, value: string): Promise<void>
  retrieve(profileId: string, key: string): Promise<string | null>
  delete(profileId: string, key: string): Promise<void>
  deleteAll(profileId: string): Promise<void>
}
```

**Storage mechanics:**
- `safeStorage.encryptString()` encrypts using OS-level keys (macOS Keychain, Windows DPAPI, Linux libsecret)
- Encrypted blobs stored in JSON file at `app.getPath('userData')/credentials.enc`
- Keyed by `${profileId}:${key}`
- `safeStorage.decryptString()` recovers plaintext on read

#### What Gets Stored

- Connection passwords (migrated from plaintext config)
- Snowflake SSO/OAuth tokens
- Private key passphrases
- Any sensitive credential a plugin wants to persist

#### Plugin Access via PluginContext

```ts
interface PluginContext {
  // ... existing ...
  keyring: KeyringAccess
}

interface KeyringAccess {
  store(profileId: string, key: string, value: string): Promise<void>
  retrieve(profileId: string, key: string): Promise<string | null>
  delete(profileId: string, key: string): Promise<void>
}
```

Plugins receive `KeyringAccess` scoped by plugin name to prevent collisions.

#### Snowflake SSO Token Lifecycle

1. **First connect:** Browser opens → user authenticates → SDK returns token
2. **Store:** Adapter calls `keyring.store(profileId, 'ssoToken', token)`
3. **Subsequent connects:** Adapter calls `keyring.retrieve(profileId, 'ssoToken')`
4. If token valid → pass to SDK, skip browser
5. If expired → re-auth via browser, store new token
6. **Delete connection:** `keyring.deleteAll(profileId)`

#### IPC Channels

```ts
'keyring:store':    { args: [profileId: string, key: string, value: string], return: void }
'keyring:retrieve': { args: [profileId: string, key: string], return: string | null }
'keyring:delete':   { args: [profileId: string, key: string], return: void }
```

#### Migration

On first launch after this change:
1. Read existing config store for connection profiles with passwords
2. For each, encrypt and store via keyring
3. Remove plaintext password from config
4. One-time, idempotent — skips profiles already migrated

---

## 5. Hard-Pin Package Versions

Strip all `^`, `~`, `>=` semver range prefixes from `package.json` dependencies and devDependencies. Pin every package to its exact currently-installed version.

```diff
- "react": "^19.0.0"
+ "react": "19.0.0"
```

Run `pnpm install` after to regenerate `pnpm-lock.yaml`.

---

## Files Changed

| File | Change |
|------|--------|
| **New: plugin migrations** | |
| `src/main/plugins/bundled/postgresql/index.ts` | New — manifest + activate, connectionFields |
| `src/main/plugins/bundled/postgresql/postgres-adapter.ts` | Moved from `src/main/db/postgres.ts`, add `testConnection()` |
| `src/main/plugins/bundled/mysql/index.ts` | New — manifest + activate, connectionFields |
| `src/main/plugins/bundled/mysql/mysql-adapter.ts` | Moved from `src/main/db/mysql.ts`, add `testConnection()` |
| `src/main/plugins/bundled/sqlite/index.ts` | New — manifest + activate, connectionFields |
| `src/main/plugins/bundled/sqlite/sqlite-adapter.ts` | Moved from `src/main/db/sqlite.ts`, add `testConnection()` |
| **Deleted** | |
| `src/main/db/postgres.ts` | Deleted — moved to plugin |
| `src/main/db/mysql.ts` | Deleted — moved to plugin |
| `src/main/db/sqlite.ts` | Deleted — moved to plugin |
| **Core changes** | |
| `src/main/db/adapter.ts` | Add `testConnection()`, `TestConnectionResult`, `getConnectionOptions()` |
| `src/main/db/factory.ts` | Remove switch statement, pure registry lookup |
| `src/main/plugins/sdk/types.ts` | Add `fetchable`, `select` to `ConnectionField`, add `KeyringAccess` to `PluginContext` |
| `src/main/plugins/types.ts` | Mirror `fetchable` and `select` in manifest types |
| `src/main/plugins/sdk/index.ts` | Pass `keyring` into `PluginContext` |
| `src/main/plugins/plugin-host.ts` | Register postgresql/mysql/sqlite as bundled plugins |
| `src/main/keyring.ts` | New — `KeyringService` implementation |
| `src/main/ipc-handlers.ts` | Simplify `db:test-connection` to pure dispatch, add `db:connection-options`, add `keyring:*` channels, credential migration |
| `shared/ipc.ts` | Add `db:connection-options`, `keyring:*` channel types |
| **Plugin updates** | |
| `src/main/plugins/bundled/snowflake/snowflake-adapter.ts` | Add `testConnection()`, `getConnectionOptions()`, keyring SSO lifecycle |
| `src/main/plugins/bundled/snowflake/index.ts` | Update fields to `select` + `fetchable` |
| `src/main/plugins/bundled/redis/redis-adapter.ts` | Add `testConnection()` |
| `src/main/plugins/bundled/mongodb/mongodb-adapter.ts` | Add `testConnection()` |
| **UI changes** | |
| `src/renderer/src/components/connections/ConnectionFormView.tsx` | Remove `BUILTIN_TYPES`, remove hardcoded field layouts, all types render from plugin `connectionFields`, two-phase authenticate flow for fetchable fields |
| `src/renderer/src/components/connections/ConnectionTestButton.tsx` | Consume `TestConnectionResult` shape |
| **Infra** | |
| `package.json` | Hard-pin all dependency versions |
