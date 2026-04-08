# Schema Introspection — Design Spec

Full IntelliJ-style schema introspection for dbterm: deep object browsing in the sidebar tree, a rich inspector panel, and schema-powered Monaco autocomplete.

## Approach: Metadata Provider Pattern

Introduce a `MetadataProvider` abstraction per database engine that returns a unified catalog of all schema objects. Each engine declares which object categories it supports. A single catalog fetch hydrates the tree, inspector, and autocomplete — no per-keystroke IPC.

The existing `DbAdapter` interface and IPC channels (`db:get-tables`, `db:get-columns`, `db:get-indexes`) remain unchanged. New functionality is additive.

---

## 1. Data Model

### ObjectKind

```typescript
type ObjectKind =
  | 'table' | 'view' | 'materialized-view'
  | 'function' | 'procedure' | 'trigger'
  | 'sequence' | 'enum' | 'extension'     // PostgreSQL
  | 'event' | 'virtual-table'              // MySQL, SQLite
```

### CatalogObject

Lightweight listing entry — no column data, fetched in bulk.

```typescript
interface CatalogObject {
  kind: ObjectKind
  name: string
  schema: string
}
```

### ObjectCategory

Declares a tree group rendered by the UI. Driven by the engine.

```typescript
interface ObjectCategory {
  kind: ObjectKind
  label: string     // Display name ("Tables", "Functions")
  icon: string      // Lucide icon name
  count: number
}
```

### SchemaCatalog

Full catalog for a connection + schema.

```typescript
interface SchemaCatalog {
  objects: CatalogObject[]
  categories: ObjectCategory[]
}
```

### ObjectDetail (discriminated union)

Rich metadata fetched on demand when expanding a tree node or opening the inspector.

```typescript
type ObjectDetail =
  | TableDetail
  | ViewDetail
  | MaterializedViewDetail
  | FunctionDetail
  | ProcedureDetail
  | TriggerDetail
  | SequenceDetail
  | EnumDetail
  | ExtensionDetail
  | EventDetail
  | VirtualTableDetail

interface TableDetail {
  kind: 'table'
  columns: SchemaColumn[]
  indexes: SchemaIndex[]
  foreignKeys: ForeignKey[]
  constraints: Constraint[]
  triggers: TriggerSummary[]
  ddl: string
  rowCountEstimate?: number
  sizeBytes?: number
}

interface ViewDetail {
  kind: 'view'
  columns: SchemaColumn[]
  ddl: string
  dependencies: DependencyRef[]
}

interface MaterializedViewDetail {
  kind: 'materialized-view'
  columns: SchemaColumn[]
  indexes: SchemaIndex[]
  ddl: string
  rowCountEstimate?: number
  sizeBytes?: number
}

interface FunctionDetail {
  kind: 'function'
  language: string
  returnType: string
  parameters: FunctionParam[]
  source: string
  ddl: string
  volatility?: 'immutable' | 'stable' | 'volatile'
}

interface ProcedureDetail {
  kind: 'procedure'
  language: string
  parameters: FunctionParam[]
  source: string
  ddl: string
}

interface TriggerDetail {
  kind: 'trigger'
  event: string          // INSERT, UPDATE, DELETE, or combination
  timing: string         // BEFORE, AFTER, INSTEAD OF
  table: string
  functionName?: string  // PG: trigger function reference
  source?: string        // MySQL/SQLite: trigger body
  ddl: string
}

interface SequenceDetail {
  kind: 'sequence'
  currentValue: number
  minValue: number
  maxValue: number
  increment: number
  cycle: boolean
  ddl: string
}

interface EnumDetail {
  kind: 'enum'
  values: string[]
  ddl: string
}

interface ExtensionDetail {
  kind: 'extension'
  version: string
  schema: string
  description: string
}

interface EventDetail {
  kind: 'event'
  type: string           // ONE TIME or RECURRING
  interval?: string
  status: string         // ENABLED, DISABLED
  ddl: string
}

interface VirtualTableDetail {
  kind: 'virtual-table'
  module: string         // e.g. fts5, rtree
  columns: SchemaColumn[]
  ddl: string
}
```

