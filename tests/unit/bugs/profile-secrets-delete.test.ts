// Regression test for deleteProfileSecrets() fire-and-forget semantics.
//
// The old loop did `void keyring.delete(profileId, key)` for every key,
// which (a) never reported errors back to the caller — they became
// unhandled rejections if the keyring's delete went async — and
// (b) issued one disk save per key when the keyring supports a single
// atomic `deleteAll(profileId)`.
//
// The fix uses `keyring.deleteAll(profileId)` when available (one save,
// awaited) and falls back to awaiting each per-key delete in sequence.
import { describe, it, expect } from 'vitest'
import { deleteProfileSecrets, type KeyringLike } from '../../../src/main/ipc/profile-secrets'

interface FakeKeyring extends KeyringLike {
  deletes: string[]
  deleteAllCalls: string[]
  save: () => void
}

function makeKeyring(opts: { withDeleteAll?: boolean; failOn?: string } = {}): FakeKeyring {
  const cache = new Map<string, string>([
    ['p1:password', 'secret1'],
    ['p1:apiKey', 'secret2'],
    ['p2:password', 'other'],
  ])
  const k: FakeKeyring & { deleteAll?: (id: string) => Promise<void> } = {
    deletes: [],
    deleteAllCalls: [],
    listKeys(profileId) {
      return Array.from(cache.keys())
        .filter(k => k.startsWith(`${profileId}:`))
        .map(k => k.slice(profileId.length + 1))
    },
    storeSync() {},
    retrieveSync(profileId, key) { return cache.get(`${profileId}:${key}`) ?? null },
    async delete(profileId, key) {
      const compositeKey = `${profileId}:${key}`
      if (opts.failOn === key) throw new Error(`refused ${compositeKey}`)
      cache.delete(compositeKey)
      this.deletes.push(compositeKey)
    },
    save: () => {},
  }
  if (opts.withDeleteAll) {
    k.deleteAll = async (profileId: string) => {
      k.deleteAllCalls.push(profileId)
      for (const key of Array.from(cache.keys())) {
        if (key.startsWith(`${profileId}:`)) cache.delete(key)
      }
    }
  }
  return k as FakeKeyring
}

describe('deleteProfileSecrets', () => {
  it('returns a Promise that resolves only after every key is gone', async () => {
    const keyring = makeKeyring()
    const result = deleteProfileSecrets('p1', keyring)
    expect(result).toBeInstanceOf(Promise)
    await result
    expect(keyring.listKeys('p1')).toEqual([])
    // The unrelated profile's keys must survive.
    expect(keyring.listKeys('p2')).toEqual(['password'])
  })

  it('prefers keyring.deleteAll when available (single atomic save)', async () => {
    const keyring = makeKeyring({ withDeleteAll: true })
    await deleteProfileSecrets('p1', keyring)
    expect(keyring.deleteAllCalls).toEqual(['p1'])
    // Per-key deletes should NOT have been used when deleteAll is offered.
    expect(keyring.deletes).toEqual([])
  })

  it('propagates errors instead of swallowing them as unhandled rejections', async () => {
    const keyring = makeKeyring({ failOn: 'apiKey' })
    await expect(deleteProfileSecrets('p1', keyring)).rejects.toThrow(/refused/)
  })
})
