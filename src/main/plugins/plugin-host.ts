import fs from 'fs'
import path from 'path'
import os from 'os'
import { execFileSync } from 'child_process'
import { app } from 'electron'
import type { PluginManifest, LoadedPlugin } from './types'
import type { PluginStatus, BootReport } from './sdk/types'
import { createPluginContext, disposePluginContext } from './sdk/index'
import { safeCall, ErrorBudget } from './sdk/safe-call'
import type { DriverRegistryImpl } from './sdk/driver-registry'
import type { CommandRegistryImpl } from './sdk/command-registry'
import type { PanelRegistryImpl } from './sdk/panel-registry'
import type { UIRegistryImpl } from './sdk/ui-registry'
import type { CompletionRegistryImpl } from './sdk/completion-registry'
import { SchemaAccessImpl } from './sdk/schema-access'
import { ConnectionAccessImpl } from './sdk/connection-access'
import { validateTheme } from './sdk/theme-registry'
import type { DbAdapter } from '../db/adapter'
import type { ConnectionProfile } from '@shared/types'

// ─── Manifest Validation ─────────────────────────────────────────────────────

const NAME_PATTERN = /^[a-z0-9-]+$/
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateManifest(manifest: PluginManifest): ValidationResult {
  if (!manifest.name || !NAME_PATTERN.test(manifest.name)) {
    return { valid: false, error: `Invalid name: must match ${NAME_PATTERN} (got "${manifest.name}")` }
  }
  if (!manifest.version || !SEMVER_PATTERN.test(manifest.version)) {
    return { valid: false, error: `Invalid version: must be semver x.y.z (got "${manifest.version}")` }
  }
  if (!manifest.displayName) {
    return { valid: false, error: 'Missing required field: displayName' }
  }
  if (!manifest.description) {
    return { valid: false, error: 'Missing required field: description' }
  }
  if (!manifest.main) {
    return { valid: false, error: 'Missing required field: main' }
  }
  if (!manifest.main.endsWith('.js')) {
    return { valid: false, error: `main must end in .js (got "${manifest.main}")` }
  }

  const c = manifest.contributes
  if (c.drivers) {
    for (const d of c.drivers) {
      if (!d.id) return { valid: false, error: 'Driver contribution missing required field: id' }
      if (!d.name) return { valid: false, error: 'Driver contribution missing required field: name' }
    }
  }
  if (c.commands) {
    for (const cmd of c.commands) {
      if (!cmd.id) return { valid: false, error: 'Command contribution missing required field: id' }
      if (!cmd.title) return { valid: false, error: 'Command contribution missing required field: title' }
    }
  }
  if (c.panels) {
    for (const p of c.panels) {
      if (!p.id) return { valid: false, error: 'Panel contribution missing required field: id' }
      if (!p.title) return { valid: false, error: 'Panel contribution missing required field: title' }
      if (!p.icon) return { valid: false, error: 'Panel contribution missing required field: icon' }
      if (!p.location) return { valid: false, error: 'Panel contribution missing required field: location' }
    }
  }
  if (c.connectionMiddleware) {
    for (const mw of c.connectionMiddleware) {
      if (!mw.id) return { valid: false, error: 'Connection middleware contribution missing required field: id' }
    }
  }
  if (c.connectionFields) {
    for (const f of c.connectionFields) {
      if (!f.key) return { valid: false, error: 'Connection field contribution missing required field: key' }
      if (!f.label) return { valid: false, error: 'Connection field contribution missing required field: label' }
      if (!f.type) return { valid: false, error: 'Connection field contribution missing required field: type' }
    }
  }
  if (c.settings) {
    for (const s of c.settings) {
      if (!s.key) return { valid: false, error: 'Setting contribution missing required field: key' }
      if (!s.title) return { valid: false, error: 'Setting contribution missing required field: title' }
      if (!s.type) return { valid: false, error: 'Setting contribution missing required field: type' }
    }
  }
  if (c.themes) {
    for (const t of c.themes) {
      if (!t.id) return { valid: false, error: 'Theme contribution missing required field: id' }
      if (!t.name) return { valid: false, error: 'Theme contribution missing required field: name' }
      if (t.type !== 'dark' && t.type !== 'light') {
        return { valid: false, error: `Theme contribution '${t.id}' has invalid type (expected 'dark' or 'light')` }
      }
    }
  }
  if (c.exporters) {
    for (const e of c.exporters) {
      if (!e.id) return { valid: false, error: 'Exporter contribution missing required field: id' }
      if (!e.name) return { valid: false, error: 'Exporter contribution missing required field: name' }
      if (!e.extension) return { valid: false, error: 'Exporter contribution missing required field: extension' }
    }
  }
  if (c.importers) {
    for (const i of c.importers) {
      if (!i.id) return { valid: false, error: 'Importer contribution missing required field: id' }
      if (!i.name) return { valid: false, error: 'Importer contribution missing required field: name' }
      if (!i.extensions || i.extensions.length === 0) {
        return { valid: false, error: 'Importer contribution missing required field: extensions' }
      }
    }
  }

  return { valid: true }
}

