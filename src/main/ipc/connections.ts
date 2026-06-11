import type { ConnectionProfile } from '@shared/types'
import { IPC_CHANNELS } from '@shared/ipc'
import type { IpcContext, Handle } from './context'
import { getSecretFieldKeys, mergeIncomingProfile, redactConnection } from './secrets'

export function registerConnectionHandlers(ctx: IpcContext, handle: Handle): void {
  handle(IPC_CHANNELS.CONNECTIONS_LIST, () => {
    const secretKeys = getSecretFieldKeys(ctx.driverRegistry)
    return ctx.configStore.listConnections().map(p => redactConnection(p, secretKeys))
  })

  handle(IPC_CHANNELS.CONNECTIONS_SAVE, (profile: ConnectionProfile) => {
    const secretKeys = getSecretFieldKeys(ctx.driverRegistry)
    const existing = ctx.configStore.getConnection(profile.id)
    const merged = mergeIncomingProfile(profile, existing, secretKeys)
    const saved = ctx.configStore.saveConnection(merged, secretKeys)
    return redactConnection(saved, secretKeys)
  })

  handle(IPC_CHANNELS.CONNECTIONS_DELETE, async (profileId: string) => {
    const adapter = ctx.activeAdapters.get(profileId)
    if (adapter) {
      ctx.activeAdapters.delete(profileId)
      await adapter.disconnect()
    }
    await ctx.configStore.deleteConnection(profileId)
  })
}
