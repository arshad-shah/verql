# Primitives Consolidation & Settings System Design

## Summary

Two-part effort to (1) replace all native/custom HTML elements in app components with the existing primitives design system, and (2) build a comprehensive settings system with full persistence, theme control, and a VS Code-style settings UI — all composed entirely from primitives.

**Approach:** Foundation First — build the settings backend and UI first (validating the "everything composed from primitives" pattern), then migrate remaining components.

---

## Part 1: Settings System

### 1.1 Data Architecture

**ConfigStore expansion** — the existing `config.json` grows from `{ connections }` to hold all app state:

```typescript
interface AppConfig {
  connections: ConnectionProfile[];
  settings: {
    general: GeneralSettings;
    editor: EditorSettings;
    appearance: AppearanceSettings;
    connectionDefaults: ConnectionDefaults;
    dataDisplay: DataDisplaySettings;
    keybindings: KeyBinding[];
    plugins: Record<string, Record<string, unknown>>;
  };
}
```

**Default settings** are defined in a single `default-settings.ts` file in `shared/`. ConfigStore deep-merges defaults with persisted values on load, so new settings added in future automatically get defaults without migration.

**localStorage migration:** On first launch with the new settings system, existing localStorage values (`dbstudio-theme`, `dbstudio-sidebar-width`, `dbstudio-split-ratio`) are migrated into ConfigStore, then cleared. One-time operation.

### 1.2 Settings Categories

#### General

| Setting | Control | Default |
|---------|---------|---------|
| Query Timeout | NumberInput (5-300s) | 30 |
| Max History Items | NumberInput (50-1000) | 200 |
| Default Page Size | Select (50, 100, 500, 1000) | 100 |

#### Appearance

