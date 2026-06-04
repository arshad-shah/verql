// Advisory-permission enforcement inside an isolated plugin worker.
//
// Because an isolated plugin runs in its own process, we can finally enforce the
// "advisory" capabilities (`network`, `filesystem`, `process`) that are
// impossible to gate for in-process code: we patch the worker's CommonJS module
// loader so that `require('net')`, `require('fs')`, `require('child_process')`,
// etc. throw unless the plugin declared *and* was granted the matching
// capability. A plugin with no advisory grants gets a pure-compute sandbox whose
// only outside contact is the RPC bridge back to the host.
//
// Honest scope: this raises the bar, it is not an impervious jail. A determined
// plugin could try lower-level escapes (`process.binding`, internal bindings,
// native addons it ships). Hardening those — and dropping NODE_OPTIONS / a
// custom loader policy on the forked process — is follow-up work tracked in
// docs/plugin-security.md. What it *does* guarantee today: the ordinary,
// documented ways to open a socket / touch the filesystem / spawn a process are
// closed by default for an untrusted, ungranted plugin.

import Module from 'module'

/** Node builtins gated by each advisory permission. Both bare and `node:`
 *  prefixed specifiers are covered. */
export const FORBIDDEN_BY_PERMISSION: Record<string, string[]> = {
  network: ['net', 'tls', 'http', 'https', 'http2', 'dgram', 'dns', 'dns/promises'],
  filesystem: ['fs', 'fs/promises'],
  process: ['child_process', 'cluster', 'worker_threads', 'inspector'],
}

/** Build the set of module specifiers that should be blocked given the granted
 *  permissions. A specifier is blocked when its owning permission is NOT
 *  granted. Includes the `node:` prefixed form of each. */
export function blockedModules(granted: Iterable<string>): Set<string> {
  const grantedSet = new Set(granted)
  const blocked = new Set<string>()
  for (const [perm, mods] of Object.entries(FORBIDDEN_BY_PERMISSION)) {
    if (grantedSet.has(perm)) continue
    for (const m of mods) {
      blocked.add(m)
      blocked.add(`node:${m}`)
    }
  }
  return blocked
}

/** Normalise a require specifier for comparison (strip a `node:` prefix once). */
function ownerPermission(spec: string): string | undefined {
  const bare = spec.startsWith('node:') ? spec.slice(5) : spec
  for (const [perm, mods] of Object.entries(FORBIDDEN_BY_PERMISSION)) {
    if (mods.includes(bare)) return perm
  }
  return undefined
}

export class SandboxViolationError extends Error {
  constructor(
    public readonly specifier: string,
    public readonly permission: string,
  ) {
    super(
      `Blocked require('${specifier}'): this isolated plugin was not granted the ` +
        `'${permission}' capability. Declare "${permission}" in the plugin manifest's ` +
        `"permissions" array and have the user grant it.`,
    )
    this.name = 'SandboxViolationError'
  }
}

/**
 * Patch `Module.prototype.require` so blocked builtins throw. Returns a function
 * that restores the original loader (used by tests; a real worker never restores
 * because the process is single-plugin and short-lived).
 */
export function installModuleSandbox(granted: Iterable<string>): () => void {
  const blocked = blockedModules(granted)
  if (blocked.size === 0) return () => {}

  const moduleProto = Module.prototype as unknown as {
    require: (id: string) => unknown
  }
  const original = moduleProto.require
  moduleProto.require = function (id: string): unknown {
    if (typeof id === 'string' && blocked.has(id)) {
      throw new SandboxViolationError(id, ownerPermission(id) ?? 'unknown')
    }
    return original.apply(this, [id] as [string])
  }
  return () => {
    moduleProto.require = original
  }
}
