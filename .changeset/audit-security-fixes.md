---
"verql": patch
---

Security hardening across connection, IPC, and plugin loading paths:

- **PostgreSQL SSL** now verifies the server certificate by default whenever SSL is enabled, instead of silently disabling verification on every encrypted connection. The connection form gains an explicit *SSL Mode* selector — pick "Verify (recommended)" or "Skip verification (insecure)" — so opt-out is deliberate, not a hidden default.
- **MCP server** no longer returns `Access-Control-Allow-Origin: *`. The bearer-token check still gates every request, but removing the wildcard means even a leaked token can't be read by a malicious page in the user's browser.
- **MCP `explain_query` tool** now routes through the same write-approval gate as `query`. Statements that hide DML behind a comment or after a semicolon (`EXPLAIN SELECT 1; DELETE FROM users`) can no longer be smuggled through the "read-only" label.
- **Bundled plugins can no longer be shadowed.** A third-party plugin claiming the name `verql-plugin-postgresql` (or any other bundled name) is now rejected at discover and install time instead of silently overriding the built-in driver and intercepting credentials.
- **Plugin `main` path traversal** is rejected at the validate phase. A manifest declaring `main: '../../../etc/passwd.js'` (or any absolute path) can no longer escape the plugin directory and load arbitrary files via `require()`.
- **Encrypted credentials file** (`credentials.enc`) is now written with mode `0o600` so it isn't world-readable on shared systems.
- **Main window** declares `setWindowOpenHandler` (denies all `window.open` requests) and a `will-navigate` guard pinned to the bundled assets / dev server, so the renderer can never be steered to an external URL.
