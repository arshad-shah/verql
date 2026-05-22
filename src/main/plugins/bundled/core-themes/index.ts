import type { PluginContext } from '../../sdk/types'
import type { PluginManifest } from '../../types'
import { CORE_THEMES } from './themes-data'

/**
 * Core themes plugin.
 *
 * Ships nine built-in themes (Lab, Ink & Paper plus the legacy/community
 * themes) as contributions through the same registry any third-party plugin
 * uses. Nightshift is intentionally NOT here — it's the app's brand identity
 * and lives in the shell (`primitives/theme/baseline.css` + the renderer
 * `BASELINE_NIGHTSHIFT` entry). The host has zero hardcoded list for any
 * other theme.
 */
export const manifest: PluginManifest = {
  name: 'verql-plugin-core-themes',
  version: '1.0.0',
  displayName: 'Core Themes',
  description: 'Built-in theme set: Lab, Ink & Paper, Dark, Light, Midnight, Dracula, Nord, Solarized, Catppuccin.',
  main: 'index.js',
  contributes: {
    themes: CORE_THEMES.map((t) => ({
      id: t.id,
      name: t.name,
      type: t.type,
      preview: t.preview
    }))
  }
}

export function activate(ctx: PluginContext): void {
  for (const theme of CORE_THEMES) {
    ctx.themes.register(theme)
  }
}
