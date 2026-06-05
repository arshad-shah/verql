import type { IpcContext, Handle } from './context'
import { getSecretFieldKeys } from './secrets'

/**
 * Namespaces that hold secrets which must never be reachable through the
 * generic renderer-facing keyring channels. AI provider keys live under
 * `__ai__` and are write-only by design (`ai:keys:set`, with only a
 * boolean `ai:keys:has` reader); exposing them through `keyring:retrieve`
 * would hand a compromised renderer every configured API key.
 */
const RESERVED_NAMESPACES = new Set(['__ai__', '__mcp__'])

/**
 * Gate access to the generic keyring IPC channels. The renderer may only
 * touch keyring entries that correspond to a recognised connection-secret
 * field on an existing connection profile. This keeps `keyring:*` from
 * becoming a bypass of the redaction applied to `connections:*` and
 * `settings:*`.
 *
 * Exported for unit testing.
 */
export function assertKeyringAccess(ctx: IpcContext, profileId: string, key: string): void {
  if (RESERVED_NAMESPACES.has(profileId)) {
    throw new Error(`keyring: access to reserved namespace '${profileId}' is not permitted`)
  }
  const secretKeys = getSecretFieldKeys(ctx.driverRegistry)
  if (!secretKeys.has(key)) {
    throw new Error(`keyring: '${key}' is not a recognised connection secret field`)
  }
  if (!ctx.configStore.getConnection(profileId)) {
    throw new Error(`keyring: unknown connection profile '${profileId}'`)
  }
}

export function registerKeyringHandlers(ctx: IpcContext, handle: Handle): void {
  handle('keyring:store', async (profileId: string, key: string, value: string) => {
    assertKeyringAccess(ctx, profileId, key)
    await ctx.keyring.store(profileId, key, value)
  })

  handle('keyring:retrieve', async (profileId: string, key: string) => {
    assertKeyringAccess(ctx, profileId, key)
    return ctx.keyring.retrieve(profileId, key)
  })

  handle('keyring:delete', async (profileId: string, key: string) => {
    assertKeyringAccess(ctx, profileId, key)
    await ctx.keyring.delete(profileId, key)
  })
}
