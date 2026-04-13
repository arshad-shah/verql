# Plugin-Owned Connections & Keyring Auth

**Date:** 2026-04-13
**Status:** Approved
**Scope:** Adapter-owned test connection, fetchable dropdown fields, keyring credential storage, hard-pinned package versions

---

## 1. Adapter-Owned Test Connection

### Problem

The `db:test-connection` IPC handler hardcodes version queries per database type. Adding a new DB type requires modifying the app's core IPC handler. Plugins should own their own test logic.

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

| Adapter | Query |
|---------|-------|
| `PostgresAdapter` | `SELECT version()` |
| `MysqlAdapter` | `SELECT VERSION()` |
| `SqliteAdapter` | `SELECT sqlite_version()` |
| `SnowflakeAdapter` | `SELECT CURRENT_VERSION()` |
| `RedisAdapter` | `PING` + `INFO server` |
| `MongoDBAdapter` | `db.admin().serverStatus()` |

The IPC handler becomes a thin dispatcher:

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

### Validation

At plugin boot time, the existing `PluginBootCoordinator` verify phase already checks that declared contributions are registered. No additional load-time validation needed — `testConnection()` is a required interface method so TypeScript enforces it at compile time. At runtime, the IPC handler catches any errors from the adapter and returns them to the UI.

---

## 2. Fetchable Dropdown Fields

### Problem

Snowflake connection requires warehouse, role, database, and schema selection. These are currently plain text inputs. Users must know and type exact names. The plugin should be able to declare fields that populate dynamically after authentication.

### Design

#### ConnectionField Extension

Add `fetchable` flag and `select` type to `ConnectionField`:

```ts
// src/main/plugins/sdk/types.ts

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

Add optional `getConnectionOptions()` to `DbAdapter`:

```ts
// src/main/db/adapter.ts

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
      const result = await this.query(`SHOW SCHEMAS IN DATABASE ${this.escapeIdentifier(currentDb)}`)
      return result.rows.map((r: Record<string, unknown>) => String(r.name))
    }
    default:
      return []
  }
}
```

#### New IPC Channel

```ts
// shared/ipc.ts
'db:connection-options': {
  args: [profile: ConnectionProfile, field: string]
  return: string[]
}
```

Handler creates a temporary adapter (or reuses an authenticated session), calls `getConnectionOptions(field)`, returns the list.

#### Two-Phase Connection Form UX

1. User fills in account + credentials (non-fetchable fields)
2. Clicks "Authenticate" button
3. App creates temporary adapter via `db:connection-options` IPC, connects using credentials
4. For each `fetchable: true` field, calls `getConnectionOptions(field)`
5. Fields flip from disabled text inputs to populated `<Select>` dropdowns (combobox pattern — user can also type a custom value)
6. User picks warehouse/role/database/schema
7. Saves the connection profile

If fetching fails for a field, it falls back to a regular text input with an error hint.

---

## 3. Keyring-Based Credential Storage

### Problem

Passwords and tokens are stored in plaintext in the config file. Snowflake SSO tokens aren't persisted at all, forcing browser re-auth on every connect.

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
- `safeStorage.encryptString()` encrypts values using OS-level keys (macOS Keychain, Windows DPAPI, Linux libsecret)
- Encrypted blobs stored in JSON file at `app.getPath('userData')/credentials.enc`
- Keyed by `${profileId}:${key}` (e.g., `abc123:password`, `abc123:ssoToken`)
- `safeStorage.decryptString()` recovers plaintext on read

#### What Gets Stored

- Connection passwords (migrated from plaintext config)
- Snowflake SSO/OAuth tokens
- Private key passphrases
- Any sensitive credential a plugin wants to persist

#### Plugin Access via PluginContext

```ts
// src/main/plugins/sdk/types.ts

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

Plugins receive a scoped `KeyringAccess` — the implementation can namespace keys by plugin name to prevent collisions.

#### Snowflake SSO Token Lifecycle

1. **First connect:** Browser opens → user authenticates → Snowflake SDK returns token
2. **Store:** Adapter calls `keyring.store(profileId, 'ssoToken', token)`
3. **Subsequent connects:** Adapter calls `keyring.retrieve(profileId, 'ssoToken')`
4. If token exists and valid → pass to SDK with `token` authenticator, skip browser
5. If token expired → re-auth via browser, store new token
6. **Disconnect/delete connection:** `keyring.delete(profileId, 'ssoToken')`

#### IPC Channels

```ts
'keyring:store':    { args: [profileId: string, key: string, value: string], return: void }
'keyring:retrieve': { args: [profileId: string, key: string], return: string | null }
'keyring:delete':   { args: [profileId: string, key: string], return: void }
```

#### Migration

On first launch after this change:
1. Read existing config store for connection profiles with passwords
2. For each, encrypt and store password via keyring
3. Remove plaintext password from config file
4. One-time, idempotent — skips profiles already migrated

---

## 4. Hard-Pin Package Versions

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
| `src/main/db/adapter.ts` | Add `testConnection()`, `TestConnectionResult`, `getConnectionOptions()` to `DbAdapter` |
| `src/main/db/postgres.ts` | Implement `testConnection()` |
| `src/main/db/mysql.ts` | Implement `testConnection()` |
| `src/main/db/sqlite.ts` | Implement `testConnection()` |
| `src/main/plugins/sdk/types.ts` | Add `fetchable` to `ConnectionField`, `select` to type union, add `KeyringAccess` to `PluginContext` |
| `src/main/plugins/types.ts` | Mirror `fetchable` and `select` type in manifest types |
| `src/main/plugins/bundled/snowflake/snowflake-adapter.ts` | Implement `testConnection()`, `getConnectionOptions()`, keyring SSO token lifecycle |
| `src/main/plugins/bundled/snowflake/index.ts` | Update `connectionFields` to use `select` + `fetchable` |
| `src/main/plugins/bundled/redis/redis-adapter.ts` | Implement `testConnection()` |
| `src/main/plugins/bundled/mongodb/mongodb-adapter.ts` | Implement `testConnection()` |
| `src/main/plugins/sdk/index.ts` | Pass `keyring` into `PluginContext` |
| `src/main/keyring.ts` | New — `KeyringService` implementation |
| `src/main/ipc-handlers.ts` | Simplify `db:test-connection`, add `db:connection-options`, add `keyring:*` channels, add credential migration |
| `shared/ipc.ts` | Add `db:connection-options`, `keyring:*` channel types |
| `src/renderer/src/components/connections/ConnectionFormView.tsx` | Two-phase form: authenticate button, fetchable field → select rendering |
| `src/renderer/src/components/connections/ConnectionTestButton.tsx` | Consume new `TestConnectionResult` shape (version + details) |
| `package.json` | Hard-pin all dependency versions |
