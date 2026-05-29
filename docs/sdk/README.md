# Verql Plugin SDK (`@verql/plugin-sdk`)

The public package third-party developers install to build a Verql plugin. It
ships the **types**, **pure helpers**, and the **capability model** a plugin
codes against — everything you need to author a driver, exporter, theme, AI
provider, panel, or tool without a checkout of the Verql repo.

```bash
npm install @verql/plugin-sdk
# or: pnpm add @verql/plugin-sdk
```

- **New to plugins?** Start with [getting-started.md](./getting-started.md) for
  a minimal end-to-end plugin.
- **Reference for every contribution surface** (driver, exporter, importer,
  formatter, type mapper, theme, panel, command, AI provider, tool, …) lives in
  [`../plugins.md`](../plugins.md). That doc is the canonical catalogue; this
  package is how you consume those surfaces from outside the repo.
- **Security & permissions:** read [`../plugin-security.md`](../plugin-security.md)
  before you reach for `keyring`, `connections`, or `ipc`.

## What's in the package

| Export group | Examples | Notes |
|--------------|----------|-------|
| **Types** | `PluginContext`, `DriverFactory`, `DbAdapter`, `Tool`, `ConnectionField`, `RegisteredTheme`, … | The full type surface a plugin codes against. Erased at runtime. |
| **Authoring** | `definePlugin`, `PluginModule` | Typed identity helper that pins your `manifest` + `activate`/`deactivate` shape. |
| **SQL helpers** | `quoteIdentifier`, `validateIdentifier`, `formatSqlValue`, `generateCreateTable`, `generateInsertStatements`, `splitSqlStatements`, `importCsvToTable`, `createRelationalGetTableData` | Parameterised on your driver's quote char — compose them instead of hardcoding a dialect. |
| **Capabilities** | `serializeStaticCapabilities` | Advertise what your driver supports (transactions, explain, …). |
| **Themes** | `validateTheme`, `REQUIRED_THEME_TOKENS`, `RECOMMENDED_THEME_TOKENS` | Validate a theme with the same checker the host uses. |
| **Tools** | `isWriteQuery`, `toJsonSchema` | Build AI/MCP tool schemas. |
| **Errors** | `safeCall`, `ErrorBudget`, `PluginError` | Match the host's error-handling contract. |
| **Permissions** | `ALL_PERMISSIONS`, `PERMISSION_INFO`, `PermissionDeniedError`, `hasPermission`, `effectiveGrants`, `isPluginPermission`, type `PluginPermission` | The capability model your manifest declares against. |

### What's deliberately *not* exported

`createPluginContext` and the registry **implementations** (`DriverRegistryImpl`,
…) are the **host's** concern. A plugin receives a ready `PluginContext` in
`activate(ctx)`; it never constructs one. Those live in the app and pull in
Electron, so the published package stays Electron-free and lightweight (~13 KB,
`zod` as its only runtime dependency).

## How a plugin is discovered

Verql loads plugins from `userData/plugins/`. Each plugin is a folder with a
`plugin-manifest.json` (or a `package.json` carrying the `verql-plugin`
keyword) and a compiled `main` entry that exports `activate(ctx)`. The
`permissions` array in the manifest declares the sensitive capabilities you
need — see [getting-started.md](./getting-started.md) and
[`../plugin-security.md`](../plugin-security.md).

## Versioning & releases

`@verql/plugin-sdk` is versioned and published **independently** of the desktop
app so its API can stabilise on its own cadence:

- The app releases on `v*.*.*` tags (`.github/workflows/release.yml`).
- The SDK publishes on `sdk-v*` tags (`.github/workflows/publish-sdk.yml`),
  which verifies the tag matches `packages/plugin-sdk/package.json`, typechecks,
  builds with `tsup`, and runs `pnpm publish --provenance`.

To cut an SDK release: bump `packages/plugin-sdk/package.json`, commit, then
`git tag sdk-vX.Y.Z && git push origin sdk-vX.Y.Z`.

## Local development

The package is a pnpm workspace member under `packages/plugin-sdk`:

```bash
pnpm --filter @verql/plugin-sdk build       # bundle ESM + CJS + d.ts into dist/
pnpm --filter @verql/plugin-sdk typecheck   # tsc --noEmit
```
