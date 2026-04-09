# Explorer Panel Rebuild — Design Spec

## Goal

Rebuild the explorer panel using only primitive components from the design system. This is both a refactor (replacing custom one-off components with reusable primitives) and a UX redesign (improving visual hierarchy, consistency, and interaction patterns).

## Approach

**Option C: New Accordion + TreeItem primitives** — create two new primitives that encapsulate the collapsible section and tree node patterns, then compose them with existing primitives (SearchInput, DropdownMenu, ContextMenu, Select, Badge, etc.) to rebuild every explorer section.

## New Primitives

### Accordion

**Location:** `src/renderer/src/primitives/surfaces/Accordion.tsx`

Compound component following the existing Table/List pattern:

```tsx
<Accordion>
  <Accordion.Item value="connections" defaultOpen>
    <Accordion.Trigger>
      <Text>CONNECTIONS</Text>
      <Badge size="sm">3</Badge>
      <Accordion.Actions>
        <IconButton ...><Plus /></IconButton>
      </Accordion.Actions>
    </Accordion.Trigger>
    <Accordion.Content>
      {/* children */}
    </Accordion.Content>
  </Accordion.Item>
</Accordion>
```

**Key decisions:**
- Compound component — `Accordion`, `Accordion.Item`, `Accordion.Trigger`, `Accordion.Actions`, `Accordion.Content`
- Supports both uncontrolled (`defaultOpen`) and controlled (`open` + `onOpenChange`) modes for UI store integration
- `Accordion.Actions` — slot rendered at the right end of the trigger; click events on actions don't toggle the section
- CVA variants: `size: 'sm' | 'md'` (sm for explorer, md for settings)
- Chevron auto-rendered by Trigger, rotates on open/close
- No animation — instant open/close (matches current behavior)
- Built internally from Flex, Text, Box, Button primitives

### TreeItem

**Location:** `src/renderer/src/primitives/data-display/TreeItem.tsx`

Single component with slots:

```tsx
<TreeItem
  label="users"
  icon={<Table2 size={12} />}
  depth={0}
  expanded={true}
  onToggle={() => toggle('users')}
  selected={false}
  meta={<Text size="xs" color="muted">1.2k</Text>}
  actions={<DropdownMenu trigger={...} items={...} />}
>
  <TreeItem label="id" icon={<Key />} depth={1} />
  <TreeItem label="email" icon={<Hash />} depth={1} />
</TreeItem>
```

**Key decisions:**
- Flat list model — `depth` prop controls indentation (padding-left = 8 + depth * 16). No recursive tree container needed.
- Chevron auto-rendered when `onToggle` is provided. Leaf nodes get a spacer instead.
- Slots: `icon`, `meta` (right-aligned metadata), `actions` (right-aligned, visible on hover by default)
- CVA variants: `size: 'sm' | 'md'`, `selected: true | false`
- Hover behavior: subtle bg highlight + actions become visible
- Keyboard: focusable, Enter to toggle, space to select
- Built internally from Flex, Text, Box primitives

## Section-by-Section Rebuild

### Sidebar Header

No changes needed — already uses Flex, Text, IconButton, Tooltip correctly.

### SearchFilter

**Before:** Custom Input + manual Search icon + manual clear IconButton + manual debounce timer.

**After:** Replace with `SearchInput` primitive which has built-in search icon, `onClear` callback, and loading state. Debounce logic stays in the component.

```tsx
<SearchInput
  size="sm"
  placeholder="Filter tables, views..."
  onClear={handleClear}
  onChange={handleChange}
/>
```

### ConnectionsSection

**Before:** Custom AccordionSection + manual Flex rows with inline active/hover styles + custom OverflowMenu with portal + manual positioning.

**After:**
- `Accordion.Item` wraps the section (controlled via UI store)
- `TreeItem` for each connection — icon slot gets colored dot, label gets connection name, actions slot gets connect/edit buttons
- `DropdownMenu` replaces custom OverflowMenu (Disconnect, Duplicate, Delete)
- `ContextMenu` wraps each TreeItem for right-click access to same actions

### DatabasesSection

**Before:** Custom AccordionSection + manual button pills for databases + custom popover for schema picker (portal + fixed overlay + manual positioning).

**After:**
- `Accordion.Item` wraps the section
- Database pills: `Flex` + `Button` (same approach but cleaner variant usage)
- Schema picker: `Select` primitive replaces custom popover — gets native dropdown behavior and keyboard support for free

### TablesSection

**Before:** Custom AccordionSection + custom SchemaTreeItem with manual padding calculation + custom OverflowMenu with portal + row count formatting in SchemaTreeItem.

**After:**
- `Accordion.Item` wraps the section
- `TreeItem` for each table — icon slot, label, meta slot (row count), expandable
- Nested `TreeItem` at depth=1 for columns — icon indicates key type, label shows name + data type, meta shows FK references
- `DropdownMenu` replaces OverflowMenu (Export, Copy name, Copy SELECT, Open in tab)
- `ContextMenu` wraps each TreeItem for right-click access

### ViewsSection

Same pattern as TablesSection but:
- View icon (Eye) instead of table icon (Table2)
- No Export option in the dropdown
- No row counts

## Visual Improvements

- **Hover-reveal actions** — overflow menu dots hidden by default, appear on row hover (reduces visual noise)
- **Proper Select** for schema picker instead of bare text button with custom popover
- **Consistent TreeItem spacing** — standardized padding/gaps across all sections
- **ContextMenu** on every tree item for right-click power users
- **Uniform accordion headers** — consistent height, chevron rotation, badge alignment

## Components Deleted After Rebuild

| File | Replacement |
|------|-------------|
| `components/explorer/AccordionSection.tsx` | `Accordion` primitive |
| `components/explorer/OverflowMenu.tsx` | `DropdownMenu` primitive |
| `components/schema/SchemaTreeItem.tsx` | `TreeItem` primitive + icon helpers in shared util |

## Shared Utilities

`formatRowCount` helper moves from SchemaTreeItem to a shared util (e.g., `src/renderer/src/lib/format.ts`) since it's a pure formatting function with no component dependency.

Icon helpers (`TableIcon`, `ColumnIcon`) move to `src/renderer/src/components/explorer/icons.tsx` as thin wrappers around lucide icons — they're explorer-specific, not primitive-level.

## Testing

- Unit tests for Accordion primitive (open/close, controlled/uncontrolled, actions slot click isolation)
- Unit tests for TreeItem primitive (depth indentation, expand/collapse, hover actions visibility, keyboard navigation)
- Stories for both new primitives
- Update existing explorer component tests to use new primitive APIs
