# DBStudio UX Gap Analysis

> Generated: 2026-04-08

## Critical Issues

### 1. Error Handling Uses `alert()` Instead of In-App UI

**File:** `src/renderer/src/components/connections/ConnectionList.tsx:25`

Connection failures trigger browser `alert()` — jarring, blocks interaction, and inconsistent with desktop app UX. Should use toast notifications or inline error messages.

### 2. No React Error Boundary

No global error boundary exists. Unhandled React errors show blank screens instead of a graceful fallback with recovery options.

### 3. Inconsistent IPC Error Contract

**File:** `src/main/ipc-handlers.ts`

Some handlers return `{ success: false, error }` objects (e.g., `db:connect`), while others throw raw `Error` objects (e.g., `db:query`, `db:get-tables`). The renderer cannot reliably distinguish error types (auth failure vs. network timeout vs. missing table).

### 4. Silent Error Swallowing

**File:** `src/renderer/src/components/query/QueryEditor.tsx:43-45`

Schema loading failures are silently caught — user gets empty autocomplete with no feedback:
```ts
.catch(() => updateTableNames([]))
```

### 5. SQL Injection in SQLite Adapter

**File:** `src/main/db/sqlite.ts:69,73,91,96`

PRAGMA queries use string interpolation instead of parameterization:
```ts
this.db.prepare(`PRAGMA table_info("${table}")`).all()
```

### 6. SSL Certificate Validation Disabled

**File:** `src/main/db/postgres.ts:16`

`rejectUnauthorized: false` disables certificate validation, enabling MITM attacks.

### 7. Plaintext Password Storage

**File:** `src/main/config/store.ts:33`

Database credentials stored as plaintext JSON. No encryption, no OS keychain integration, no restrictive file permissions.

---

## High Severity

### 8. Race Condition on Concurrent Connect

**File:** `src/main/ipc-handlers.ts:42-45`

Two simultaneous `db:connect` calls for the same profile both pass the `has()` check, creating duplicate adapters. The first is orphaned and leaks connections.

### 9. `disconnect()` Not Awaited on Delete

**File:** `src/main/ipc-handlers.ts:32`

`connections:delete` calls `adapter.disconnect()` without `await`. Connection may linger after deletion.

### 10. Loading State Exists But Not Rendered

**File:** `src/renderer/src/stores/schema.ts` (loading flag), `src/renderer/src/components/schema/SchemaTree.tsx:17-55`

`useSchemaStore` has a `loading` boolean that's set but never displayed in the UI. "No tables found" shows during loading, making it indistinguishable from an empty schema or a load error.

### 11. No Query Timeout

`ConnectionProfile.queryTimeout` field exists in types but is never used by any adapter. Long-running queries hang indefinitely (PostgreSQL/MySQL) or freeze the entire app (SQLite, which is synchronous on the main thread).

### 12. Query Execution on Disconnected Connection

**File:** `src/renderer/src/components/query/QueryPanel.tsx:16-25`

No pre-validation that a connection is still active. If the user disconnects via sidebar while a query tab is open, executing throws a cryptic "Not connected. Connect first." error.

### 13. Connection Status Uses Color Alone

**File:** `src/renderer/src/components/connections/ConnectionList.tsx:48`

Connected vs. disconnected status shown only by dot color — inaccessible to colorblind users. Needs text label or distinct icon.

### 14. Non-Atomic Config Writes

**File:** `src/main/config/store.ts:30-34`

`writeFileSync` without temp-file-then-rename pattern. App crash during write corrupts the config. Corrupted config silently resets all saved connections.

### 15. No Graceful Shutdown

**File:** `src/main/index.ts:38-40`

`window-all-closed` handler doesn't clean up active database connections. Connections are orphaned on quit.

---

## Medium Severity

### 16. Form Validation is Browser-Only

**File:** `src/renderer/src/components/connections/ConnectionForm.tsx:64-121`

Relies solely on HTML5 `required` attributes. No custom validation for:
- Port range (accepts 0, negatives)
- Whitespace-only fields
- SQLite file path existence
- No visual error states (red borders, inline messages)

### 17. No Escape Key to Close Modal

**File:** `src/renderer/src/components/connections/ConnectionForm.tsx:49`

Connection form modal has no keyboard dismiss, no focus trap, no focus restoration on close.

### 18. No ARIA Labels or Keyboard Navigation

Zero `aria-label` attributes across the entire UI. Icon-only buttons have no accessible names. Schema tree is not keyboard-navigable. No `tabIndex` management.

### 19. Large Result Sets Not Virtualized

**File:** `src/renderer/src/components/results/ResultsGrid.tsx:56-71`

ag-grid renders all rows at once. No pagination, no "showing X of Y" indicator, no truncation warning for very large datasets.

### 20. Schema Cache Never Auto-Invalidates

**File:** `src/renderer/src/stores/schema.ts:25-43`

Schema data is cached with no TTL or auto-refresh. Tables added/removed by other clients are invisible until manual refresh.

### 21. ER Diagram Unbounded Parallel Requests

**File:** `src/renderer/src/components/er/ERDiagram.tsx:40-45`

`Promise.all` loads all tables' columns simultaneously with no concurrency limit. Could overwhelm small databases.

### 22. `db:cancel-query` is a No-Op

**File:** `src/main/ipc-handlers.ts:111-116`

Checks `'cancelQuery' in adapter` but no adapter implements it. Cancel button in UI does nothing. No feedback to user that cancellation failed.

### 23. Tab Bar Missing Connection Indicator

**File:** `src/renderer/src/components/shell/TabBar.tsx:11-29`

Tabs show "Query 1" etc. but don't indicate which database connection they use. Confusing when multiple connections are open.

### 24. ER Diagram Hard-Coded Schema

**File:** `src/renderer/src/components/shell/Sidebar.tsx:26-29`

PostgreSQL defaults to `public`, MySQL to current database. No schema selector dropdown on the ER diagram view.

### 25. Save Button Has No Loading/Disable State

**File:** `src/renderer/src/components/connections/ConnectionForm.tsx`

Save/Add button doesn't disable during submission. Rapid clicks create duplicate connections.

---

## Low Severity

### 26. No Unsaved Query Indicator

Tabs don't show a dot or asterisk for modified-but-unsaved queries. Closing a tab loses work without warning.

### 27. No Copy/Export from Results

**File:** `src/renderer/src/components/results/ResultsGrid.tsx`

No way to copy selected cells, export to CSV/JSON, or copy as INSERT statements.

### 28. No Window State Persistence

**File:** `src/main/index.ts:6-12`

Window size (1400x900) is hardcoded. Position and size aren't saved between sessions.

### 29. No Application Menu

No File/Edit/View menus. Missing standard shortcuts (Cmd+Q, Cmd+C/V in native context). No keyboard shortcuts for common DB operations.

### 30. Dark Mode Only

Hard-coded dark theme. No light mode or system preference detection.

### 31. No Query History Persistence

Query history only exists in renderer state. Lost on app restart.

### 32. Missing IPC Channels for Planned Features

Types and README reference features with no IPC support:
- Transaction management (`db:begin`, `db:commit`, `db:rollback`)
- Saved queries persistence
- Data export/import (CSV, JSON, SQL)
- Query history persistence
- EXPLAIN/query plan analysis
- Batch query execution

---

## Summary by Priority

| Priority | Count | Action |
|----------|-------|--------|
| Critical | 7 | Fix before any release |
| High | 8 | Fix before beta |
| Medium | 10 | Fix before v1.0 |
| Low | 7 | Backlog / nice-to-have |
