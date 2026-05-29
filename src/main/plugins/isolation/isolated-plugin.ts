// Host-side controller for one process-isolated plugin.
//
// It drives the worker over RPC: runs activate(), turns each reported
// contribution into a host-side proxy registered in the real registries, and
// serves the worker's capability calls by dispatching them against the
// *gated* PluginContext the host built for this plugin — so the existing
// permission enforcement (deny-by-default keyring/connections) applies exactly
// once, here, no matter that the plugin code lives in another process.

import { RpcEndpoint, type Transport } from './rpc'
import {
  H2W,
  W2H,
  W2H_EVENT,
  type ActivateResult,
  type CapabilityParams,
  type ContributionDescriptor,
} from './protocol'
import type { PluginManifest } from '../types'
import type { PluginContext, Disposable } from '../sdk/types'
import type { CommandRegistryImpl } from '../sdk/command-registry'
import type { ThemeRegistry, RegisteredTheme } from '../sdk/theme-registry'

/** Contribution kinds whose registration is marshalling-compatible today. A
 *  plugin is only isolated when every contribution it declares is one of
 *  these (or a manifest-only declaration that needs no live registration). */
const ISOLATABLE_CONTRIBUTIONS = new Set(['commands', 'themes', 'connectionFields', 'settings'])

/**
 * Whether this plugin can run isolated without losing functionality. The rich
 * surfaces (drivers, exporters, importers, formatters, tools, panels, UI)
 * register non-serializable values (live adapters, predicate functions, Zod
 * schemas) that can't cross a process boundary — those plugins fall back to
 * in-process. See docs/plugin-security.md.
 */
export function canIsolate(manifest: PluginManifest): boolean {
  const keys = Object.keys(manifest.contributes ?? {})
  return keys.every((k) => ISOLATABLE_CONTRIBUTIONS.has(k))
}

/** Surfaces of the gated context the worker is allowed to call. Anything else
 *  is refused — the worker can't reach, say, ctx.drivers through this channel. */
const CAPABILITY_SURFACES = new Set(['connections', 'keyring', 'schema', 'settings'])

export interface IsolatedPluginDeps {
  pluginName: string
  mainPath: string
  /** The guarded PluginContext built for this (untrusted) plugin. Capability
   *  calls and events are dispatched against it, so its permission guards run. */
  context: PluginContext
  commandRegistry: CommandRegistryImpl
  themeRegistry: ThemeRegistry
  /** Called when the worker exits/crashes unexpectedly after activation. */
  onCrash?: (error: Error) => void
}

export class IsolatedPlugin {
  private readonly endpoint: RpcEndpoint
  private readonly proxies: Disposable[] = []
  private active = false

  constructor(
    private readonly transport: Transport,
    private readonly deps: IsolatedPluginDeps,
  ) {
    this.endpoint = new RpcEndpoint(transport)
    this.registerCapabilityServer()
    this.endpoint.onClose(() => this.handleClose())
  }

  /** Load + activate the plugin in the worker and wire up its contributions.
   *  Returns the contribution ids registered, for boot reporting. */
  async activate(): Promise<string[]> {
    const result = await this.endpoint.request<ActivateResult>(H2W.ACTIVATE, {
      pluginName: this.deps.pluginName,
      mainPath: this.deps.mainPath,
    })
    const registered: string[] = []
    for (const c of result.contributions) {
      const id = this.registerContribution(c)
      if (id) registered.push(id)
    }
    this.active = true
    return registered
  }

  async deactivate(): Promise<void> {
    this.active = false
    try {
      await this.endpoint.request(H2W.DEACTIVATE, {})
    } catch {
      // worker may already be gone
    }
    this.disposeProxies()
    this.endpoint.close()
  }

  private registerContribution(c: ContributionDescriptor): string | null {
    switch (c.kind) {
      case 'command': {
        if (!c.handleId) return null
        const handleId = c.handleId
        const namespacedId = `${this.deps.pluginName}:${c.id}`
        const d = this.deps.commandRegistry.register(namespacedId, (payload) =>
          this.endpoint.request(H2W.INVOKE, { handleId, args: [payload] }) as Promise<void>,
        )
        this.proxies.push(d)
        return `command:${c.id}`
      }
      case 'theme': {
        const theme = { ...(c.data as RegisteredTheme), source: this.deps.pluginName }
        const d = this.deps.themeRegistry.register(theme)
        this.proxies.push(d)
        return `theme:${c.id}`
      }
      default:
        return null
    }
  }

  private registerCapabilityServer(): void {
    const ctx = this.deps.context as unknown as Record<string, Record<string, (...a: unknown[]) => unknown>>

    this.endpoint.handle(W2H.CAPABILITY, async (params) => {
      const { surface, method, args } = params as CapabilityParams
      if (!CAPABILITY_SURFACES.has(surface)) {
        throw new Error(`Capability surface '${surface}' is not exposed to isolated plugins`)
      }
      const target = ctx[surface]
      const fn = target?.[method]
      if (typeof fn !== 'function') {
        throw new Error(`Unknown capability '${surface}.${method}'`)
      }
      // Calling the *guarded* method runs the permission check; a denied call
      // throws PermissionDeniedError, which round-trips to the worker.
      return await fn.apply(target, args)
    })

    this.endpoint.on(W2H_EVENT.NOTIFY, (payload) => {
      try {
        this.deps.context.notifications.show(payload as never)
      } catch {
        /* best-effort */
      }
    })

    this.endpoint.on(W2H_EVENT.BROADCAST, (payload) => {
      const { channel, args } = (payload ?? {}) as { channel?: string; args?: unknown[] }
      if (typeof channel === 'string') {
        try {
          this.deps.context.broadcast(channel, ...(args ?? []))
        } catch {
          /* best-effort */
        }
      }
    })
  }

  private handleClose(): void {
    this.disposeProxies()
    if (this.active) {
      this.active = false
      this.deps.onCrash?.(new Error(`Isolated plugin '${this.deps.pluginName}' worker exited unexpectedly`))
    }
  }

  private disposeProxies(): void {
    for (const d of this.proxies.splice(0).reverse()) {
      try {
        d.dispose()
      } catch {
        /* ignore */
      }
    }
  }
}
