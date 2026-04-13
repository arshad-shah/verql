# Declarative Plugin UI System

**Date:** 2026-04-13  
**Status:** Approved  
**Approach:** Manifest + Runtime Registries (Hybrid)

## Overview

Plugins declare UI contributions through their manifest (what surfaces they touch) and register implementations at activation time (widget trees, dynamic resolvers). The host renders all plugin UI using its own primitives, ensuring consistent theming and accessibility. This replaces the current pattern of hardcoding IPC channels per plugin capability.

**Core rule:** Manifest = "I will contribute X." Runtime = "Here is X."

## Widget Vocabulary

The host defines a finite set of widget types. Each widget is a plain JSON-serializable object that travels over IPC. Plugins compose these to build their UI.

```typescript
type Widget =
  | SelectorWidget        // Dropdown — static options or dynamic resolver
  | ActionButtonWidget    // Clickable button that fires a command
  | StatusIndicatorWidget // Icon + label showing a state (connected, syncing, error)
  | TextWidget            // Static or dynamic text (labels, metrics)
  | TreeWidget            // Expandable tree (schema explorer-style)
  | ListWidget            // Flat list of items with optional actions
  | SectionWidget         // Collapsible group containing other widgets
  | SeparatorWidget       // Visual divider
```

### Common Base

```typescript
interface WidgetBase {
  id: string               // Unique within the plugin
  type: string             // Discriminator
  visible?: boolean       // Static visibility toggle. Default: true.
                          // For conditional visibility, plugins update widget
                          // trees at runtime via registerPanel/registerStatusBar.
  tooltip?: string
}
```

### SelectorWidget

Handles both static and dynamic option lists. This is the primary widget for connection-scoped controls like Snowflake's warehouse/role/database/schema selectors.

```typescript
interface SelectorWidget extends WidgetBase {
  type: 'selector'
  label: string
  options?: { value: string; label: string }[]  // Static options
  resolver?: string    // Named resolver ID — plugin registers a function
                       // that returns options based on connection state
  value?: string       // Current/default value
  onChange: string     // Command ID to fire when selection changes
}
```

### ActionButtonWidget

```typescript
interface ActionButtonWidget extends WidgetBase {
  type: 'action-button'
  label: string
  icon?: string
  command: string      // Command ID to execute
  variant?: 'primary' | 'secondary' | 'ghost'
}
```

### StatusIndicatorWidget

```typescript
interface StatusIndicatorWidget extends WidgetBase {
  type: 'status-indicator'
  label: string
  icon: string
  status?: 'ok' | 'warning' | 'error' | 'loading'
}
```

### TextWidget

```typescript
interface TextWidget extends WidgetBase {
  type: 'text'
  content: string
  style?: 'label' | 'value' | 'muted'
}
```

### TreeWidget

```typescript
interface TreeWidget extends WidgetBase {
  type: 'tree'
  resolver: string     // Returns tree nodes dynamically
  onSelect?: string    // Command ID fired when a node is selected
}
```

### ListWidget

```typescript
interface ListWidget extends WidgetBase {
  type: 'list'
  items?: { id: string; label: string; icon?: string; action?: string }[]
  resolver?: string    // Dynamic item list
}
```

### SectionWidget

```typescript
interface SectionWidget extends WidgetBase {
  type: 'section'
  label: string
  collapsible?: boolean   // Default: true
  collapsed?: boolean     // Default: false
  children: Widget[]
}
```

### SeparatorWidget

```typescript
interface SeparatorWidget extends WidgetBase {
  type: 'separator'
}
```

## Contribution Surfaces & Zones

Each shell surface has named zones. Plugins declare a target zone; the host arranges widgets within zones. Users can reorder within a zone if they choose.

### ActivityBar

- Plugins declare a panel icon in the left strip
- Zones: `activityBar.top` (below built-in items like Explorer, Saved Queries, Charts, Extensions) or `activityBar.bottom` (near Notifications, Settings)
- Clicking the icon activates the plugin's sidebar panel

### Sidebar Panels

- A vertical stack of widgets composed by the plugin (sections, selectors, lists, trees, action buttons)
- Rendered by the host using built-in primitives, themed consistently
- Activated when the corresponding ActivityBar icon is clicked

### StatusBar

- Three zones: `statusBar.left` (connection info area), `statusBar.center`, `statusBar.right` (indicators)
- Plugins contribute widgets to a zone — typically selectors, status indicators, or text
- Connection-scoped selectors (Snowflake warehouse/role/database/schema) live in `statusBar.left` alongside the connection switcher

### TabBar

