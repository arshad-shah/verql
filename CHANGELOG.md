# Changelog

## 0.2.2

### Patch Changes

- Fix macOS release build when no Apple signing certificate is configured. The previous workflow set `CSC_LINK: ""` which electron-builder treated as a path to the project root, failing with `not a file`. Now sets `CSC_IDENTITY_AUTO_DISCOVERY=false` when `MAC_CERT_P12_BASE64` is unset, producing an unsigned bundle instead.

## 0.2.1

### Patch Changes

- Fix release workflow: run `electron-vite build` before `electron-builder` so the packaged `app.asar` contains `out/main/index.js`. Without this step all three OS builds failed at the asar sanity check during the v0.2.0 release attempt.

## 0.2.0

### Minor Changes

- Initial public release of Nova — a fast, extensible desktop database client built on Electron + React.

  - **Database drivers** (each a bundled plugin): PostgreSQL, MySQL, SQLite, MongoDB, Redis, Snowflake.
  - **SQL editor** powered by Monaco with per-dialect autocomplete and code lens.
  - **Schema browser** with ER diagrams, table previews, and a row inspector.
  - **Import/export** for CSV, JSON, JSON-Lines, and SQL — all as plugin contributions.
  - **AI assistant** with OpenAI, Anthropic, and Ollama providers; per-query permission gating for tool calls.
  - **MCP server** built in, so Claude Code and other MCP clients can read schemas and run approved queries.
  - **SSH tunnels** as connection middleware.
  - **Themes**: dark, light, midnight — three-layer token system for further customisation.

  Pre-built binaries for macOS, Linux, and Windows are attached to this release. macOS and Windows builds are currently **unsigned**; see the README for verification steps using `sha256sums.txt` and the detached GPG signature.

All notable changes to Nova are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Going forward, entries are generated from
[Changesets](https://github.com/changesets/changesets) — see
[`.changeset/README.md`](./.changeset/README.md) for the workflow.
The 0.1.0 entry below is the consolidated history from the project's
private prototype phase through to first public release.

## [Unreleased]

## [0.1.0] - First public release

The initial release of Nova as an open-source project. Highlights of
the prototype phase that fed into 0.1.0:

### Application shell

- Three-panel workbench: primary sidebar with the connection explorer,
  centre area with tabbed editors / table views, secondary sidebar
  for context-aware panels.
- Bottom dock for query plans, charts, and plugin-contributed views.
- Inspector panel that reflects the user's current selection (row,
  column, schema object).
- Command palette (`Cmd+Shift+P`) that surfaces every Monaco editor
  action plus app commands and any plugin-contributed commands.
- Native macOS / Linux / Windows menu and accelerators.

### Database support

- Native drivers for PostgreSQL, MySQL, SQLite, Snowflake, MongoDB,
  and Redis.
- Schema introspection: tables, views, columns, indexes, foreign keys,
  materialised views, functions, triggers, sequences, extensions
  (per-driver coverage varies).
- ER diagram generation (`@xyflow/react` + dagre).
- Per-driver Monaco completion providers with static keywords plus
  dynamic table / column completions.
- AI-assisted inline completion in the SQL editor.
- Connection middleware support, with a bundled SSH tunnel middleware.

### Query editor

- Monaco-powered editor with per-driver language selection (`sql`,
  `json` for Mongo, `plaintext` for Redis).
- Code lens with inline "▶ Run / Explain" buttons.
- Per-action keybinding configuration in Settings.
- Query plan tab and charts tab in the bottom dock.

### Import / export

- CSV and JSON import / export for every driver, contributed by a
  `core-formats` bundled plugin.
- SQL exporter + importer contributed by each relational driver
  plugin (PostgreSQL, MySQL, SQLite, Snowflake) — uses dialect-aware
  identifier quoting.
- JSON-Lines + JSON-Array exporter for MongoDB; JSON exporter for
  Redis.

### AI assistant

- Bundled providers: OpenAI, Anthropic (Claude), Ollama.
- Per-tool permission gating; write operations require user approval.
- Built-in tools: list tables, describe table, get relationships,
  connection info, execute query, generate SQL, complete SQL, explain
  results.
- AI keys stored encrypted at rest via Electron `safeStorage`.

### MCP server

- Optional built-in MCP server that exposes the active connection to
  external AI tools (Claude Code, etc.).
- Bearer token authentication; user must explicitly start the server
  in Settings.

### Plugin system (extension surfaces)

- Discover → validate → resolve → activate → verify lifecycle.
- Manifest validation enforced equally for bundled and external
  plugins.
- Per-plugin error budget auto-disables a plugin that throws
  repeatedly at runtime.
- Contribution surfaces:
  - drivers (with `sqlDialect`, `editorLanguage`,
    `defaultSchemaCandidates`, `getTableData`)
  - exporters / importers
  - type mappers
  - connection middleware
  - completion providers
  - panels (primary / secondary / bottom dock)
  - commands (with keybindings)
  - declarative UI widgets (toolbar selectors, status bar items,
    slots and resolvers)
  - AI providers / tools / context providers
  - settings (per-plugin, mounted into core categories)
- Plugins can be installed from a directory or a zip via the
  Extensions panel.

### Security

- Renderer sandboxed: `sandbox: true`, `contextIsolation: true`,
  `nodeIntegration: false`, `webSecurity: true`.
- All SQL identifier interpolation goes through `quoteIdentifier()`,
  which rejects NUL / CR / LF / tab and caps length at 255.
- Secrets stored encrypted via OS-keyring-backed `safeStorage`;
  legacy plain-text secrets are migrated on first launch.
- Bundled CI dependency audit (`pnpm audit --audit-level high`).
- Zero known high or critical dependency vulnerabilities.

### Architecture refactors that fed into 0.1.0

- Driver-driven extension model: removed every hardcoded
  `connectionType === '…'` branch from the orchestrator and renderer.
  Drivers contribute capability flags (`sqlDialect`,
  `defaultSchemaCandidates`, `editorLanguage`, …) that the generic
  code paths read.
- `TypeMapperRegistry` for cross-dialect type translation —
  migration code is dialect-agnostic.
- `IPC_CHANNELS` / `IPC_EVENTS` constants in `shared/ipc.ts` as the
  single source of truth for every renderer ↔ main channel. Coverage
  test enforces that no call site uses an inline string literal.
- Plugin-driven import / export — formats register themselves through
  the SDK; the orchestrator never imports a concrete exporter.

### Tooling

- 834 unit tests, runnable under `pnpm test --project unit`.
- Storybook for primitives + components.
- TypeScript strict mode across the codebase; `tsc -b` is part of CI.
- GitHub Actions CI: unit tests on Node 20 + 22, typecheck, dependency
  audit, and a production `electron-vite build`.

[Unreleased]: https://github.com/arshad-shah/nova/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/arshad-shah/nova/releases/tag/v0.1.0
