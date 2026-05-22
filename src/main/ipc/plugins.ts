import fs from 'fs'
import path from 'path'
import { BrowserWindow, dialog } from 'electron'
import { PluginBootCoordinator } from '../plugins/plugin-host'
import { UIRegistryImpl } from '../plugins/sdk/ui-registry'
import { CompletionRegistryImpl } from '../plugins/sdk/completion-registry'
import { CommandRegistryImpl } from '../plugins/sdk/command-registry'
import type { IpcContext, Handle } from './context'

export interface PluginsHandlerDeps {
  uiRegistry: UIRegistryImpl
  completionRegistry: CompletionRegistryImpl
  commandRegistry: CommandRegistryImpl
  pluginCoordinator: PluginBootCoordinator
}

function resolvePluginIcon(plugin: { manifest: { icon?: string }; path: string }): string | undefined {
  if (!plugin.manifest.icon || plugin.path === '<bundled>') return undefined
  const iconPath = path.resolve(plugin.path, plugin.manifest.icon)
  if (!fs.existsSync(iconPath)) return undefined
  const ext = path.extname(iconPath).toLowerCase()
  const mime = ext === '.svg' ? 'image/svg+xml' : ext === '.png' ? 'image/png' : 'image/jpeg'
  const data = fs.readFileSync(iconPath)
  return `data:${mime};base64,${data.toString('base64')}`
}