- Plugins can register new tab types (similar to how ER Diagram is a built-in tab type)
- Tab content is a widget tree rendered in the main content area via WidgetRenderer

### Context Menus

- Plugins declare menu items scoped to a target: `table`, `column`, `connection`, `tab`
- Each item maps to a command ID
- Host appends them to the relevant context menu, grouped under the plugin name

### Command Palette (New)

- All commands registered via `CommandRegistry` are automatically discoverable and searchable
- No extra declaration needed — commands surface themselves

## Manifest Schema

The manifest declares which surfaces a plugin will contribute to. These are the new fields added to `contributes`:

```typescript
contributes: {
  // Existing fields: drivers, themes, commands, connectionMiddleware,
  // connectionFields, panels, settings, exporters, importers

  // NEW: UI contribution declarations
  activityBar?: {
    id: string
    title: string
    icon: string           // Icon name from the host's icon set
    zone?: 'top' | 'bottom'  // Default: 'top'
  }[]

  statusBar?: {
    id: string
    zone: 'left' | 'center' | 'right'
  }[]

  contextMenus?: {
    id: string
    target: 'table' | 'column' | 'connection' | 'tab'
    label: string
    command: string        // Command ID to fire
  }[]

  tabs?: {
    id: string
    title: string
    icon: string
  }[]

  selectors?: {
    id: string
    label: string
    zone: 'statusBar.left' | 'statusBar.right' | 'panel'
    resolver?: string      // If dynamic
    options?: { value: string; label: string }[]  // If static
    onChange: string        // Command ID
  }[]
}
```

## Runtime Registration API

At activation, plugins register implementations via `ctx.ui`:

```typescript
interface UIRegistry {
  // Register a widget tree for a sidebar panel
  registerPanel(id: string, widgets: Widget[]): void

  // Register a widget tree for the status bar
  registerStatusBar(id: string, widgets: Widget[]): void

  // Register a widget tree for a tab type
  registerTab(id: string, widgets: Widget[]): void

  // Register a dynamic resolver (for selectors, trees, lists)
  registerResolver(id: string, resolver: (context: ResolverContext) => Promise<any>): void

  // Invalidate a resolver's cached results (triggers re-fetch)
  invalidate(resolverId: string): void
}

interface ResolverContext {
  connectionId: string
  // Additional context the resolver may need
}
```

### Example: Snowflake Plugin Activation

```typescript
export function activate(ctx: PluginContext) {
  ctx.drivers.register('snowflake', adapter)

  ctx.ui.registerPanel('snowflake-panel', [
    { type: 'section', id: 'context', label: 'Session Context', children: [
      { type: 'selector', id: 'warehouse', label: 'Warehouse',
        resolver: 'warehouses', onChange: 'snowflake:use-warehouse' },
      { type: 'selector', id: 'role', label: 'Role',
        resolver: 'roles', onChange: 'snowflake:use-role' },
      { type: 'selector', id: 'database', label: 'Database',
        resolver: 'databases', onChange: 'snowflake:use-database' },
      { type: 'selector', id: 'schema', label: 'Schema',
        resolver: 'schemas', onChange: 'snowflake:use-schema' },
    ]},
    { type: 'action-button', id: 'refresh', label: 'Refresh Schema',
      command: 'snowflake:refresh-schema', icon: 'refresh' }
  ])

  ctx.ui.registerResolver('warehouses', async ({ connectionId }) => {
    const rows = await adapter.execute(connectionId, 'SHOW WAREHOUSES')
    return rows.map(r => ({ value: r.name, label: r.name }))
  })

  ctx.ui.registerResolver('roles', async ({ connectionId }) => {
    const rows = await adapter.execute(connectionId, 'SHOW ROLES')
    return rows.map(r => ({ value: r.name, label: r.name }))
  })

  ctx.ui.registerResolver('databases', async ({ connectionId }) => {
    const rows = await adapter.execute(connectionId, 'SHOW DATABASES')
    return rows.map(r => ({ value: r.name, label: r.name }))
  })

  ctx.ui.registerResolver('schemas', async ({ connectionId }) => {
    const rows = await adapter.execute(connectionId, 'SHOW SCHEMAS')
    return rows.map(r => ({ value: r.name, label: r.name }))
  })

  ctx.ui.registerStatusBar('snowflake-status', [
    { type: 'status-indicator', id: 'wh-status', label: 'Warehouse', icon: 'database' }
  ])

  ctx.commands.register('snowflake:use-warehouse', async ({ value, connectionId }) => {
    await adapter.execute(connectionId, `USE WAREHOUSE "${value}"`)
    ctx.ui.invalidate('warehouses')
  })

  ctx.commands.register('snowflake:use-role', async ({ value, connectionId }) => {
    await adapter.execute(connectionId, `USE ROLE "${value}"`)
    ctx.ui.invalidate('warehouses') // Role change may affect visible warehouses
    ctx.ui.invalidate('databases')
  })

  // ... similar for database and schema commands
}
```

