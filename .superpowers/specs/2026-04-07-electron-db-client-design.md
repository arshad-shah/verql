# Electron Database Client — Design Spec

A brand new, standalone desktop database client built with Electron + React. Dark-first, developer-focused, with first-class visualization, a plugin system, and cross-database migration. Separate product from dbterm (which remains the terminal client).

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Platform | Electron + React | Rich ecosystem, fastest dev velocity, npm plugin model |
| Database support (v1) | PostgreSQL, MySQL, SQLite | Ship tight, expand via plugins |
| Code editor | Monaco Editor | Already in Electron/Chromium, VS Code keybindings free |
| ER diagram engine | React Flow + Dagre + ELK.js | Interactive canvas with two layout algorithms for different schema sizes |
| Data grid | AG Grid Community | Handles millions of rows, column pinning, cell editing, proven at scale |
| Charts | Recharts | React-native, composable, good dark theme support |
| Plugin model | npm packages + typed SDK | Familiar to JS/TS devs, zero registry infrastructure needed at launch |
| Identity | New product, new name, new repo | Clean break from dbterm |

## Architecture

### Application Shell

```
┌─────────────────────────────────────────────────────────────┐
│  Title Bar (custom, frameless)                               │
├────┬──────────┬─────────────────────────────────────────────┤
│    │          │  Tab Bar (Query 1 | orders | ER Diagram)     │
│ A  │ Secondary├─────────────────────────────────────────────┤
│ c  │ Sidebar  │                                             │
│ t  │          │  Main Content Area                          │
│ i  │ (context │  (editor, grid, diagram, chart — per tab)   │
│ v  │  depends │                                             │
│ i  │  on      │                                             │
│ t  │  active  ├─────────────────────────────────────────────┤
│ y  │  icon)   │  Bottom Panel (results, terminal, output)    │
│    │          │                                             │
│ B  │          │                                             │
│ a  │          │                                             │
│ r  │          │                                             │
├────┴──────────┴─────────────────────────────────────────────┤
│  Status Bar (connection info, encoding, query status)        │
└─────────────────────────────────────────────────────────────┘
```

**VS Code-style activity bar** on the far left with icons for:
- Explorer (connections + schema tree)
- Query Editor
- Schema / ER Diagram
- Charts / Visualization
- Extensions / Plugins

The secondary sidebar content changes based on the active activity bar icon. All panels are resizable. The sidebar is collapsible for maximum content area.

### Process Architecture

```
Main Process (Node.js)
├── Database connections (pg, mysql2, better-sqlite3)
├── Connection pool management
├── Query execution with timeout + cancellation
├── IPC bridge to renderer
├── Plugin host (loads npm plugin packages)
├── File I/O (import/export)
└── Auto-updater (electron-updater)

Renderer Process (Chromium)
├── React application
├── Monaco Editor instances
├── AG Grid / virtualized data grid
├── React Flow (ER diagrams)
├── Recharts (data visualization)
├── Plugin UI sandboxes (iframes)
└── State management (Zustand)

Web Workers
├── Large dataset processing
├── CSV/JSON parsing
├── SQL formatting
└── Query plan parsing
```

Database connections run in the **main process** to avoid Chromium's networking limitations. The renderer communicates via Electron IPC. Heavy data processing (CSV parsing, large result set formatting) runs in **web workers** to keep the UI thread free.

### State Management

**Zustand** for global state — lightweight, no boilerplate, works well with React.

Key state slices:
- `connections` — saved connection profiles, active connection
- `tabs` — open tabs with their content (query text, result data, scroll position)
- `schema` — cached schema metadata per connection (tables, columns, FKs, indexes)
- `preferences` — theme, keybindings, editor settings
- `plugins` — installed plugins, their state

