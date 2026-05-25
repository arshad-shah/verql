import type { ConnectionProfile } from '@shared/types'

/** The auto-commit mode a freshly opened query tab inherits from its
 *  connection profile. Absent ⇒ on (safe default). */
export function initialAutoCommit(profile: ConnectionProfile | null): boolean {
  return profile?.defaultAutoCommit ?? true
}
