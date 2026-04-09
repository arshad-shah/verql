# Snowflake Adapter Design

## Overview

Add a Snowflake data warehouse adapter to dbterm as a bundled plugin, following the same pattern as the existing MongoDB and Redis plugins. Supports username/password, key-pair, and SSO/OAuth authentication, full schema introspection, database/schema switching, and query cancellation.

## Plugin Structure

```
src/main/plugins/bundled/snowflake/
├── index.ts              # Plugin entry — registers driver with DriverRegistry
└── snowflake-adapter.ts  # DbAdapter implementation
```

### Manifest

```typescript
{
  name: 'snowflake',
  version: '1.0.0',
  description: 'Snowflake data warehouse adapter',
  main: 'index.ts',
  contributions: { drivers: ['snowflake'] }
}
```

### Registration

In `src/main/ipc-handlers.ts`, register alongside existing bundled plugins:

```typescript
pluginCoordinator.registerBundledPlugin(snowflakePlugin.manifest, snowflakePlugin)
```

## Connection Fields

The plugin declares `connectionFields` that auto-generate the connection form UI:

```typescript
connectionFields: [
  // Core
  { key: 'account',       label: 'Account Identifier', type: 'text',     required: true },
  { key: 'host',          label: 'Host Override',       type: 'text'                     },
  { key: 'database',      label: 'Database',            type: 'text',     required: true },
  { key: 'schema',        label: 'Schema',              type: 'text',     default: 'PUBLIC' },
  { key: 'warehouse',     label: 'Warehouse',           type: 'text'                     },
  { key: 'role',          label: 'Role',                type: 'text'                     },

  // Auth: Password
  { key: 'username',      label: 'Username',            type: 'text'                     },
  { key: 'password',      label: 'Password',            type: 'password'                 },

  // Auth: Key Pair
  { key: 'privateKeyPath', label: 'Private Key File',   type: 'file'                     },
  { key: 'passphrase',    label: 'Key Passphrase',      type: 'password'                 },

  // Auth: SSO/OAuth
  { key: 'authenticator', label: 'Authenticator',       type: 'text',
    default: 'externalbrowser' },
]
```

## Authentication Strategy

Auth method is determined by which fields the user populates — no explicit selector needed:

1. **Key-pair auth:** `privateKeyPath` is set. Reads the PEM file, passes `privateKey` and optional `passphrase` to the SDK connection config. Sets `authenticator: 'SNOWFLAKE_JWT'`.
2. **SSO/OAuth:** `authenticator` is set and `password` is empty. The SDK opens the user's browser for authentication. Common values: `externalbrowser`, or an Okta URL.
3. **Username/password:** Default fallback. Passes `username` and `password` to the SDK.

The `snowflake-sdk` natively supports all three — the adapter just constructs the appropriate config object.

## Adapter Implementation

### DbAdapter Interface Mapping

| Method | Snowflake Implementation |
|---|---|
| `connect()` | Create `snowflake-sdk` connection, call `connectAsync()` |
| `disconnect()` | Call `connection.destroy()` |
| `query(sql, params?)` | `connection.execute()` with binds, map rows to `QueryResult` |
| `getTables(schema?)` | `SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?` |
| `getColumns(table, schema?)` | `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?` |
| `getIndexes(table, schema?)` | Returns empty array (Snowflake is columnar, no traditional indexes) |
| `getRowCount(table, schema?)` | `SELECT COUNT(*) FROM <schema>.<table>` |
| `getSchemas()` | `SHOW SCHEMAS IN DATABASE <current_db>` |
| `getDatabases()` | `SHOW DATABASES` |
| `switchDatabase(db)` | `USE DATABASE <db>` |
| `setSchema(schema)` | `USE SCHEMA <schema>` |
| `cancelQuery()` | Tracks active statement ID; cancels via `connection.execute({ sqlText: 'SELECT SYSTEM$CANCEL_ALL_QUERIES(...)' })` |
| `isConnected()` | Checks `connection.isUp()` |

### Query Execution Details

- The SDK's `execute()` returns rows as JavaScript objects
- Map to `QueryResult` format: `{ columns: string[], rows: Record<string, unknown>[], rowCount: number }`
- Track the active `statementId` on each execution for cancellation support
- Clear `statementId` after query completes or is cancelled

### Connection Options Construction

```typescript
function buildConnectionOptions(config: Record<string, unknown>): ConnectionOptions {
  const opts: ConnectionOptions = {
    account: config.account as string,
    database: config.database as string,
    schema: (config.schema as string) || 'PUBLIC',
    warehouse: config.warehouse as string | undefined,
    role: config.role as string | undefined,
  }

  if (config.host) {
    opts.accessUrl = config.host as string
  }

  if (config.privateKeyPath) {
    // Key-pair auth
    opts.username = config.username as string
    opts.authenticator = 'SNOWFLAKE_JWT'
    opts.privateKeyPath = config.privateKeyPath as string
    if (config.passphrase) {
      opts.privateKeyPass = config.passphrase as string
    }
  } else if (config.authenticator && !config.password) {
    // SSO/OAuth
    opts.username = config.username as string
    opts.authenticator = config.authenticator as string
  } else {
    // Username/password
    opts.username = config.username as string
    opts.password = config.password as string
  }

  return opts
}
```

## Dependencies

- **Add:** `snowflake-sdk` to `package.json` dependencies
- **No native rebuild needed** — the Snowflake SDK is pure JavaScript, no `electron-rebuild` changes
- **No shared type changes** — `DatabaseType` already accepts arbitrary strings via `(string & {})`

## Files Changed

| File | Change |
|---|---|
| `src/main/plugins/bundled/snowflake/index.ts` | **New** — Plugin entry, registers driver |
| `src/main/plugins/bundled/snowflake/snowflake-adapter.ts` | **New** — DbAdapter implementation |
| `src/main/ipc-handlers.ts` | **Modified** — Register snowflake bundled plugin |
| `package.json` | **Modified** — Add `snowflake-sdk` dependency |

## Out of Scope

- Snowflake-specific objects (stages, pipes, streams, tasks) — not needed for a query/browsing tool
- Connection pooling — Snowflake SDK manages sessions internally
- Multi-statement execution — standard single-statement execution is sufficient
- Snowflake-specific UI beyond what `connectionFields` provides
