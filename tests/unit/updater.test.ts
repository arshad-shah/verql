import { describe, it, expect, vi } from 'vitest'
import { UpdaterRegistry } from '../../src/main/updater/registry'
import type { Updater, UpdateInfo, UpdateProgress } from '../../src/main/updater/types'

function fakeUpdater(opts: {
  id?: string
  available: boolean
  current?: string
  latest?: string | null
  onUpdate?: (cb: (p: UpdateProgress) => void) => Promise<void>
}): Updater {
  return {
    id: (opts.id ?? 'homebrew') as Updater['id'],
    displayName: opts.id ?? 'fake',
    isAvailable: vi.fn(async () => opts.available),
    getCurrentVersion: () => opts.current ?? '1.0.0',
    checkForUpdate: vi.fn(async (): Promise<UpdateInfo> => ({
      currentVersion: opts.current ?? '1.0.0',
      latestVersion: opts.latest ?? null,
      available: opts.latest != null && opts.latest !== (opts.current ?? '1.0.0'),
    })),
    update: opts.onUpdate ?? (async () => {}),
  }
}

describe('UpdaterRegistry', () => {
  it('returns null when no updaters are registered', async () => {
    const r = new UpdaterRegistry()
    expect(await r.detectActive()).toBeNull()
  })

  it('returns null when no updater reports available', async () => {
    const r = new UpdaterRegistry()
    r.register(fakeUpdater({ id: 'homebrew', available: false }))
    r.register(fakeUpdater({ id: 'snap', available: false }))
    expect(await r.detectActive()).toBeNull()
  })

  it('picks the first available updater in registration order', async () => {
    const r = new UpdaterRegistry()
    const first = fakeUpdater({ id: 'mas', available: true })
    const second = fakeUpdater({ id: 'homebrew', available: true })
    r.register(first)
    r.register(second)
    const active = await r.detectActive()
    expect(active?.id).toBe('mas')
  })

  it('skips updaters whose isAvailable throws and falls through to the next', async () => {
    const r = new UpdaterRegistry()
    const broken: Updater = {
      ...fakeUpdater({ id: 'mas', available: false }),
      isAvailable: vi.fn(async () => { throw new Error('boom') }),
    }
    const working = fakeUpdater({ id: 'homebrew', available: true })
    r.register(broken)
    r.register(working)
    const active = await r.detectActive()
    expect(active?.id).toBe('homebrew')
  })

  it('caches the detection result across calls', async () => {
    const r = new UpdaterRegistry()
    const u = fakeUpdater({ id: 'homebrew', available: true })
    r.register(u)
    await r.detectActive()
    await r.detectActive()
    await r.detectActive()
    expect(u.isAvailable).toHaveBeenCalledTimes(1)
  })

  it('invalidate() forces re-detection (e.g. after a channel switch)', async () => {
    const r = new UpdaterRegistry()
    const u = fakeUpdater({ id: 'homebrew', available: true })
    r.register(u)
    await r.detectActive()
    r.invalidate()
    await r.detectActive()
    expect(u.isAvailable).toHaveBeenCalledTimes(2)
  })

  it('register() invalidates the cache so a new channel takes effect immediately', async () => {
    const r = new UpdaterRegistry()
    const none = fakeUpdater({ id: 'homebrew', available: false })
    r.register(none)
    expect(await r.detectActive()).toBeNull()

    const added = fakeUpdater({ id: 'mas', available: true })
    r.register(added)
    const active = await r.detectActive()
    expect(active?.id).toBe('mas')
  })
})

describe('Updater contract (used by IPC layer)', () => {
  it('reports availability via the returned UpdateInfo', async () => {
    const u = fakeUpdater({ available: true, current: '0.5.0', latest: '0.6.0' })
    const info = await u.checkForUpdate()
    expect(info.available).toBe(true)
    expect(info.currentVersion).toBe('0.5.0')
    expect(info.latestVersion).toBe('0.6.0')
  })

  it('reports no update when latest matches current', async () => {
    const u = fakeUpdater({ available: true, current: '0.5.0', latest: '0.5.0' })
    const info = await u.checkForUpdate()
    expect(info.available).toBe(false)
  })

  it('streams progress events through the onProgress callback', async () => {
    const events: UpdateProgress[] = []
    const u = fakeUpdater({
      available: true,
      onUpdate: async (cb) => {
        cb({ phase: 'downloading' })
        cb({ phase: 'installing' })
        cb({ phase: 'done', restartRequired: true })
      },
    })
    await u.update((p) => events.push(p))
    expect(events.map(e => e.phase)).toEqual(['downloading', 'installing', 'done'])
  })
})
