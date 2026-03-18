# Changelog

## [1.0.0] - 2026-03-18

### Added
- `dbterm exec <connection> "<sql>"` non-interactive subcommand with CSV output
- Query timeout support (`queryTimeout` per connection, default 30s)
- TTY detection — friendly error when run in non-interactive mode
- Node.js version check (requires >= 18)
- Global unhandled rejection / uncaught exception handlers
- Typed error classes: `DbConnectionError`, `DbQueryError`, `DbTimeoutError`, `ValidationError`, `UserAbortError`
- `printError()` centralized error formatter
- Shared SQL utilities: `quoteIdent`, `quoteLiteral`, `buildPlaceholders`, `splitSQLStatements`, `quoteTable`
- Config migration system (`configVersion` field)
- Adapter factory validates driver availability before connecting
- Comprehensive test suite (67 tests): SQL utilities, error classes, SQLite adapter integration, UI components, config store, CLI smoke tests
- Version output includes node version and platform

### Fixed
- **BUG-1**: MySQL placeholder mismatch — all DML now uses `?` placeholders for MySQL, `$N` for PostgreSQL/SQLite
- **BUG-2**: SQLite default schema now correctly defaults to `'main'` instead of `'public'`
- **BUG-3**: Transaction flag properly reset on `useDatabase()` — rolls back open transactions before switching
- **BUG-4**: SQL file import now uses a proper statement splitter that handles string literals, dollar-quoted strings, DELIMITER directives, and comments
- **BUG-5**: `parseValue()` now validates numeric input and throws `ValidationError` for invalid values instead of inserting NaN
- **BUG-6**: Large table dumps (>10,000 rows) now use paginated fetching with progress indicator instead of loading all rows into memory

### Security
- **SEC-2**: Query timeout support prevents runaway queries from hanging indefinitely
- **SEC-3**: All table/column/schema names consistently go through `quoteIdent()` — eliminates SQL injection via adversarial identifiers
- **SEC-4**: TRUNCATE requires typing the table name to confirm; prominent irreversibility warning

### Changed
- `dataEditor` and `dumpImportMenu` now accept `dbType` parameter for correct placeholder generation
- Dump functions write via streaming (`createWriteStream`) instead of building full string in memory
- TypeScript chalk namespace types replaced with function signatures to fix type errors
