# Changelog

## 0.11.0

### Minor Changes

- Add an Activity Panel and harden the app against a batch of security and correctness defects.

  - **Activity Panel** — a new secondary-sidebar panel that surfaces recent app activity (connections, queries, errors, and warnings) so you can see what's been happening at a glance.

  Security & correctness fixes:

  - **Secrets never written in cleartext** — saving settings, resetting a category, or deleting a connection no longer rewrites every connection's password into `config.json` in plaintext; keyring-backed fields are stripped before any disk write.
  - **Keyring redaction bypass closed** — the renderer can no longer read AI API keys or DB passwords back out of the keyring; secret-field access is gated and the reserved AI namespace is refused.
  - **AI "explain" stays read-only** — `explain_query` can no longer run writes (e.g. `EXPLAIN ANALYZE DELETE …`) without approval; the same write-detection used by the MCP server now applies.
  - **Constant-time MCP auth** — the MCP bearer token is now compared with a timing-safe check instead of `!==`.
  - **Redis SSL & database honored** — enabling SSL now actually uses TLS, and the selected database number is respected instead of always connecting to db0 in plaintext.
  - **Tighter plugin isolation** — isolated plugins can only call an explicit allowlist of capability methods, and plugin installs use an atomic private temp dir to avoid symlink/clobber races.
  - **No leaked pools on failed connect** — a failed `db:connect` now releases its adapter instead of leaking a connection pool on every failed attempt.

## 0.10.0

### Minor Changes