### Supporting types

```typescript
interface ForeignKey {
  name: string
  columns: string[]
  referencedTable: string
  referencedColumns: string[]
  onUpdate: string
  onDelete: string
}

interface Constraint {
  name: string
  type: 'primary-key' | 'unique' | 'check' | 'exclusion'
  columns: string[]
  definition?: string    // CHECK expression text
}

interface TriggerSummary {
  name: string
  event: string
  timing: string
}

interface DependencyRef {
  name: string
  kind: ObjectKind
  schema: string
  direction: 'depends-on' | 'depended-by'
}

interface FunctionParam {
  name: string
  type: string
  mode: 'in' | 'out' | 'inout' | 'variadic'
  defaultValue?: string
}
```

All types go in `shared/types.ts`.

---

## 2. Metadata Provider

### Interface

```typescript
interface MetadataProvider {
  getCatalog(schema?: string): Promise<SchemaCatalog>
  getObjectDetail(name: string, kind: ObjectKind, schema?: string): Promise<ObjectDetail>
  getSupportedCategories(): ObjectCategory[]
}
```

Note: DDL is included in each `ObjectDetail` variant, so a separate `getObjectDDL` method is unnecessary.

### Per-engine implementations

Each provider lives alongside its adapter (e.g. `src/main/db/postgres-metadata.ts`).

**PostgreSQL** — queries `information_schema`, `pg_catalog` system tables:

| Category | Source |
|---|---|
| Tables | `information_schema.tables` |
| Views | `information_schema.views` |
| Materialized Views | `pg_matviews` |
| Functions | `pg_proc JOIN pg_namespace` |
| Triggers | `information_schema.triggers` |
| Sequences | `pg_sequences` |
| Enums | `pg_type JOIN pg_enum` |
| Extensions | `pg_extension` |
| Foreign Keys | `information_schema.table_constraints JOIN key_column_usage JOIN constraint_column_usage` |
| Constraints | `information_schema.table_constraints JOIN check_constraints` |
| DDL | `pg_get_functiondef()`, `pg_get_viewdef()`, `pg_get_triggerdef()`, manual assembly for tables |
| Dependencies | `pg_depend JOIN pg_class` |
| Size/Row estimates | `pg_class.reltuples`, `pg_total_relation_size()` |

**MySQL** — queries `information_schema`:

| Category | Source |
|---|---|
| Tables | `information_schema.tables` |
| Views | `information_schema.views` |
| Functions/Procedures | `information_schema.routines` |
| Triggers | `information_schema.triggers` |
| Events | `information_schema.events` |
| Foreign Keys | `information_schema.key_column_usage WHERE referenced_table_name IS NOT NULL` |
| Constraints | `information_schema.table_constraints` |
| DDL | `SHOW CREATE TABLE`, `SHOW CREATE FUNCTION`, `SHOW CREATE TRIGGER`, `SHOW CREATE EVENT` |
| Size/Row estimates | `information_schema.tables` (data_length, table_rows) |

**SQLite** — queries `sqlite_master` and PRAGMAs:

| Category | Source |
|---|---|
| Tables | `sqlite_master WHERE type='table'` |
| Views | `sqlite_master WHERE type='view'` |
| Triggers | `sqlite_master WHERE type='trigger'` |
| Virtual Tables | `sqlite_master` WHERE SQL contains `USING` |
| Foreign Keys | `PRAGMA foreign_key_list(table)` |
| Indexes | `PRAGMA index_list(table)` + `PRAGMA index_info(index)` |
| DDL | `sqlite_master.sql` column |

### Provider lifecycle

Created in `src/main/db/factory.ts` alongside the adapter. Shares the adapter's connection pool. Registered in a `Map<string, MetadataProvider>` keyed by profile ID, mirroring the adapter map.

### IPC channels

