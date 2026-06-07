---
"verql": patch
---

Streamline IPC channel/event definitions so each wire string is authored once.

Previously every channel name (e.g. `'db:connect'`) was written twice in
`shared/ipc.ts` — as a key in `IpcChannelMap` and as the value in
`IPC_CHANNELS` — and kept in sync by hand. The `args`/`return` contracts now
live in `IpcChannelShapes` (and `IpcEventShapes`) keyed by the constant name,
the wire string lives only in `IPC_CHANNELS`/`IPC_EVENTS`, and the
wire-string-keyed `IpcChannelMap`/`IpcEventMap` consumed by `invoke`/`handle`/
the preload bridge are derived from the two. A `satisfies Record<keyof
IpcChannelShapes, string>` clause makes any drift between the halves a
compile-time error. No runtime behavior or channel values change; all call
sites continue to use `IPC_CHANNELS.X` / `IPC_EVENTS.X`.