- [#72](https://github.com/arshad-shah/verql/pull/72) [`3855e81`](https://github.com/arshad-shah/verql/commit/3855e81d0880f64fceb15d6f52f9aa464435b8bc) Thanks [@arshad-shah](https://github.com/arshad-shah)! - Expand what the AI assistant can do in the app. The App-Action registry now ships
  built-in actions for the full capability roadmap, each usable as a clickable chip or
  run directly by the assistant:

  - **Connections** — connect, disconnect, and switch the active connection by name or id.
  - **Schema authoring** — scaffold `CREATE TABLE`/migration SQL into a new query tab (never auto-run).
  - **Results** — export the current results to CSV/JSON, or open a chart of them.
  - **Navigation** — reveal a table (or column) in the explorer, open a saved query, and open the ER diagram with a table selected.
  - **Editor assist** — insert SQL at the cursor or replace the current selection in the active editor.
  - **Plugins** — open the plugin install screen (and settings categories, including plugins).
  - **Diagnostics** — the assistant now sees recent errors/warnings and can summarize them and open the notifications panel.

- [#71](https://github.com/arshad-shah/verql/pull/71) [`a94b1f3`](https://github.com/arshad-shah/verql/commit/a94b1f39b9e821325958a23b1f54245b43f2d03a) Thanks [@arshad-shah](https://github.com/arshad-shah)! - Enhance the AI chat and surrounding workflow:

  - **Active connection fix** — the assistant now uses the connection you have active in the UI (previously it had no connection and its query/schema tools silently failed).
  - **Refined message bubbles** — avatar-anchored, adaptive width so tables and code never truncate, copy/retry actions, and a suggestion empty state.
  - **Deeper app integration** — the assistant can link you to the right place (e.g. "Add a Connection", "Open ER Diagram") via clickable action chips, and can navigate the app directly through an extensible App-Action registry that plugins can contribute to. The assistant knows your saved connections, so it sends you to the connections list for an existing one and the form only for a new one. Agentic actions report real success/failure back to the chat.
  - **Cheapest model by default** — when a provider is active or you switch vendors, the cheapest model for that vendor is selected by default (you can still pick another).
  - **Connections panel** — row actions moved into an overflow menu, with a new Delete action (confirmed via a dialog).

- [#72](https://github.com/arshad-shah/verql/pull/72) [`3855e81`](https://github.com/arshad-shah/verql/commit/3855e81d0880f64fceb15d6f52f9aa464435b8bc) Thanks [@arshad-shah](https://github.com/arshad-shah)! - AI chat now keeps a history of conversations and runs leaner:

  - **Conversations** — your chats are saved and listed in a switcher at the top of the AI panel. Start a new chat, rename or delete old ones, and pick up any conversation where you left off (they persist across restarts).
  - **Branching** — fork a new conversation from any message to explore an alternative direction without losing the original thread.
  - **More efficient context** — long conversations no longer send an ever-growing transcript to the model on every turn. The request is trimmed to a token budget (keeping the most recent context), which keeps responses fast and costs down.

- [#75](https://github.com/arshad-shah/verql/pull/75) [`f732a19`](https://github.com/arshad-shah/verql/commit/f732a191da9c484b2a99d087e3ec950e4c67b69f) Thanks [@arshad-shah](https://github.com/arshad-shah)! - AI: enable Anthropic prompt caching and externalise every prompt to its own
  markdown file.

  Caching: the system prompt and tool catalog now carry `cache_control:
{ type: 'ephemeral' }` breakpoints when targeting Anthropic models. Anthropic
  keeps a 5-minute prefix cache keyed on these blocks, so cached input tokens
  cost ~10% of the normal rate and skip re-processing on the server — the
  single biggest TTFT win on multi-turn chats with a stable schema.

  Externalised prompts: the five AI prompts (chat system, explain, generate
  query, inline SQL completion, summarize) and the chat-system context
  fragments now live as `.md` files in
  `src/main/plugins/bundled/ai/prompts/`, imported via Vite's `?raw` and
  rendered with a tiny `{{placeholder}}` helper. No prompt prose lives in the
  AI layer code anymore. New `tests/unit/ai-prompts.test.ts` pins the
  structural anchors that callers depend on (cursor token, section headers,
  word limits) so prompt edits can't silently break the surrounding code.

- [#73](https://github.com/arshad-shah/verql/pull/73) [`3dc6718`](https://github.com/arshad-shah/verql/commit/3dc6718953906907e4db48b21d18cf44b0974c8f) Thanks [@arshad-shah](https://github.com/arshad-shah)! - Editor AI redesign: replace the CodeLens "Run / Explain" bar with a custom
  statement gutter (lucide icons + per-statement status chip); add an
  Accept/Reject toolbar and status pill to inline AI ghost-text; rebuild the
  Explain-results panel with Markdown, streaming, Copy/Regenerate/Ask-follow-up
  actions. No ASCII glyphs remain in the touched surfaces.

- [#72](https://github.com/arshad-shah/verql/pull/72) [`3855e81`](https://github.com/arshad-shah/verql/commit/3855e81d0880f64fceb15d6f52f9aa464435b8bc) Thanks [@arshad-shah](https://github.com/arshad-shah)! - SQL formatting, in-app help, and docs:

  - **Format query** — the editor can now pretty-print the buffer ("Format Document" / Shift+Alt+F, or ask the assistant to "format this"). Formatting is plugin-owned and keyed by editor language: SQL drivers (PostgreSQL, MySQL, SQLite, Snowflake) contribute dialect formatters backed by `sql-formatter`, MongoDB pretty-prints its JSON, and Redis tidies its command buffer. New database plugins can contribute a formatter for their own query language via the new `formatters` contribution surface.
  - **Help menu** — a native Help menu links to the documentation and issue tracker, and the About panel shows the version (macOS/Linux).
  - **Docs** — added `docs/architecture.md` and `docs/ai.md`, documented the formatter surface in `docs/plugins.md`, and refreshed `CLAUDE.md` with a docs-first workflow and the glue↔plugin ownership boundary.

### Patch Changes

- [#73](https://github.com/arshad-shah/verql/pull/73) [`3dc6718`](https://github.com/arshad-shah/verql/commit/3dc6718953906907e4db48b21d18cf44b0974c8f) Thanks [@arshad-shah](https://github.com/arshad-shah)! - Bump the `uuid` transitive (via snowflake-sdk) to `>=11.1.1` to resolve
  GHSA-w5hq-g745-h8pq (missing buffer bounds check in v3/v5/v6). Our usage path
  through snowflake-sdk only touches v4, but the audit gate flagged it; the
  override moves us to a maintained line.

- [#73](https://github.com/arshad-shah/verql/pull/73) [`3dc6718`](https://github.com/arshad-shah/verql/commit/3dc6718953906907e4db48b21d18cf44b0974c8f) Thanks [@arshad-shah](https://github.com/arshad-shah)! - Trim the AI system prompt: drop verbose rule restatements, send only table
  names (instead of full column schemas) with a hint to call describe_table on
  demand, compact the App-Action catalog to `id "Title"` pairs, omit the active
  connection from the "saved connections" list, and cap recent notifications at
  three titles. Cuts per-turn prompt size by ~2-5k tokens on typical workspaces.

## 0.9.0

### Minor Changes

- [#69](https://github.com/arshad-shah/verql/pull/69) [`65aece9`](https://github.com/arshad-shah/verql/commit/65aece9e843e41115f48a32cd66d2be5fdee87d2) Thanks [@arshad-shah](https://github.com/arshad-shah)! - Unify MCP and AI tooling behind a single SDK `ToolRegistry`. Database tool logic now lives in a dedicated always-on `db-tools` bundled plugin consumed by both the MCP server and the AI assistant (clean break: `ctx.ai.registerTool` is removed in favour of `ctx.tools`). The MCP settings panel gains per-tool enable toggles, a read-only mode, a configurable row limit, automatic port-conflict resolution, and a live activity log. SQL in the MCP approval dialog and the Claude client config are now syntax-highlighted via a new reusable `CodeView` primitive.

## 0.8.0

### Minor Changes

- [#54](https://github.com/arshad-shah/verql/pull/54) [`d2e6c88`](https://github.com/arshad-shah/verql/commit/d2e6c8894dac9735305078cbc52de601aa816373) Thanks [@arshad-shah](https://github.com/arshad-shah)! - Added transaction controls for PostgreSQL and SQLite connections. Each query tab can now turn off auto-commit and run statements inside a transaction, with Commit/Rollback, isolation level, and read-only mode in a new transaction toolbar. A connection can default to manual-commit via a per-connection "Auto-commit by default" setting, and closing a tab with an open transaction prompts you to commit or roll back first.

  Under the hood, drivers declare these capabilities through a new plugin-SDK session/transaction surface, so the UI stays database-agnostic — future drivers (MySQL, Snowflake, MongoDB, Redis) light up the same controls just by declaring support.

- [#54](https://github.com/arshad-shah/verql/pull/54) [`d2e6c88`](https://github.com/arshad-shah/verql/commit/d2e6c8894dac9735305078cbc52de601aa816373) Thanks [@arshad-shah](https://github.com/arshad-shah)! - Redesigned the status bar as a VS Code-style segmented bar. Connection, database, and plugin status are now shown as discrete segments along the bar, replacing the previous ConnectionCard layout.

## 0.7.0

### Minor Changes

- [#51](https://github.com/arshad-shah/verql/pull/51) [`876f08e`](https://github.com/arshad-shah/verql/commit/876f08e153e05f9b8d4b4aa5a860d8ac99783f73) Thanks [@arshad-shah](https://github.com/arshad-shah)! - The main app is now a pure orchestrator: every line of database-specific logic lives inside its driver plugin. Adding a new database (Cassandra, ClickHouse, DuckDB, anything else) no longer requires editing the main process or the renderer's hot paths.

  What changed for the user-facing app:

  - Each driver now contributes its own identifier-quote character, prepared-statement placeholder, sample query, and migration DDL builder. The orchestrator routes through these structural capabilities; the previous hardcoded "for these four dialects" table is gone.
  - The CSV-into-table importer is fully generic — it asks the active driver for its quoting + placeholder shape, so the same import path works for every relational driver (bundled or third-party).
  - SQLite's `INTEGER PRIMARY KEY` rowid quirk during migration moved into the SQLite plugin where it belongs. The migration tool no longer special-cases it.
  - The `db:sample-query` IPC handler no longer fabricates a `SELECT * FROM table LIMIT 100` fallback. Every driver, SQL or otherwise, ships its own sample-query implementation.
  - Bundled drivers are now wired through a single `src/main/plugins/bundled/index.ts` list. The orchestrator iterates that list — it doesn't reference individual driver names anywhere else.

  What changed for plugin authors: see the SDK release notes below — the helpers driver plugins compose (`quoteIdentifier`, `generateCreateTable`, `splitSqlStatements`, `importCsvToTable`, `createRelationalGetTableData`) now live in the public SDK barrel and take the driver's quote character as a parameter, so a new driver plugin never has to hardcode a dialect name.

  A regression test now scans every file under `src/main/` outside `plugins/` and fails the build if any of `'postgresql'`, `'mysql'`, `'sqlite'`, `'mongodb'`, `'redis'`, `'snowflake'` re-appears in core code.

- [#51](https://github.com/arshad-shah/verql/pull/51) [`876f08e`](https://github.com/arshad-shah/verql/commit/876f08e153e05f9b8d4b4aa5a860d8ac99783f73) Thanks [@arshad-shah](https://github.com/arshad-shah)! - The plugin SDK is now a complete, documented surface for third-party plugin authors, and themes are validated end-to-end so a partial theme can never half-paint the app.

  **Plugin SDK additions**

  - `definePlugin({ manifest, activate, deactivate? })` — typed identity helper that pins the plugin shape at compile time. Missing fields or mistyped contributions fail at compile time instead of at boot.
  - SQL helpers exposed in the public barrel: `quoteIdentifier`, `validateIdentifier`, `formatSqlValue`, `generateCreateTable`, `generateInsertStatements`, `splitSqlStatements`, `importCsvToTable`, `createRelationalGetTableData`. All take the driver's `quoteChar` as a parameter — no dialect enum.
  - Theme helpers exposed: `validateTheme`, `REQUIRED_THEME_TOKENS`, `RECOMMENDED_THEME_TOKENS`. Plugin authors can run the same validator the host runs and fail their own CI before shipping a broken theme.
  - Manifest validator now covers `themes`, `exporters`, and `importers` contributions (previously silently accepted any shape and failed later at activation time).

  **Theme validation**

  - The theme registry validates every theme at registration time and stores the report on the entry. The picker reads it once instead of re-running validation per render.
  - Optional `register(theme, { strict: true })` throws on missing required tokens — useful inside a plugin author's CI build.
  - The Appearance settings theme grid now **disables** tiles for themes missing required tokens — they're greyed out, non-clickable, and show a tooltip listing the missing tokens. Themes that only miss _recommended_ tokens still work and show the existing warning badge.
  - `setTheme()` refuses to land on a broken theme even when called programmatically (URL handler, command palette, restored settings), and the resolved-theme fallback skips broken themes when picking the effective theme for the active mode.
  - The 9 bundled themes (Lab, Ink & Paper, Dark, Light, Midnight, Dracula, Nord, Solarized, Catppuccin) are pinned by a unit test against the required-token list, so a future palette tweak can't silently break one.

  **Documentation**

  `docs/plugins.md` has been updated for the new SDK surface: `definePlugin`, the driver capability flags (`quoteChar`, `placeholder`, `sampleQuery`, `generateMigrationDdl`), the theme-token contract, and the bundled-plugins/index.ts wiring file.

### Patch Changes

- [#51](https://github.com/arshad-shah/verql/pull/51) [`876f08e`](https://github.com/arshad-shah/verql/commit/876f08e153e05f9b8d4b4aa5a860d8ac99783f73) Thanks [@arshad-shah](https://github.com/arshad-shah)! - Round of correctness fixes surfaced by a full-codebase audit:

  - **Schema cache is cleared on disconnect.** Reconnecting a profile no longer surfaces stale tables/columns from the previous session, which would otherwise cause confusing autocomplete and the occasional "table doesn't exist" against the live server.
  - **Tabs detach cleanly when their connection is deleted.** Query tabs lose their dead `connectionId` and land in the "pick a connection" state; ER-diagram and table tabs close outright instead of dangling against a profile that no longer exists.
  - **CSV import "update on conflict"** no longer silently drops every conflicting row. Per-row failures now surface in the importer's `errors[]` so the user can see what failed, instead of seeing a successful import that didn't actually write anything.
  - **Adapters disconnect cleanly on app quit.** A new `before-quit` handler awaits every active adapter's `disconnect()`, so SSH tunnels and database pools close before the process exits rather than getting reaped abruptly.
  - **`Close all tabs` no longer reverses the open tab list** for any subscriber still holding the prior reference. The action now copies the array before reversing it.
  - **Disconnect middleware errors are logged** instead of being swallowed by an empty `catch {}`, so a leaking SSH tunnel or socket is discoverable in the developer console instead of vanishing.
  - **Command-palette plugin actions** log their errors instead of disappearing into a no-op `.catch(() => {})`.

- [#51](https://github.com/arshad-shah/verql/pull/51) [`876f08e`](https://github.com/arshad-shah/verql/commit/876f08e153e05f9b8d4b4aa5a860d8ac99783f73) Thanks [@arshad-shah](https://github.com/arshad-shah)! - Security hardening across connection, IPC, and plugin loading paths:

  - **PostgreSQL SSL** now verifies the server certificate by default whenever SSL is enabled, instead of silently disabling verification on every encrypted connection. The connection form gains an explicit _SSL Mode_ selector — pick "Verify (recommended)" or "Skip verification (insecure)" — so opt-out is deliberate, not a hidden default.
  - **MCP server** no longer returns `Access-Control-Allow-Origin: *`. The bearer-token check still gates every request, but removing the wildcard means even a leaked token can't be read by a malicious page in the user's browser.
  - **MCP `explain_query` tool** now routes through the same write-approval gate as `query`. Statements that hide DML behind a comment or after a semicolon (`EXPLAIN SELECT 1; DELETE FROM users`) can no longer be smuggled through the "read-only" label.
  - **Bundled plugins can no longer be shadowed.** A third-party plugin claiming the name `verql-plugin-postgresql` (or any other bundled name) is now rejected at discover and install time instead of silently overriding the built-in driver and intercepting credentials.
  - **Plugin `main` path traversal** is rejected at the validate phase. A manifest declaring `main: '../../../etc/passwd.js'` (or any absolute path) can no longer escape the plugin directory and load arbitrary files via `require()`.
  - **Encrypted credentials file** (`credentials.enc`) is now written with mode `0o600` so it isn't world-readable on shared systems.
  - **Main window** declares `setWindowOpenHandler` (denies all `window.open` requests) and a `will-navigate` guard pinned to the bundled assets / dev server, so the renderer can never be steered to an external URL.

## 0.6.0

### Minor Changes

- [#48](https://github.com/arshad-shah/verql/pull/48) [`1293f54`](https://github.com/arshad-shah/verql/commit/1293f542ff4adbbb2ee63530927daa6a401b8859) Thanks [@arshad-shah](https://github.com/arshad-shah)! - Added in-app update controls under Settings → General. When the running install is managed by Homebrew, you can check for a new version and trigger `brew upgrade --cask verql` from inside the app, then restart to apply. The mechanism is channel-pluggable — Mac App Store, Windows Store, Snap and APT can drop in later without changes to the UI or IPC layer.

### Patch Changes

- [#48](https://github.com/arshad-shah/verql/pull/48) [`1293f54`](https://github.com/arshad-shah/verql/commit/1293f542ff4adbbb2ee63530927daa6a401b8859) Thanks [@arshad-shah](https://github.com/arshad-shah)! - Plugin deactivations now survive an app restart. Previously the choice was kept only in memory, so every boot re-activated every installed plugin and the disable toggle appeared to do nothing across sessions.

## 0.5.0

### Minor Changes

- [#47](https://github.com/arshad-shah/verql/pull/47) [`ea26f17`](https://github.com/arshad-shah/verql/commit/ea26f171f48a68e12f89ae308757dc3342ea14ee) Thanks [@arshad-shah](https://github.com/arshad-shah)! - Redesigned the workspace tab bar in a browser-style: each tab now has rounded top corners and curved skirt corners that visually attach the active tab to the workspace below.

  Introduced five new theme tokens — `--color-tab-bar-bg`, `--color-tab-active-bg`, `--color-tab-active-fg`, `--color-tab-inactive-fg`, `--color-tab-hover-bg` — so themes (bundled and plugin-contributed) can tune tab contrast independently from the underlying surface palette. All nine plugin themes plus the baseline Nightshift were updated with values that keep the active tab clearly distinct from the bar, including on light themes where the previous hover wash blended into the background.

- [#47](https://github.com/arshad-shah/verql/pull/47) [`ea26f17`](https://github.com/arshad-shah/verql/commit/ea26f171f48a68e12f89ae308757dc3342ea14ee) Thanks [@arshad-shah](https://github.com/arshad-shah)! - Nightshift is now owned by the app shell rather than the core-themes plugin. Its CSS variables already lived in the always-loaded baseline; this release moves the Monaco editor definition into the renderer alongside, so the brand syntax highlighting works even with every plugin disabled. The renderer always prepends Nightshift to the theme list and ignores any plugin attempting to register the same id, keeping the brand surface authoritative. The core-themes plugin now ships nine themes (Lab, Ink & Paper, Dark, Light, Midnight, Dracula, Nord, Solarized, Catppuccin).

  The pre-React boot splash now uses the real Verql brand mark (frost-and-mint V-bars) instead of the placeholder chevron, matching the React-side splash so the loading-to-app handoff doesn't swap symbols.

### Patch Changes

- [#47](https://github.com/arshad-shah/verql/pull/47) [`ea26f17`](https://github.com/arshad-shah/verql/commit/ea26f171f48a68e12f89ae308757dc3342ea14ee) Thanks [@arshad-shah](https://github.com/arshad-shah)! - Light themes (Light, Lab, Ink & Paper) now render correctly:

  - The Light theme's selected-state and status colors (accent emphasis, success, warning, error, info) no longer fall back to the Nightshift baseline's mint/amber palette that washed out on white surfaces.
  - The Color Mode toggle (Light / Dark / System) on Lab and Ink & Paper themes had dark text on a dark accent-muted background; the accent-muted token is now a translucent tint suitable for selected-state backgrounds on light surfaces.
  - The Lab and Ink & Paper themes are now declared as `color-scheme: light` so native form controls render with the correct UA palette.

  Removed the duplicate `<Heading>` element from every Settings category — the settings layout already shows the category name in its header, so each page no longer renders two headings stacked on top of each other.

  Removed nine orphaned theme CSS files from `src/renderer/src/primitives/theme/themes/` that hadn't been imported since themes migrated to the plugin registry. The directory is gone; baseline Nightshift in `baseline.css` is the only renderer-bundled theme stylesheet.

- [#47](https://github.com/arshad-shah/verql/pull/47) [`ea26f17`](https://github.com/arshad-shah/verql/commit/ea26f171f48a68e12f89ae308757dc3342ea14ee) Thanks [@arshad-shah](https://github.com/arshad-shah)! - The Plugins settings page now lists each plugin's actual contributions (drivers, commands, panels, themes, exporters, importers, middleware) as inline chips below the description. Previously, plugins that contributed only exporters or importers — like Core Formats — appeared blank because the plugin host's contribution-verification loop didn't track those kinds, so nothing flowed through to the UI. The verification path now covers exporters and importers, and the settings page renders the full contribution list.

## 0.4.0

### Minor Changes

- **New default theme: Nightshift.** Plus two more curated themes — Lab (refined light) and Ink & Paper (warm editorial) — bringing the total to three primary directions before legacy/community themes.

  - `nightshift` (default) — modern dark with an electric mint accent (`#2bd9a3`)
  - `lab` — refined off-white with a deep teal accent (`#115E59`)
  - `inkpaper` — warm editorial paper-toned light with a rust accent (`#9E3022`)

  Old themes (`dark`, `light`, `midnight`, `dracula`, `nord`, `solarized`, `catppuccin`) remain available for users who prefer them. Existing user theme preferences are preserved across upgrade.

  Also wired up the **animations** appearance toggle — it now actually disables transitions app-wide instead of being a no-op switch. `ThemeProvider` writes `data-animations="off"` to `<html>`, and a global CSS rule kills `transition-duration` / `animation-duration` when set.

## 0.3.6

### Patch Changes

- Permanently fix `Cannot find module` crashes at launch by bundling pure-JS main-process dependencies (snowflake-sdk, axios, form-data, mongodb, ioredis, …) into `out/main/index.js` via Rollup, plus switch pnpm to `nodeLinker: hoisted` (pnpm's own recommendation for Electron projects).

  Previously, electron-builder's dep-graph walker silently dropped transitive deps under pnpm's isolated layout — `es-object-atoms`, `mime-db`, `get-intrinsic`, `call-bind-apply-helpers`, … all went missing from the packaged `app.asar` even when they were present at top-level `node_modules` locally. Bundling inlines them so runtime resolution never reaches the filesystem.

  Only native modules (`better-sqlite3`, `pg`, `mysql2`, `ssh2`, `cpu-features`) and `@electron/rebuild` remain external — those still ship in `node_modules` inside the asar and are packed reliably because they're declared direct dependencies.

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
