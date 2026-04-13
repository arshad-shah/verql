# Plugin Theme Infrastructure + Test Theme

## Overview

Wire up theme contributions so plugins can register custom themes. Build a "Rosewood" test theme plugin to verify the full install-to-activate pipeline.

## Theme Registry (main process)

### `src/main/plugins/sdk/theme-registry.ts`

New registry class `ThemeRegistryImpl`:

```ts
interface ThemeEntry {
  id: string
  css: string
}

class ThemeRegistryImpl {
  private themes: Map<string, ThemeEntry>
  register(id: string, css: string): Disposable  // stores css text
  has(id: string): boolean
  getAll(): ThemeEntry[]
}
```

### SDK integration

Add `ThemeRegistry` interface to `src/main/plugins/sdk/types.ts`:

```ts
export interface ThemeRegistry {
  register(id: string, css: string): Disposable
}
```

Add `themes: ThemeRegistry` to `PluginContext` interface.

### `src/main/plugins/sdk/index.ts`

Update `createPluginContext` to accept and expose the theme registry (same scoped-wrapper pattern as drivers/commands/panels).

Update `ContextDeps` to include `themeRegistry: ThemeRegistryImpl`.

### `src/main/plugins/plugin-host.ts`

- Instantiate `ThemeRegistryImpl` alongside existing registries
- Pass it to `createPluginContext`
- In `verifyContributions`: check `themeRegistry.has(id)` for each declared `contributes.themes[]` entry

## IPC: renderer access to plugin themes

### `shared/ipc.ts`

New channel:

```ts
'plugins:get-themes': {
  args: []
  return: { id: string; name: string; type: 'dark' | 'light'; css: string }[]
}
```

### `src/main/ipc-handlers.ts`

Handler merges manifest metadata (name, type) with registry CSS:

```ts
handle('plugins:get-themes', async () => {
  // For each plugin with theme contributions, match declared themes
  // against registered CSS from themeRegistry
})
```

## Renderer: dynamic theme loading

### `src/renderer/src/primitives/theme/ThemeProvider.tsx`

- On mount, call `plugins:get-themes` IPC to fetch plugin themes
- For each plugin theme: inject a `<style>` element into `<head>` containing the CSS
- Expand `AVAILABLE_THEMES` to be dynamic (base themes + plugin themes)
- Clean up injected `<style>` elements on unmount
- The `Theme` type becomes `string` instead of a narrow union (plugin themes have arbitrary IDs)

### Theme picker (settings)

The Appearance settings category reads themes from `useTheme()`. Since plugin themes are added to the available list, they appear automatically in the picker.

## Test plugin: Rosewood

### Directory structure

```
test-plugins/rosewood/
  plugin-manifest.json
  index.js
  rosewood.css
```

### `plugin-manifest.json`

```json
{
  "name": "rosewood-theme",
  "version": "1.0.0",
  "displayName": "Rosewood",
  "description": "A warm, reddish-brown dark theme",
  "main": "index.js",
  "contributes": {
    "themes": [
      { "id": "rosewood", "name": "Rosewood", "type": "dark" }
    ]
  }
}
```

### `index.js`

Reads `rosewood.css` from its own directory and registers it:

```js
const fs = require('fs')
const path = require('path')

exports.activate = function(ctx) {
  const css = fs.readFileSync(path.join(__dirname, 'rosewood.css'), 'utf-8')
  ctx.themes.register('rosewood', css)
}
```

### `rosewood.css`

A `[data-theme="rosewood"] { ... }` block defining all semantic tokens with warm reddish-brown palette.

## File changes summary

1. **Create** `src/main/plugins/sdk/theme-registry.ts` -- ThemeRegistryImpl
2. **Modify** `src/main/plugins/sdk/types.ts` -- add ThemeRegistry interface to PluginContext
3. **Modify** `src/main/plugins/sdk/index.ts` -- wire ThemeRegistry into createPluginContext
4. **Modify** `src/main/plugins/plugin-host.ts` -- instantiate registry, pass to context, verify themes
5. **Modify** `shared/ipc.ts` -- add `plugins:get-themes` channel
6. **Modify** `src/main/ipc-handlers.ts` -- add handler
7. **Modify** `src/renderer/src/primitives/theme/ThemeProvider.tsx` -- dynamic plugin themes
8. **Create** `test-plugins/rosewood/` -- test theme plugin (3 files)

## Out of scope

- Hot-reloading themes when a plugin is activated/deactivated mid-session (requires app restart or manual refresh for now)
- Theme preview thumbnails
- Theme editor UI
