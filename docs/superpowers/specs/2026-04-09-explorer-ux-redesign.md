# Explorer UX Redesign — Design Spec

## Goal

Replace the current accordion-based explorer with a unified deep tree that provides an intuitive, IntelliJ-inspired database browsing experience. The current explorer suffers from disconnected accordion sections, no contextual detail on selection, and a confusing workflow. This redesign unifies everything into a single navigable tree.

## Current Problems

1. **Stacked accordions** — 4 separate collapsible sections (Connections, Databases, Tables, Views) fight for vertical space and create a fragmented experience
2. **No contextual detail** — clicking a table or connection doesn't reveal details anywhere; the user must open a tab or expand columns manually with no visual richness
3. **Flat structure** — tables and views listed without hierarchy; the relationship between connection, database, schema, and table is lost
4. **Disconnected workflow** — switching databases requires a separate accordion section; schema selection is a separate popover; nothing feels connected

## Design Decisions

### Layout: Unified Deep Tree (no accordions)

Remove all 4 accordion sections. Replace with a single tree that represents the full hierarchy:

```
[Connection Switcher Dropdown]
[Search/Filter Input]

▼ 🗄 myapp_prod              ← database node
  ▼ 📁 public                ← schema node
    TABLES                    ← group label (not collapsible)
      ▼ 📋 users  1,247      ← table node (expandable)
        🔑 id     int4  PK   ← column (inline detail)
        ○  name   varchar
        🔗 org_id int4  FK
      ▶ 📋 orders  8,432
      ▶ 📋 products  156
    VIEWS                     ← group label
      ▶ 👁 active_users
  ▶ 📁 analytics
▶ 🗄 myapp_staging
```

### Connection Switcher: Dropdown at top

- Dropdown at the top of the explorer shows the active connection with a status indicator (green dot = connected, grey = disconnected)
- Gear icon button next to it opens connection management
- Switching connections loads that connection's database tree
- Only one connection active at a time; the tree shows only the active connection's contents

### Database & Schema: Tree nodes (not dropdowns)

- Databases are expandable root-level tree nodes
- Schemas are expandable children of databases
- Multiple databases and schemas are visible/browsable simultaneously
- This replaces the DatabasesSection accordion and schema popover

### Expanded Table Style: Contained Card (Option B)

When a table is expanded, its columns render as a contained card with:
- **Card header**: table name + chevron, row count pill, index count pill
- **Column rows**: icon (🔑 PK, 🔗 FK, ○ regular) + column name + type + constraint badge (PK/FK/UQ pill)
- **Icon badges**: small rounded squares with tinted backgrounds matching the constraint color
- **Bordered container**: subtle border + background distinguishes expanded content from the tree

### Actions: Hover + Context Menu (both)

- **Hover actions**: common actions (open table, run query) appear as small icon buttons on hover, right-aligned on the tree item row
- **Context menu**: right-click on any tree item shows full action set:
  - Tables: Open, Query, Export, Copy name, Copy SELECT
  - Views: Open, Query, Copy name
  - Databases: Set as default, Refresh
  - Schemas: Refresh, Copy name
  - Columns: Copy name, Copy qualified name

### Search/Filter

- Text input below the connection switcher
- Filters tables and views by name (case-insensitive substring match)
- 150ms debounce (keep current behavior)
- Clears on connection change

### Group Labels (Tables/Views)

- "TABLES" and "VIEWS" are static labels within each schema, not collapsible accordions
- Styled as small uppercase text with low opacity
- They serve as visual separators, not interactive elements

## Component Architecture

### Files Modified

