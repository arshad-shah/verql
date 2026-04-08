import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import type { PluginManifest, LoadedPlugin } from './types'

const plugins = new Map<string, LoadedPlugin>()

function getPluginDir(): string {
  const dir = path.join(app.getPath('userData'), 'plugins')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function getLoadedPlugins(): LoadedPlugin[] {
  return Array.from(plugins.values())
}

export function loadPlugins(): void {
  const dir = getPluginDir()
  plugins.clear()

  let entries: string[]
  try {
    entries = fs.readdirSync(dir)
  } catch {
    return
  }

  for (const entry of entries) {
    const pluginPath = path.join(dir, entry)
    const stat = fs.statSync(pluginPath)
    if (!stat.isDirectory()) continue

    const manifestPath = path.join(pluginPath, 'plugin-manifest.json')
    if (!fs.existsSync(manifestPath)) {
      // Try package.json with dbstudio-plugin keyword
      const pkgPath = path.join(pluginPath, 'package.json')
      if (!fs.existsSync(pkgPath)) continue
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
        if (!pkg.keywords?.includes('dbstudio-plugin')) continue
        const manifest: PluginManifest = {
          name: pkg.name,
          version: pkg.version ?? '0.0.0',
          displayName: pkg.displayName ?? pkg.name,
          description: pkg.description ?? '',
          main: pkg.main ?? 'index.js',
          contributes: pkg.contributes ?? {}
        }
        plugins.set(manifest.name, { manifest, path: pluginPath, active: false })
      } catch (err) {
        plugins.set(entry, {
          manifest: { name: entry, version: '0.0.0', displayName: entry, description: '', main: '', contributes: {} },
          path: pluginPath, active: false, error: `Invalid package.json: ${(err as Error).message}`
        })
      }
      continue
    }

    try {
      const manifest: PluginManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
      plugins.set(manifest.name, { manifest, path: pluginPath, active: false })
    } catch (err) {
      plugins.set(entry, {
        manifest: { name: entry, version: '0.0.0', displayName: entry, description: '', main: '', contributes: {} },
        path: pluginPath, active: false, error: `Invalid manifest: ${(err as Error).message}`
      })
    }
  }
}

export function activatePlugin(name: string): { success: boolean; error?: string } {
  const plugin = plugins.get(name)
  if (!plugin) return { success: false, error: 'Plugin not found' }
  if (plugin.active) return { success: true }

  try {
    const mainPath = path.join(plugin.path, plugin.manifest.main)
    if (fs.existsSync(mainPath)) {
      const mod = require(mainPath)
      if (typeof mod.activate === 'function') {
        mod.activate()
      }
    }
    plugin.active = true
    return { success: true }
  } catch (err) {
    plugin.error = (err as Error).message
    return { success: false, error: plugin.error }
  }
}

export function deactivatePlugin(name: string): void {
  const plugin = plugins.get(name)
  if (!plugin || !plugin.active) return

  try {
    const mainPath = path.join(plugin.path, plugin.manifest.main)
    if (fs.existsSync(mainPath)) {
      const mod = require(mainPath)
      if (typeof mod.deactivate === 'function') {
        mod.deactivate()
      }
    }
  } catch {
    // ignore deactivation errors
  }
  plugin.active = false
}

export function installPluginFromPath(sourcePath: string): { success: boolean; name?: string; error?: string } {
  try {
    const pkgPath = path.join(sourcePath, 'package.json')
    const manifestPath = path.join(sourcePath, 'plugin-manifest.json')

    let name: string
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
      name = manifest.name
    } else if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
      name = pkg.name
    } else {
      return { success: false, error: 'No plugin-manifest.json or package.json found' }
    }

    const destDir = path.join(getPluginDir(), name)
    if (fs.existsSync(destDir)) {
      fs.rmSync(destDir, { recursive: true })
    }
    fs.cpSync(sourcePath, destDir, { recursive: true })

    loadPlugins() // reload
    return { success: true, name }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export function uninstallPlugin(name: string): void {
  deactivatePlugin(name)
  const plugin = plugins.get(name)
  if (!plugin) return
  fs.rmSync(plugin.path, { recursive: true, force: true })
  plugins.delete(name)
}
