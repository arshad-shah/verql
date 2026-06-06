import type { ConnectionProfile } from '@shared/types'
import type { DbAdapter } from '../db/adapter'
import type { ActivityLog } from '../activity/log'
import { createAdapter } from '../db/factory'
import { safeCall } from '../plugins/sdk/safe-call'
import { ConnectionAccessImpl } from '../plugins/sdk/connection-access'
import { getSecretFieldKeys, mergeIncomingProfile } from './secrets'
import type { IpcContext, Handle } from './context'
import { serializeStaticCapabilities } from '../plugins/sdk/capabilities'

export function registerDbHandlers(
  ctx: IpcContext,
  handle: Handle,
  connectionAccess: ConnectionAccessImpl,
  activity?: ActivityLog
): void {
  const requireAdapter = (profileId: string): DbAdapter => {
    const adapter = ctx.activeAdapters.get(profileId)
    if (!adapter) throw new Error('Not connected — select a connection from the sidebar first')
    return adapter
  }

  const connName = (id: string): string => ctx.configStore.getConnection(id)?.name ?? id

  // Tracks in-flight connect() calls per profile so concurrent renderer
  // requests share one adapter instead of each constructing their own and
  // orphaning the losers (which never get disconnect()'d).
  const inFlightConnects = new Map<string, Promise<{ success: true } | { success: false; error: string }>>()

  handle('db:connect', async (profileId: string) => {
    if (ctx.activeAdapters.has(profileId)) {
      connectionAccess.setActiveConnectionId(profileId)
      return { success: true }
    }
    const existing = inFlightConnects.get(profileId)
    if (existing) return existing

    const attempt = (async () => {
      let adapter: DbAdapter | null = null
      try {
        let profile = ctx.configStore.getConnection(profileId)
        if (!profile) return { success: false as const, error: 'Connection profile not found — it may have been deleted' }

        for (const { middleware, pluginName } of ctx.driverRegistry.getMiddlewares()) {
          if (middleware.shouldApply(profile)) {
            profile = await safeCall(pluginName, () => middleware.beforeConnect(profile!), { timeoutMs: 15_000 })
          }
        }

        adapter = createAdapter(profile)
        await adapter.connect()
        ctx.activeAdapters.set(profileId, adapter)
        connectionAccess.setActiveConnectionId(profileId)
        activity?.record({ kind: 'connection', level: 'success', title: `Connected to ${profile.name}`, source: profileId })
        return { success: true as const }
      } catch (err) {
        // connect() can partially initialise a pool/socket (e.g. pg.Pool with
        // background reconnect timers) before throwing. If we never stored the
        // adapter, release it here so each failed attempt doesn't leak a pool.
        if (adapter && ctx.activeAdapters.get(profileId) !== adapter) {
          await adapter.disconnect().catch(() => { /* best-effort cleanup */ })
        }
        const message = err instanceof Error ? err.message : String(err)
        activity?.record({ kind: 'connection', level: 'error', title: `Connection to ${connName(profileId)} failed`, detail: message, source: profileId })
        return { success: false as const, error: message }
      } finally {
        inFlightConnects.delete(profileId)
      }
    })()

    inFlightConnects.set(profileId, attempt)
    return attempt
  })

  // The renderer owns "which connection the user is looking at". When the user
  // switches between two *already-connected* connections in the UI, no
  // db:connect fires, so without this the main process's active-connection
  // (which AI tools and the MCP server read) would stay pinned to the previous
  // one and operate on the wrong database. The renderer pushes every active
  // change here so the two stay in sync.
  handle('db:set-active-connection', async (profileId: string | null) => {
    // Ignore stale ids for connections that aren't actually open; null (no
    // active connection) is always allowed.
    if (profileId !== null && !ctx.activeAdapters.has(profileId)) return
    connectionAccess.setActiveConnectionId(profileId)
  })

  handle('db:disconnect', async (profileId: string) => {
    const adapter = ctx.activeAdapters.get(profileId)
    if (adapter) {
      await adapter.disconnect()
      ctx.activeAdapters.delete(profileId)
      activity?.record({ kind: 'connection', title: `Disconnected from ${connName(profileId)}`, source: profileId })
    }
    if (connectionAccess.getActiveConnectionId() === profileId) {
      connectionAccess.setActiveConnectionId(null)
    }
    for (const { middleware, pluginName } of ctx.driverRegistry.getMiddlewares()) {
      try {
        await middleware.onDisconnect(profileId)
      } catch (err) {
        // We don't re-throw — a broken SSH tunnel shouldn't prevent the
        // adapter from being released — but we do log, so a leaking
        // child process or socket is at least discoverable in the
        // developer console instead of vanishing.
        console.warn(`[plugins] ${pluginName}.onDisconnect(${profileId}) threw:`, err)
      }
    }
  })

  handle('db:query', async (profileId: string, sql: string, params?: unknown[], opts?: { sessionId?: string; timeoutMs?: number }) => {
    if (!activity) return requireAdapter(profileId).query(sql, params, opts)
    try {
      const result = await requireAdapter(profileId).query(sql, params, opts)
      activity.record({
        kind: 'query', level: 'success',
        title: `${result.rowCount} row(s) · ${result.duration}ms`,
        detail: sql, source: connName(profileId), durationMs: result.duration,
      })
      return result
    } catch (err) {
      activity.record({
        kind: 'query', level: 'error', title: 'Query failed',
        detail: `${sql}\n\n${err instanceof Error ? err.message : String(err)}`,
        source: connName(profileId),
      })
      throw err
    }
  })

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
    if (adapter?.cancelQuery) await adapter.cancelQuery()
  })

  handle('db:session:open', async (profileId, sessionId, opts) => {
    const adapter = requireAdapter(profileId)
    if (adapter.openSession) await adapter.openSession(sessionId, opts)
  })

  handle('db:session:close', async (profileId, sessionId) => {
    const adapter = ctx.activeAdapters.get(profileId)
    if (adapter?.closeSession) await adapter.closeSession(sessionId)
  })

  handle('db:session:set-autocommit', async (profileId, sessionId, enabled) => {
    const adapter = requireAdapter(profileId)
    if (adapter.setAutoCommit) await adapter.setAutoCommit(sessionId, enabled)
  })

  handle('db:txn:begin', async (profileId, sessionId, opts) => {
    const adapter = requireAdapter(profileId)
    if (adapter.beginTransaction) await adapter.beginTransaction(sessionId, opts)
  })

  handle('db:txn:commit', async (profileId, sessionId) => {
    const adapter = ctx.activeAdapters.get(profileId)
    if (adapter?.commit) await adapter.commit(sessionId)
  })

  handle('db:txn:rollback', async (profileId, sessionId) => {
    const adapter = ctx.activeAdapters.get(profileId)
    if (adapter?.rollback) await adapter.rollback(sessionId)
  })

  handle('db:connection-capabilities', async (profileId) => {
    const profile = ctx.configStore.getConnection(profileId)
    if (!profile) return null
    const driver = ctx.driverRegistry.get(profile.type)
    const adapter = ctx.activeAdapters.get(profileId)
    if (!driver?.getRuntimeCapabilities || !adapter) return null
    return driver.getRuntimeCapabilities(adapter)
  })

  handle('db:driver-capabilities', async (type: string) => {
    const driver = ctx.driverRegistry.get(type)
    if (!driver) return null
    return serializeStaticCapabilities(driver)
  })

  handle('db:parse-plan', async (profileId, result) => {
    // Plan parsing is dialect-specific and owned by the driver. The renderer
    // never parses EXPLAIN output itself. Returns [] when the driver has no
    // parser or the rows aren't a plan.
    const adapter = ctx.activeAdapters.get(profileId)
    return adapter?.parseQueryPlan?.(result) ?? []
  })

  handle('db:sample-query', async (profileId, table, schema) => {
    const profile = ctx.configStore.getConnection(profileId)
    if (!profile) throw new Error('Unknown connection')
    const driver = ctx.driverRegistry.get(profile.type)
    if (!driver?.sampleQuery) {
      // Every driver — SQL or otherwise — must contribute its own
      // sampleQuery(). The orchestrator never falls back to a fabricated
      // SQL template, because that would re-introduce dialect knowledge
      // into the main app.
      throw new Error(
        `Driver '${profile.type}' does not contribute a sampleQuery(). ` +
        `Add it to the driver plugin's registration.`
      )
    }
    return driver.sampleQuery(table, schema)
  })
}