| Setting | Control | Default |
|---------|---------|---------|
| Theme | Visual card picker (7 themes) | dark |
| UI Density | Select (compact, comfortable, spacious) | comfortable |
| Sidebar Position | Select (left, right) | left |
| Accent Color | ColorInput | purple (#b4befe) |

Theme cards show mini-mockups of each theme's color palette. Active theme gets an accent border and checkmark. Selection is instant — applies theme immediately and persists via IPC.

Accent color overrides the `--accent` CSS variable at runtime, affecting focus rings, selections, and active states across all primitives.

#### Editor

| Setting | Control | Default |
|---------|---------|---------|
| Font Size | NumberInput (10-24) | 14 |
| Font Family | Select | JetBrains Mono |
| Tab Size | Select (2, 4) | 2 |
| Word Wrap | Switch | on |
| Minimap | Switch | off |
| Line Numbers | Switch | on |
| Bracket Matching | Switch | on |
| Cursor Style | Select (line, block, underline) | line |
| Ligatures | Switch | on |

These settings are read by QueryEditor via the Zustand settings store, replacing the current hardcoded values.

#### Connection Defaults

| Setting | Control | Default |
|---------|---------|---------|
| Auto Reconnect | Switch | off |
| Default SSL Mode | Select (disable, prefer, require) | prefer |
| Default Ports | NumberInput per DB type | standard ports |

#### Data Display

| Setting | Control | Default |
|---------|---------|---------|
| Null Display | Input | "NULL" |
| Date Format | Select (ISO, locale, custom) | ISO |
| Number Format | Select (raw, locale) | raw |
| Max Column Width | NumberInput | 300 |

#### Keybindings (read-only, designed for future customization)

- Data model: `{ id: string, label: string, keys: string[], category: string }`
- Default keybindings defined in `default-keybindings.ts` — single source of truth
- UI shows a searchable, categorized list: `SearchInput` + `Table` primitive
- Each row: action label + current key combo rendered with `Kbd` primitive
- Categories: Editor, Navigation, Query Execution, Panels
- No edit controls yet. Data model supports overrides for when customization is added later.

#### Plugins

- `Switch` to enable/disable each plugin
- Per-plugin settings rendered dynamically from manifest field declarations
- Form primitives chosen by field type (Input, Select, Switch, NumberInput)
- Stored under `settings.plugins.<pluginName>` in ConfigStore

### 1.3 IPC Channels

Added to `shared/ipc.ts` (`IpcChannelMap`):

```
settings:get-all    → returns full settings object
settings:get        → returns single category (e.g., "editor")
settings:set        → writes a key path + value, persists to disk
settings:reset      → resets a category to defaults
settings:changed    → main→renderer broadcast when any setting changes
```

### 1.4 Sync Architecture

**Zustand settings store** — reactive cache in the renderer process.

**Flow on user change:**
1. User changes a setting in the UI (e.g., theme → "nord")
2. Zustand store calls `window.electronAPI.invoke("settings:set", "appearance.theme", "nord")`
3. Main process: ConfigStore updates `config.json` on disk
4. Main process: broadcasts `settings:changed` event with the changed key/value
5. Renderer: settings store listener receives the change, updates Zustand state
6. Subscribers react (ThemeProvider applies `data-theme`, Monaco updates theme, etc.)

**Flow on startup:**
1. Main process loads `config.json`, deep-merges with defaults
2. Renderer mounts, calls `settings:get-all` via IPC
3. Zustand settings store hydrates from response
4. ThemeProvider reads theme from store (not localStorage)
5. All components read settings from store

### 1.5 Settings UI Layout

VS Code-style sidebar with content area, composed entirely from primitives:

**Sidebar (left):**
- Category list using `List` + `Button` (ghost variant)
- Active category: accent left border, highlighted background
- Categories: General, Appearance, Editor, Connections, Data Display, Keybindings, Plugins

**Content area (right):**
- Category heading: `Heading` + `Text` (description)
- Each setting row: `Flex` with label/description on left, control on right
- Labels: `Text` (primary) + `Text` (secondary) for description
- Controls: appropriate form primitive per setting type
- Category separator: `Divider`
- "Reset to Defaults" button per category: `Button` (outline)
- Scrollable content: `ScrollArea`

**Primitive mapping:**
- Layout: `Flex`, `Box`, `Grid`, `Divider`, `ScrollArea`
- Typography: `Heading`, `Text`
- Forms: `Select`, `NumberInput`, `Switch`, `Input`, `ColorInput`, `SearchInput`
- Data display: `Table`, `Kbd`, `Badge`, `List`
- Surfaces: `Card` (for theme picker cards)
- Feedback: `Toast` (for "Settings reset" confirmation)

---

## Part 2: Component Migration

Replace all native/custom HTML elements with primitives. Third-party libraries (AG Grid, @xyflow/react) stay — only their surrounding UI (toolbars, headers, empty states, loading states) must use primitives.

### 2.1 Priority 1 — Accessibility Fixes

| File | Problem | Fix |
|------|---------|-----|
| `NotificationItem.tsx` | `<div role="button">` | → `Button` (ghost) |
| `ConnectionSwitcher.tsx` | `<div role="button">` + raw `<input>` | → `Button` + `Input` |

### 2.2 Priority 2 — Raw HTML Buttons & Inputs

| File | Problem | Fix |
|------|---------|-----|
| `NotificationBell.tsx` | Raw `<button>`, custom badge div | → `IconButton` + `Badge` |
| `NotificationPanel.tsx` | Raw `<button>`s, custom overlay, raw `<span>`s | → `Popover`/`Panel` + `Button` + `Text` |
| `ConnectionCard.tsx` | Raw `<button>`, styled divs | → `Card` + `Button` + `Text` + `Badge` |
| `ConnectionSwitcher.tsx` | Raw `<button>` for "New connection" | → `Button` |
| `ConnectionForm.tsx` | Custom dropdown implementation | → `Select` |

### 2.3 Priority 3 — Custom Feedback Patterns

| File | Problem | Fix |
|------|---------|-----|
| `ConnectionTestButton.tsx` | Manual icon+text for status | → `Alert` or `Text` with status color |
| `ExportModal.tsx` | Manual text for result feedback | → `Alert` or `Toast` |
| `ImportModal.tsx` | Manual text for result feedback | → `Alert` or `Toast` |
| `PlanNodeView.tsx` | Inline styled div as progress bar | → `Progress` |

### 2.4 Priority 4 — Layout & Typography Cleanup

| File | Problem | Fix |
|------|---------|-----|
| `StatusBar.tsx` | Custom divs for layout | → `Flex` + `Box` + `Text` |
| `SavedQueriesPanel.tsx` | Custom hover divs, layout | → `List` + `Button` (ghost) + `Text` |
| `CommandPalette.tsx` | Custom backdrop + modal div | → `Modal` |

### 2.5 Third-Party Wrapper Updates

| File | What stays | What changes |
|------|-----------|-------------|
| `ResultsGrid.tsx` | AG Grid component | Surrounding toolbar, empty state, loading → primitives |
| `ERDiagram.tsx` | @xyflow/react | Container, controls overlay → primitives |
| `TableNode.tsx` | @xyflow node | Internal layout → primitives where applicable |

### 2.6 No Changes Needed

These already follow best practices:
- TitleBar, TabBar, ConfirmDialog, QueryToolbar, ActivityBar, SearchFilter, SchemaTreeItem, AccordionSection, SettingsPanel (will be rewritten as part of Settings UI)

---

## Architecture Summary

```
┌─ Renderer Process
│  ├─ Zustand Settings Store (reactive cache)
│  │  └─ Hydrated from main process on startup
│  │  └─ Updated via IPC on changes
│  ├─ ThemeProvider (reads theme from settings store)
│  │  └─ Sets data-theme attribute on <html>
│  ├─ Settings UI (composed from primitives)
│  │  └─ Writes changes via settings:set IPC
│  └─ All components (composed from primitives)
│     └─ Read settings from Zustand store
│
├─ Preload (IPC Bridge)
│  └─ settings:get-all, settings:get, settings:set, settings:reset, settings:changed
│
└─ Main Process
   └─ ConfigStore (config.json on disk)
      └─ Deep-merges with default-settings.ts on load
      └─ Broadcasts settings:changed on write
```

---

## Testing Strategy

- **Settings store:** Unit tests for Zustand store (mock IPC)
- **Settings UI:** Storybook stories for each settings category, composed from primitives
- **Component migration:** Update existing stories to verify primitives render correctly
- **Theme switching:** Visual regression via Storybook across all 7 themes
- **IPC:** Unit tests for settings handlers in main process

---

## Out of Scope

- SQLite persistence (deferred — JSON ConfigStore is sufficient for now)
- Customizable keybindings (read-only list now, data model supports future customization)
- Replacing AG Grid or @xyflow/react internals
- Settings sync across devices
- Settings import/export (could be added later since it's just a JSON file)