export function registerPluginHandlers(
  ctx: IpcContext,
  handle: Handle,
  deps: PluginsHandlerDeps
): void {
  const { uiRegistry, completionRegistry, commandRegistry, pluginCoordinator } = deps

  handle('plugins:list', async () => {
    return pluginCoordinator.getLoadedPlugins().map(p => ({
      name: p.manifest.name,
      displayName: p.manifest.displayName,
      version: p.manifest.version,
      description: p.manifest.description,
      bundled: p.path === '<bundled>',
      icon: resolvePluginIcon(p),
      status: p.status as { state: string; error?: string; phase?: string; contributions?: string[] },
      contributions: p.status.state === 'active' ? p.status.contributions
        : p.status.state === 'degraded' ? p.status.contributions
        : []
    }))
  })

  const broadcastLifecycle = (
    name: string,
    event: 'activated' | 'deactivated' | 'installed' | 'uninstalled'
  ) => {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) win.webContents.send('plugins:lifecycle', { name, event })
    }
  }

  handle('plugins:activate', async (name) => {
    const plugin = pluginCoordinator.getPlugin(name)
    if (!plugin) return { success: false, error: 'Plugin not found' }
    const result = await pluginCoordinator.activatePlugin(plugin)
    if (result.status.state === 'error') {
      return { success: false, error: result.status.error }
    }
    broadcastLifecycle(name, 'activated')
    return { success: true }
  })

  handle('plugins:deactivate', async (name) => {
    const plugin = pluginCoordinator.getPlugin(name)
    if (plugin) {
      await pluginCoordinator.deactivatePlugin(plugin, { persist: true })
      broadcastLifecycle(name, 'deactivated')
    }
  })

  handle('plugins:install-from-path', async (pluginPath) => {
    const result = await pluginCoordinator.installFromPath(pluginPath)
    if (result?.success && result.name) broadcastLifecycle(result.name, 'installed')
    return result
  })
  handle('plugins:install-from-zip', async (zipPath) => {
    const result = await pluginCoordinator.installFromZip(zipPath)
    if (result?.success && result.name) broadcastLifecycle(result.name, 'installed')
    return result
  })

  handle('plugins:open-install-dialog', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select Plugin',
      properties: ['openFile', 'openDirectory'],
      filters: [{ name: 'Plugin Archive', extensions: ['zip'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  handle('plugins:uninstall', async (name) => {
    pluginCoordinator.uninstall(name)
    broadcastLifecycle(name, 'uninstalled')
  })
  handle('plugins:errors', async (name) => pluginCoordinator.getErrorBudget().getErrors(name))

  handle('plugins:get-settings', async (name) => {
    const plugin = pluginCoordinator.getPlugin(name)
    if (!plugin) return { schema: [], values: {} }
    const schema = plugin.manifest.contributes.settings ?? []
    const pluginSettings = (ctx.configStore.getSettingsCategory('plugins') as Record<string, unknown>)?.[name] as Record<string, unknown> | undefined
    const values: Record<string, unknown> = {}
    for (const setting of schema) {
      const stored = pluginSettings?.[setting.key]
      values[setting.key] = stored !== undefined ? stored : setting.default
    }
    return { schema, values }
  })

  handle('plugins:set-setting', async (name, key, value) => {
    ctx.configStore.setSetting(`plugins.${name}.${key}`, value)
  })

  handle('plugins:get-categorized-settings', async (category) => {
    const result: Array<{
      pluginName: string
      pluginDisplayName: string
      schema: NonNullable<import('../plugins/types').PluginManifest['contributes']['settings']>
      values: Record<string, unknown>
    }> = []
    for (const plugin of pluginCoordinator.getLoadedPlugins()) {
      // Only surface contributions from plugins the user has running. A
      // disabled/errored plugin's settings vanish from every core category.
      if (plugin.status.state !== 'active' && plugin.status.state !== 'degraded') continue
      const schema = (plugin.manifest.contributes.settings ?? []).filter(
        (s) => s.category === category
      )
      if (schema.length === 0) continue
      const stored = (ctx.configStore.getSettingsCategory('plugins') as Record<string, unknown>)?.[plugin.manifest.name] as Record<string, unknown> | undefined
      const values: Record<string, unknown> = {}
      for (const s of schema) {
        values[s.key] = stored?.[s.key] ?? s.default
      }
      result.push({
        pluginName: plugin.manifest.name,
        pluginDisplayName: plugin.manifest.displayName,
        schema,
        values
      })
    }
    return result
  })

  handle('plugins:get-commands', async () => {
    const result: { pluginId: string; pluginDisplayName: string; commandId: string; title: string; keybinding?: string }[] = []
    for (const plugin of pluginCoordinator.getLoadedPlugins()) {
      if (plugin.status.state !== 'active' && plugin.status.state !== 'degraded') continue
      for (const cmd of plugin.manifest.contributes.commands ?? []) {
        result.push({
          pluginId: plugin.manifest.name,
          pluginDisplayName: plugin.manifest.displayName,
          commandId: cmd.id,
          title: cmd.title,
          keybinding: cmd.keybinding
        })
      }
    }
    return result
  })

  handle('plugins:connection-fields', async () => {
    return ctx.driverRegistry.getDriverIds().map(id => {
      const factory = ctx.driverRegistry.get(id)!
      return { driverId: id, driverName: id, connectionFields: factory.connectionFields }
    })
  })

  handle('plugins:middleware-fields', async () => {
    const fields: { key: string; label: string; type: string; required?: boolean; default?: string | number | boolean; group?: string }[] = []
    for (const plugin of pluginCoordinator.getLoadedPlugins()) {
      if (plugin.manifest.contributes.connectionFields) {
        fields.push(...plugin.manifest.contributes.connectionFields)
      }
    }
    return fields
  })

  // ─── Plugin UI ──────────────────────────────────────────────────────────────
  handle('plugins:ui:get-contributions', async (surface) => {
    const contributions: import('@shared/plugin-ui-types').UIContribution[] = []
    const getDisplayName = (pluginName: string) =>
      pluginCoordinator.getPlugin(pluginName)?.manifest.displayName ?? pluginName

    if (surface === 'statusBar') {
      for (const entry of uiRegistry.getAllStatusBars()) {
        const manifest = pluginCoordinator.getPlugin(entry.pluginName)?.manifest.contributes.statusBar?.find(s => s.id === entry.id)
        contributions.push({
          pluginId: entry.pluginName,
          pluginName: getDisplayName(entry.pluginName),
          surface: 'statusBar',
          contributionId: entry.id,
          widgets: entry.widgets,
          meta: (manifest ?? {}) as Record<string, unknown>
        })
      }
    }

    if (surface === 'toolbar') {
      for (const entry of uiRegistry.getAllToolbars()) {
        const manifest = pluginCoordinator.getPlugin(entry.pluginName)?.manifest.contributes.toolbar?.find(s => s.id === entry.id)
        contributions.push({
          pluginId: entry.pluginName,
          pluginName: getDisplayName(entry.pluginName),
          surface: 'toolbar',
          contributionId: entry.id,
          widgets: entry.widgets,
          meta: (manifest ?? {}) as Record<string, unknown>
        })
      }
    }

    if (surface === 'panels') {
      for (const entry of uiRegistry.getAllPanels()) {
        const manifest = pluginCoordinator.getPlugin(entry.pluginName)?.manifest.contributes.panels?.find(p => p.id === entry.id)
        contributions.push({
          pluginId: entry.pluginName,
          pluginName: getDisplayName(entry.pluginName),
          surface: 'panels',
          contributionId: entry.id,
          widgets: entry.widgets,
          meta: (manifest ?? {}) as Record<string, unknown>
        })
      }
    }

    if (surface === 'tabs') {
      for (const entry of uiRegistry.getAllTabs()) {
        contributions.push({
          pluginId: entry.pluginName,
          pluginName: getDisplayName(entry.pluginName),
          surface: 'tabs',
          contributionId: entry.id,
          widgets: entry.widgets,
          meta: {}
        })
      }
    }

    if (surface === 'slot') {
      for (const entry of uiRegistry.getAllSlots()) {
        contributions.push({
          pluginId: entry.pluginName,
          pluginName: getDisplayName(entry.pluginName),
          surface: 'slot',
          contributionId: entry.contributionId,
          slotId: entry.slotId,
          widgets: entry.widgets,
          meta: {}
        })
      }
    }

    for (const plugin of pluginCoordinator.getLoadedPlugins()) {
      if (plugin.status.state !== 'active' && plugin.status.state !== 'degraded') continue

      if (surface === 'contextMenu') {
        for (const menu of plugin.manifest.contributes.contextMenus ?? []) {
          contributions.push({
            pluginId: plugin.manifest.name,
            pluginName: plugin.manifest.displayName,
            surface: 'contextMenu',
            contributionId: menu.id,
            widgets: [],
            meta: { target: menu.target, label: menu.label, command: menu.command }
          })
        }
      }

      if (surface === 'activityBar') {
        for (const bar of plugin.manifest.contributes.activityBar ?? []) {
          contributions.push({
            pluginId: plugin.manifest.name,
            pluginName: plugin.manifest.displayName,
            surface: 'activityBar',
            contributionId: bar.id,
            widgets: [],
            meta: { title: bar.title, icon: bar.icon, zone: bar.zone ?? 'top' }
          })
        }
      }
    }

    return contributions
  })

  handle('plugins:ui:resolve', async (pluginId, resolverId, context) => {
    return pluginCoordinator.safeCallWithBudget(pluginId, () =>
      uiRegistry.resolve(resolverId, context)
    )
  })

  handle('plugins:ui:action', async (pluginId, commandId, payload) => {
    await pluginCoordinator.safeCallWithBudget(pluginId, () =>
      commandRegistry.execute(commandId, undefined, payload)
    )
  })

  handle('plugins:completions', async (driverId, connectionId, context) => {
    const plugin = pluginCoordinator.getLoadedPlugins().find(
      p => p.manifest.contributes.drivers?.some(d => d.id === driverId)
    )
    if (!plugin) return []
    try {
      return await completionRegistry.getCompletions(plugin.manifest.name, connectionId, context)
    } catch {
      return []
    }
  })

  uiRegistry.onChange(() => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) win.webContents.send('plugins:ui:contributions-changed')
  })
}
