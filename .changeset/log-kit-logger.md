---
"verql": patch
---

Build the main-process app logger on `@arshad-shah/log-kit`.

The hand-rolled logger core is replaced by log-kit while the app's narrow
four-level `Logger` facade (serialised `detail`, `child(scope)`) stays
byte-for-byte compatible — every existing call site is unchanged.

- log-kit owns the record pipeline (level gating, child-scope nesting) and fans
  each record out to two app-supplied transports with **failure isolation**: a
  throwing activity sink can no longer break console output, and vice versa.
- The transports preserve existing behaviour exactly — a console transport keeps
  the `[scope] message` format and level→method mapping (info → `console.log`),
  and an activity transport records `log` entries into the unified activity
  stream.
- Adds `logger.mark(label)` perf markers (recording `durationMs`); plugin boot is
  wired through it as the first use.

No user-facing behavior change.
