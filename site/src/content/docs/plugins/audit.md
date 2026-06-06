---
title: Plugin Audit
description: An audit of what plugins can extend in Verql today — which extension points are fully wired, which are partly wired, and which are still aspirational.
sidebar:
  order: 2
---

A quick audit of what plugins can extend in Verql today, where the seams
are sharp, and where they're still aspirational.

> Plugins are normal Node modules loaded into the **main** process at app
> start. They get a typed `PluginContext` and contribute via registries.
> Their UI surfaces are declared in `manifest.json` and rendered by the
> renderer process via shared resolver hooks.

## Status legend

- ✅ **Fully wired** — declarative manifest + runtime API + UI consumes it
- 🟡 **Partly wired** — manifest entry exists, runtime stub exists, but
  the UI or storage layer doesn't honour it yet
- ⛔ **Not wired** — only a placeholder in `manifest.json`, no real impl

---

## Extension points

### Database adapters ✅
The original use case. A plugin can register a new driver:

```ts
ctx.drivers.register('clickhouse', {
  async connect(profile) { /* return DbAdapter */ }
})
```

…and the connection picker, schema browser, and query runner pick it
up automatically. **All six bundled DB plugins use this**:
`postgresql`, `mysql`, `sqlite`, `mongodb`, `redis`, `snowflake`.

### Connection middleware ✅
Wraps any driver's connect call. Used by the `ssh-tunnel` plugin to open
a tunnel before delegating to the underlying driver.

```ts
ctx.drivers.registerConnectionMiddleware('ssh', {
  async wrap(profile, next) {
    const tunnel = await openTunnel(profile)
    return next({ ...profile, host: '127.0.0.1', port: tunnel.localPort })
  }
})
```

### Connection fields ✅
Add custom inputs to the connection form (e.g. an "Account" field for
Snowflake, or an "SSH key path" field for the tunnel). Declared in
`manifest.json` under `contributes.connectionFields`.

### Exporters & importers ✅
Plugins register file-format readers/writers used by the toolbar
"Export…" and "Import…" actions. `core-formats` ships CSV / JSON /
JSON-Lines / SQL. Adding Parquet or Excel would be a new plugin.

### Type mappers ✅
Declare how column types convert between dialects. e.g. mapping PG
`jsonb` → MongoDB `Object`. The plugin host walks the registry when
schemas are read or queries are written.

### Completion providers ✅
SQL editor completions (column names, function signatures, dialect
keywords). Each DB plugin contributes its own.

### Commands ✅
Register handlers for command-palette entries and keybindings.
`ctx.commands.register('do-thing', handler)` — namespaced under the
plugin name to avoid collisions.

### Panels ✅
Long-form custom UI in the sidebar, secondary sidebar, or bottom dock.
Declared in `manifest.json`, rendered as a React tree the plugin
provides via the UI registry.

### Activity bar / status bar / toolbar / tabs / context menus ✅
Smaller UI surfaces with their own contribution slots. Plugins
declare items in `manifest.json` and resolve their dynamic state
through `ui.registerSlot` / `ui.registerResolver`.

### AI providers, tools, context providers ✅
A plugin can:
- Register a new LLM **provider** (e.g. AWS Bedrock, local Ollama)
- Register a **tool** the assistant can call (`runQuery`, `lookupDoc`)
- Register a **context provider** that injects relevant info into the
  prompt (e.g. "current schema", "recent errors")

`bundled/ai` is the reference implementation.

### Settings contributions ✅
Plugins declare their own settings entries in `manifest.json`. They
appear in the plugin's own panel **and** optionally in a core
Settings category (Editor, Appearance, AI, …).

### Services ✅
A generic dependency-injection lane: any plugin can `provide` a typed
service, any other can `consume` or `onAvailable`. Used by the AI host
to wire providers ↔ tools without hard dependencies.

### IPC + broadcast ✅
A plugin can own typed IPC channels (`ipc.handle('foo:bar', …)`) and
broadcast events to all renderer windows. Channel types live in
`@shared/ipc` so the renderer gets type safety.

---

## What's partly wired

### Themes 🟡

