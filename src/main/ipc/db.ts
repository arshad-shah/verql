import type { ConnectionProfile } from '@shared/types'
import type { DbAdapter } from '../db/adapter'
import { createAdapter } from '../db/factory'
import { safeCall } from '../plugins/sdk/safe-call'
import { ConnectionAccessImpl } from '../plugins/sdk/connection-access'
import { getSecretFieldKeys, mergeIncomingProfile } from './secrets'
import { quoteIdentifier, type SqlDialect } from '../db/identifier'
import type { IpcContext, Handle } from './context'

const FALLBACK_DIALECT_BY_TYPE: Record<string, SqlDialect> = {
  postgresql: 'postgresql',
  postgres: 'postgresql',
  mysql: 'mysql',
  sqlite: 'sqlite'
}

export function registerDbHandlers(
  ctx: IpcContext,
  handle: Handle,
  connectionAccess: ConnectionAccessImpl
): void {
  const requireAdapter = (profileId: string): DbAdapter => {
    const adapter = ctx.activeAdapters.get(profileId)
    if (!adapter) throw new Error('Not connected — select a connection from the sidebar first')
    return adapter
  }

  handle('db:connect', async (profileId: string) => {
    try {
      let profile = ctx.configStore.getConnection(profileId)
      if (!profile) return { success: false, error: 'Connection profile not found — it may have been deleted' }
      if (ctx.activeAdapters.has(profileId)) {
        connectionAccess.setActiveConnectionId(profileId)
        return { success: true }
      }

      for (const { middleware, pluginName } of ctx.driverRegistry.getMiddlewares()) {
        if (middleware.shouldApply(profile)) {
          profile = await safeCall(pluginName, () => middleware.beforeConnect(profile!), { timeoutMs: 15_000 })
        }
      }

      const adapter = createAdapter(profile)
      await adapter.connect()
      ctx.activeAdapters.set(profileId, adapter)
      connectionAccess.setActiveConnectionId(profileId)
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  handle('db:disconnect', async (profileId: string) => {
    const adapter = ctx.activeAdapters.get(profileId)
    if (adapter) {
      await adapter.disconnect()
      ctx.activeAdapters.delete(profileId)
    }
    if (connectionAccess.getActiveConnectionId() === profileId) {
      connectionAccess.setActiveConnectionId(null)
    }
    for (const { middleware } of ctx.driverRegistry.getMiddlewares()) {
      try {
        await middleware.onDisconnect(profileId)
      } catch {
        // Ignore middleware cleanup errors
      }
    }
  })

  handle('db:query', async (profileId: string, sql: string, params?: unknown[]) =>
    requireAdapter(profileId).query(sql, params)
  )

  const resolveProfile = (profile: ConnectionProfile): ConnectionProfile => {
    const secretKeys = getSecretFieldKeys(ctx.driverRegistry)
    const existing = ctx.configStore.getConnection(profile.id)
    return mergeIncomingProfile(profile, existing, secretKeys)
  }

  handle('db:test-connection', async (profile: ConnectionProfile) => {
    let adapter: DbAdapter | null = null
    try {
      adapter = createAdapter(resolveProfile(profile))
      await adapter.connect()
      const result = await adapter.testConnection()
      return { success: true, ...result }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    } finally {
      await adapter?.disconnect()
    }
  })

  handle('db:connection-options', async (profile: ConnectionProfile, fields: string[]) => {
    let adapter: DbAdapter | null = null
    try {
      adapter = createAdapter(resolveProfile(profile))
      await adapter.connect()
      if (!adapter.getConnectionOptions) return {}
      const result: Record<string, string[]> = {}
      for (const field of fields) {
        try {
          result[field] = await adapter.getConnectionOptions(field)
        } catch {
          result[field] = []
        }
      }
      return result
    } finally {
      await adapter?.disconnect()
    }
  })

  handle('db:get-tables', async (profileId, schema) =>
    requireAdapter(profileId).getTables(schema)
  )

  handle('db:get-columns', async (profileId, table, schema) =>
    requireAdapter(profileId).getColumns(table, schema)
  )

  handle('db:get-indexes', async (profileId, table, schema) =>
    requireAdapter(profileId).getIndexes(table, schema)
  )

  handle('db:get-schemas', async (profileId) => requireAdapter(profileId).getSchemas())

  handle('db:get-databases', async (profileId) => requireAdapter(profileId).getDatabases())

  handle('db:get-row-count', async (profileId, table, schema) =>
    requireAdapter(profileId).getRowCount(table, schema)
  )

  handle('db:get-schema-objects', async (profileId, schema) => {
    const adapter = requireAdapter(profileId)
    return adapter.getSchemaObjects ? adapter.getSchemaObjects(schema) : []
  })

  handle('db:get-table-names', async (profileId, schema) => {
    const tables = await requireAdapter(profileId).getTables(schema)
    return tables.map(t => t.name)
  })

  handle('db:switch-database', async (profileId, database) => {
    if (!database) throw new Error('Database name is required')
    await requireAdapter(profileId).switchDatabase(database)
  })

  handle('db:set-schema', async (profileId, schema) => {
    const adapter = requireAdapter(profileId)
    if (adapter.setSchema) await adapter.setSchema(schema)
  })

  handle('db:switch-warehouse', async (profileId, warehouse) => {
    const adapter = requireAdapter(profileId)
    if (adapter.switchWarehouse) await adapter.switchWarehouse(warehouse)
  })

  handle('db:switch-role', async (profileId, role) => {
    const adapter = requireAdapter(profileId)
    if (adapter.switchRole) await adapter.switchRole(role)
  })

  handle('db:cancel-query', async (profileId) => {
    const adapter = ctx.activeAdapters.get(profileId)
    if (adapter?.cancelQuery) adapter.cancelQuery()
  })

  handle('db:sample-query', async (profileId, table, schema) => {
    const profile = ctx.configStore.getConnection(profileId)
    if (!profile) throw new Error('Unknown connection')
    const driver = ctx.driverRegistry.get(profile.type)
    if (driver?.sampleQuery) return driver.sampleQuery(table, schema)
    // Drivers without a sampleQuery contribution fall back to a generic SELECT.
    // Identifiers go through quoteIdentifier so an attacker-controlled table
    // name (e.g. from an introspected schema on a malicious server) cannot
    // break out of the statement.
    const dialect = FALLBACK_DIALECT_BY_TYPE[profile.type] ?? 'postgresql'
    const qualified = schema
      ? quoteIdentifier([schema, table], dialect)
      : quoteIdentifier(table, dialect)
    return `SELECT * FROM ${qualified} LIMIT 100;`
  })
}
