# Verql

A fast, extensible desktop database client. Built on Electron + React,
with a plugin architecture: the main app is an orchestrator and every
database driver, import/export format, theme, and AI integration ships
as a bundled plugin.

> The contribution surfaces (plugin APIs, IPC channels) are documented at
> **[verql.arshadshah.com](https://verql.arshadshah.com)**.

📚 **Documentation:** **[verql.arshadshah.com](https://verql.arshadshah.com)** —
a [user guide](https://verql.arshadshah.com/guide/) for everyday use and
[developer docs](https://verql.arshadshah.com/develop/architecture/) for the
architecture and [plugin SDK](https://verql.arshadshah.com/plugins/). The site
is built from [`docs/`](./docs/); its source lives in [`site/`](./site/).

![CI](https://github.com/arshad-shah/verql/actions/workflows/ci.yml/badge.svg)

## Features

- **Native drivers** for PostgreSQL, MySQL, SQLite, Snowflake, MongoDB,
  and Redis — each is a bundled plugin, not core code.
- **SQL editor** powered by Monaco with per-dialect autocomplete, code
  lens, and AI-assisted inline completion.
- **Schema browser** with ER diagrams, table previews, and an inspector
  panel for individual rows.
- **Import/export** to CSV, JSON, SQL, JSON-Lines (Mongo) — file formats
  are also plugin contributions.
- **AI assistant** with built-in OpenAI, Anthropic, and Ollama providers.
  Per-query permission gating; tool calls require user approval.
- **MCP server** built in, so Claude Code (and any other MCP client)
  can read your schema and run approved queries.
- **SSH tunnels** as a connection middleware.

## Install

Pre-built binaries are published to
[GitHub Releases](https://github.com/arshad-shah/verql/releases):

| Platform | Format | Notes |
|----------|--------|-------|
| macOS    | `.dmg` (Intel + Apple Silicon) | Signed and notarised. |
| Linux    | `.AppImage` | Signature published as a detached `.sig` next to the `sha256sums.txt`. |
| Windows  | `.exe` (NSIS installer) | **Unsigned.** SmartScreen will warn the first time it runs; see `.github/maintainers/release.md` for the upgrade path. |

Verifying a release:

```bash
# Download <asset>, sha256sums.txt, and sha256sums.txt.sig from the release page
gpg --verify sha256sums.txt.sig sha256sums.txt
sha256sum -c sha256sums.txt --ignore-missing
```

## Run from source

Requires Node ≥ 20 and [pnpm](https://pnpm.io/) 10. Then:

```bash
pnpm install
pnpm dev
```

The first install rebuilds `better-sqlite3` against Electron's Node ABI.
To run the unit tests under your system Node, run `pnpm rebuild
better-sqlite3` once to swap the binding back, then `pnpm test`.

## Architecture

`src/main/` is the **orchestrator** — window management, IPC plumbing,
and the plugin host. Everything dialect-specific lives in a plugin under
`src/main/plugins/bundled/`. The renderer (React) talks to the main
process through typed IPC channels declared in `shared/ipc.ts`.

To add a new database type, file format, AI provider, or UI panel: write
a plugin. See [Writing Plugins](https://verql.arshadshah.com/plugins/).

To add or change an IPC channel: see [IPC channels](https://verql.arshadshah.com/develop/ipc/).

## Contributing

We use [Changesets](https://github.com/changesets/changesets) to manage
versions. Every user-visible change should include a changeset:

```bash
pnpm changeset
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full workflow.

## Security

Found a vulnerability? Please follow [SECURITY.md](./SECURITY.md) —
do not open a public issue.

## License

[MIT](./LICENSE) © 2026 Arshad Shah
