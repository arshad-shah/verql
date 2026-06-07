---
"verql": patch
---

Centralize two more duplicated main-process patterns.

- **`broadcast(event, ...payload)`** (`src/main/ipc/broadcast.ts`) replaces the
  hand-rolled `BrowserWindow.getAllWindows()` send-loop that was copied across
  the IPC handlers, plugins/updater/MCP/settings subsystems. It's typed by
  `IpcEventMap`, so a wrong broadcast payload is now a compile error. (The MCP
  approval send keeps its own path — it early-returns when no window exists.)
- **`errorMessage(err)`** (`shared/errors.ts`) replaces the
  `err instanceof Error ? err.message : String(err)` idiom hand-rolled in 13
  places across the main process and renderer.
- Fix the `settings:changed` event type: it's declared as two positional args
  (`keyPath`, `value`) to match what the main process sends and the renderer
  listener reads — the previous single-object payload type was inaccurate.

No runtime behavior change.
