import type { ConnectionProfile } from '@shared/types'

/**
 * Profile secrets at-rest model:
 *  - on disk (config.json): secret fields blanked (empty string)
 *  - in memory (ConfigStore.data): full plaintext, injected from keyring on load
 *  - on the wire to renderer: redacted to SECRET_PLACEHOLDER (ipc/secrets.ts)
 */

/** Minimal keyring surface needed by these helpers. Lets ConfigStore pass its
 *  internal `KeyringLike` stub (including the no-op test stub) without TypeScript
 *  complaining that it isn't the full `KeyringService`. */
export interface KeyringLike {
  listKeys(profileId: string): string[]
  storeSync(profileId: string, key: string, value: string): void
  retrieveSync(profileId: string, key: string): string | null
  delete(profileId: string, key: string): Promise<void>
  /** Optional: delete every key for a profile in one atomic save. When
   *  present, callers should prefer this over a loop of per-key
   *  `delete()` calls to keep credential file writes O(1). */
  deleteAll?(profileId: string): Promise<void>
}

const isSecretValue = (v: unknown): v is string =>
  typeof v === 'string' && v.length > 0

/**
 * Push secret fields from `profile` into the keyring and return a copy
 * with those fields blanked — ready to be written to disk.
 */
export function extractAndPersistSecrets(
  profile: ConnectionProfile,
  secretKeys: Iterable<string>,
  keyring: KeyringLike
): ConnectionProfile {
  const stripped = { ...profile } as ConnectionProfile & Record<string, unknown>
  for (const key of secretKeys) {
    const v = stripped[key]
    if (isSecretValue(v)) {
      keyring.storeSync(profile.id, key, v)
      stripped[key] = ''
    }
  }
  return stripped as ConnectionProfile
}

/**
 * Pull all keyring-stored secrets back into `profile` in memory.
 * Called after loading profiles from disk so in-memory state is always
 * plaintext-complete.
 */
export function injectSecretsFromKeyring(
  profile: ConnectionProfile,
  keyring: KeyringLike
): ConnectionProfile {
  const out = { ...profile } as ConnectionProfile & Record<string, unknown>
  for (const key of keyring.listKeys(profile.id)) {
    const v = keyring.retrieveSync(profile.id, key)
    if (v !== null) out[key] = v
  }
  return out as ConnectionProfile
}

/**
 * Remove all keyring entries that belong to a profile.
 * Called when a connection profile is deleted.
 *
 * Returns a Promise so callers can await the deletion before reporting
 * success to the renderer; the previous fire-and-forget implementation
 * turned any keyring rejection into an unhandled promise rejection.
 */
export async function deleteProfileSecrets(
  profileId: string,
  keyring: KeyringLike
): Promise<void> {
  if (keyring.deleteAll) {
    await keyring.deleteAll(profileId)
    return
  }
  for (const key of keyring.listKeys(profileId)) {
    await keyring.delete(profileId, key)
  }
}