Two new channels added to `shared/ipc.ts`:

```typescript
'db:get-catalog': {
  args: [profileId: string, schema?: string]
  return: SchemaCatalog
}
'db:get-object-detail': {
  args: [profileId: string, name: string, kind: ObjectKind, schema?: string]
  return: ObjectDetail
}
```

Existing channels remain unchanged.

---

## 3. Schema Tree (Deep Object Browsing)

### Structure

The sidebar tree changes from flat (`Schema → Tables → Columns`) to categorized:

```
▼ public
  ▼ Tables (3)
    ▼ users
      id          integer PK
      email       varchar
      created_at  timestamp
      ▶ Indexes (2)
      ▶ Foreign Keys (0)
      ▶ Constraints (1)
      ▶ Triggers (0)
    ▶ orders
    ▶ products
  ▶ Views (1)
  ▶ Functions (4)
  ▶ Sequences (2)
  ▶ Enums (1)
  ▶ Triggers (2)
  ▶ Extensions (3)
```

### Rendering

- Category folders driven by `SchemaCatalog.categories` — engine declares what to show
- Each category node shows Lucide icon + label + count badge
- Table-like objects (table, view, materialized-view) expand to show columns, then sub-groups for Indexes, Foreign Keys, Constraints, Triggers (scoped to that specific table)
- Non-table objects (function, sequence, enum, etc.) are leaf nodes — clicking opens inspector
- Note: Triggers appear in two places — as a top-level category (all triggers in the schema) and as sub-nodes under each table (triggers on that specific table). Both are useful: the category gives a full list, the sub-node shows what fires on a given table.
- Count badges on all collapsible nodes

### Lazy loading

1. Schema selection → `db:get-catalog` fetches lightweight catalog (names + categories)
2. Expanding a category → filters cached catalog objects by kind
3. Expanding a table → `db:get-object-detail` fetches columns, indexes, FKs, constraints, triggers
4. Detail is cached in the schema store by `connectionId:schema:kind:name`

### Context menus

Right-click any tree node for actions:
- **All objects:** Copy Name, View DDL, Refresh
- **Tables/Views:** Generate SELECT, Open Data (existing table tab), Show in ER Diagram
- **Functions:** Generate CALL/SELECT

### Schema store changes

`src/renderer/src/stores/schema.ts` gains:
- `catalog: Map<string, SchemaCatalog>` — cached catalogs keyed by `connectionId:schema`
- `objectDetails: Map<string, ObjectDetail>` — cached details keyed by `connectionId:schema:kind:name`
- `fetchCatalog(connectionId, schema)` — calls `db:get-catalog`
- `fetchObjectDetail(connectionId, name, kind, schema)` — calls `db:get-object-detail`
- `expandedCategories: Set<string>` — tracks which category folders are open

### Components

- `SchemaTree` — refactored to render categories from catalog
- `CategoryNode` — new component for category folder (Tables, Views, etc.)
- `ObjectNode` — new component for individual object with sub-groups
- `SchemaTreeContextMenu` — new component for right-click actions

---

## 4. Inspector Panel (Right Sidebar)

### Layout

A resizable panel on the right side of the main content area. Appears on first object click, persists until closed.

```
┌─────────────────────────────────────────────────────┐
│ Tab Bar                                             │
├──────────────────────────────────┬──────────────────┤
│                                  │ ■ users    TABLE │
│  Query Editor                    ├──────────────────┤
│                                  │ Info│Cols│DDL│Dep│
│  SELECT t.                       ├──────────────────┤
│  FROM users AS t                 │ Schema: public   │
│                                  │ Rows: ~12,450    │
├──────────────────────────────────┤ Size: 2.1 MB     │
│ Results: 42 rows in 12ms        │ PK: id           │
│ ┌──────────────────────────────┐│ Indexes:          │
│ │ result grid                  ││   users_pkey      │
│ │                              ││   users_email_idx │
│ └──────────────────────────────┘│                   │
└──────────────────────────────────┴──────────────────┘
```

