import type { ConnectionProfile } from '@shared/types'
import type { IpcContext, Handle } from './context'
import { getSecretFieldKeys, mergeIncomingProfile, redactConnection } from './secrets'

export function registerConnectionHandlers(ctx: IpcContext, handle: Handle): void {
  handle('connections:list', () => {
    const secretKeys = getSecretFieldKeys(ctx.driverRegistry)
    return ctx.configStore.listConnections().map(p => redactConnection(p, secretKeys))
  })

  handle('connections:save', (profile: ConnectionProfile) => {
    const secretKeys = getSecretFieldKeys(ctx.driverRegistry)
    const existing = ctx.configStore.getConnection(profile.id)
    const merged = mergeIncomingProfile(profile, existing, secretKeys)
    const saved = ctx.configStore.saveConnection(merged, secretKeys)
    return redactConnection(saved, secretKeys)
  })

  handle('connections:delete', (profileId: string) => {
    const adapter = ctx.activeAdapters.get(profileId)
    if (adapter) {
      adapter.disconnect()
      ctx.activeAdapters.delete(profileId)
    }
    ctx.configStore.deleteConnection(profileId)
  })
}
