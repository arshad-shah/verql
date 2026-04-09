# Connection Form Rebuild — Design Spec

## Goal

Rebuild the connection form component using only design system primitives. Move it from a modal to a full-screen tab-based view that renders in the editor area alongside query and ER diagram tabs.

## Integration Approach

Add a new `ConnectionFormTab` to the existing discriminated union tab system.

### Type Changes (`shared/types.ts`)

```typescript
export interface ConnectionFormTab {
  id: string
  type: 'connection-form'
  title: string
  editingId?: string // undefined = new connection, string = editing existing
}

export type Tab = QueryTab | TableTab | ErDiagramTab | ConnectionFormTab
```

### Store Changes (`stores/tabs.ts`)

Add `openConnectionForm(editingId?: string)` action:
- If a connection-form tab for the same `editingId` already exists, activate it instead of opening a duplicate
- Sets title to "New Connection" or "Edit: {connection name}"

### App.tsx Changes

- Add `activeTab?.type === 'connection-form'` case in the tab content area, rendering the new `ConnectionFormView` component
- Keep the `ConnectionFormFromMenu` wrapper for native menu triggers — it now calls `openConnectionForm()` on the tabs store and closes itself
- Update `ConnectionsSection` to call `openConnectionForm(id?)` instead of toggling a modal

## Component: `ConnectionFormView`

**File:** `src/renderer/src/components/connections/ConnectionFormView.tsx`

**Props:**
```typescript
interface Props {
  editingId?: string // if set, load existing profile
}
```

### Layout Structure (all primitives)

```
ScrollArea (direction="vertical", full height)
  Container (size="sm", centered)
    Stack (gap="xl")
      — Header: Flex with Heading + action Buttons
      — Section: Database Type
      — Section: General
      — Section: Connection (conditional by type)
      — Section: Authentication (conditional by type)
      — Section: SSH Tunnel (collapsible, conditional)
      — Test Connection
```

### Sections Detail

**Header**
- `Flex` (direction="row", justify="between", align="center")
- Left: `Heading` — "New Connection" or "Edit Connection"
- Right: `Flex` with `Button` (variant="outline") "Cancel" + `Button` (variant="solid") "Save"
- Cancel closes the tab. Save calls `saveConnection()` then closes the tab.

**Database Type**
- Section label: `Text` (size="xs", color="muted", uppercase via className)
- `Select` primitive with all built-in + plugin driver options
- When type changes, update default port and reset type-specific fields

**General**
- `FormField` + `Input` — Connection Name (required)
- `FormField` + `ColorInput` — Color (presets: `['#7c6ff7', '#28c840', '#e5c07b', '#61afef', '#ff5f57', '#c678dd']`)

**Connection (PostgreSQL/MySQL)**
- `Flex` (direction="row", gap="md"):
  - `FormField` + `Input` — Host (flex: 1)
  - `FormField` + `NumberInput` — Port (fixed width ~100px)
- `FormField` + `Input` — Database

**Connection (SQLite)**
- `FormField` + `Input` — Database File (placeholder: `/path/to/database.sqlite`)

**Connection (Plugin drivers)**
- Dynamically render fields from `pluginDriver.connectionFields` using `renderField()`:
  - `text` → `FormField` + `Input`
  - `password` → `FormField` + `PasswordInput`
  - `number` → `FormField` + `NumberInput`
  - `boolean` → `FormField` + `Switch`

**Authentication (PostgreSQL/MySQL only)**
- `Flex` (direction="row", gap="md"):
  - `FormField` + `Input` — Username (flex: 1)
  - `FormField` + `PasswordInput` — Password (flex: 1)
- `Switch` — "Use SSL" (label prop)

**SSH Tunnel**
- Only shown when `sshFields.length > 0` and type is not SQLite
- Collapsible: `Box` with border, `Button` (variant="ghost") toggle with chevron icon
- Expanded content: `Stack` of dynamically rendered middleware fields using `renderField()`

**Test Connection**
- Reuse existing `ConnectionTestButton` component (it already handles test states well)

### State Management

Local `useState` for the form profile (same as current approach — no Zustand for in-progress form state). Initialize from existing profile if `editingId` is provided (fetch via connections store).

```typescript
const [profile, setProfile] = useState<Record<string, unknown>>({
  id: crypto.randomUUID(),
  name: '',
  type: 'postgresql',
  host: 'localhost',
  port: 5432,
  database: '',
  username: '',
  password: '',
  color: '#7c6ff7',
})
```

When `editingId` is provided, look up the connection from the connections store and seed the form state.

### Plugin Integration

Same IPC calls as current form:
- `plugins:connection-fields` → load plugin driver definitions (fetched in `useEffect` on mount)
- `plugins:middleware-fields` → load SSH tunnel fields

## Files Changed

| File | Change |
|------|--------|
| `shared/types.ts` | Add `ConnectionFormTab` interface, update `Tab` union |
| `src/renderer/src/stores/tabs.ts` | Add `openConnectionForm()` action |
| `src/renderer/src/components/connections/ConnectionFormView.tsx` | **New file** — full-screen form component |
| `src/renderer/src/App.tsx` | Add `connection-form` tab case, update menu trigger to use tab store |
| `src/renderer/src/components/explorer/ConnectionsSection.tsx` | Replace modal trigger with `openConnectionForm()` |
| `src/renderer/src/components/connections/ConnectionForm.tsx` | Delete (replaced by ConnectionFormView) |

## Primitives Used

| Primitive | Usage |
|-----------|-------|
| `ScrollArea` | Page-level vertical scroll |
| `Container` | Centered max-width wrapper |
| `Stack` | Vertical section spacing |
| `Flex` | Row layouts (host+port, username+password, header) |
| `Box` | SSH tunnel collapsible wrapper |
| `Heading` | Page title |
| `Text` | Section labels, descriptions |
| `FormField` | Label + error/hint wrapper for all inputs |
| `Input` | Text fields (name, host, database) |
| `NumberInput` | Port field |
| `PasswordInput` | Password field (with visibility toggle) |
| `Select` | Database type selector |
| `Switch` | SSL toggle |
| `ColorInput` | Connection color with presets |
| `Button` | Save, Cancel, Test, SSH toggle |
| `Divider` | Optional section separators |

Zero custom widgets. Zero raw HTML inputs.
