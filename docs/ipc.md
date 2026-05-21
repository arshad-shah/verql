# IPC channels

All inter-process communication between the renderer and the main process
goes through a typed, centrally-registered set of channels declared in
[`shared/ipc.ts`](../shared/ipc.ts). There are two kinds:

| Kind | Direction | Constant | Usage |
|------|-----------|----------|-------|
| **Invoke** | renderer → main → renderer | `IPC_CHANNELS.X` | one-shot request / response, awaited Promise |
| **Event** | main → renderer (one-way) | `IPC_EVENTS.X` | broadcast push (streaming, lifecycle notifications) |

The renderer talks to both via the preload bridge:

```ts
import { IPC_CHANNELS, IPC_EVENTS } from '@shared/ipc'

// invoke (request / response)
const result = await window.electronAPI.invoke(IPC_CHANNELS.DB_QUERY, id, sql)

// subscribe (one-way push)
const off = window.electronAPI.on(IPC_EVENTS.AI_CHAT_EVENT, (event) => { … })
off() // unsubscribe
```

Never use a string literal at a call site. The CI test
`tests/unit/ipc-channels-coverage.test.ts` scans the source tree for
string-literal `invoke()` / `on()` calls and fails the build if it finds one
that isn't a known channel — and a forgotten constant is a clear regression
signal.

## Adding a new invoke channel

It's a three-step edit, **all in `shared/ipc.ts`**:

1. Add the channel definition to the `IpcChannelMap` type. Be precise about
   the `args` tuple and the `return` type — these are what the renderer
   actually sees through `window.electronAPI.invoke()`.

   ```ts
   interface IpcChannelMap {
     // …
     'db:explain-query': {
       args: [profileId: string, sql: string]
       return: { plan: string; cost: number }
     }
   }
   ```

2. Add the matching constant to `IPC_CHANNELS`. Follow the existing
   `SCREAMING_SNAKE_CASE` convention; the section comment groups it under
   the right domain (`DB`, `PLUGINS`, `AI`, …).

   ```ts
   export const IPC_CHANNELS = {
     // …
     DB_EXPLAIN_QUERY: 'db:explain-query',
   } as const satisfies Record<string, IpcChannel>
   ```

   The `satisfies` clause makes TypeScript reject any value that isn't a
   key of `IpcChannelMap` — so a typo here is a compile-time error, not a
   runtime mystery.

3. Implement the handler. Pick the right file under `src/main/ipc/` based
   on the domain prefix:

   - `connections:*` → [`ipc/connections.ts`](../src/main/ipc/connections.ts)
   - `db:*` → [`ipc/db.ts`](../src/main/ipc/db.ts)
   - `export:*` / `import:*` → [`ipc/export-import.ts`](../src/main/ipc/export-import.ts)
   - `plugins:*` → [`ipc/plugins.ts`](../src/main/ipc/plugins.ts)
   - `settings:*` → [`ipc/settings.ts`](../src/main/ipc/settings.ts)
   - `dialog:*` → [`ipc/dialog.ts`](../src/main/ipc/dialog.ts)
   - `keyring:*` → [`ipc/keyring.ts`](../src/main/ipc/keyring.ts)
   - `mcp:*` → [`ipc/mcp.ts`](../src/main/ipc/mcp.ts)
   - `migration:*` → [`ipc/migration.ts`](../src/main/ipc/migration.ts)
   - `app:*` → [`ipc/app.ts`](../src/main/ipc/app.ts)

   The handler signature is inferred from `IpcChannelMap`:

   ```ts
   // src/main/ipc/db.ts
   import { IPC_CHANNELS } from '@shared/ipc'

   handle(IPC_CHANNELS.DB_EXPLAIN_QUERY, async (profileId, sql) => {
     const adapter = requireAdapter(profileId)
     const result = await adapter.query(`EXPLAIN ${sql}`)
     return { plan: formatPlan(result.rows), cost: 0 }
   })
   ```

   `handle` is the wrapper defined in [`ipc/context.ts`](../src/main/ipc/context.ts).
   It's typed by `IpcChannelMap` so the handler's `args` and `return` must
   match — if you forget a field or get a type wrong, the build fails.

4. Call it from the renderer:

   ```ts
   import { IPC_CHANNELS } from '@shared/ipc'

   const { plan } = await window.electronAPI.invoke(
     IPC_CHANNELS.DB_EXPLAIN_QUERY,
     profileId,
     sql
   )
   ```

No `preload/index.ts` change is needed: the generic `invoke<K>(channel, …args)`
signature already passes through any channel that's in the map.

## Adding a new broadcast event

Broadcasts go the other way: `main → renderer`. They don't return a value.

1. Add the event to `IpcEventMap` in `shared/ipc.ts`:

   ```ts
   export interface IpcEventMap {
     // …
     'db:long-query-progress': [payload: { profileId: string; pct: number }]
   }
   ```

2. Add the constant to `IPC_EVENTS`:

   ```ts
   export const IPC_EVENTS = {
     // …
     DB_LONG_QUERY_PROGRESS: 'db:long-query-progress'
   } as const satisfies Record<string, IpcEvent>
   ```

3. Emit it from main. Inside a plugin use `ctx.broadcast(...)`; in the IPC
   handlers, use `BrowserWindow.getAllWindows().forEach(w => w.webContents.send(IPC_EVENTS.X, payload))`.

4. Subscribe in the renderer:

   ```ts
   const off = window.electronAPI.on(IPC_EVENTS.DB_LONG_QUERY_PROGRESS, ({ profileId, pct }) => {
     // …
   })
   // off() to unsubscribe
   ```

## Guard rails

| Check | Where | What breaks if you skip a step |
|-------|-------|--------------------------------|
| Compile-time channel registration | `IPC_CHANNELS` uses `satisfies Record<string, IpcChannel>` | Typo → build fail |
| Compile-time map coverage | `tests/unit/ipc-channels-coverage.test.ts` has `Exclude<IpcChannel, ChannelValues>` | Forgot a constant → build fail |
| Runtime call-site audit | Same test scans source for string-literal `invoke`/`on` calls | Hand-rolled string literal → test fail |
| Renderer typing | `window.electronAPI.invoke<K>()` | Wrong args / wrong return → build fail |
| Handler typing | `handle: Handle` in `ipc/context.ts` | Wrong args / wrong return → build fail |

## Picking a channel name

- Use `domain:verb-noun` (kebab-case after the colon). Multi-level
  domains use additional colons: `plugins:ui:get-contributions`.
- Pick the domain prefix that already exists rather than inventing a new
  one — it determines which file the handler goes in.
- Avoid abbreviations that hide intent. `db:explain-query` is better than
  `db:eq`.
