# Extensions Page Redesign

## Goal

Replace the plain extensions panel with a richer two-part UI: a minimal sidebar list (stays where it is) and a full main-area detail view that opens as a tab when a plugin is clicked. Follows the VS Code extensions model.

## Plugin Icons

### Manifest Change

Add an optional top-level `icon` field to `PluginManifest`:

```typescript
// in src/main/plugins/types.ts
export interface PluginManifest {
  // ... existing fields
  icon?: string  // relative path to icon file (PNG/SVG, e.g. "icon.png")
}
```

### Icon Serving

- For **external plugins**: resolve `icon` relative to the plugin directory. Read the file, base64-encode it, and include it in the IPC response as a data URI (`data:image/png;base64,...`).
- For **bundled plugins**: add an optional `iconDataUri` field to the bundled plugin registration. Bundled plugins can import their icon as a static asset or simply omit it (letter avatar fallback).
- The `plugins:list` IPC handler returns a new `icon?: string` field (data URI or undefined) on each plugin info object.

### Renderer Fallback

If `icon` is present, render an `<img>` with the data URI. Otherwise, render the colored letter avatar (first character of `displayName` on a gradient background). The gradient color is deterministic based on the plugin name (hash to a preset palette).

## Sidebar List Redesign (`ExtensionsPanel`)

### Layout

The panel keeps its position in the sidebar. The content changes to:

1. **Header bar**: search input (filters by name) + install button + refresh button
2. **Scrollable list** grouped into "Built-in" and "Installed" sections
3. **Footer**: total count ("N extensions")

### List Item

Each row is a compact, minimal entry:

- **Icon**: 28px rounded square — plugin icon image or letter avatar with deterministic gradient
- **Name**: plugin `displayName`, single line, truncated
- **Status dot**: 6px circle — green (active), yellow (degraded), red (error), gray (inactive/discovered)

No description, version, or action buttons in the list. All detail lives in the main-area tab.

### Behavior

- Clicking a row calls `openPluginDetail(pluginName)` on the tab store
- The clicked row gets a selected state (subtle accent background + left border)
- Search input filters the list by `displayName` (case-insensitive substring match)
- Install button opens the existing install-from-path modal
- Refresh button reloads the plugin list

## New Tab Type: `PluginDetailTab`

### Type Definition

```typescript
// in shared/types.ts
export interface PluginDetailTab {
  id: string
  type: 'plugin-detail'
  title: string
  pluginName: string  // manifest name, used to fetch data
}

export type Tab = QueryTab | TableTab | ErDiagramTab | ConnectionFormTab | PluginDetailTab
```

### Tab Store

Add `openPluginDetail(pluginName: string)` to the tabs store:

- ID: `plugin-${pluginName}`
- Deduplicates: if a tab with that ID exists, activate it instead of creating a new one
- Title: plugin's `displayName`

### Tab Bar

- Icon: `Puzzle` from lucide-react, colored with a green/teal accent
- Tab renders like any other tab (closable, draggable, context menu)

## Main-Area Detail View (`PluginDetailView`)

### Header

Compact horizontal bar pinned to the top (not scrollable):

- **Icon**: 48px rounded square — plugin icon or letter avatar
- **Name**: `displayName` in semibold 16px
- **Version**: muted text next to name
- **Status badge**: colored badge (green "Active", yellow "Degraded", red "Error", gray "Disabled")
- **Source badge**: "Built-in" or "Installed"
- **Actions** (right-aligned): Enable/Disable button, Uninstall button (only for non-bundled)

### Sub-Tabs

Horizontal tab bar below the header with 4 tabs:

#### Overview (default)

- **Stats row**: 3 cards in a grid — Status (with dot + label), Contributions (count), Errors (count or "None")
- **Details card**: key-value grid — Identifier, Version, Source, Phase

#### Contributions

- List of all registered contributions
- Each row: type badge (driver, command, panel, exporter, importer, middleware, setting) + name
- Type badges use semantic colors from the Badge primitive (accent for drivers, info for commands, etc.)
- Empty state if no contributions

#### Errors

- Reverse-chronological list of error records (most recent 20)
- Each entry: error icon + message (truncated) + timestamp
- Clicking an entry expands it to show the full stack trace in a `Code` block
- Empty state: "No errors recorded"

#### Settings

- If the plugin declares `contributes.settings`, render a form with the declared fields
- Each setting: label + appropriate input (text, number, boolean/switch, password)
- Save button persists via `plugins:set-settings` IPC call
- If no settings declared: empty state "This extension has no configurable settings"

## Design System Usage

All components built from existing primitives:

| Element | Primitive |
|---------|-----------|
| Sidebar search | `SearchInput` |
| List sections | `Text` (uppercase muted label) |
| Plugin icon fallback | `Flex` + `Text` (styled as avatar) |
| Status dots | `Box` with semantic color classes |
| Detail header | `Flex` + `Text` + `Badge` + `Button` |
| Sub-tabs | `Tabs` primitive |
| Stat cards | `Card` with `padding="md"` |
| Details grid | Key-value pairs with `Text` |
| Contribution badges | `Badge` with semantic variants |
| Error list | `Stack` of expandable items |
| Error stack traces | `Code` with `block` prop |
| Settings form | `FormField` + `Input` / `Switch` / `PasswordInput` |
| Empty states | `EmptyState` primitive |
| Confirm dialogs | Existing `ConfirmDialog` |
| Install modal | Existing `Modal` + `Input` |

## Files Changed

### New Files
- None — redesign happens in existing files

### Modified Files
- `shared/types.ts` — add `PluginDetailTab` to `Tab` union
- `src/main/plugins/types.ts` — add `icon?: string` to `PluginManifest`
- `src/main/ipc-handlers.ts` — include `icon` data URI in `plugins:list` response
- `src/renderer/src/stores/tabs.ts` — add `openPluginDetail()` method
- `src/renderer/src/components/shell/tab-bar/TabItem.tsx` — add icon mapping for `plugin-detail`
- `src/renderer/src/components/plugins/ExtensionsPanel.tsx` — rewrite as minimal list
- `src/renderer/src/components/plugins/PluginDetailView.tsx` — rewrite as full main-area tabbed view
- `src/renderer/src/App.tsx` — add rendering case for `plugin-detail` tab type

## Out of Scope

- Plugin marketplace / remote installation
- Plugin auto-updates
- Plugin dependency resolution UI
- Drag-and-drop reordering of plugins