### Inspector tabs by object kind

**Table / View / Materialized View:**
- **Info** — schema, row count estimate, size, primary key, indexes summary, FK summary, referenced-by list
- **Columns** — full column listing: name, type, nullable, default, constraints
- **DDL** — CREATE statement with syntax highlighting (read-only Monaco instance)
- **Deps** — dependency graph: objects this depends on, objects that depend on this

**Function / Procedure:**
- **Info** — language, return type, volatility, parameter count
- **Params** — parameter listing: name, type, mode (IN/OUT/INOUT), default
- **Source** — function body with syntax highlighting
- **DDL** — full CREATE FUNCTION/PROCEDURE statement

**Trigger:**
- **Info** — event, timing, associated table, function reference
- **Source** — trigger body or function source
- **DDL** — CREATE TRIGGER statement

**Sequence:**
- **Info** — current value, min, max, increment, cycle flag
- **DDL** — CREATE SEQUENCE statement

**Enum:**
- **Info** — list of enum values
- **DDL** — CREATE TYPE statement

**Extension:**
- **Info** — version, installed schema, description

### UI state

Added to `src/renderer/src/stores/ui.ts`:
- `inspectorVisible: boolean`
- `inspectorWidth: number` (default 280px, resizable)
- `selectedObject: { connectionId: string; name: string; kind: ObjectKind; schema: string } | null`
- `inspectorTab: string` (active tab within inspector)

### Components

- `InspectorPanel` — container with header, tab bar, content area
- `InspectorInfo` — info tab content, adapts to object kind
- `InspectorColumns` — column listing table
- `InspectorDDL` — read-only Monaco editor for DDL
- `InspectorDeps` — dependency list with clickable references

### Behavior

- Clicking any object in the schema tree opens the inspector (or updates it if already open)
- Close via X button in inspector header
- Panel width resizable via drag handle on left edge
- DDL tab uses a small read-only Monaco instance with SQL syntax highlighting
- Clickable references in Deps and FK sections navigate the tree and update the inspector

---

## 5. Monaco Autocomplete

### Architecture

A `CompletionProvider` registered with Monaco that reads from the cached schema store. No IPC per keystroke.

```
Schema Store (Zustand) ← catalog + object details cached
        ↓
CompletionProvider (registered with Monaco)
        ↓
SQL Context Parser (lightweight, cursor-position based)
        ↓
Completion Builder → Monaco CompletionItem[]
```

### SQL Context Parser

A lightweight parser that determines cursor context from the text and position. Not a full SQL parser — uses regex and token scanning to identify:

- **Clause detection:** Is the cursor in SELECT, FROM, JOIN, WHERE, GROUP BY, ORDER BY, HAVING, SET, INSERT INTO?
- **Dot notation:** Is there a dot before the cursor? Resolve the prefix as alias, table, or schema.
- **Alias map:** Scan FROM/JOIN clauses to build `alias → table` mapping for the current statement.
- **Multi-statement:** Identify which statement the cursor is in (split on `;`).

Implementation: `src/renderer/src/editor/sql-context.ts`

### Completion scenarios

| Context | Suggestions | Source |
|---|---|---|
| After `SELECT` | Columns from tables in FROM clause, `*`, functions, keywords | Alias map + catalog |
| After `FROM` / `JOIN` | Table names, view names, schema names | Catalog objects |
| After `alias.` | Columns of the aliased table | Alias map → object detail |
| After `schema.` | Tables/views in that schema | Catalog objects filtered |
| After `schema.table.` | Columns of that table | Object detail |
| After `WHERE` / `AND` / `OR` | Columns from tables in scope, functions, operators | Alias map + catalog |
| Function name `(` | Parameter signature hint | Function details |
| Keyword position | Contextual SQL keywords (WHERE after FROM, etc.) | Static keyword list |
| `::` (PG cast) | Type names | Static type list + enums from catalog |

### Completion item details

