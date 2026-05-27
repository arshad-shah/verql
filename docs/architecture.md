# Architecture

Verql is a desktop database client built on **Electron + React**. The guiding
principle is **orchestrator + plugins**: `src/main/` is a thin orchestrator
(windows, IPC, plugin host, config), and everything dialect- or format-specific
— database drivers, import/export formats, themes, the AI assistant — lives in a
plugin under `src/main/plugins/bundled/`. Adding a database type or file format
means writing a plugin, not editing the core.

- [Process model](#process-model)
- [The shared boundary](#the-shared-boundary)
- [Main process](#main-process)
- [Renderer](#renderer)
- [Plugin system](#plugin-system)
- [AI assistant](#ai-assistant)
- [Data flow: two worked examples](#data-flow-two-worked-examples)
- [Build, packaging, and testing](#build-packaging-and-testing)
- [Directory map](#directory-map)

## Process model

Standard three-layer Electron split:

| Layer | Lives in | Runtime | Trust |
|-------|----------|---------|-------|
| **main** | `src/main/` | Node.js | full (filesystem, network, native drivers) |
| **preload** | `src/preload/` | sandboxed bridge | exposes a single typed `window.electronAPI` |
| **renderer** | `src/renderer/src/` | Chromium + React 19 | no Node access; talks only through the bridge |

`src/preload/index.ts` exposes exactly two methods —
`invoke<K>(channel, ...args)` (request/response) and `on(channel, cb)`
(subscribe to a push) — both typed by the channel map. The renderer has no other
way to reach the OS.

## The shared boundary

`shared/` holds the TypeScript contracts both processes import:

| File | Contract |
|------|----------|
| `ipc.ts` | every IPC channel + event, as a typed map and `SCREAMING_SNAKE_CASE` constants |
| `types.ts` | domain types: `ConnectionProfile`, `QueryResult`, `Tab`, schema metadata |
| `ai-types.ts` | chat messages, stream events, the chat-start request |
| `settings.ts` | `AppSettings` shape + defaults |
| `driver-capabilities.ts`, `mcp.ts`, `plugin-ui-types.ts` | capability flags, MCP, plugin UI |

All renderer↔main traffic goes through `ipc.ts`. The constant is mandatory at
every call site (a CI test rejects string-literal `invoke`/`on` calls). See
[ipc.md](./ipc.md) for how to add a channel.

## Main process

`src/main/index.ts` creates the window and bootstraps the subsystems.
`ipc-handlers.ts` registers handlers, delegating by domain to files under
`src/main/ipc/` (`connections.ts`, `db.ts`, `export-import.ts`, `plugins.ts`,
`settings.ts`, `mcp.ts`, …).

| Subsystem | Where | Notes |
|-----------|-------|-------|
| **Config store** | `config/store.ts` | one JSON file (connections + settings), atomic writes; connection secrets are extracted to the OS keyring, never written to disk |
| **Keyring** | `keyring.ts` | `safeStorage`-backed secret storage, namespaced |
| **Database adapters** | `db/` | just the `DbAdapter` interface + a `factory.ts` shim; every driver (sqlite/postgresql/mysql included) is a plugin that registers with the SDK `DriverRegistry`, and `createAdapter` resolves through it |
| **Plugin host** | `plugins/` | discovers, validates, activates plugins; see below |
| **MCP server** | `mcp/` | exposes the shared tool registry to external MCP clients (e.g. Claude Code) over an approved, tokenised endpoint |
| **Migration / updater** | `migration/`, `updater/` | schema-import migrations and auto-update |

`DbAdapter` (`db/adapter.ts`) is the contract every driver implements: connect /
query / introspect (`getTables`, `getColumns`, `getSchemas`, …) plus optional
session/transaction methods (`openSession`, `beginTransaction`, `commit`, …) for
drivers that support manual transactions.

## Renderer

A React 19 SPA. Two pillars: Zustand stores for state and a CVA-based primitives
design system for UI.

**Stores** (`src/renderer/src/stores/`):

| Store | Owns |
|-------|------|
| `connections.ts` | connection profiles, connect/disconnect lifecycle, active connection |
| `tabs.ts` | open tabs (a discriminated union: query / table / ER-diagram / connection-form / plugin-detail / install-plugin / settings) |
| `schema.ts` | cached schema metadata keyed by connection + schema |
| `ui.ts` | panel layout, sidebars, bottom dock, settings category (persisted) |
| `ai.ts` | AI chat: messages, providers/models, **conversations + history** |
| `editor.ts`, `tab-actions.ts` | non-reactive registries of mounted Monaco editors / per-tab save+txn handlers |
| `selection.ts`, `notifications.ts`, `toast.ts` | inspector selection, the notification center, transient toasts |
| `driver-capabilities.ts`, `themes.ts`, `settings.ts` | capability flags, theme list, settings mirror |
| `plugin-*.ts` | plugin-contributed commands / panels / lifecycle |

**Design system** (`src/renderer/src/primitives/`) is organised by category
(`forms/`, `layout/`, `surfaces/`, `data-display/`, …) and styled with
class-variance-authority. Theming is three layers in `primitives/theme/tokens.css`
(raw color scale → semantic tokens remapped per theme → component tokens),
applied via a `data-theme` attribute by `ThemeProvider`.

**Key libraries:** Monaco (SQL editor, custom completion + code lens in
`lib/monaco-sql.ts`), AG Grid (results), `@xyflow/react` (ER diagrams), Recharts
(chart panel).

## Plugin system

The orchestrator's extension mechanism. A plugin is a directory with a
declarative `manifest.json` (`contributes` block) and an `activate(ctx)` that
registers contributions through the SDK. Lifecycle: **discover → validate →
resolve → activate → runtime**, managed by the `BootCoordinator` in
`plugins/plugin-host.ts`; what's declared in the manifest must actually be
registered or the plugin lands in a `degraded` state.

Contribution surfaces include drivers, exporters, importers, formatters, type
mappers, themes, panels, commands, AI providers, connection middleware, and
connection fields. (SQL formatting is plugin-owned: each driver registers a
dialect formatter via the shared `formatSql` helper, with a generic fallback in
`core-formats`; the main app only resolves and invokes them over `db:format-sql`.) The SDK (`plugins/sdk/`) provides the registries (`DriverRegistry`,
`ToolRegistry`, `CommandRegistry`, `PanelRegistry`, …) and access objects
(`SchemaAccess`, `ConnectionAccess`, `PluginSettings`) via the `PluginContext`.
Bundled plugins live in `plugins/bundled/` (`sqlite`, `postgresql`, `mysql`,
`mongodb`, `redis`, `snowflake`, `db-tools`, `ai`, `core-formats`, `core-themes`,
`ssh-tunnel`). Full guide: [plugins.md](./plugins.md).

## AI assistant

The assistant is itself a bundled plugin. It registers AI providers and tools
through the SDK, shares one `ToolRegistry` with the MCP server, and can both
guide the user (deep-link chips) and act on the UI (an agentic App-Action
bridge). It keeps a persisted, branchable conversation history and trims each
request to a token budget. This is a subsystem in its own right — see
[ai.md](./ai.md).

## Data flow: two worked examples

**Running a query.** `QueryPanel` (renderer) calls
`invoke(DB_QUERY, profileId, sql, …)` → preload → `ipc/db.ts` handler → the
profile's `DbAdapter.query()` → `QueryResult` returned back up the same path →
`tabs.ts` stores it on the active `QueryTab` → AG Grid renders it, and the bottom
dock offers chart / plan tabs.

**An AI chat turn.** `ChatInput` → `useAIStore.sendMessage()` →
`invoke(AI_CHAT_START, { message, connectionId, appActionsCatalog, … })` → the AI
plugin's `ConversationManager.chat()` assembles the system prompt, trims context
to budget, and streams from the provider. Text arrives as `ai:chat:event`
broadcasts; tool calls run through the shared `ToolRegistry` (with approval for
`write` tools); `perform_app_action` tool calls round-trip to the renderer to
drive the UI. The renderer accumulates the turn into the active conversation and
persists it. Full detail in [ai.md](./ai.md).

## Build, packaging, and testing

- **Build:** `electron-vite` with three targets (main / preload / renderer) in
  `electron.vite.config.ts`. Native modules (`better-sqlite3`, `pg`, `mysql2`)
  are externalised from the bundle. Path aliases: `@shared` → `shared/`,
  `@` → `src/renderer/src/`.
- **Packaging:** `electron-builder.yml` (macOS `.dmg`, Windows NSIS, Linux
  AppImage).
- **Testing:** Vitest with two projects (`vitest.config.ts`) — `unit` (jsdom,
  `tests/unit/`) and `storybook` (Playwright browser, validates stories +
  accessibility). `better-sqlite3` is rebuilt for Electron's ABI on install, so
  the SQLite adapter unit tests need `pnpm rebuild better-sqlite3` to run under
  system Node (see the README).
- **Versioning:** Changesets — every user-visible change adds one.

## Directory map

```
shared/              Cross-process TypeScript contracts (ipc, types, ai-types, settings)
src/
├── main/            Orchestrator (Node)
│   ├── index.ts         Window + bootstrap
│   ├── ipc-handlers.ts  Handler registration
│   ├── ipc/             Handlers by domain (db, connections, export-import, …)
│   ├── config/          Settings + connection store
│   ├── db/              DbAdapter interface + factory shim (drivers are plugins)
│   ├── mcp/             MCP server
│   ├── keyring.ts       OS secret storage
│   └── plugins/         Plugin host + SDK + bundled plugins
├── preload/         Typed window.electronAPI bridge
└── renderer/src/    React SPA
    ├── stores/          Zustand state
    ├── primitives/      CVA design system + theming
    ├── components/       Feature UI (query, explorer, ai, charts, results, …)
    └── lib/              monaco-sql, app-actions, helpers
docs/                This documentation
```
