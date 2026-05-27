import type { ConnectionProfile } from '@shared/types'

/**
 * Resolve a saved connection from an AI-supplied argument. The AI references
 * connections by the human name it sees in the prompt summary, but may also
 * pass the stable id — accept either, matching id first, then name
 * case-insensitively.
 */
export function resolveConnection(
  connections: ConnectionProfile[],
  arg: string | undefined
): ConnectionProfile | undefined {
  if (!arg) return undefined
  const needle = arg.trim()
  if (!needle) return undefined
  return (
    connections.find((c) => c.id === needle) ??
    connections.find((c) => c.name.toLowerCase() === needle.toLowerCase())
  )
}