**Manifest:** declared. `contributes.themes: [{ id, name, type }]` is
in [src/main/plugins/types.ts](https://github.com/arshad-shah/verql/blob/main/src/main/plugins/types.ts#L37).

**Runtime:** **no registry**. Themes are hardcoded as CSS files under
[src/renderer/src/primitives/theme/themes/](https://github.com/arshad-shah/verql/blob/main/src/renderer/src/primitives/theme/themes/),
imported into [globals.css](https://github.com/arshad-shah/verql/blob/main/src/renderer/src/styles/globals.css),
and the available-themes list lives in [@shared/settings](https://github.com/arshad-shah/verql/blob/main/shared/settings.ts).

**What's missing for full plugin theming:**

1. Extend `ThemeContribution` to carry actual tokens (a structured object
   like `{ '--color-bg-primary': '#0b0f16', ... }`), not just `id` /
   `name` / `type`.
2. Add a `ThemeRegistry` to the SDK. Plugins call
   `ctx.themes.register({ id, name, type, tokens })` at activation.
3. Add an IPC channel `theme:list` so the renderer can fetch
   plugin-contributed themes alongside the built-ins.
4. `ThemeProvider` merges built-in + plugin themes, and on theme switch
   injects the registered tokens into a `<style data-theme-id>` tag
   that targets `[data-theme="<id>"]`.
5. Move the three built-in themes (`nightshift`, `lab`, `inkpaper`)
   into a `bundled/core-themes` plugin. They register via the SDK
   like any third-party theme would — eats the dogfood.

After that, a third-party plugin can ship `Nord+`, `One Dark Pro`,
`Atom One`, anything, with no host-side change.

### Editor themes (Monaco) 🟡
**Today:** mapping from app theme → Monaco theme is hardcoded in
[lib/monaco-themes.ts](https://github.com/arshad-shah/verql/blob/main/src/renderer/src/lib/monaco-themes.ts).
**Should:** be derived from the same theme contribution above. When a
plugin registers a theme, it can also supply a Monaco token table; the
host installs it via `monaco.editor.defineTheme` at activation.

### Per-plugin keybindings 🟡
Commands have an optional `keybinding` field in the manifest, but the
keybinding store currently lives entirely in user settings and isn't
merged with plugin contributions. Fix: at activation, merge plugin
keybindings into the keybinding list (deduplicated, plugin entries
flagged so users can rebind).

---

## What's not wired

### Drag-and-drop providers ⛔
Plugins can't currently say "I handle dropped files of type X." E.g.
dragging a `.sqlite` file onto the window doesn't ask the SQLite
plugin to open it.

### Result-grid cell renderers ⛔
Custom cell renderers (image preview, geo-shape, sparkline) would be a
small contribution surface. The grid currently does its own type
detection.

### Custom welcome / empty-state widgets ⛔
The empty-state hero is a fixed component. A plugin like "AWS RDS
discovery" might want to drop a tile there ("Connect to your AWS
account").

### Background tasks / agents ⛔
A plugin can register commands, but there's no lifecycle for
long-lived background workers (e.g. a "watch this table for changes"
worker that emits events). Today this would have to be home-rolled
inside a plugin via `setInterval` + `broadcast`.

### Notification provider ⛔
The toast store lives in the renderer. A plugin can broadcast its own
"please show this toast" event, but there's no typed API.

### Localisation ⛔
All strings are English-only. Adding a plugin contribution surface for
locale files would be a small addition.

---

## Quick guide: how to write a plugin

`src/main/plugins/bundled/<name>/`:

```
manifest.json          # contributions
index.ts               # activate(ctx) entry point
```

`manifest.json`:
```json
{
  "name": "my-plugin",
  "version": "0.1.0",
  "displayName": "My Plugin",
  "description": "What this does",
  "main": "./index.ts",
  "contributes": {
    "drivers": [{ "id": "myproto", "name": "My Protocol" }],
    "commands": [{ "id": "do-thing", "title": "Do the thing" }]
  }
}
```

`index.ts`:
```ts
import type { PluginContext } from '../../sdk'

export async function activate(ctx: PluginContext) {
  ctx.drivers.register('myproto', { /* adapter */ })
  ctx.commands.register('do-thing', async () => { /* … */ })
}

export async function deactivate() {
  // optional cleanup — anything pushed to ctx.subscriptions is
  // auto-disposed for you
}
```

Drop it in, restart the app, it lights up in the plugin pane.

---

## Recommended priorities

If you have an afternoon to push the plugin system forward, the highest
value in order:

1. **Themes** as real contributions (👈 unlocks a community theme
   ecosystem, the most-asked-for thing in DB clients).
2. **Result-grid renderers** (small surface, big visible win).
3. **Drag-and-drop providers** (makes "open a .sqlite file" feel
   native).
4. **Per-plugin keybindings** (low effort, high QoL).
5. **Background tasks** (the most ambitious; defer until something
   actually needs it).
