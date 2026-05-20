import type { IpcContext, Handle } from './context'

export function registerKeyringHandlers(ctx: IpcContext, handle: Handle): void {
  handle('keyring:store', async (profileId: string, key: string, value: string) => {
    await ctx.keyring.store(profileId, key, value)
  })

  handle('keyring:retrieve', async (profileId: string, key: string) => {
    return ctx.keyring.retrieve(profileId, key)
  })

  handle('keyring:delete', async (profileId: string, key: string) => {
    await ctx.keyring.delete(profileId, key)
  })
}
