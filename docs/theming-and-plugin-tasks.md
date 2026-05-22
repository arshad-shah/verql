# Theming + Plugin gap-closing — tasks

Working doc tracking the refactor that moves theming into the plugin
system and closes the remaining gaps catalogued in
[plugin-audit.md](./plugin-audit.md). Cross off as we land them.

## Validation summary

Audit was correct on every claim. SDK shape lives in
[src/main/plugins/sdk/index.ts](../src/main/plugins/sdk/index.ts) and
[types.ts](../src/main/plugins/sdk/types.ts). Themes are the biggest
missing piece: `ThemeContribution` exists in the manifest schema but
there's no `ctx.themes` registry, no IPC, and the actual themes are
hard-coded CSS files registered via `AVAILABLE_THEMES` in
[shared/settings.ts](../shared/settings.ts).

## Phase 1 — Theme registry (the keystone)

- [x] Extend `ThemeContribution` with token tables (semantic CSS vars + Monaco rules)
- [x] Add `ThemeRegistryImpl` + `ctx.themes.register(...)` to the SDK
- [x] Wire registry into `BootDeps` + `createPluginContext`
- [x] Plugin-host validates `contributes.themes`
- [x] IPC channel `themes:list` exposes built-in + plugin themes to renderer
- [x] `ThemeProvider` fetches plugin themes, injects `<style data-theme-id>` per registered theme
- [x] Renderer-side Monaco theme defs come from the registry (no more hardcoded `monaco-themes.ts` table)
- [x] Move `nightshift`/`lab`/`inkpaper` into a bundled `core-themes` plugin (dogfood the API)
- [x] Legacy CSS-file themes (dark/light/midnight/dracula/nord/solarized/catppuccin) also moved into `core-themes`

## Phase 2 — Component variants honour theme tokens

Top offenders from the primitives audit. Each must use semantic
tokens (`var(--color-*)`) so theme switching takes full effect.

- [x] [Button.tsx](../src/renderer/src/primitives/forms/Button.tsx) — replace `text-white`, raw `rgba(...)` hover/active layers with theme-scoped vars
- [x] [Switch.tsx](../src/renderer/src/primitives/forms/Switch.tsx) — thumb + shadow off raw whites/blacks
- [x] [Radio.tsx](../src/renderer/src/primitives/forms/Radio.tsx) — checked dot uses inverse token
- [x] [DatePicker.tsx](../src/renderer/src/primitives/forms/DatePicker.tsx) — selected-state text
- [x] [ColorPicker.tsx](../src/renderer/src/primitives/forms/ColorPicker.tsx) — presets are user data, leave alone; UI chrome onto tokens

## Phase 3 — Quick wins from the audit

- [x] Per-plugin keybindings — merge `contributes.commands[].keybinding` into the keybinding store
- [x] Notification provider API — typed `ctx.notifications.show(...)` instead of ad-hoc `broadcast('toast', …)`

## Phase 4 — New contribution surfaces

- [x] Drag-and-drop providers — `ctx.dragDrop.register({ extensions, handler })`, fully wired: renderer's `window.addEventListener('drop')` forwards to main, which routes to the matching provider
- [x] Manifest surfaces: `contributes.dragDrop`, `contributes.welcomeWidgets`, `contributes.cellRenderers` accepted by the host
- [x] Result-grid cell renderers — manifest entry + slot infrastructure available via existing `ctx.ui.registerSlot('cell-renderer:<type>', …)`; grid integration remains a follow-up
- [x] Welcome / empty-state widgets — manifest entry + slot infrastructure available via `ctx.ui.registerSlot('welcome', …)`; WelcomeScreen integration remains a follow-up

## Phase 5 — Deferred (out of session scope)

- [ ] Background tasks / agents — needs a worker lifecycle proposal first; defer
- [ ] Localisation — touches every string in the app; defer

## Testing checklist

- [x] `tsc --noEmit` clean for both `tsconfig.node.json` (main) and `tsconfig.web.json` (renderer)
- [x] Test suite green for plugin-host, bundled-plugins, export-import-plugin-driven, ipc-channels-coverage (1103/1113 overall — 2 pre-existing sqlite-native failures unrelated to this work)
- [ ] App boots in dev, theme switcher renders bundled + plugin themes (manual)
- [ ] Each built-in theme paints buttons/switches/radios consistently (manual)
- [ ] Monaco editor adopts the active theme via the registry (manual)
- [ ] Plugin keybinding visible in settings + actually fires (manual)
- [ ] Toast appears when a plugin calls `notifications.show` (manual)
- [ ] Dropping a file invokes a matching plugin's drag-drop provider (manual)
