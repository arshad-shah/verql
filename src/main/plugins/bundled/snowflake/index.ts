import type { PluginContext } from '../../sdk/types'
import type { PluginManifest } from '../../types'
import { SnowflakeAdapter } from './snowflake-adapter'

export const manifest: PluginManifest = {
  name: 'dbstudio-plugin-snowflake',
  version: '1.0.0',
  displayName: 'Snowflake',
  description: 'Snowflake data warehouse driver',
  main: 'index.js',
  contributes: {
    drivers: [{ id: 'snowflake', name: 'Snowflake' }],
    statusBar: [
      { id: 'snowflake-selectors', zone: 'left' }
    ]
  }
}

export function activate(ctx: PluginContext): void {
  ctx.drivers.register('snowflake', {
    createAdapter: (config) => new SnowflakeAdapter(config),
    connectionFields: [
      { key: 'account', label: 'Account Identifier', type: 'text', required: true },
      { key: 'host', label: 'Host Override', type: 'text' },
      { key: 'username', label: 'Username', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
      {
        key: 'authenticator', label: 'Authenticator', type: 'select', default: 'externalbrowser',
        options: [
          { value: 'externalbrowser', label: 'SSO (Browser)' },
          { value: 'snowflake', label: 'Username / Password' },
          { value: 'SNOWFLAKE_JWT', label: 'Key Pair (JWT)' },
          { value: 'oauth', label: 'OAuth' },
          { value: 'https://okta.example.com', label: 'Okta (enter URL)' },
        ],
      },
      { key: 'privateKeyPath', label: 'Private Key File', type: 'file' },
      { key: 'passphrase', label: 'Key Passphrase', type: 'password' },
      { key: 'role', label: 'Role', type: 'select', fetchable: true, step: 1 },
      { key: 'warehouse', label: 'Warehouse', type: 'select', fetchable: true, step: 1 },
      { key: 'database', label: 'Database', type: 'select', fetchable: true, step: 2 },
      { key: 'schema', label: 'Schema', type: 'select', fetchable: true, step: 2, default: 'PUBLIC' },
    ]
  })

  // ── Declarative UI: Status bar selectors ──────────────────────────────────

  ctx.ui.registerStatusBar('snowflake-selectors', [
    { type: 'selector', id: 'sf-role', label: 'Role', resolver: 'sf-roles', onChange: 'dbstudio-plugin-snowflake:use-role' },
    { type: 'selector', id: 'sf-warehouse', label: 'Warehouse', resolver: 'sf-warehouses', onChange: 'dbstudio-plugin-snowflake:use-warehouse' },
    { type: 'selector', id: 'sf-database', label: 'Database', resolver: 'sf-databases', onChange: 'dbstudio-plugin-snowflake:use-database' },
    { type: 'selector', id: 'sf-schema', label: 'Schema', resolver: 'sf-schemas', onChange: 'dbstudio-plugin-snowflake:use-schema' },
  ])

  // ── Dynamic resolvers ─────────────────────────────────────────────────────

  const extractName = (r: Record<string, unknown>) => {
    const name = String(r['"name"'] ?? r.name ?? '')
    return { value: name, label: name }
  }
  const filterEmpty = (o: { value: string }) => o.value !== ''

  ctx.ui.registerResolver('sf-roles', async ({ connectionId }) => {
    const result = await ctx.connections.query(connectionId, 'SHOW ROLES')
    return result.rows.map(extractName).filter(filterEmpty)
  })

  ctx.ui.registerResolver('sf-warehouses', async ({ connectionId }) => {
    const result = await ctx.connections.query(connectionId, 'SHOW WAREHOUSES')
    return result.rows.map(extractName).filter(filterEmpty)
  })

  ctx.ui.registerResolver('sf-databases', async ({ connectionId }) => {
    const result = await ctx.connections.query(connectionId, 'SHOW DATABASES')
    return result.rows.map(extractName).filter(filterEmpty)
  })

  ctx.ui.registerResolver('sf-schemas', async ({ connectionId }) => {
    const result = await ctx.connections.query(connectionId, 'SHOW SCHEMAS')
    return result.rows.map(extractName).filter(filterEmpty)
  })

  // ── Commands for selector onChange ─────────────────────────────────────────

  ctx.commands.register('use-role', async (payload) => {
    if (payload?.value && payload?.connectionId) {
      await ctx.connections.query(payload.connectionId as string, `USE ROLE "${payload.value}"`)
      ctx.ui.invalidate('sf-warehouses')
      ctx.ui.invalidate('sf-databases')
    }
  })

  ctx.commands.register('use-warehouse', async (payload) => {
    if (payload?.value && payload?.connectionId) {
      await ctx.connections.query(payload.connectionId as string, `USE WAREHOUSE "${payload.value}"`)
    }
  })

  ctx.commands.register('use-database', async (payload) => {
    if (payload?.value && payload?.connectionId) {
      await ctx.connections.query(payload.connectionId as string, `USE DATABASE "${payload.value}"`)
      ctx.ui.invalidate('sf-schemas')
    }
  })

  ctx.commands.register('use-schema', async (payload) => {
    if (payload?.value && payload?.connectionId) {
      await ctx.connections.query(payload.connectionId as string, `USE SCHEMA "${payload.value}"`)
    }
  })
}
