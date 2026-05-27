# Verql internals

| Doc | What's inside |
|-----|---------------|
| [architecture.md](./architecture.md) | The whole picture: process model, the `shared/` boundary, main-process subsystems, renderer stores + design system, the plugin model, and two end-to-end data-flow walkthroughs. **Start here.** |
| [plugins.md](./plugins.md) | What a plugin is, every contribution surface (driver, exporter, importer, formatter, type mapper, theme, panel, command, AI provider, settings, …), and how to write one. Read this if you're adding a new database type. |
| [ipc.md](./ipc.md) | How the renderer talks to the main process. Read this when you need to add or rename an IPC channel. |
| [ai.md](./ai.md) | The AI assistant subsystem: providers, the shared tool registry (AI + MCP), the App-Action registry (deep-link chips + agentic UI), the orchestration loop with token budgeting, and persisted/branchable conversation history. |

The architecture is **orchestrator + plugins**: `src/main/` is the
orchestrator (window management, IPC plumbing, plugin host) and almost
everything else lives in a plugin under `src/main/plugins/bundled/`.
Adding a new database type or file format means writing a plugin — see
[plugins.md](./plugins.md).
