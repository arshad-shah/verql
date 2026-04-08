# Explorer Panel Redesign

## Goal

Redesign the explorer sidebar to use VS Code-style collapsible accordion sections with always-visible actions, search/filter, row counts, and separated tables/views. Replace hover-only buttons with persistent action buttons and overflow menus.

## Current State

The explorer panel (`Sidebar.tsx` → `ConnectionList.tsx` + `SchemaTree.tsx`) has:
- Flat layout with connections at top, schema below (only when connected)
- All action buttons (connect, edit, delete, export) hidden behind hover
- Tables and views mixed together in one list
- No search/filter capability
- No row counts
- No overflow/context menus
- A separate "Schema" activity panel that duplicates the schema tree

## Design

### Layout Structure

The explorer panel becomes 4 accordion sections stacked vertically, with a search bar pinned above them:

```
┌─────────────────────────┐
│ 🔍 Filter tables, views │  ← SearchFilter (always visible)
├─────────────────────────┤
│ ▼ CONNECTIONS      (2) +│  ← AccordionSection
│   ● Production DB  ⏻ ✎ ⋯│    always-visible: connect, edit
│   ○ Staging DB     ⏻ ✎ ⋯│    overflow: disconnect, delete, duplicate
├─────────────────────────┤
│ ▼ DATABASES        (3) ↻│  ← AccordionSection (hidden for SQLite)
│   [myapp_prod] staging … │    chip-style database buttons
│   Schema: public ▾       │    schema dropdown within section
├─────────────────────────┤
│ ▼ TABLES           (4)  │  ← AccordionSection
│   ▼ ⊞ users    1.2k  ⋯ │    row counts inline
│       🔑 id int4         │    columns with type + icon
│       # email varchar    │
│       🔗 org_id → orgs.id│   FK references inline
│   ▶ ⊞ posts     856  ⋯ │
│   ▶ ⊞ orgs       42  ⋯ │
├─────────────────────────┤
│ ▼ VIEWS            (2)  │  ← AccordionSection
│   ▶ 👁 active_users   ⋯ │
│   ▶ 👁 monthly_stats  ⋯ │
└─────────────────────────┘
```

### New Components

#### `AccordionSection`

**File:** `src/renderer/src/components/explorer/AccordionSection.tsx`

```typescript
interface AccordionSectionProps {
  title: string              // "CONNECTIONS", "TABLES", etc.
  count?: number             // badge showing item count
  defaultExpanded?: boolean  // initial open/closed state
  actions?: React.ReactNode  // buttons in the header (e.g., + button, refresh)
  children: React.ReactNode  // section content
}
```

**Behavior:**
- Click header bar to toggle expand/collapse
- Chevron rotates (▶ → ▼) on toggle
- Expanded state stored in `uiStore` keyed by section title (persists across panel switches)
- Header background: `bg-bg-primary` for visual separation from content
- Count badge: muted pill style (`bg-white/10 text-text-muted rounded-full px-1.5 text-[9px]`)
- Action buttons render in the header row, right-aligned

#### `OverflowMenu`

**File:** `src/renderer/src/components/explorer/OverflowMenu.tsx`

```typescript
interface MenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'danger'  // renders in red (for delete)
}

interface OverflowMenuProps {
  items: MenuItem[]
}
```

**Behavior:**
- Renders `MoreHorizontal` icon (lucide) as the trigger button
- Click opens a dropdown portal positioned below the button
- Click outside or `Escape` closes the dropdown
- Portal rendering avoids overflow clipping from accordion sections
- `variant: 'danger'` items render with `text-error` color
- Menu items have hover highlight (`bg-white/5`)

#### `SearchFilter`

**File:** `src/renderer/src/components/explorer/SearchFilter.tsx`

**Behavior:**
- Pinned above all accordion sections (not inside any section)
- `Search` icon (lucide) + text input
- 150ms debounce, updates `filterText` in schema store
- Filters table and view names only (Connections and Databases sections unaffected)
- Case-insensitive substring match
- `Escape` key or `x` clear button resets filter
- Clears automatically when active connection changes
- Placeholder text: "Filter tables, views..."

### Modified Components

#### `Sidebar.tsx`

The explorer panel rendering changes from the current flat layout to:

```tsx
{activePanel === 'explorer' && (
  <>
    <SearchFilter />
    <ConnectionsSection />
    {isConnected && (
      <>
        <DatabasesSection />
        <TablesSection />
        <ViewsSection />
      </>
    )}
  </>
)}
```

Each section is a self-contained component wrapping `AccordionSection`.

#### `ConnectionList.tsx` → `ConnectionsSection.tsx`

**Rename and restructure.** Wraps content in `AccordionSection`.

Always-visible buttons per connection:
- **Connect/Disconnect toggle** — `PlugZap`/`Unplug` icon
- **Edit** — `Pencil` icon

Overflow menu items (`···`):
- Disconnect (when connected)
- Delete (variant: danger)
- Duplicate connection

The `+ New Connection` button moves to the accordion header as an action.

