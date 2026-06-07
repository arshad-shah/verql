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

| Platform | Format | Where | Updates |
|----------|--------|-------|---------|
| macOS    | `.dmg` (Intel + Apple Silicon) | GitHub Releases / Homebrew cask | Homebrew (`brew upgrade --cask verql`); the app notifies on launch when a new version exists |
| Linux    | `.AppImage` | GitHub Releases | **In-app auto-update** (electron-updater) |
| Linux    | Snap | [Snap Store](https://snapcraft.io/) | `snapd` auto-refresh |
| Windows  | MSIX | [Microsoft Store](https://apps.microsoft.com/) | Microsoft Store |
| Windows  | `.exe` (NSIS installer) | GitHub Releases | **In-app auto-update** (electron-updater) |

Every GitHub Releases artifact ships with a cosign-signed checksum file for
verification (`sha256sums*.txt` + `.sig`/`.pem`). The macOS dmg is also
Apple-signed & notarised; the Windows `.exe` is currently **unsigned** (you'll
see a SmartScreen warning on first run), while the Microsoft Store signs the
MSIX.

**Auto-updates differ per channel by design.** electron-updater drives only the
GitHub-distributed builds — the Linux **AppImage** and the Windows **NSIS
`.exe`** — which check on launch, download in the background, and install on
quit. The Microsoft Store and Snap (`snapd`) auto-update themselves, so the
in-app updater stays out of their way. On **macOS/Homebrew** the app does a
one-time check on launch and, if a newer cask exists, surfaces a toast + a
notification + an OS notification + a banner in Settings → Updates (it doesn't
run `brew` for you).

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

## Releasing & store publishing

Pushing a `v*.*.*` tag runs [`.github/workflows/release.yml`](.github/workflows/release.yml),
which builds every platform, publishes the **Linux AppImage** (+ the
`latest-linux.yml` auto-update feed) to a draft GitHub Release, pushes the
**Snap** to the Snap Store, and submits the **MSIX** to the Microsoft Store.
Full operator detail (including macOS signing) lives in
[`.github/maintainers/release.md`](.github/maintainers/release.md).

### Required secrets

Set these as **repository secrets** at
`Settings → Secrets and variables → Actions`:

| Secret | Channel | How to obtain |
|--------|---------|---------------|
| `PARTNER_CENTER_TENANT_ID` | Microsoft Store | Azure **Entra ID** → your tenant's **Directory (tenant) ID**. |
| `PARTNER_CENTER_CLIENT_ID` | Microsoft Store | **App registration** in Entra ID (Azure portal → Entra ID → App registrations → New registration) → the app's **Application (client) ID**. |
| `PARTNER_CENTER_CLIENT_SECRET` | Microsoft Store | In that app registration → **Certificates & secrets → New client secret** (copy the *value* immediately). |
| `PARTNER_CENTER_SELLER_ID` | Microsoft Store | Partner Center → **Account settings → Identifiers / Legal info** → your **Seller ID**. |
| `SNAPCRAFT_STORE_CREDENTIALS` | Snap Store | Run `snapcraft export-login --snaps verql --channels stable --acls package_upload -` and paste the exported token blob. |

Plus one **repository variable** (not a secret) at the same screen → *Variables*:

| Variable | What it is |
|----------|------------|
| `MICROSOFT_STORE_PRODUCT_ID` | The **Store product ID** of your reserved app (Partner Center → your app → *Product identity*); passed to `msstore publish -id`. |

> The first three Microsoft secrets come from a single **Entra app
> registration** that you must then **link in Partner Center** (Account
> settings → User management → Azure AD applications → *Add Azure AD
> application*) and grant the **Manager** role so it can submit on your behalf.
> See [Microsoft's guide](https://learn.microsoft.com/windows/apps/publish/msstore-dev-cli/github-actions).

The macOS / Apple signing secrets and the optional Windows code-signing path
are documented separately in
[`.github/maintainers/release.md`](.github/maintainers/release.md).

### One-time manual setup (before CI can publish)

CI cannot create a Store listing or a Snap from nothing — seed each once:

- **Microsoft Store:** the app must **already exist** in Partner Center.
  Reserve the name, then copy the exact **Identity Name**, **Publisher**
  (`CN=…`) and **Publisher display name** into the `appx:` block of
  [`electron-builder.yml`](electron-builder.yml) (they're `PLACEHOLDER`s
  today). The **first MSIX must be submitted manually** through Partner
  Center to seed the listing — `msstore publish` only updates an app that is
  already live. Then create the Entra app registration and link it (above).
- **Snap Store:** register the name once with `snapcraft register verql`
  (or on snapcraft.io), then generate `SNAPCRAFT_STORE_CREDENTIALS` with
  `snapcraft export-login` as above.
- **Linux AppImage auto-update:** nothing to seed — but the GitHub Release is
  created as a **draft**; electron-updater clients only see it once a
  maintainer **publishes** it.

## Security

Found a vulnerability? Please follow [SECURITY.md](./SECURITY.md) —
do not open a public issue.

## License

[MIT](./LICENSE) © 2026 Arshad Shah