// ─── Boot Coordinator ─────────────────────────────────────────────────────────

interface BootDeps {
  driverRegistry: DriverRegistryImpl
  commandRegistry: CommandRegistryImpl
  panelRegistry: PanelRegistryImpl
  uiRegistry: UIRegistryImpl
  completionRegistry: CompletionRegistryImpl
  getAdapter: (connectionId: string) => DbAdapter | undefined
  getProfile: (connectionId: string) => ConnectionProfile | undefined
  keyring: import('./sdk/types').KeyringAccess
  settingsStore: { get(key: string): unknown; set(key: string, value: unknown): void }
  services: import('./sdk/service-registry').ServiceRegistry
  exporterRegistry: import('./sdk/exporter-registry').ExporterRegistry
  importerRegistry: import('./sdk/importer-registry').ImporterRegistry
  typeMapperRegistry: import('./sdk/type-mapper-registry').TypeMapperRegistry
  themeRegistry: import('./sdk/theme-registry').ThemeRegistry
  notificationBus: { show(n: { kind?: 'info' | 'success' | 'warning' | 'error'; title: string; message?: string; durationMs?: number }): void }
  dragDropRegistry: import('./sdk/drag-drop-registry').DragDropRegistry
  /** Persistence for the user's enable/disable choice. Without this, the
   *  coordinator can flip status in memory but `boot()` re-activates every
   *  resolved plugin on next launch. */
  disabledPluginsStore?: {
    isDisabled(name: string): boolean
    markDisabled(name: string): void
    markEnabled(name: string): void
  }
}

export class PluginBootCoordinator {
  private plugins = new Map<string, LoadedPlugin>()
  private activationOrder: string[] = []
  private errorBudget = new ErrorBudget()
  private deps: BootDeps

  constructor(deps: BootDeps) {
    this.deps = deps
  }

  // ── Phase 1: Discover ──────────────────────────────────────────────────────

  discover(dirs: string[]): void {
    // Preserve bundled plugins (path === '<bundled>'), clear discovered ones
    const bundled = new Map<string, LoadedPlugin>()
    for (const [name, plugin] of this.plugins) {
      if (plugin.path === '<bundled>') bundled.set(name, plugin)
    }
    this.plugins.clear()
    for (const [name, plugin] of bundled) {
      this.plugins.set(name, plugin)
    }

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) continue

      let entries: string[]
      try {
        entries = fs.readdirSync(dir)
      } catch {
        continue
      }

