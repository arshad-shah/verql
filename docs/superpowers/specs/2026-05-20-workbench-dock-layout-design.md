# Workbench Dock Layout: Secondary Sidebar, Bottom Dock, Inspector

**Status:** Approved (design)
**Date:** 2026-05-20

## Summary

Build a VS Code / DataGrip-style workbench with three resizable dock regions:

- **Left sidebar** (exists today; minor consolidation)
- **Right (secondary) sidebar** — new, hosts the Inspector and plugin panels
- **Bottom dock** — new, hosts query Results (moved out of the QueryPanel) and plugin panels

All three regions render one panel at a time. Plugins target a region via the existing `PanelContribution.location` field, extended to `'sidebar' | 'secondary' | 'bottom'`. The hard-mounted AI Assistant slot is removed; the AI panel becomes the first real tenant of the secondary sidebar.

## Motivation

Today's layout has two issues:

1. **No right sidebar.** `appearance.sidebarPosition` only flips the existing left sidebar between sides — there is no distinct right region. Row/cell inspection (the standard DB-IDE workflow in TablePlus, DataGrip, Sequel Ace) has no home.
2. **No real bottom dock.** Query results are hardcoded inside `QueryPanel.tsx:158` as a `flex-1` block with no resize handle and no contribution surface. The `'bottom'` value in `PanelContribution.location` is declared but dead.

Plugins also need a uniform way to surface UI without each capability needing bespoke wiring (currently the AI chat panel is hard-mounted at `App.tsx:170`).

## Goals

- One activity-bar-driven dock model on left and right; tab-strip-driven on the bottom.
- Resize handles + double-click collapse on all three regions.
- A single declarative path for plugins: contribute a panel with `location ∈ {sidebar, secondary, bottom}`.
- A built-in Inspector that reflects the current selection (row/cell, schema table, ER node).
- Migrate the existing AI chat hard-mount to the new system as the first proof of concept.

## Non-goals (v1)

- Dragging panels between regions.
- Stacked / split panels inside one region.
- Per-tab memory of dock state.
- Bottom dock variants per tab type beyond what's described below.
- Bottom-zone plugin contributions to the **right** activity bar (only `top` zone for now).

## Architecture

### Workbench layout

```
┌─────────────────────────────────────────────────────────────┐
│ TitleBar                                                    │
├──┬──────────┬──────────────────────────────┬──────────┬────┤
│A │ Sidebar  │ Editor area (tabs)            │Secondary │ A2 │
│c │ (left)   │                                │ sidebar  │    │
│t │          │                                │          │    │
│B ├─ResizeH──┼─────────────────────────────┼─ResizeH──┤    │
│a │          │ ── Resize handle ──         │          │    │
│r │          │ Bottom dock                  │          │    │
├──┴──────────┴──────────────────────────────┴──────────┴────┤
│ StatusBar                                                   │
└─────────────────────────────────────────────────────────────┘
```

- `ActivityBar` (left, exists): drives `location: 'sidebar'`.
- `SecondaryActivityBar` (right, new): drives `location: 'secondary'`.
- `BottomDock` (new): inline tab strip drives `location: 'bottom'`.
- The bottom dock is **workbench-level** (shared across editor tabs). When the active editor tab is a `QueryTab`, the Results panel inside the bottom dock renders that tab's results; switching query tabs swaps in place.

### Component map

```
src/renderer/src/components/shell/
  ActivityBar.tsx                 (existing)
  SecondaryActivityBar.tsx        (new)
  SecondarySidebar.tsx            (new)
  BottomDock.tsx                  (new)
  BottomDockTabs.tsx              (new — inline tab strip)

src/renderer/src/components/inspector/
  InspectorPanel.tsx              (new — built-in)

src/renderer/src/components/query/
  QueryPanel.tsx                  (modified — results section removed)

src/renderer/src/stores/
  ui.ts                           (extended)
  selection.ts                    (new)
```

### State (renderer)

`ui.ts` gains:

```ts
secondarySidebarVisible: boolean             // default from settings.appearance.showSecondarySidebar
secondaryActivePanel: SecondaryPanelId       // 'inspector' | `plugin:${contributionId}`
bottomDockVisible: boolean                   // default from settings.appearance.showBottomDock
bottomDockActivePanel: BottomPanelId         // 'results' | `plugin:${contributionId}`

setSecondaryActivePanel(id): void            // active-twice → hide (mirrors setActivePanel)
toggleSecondarySidebar(): void
setSecondarySidebarWidth(px): void           // clamped, writes to settings

setBottomDockActivePanel(id): void           // active-twice → hide
toggleBottomDock(): void
setBottomDockHeight(px): void                // clamped, writes to settings
```

Width/height clamps: secondary sidebar 220..640 (default 320); bottom dock 120..640 (default 240).