Connection profiles persist to a JSON config file (similar to dbterm's Conf-based store). Schema metadata is cached in memory and refreshed on connect or manual refresh.

## Features

### 1. Connection Manager

- Named connection profiles with full configuration (host, port, database, username, password, SSL, SSH tunnel)
- Connection groups/folders for organizing (Production, Staging, Dev)
- Quick connect via connection string paste
- Connection testing before save
- Color-coded connections (user-assigned colors appear in status bar and tab indicators)
- Recent connections list
- Environment variable support in connection fields (e.g., `$DB_PASSWORD`)

### 2. Query Editor (Monaco)

**Editing:**
- Full Monaco editor with SQL syntax highlighting (dialect-aware: PostgreSQL, MySQL, SQLite)
- Schema-aware autocomplete — tables, columns, functions, keywords from connected database
- Custom SQL language service registered with Monaco for each dialect
- Query formatting / prettify (built-in SQL formatter)
- Snippet expansion (e.g., `sel` → `SELECT * FROM |`)
- Multi-cursor editing, find & replace, code folding
- Parameter placeholder support

**Execution:**
- `Cmd+Enter` to run full query or selected text
- `Cmd+Shift+Enter` to run and keep editor focused
- Multiple result sets from multi-statement queries (each in its own result tab)
- Execution timer + row count displayed immediately
- Cancel running queries (sends cancellation to DB)
- EXPLAIN ANALYZE with visual plan rendering
- Query timeout protection (configurable per connection)

**Management:**
- Tabbed interface — multiple query editors open simultaneously
- Saved queries with name, tags, and description
- Query history with search and re-run (persisted across sessions)
- Unsaved query recovery on crash (auto-save to temp)
- Import/export `.sql` files

**Safety:**
- Destructive query warnings — confirm before `DROP`, `DELETE`, `TRUNCATE`
- Transaction mode toggle — wrap all queries in a transaction with explicit commit/rollback
- Read-only connection mode — prevent accidental writes on production
- Undo for data changes (generates reversal SQL)

### 3. Data Grid

**Rendering:**
- Virtualized grid — only renders visible rows, handles millions of rows smoothly
- Column resizing, reordering, and pinning (freeze columns left/right)
- Multi-column sort (click headers, shift+click for secondary sort)
- Alternating row striping with subtle hover highlight
- Column type indicators: 🔑 primary key, 🔗 foreign key, nullable marker
- NULL values displayed distinctly (italic, dimmed, "NULL" label)
- Pagination with configurable page size (50, 100, 500, 1000)

**Inline Editing:**
- Double-click cell to edit in place
- Pending changes highlighted in orange; new rows in green; deleted rows struck through in red
- Batch apply — review all pending changes before committing to the database
- Undo/redo per cell (`Cmd+Z` / `Cmd+Shift+Z`)
- FK columns show resolved preview (e.g., `7 → Alice Johnson`) — click to navigate to referenced row
- JSON and long text columns expand in a modal editor
- Type-aware input validation (numbers, dates, booleans, enums)

**Filtering & Search:**
- Smart filter bar — type SQL-like conditions (e.g., `status = 'shipped' AND total > 100`)
- Click column header → quick filter menu (equals, contains, greater than, NULL/NOT NULL)
- Visual filter builder for non-SQL users
- Save filter presets per table
- Full-text search across all visible columns

**Result Views:**
- Grid view (default spreadsheet)
- JSON view (formatted, collapsible tree)
- Single-row detail view (form layout for wide tables)
- Chart view (auto-suggest chart type based on result shape)
- Quick export from any view

**Clipboard:**
- Cell selection + `Cmd+C` copies as TSV (pasteable into Excel)
- Copy as INSERT statement, JSON, or CSV via right-click menu
- Copy column name on header right-click

### 4. Schema Browser

- Tree view in the sidebar: Connection → Schema → Tables / Views / Functions
- Table node shows: columns with types, primary keys, foreign keys, indexes
- View detection with underlying SQL preview
- Quick actions on right-click: Open data, Edit structure, Export, Drop (with confirmation)
- Schema search/filter (type to find tables across schemas)
- Table DDL preview (shows CREATE TABLE statement)
- Column-level detail panel (type, nullable, default, constraints, comments)

### 5. ER Diagram Visualization

**Engine: React Flow + Dagre + ELK.js**

React Flow provides the interactive canvas (pan, zoom, drag, selection, minimap). Two layout algorithms ensure clean rendering at any scale:

- **Dagre** — hierarchical layout, best for small-to-medium schemas (< 30 tables). Fast, produces clean top-down or left-right flows with minimal edge crossings.
- **ELK.js** (Eclipse Layout Kernel compiled to JS) — layered/force-directed layout for large schemas (30-100+ tables). Handles complex relationship graphs with better edge routing and cluster support.

The app auto-selects the layout algorithm based on table count but users can switch manually.

**Rendering:**
- SVG-based for crisp lines at any zoom level
- Bezier curve edges with intelligent routing to avoid overlapping table nodes
- Cardinality labels on edges (1:1, 1:N, N:N)
- Table nodes show: table name, columns with types, PK/FK indicators
- Color-coded nodes (by schema, by user-assigned group, or by relationship depth)
- Minimap in corner for navigation on large diagrams

**Interaction:**
- Drag table nodes to rearrange
- Click table → highlight its relationships, dim unrelated tables (focus mode)
- Double-click table → open in data browser
- Right-click table → quick actions (edit, export, view DDL)
- Select multiple tables to create a focused sub-diagram
- Zoom-to-fit and zoom-to-selection

**Export:**
- PNG (high-res, configurable DPI)
- SVG (vector, scalable)
- Save layout positions (persist custom arrangements per connection)

### 6. Data Charts (Recharts)

**Auto-detection:** When viewing query results, the app analyzes column types and suggests the best chart type:
- 1 text + 1 numeric → bar chart
- 1 date + 1 numeric → line chart (time series)
- 1 text + 1 numeric (< 10 categories) → pie chart
- 2 numeric → scatter plot
- Users can always override the suggestion

**Chart Types:**
- Bar (horizontal and vertical, grouped, stacked)
- Line (with area fill option)
- Pie / Donut
- Scatter
- Area
- Heatmap

**Configuration:**
- Drag-and-drop axis mapping (X, Y, group-by, color-by)
- Multiple Y-axes support
- Interactive tooltips on hover
- Zoom and pan on charts
- Custom color palette (matches app theme)

**Output:**
- Export as PNG or SVG
- Pin charts to a dashboard tab (collect multiple charts in one view)
- Chart configuration saved with the query (re-run query → chart regenerates)

### 7. Query Execution Plan Visualization

Parses the output of `EXPLAIN ANALYZE` (PostgreSQL), `EXPLAIN` (MySQL), and `EXPLAIN QUERY PLAN` (SQLite) into a visual tree.

**Display:**
- Tree layout — each node is an operation (Seq Scan, Index Scan, Hash Join, Sort, etc.)
- Cost bars on each node — color gradient from green (cheap) to red (expensive), proportional to total query cost
- Row count estimates vs actuals (when ANALYZE data available)
- Automatic bottleneck highlighting — nodes consuming >50% of total cost get a red border

**Interaction:**
- Click node → expand detail panel (filter conditions, output columns, actual time, loops)
- Collapse/expand sub-trees
- Side-by-side plan comparison — run EXPLAIN before and after adding an index to compare

**Suggestions:**
- Flag sequential scans on large tables (suggest index creation)
- Flag high estimated vs actual row mismatches (suggest ANALYZE/vacuum)

### 8. Import & Export

**Export Wizard (step-by-step flow):**
1. **Source** — select table(s), query result, or entire schema
2. **Format** — SQL, CSV, JSON, Excel (.xlsx), Schema DDL, or plugin-provided format
3. **Options** — column selection, WHERE filter, row limit, encoding, NULL handling
4. **Export** — progress bar with cancel, file save dialog

**Import Wizard:**
1. **Source** — select file (CSV, SQL, JSON, Excel)
2. **Target** — select or create destination table
3. **Mapping** — column mapping with type preview, auto-match by name
4. **Conflict handling** — skip duplicates, update on conflict, or error
5. **Preview** — dry-run showing first 10 rows as they'd be inserted
6. **Import** — progress bar with row count, errors logged

**Cross-Database Migration:**
1. Select source connection + tables
2. Select target connection (different database type)
3. Auto-generate type mapping (e.g., PostgreSQL `serial` → MySQL `INT AUTO_INCREMENT`)
4. User can edit any mapping — lossy conversions flagged with warnings (e.g., `jsonb` → `JSON`, `text[]` → `JSON`)
5. Generate migration SQL — preview before execution
6. Execute with progress tracking, rollback on failure
7. Handles: schema DDL translation, data transfer with pagination, index and constraint translation

### 9. Plugin System

**Plugin manifest** (`plugin-manifest.json`):
```json
{
  "name": "plugin-name",
  "version": "1.0.0",
  "main": "dist/index.js",
  "contributes": {
    "drivers": [],
    "activityBar": [],
    "themes": [],
    "exporters": [],
    "importers": [],
    "commands": [],
    "resultViews": [],
    "queryTransformers": []
  }
}
```

**Extension points** — what plugins can provide:
- **Database drivers** — add support for new databases (Redis, Cassandra, MongoDB, etc.)
- **Activity bar panels** — custom sidebar views with their own UI
- **Themes** — color schemes and icon packs
- **Export/import formats** — Parquet, Avro, YAML, custom formats
- **Commands** — actions accessible via command palette (`Cmd+Shift+P`)
- **Result view renderers** — custom ways to display query results
- **Query transformers** — SQL formatters, linters, migration generators

**Plugin runtime:**
- Plugins are npm packages installed to a local plugin directory
- UI contributions render in sandboxed iframes (security boundary)
- Database drivers and query transformers run in the main process (with permission)
- Plugin SDK provides typed APIs for accessing connections, running queries, reading schema
- Hot-reload during development (watch mode)

**Discovery:**
- Built-in Extensions panel in the activity bar
- Search/install from npm (scoped to a plugin keyword/tag)
- Manual install from local directory (for development)

### 10. Additional Features

**Command Palette:**
- `Cmd+Shift+P` opens a searchable command palette (like VS Code)
- All actions are commands — plugins can register their own
- Recent commands, fuzzy search

**Keyboard Shortcuts:**
- Full keybinding customization
- Preset profiles: Default, DataGrip-style, DBeaver-style
- Cheat sheet overlay (`Cmd+K Cmd+S`)

**Settings:**
- JSON-based settings (like VS Code's settings.json)
- UI settings editor for common options
- Per-connection overrides (e.g., different query timeout per connection)

**Status Bar:**
- Active connection info (type, host, database, schema)
- Connection status (connected/disconnected with color)
- Encoding
- Active transaction indicator
- Query execution status

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Shell | Electron 35+ | Desktop app framework |
| UI framework | React 19 | Component-based UI |
| Language | TypeScript 5.x (strict) | Type safety |
| State | Zustand | Lightweight state management |
| Code editor | Monaco Editor | SQL editing |
| Data grid | AG Grid Community | Table rendering |
| ER diagrams | React Flow + Dagre + ELK.js | Schema visualization |
| Charts | Recharts | Data visualization |
| Styling | Tailwind CSS | Utility-first dark theme |
| Icons | Lucide React | Consistent icon set |
| DB: PostgreSQL | pg | PostgreSQL driver |
| DB: MySQL | mysql2 | MySQL/MariaDB driver |
| DB: SQLite | better-sqlite3 | SQLite driver |
| SQL parsing | node-sql-parser | SQL analysis and formatting |
| Build | Vite + electron-builder | Fast dev + app packaging |
| Testing | Vitest + Playwright | Unit + E2E tests |
| IPC | Electron IPC (typed) | Main ↔ renderer communication |

## Non-Goals (v1)

- NoSQL databases (MongoDB, Redis) — ship as plugins post-launch
- Collaboration features (shared queries, team workspaces) — future version
- Cloud sync for settings/connections — future version
- SSH tunnel management — v1 supports direct connections only, SSH in v1.1
- AI/natural language SQL generation — potential plugin, not core
- Mobile or web version — desktop only