      for (const entry of entries) {
        const pluginPath = path.join(dir, entry)
        try {
          const stat = fs.statSync(pluginPath)
          if (!stat.isDirectory()) continue
        } catch {
          continue
        }

        const manifest = this.parseManifest(pluginPath, entry)
        if (manifest) {
          // Bundled plugins (built-in drivers, themes, etc.) are trusted code
          // shipped with the app. A third-party plugin folder claiming the
          // same `name` MUST NOT be allowed to overwrite it — otherwise a
          // user-installed plugin called `verql-plugin-postgresql` could
          // shadow the built-in postgres driver and intercept credentials
          // for every postgres connection.
          const existing = this.plugins.get(manifest.name)
          if (existing && existing.path === '<bundled>') {
            console.warn(
              `[plugins] refusing to load ${manifest.name} from ${pluginPath}: ` +
                `name collides with a bundled plugin`,
            )
            continue
          }
          this.plugins.set(manifest.name, {
            manifest,
            path: pluginPath,
            status: { state: 'discovered' }
          })
        }
      }
    }
  }

  private parseManifest(pluginPath: string, fallbackName: string): PluginManifest | null {
    const manifestPath = path.join(pluginPath, 'plugin-manifest.json')
    const pkgPath = path.join(pluginPath, 'package.json')

    if (fs.existsSync(manifestPath)) {
      try {
        return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
      } catch (err) {
        this.plugins.set(fallbackName, {
          manifest: { name: fallbackName, version: '0.0.0', displayName: fallbackName, description: '', main: '', contributes: {} },
          path: pluginPath,
          status: { state: 'error', error: `Invalid manifest JSON: ${(err as Error).message}`, phase: 'discover' }
        })
        return null
      }
    }

    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
        if (!pkg.keywords?.includes('verql-plugin')) return null
        return {
          name: pkg.name,
          version: pkg.version ?? '0.0.0',
          displayName: pkg.displayName ?? pkg.name,
          description: pkg.description ?? '',
          main: pkg.main ?? 'index.js',
          contributes: pkg.contributes ?? {}
        }
      } catch (err) {
        this.plugins.set(fallbackName, {
          manifest: { name: fallbackName, version: '0.0.0', displayName: fallbackName, description: '', main: '', contributes: {} },
          path: pluginPath,
          status: { state: 'error', error: `Invalid package.json: ${(err as Error).message}`, phase: 'discover' }
        })
        return null
      }
    }

    return null
  }

  // ── Phase 2: Validate ──────────────────────────────────────────────────────

  validateAll(): void {
    for (const [, plugin] of this.plugins) {
      if (plugin.status.state !== 'discovered') continue

      const result = validateManifest(plugin.manifest)
      if (!result.valid) {
        plugin.status = { state: 'error', error: result.error!, phase: 'validate' }
        continue
      }

      // Path-traversal guard: a hostile manifest can specify `main` as
      // `../../../etc/anything.js` or as an absolute path. `require()` would
      // happily load whichever file the joined path resolves to. We pin
      // mainPath to the plugin's own directory by comparing the resolved
      // absolute paths.
      const pluginRoot = path.resolve(plugin.path)
      const mainPath = path.resolve(pluginRoot, plugin.manifest.main)
      const withinPlugin =
        mainPath === pluginRoot ||
        mainPath.startsWith(pluginRoot + path.sep)
      if (!withinPlugin) {
        plugin.status = {
          state: 'error',
          error: `Invalid main: '${plugin.manifest.main}' resolves outside the plugin directory`,
          phase: 'validate',
        }
        continue
      }
      if (!fs.existsSync(mainPath)) {
        plugin.status = { state: 'error', error: `main file not found: ${plugin.manifest.main}`, phase: 'validate' }
        continue
      }

      try {
        const mod = require(mainPath)
        if (typeof mod.activate !== 'function') {
          plugin.status = { state: 'error', error: 'Missing activate() export', phase: 'validate' }
          continue
        }
        plugin.module = mod
      } catch (err) {
        plugin.status = { state: 'error', error: `Failed to load module: ${(err as Error).message}`, phase: 'validate' }
        continue
      }

      plugin.status = { state: 'validated' }
    }
  }

  // ── Phase 3: Resolve (no-op for now) ───────────────────────────────────────

  resolveAll(): void {
    for (const plugin of this.plugins.values()) {
      if (plugin.status.state === 'validated') {
        plugin.status = { state: 'resolved' }
      }
    }
  }

  // ── Phase 4: Activate ──────────────────────────────────────────────────────

  async activatePlugin(plugin: LoadedPlugin): Promise<LoadedPlugin> {
    if (!plugin.module) {
      plugin.status = { state: 'error', error: 'No module loaded', phase: 'activate' }
      return plugin
    }

    plugin.status = { state: 'activating' }

    // User explicitly enabled this plugin — clear any persisted disabled flag
    // so it stays active across restarts.
    this.deps.disabledPluginsStore?.markEnabled(plugin.manifest.name)

    // Set the current plugin name so registries can track ownership
    this.deps.uiRegistry.currentPluginName = plugin.manifest.name
    this.deps.completionRegistry.currentPluginName = plugin.manifest.name

    const context = createPluginContext({
      pluginName: plugin.manifest.name,
      driverRegistry: this.deps.driverRegistry,
      commandRegistry: this.deps.commandRegistry,
      panelRegistry: this.deps.panelRegistry,
      uiRegistry: this.deps.uiRegistry,
      completionRegistry: this.deps.completionRegistry,
      schemaAccess: new SchemaAccessImpl(this.deps.getAdapter),
      connectionAccess: new ConnectionAccessImpl(this.deps.getAdapter, this.deps.getProfile),
      settingsStore: this.deps.settingsStore,
      keyring: this.deps.keyring,
      services: this.deps.services,
      exporterRegistry: this.deps.exporterRegistry,
      importerRegistry: this.deps.importerRegistry,
      typeMapperRegistry: this.deps.typeMapperRegistry,
      themeRegistry: this.deps.themeRegistry,
      notificationBus: this.deps.notificationBus,
      dragDropRegistry: this.deps.dragDropRegistry
    })
    plugin.context = context

    try {
      await safeCall(plugin.manifest.name, () => plugin.module!.activate(context), { timeoutMs: 10_000 })
    } catch (err) {
      disposePluginContext(context)
      plugin.context = undefined
      plugin.status = {
        state: 'error',
        error: err instanceof Error ? err.message : String(err),
        phase: 'activate'
      }
      return plugin
    }

    const verification = this.verifyContributions(plugin)
    plugin.status = verification
    if (verification.state === 'active' || verification.state === 'degraded') {
      this.activationOrder.push(plugin.manifest.name)
    }

    return plugin
  }

  // ── Phase 5: Verify ────────────────────────────────────────────────────────

  private verifyContributions(plugin: LoadedPlugin): PluginStatus {
    const declared: string[] = []
    const registered: string[] = []
    const missing: string[] = []
    const c = plugin.manifest.contributes

    if (c.drivers) {
      for (const d of c.drivers) {
        declared.push(`driver:${d.id}`)
        if (this.deps.driverRegistry.has(d.id)) {
          registered.push(`driver:${d.id}`)
        } else {
          missing.push(`driver:${d.id}`)
        }
      }
    }

    if (c.commands) {
      for (const cmd of c.commands) {
        const namespacedId = `${plugin.manifest.name}:${cmd.id}`
        declared.push(`command:${cmd.id}`)
        if (this.deps.commandRegistry.has(namespacedId)) {
          registered.push(`command:${cmd.id}`)
        } else {
          missing.push(`command:${cmd.id}`)
        }
      }
    }

    if (c.panels) {
      const uiPanelIds = new Set(this.deps.uiRegistry.getAllPanels().map((p) => p.id))
      for (const p of c.panels) {
        declared.push(`panel:${p.id}`)
        // Panels can register via either the new UIRegistry (ctx.ui.registerPanel)
        // or the legacy PanelRegistry (ctx.panels.register); accept both.
        if (uiPanelIds.has(p.id) || this.deps.panelRegistry.has(p.id)) {
          registered.push(`panel:${p.id}`)
        } else {
          missing.push(`panel:${p.id}`)
        }
      }
    }

    if (c.connectionMiddleware) {
      for (const mw of c.connectionMiddleware) {
        declared.push(`middleware:${mw.id}`)
        if (this.deps.driverRegistry.hasMiddleware(mw.id)) {
          registered.push(`middleware:${mw.id}`)
        } else {
          missing.push(`middleware:${mw.id}`)
        }
      }
    }

    if (c.exporters) {
      for (const ex of c.exporters) {
        // ctx.exporters.register namespaces ids as `${pluginName}:${id}` so
        // multiple plugins can each contribute an exporter with the same
        // short id (e.g. several drivers register their own "sql" exporter).
        const namespacedId = `${plugin.manifest.name}:${ex.id}`
        declared.push(`exporter:${ex.id}`)
        if (this.deps.exporterRegistry.get(namespacedId)) {
          registered.push(`exporter:${ex.id}`)
        } else {
          missing.push(`exporter:${ex.id}`)
        }
      }
    }

    if (c.importers) {
      for (const im of c.importers) {
        const namespacedId = `${plugin.manifest.name}:${im.id}`
        declared.push(`importer:${im.id}`)
        if (this.deps.importerRegistry.get(namespacedId)) {
          registered.push(`importer:${im.id}`)
        } else {
          missing.push(`importer:${im.id}`)
        }
      }
    }

    if (c.themes) {
      for (const t of c.themes) {
        declared.push(`theme:${t.id}`)
        const entry = this.deps.themeRegistry.get(t.id)
        if (!entry) {
          missing.push(`theme:${t.id}`)
          continue
        }
        // The registry has already run validateTheme() at register time
        // (so the picker has an authoritative report). The boot phase
        // additionally surfaces required-token gaps as a toast and
        // demotes the theme to a missing contribution.
        const report = entry.validation ?? validateTheme(entry)

        if (report.missingRequired.length > 0) {
          this.deps.notificationBus.show({
            kind: 'error',
            title: `Theme "${entry.name}" is missing required tokens`,
            message: `${plugin.manifest.name}: ${report.missingRequired.join(', ')}`,
            durationMs: 8000,
          })
          missing.push(`theme:${t.id}`)
          continue
        }

        if (report.missingRecommended.length > 0) {
          this.deps.notificationBus.show({
            kind: 'warning',
            title: `Theme "${entry.name}" is missing recommended tokens`,
            message: `${plugin.manifest.name}: ${report.missingRecommended.join(', ')}`,
            durationMs: 6000,
          })
        }

        registered.push(`theme:${t.id}`)
      }
    }

    if (declared.length === 0) {
      return { state: 'active', contributions: [] }
    }

    if (missing.length === 0) {
      return { state: 'active', contributions: registered }
    }

    if (registered.length === 0) {
      return { state: 'error', error: `Plugin activated but registered no contributions. Expected: ${declared.join(', ')}`, phase: 'verify' }
    }

    return { state: 'degraded', error: `Missing contributions: ${missing.join(', ')}`, contributions: registered }
  }

  // ── Full Boot ──────────────────────────────────────────────────────────────

  async boot(): Promise<BootReport> {
    const pluginDir = this.getPluginDir()
    this.discover([pluginDir])
    this.validateAll()
    this.resolveAll()

    const report: BootReport = { total: 0, active: 0, degraded: 0, failed: 0, plugins: [] }

    for (const plugin of this.plugins.values()) {
      report.total++
      if (plugin.status.state !== 'resolved') {
        report.failed++
        report.plugins.push({ name: plugin.manifest.name, status: plugin.status, durationMs: 0 })
        continue
      }

      if (this.deps.disabledPluginsStore?.isDisabled(plugin.manifest.name)) {
        plugin.status = { state: 'inactive' }
        report.plugins.push({ name: plugin.manifest.name, status: plugin.status, durationMs: 0 })
        continue
      }

      const start = performance.now()
      await this.activatePlugin(plugin)
      const durationMs = Math.round(performance.now() - start)

      const state = plugin.status.state as string
      if (state === 'active') report.active++
      else if (state === 'degraded') report.degraded++
      else report.failed++

      report.plugins.push({ name: plugin.manifest.name, status: plugin.status, durationMs })
    }

    this.logBootReport(report)
    return report
  }

  // ── Deactivate ─────────────────────────────────────────────────────────────

  async deactivatePlugin(plugin: LoadedPlugin, opts: { persist?: boolean } = {}): Promise<void> {
    if (plugin.module?.deactivate) {
      try {
        await plugin.module.deactivate()
      } catch {
        // Ignore deactivation errors
      }
    }
    if (plugin.context) {
      disposePluginContext(plugin.context)
      plugin.context = undefined
    }
    plugin.status = { state: 'inactive' }
    this.activationOrder = this.activationOrder.filter(n => n !== plugin.manifest.name)
    // Only persist disabled-state for user-initiated deactivations. Shutdown
    // and auto-tear-down also funnel through here, and those must not mark
    // every active plugin disabled.
    if (opts.persist) {
      this.deps.disabledPluginsStore?.markDisabled(plugin.manifest.name)
    }
  }

  async shutdown(): Promise<void> {
    const reversed = [...this.activationOrder].reverse()
    for (const name of reversed) {
      const plugin = this.plugins.get(name)
      if (plugin) {
        try {
          await safeCall(name, async () => this.deactivatePlugin(plugin), { timeoutMs: 5_000 })
        } catch {
          if (plugin.context) {
            disposePluginContext(plugin.context)
            plugin.context = undefined
          }
          plugin.status = { state: 'inactive' }
        }
      }
    }
    this.activationOrder = []
  }

  // ── Public Accessors ───────────────────────────────────────────────────────

  getLoadedPlugins(): LoadedPlugin[] {
    return Array.from(this.plugins.values())
  }

  getPlugin(name: string): LoadedPlugin | undefined {
    return this.plugins.get(name)
  }

  getErrorBudget(): ErrorBudget {
    return this.errorBudget
  }

  /** Wrap a plugin call with error budget tracking. Auto-deactivates on budget exceeded. */
  async safeCallWithBudget<T>(pluginName: string, fn: () => T | Promise<T>, options?: { timeoutMs?: number }): Promise<T> {
    try {
      return await safeCall(pluginName, fn, options)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      const exceeded = this.errorBudget.record(pluginName, error)
      if (exceeded) {
        const plugin = this.plugins.get(pluginName)
        if (plugin && plugin.status.state !== 'error' && plugin.status.state !== 'inactive') {
          await this.deactivatePlugin(plugin)
          plugin.status = { state: 'error', error: `Disabled due to repeated errors (${this.errorBudget.getErrors(pluginName).length} in window)`, phase: 'runtime' }
          console.warn(`[plugins] ${pluginName} auto-deactivated due to repeated errors`)
        }
      }
      throw err
    }
  }

  // ── Bundled Plugin Registration ────────────────────────────────────────────

  registerBundledPlugin(
    manifest: PluginManifest,
    module: { activate: (ctx: any) => void | Promise<void>; deactivate?: () => void | Promise<void> }
  ): void {
    // Even trusted/bundled plugins are run through manifest validation so a
    // typo in the manifest (missing name, malformed semver, etc.) is caught
    // at registration time rather than silently activating a broken plugin.
    const validation = validateManifest(manifest)
    if (!validation.valid) {
      throw new Error(`Invalid bundled plugin manifest '${manifest.name}': ${validation.error}`)
    }
    if (this.plugins.has(manifest.name)) {
      throw new Error(`Plugin '${manifest.name}' is already registered`)
    }
    this.plugins.set(manifest.name, {
      manifest,
      path: '<bundled>',
      status: { state: 'validated' },
      module
    })
  }

  // ── Install / Uninstall ────────────────────────────────────────────────────

  installFromPath(sourcePath: string): { success: boolean; name?: string; error?: string } {
    try {
      const manifestPath = path.join(sourcePath, 'plugin-manifest.json')
      const pkgPath = path.join(sourcePath, 'package.json')

      let name: string
      if (fs.existsSync(manifestPath)) {
        name = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')).name
      } else if (fs.existsSync(pkgPath)) {
        name = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')).name
      } else {
        return { success: false, error: 'No plugin-manifest.json or package.json found' }
      }

      // Same protection as discover(): refuse to install a plugin whose name
      // collides with a bundled plugin. The user is asking to drop a folder
      // onto disk, but we won't let it shadow the built-in driver of the
      // same name even if discover() later runs.
      const collidingBundled = this.plugins.get(name)
      if (collidingBundled && collidingBundled.path === '<bundled>') {
        return { success: false, error: `Cannot install: '${name}' is a bundled plugin name` }
      }

      const destDir = path.join(this.getPluginDir(), name)
      if (fs.existsSync(destDir)) {
        fs.rmSync(destDir, { recursive: true })
      }
      fs.cpSync(sourcePath, destDir, { recursive: true })

      // Parse and add only the new plugin (don't clear existing state)
      const manifest = this.parseManifest(destDir, name)
      if (manifest) {
        this.plugins.set(manifest.name, {
          manifest,
          path: destDir,
          status: { state: 'discovered' }
        })
      }
      return { success: true, name }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  }

  installFromZip(zipPath: string): { success: boolean; name?: string; error?: string } {
    const tmpDir = path.join(os.tmpdir(), `verql-plugin-${Date.now()}`)
    try {
      fs.mkdirSync(tmpDir, { recursive: true })
      execFileSync('unzip', ['-o', '-q', zipPath, '-d', tmpDir])
      // The zip may contain a single top-level directory or files at root.
      // Check if there's exactly one subdirectory — if so, install from that.
      const entries = fs.readdirSync(tmpDir).filter(e => fs.statSync(path.join(tmpDir, e)).isDirectory())
      const installDir = entries.length === 1 ? path.join(tmpDir, entries[0]) : tmpDir
      return this.installFromPath(installDir)
    } catch (err) {
      return { success: false, error: (err as Error).message }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  }

  uninstall(name: string): void {
    const plugin = this.plugins.get(name)
    if (!plugin) return
    if (plugin.path === '<bundled>') {
      throw new Error(`Cannot uninstall bundled plugin '${name}'`)
    }
    this.deactivatePlugin(plugin)
    fs.rmSync(plugin.path, { recursive: true, force: true })
    this.plugins.delete(name)
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  private getPluginDir(): string {
    const dir = path.join(app.getPath('userData'), 'plugins')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    return dir
  }

  private logBootReport(report: BootReport): void {
    console.log(`[plugins] Discovered ${report.total} plugins`)
    for (const p of report.plugins) {
      if (p.status.state === 'active') {
        const contribs = p.status.contributions.length > 0
          ? ` (${p.status.contributions.join(', ')})`
          : ''
        console.log(`[plugins] \u2713 ${p.name}: active${contribs} [${p.durationMs}ms]`)
      } else if (p.status.state === 'degraded') {
        console.log(`[plugins] ~ ${p.name}: degraded — ${p.status.error} [${p.durationMs}ms]`)
      } else if (p.status.state === 'error') {
        console.log(`[plugins] \u2717 ${p.name}: error(${p.status.phase}) — ${p.status.error} [${p.durationMs}ms]`)
      }
    }
    console.log(`[plugins] Boot complete: ${report.active} active, ${report.degraded} degraded, ${report.failed} failed`)
  }
}