`stores/selection.ts` (new):

```ts
type Selection =
  | { kind: 'row'; tabId: string; row: Record<string, unknown>; columns: ColumnMeta[] }
  | { kind: 'table'; connectionId: string; schema?: string; table: string }
  | { kind: 'erNode'; connectionId: string; schema?: string; table: string }
  | null

interface SelectionState {
  selection: Selection
  setSelection(s: Selection): void
  clearForTab(tabId: string): void
}
```

Producers:
- `ResultsPanel` / AG Grid: `onRowClicked` / `onCellClicked` → `setSelection({ kind: 'row', ... })`
- `ERDiagram`: node click → `setSelection({ kind: 'erNode', ... })`
- Schema tree (left sidebar) is **out of scope** for v1 selection wiring.

Consumers: `InspectorPanel`.

### Settings additions (`shared/settings.ts`)

```ts
appearance: {
  // existing
  sidebarWidth: number
  sidebarPosition: 'left' | 'right'
  splitRatio: number
  showStatusBar: boolean

  // new
  secondarySidebarWidth: number          // default 320
  showSecondarySidebar: boolean          // default false
  bottomDockHeight: number               // default 240
  showBottomDock: boolean                // default true
}
```

Settings UI: add the new fields to `AppearanceSettings.tsx` so users can tweak default sizes and visibility persistence.

### Plugin SDK changes

`src/main/plugins/sdk/types.ts` and `src/main/plugins/types.ts`:

```ts
export interface PanelContribution {
  title: string
  icon: string
  location: 'sidebar' | 'secondary' | 'bottom'   // 'secondary' added
  render(): string
}
```

No other SDK changes. The renderer's `usePluginUIStore` already exposes contributions by surface; the new dock components select by `location`.

### Activity bar (right) — zones

The right activity bar reuses the existing contribution shape for the left bar's `zone: 'top'` entries, filtered to those targeting the secondary sidebar. **Only `top` zone is honored in v1**; `bottom` zone on the right bar is deferred. The Inspector is hardcoded as the topmost button (always present, even with no plugins active).

### Bottom dock — tab strip + active editor coupling

The bottom dock is **workbench-level** but its built-in Results panel is **tab-aware**:

```ts
function BottomDock() {
  const activeTab = useTabsStore(s => s.tabs.find(t => t.id === s.activeTabId))
  const showResults = activeTab?.type === 'query'
  // tab strip = ['Results' if showResults] + [plugin bottom contributions]
  // body = the current active panel's renderer
}
```

When the user switches editor tabs:
- If both tabs are `QueryTab` → Results body re-renders with the new tab's results.
- If the new tab type doesn't support Results (ER, Settings, Connection Form, Plugin Detail) and `bottomDockActivePanel === 'results'` → fall back to the first available plugin panel; if none, render an empty state ("No bottom panels for this tab").

This keeps the dock visible during tab switches (avoids flicker) while reflecting the active context.

### QueryPanel slimming

Remove lines 158–172 of `QueryPanel.tsx` (the `Results — bottom half` block and its error/empty fallbacks). The fallbacks for "no results yet" and "query error" move into `ResultsPanel`'s own empty/error states so they render inside the bottom dock.

`QueryPanel.tsx` becomes: toolbar + NL input bar + editor only. The `flex-1 min-h-30` on the editor block becomes the only flex-grow child.

### Migration: AI chat panel

1. The AI plugin's manifest (or the bundled-plugin registration that produces the `ai-chat-panel` panel contribution) changes to `location: 'secondary'`.
2. `<PluginPanelMount surface="panels" componentId="ai-chat-panel" />` at `App.tsx:170` is removed.
3. `useAIStore.togglePanel` becomes a thin wrapper:
   ```ts
   togglePanel() {
     const ui = useUiStore.getState()
     const target = 'plugin:ai-chat-panel'
     if (ui.secondaryActivePanel === target && ui.secondarySidebarVisible) {
       ui.toggleSecondarySidebar()  // hide
     } else {
       ui.setSecondaryActivePanel(target)  // show + select
     }
   }
   ```
   Existing left-activity-bar Sparkles button continues to work unchanged.
4. `aiPanelOpen` derived state moves to a selector against `ui.secondarySidebarVisible && ui.secondaryActivePanel === 'plugin:ai-chat-panel'`.

## Inspector v1 behavior

Single component, dispatch by `selection.kind` + active tab type:

| Active tab     | Selection       | Inspector body                                          |
|----------------|-----------------|----------------------------------------------------------|
| QueryTab       | `row`           | Key/value list: column name, value, data type. Header strip with column metadata (data type, nullable, PK/FK from `useSchemaStore`) when resolvable. |
| QueryTab       | none            | Last-query stats: rows, execution time (ms), status, error message if any. Pulled from `tab.results` / `tab.error`. |
| TableTab       | n/a             | Selected table's columns + indexes from `useSchemaStore`. (Selection is implied by the tab itself.) |
| ErDiagramTab   | `erNode`        | Selected node's table summary (same columns/indexes view as TableTab). |
| ErDiagramTab   | none            | Empty state: "Select a node to inspect." |
| Other          | any             | Empty state: "Nothing to inspect for this tab." |

The inspector body fills the secondary sidebar (no internal split, just a thin title bar with the inspector name + close button).

## Invocation

| Action                                  | Trigger                              |
|-----------------------------------------|--------------------------------------|
| Toggle left sidebar                     | `ActivityBar` button / existing      |
| Toggle right sidebar                    | `SecondaryActivityBar` button, `Cmd/Ctrl+Alt+B`, command palette, View menu |
| Toggle bottom dock                      | `Cmd/Ctrl+J`, command palette, View menu |
| Show Inspector                          | Right activity bar (Inspector icon), command palette: `View: Show Inspector` |
| Show specific plugin panel              | Right activity bar / bottom tab strip, auto-generated `View: Show <Title>` palette entries |

Verify before claiming `Cmd/Ctrl+B` for left sidebar — if already bound, leave it. The two new shortcuts (`Cmd/Ctrl+Alt+B`, `Cmd/Ctrl+J`) must be checked against existing bindings during implementation.

Native-menu IPC channels added alongside the existing `menu:toggle-command-palette` pattern:
- `menu:toggle-secondary-sidebar`
- `menu:toggle-bottom-dock`
- `menu:show-inspector`

## Resize behavior

All three resize handles use the existing `ResizeHandle` primitive. Each handle:
- Calls the corresponding `setXxxSize` action on drag, which clamps and persists via `useSettingsStore`.
- Double-click toggles between current and default size, using the `prevSize` snapshot pattern at `App.tsx:84`.

## Persistence & defaults

| Setting                            | Default | Persisted |
|------------------------------------|---------|-----------|
| `appearance.showSecondarySidebar`  | `false` | yes       |
| `appearance.secondarySidebarWidth` | `320`   | yes       |
| `appearance.showBottomDock`        | `true`  | yes       |
| `appearance.bottomDockHeight`      | `240`   | yes       |

`secondaryActivePanel` and `bottomDockActivePanel` are session-only (Zustand, not persisted) — defaults to `'inspector'` and `'results'` respectively.

## Testing

- Unit (`tests/unit/`):
  - `ui.ts` actions: visibility/active-panel toggles, clamps, active-twice-hides behavior.
  - `selection.ts` actions including `clearForTab`.
  - `BottomDock` panel selection fallback logic when switching to a tab type with no Results.
- Storybook:
  - `SecondarySidebar` with Inspector body (row selected / no selection / empty state).
  - `BottomDock` tab strip with Results + multiple plugin panels.
  - `InspectorPanel` for each `Selection` kind.
  - Resize handle interactions.
- Manual smoke (since UI changes):
  - AI panel toggles via Sparkles button and via the right activity bar.
  - Query results render in the bottom dock; switching between two query tabs swaps results in place.
  - Disabling the AI plugin removes its right-bar icon.

## Migration / compatibility

- `appearance.sidebarPosition` is unchanged; it still flips the **left** sidebar between sides. (The right region is independent.) An edge case: with `sidebarPosition === 'right'` and the new secondary sidebar visible, both regions stack on the right. Acceptable in v1 — users opting into this layout get what they ask for. A future iteration could collapse the secondary into the same region with tab stacking, but that's out of scope.
- Existing plugin manifests with `location: 'sidebar'` or `'bottom'` continue to work. `'bottom'` becomes meaningful for the first time.
- Removing the hard-mount at `App.tsx:170` is a no-op as long as the AI plugin's manifest migration ships in the same commit.

## Open implementation questions (for the plan, not the spec)

- Exact AG Grid wiring for `onRowClicked`/`onCellClicked` — where in `ResultsPanel` to attach.
- Whether the bottom dock tab strip should support keyboard cycling (`Ctrl+PageDown` / `Ctrl+PageUp`). Defer to plan.
- Whether to add a "panels:contributions-changed" subscription in `SecondaryActivityBar` (already exists in `plugin-ui.ts`; just need to mount it).

## Out-of-scope follow-ups

- Drag-to-reorder activity bar icons (left or right).
- Drag-to-move panels between regions.
- Stacked panels (multi-panel side-by-side within one region).
- Per-tab dock memory.
- Right activity bar `bottom`-zone contributions.
- Schema-tree selection feeding the Inspector.
- Workbench-level Query History / Logs panels (could be next plugin tenants of `location: 'bottom'`).
