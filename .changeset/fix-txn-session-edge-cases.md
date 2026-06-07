---
"verql": patch
---

Fix two transaction-session edge cases in query execution (renderer
orchestration only — session/pool logic stays in the driver adapters):

- A tab whose selected database differs from the connection's default no longer
  throws "No open session" on its first transactional query. The database/schema
  context is now applied *before* the session is opened, so the pool-rebuilding
  `switchDatabase` (already idempotent in the adapter) can't wipe the session.
- Switching a tab's connection now releases the open transactional session on
  the old connection (tolerant no-op when none) and resets the tab's
  transaction status, instead of orphaning the session.
