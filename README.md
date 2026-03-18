# dbterm

A full-featured terminal database client -- like IntelliJ IDEA's database editor, in your terminal.

```
  ██████╗ ██████╗ ████████╗███████╗██████╗ ███╗   ███╗
  ██╔══██╗██╔══██╗╚══██╔══╝██╔════╝██╔══██╗████╗ ████║
  ██║  ██║██████╔╝   ██║   █████╗  ██████╔╝██╔████╔██║
  ██║  ██║██╔══██╗   ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║
  ██████╔╝██████╔╝   ██║   ███████╗██║  ██║██║ ╚═╝ ██║
  ╚═════╝ ╚═════╝    ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝
```

---

## Features

- **Multi-database support** -- PostgreSQL, MySQL/MariaDB, SQLite (SQL Server & MongoDB coming)
- **Persistent connection manager** -- save, edit, and delete named connections
- **Rich SQL editor** -- multi-line input, SQL syntax highlighting, semicolon-to-run, `.explain` mode
- **Schema browser** -- browse tables, views, columns with types/nullability/PK, indexes, foreign keys
- **Data editor** -- insert, update, delete rows with column type validation
- **Transaction support** -- BEGIN / COMMIT / ROLLBACK with visual indicators
- **Saved queries** -- save, tag, organize, and rerun SQL snippets
- **Dump & import** -- SQL, CSV, JSON export; CSV import; SQL file execution
- **Query history** -- every query persisted with timing, row count, and error status
- **Non-interactive mode** -- `dbterm exec` for scripted usage with CSV output
- **Query timeout** -- configurable per-connection (default 30s)
- **Beautiful TUI** -- box-drawing borders, status bars, syntax highlighting, spinner feedback

---

## Install

```bash
npm install -g dbterm
```

Requires Node.js 18+.

Or run from source:

```bash
git clone <repo>
cd dbterm
npm install
npm run build
npm install -g .
```

---

## Usage

```bash
dbterm                              # Open the connection manager (interactive)
dbterm list                         # List all saved connections
dbterm connect "My Postgres"        # Connect directly by name
dbterm exec "My DB" "SELECT 1"      # Execute SQL non-interactively (CSV output)
dbterm --version                    # Show version
dbterm --help                       # Show help
```

### Non-Interactive Mode

```bash
# Output as CSV to stdout
dbterm exec "Production DB" "SELECT id, name FROM users"

# Pipe to file
dbterm exec "My DB" "SELECT * FROM orders" > orders.csv

# Use in scripts
COUNT=$(dbterm exec "My DB" "SELECT COUNT(*) as n FROM users" | tail -1)
```

---

## Connection Setup

| Field         | PostgreSQL   | MySQL        | SQLite |
|---------------|-------------|-------------|--------|
| Name          | required    | required    | required |
| Host          | localhost   | localhost   | --     |
| Port          | 5432        | 3306        | --     |
| Database      | required    | required    | --     |
| Username      | required    | required    | --     |
| Password      | required    | required    | --     |
| SSL           | optional    | optional    | --     |
| File path     | --          | --          | required |
| Query timeout | 30000ms     | 30000ms     | 30000ms |

Connections are **tested on save** -- you can also save untested connections if the server isn't reachable yet.

---

## SQL Editor

Inside a session, choose **SQL Editor**. Commands:

| Input         | Action                                      |
|---------------|---------------------------------------------|
| `SELECT ...;` | Execute query (semicolon triggers run)      |
| `.explain`    | Run `EXPLAIN ANALYZE` on the query          |
| `.save`       | Save current query as a snippet             |
| `.tables`     | Print table list inline                     |
| `.schemas`    | List available schemas                      |
| `.history`    | Show recent queries inline                  |
| `.clear`      | Clear the multi-line buffer                 |
| `.begin`      | Start a transaction                         |
| `.commit`     | Commit the current transaction              |
| `.rollback`   | Rollback the current transaction            |
| `.exit`       | Return to main menu                         |
| `Ctrl+C`      | Clear buffer / exit editor                  |

Multi-line queries are supported -- keep typing across lines, end with `;` to execute.

---

## Session Menu

