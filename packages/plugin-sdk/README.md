# Verql Plugin SDK (`@verql/plugin-sdk`)

The public package third-party developers install to build a [Verql](https://verql.arshadshah.com)
plugin. It ships the **types**, **pure helpers**, and the **capability model** a
plugin codes against — everything you need to author a driver, exporter, theme,
AI provider, panel, or tool without a checkout of the Verql repo.

```bash
npm install @verql/plugin-sdk
# or: pnpm add @verql/plugin-sdk
```

## Documentation

- **Getting started + full plugin guide:** https://verql.arshadshah.com/plugins/sdk/
- **Every contribution surface** (driver, exporter, importer, formatter, type
  mapper, theme, panel, command, AI provider, tool, …): https://verql.arshadshah.com/develop/plugins/
- **Security & permissions** (read before reaching for `keyring`, `connections`,
  or `ipc`): https://verql.arshadshah.com/develop/plugin-security/

## What's in the package

| Export group | Examples |
|--------------|----------|
| **Types** | `PluginContext`, `DriverFactory`, `DbAdapter`, `Tool`, `ConnectionField`, `RegisteredTheme`, … |
| **Authoring** | `definePlugin`, `PluginModule` |
| **SQL helpers** | `quoteIdentifier`, `validateIdentifier`, `formatSqlValue`, `generateCreateTable`, `generateInsertStatements`, `splitSqlStatements`, `importCsvToTable`, `createRelationalGetTableData` |
| **Themes** | `validateTheme`, `REQUIRED_THEME_TOKENS`, `RECOMMENDED_THEME_TOKENS` |
| **Tools** | `isWriteQuery`, `toJsonSchema` |
| **Errors** | `safeCall`, `ErrorBudget`, `PluginError` |
| **Permissions** | `ALL_PERMISSIONS`, `PERMISSION_INFO`, `PermissionDeniedError`, `hasPermission`, `effectiveGrants`, `isPluginPermission`, type `PluginPermission` |

## Quick start

```ts
import { definePlugin } from '@verql/plugin-sdk'

export default definePlugin({
  manifest: {
    name: 'my-plugin',
    version: '0.1.0',
    displayName: 'My Plugin',
    main: 'index.js',
  },
  activate(ctx) {
    // register contributions via ctx.* registries
  },
})
```

`zod` is a peer of the tool-schema helpers and ships as a runtime dependency.

## License

[MIT](https://github.com/arshad-shah/verql/blob/main/LICENSE) © Arshad Shah
