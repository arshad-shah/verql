import type { PluginManifest } from '../types'
import type { PluginContext } from './types'

/**
 * Shape every plugin module exports.
 *
 * Bundled plugins satisfy this shape implicitly (they export `manifest`
 * and `activate` at the top level); third-party plugins are encouraged
 * to use {@link definePlugin} for stronger type inference and a single
 * import that bundles the whole contract together.
 */
export interface PluginModule {
  manifest: PluginManifest
  activate(ctx: PluginContext): void | Promise<void>
  deactivate?(): void | Promise<void>
}

/**
 * Identity helper that pins the plugin shape against `PluginModule` at the
 * call site. Catches missing fields, mistyped contributions, and wrong
 * `activate` signatures at compile time instead of letting the boot
 * pipeline reject the plugin at runtime.
 *
 * @example
 *   export default definePlugin({
 *     manifest: { name: 'verql-plugin-foo', ... },
 *     activate(ctx) { ctx.drivers.register('foo', { ... }) },
 *   })
 */
export function definePlugin(plugin: PluginModule): PluginModule {
  return plugin
}
