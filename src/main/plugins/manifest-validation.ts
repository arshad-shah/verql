// Pure plugin-manifest validation + filesystem-safety helpers, split out of
// plugin-host.ts so the boot coordinator stays focused on lifecycle. No Electron
// or host state — just shape checks and a symlink walker. Covered by
// tests/unit/manifest-validation.test.ts and the audit/plugin-* security tests.
import fs from 'fs'
import path from 'path'
import type { PluginManifest } from './types'
import { ALL_PERMISSIONS, isPluginPermission } from './sdk/permissions'

const NAME_PATTERN = /^[a-z0-9-]+$/
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/

/** Valid plugin-name pattern. Exported because the installer also uses it to
 *  defend the on-disk destination path (a name becomes a path segment). */
export { NAME_PATTERN }

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

  if (manifest.permissions !== undefined) {
    if (!Array.isArray(manifest.permissions)) {
      return { valid: false, error: 'permissions must be an array of capability strings' }
    }
    for (const p of manifest.permissions) {
      if (!isPluginPermission(p)) {
        return {
          valid: false,
          error: `Unknown permission "${String(p)}". Allowed: ${ALL_PERMISSIONS.join(', ')}`,
        }
      }
    }
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
  if (c.formatters) {
    for (const f of c.formatters) {
      if (!f.id) return { valid: false, error: 'Formatter contribution missing required field: id' }
      if (!f.name) return { valid: false, error: 'Formatter contribution missing required field: name' }
    }
  }

  return { valid: true }
}

/**
 * Walk a directory tree (using lstat, so it never follows links) and return
 * the path of the first symbolic link found, or null. Used to refuse plugin
 * installs that contain symlinks — a copy of which could escape the plugin
 * sandbox. Depth-limited to avoid pathological/looping inputs.
 */
export function findSymlink(root: string, depth = 0): string | null {
  if (depth > 32) return null
  let stat: fs.Stats
  try {
    stat = fs.lstatSync(root)
  } catch {
    return null
  }
  if (stat.isSymbolicLink()) return root
  if (!stat.isDirectory()) return null
  let entries: string[]
  try {
    entries = fs.readdirSync(root)
  } catch {
    return null
  }
  for (const entry of entries) {
    const found = findSymlink(path.join(root, entry), depth + 1)
    if (found) return found
  }
  return null
}