| File | Change |
|------|--------|
| `components/shell/Sidebar.tsx` | Explorer panel renders new `ExplorerTree` instead of old sections |
| `components/explorer/ExplorerTree.tsx` | **New** — main tree component composing all sub-parts |
| `components/explorer/ConnectionSwitcher.tsx` | **New** — dropdown for switching active connection |
| `components/explorer/DatabaseNode.tsx` | **New** — expandable database tree node |
| `components/explorer/SchemaNode.tsx` | **New** — expandable schema tree node |
| `components/explorer/TableNode.tsx` | **New** — expandable table card with inline columns |
| `components/explorer/ViewNode.tsx` | **New** — expandable view node (similar to table, simpler) |
| `components/explorer/ColumnRow.tsx` | **New** — single column row inside an expanded table card |
| `components/explorer/SearchFilter.tsx` | Keep, minor updates |
| `components/explorer/icons.tsx` | Keep, add database/schema icons |
| `stores/ui.ts` | Remove `expandedSections` (no more accordions), add tree expansion state |
| `stores/schema.ts` | Minor — ensure multi-database fetching works |

### Files Deleted

| File | Reason |
|------|--------|
| `components/explorer/ConnectionsSection.tsx` | Replaced by ConnectionSwitcher |
| `components/explorer/DatabasesSection.tsx` | Replaced by DatabaseNode in tree |
| `components/explorer/TablesSection.tsx` | Replaced by TableNode in tree |
| `components/explorer/ViewsSection.tsx` | Replaced by ViewNode in tree |

### State Changes (ui.ts)

Remove:
- `expandedSections: Record<string, boolean>` — no more accordion sections
- `toggleSection(title: string)` — no more accordion toggle

Add:
- `expandedTreeNodes: Set<string>` — tracks which tree nodes are expanded, keyed by path (e.g., `"db:myapp_prod"`, `"schema:myapp_prod.public"`, `"table:myapp_prod.public.users"`)
- `toggleTreeNode(path: string)` — toggle a node's expanded state
- `collapseAllTreeNodes()` — collapse everything
- `expandTreeNode(path: string)` — expand a specific node

### Primitives Used

- `TreeItem` — for all tree nodes (databases, schemas, tables, views, columns)
- `Select` — for connection switcher dropdown
- `SearchInput` — for filter input
- `ContextMenu` — right-click on all tree items
- `DropdownMenu` — for connection gear menu
- `Badge` — for row counts, index counts
- `Text` — for group labels, metadata

### TableNode Card Styling

The expanded table renders as a contained card using Tailwind classes:
- Outer container: `rounded-lg border border-[--border-default] bg-[--bg-subtle] overflow-hidden`
- Header row: `bg-[--bg-default] border-b border-[--border-default] px-3 py-1.5 flex items-center gap-2`
- Stat pills: `bg-[--bg-muted] text-[--text-muted] px-2 py-0.5 rounded-full text-[10px]`
- Column rows: `px-3 py-1 flex items-center gap-2`
- Constraint badges: `px-1.5 py-0 rounded text-[9px]` with tinted backgrounds per type:
  - PK: `bg-[--color-warning]/10 text-[--color-warning]`
  - FK: `bg-[--color-accent]/10 text-[--color-accent]`
  - UQ: `bg-[--color-success]/10 text-[--color-success]`
- Icon squares: `w-[18px] h-[18px] rounded flex items-center justify-center` with matching tint

## Data Flow

1. User selects connection from switcher → `connectionsStore.connect(id)` → loads databases
2. Database list populates tree root nodes → user expands a database → loads schemas for that database
3. User expands a schema → loads tables and views for that schema
4. User expands a table → columns already loaded from schema introspection, rendered inline as card
5. Row counts lazy-loaded per table when schema node is expanded (keep current behavior)
6. Search filter applies at the table/view level within all visible schemas

## Edge Cases

- **Single-database engines** (SQLite, MySQL without multi-db): skip the database level, show schemas directly
- **Single-schema engines** (SQLite): skip both database and schema levels, show tables/views directly at root
- **No connection**: show empty state with "Select a connection" message and button to open connection manager
- **Large table counts (100+)**: virtualize the table list within each schema (future enhancement, not in scope for this redesign)
- **Long names**: truncate with `truncate` class, full name in tooltip on hover

## Testing

- Stories for each new component (ConnectionSwitcher, DatabaseNode, SchemaNode, TableNode, ColumnRow)
- Story for full ExplorerTree with mock data showing the complete hierarchy
- Unit tests for tree expansion state management in ui.ts
- Verify context menus render correct actions per node type
- Verify search filter works across the tree
