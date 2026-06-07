---
"verql": patch
---

Centralize two more duplicated main-process patterns.

- **`broadcast(event, ...payload)`** (`src/main/ipc/broadcast.ts`) replaces the
  hand-rolled `BrowserWindow.getAllWindows()` send-loop that was copied across
  the IPC handlers, plugins/updater/MCP subsystems. It's typed by `IpcEventMap`,
  so a wrong broadcast payload is now a compile error.
- **`errorMessage(err)`** (`shared/errors.ts`) replaces the
  `err instanceof Error ? err.message : String(err)` idiom hand-rolled in 13
  places across the main process and renderer.

No behavior change.