```
--- Query ---
  SQL Editor          Write & run SQL
  Saved Queries       Manage & run saved snippets
  Query History       Rerun past queries
--- Schema ---
  Browse Tables       List & inspect tables
  Table Data          Preview table contents
  Table Structure     Columns, indexes, FKs
  View DDL            Show CREATE TABLE statement
--- Edit Data ---
  Data Editor         Insert / Update / Delete rows
  Transaction         BEGIN / COMMIT / ROLLBACK
--- Dump & Import ---
  Dump & Import       SQL/CSV/JSON export, CSV import
--- Database ---
  Switch Schema       Change active schema
  Switch Database     Change active database
  Server Info         Version & connection details
--- Tools ---
  Export Results      Last query result to CSV or JSON
  Clear History       Clear query history
```

---

## Dump & Import

### Export

- **Dump table to SQL** -- INSERT statements with configurable batch size. Large tables (>10k rows) use paginated fetching with progress.
- **Dump table to CSV** -- Standard CSV format
- **Dump table to JSON** -- Optional pretty-printing
- **Export query to CSV/JSON** -- Run any SQL and save the result
- **Dump schema DDL** -- CREATE TABLE statements for selected tables

### Import

- **Import CSV** -- Map CSV columns to table columns, with conflict handling (fail or skip)
- **Execute SQL file** -- Proper statement splitting that handles string literals, dollar-quoted strings, MySQL `DELIMITER`, and comments. Optional transaction wrapping.

---

## Transaction Workflow

1. Open **Transaction** from the main menu or type `.begin` in the SQL editor
2. Run queries -- all changes are within the transaction
3. The `[TXN]` indicator shows in prompts while a transaction is active
4. **COMMIT** to save changes or **ROLLBACK** to discard
5. Disconnecting with an open transaction prompts for rollback

---

## Saved Queries

1. Save queries from the SQL editor with `.save` or from query history
2. Tag and organize queries with descriptions
3. Queries can be filtered by database type
4. Run saved queries directly from the saved queries menu

---

## Supported Databases

| DB             | Status    | Driver           |
|----------------|-----------|------------------|
| PostgreSQL     | Full      | `pg`             |
| MySQL/MariaDB  | Full      | `mysql2`         |
| SQLite         | Full      | `better-sqlite3` |
| SQL Server     | Planned   | `mssql`          |
| MongoDB        | Planned   | `mongodb`        |

---

## Troubleshooting

### PostgreSQL SSL / RDS

If connecting to AWS RDS or a server requiring SSL:
- Enable SSL in the connection settings
- The client uses `rejectUnauthorized: false` by default

### pg_hba.conf authentication

If you get "password authentication failed":
- Check your `pg_hba.conf` allows connections from your host
- Try `md5` or `scram-sha-256` authentication method

### SQLite file permissions

Ensure the SQLite file and its parent directory are writable.

### Query timeout

Default timeout is 30 seconds. Change it per-connection in the connection editor.
Set to 0 for no timeout (not recommended for production databases).

### Missing database driver

If you see "driver not installed", install the required package:
```bash
npm install pg           # PostgreSQL
npm install mysql2       # MySQL / MariaDB
npm install better-sqlite3  # SQLite
```

---

## Contributing

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build
npm run build

# Run tests
npm test

# Type check
npx tsc --noEmit
```

### Project Structure

```
src/
  index.ts                  # CLI entry point
  config/
    store.ts                # Conf-based persistence
  db/
    adapter.ts              # DbAdapter interface + implementations
  commands/
    connections.ts          # Connection manager
    session.ts              # Main interactive session
    editor.ts               # Data editor (Insert/Update/Delete)
    dump.ts                 # Dump & Import
    snippets.ts             # Saved queries manager
    transaction.ts          # Transaction management
  ui/
    theme.ts                # Colors, borders, table renderer
  utils/
    sql.ts                  # Shared SQL utilities
    errors.ts               # Typed error classes
tests/
  sql.test.ts               # SQL utility tests
  errors.test.ts            # Error class tests
  adapter-sqlite.test.ts    # SQLite integration tests
  theme.test.ts             # UI component tests
  config.test.ts            # Config store tests
  cli.test.ts               # CLI smoke tests
```

---

## License

MIT
