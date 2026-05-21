# Nova internals

| Doc | What's inside |
|-----|---------------|
| [plugins.md](./plugins.md) | What a plugin is, every contribution surface (driver, exporter, importer, type mapper, theme, panel, command, AI provider, settings, …), and how to write one. Start here if you're adding a new database type. |
| [ipc.md](./ipc.md) | How the renderer talks to the main process. Read this when you need to add or rename an IPC channel. |

The architecture is **orchestrator + plugins**: `src/main/` is the
orchestrator (window management, IPC plumbing, plugin host) and almost
everything else lives in a plugin under `src/main/plugins/bundled/`.
Adding a new database type or file format means writing a plugin — see
[plugins.md](./plugins.md).
