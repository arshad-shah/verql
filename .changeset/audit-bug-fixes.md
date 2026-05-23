---
"verql": patch
---

Round of correctness fixes surfaced by a full-codebase audit:

- **Schema cache is cleared on disconnect.** Reconnecting a profile no longer surfaces stale tables/columns from the previous session, which would otherwise cause confusing autocomplete and the occasional "table doesn't exist" against the live server.
- **Tabs detach cleanly when their connection is deleted.** Query tabs lose their dead `connectionId` and land in the "pick a connection" state; ER-diagram and table tabs close outright instead of dangling against a profile that no longer exists.
- **CSV import "update on conflict"** no longer silently drops every conflicting row. Per-row failures now surface in the importer's `errors[]` so the user can see what failed, instead of seeing a successful import that didn't actually write anything.
- **Adapters disconnect cleanly on app quit.** A new `before-quit` handler awaits every active adapter's `disconnect()`, so SSH tunnels and database pools close before the process exits rather than getting reaped abruptly.
- **`Close all tabs` no longer reverses the open tab list** for any subscriber still holding the prior reference. The action now copies the array before reversing it.
- **Disconnect middleware errors are logged** instead of being swallowed by an empty `catch {}`, so a leaking SSH tunnel or socket is discoverable in the developer console instead of vanishing.
- **Command-palette plugin actions** log their errors instead of disappearing into a no-op `.catch(() => {})`.