Each completion item includes:
- **kind** — Monaco CompletionItemKind (Field for columns, Class for tables, Function for functions, Keyword for SQL keywords)
- **detail** — data type for columns, return type for functions, "TABLE"/"VIEW" badge for tables
- **documentation** — nullable, default value, FK reference for columns; parameter list for functions
- **insertText** — the text to insert, with snippet support for functions (e.g. `COUNT($1)`)
- **sortText** — prioritizes columns from in-scope tables over others, PK columns first

### Trigger characters

- `.` — dot notation triggers column/table resolution
- Space — after keywords, triggers contextual completions
- Standard typing — Monaco's built-in prefix matching

### Components

- `src/renderer/src/editor/sql-context.ts` — cursor context parser
- `src/renderer/src/editor/completion-provider.ts` — Monaco CompletionItemProvider implementation
- `src/renderer/src/editor/sql-keywords.ts` — static SQL keyword list per engine
- Registration in `QueryEditor` component when Monaco mounts

---

## 6. Schema Refresh

Manual refresh only. A refresh button in the schema tree header clears the cached catalog and object details for the active connection, then re-fetches the catalog.

The schema store's existing `clearCache(connectionId)` is extended to also clear `catalog` and `objectDetails` maps.

---

## 7. File Map

### New files

| File | Purpose |
|---|---|
| `shared/types.ts` | Extended with all new types (ObjectKind, CatalogObject, ObjectDetail, etc.) |
| `shared/ipc.ts` | Two new IPC channels |
| `src/main/db/metadata-provider.ts` | MetadataProvider interface |
| `src/main/db/postgres-metadata.ts` | PostgreSQL metadata provider |
| `src/main/db/mysql-metadata.ts` | MySQL metadata provider |
| `src/main/db/sqlite-metadata.ts` | SQLite metadata provider |
| `src/renderer/src/components/schema/CategoryNode.tsx` | Category folder tree node |
| `src/renderer/src/components/schema/ObjectNode.tsx` | Individual object tree node |
| `src/renderer/src/components/schema/SchemaTreeContextMenu.tsx` | Right-click context menu |
| `src/renderer/src/components/inspector/InspectorPanel.tsx` | Inspector container |
| `src/renderer/src/components/inspector/InspectorInfo.tsx` | Info tab |
| `src/renderer/src/components/inspector/InspectorColumns.tsx` | Columns tab |
| `src/renderer/src/components/inspector/InspectorDDL.tsx` | DDL tab (read-only Monaco) |
| `src/renderer/src/components/inspector/InspectorDeps.tsx` | Dependencies tab |
| `src/renderer/src/editor/sql-context.ts` | SQL cursor context parser |
| `src/renderer/src/editor/completion-provider.ts` | Monaco CompletionItemProvider |
| `src/renderer/src/editor/sql-keywords.ts` | Static SQL keywords per engine |

### Modified files

| File | Change |
|---|---|
| `src/main/db/factory.ts` | Create MetadataProvider alongside adapter |
| `src/main/ipc-handlers.ts` | Register handlers for new IPC channels |
| `src/renderer/src/stores/schema.ts` | Add catalog, objectDetails, fetchCatalog, fetchObjectDetail |
| `src/renderer/src/stores/ui.ts` | Add inspector state (visible, width, selectedObject, tab) |
| `src/renderer/src/components/schema/SchemaTree.tsx` | Refactor to render categories from catalog |
| `src/renderer/src/components/query/QueryEditor.tsx` | Register CompletionProvider on mount |
| `src/renderer/src/App.tsx` | Add InspectorPanel to layout |

---

## 8. Testing

- **Unit tests** for each metadata provider: mock the DB connection, verify correct SQL queries and response mapping for each object kind
- **Unit tests** for SQL context parser: cursor position → expected context (clause, alias map, dot prefix)
- **Unit tests** for completion provider: given a context + catalog, verify correct completion items
- **Integration tests** for IPC round-trip: `db:get-catalog` and `db:get-object-detail` with test databases
