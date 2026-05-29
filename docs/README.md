# Verql docs

Three audiences, three sections.

## For users

End-user documentation for the Verql app — installing, connecting, querying,
and managing plugins. Start at **[guide/README.md](./guide/README.md)**. The
in-app **Help → Verql User Guide** menu links here.

## For plugin developers

| Doc | What's inside |
|-----|---------------|
| [sdk/README.md](./sdk/README.md) | The `@verql/plugin-sdk` package: what it exports, install, versioning/publishing. **Start here to build a plugin.** |
| [sdk/getting-started.md](./sdk/getting-started.md) | A minimal end-to-end plugin walkthrough. |
| [plugins.md](./plugins.md) | The canonical catalogue: every contribution surface (driver, exporter, importer, formatter, type mapper, theme, panel, command, AI provider, settings, …) and how to write one. |
| [plugin-security.md](./plugin-security.md) | The plugin trust boundary: the capability/permission model, install hardening, what Verql does and does not enforce, and the roadmap. Read before using `keyring`, `connections`, or `ipc`. |

## For contributors (internals)

| Doc | What's inside |
|-----|---------------|
| [architecture.md](./architecture.md) | The whole picture: process model, the `shared/` boundary, main-process subsystems, renderer stores + design system, the plugin model, and two end-to-end data-flow walkthroughs. **Start here.** |
| [ipc.md](./ipc.md) | How the renderer talks to the main process. Read this when you need to add or rename an IPC channel. |
| [ai.md](./ai.md) | The AI assistant subsystem: providers, the shared tool registry (AI + MCP), the App-Action registry (deep-link chips + agentic UI), the orchestration loop with token budgeting, and persisted/branchable conversation history. |

The architecture is **orchestrator + plugins**: `src/main/` is the
orchestrator (window management, IPC plumbing, plugin host) and almost
everything else lives in a plugin under `src/main/plugins/bundled/`.
Adding a new database type or file format means writing a plugin — see
[plugins.md](./plugins.md).
