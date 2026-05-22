# Changelog

## 0.3.5

### Patch Changes

- Fix `Cannot find module` crashes at launch by including the full transitive node_modules graph in the packaged `app.asar`. The previous `files: ["out/**/*"]` config left it to electron-builder's default dep-walker, which (under pnpm's symlinked layout) silently dropped many transitive deps — `mime-db`, `es-object-atoms`, `get-intrinsic`, `es-set-tostringtag`, and others all went missing. Switched to explicit `files` patterns that pull in `node_modules/**/*` with sensible excludes (changelogs, tests, docs, source maps).

  Asar package count: 353 → 434.

## 0.3.4

### Patch Changes

- Fix `Cannot find module 'mime-db'` crash at launch (still hitting users on v0.3.3). Despite `shamefullyHoist: true` in `pnpm-workspace.yaml` placing `mime-db` at the top of `node_modules` locally, the same install on macos-14 CI runners didn't include it in the packaged `app.asar` — snowflake-sdk's nested `mime-types` then couldn't resolve `mime-db` at runtime.

  Declared `mime-db@1.52.0` and `mime-types@2.1.35` as direct dependencies so electron-builder's dep-graph walker always packs them regardless of pnpm layout quirks.

## 0.3.3

### Patch Changes

- Fix release workflow dropping the Windows `.exe` from the release assets. With the new `artifactName` template the installer is named `verql-X.Y.Z-x64.exe` instead of `verql Setup X.Y.Z.exe`; the `*Setup*.exe` globs in the SHA computation and the upload step missed it. Switched both to `*.exe`.

## 0.3.2

### Patch Changes

- Force lowercase artifact filenames via explicit `artifactName` template (`${name}-${version}-${arch}.${ext}`). electron-builder previously derived names from `productName` ("Verql" with a capital V), producing `Verql-0.3.1-arm64.dmg` etc. — which mismatched the lowercase URLs in the Homebrew cask and broke the auto-bump workflow's asset download. Both architectures now carry an explicit `-x64` / `-arm64` suffix; workflow and cask updated to match.

## 0.3.1

### Patch Changes

- Fix macOS release build failing with `DOMParser.parseFromString: the provided mimeType "undefined" is not valid`. The `@xmldom/xmldom` 0.9 line made the `mimeType` argument mandatory; the `plist` library that electron-builder uses to parse the Electron prebuild's `Info.plist` doesn't pass one. Pin `@xmldom/xmldom` to `~0.8.13` via pnpm overrides.

## 0.3.0

### Minor Changes

- **Rebrand from Nova to Verql** — the previous name conflicted with existing trademarks.

  - Project, repo (`arshad-shah/nova` → `arshad-shah/verql`), package (`nova` → `verql`), and Homebrew tap (`arshad-shah/homebrew-nova` → `arshad-shah/homebrew-verql`) are all renamed.
  - macOS bundle identifier changes from `com.electron.nova` to `com.electron.verql`; settings paths under `~/Library/Application Support/` move accordingly.
  - Existing Homebrew installs need to be reinstalled: `brew uninstall --cask arshad-shah/nova/nova` and then `brew install --cask arshad-shah/verql/verql`.

  **Other fixes bundled with the rebrand:**

  - **pnpm-workspace.yaml** is now the source of truth for pnpm config. The previous `.npmrc` setting `shamefully-hoist=true` was silently ignored by pnpm 11; switching to `shamefullyHoist: true` in this file makes the hoist take effect. Without hoisting, transitive deps (e.g., `mime-db` pulled in by `snowflake-sdk` → `mime-types`) were dropped from the packaged `app.asar` and the app crashed at launch with `Cannot find module 'mime-db'`.
  - Explicit `build.appId` (`com.electron.verql`) and `build.productName` (`Verql`) so the bundle, dock label, and Info.plist all carry the proper brand instead of falling back to the lowercase package name.

## 0.2.5

### Patch Changes

- Fix macOS `.dmg` rejected with "verql is damaged and can't be opened". With `mac.identity: null`, electron-builder was skipping signing entirely, leaving every nested binary with its stale Electron-prebuild linker signature while the bundle's resource hashes (Info.plist, app.asar, icons) no longer matched. macOS rejected the app at launch (`spctl: code has no resources but signature indicates they must be present`).

  Adds an `afterPack` hook that ad-hoc re-signs the assembled bundle with `codesign --force --deep --sign -` before the dmg is created. Every nested binary now ends up with a consistent ad-hoc signature, matching resource hashes, and a null Team ID — so Gatekeeper accepts the bundle even without an Apple Developer ID.

## 0.2.4

### Patch Changes

- Fix macOS `.dmg` crashing on launch with `Library not loaded: Electron Framework ... mapping process and mapped file ... have different Team IDs`. Without `mac.identity: null`, electron-builder left the embedded Electron Framework's original signature intact while the outer binary was ad-hoc signed, so dyld refused to load nested frameworks at runtime. Setting `identity: null` forces consistent ad-hoc signing across every nested binary.

## 0.2.3

### Patch Changes

- Fix release workflow hashing step on macOS. macOS runners don't ship GNU `sha256sum`; use the platform's available hasher (`shasum -a 256` on macOS, `sha256sum` on Linux/Windows runners) so the artifact SHA file is produced on every platform.

## 0.2.2

### Patch Changes

- Fix macOS release build when no Apple signing certificate is configured. The previous workflow set `CSC_LINK: ""` which electron-builder treated as a path to the project root, failing with `not a file`. Now sets `CSC_IDENTITY_AUTO_DISCOVERY=false` when `MAC_CERT_P12_BASE64` is unset, producing an unsigned bundle instead.

## 0.2.1

### Patch Changes

- Fix release workflow: run `electron-vite build` before `electron-builder` so the packaged `app.asar` contains `out/main/index.js`. Without this step all three OS builds failed at the asar sanity check during the v0.2.0 release attempt.

## 0.2.0

### Minor Changes

- Initial public release of Verql — a fast, extensible desktop database client built on Electron + React.

  - **Database drivers** (each a bundled plugin): PostgreSQL, MySQL, SQLite, MongoDB, Redis, Snowflake.
  - **SQL editor** powered by Monaco with per-dialect autocomplete and code lens.
  - **Schema browser** with ER diagrams, table previews, and a row inspector.
  - **Import/export** for CSV, JSON, JSON-Lines, and SQL — all as plugin contributions.
  - **AI assistant** with OpenAI, Anthropic, and Ollama providers; per-query permission gating for tool calls.
  - **MCP server** built in, so Claude Code and other MCP clients can read schemas and run approved queries.
  - **SSH tunnels** as connection middleware.
  - **Themes**: dark, light, midnight — three-layer token system for further customisation.

  Pre-built binaries for macOS, Linux, and Windows are attached to this release. macOS and Windows builds are currently **unsigned**; see the README for verification steps using `sha256sums.txt` and the detached GPG signature.

All notable changes to Verql are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Going forward, entries are generated from
[Changesets](https://github.com/changesets/changesets) — see
[`.changeset/README.md`](./.changeset/README.md) for the workflow.
The 0.1.0 entry below is the consolidated history from the project's
private prototype phase through to first public release.

## [Unreleased]

## [0.1.0] - First public release

The initial release of Verql as an open-source project. Highlights of
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

[Unreleased]: https://github.com/arshad-shah/verql/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/arshad-shah/verql/releases/tag/v0.1.0
