---
"@verql/plugin-sdk": minor
---

Remove the host-only `serializeStaticCapabilities` helper from the published surface. It is an internal IPC serialization helper (used only by the host), not a plugin-author API, and was never exported from the in-repo SDK barrel. The `sdk-public-surface` test now also asserts against the published package (exact runtime export set + a host-only no-leak list), so internal↔published drift is caught going forward.