#### `SchemaTree.tsx` → Split into sections

`SchemaTree.tsx` is retired. Its logic splits into:

- **`DatabasesSection.tsx`** — database chips + schema dropdown. Hidden for SQLite connections. Wraps in `AccordionSection` with refresh button as header action.
- **`TablesSection.tsx`** — table tree items filtered by `type === 'table'`. Wraps in `AccordionSection`.
- **`ViewsSection.tsx`** — table tree items filtered by `type === 'view'`. Wraps in `AccordionSection`.

#### `SchemaTreeItem.tsx`

Updated to support:
- **Row count** — muted text right-aligned (e.g., "1.2k rows"), shown on table-level items
- **Overflow menu** — replaces the hover-only export button; `OverflowMenu` component in the actions slot
- **FK reference display** — columns with `isForeignKey` show `→ table.column` after the data type in muted text

### State Changes

#### Schema Store (`stores/schema.ts`)

New fields:
```typescript
filterText: string                    // search/filter input value
rowCounts: Map<string, number>        // key: "connId:schema:table"
setFilterText(text: string): void
fetchRowCount(connectionId: string, table: string, schema?: string): Promise<void>
```

- `filterText` filters the tables and views lists via case-insensitive substring match
- `rowCounts` fetched lazily when Tables/Views sections are expanded
- Cache cleared alongside existing `clearCache()` method

#### UI Store (`stores/ui.ts`)

New field:
```typescript
expandedSections: Record<string, boolean>  // key: section title, value: expanded
toggleSection(title: string): void
```

Default expanded state: all sections expanded.

### IPC & Backend

#### New IPC Channel

```typescript
'db:get-row-count': {
  args: [profileId: string, table: string, schema?: string]
  return: number
}
```

#### Adapter Method

Each adapter (`postgres.ts`, `mysql.ts`, `sqlite.ts`) adds:

```typescript
async getRowCount(table: string, schema?: string): Promise<number>
```

Implementation: `SELECT count(*) FROM "schema"."table"` (with proper quoting per dialect).

**Note:** For very large tables this can be slow. Consider using estimate queries for PostgreSQL (`pg_class.reltuples`) and exact counts for SQLite/MySQL. This is an optimization — start with exact counts.

### Overflow Menu Actions

**Connections overflow:**
| Action | Behavior |
|--------|----------|
| Disconnect | Calls `disconnect(id)` (only shown when connected) |
| Delete | Confirmation dialog, then `deleteConnection(id)` |
| Duplicate | Copies profile with " (copy)" suffix, opens edit form |

**Tables overflow:**
| Action | Behavior |
|--------|----------|
| Export | Opens ExportModal for the table |
| Copy name | Copies table name to clipboard |
| Copy SELECT | Copies `SELECT * FROM schema.table LIMIT 100` to clipboard |
| Open in tab | Creates a new query tab with SELECT pre-filled |

**Views overflow:**
| Action | Behavior |
|--------|----------|
| Copy name | Copies view name to clipboard |
| Copy SELECT | Copies `SELECT * FROM schema.view LIMIT 100` to clipboard |
| Open in tab | Creates a new query tab with SELECT pre-filled |

### Removed

- **Separate "Schema" activity panel** — redundant now that schema is always visible in the explorer accordion. Remove from `ActivityBar.tsx` and `Sidebar.tsx`. The `GitFork` ER diagram button moves to the Databases section header as an action.
- **Hover-only action buttons** — all replaced with always-visible buttons or overflow menus
- **Import button at bottom of schema tree** — moves to Tables section overflow or a header action

### File Structure

```
src/renderer/src/components/
├── explorer/                    ← NEW directory
│   ├── AccordionSection.tsx     ← reusable accordion
│   ├── OverflowMenu.tsx         ← ··· dropdown menu
│   ├── SearchFilter.tsx         ← filter input
│   ├── ConnectionsSection.tsx   ← connections accordion
│   ├── DatabasesSection.tsx     ← databases + schema picker
│   ├── TablesSection.tsx        ← tables tree accordion
│   └── ViewsSection.tsx         ← views tree accordion
├── schema/
│   ├── SchemaTree.tsx           ← DELETED (split into sections)
│   └── SchemaTreeItem.tsx       ← MODIFIED (row counts, overflow)
├── connections/
│   ├── ConnectionList.tsx       ← DELETED (replaced by ConnectionsSection)
│   └── ConnectionForm.tsx       ← UNCHANGED
└── shell/
    ├── Sidebar.tsx              ← MODIFIED (new explorer layout)
    └── ActivityBar.tsx          ← MODIFIED (remove Schema panel)
```

### Styling

All components use Tailwind CSS classes consistent with existing theme tokens:
- Backgrounds: `bg-bg-primary`, `bg-bg-secondary`
- Borders: `border-border`
- Text: `text-text-primary`, `text-text-secondary`, `text-text-muted`
- Accent: `text-accent`, `bg-accent/10`
- Icons: lucide-react, same sizes as current (10-14px)

No new CSS variables or global styles needed.
