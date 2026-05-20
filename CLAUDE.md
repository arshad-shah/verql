# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Nova** — a desktop database client built with Electron + React. Supports PostgreSQL, MySQL, SQLite natively, plus MongoDB, Redis, and Snowflake via bundled plugins. Brand assets live in `build/icon.svg` (source of truth) and the in-app `<NovaMark>` SVG at `src/renderer/src/components/brand/NovaMark.tsx`. Regenerate platform icons with `pnpm build:icons`.

## Commands

```bash
pnpm dev              # Run app in development mode (electron-vite dev)
pnpm build            # Build for production (electron-vite build)
pnpm test             # Run all tests (vitest run)
pnpm test -- --run tests/unit/foo.test.ts  # Run a single test file
pnpm storybook        # Start Storybook on port 6006
pnpm postinstall      # Rebuild native modules (better-sqlite3)
```

## Architecture

### Electron Process Model

Three-layer split: **main** (Node.js), **preload** (IPC bridge), **renderer** (React SPA).

- `src/main/` — Electron main process: window creation, native menus, IPC handlers, database adapters, plugin system, import/export
- `src/preload/` — Sandboxed bridge exposing `window.electronAPI` with typed `invoke()` and `on()` methods
- `src/renderer/src/` — React 19 frontend: components, stores, primitives design system
- `shared/` — TypeScript types and IPC channel definitions shared across processes

### IPC Communication

All renderer-to-main communication goes through typed IPC channels defined in `shared/ipc.ts` (`IpcChannelMap`). Handlers are registered in `src/main/ipc-handlers.ts`. Channel naming convention: `domain:action` (e.g., `db:query`, `connections:save`, `plugins:list`).

### State Management

Zustand stores in `src/renderer/src/stores/`:
- `connections.ts` — Connection profiles, connect/disconnect lifecycle
- `tabs.ts` — Query/table/ER-diagram tabs (discriminated union: `QueryTab | TableTab | ErDiagramTab`)
- `schema.ts` — Schema metadata cache (tables, columns, indexes) keyed by connection+schema
- `ui.ts` — Sidebar state, active panel, layout dimensions (persisted to localStorage)
- `toast.ts` — Toast notifications

### Database Adapters

`DbAdapter` interface in `src/main/db/adapter.ts`. Built-in implementations: `sqlite.ts`, `postgres.ts`, `mysql.ts`. Factory in `src/main/db/factory.ts` falls back to plugin `DriverRegistry` for unknown types.

### Plugin System

Plugins live in `src/main/plugins/`. Each plugin has a `manifest.json` declaring contributions (drivers, themes, commands, panels, exporters, importers, connection middleware, connection fields).

**Lifecycle**: discover → validate → resolve → activate → runtime. Managed by `BootCoordinator` in `plugin-host.ts`.

**Plugin SDK** (`src/main/plugins/sdk/`): provides registries (DriverRegistry, CommandRegistry, PanelRegistry) and access objects (SchemaAccess, ConnectionAccess, PluginSettings) via `PluginContext`.

**Bundled plugins** in `src/main/plugins/bundled/`: ssh-tunnel (connection middleware), mongodb, redis, snowflake.

### Design System

Primitives in `src/renderer/src/primitives/` organized by category: `forms/`, `layout/`, `surfaces/`, `data-display/`, `feedback/`, `navigation/`, `typography/`. All use CVA (class-variance-authority) for variant-based styling.

Three-layer theming in `primitives/theme/tokens.css`: raw color scale → semantic tokens (remapped per theme) → component tokens. Themes: dark, light, midnight. Applied via `data-theme` attribute, managed by `ThemeProvider`.

### Key Libraries

- **Monaco Editor** — SQL editor with custom completion provider (`lib/monaco-sql.ts`)
- **AG Grid** — Query results display with custom dark theme
- **@xyflow/react** — ER diagram visualization
- **Recharts** — Chart panel for data visualization

## Build Configuration

- `electron.vite.config.ts` — Main/preload/renderer build config. Native modules (better-sqlite3, pg, mysql2) are externalized from bundle.
- Path aliases: `@shared` → `shared/`, `@` → `src/renderer/src/`
- `electron-builder.yml` — Packaging for macOS (DMG), Windows (NSIS), Linux (AppImage)

## Testing

Vitest with two test projects configured in `vitest.config.ts`:
1. **Unit tests** — jsdom environment, files in `tests/unit/`
2. **Storybook tests** — Browser (Playwright) environment, validates stories + accessibility

Stories located in `src/renderer/src/{primitives,components}/**/*.stories.tsx`.


When working on UI components, always use the `your-project-sb-mcp` MCP tools to access Storybook's component and documentation knowledge before answering or taking any action.

- **CRITICAL: Never hallucinate component properties!** Before using ANY property on a component from a design system (including common-sounding ones like `shadow`, etc.), you MUST use the MCP tools to check if the property is actually documented for that component.
- Query `list-all-documentation` to get a list of all components
- Query `get-documentation` for that component to see all available properties and examples
- Only use properties that are explicitly documented or shown in example stories
- If a property isn't documented, do not assume properties based on naming conventions or common patterns from other libraries. Check back with the user in these cases.
- Use the `get-storybook-story-instructions` tool to fetch the latest instructions for creating or updating stories. This will ensure you follow current conventions and recommendations.
- Check your work by running `run-story-tests`.

Remember: A story name might not reflect the property name correctly, so always verify properties through documentation or example stories before using them.