## IPC Protocol

Four generic IPC channels replace per-plugin bespoke channels:

```typescript
// Renderer asks for all UI contributions for a surface
'plugins:ui:get-contributions': (surface: string) => UIContribution[]

// Renderer asks a resolver to fetch dynamic options
'plugins:ui:resolve': (pluginId: string, resolverId: string, context: ResolverContext) => any

// Renderer fires a plugin command (widget interaction)
'plugins:ui:action': (pluginId: string, commandId: string, payload: any) => any

// Main process pushes notification that contributions changed
'plugins:ui:contributions-changed': () => void  // Event — renderer re-fetches
```

### Data Flow Example: Snowflake Warehouse Selector

1. User connects to Snowflake
2. Renderer calls `plugins:ui:get-contributions('statusBar')` — gets the warehouse selector widget with `resolver: 'warehouses'`
3. Renderer calls `plugins:ui:resolve('snowflake', 'warehouses', { connectionId })` — gets `[{ value: 'COMPUTE_WH', label: 'COMPUTE_WH' }, ...]`
4. Renderer renders a `<Select>` using the host's primitive from `primitives/forms/Select.tsx`
5. User picks a warehouse — renderer calls `plugins:ui:action('snowflake', 'snowflake:use-warehouse', { value: 'ANALYTICS_WH' })`
6. Main process executes the command, updates state
7. Plugin calls `ctx.ui.invalidate('warehouses')` if needed, which triggers `plugins:ui:contributions-changed`
8. Renderer re-fetches and re-renders

## Host-Side Rendering

### WidgetRenderer Component

A single recursive React component maps widget types to host primitives:

| Widget Type        | Host Primitive                             |
|--------------------|--------------------------------------------|
| `selector`         | `<Select>` from `primitives/forms/`        |
| `action-button`    | `<Button>` from `primitives/forms/`        |
| `status-indicator` | Icon + label combo / Badge                 |
| `text`             | `<span>` with token-based styling          |
| `tree`             | Existing tree component pattern            |
| `list`             | `<ul>` with optional action buttons        |
| `section`          | Collapsible group, recursively renders children |
| `separator`        | Styled `<hr>` divider                      |

### Shell Integration

Each surface component gets a thin integration layer:

- **StatusBar.tsx** — queries `plugins:ui:get-contributions('statusBar')`, passes widgets to `WidgetRenderer`, places them in the correct zone div
- **ActivityBar.tsx** — queries for `activityBar` contributions, renders icons in the strip
- **Sidebar.tsx** — when a plugin panel is active, queries its widget tree and renders via `WidgetRenderer`
- **ContextMenu.tsx** — queries `contextMenu` contributions scoped to the target type, appends grouped items

### Plugin UI Store

A Zustand store (`pluginUI.ts`) manages the renderer-side state:

- Caches contributions per surface (avoids re-fetching on every render)
- Caches resolver results per (resolverId, connectionId) tuple
- Listens to `plugins:ui:contributions-changed` events and invalidates relevant cache entries
- Components subscribe to their relevant slice and re-render when plugins activate/deactivate

### Theming

Works automatically. `WidgetRenderer` uses host primitives which already respect `data-theme` and the three-layer token system in `tokens.css` (raw scale → semantic tokens → component tokens). A theme plugin that changes semantic tokens styles plugin UI identically to built-in UI. No special handling needed.

## Ordering & Placement

- Plugins declare a target zone for each contribution
- Host arranges within zones in plugin activation order by default
- Users can reorder within a zone via settings (future enhancement)
- Built-in items always appear before plugin contributions within the same zone

## Validation

At activation, the host verifies that every contribution declared in the manifest was registered at runtime — same pattern as the existing driver verification. Unregistered declarations produce a warning in the plugin error log. This catches bugs like declaring a `statusBar` contribution in the manifest but forgetting to call `ctx.ui.registerStatusBar()`.

## Migration Path

- Existing plugins continue to work — `drivers`, `connectionMiddleware`, `connectionFields` are unchanged
- The existing `PanelRegistry` and `CommandRegistry` are refactored to use the new `UIRegistry` internally
- New UI contribution fields in the manifest are optional — plugins adopt them incrementally
- The Snowflake plugin is the first migration target, replacing its hardcoded selectors with declared ones
