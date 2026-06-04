// The transport-agnostic worker runtime. The Electron entry (worker-entry.ts)
// wires `process.parentPort` to a Transport and calls `startWorker`; tests pass
// an in-memory transport and a fake `requireModule`. Keeping the I/O injectable
// is what makes the isolated plugin lifecycle unit-testable without a subprocess.

import { RpcEndpoint, type Transport } from './rpc'
import {
  H2W,
  type ActivateParams,
  type ActivateResult,
  type InvokeParams,
} from './protocol'
import { buildWorkerContext } from './worker-context'
import { installModuleSandbox } from './sandbox'

interface PluginModule {
  activate: (ctx: unknown) => void | Promise<void>
  deactivate?: () => void | Promise<void>
}

export interface StartWorkerOptions {
  /** Injectable module loader (defaults to CommonJS require). */
  requireModule?: (path: string) => PluginModule
  /** Injectable sandbox installer (defaults to patching the CJS loader). Tests
   *  override this to observe the requested grants without touching the global
   *  module system. */
  installSandbox?: (granted: string[]) => () => void
  timeoutMs?: number
}

export function startWorker(transport: Transport, options: StartWorkerOptions = {}): RpcEndpoint {
  const requireModule =
    options.requireModule ??
    ((p: string) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require(p) as PluginModule
    })

  const installSandbox = options.installSandbox ?? installModuleSandbox

  const endpoint = new RpcEndpoint(transport, { timeoutMs: options.timeoutMs })

  let module: PluginModule | undefined
  let handles = new Map<string, (...args: unknown[]) => unknown>()

  endpoint.handle(H2W.ACTIVATE, async (params): Promise<ActivateResult> => {
    const { mainPath, grantedPermissions } = params as ActivateParams
    // Lock down Node builtins per the advisory grants BEFORE loading the
    // plugin, so even its top-level module code can't reach an ungranted
    // capability while being required.
    installSandbox(grantedPermissions ?? [])
    module = requireModule(mainPath)
    if (typeof module.activate !== 'function') {
      throw new Error('Plugin module has no activate() export')
    }
    const built = buildWorkerContext(endpoint)
    handles = built.handles
    await module.activate(built.context)
    return { contributions: built.contributions }
  })

  endpoint.handle(H2W.INVOKE, async (params): Promise<unknown> => {
    const { handleId, args } = params as InvokeParams
    const handler = handles.get(handleId)
    if (!handler) throw new Error(`Unknown handle '${handleId}'`)
    return handler(...args)
  })

  endpoint.handle(H2W.DEACTIVATE, async (): Promise<void> => {
    if (module?.deactivate) {
      try {
        await module.deactivate()
      } catch {
        // best-effort
      }
    }
    handles.clear()
    module = undefined
  })

  return endpoint
}
