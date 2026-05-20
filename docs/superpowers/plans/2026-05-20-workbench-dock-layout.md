# Workbench Dock Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a workbench with three resizable docks: left sidebar (exists), right secondary sidebar (new), bottom dock (new). Move query results into the bottom dock. Add a context-aware Inspector. Migrate the AI chat panel to be the first plugin tenant of the secondary sidebar.

**Architecture:** Region state (visible flag + active panel id) lives in `useUiStore`. Persisted sizes live in `appearance.*` settings. Plugins target a region via `PanelContribution.location ∈ {sidebar, secondary, bottom}`. Inspector subscribes to a new `useSelectionStore` populated by AG Grid row clicks and ER node clicks.

**Tech Stack:** Electron + React 19, Zustand, electron-vite, Vitest (jsdom + Playwright). Path aliases `@/` → `src/renderer/src/`, `@shared` → `shared/`.

**Spec:** `docs/superpowers/specs/2026-05-20-workbench-dock-layout-design.md`

---

## Conventions

- **Commits:** one per task, prefix `feat(workbench):`, `test(workbench):`, or `refactor(workbench):`.
- **Tests:** Vitest. Unit tests under `tests/unit/stores/` use the pattern in `tests/unit/stores/ui.test.ts:1` — `beforeEach` resets store via `useXxxStore.setState({...})`.
- **Run a single file:** `pnpm test -- --run tests/unit/stores/ui.test.ts`
- **Type-check + build:** `pnpm build`
- **Run app:** `pnpm dev`

---

## Task 1: Add new appearance settings

**Files:**
- Modify: `shared/settings.ts:16-27` (AppearanceSettings), `shared/settings.ts:107-116` (defaults)

- [ ] **Step 1: Extend `AppearanceSettings` interface**

Edit `shared/settings.ts` — append four fields after `animations: boolean` (line 26):

```ts
export interface AppearanceSettings {
  theme: Theme
  uiDensity: 'compact' | 'comfortable' | 'spacious'
  sidebarPosition: 'left' | 'right'
  accentColor: string
  sidebarWidth: number
  splitRatio: number
  showStatusBar: boolean
  animations: boolean
  /** Show the secondary (right) sidebar. Persisted across sessions. */
  showSecondarySidebar: boolean
  /** Width of the secondary (right) sidebar in pixels. Clamped 220..640. */
  secondarySidebarWidth: number
  /** Show the bottom dock. Persisted across sessions. */
  showBottomDock: boolean
  /** Height of the bottom dock in pixels. Clamped 120..640. */
  bottomDockHeight: number
}
```

- [ ] **Step 2: Add defaults**

In the same file, extend `defaultSettings.appearance` (line 107):

```ts
  appearance: {
    theme: 'dark',
    uiDensity: 'comfortable',
    sidebarPosition: 'left',
    accentColor: '#7c6ff7',
    sidebarWidth: 240,
    splitRatio: 50,
    showStatusBar: true,
    animations: true,
    showSecondarySidebar: false,
    secondarySidebarWidth: 320,
    showBottomDock: true,
    bottomDockHeight: 240,
  },
```

- [ ] **Step 3: Verify type-check passes**

Run: `pnpm build`
Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add shared/settings.ts
git commit -m "feat(workbench): add secondary sidebar + bottom dock settings"
```

---

## Task 2: Extend `useUiStore` — secondary sidebar state

**Files:**
- Modify: `src/renderer/src/stores/ui.ts`
- Test: `tests/unit/stores/ui.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `tests/unit/stores/ui.test.ts` (before the final closing `})`):

```ts
  // ── secondary sidebar ────────────────────────────────────────────────────

  it('secondarySidebarVisible defaults to false', () => {
    useUiStore.setState({ secondarySidebarVisible: false, secondaryActivePanel: 'inspector' })
    expect(useUiStore.getState().secondarySidebarVisible).toBe(false)
  })

  it('toggleSecondarySidebar flips visibility', () => {
    useUiStore.setState({ secondarySidebarVisible: false, secondaryActivePanel: 'inspector' })
    useUiStore.getState().toggleSecondarySidebar()
    expect(useUiStore.getState().secondarySidebarVisible).toBe(true)
    useUiStore.getState().toggleSecondarySidebar()
    expect(useUiStore.getState().secondarySidebarVisible).toBe(false)
  })

  it('setSecondaryActivePanel shows sidebar when selecting a new panel', () => {
    useUiStore.setState({ secondarySidebarVisible: false, secondaryActivePanel: 'inspector' })
    useUiStore.getState().setSecondaryActivePanel('plugin:ai-chat-panel')
    expect(useUiStore.getState().secondaryActivePanel).toBe('plugin:ai-chat-panel')
    expect(useUiStore.getState().secondarySidebarVisible).toBe(true)
  })

  it('setSecondaryActivePanel hides sidebar when clicking the active panel again', () => {
    useUiStore.setState({ secondarySidebarVisible: true, secondaryActivePanel: 'inspector' })
    useUiStore.getState().setSecondaryActivePanel('inspector')
    expect(useUiStore.getState().secondarySidebarVisible).toBe(false)
  })
```

- [ ] **Step 2: Run tests — expect failure**

Run: `pnpm test -- --run tests/unit/stores/ui.test.ts`
Expected: 4 failing tests (`secondarySidebarVisible`, `toggleSecondarySidebar`, `setSecondaryActivePanel` x2) — undefined properties/actions.

- [ ] **Step 3: Implement in `ui.ts`**

Edit `src/renderer/src/stores/ui.ts`. Extend `UiState` interface (after line 23, before closing brace):

```ts
  // Secondary sidebar (right)
  secondarySidebarVisible: boolean
  secondaryActivePanel: SecondaryPanelId
  setSecondaryActivePanel: (panel: SecondaryPanelId) => void
  toggleSecondarySidebar: () => void
  setSecondarySidebarWidth: (width: number) => void
```

Above the `UiState` interface, add:

```ts
export type SecondaryPanelId = 'inspector' | (string & {})
```

Extend the `create<UiState>` initializer with these properties (after `collapseAllTreeNodes`):

```ts
  secondarySidebarVisible: false,
  secondaryActivePanel: 'inspector',
  setSecondaryActivePanel: (panel) =>
    set((state) => ({
      secondaryActivePanel: panel,
      secondarySidebarVisible:
        state.secondaryActivePanel === panel ? !state.secondarySidebarVisible : true,
    })),
  toggleSecondarySidebar: () =>
    set((state) => ({ secondarySidebarVisible: !state.secondarySidebarVisible })),
  setSecondarySidebarWidth: (width) => {
    const clamped = Math.min(640, Math.max(220, width))
    useSettingsStore.getState().set('appearance.secondarySidebarWidth', clamped)
  },
```

- [ ] **Step 4: Run tests — expect pass**

Run: `pnpm test -- --run tests/unit/stores/ui.test.ts`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/stores/ui.ts tests/unit/stores/ui.test.ts
git commit -m "feat(workbench): add secondary sidebar state to ui store"
```

---

## Task 3: Extend `useUiStore` — bottom dock state

**Files:**
- Modify: `src/renderer/src/stores/ui.ts`
- Test: `tests/unit/stores/ui.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `tests/unit/stores/ui.test.ts`:

```ts
  // ── bottom dock ──────────────────────────────────────────────────────────

  it('bottomDockVisible defaults to true', () => {
    useUiStore.setState({ bottomDockVisible: true, bottomDockActivePanel: 'results' })
    expect(useUiStore.getState().bottomDockVisible).toBe(true)
  })

  it('toggleBottomDock flips visibility', () => {
    useUiStore.setState({ bottomDockVisible: true, bottomDockActivePanel: 'results' })
    useUiStore.getState().toggleBottomDock()
    expect(useUiStore.getState().bottomDockVisible).toBe(false)
    useUiStore.getState().toggleBottomDock()
    expect(useUiStore.getState().bottomDockVisible).toBe(true)
  })

  it('setBottomDockActivePanel shows dock when selecting a new panel', () => {
    useUiStore.setState({ bottomDockVisible: false, bottomDockActivePanel: 'results' })
    useUiStore.getState().setBottomDockActivePanel('plugin:query-history')
    expect(useUiStore.getState().bottomDockActivePanel).toBe('plugin:query-history')
    expect(useUiStore.getState().bottomDockVisible).toBe(true)
  })

  it('setBottomDockActivePanel hides dock when clicking the active panel again', () => {
    useUiStore.setState({ bottomDockVisible: true, bottomDockActivePanel: 'results' })
    useUiStore.getState().setBottomDockActivePanel('results')
    expect(useUiStore.getState().bottomDockVisible).toBe(false)
  })
```

- [ ] **Step 2: Run — expect failure**

Run: `pnpm test -- --run tests/unit/stores/ui.test.ts`
Expected: 4 failing tests.

- [ ] **Step 3: Implement**

Add to `UiState`:

```ts
  // Bottom dock
  bottomDockVisible: boolean
  bottomDockActivePanel: BottomPanelId
  setBottomDockActivePanel: (panel: BottomPanelId) => void
  toggleBottomDock: () => void
  setBottomDockHeight: (height: number) => void
```

Above the interface, add:

```ts
export type BottomPanelId = 'results' | (string & {})
```

Add to the store initializer:

```ts
  bottomDockVisible: true,
  bottomDockActivePanel: 'results',
  setBottomDockActivePanel: (panel) =>
    set((state) => ({
      bottomDockActivePanel: panel,
      bottomDockVisible:
        state.bottomDockActivePanel === panel ? !state.bottomDockVisible : true,
    })),
  toggleBottomDock: () =>
    set((state) => ({ bottomDockVisible: !state.bottomDockVisible })),
  setBottomDockHeight: (height) => {
    const clamped = Math.min(640, Math.max(120, height))
    useSettingsStore.getState().set('appearance.bottomDockHeight', clamped)
  },
```

- [ ] **Step 4: Run — expect pass**

Run: `pnpm test -- --run tests/unit/stores/ui.test.ts`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/stores/ui.ts tests/unit/stores/ui.test.ts
git commit -m "feat(workbench): add bottom dock state to ui store"
```

---

## Task 4: Selection store

**Files:**
- Create: `src/renderer/src/stores/selection.ts`
- Create: `tests/unit/stores/selection.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/unit/stores/selection.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useSelectionStore } from '../../../src/renderer/src/stores/selection'

describe('useSelectionStore', () => {
  beforeEach(() => {
    useSelectionStore.setState({ selection: null })
  })

  it('selection defaults to null', () => {
    expect(useSelectionStore.getState().selection).toBeNull()
  })

  it('setSelection stores a row selection', () => {
    useSelectionStore.getState().setSelection({
      kind: 'row',
      tabId: 'tab-1',
      row: { id: 42, name: 'Alice' },
      columns: [
        { name: 'id', dataType: 'int' },
        { name: 'name', dataType: 'text' },
      ],
    })
    const s = useSelectionStore.getState().selection
    expect(s?.kind).toBe('row')
    if (s?.kind === 'row') {
      expect(s.row.id).toBe(42)
      expect(s.columns).toHaveLength(2)
    }
  })

  it('setSelection(null) clears selection', () => {
    useSelectionStore.setState({
      selection: { kind: 'erNode', connectionId: 'c1', table: 'users' },
    })
    useSelectionStore.getState().setSelection(null)
    expect(useSelectionStore.getState().selection).toBeNull()
  })

  it('clearForTab clears row selection belonging to that tab', () => {
    useSelectionStore.setState({
      selection: { kind: 'row', tabId: 'tab-1', row: {}, columns: [] },
    })
    useSelectionStore.getState().clearForTab('tab-1')
    expect(useSelectionStore.getState().selection).toBeNull()
  })

  it('clearForTab leaves selection alone if tabId does not match', () => {
    useSelectionStore.setState({
      selection: { kind: 'row', tabId: 'tab-1', row: {}, columns: [] },
    })
    useSelectionStore.getState().clearForTab('tab-2')
    expect(useSelectionStore.getState().selection).not.toBeNull()
  })

  it('clearForTab leaves non-row selections alone', () => {
    useSelectionStore.setState({
      selection: { kind: 'erNode', connectionId: 'c1', table: 'users' },
    })
    useSelectionStore.getState().clearForTab('tab-1')
    expect(useSelectionStore.getState().selection).not.toBeNull()
  })
})
```

- [ ] **Step 2: Run — expect failure**

Run: `pnpm test -- --run tests/unit/stores/selection.test.ts`
Expected: module not found / `useSelectionStore` undefined.

- [ ] **Step 3: Implement**

Create `src/renderer/src/stores/selection.ts`:

```ts
import { create } from 'zustand'

export interface ColumnMeta {
  name: string
  dataType: string
  nullable?: boolean
  isPrimaryKey?: boolean
  isForeignKey?: boolean
}

export type Selection =
  | { kind: 'row'; tabId: string; row: Record<string, unknown>; columns: ColumnMeta[] }
  | { kind: 'table'; connectionId: string; schema?: string; table: string }
  | { kind: 'erNode'; connectionId: string; schema?: string; table: string }
  | null

interface SelectionState {
  selection: Selection
  setSelection: (s: Selection) => void
  clearForTab: (tabId: string) => void
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selection: null,
  setSelection: (selection) => set({ selection }),
  clearForTab: (tabId) =>
    set((state) => {
      if (state.selection?.kind === 'row' && state.selection.tabId === tabId) {
        return { selection: null }
      }
      return {}
    }),
}))
```

- [ ] **Step 4: Run — expect pass**

Run: `pnpm test -- --run tests/unit/stores/selection.test.ts`
Expected: 6 passing tests.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/stores/selection.ts tests/unit/stores/selection.test.ts
git commit -m "feat(workbench): add selection store for inspector"
```

---

## Task 5: Extend `PanelContribution.location` with `'secondary'`

**Files:**
- Modify: `src/main/plugins/sdk/types.ts:116`
- Modify: `src/main/plugins/types.ts:76`

- [ ] **Step 1: Edit SDK type**

In `src/main/plugins/sdk/types.ts:113-118`, change:

```ts
export interface PanelContribution {
  title: string
  icon: string
  location: 'sidebar' | 'secondary' | 'bottom'
  render(): string
}
```

- [ ] **Step 2: Edit plugin manifest type**

In `src/main/plugins/types.ts:76`, change `location: 'sidebar' | 'bottom'` → `location: 'sidebar' | 'secondary' | 'bottom'`.

- [ ] **Step 3: Verify type-check passes**

Run: `pnpm build`
Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/main/plugins/sdk/types.ts src/main/plugins/types.ts
git commit -m "feat(workbench): extend PanelContribution.location with 'secondary'"
```

---

## Task 6: Build `<BottomDock>` shell

**Files:**
- Create: `src/renderer/src/components/shell/BottomDock.tsx`
- Create: `src/renderer/src/components/shell/BottomDockTabs.tsx`

- [ ] **Step 1: Create the tab strip**

Create `src/renderer/src/components/shell/BottomDockTabs.tsx`:

```tsx
import { Flex, cn } from '@/primitives'

export interface BottomTab {
  id: string
  title: string
}

interface Props {
  tabs: BottomTab[]
  activeId: string
  onSelect: (id: string) => void
  onClose: () => void
}

export function BottomDockTabs({ tabs, activeId, onSelect, onClose }: Props) {
  return (
    <Flex align="center" className="h-8 border-b border-border bg-bg-secondary px-1 shrink-0">
      {tabs.map(t => (
        <button
          key={t.id}
          type="button"
          onClick={() => onSelect(t.id)}
          className={cn(
            'h-7 px-3 text-xs rounded-sm transition-colors',
            activeId === t.id
              ? 'bg-bg-primary text-text-primary'
              : 'text-text-muted hover:text-text-primary hover:bg-white/5'
          )}
        >
          {t.title}
        </button>
      ))}
      <div className="flex-1" />
      <button
        type="button"
        aria-label="Hide bottom dock"
        onClick={onClose}
        className="h-7 w-7 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-sm"
      >
        ×
      </button>
    </Flex>
  )
}
```

- [ ] **Step 2: Create the dock**

Create `src/renderer/src/components/shell/BottomDock.tsx`:

```tsx
import { useEffect } from 'react'
import { Flex, Box, Text } from '@/primitives'
import { useUiStore, type BottomPanelId } from '@/stores/ui'
import { useTabsStore } from '@/stores/tabs'
import { usePluginUIStore, selectContributions } from '@/stores/plugin-ui'
import { ResultsPanel } from '@/components/results/ResultsPanel'
import { PluginPanelMount } from '@/components/plugins/PluginPanelMount'
import { BottomDockTabs, type BottomTab } from './BottomDockTabs'
import type { QueryTab } from '@shared/types'

export function BottomDock() {
  const activeTab = useTabsStore(s => s.tabs.find(t => t.id === s.activeTabId))
  const bottomActivePanel = useUiStore(s => s.bottomDockActivePanel)
  const setBottomActivePanel = useUiStore(s => s.setBottomDockActivePanel)
  const toggleBottomDock = useUiStore(s => s.toggleBottomDock)
  const panelContributions = usePluginUIStore(selectContributions('panels'))
  const fetchContributions = usePluginUIStore(s => s.fetchContributions)

  useEffect(() => { fetchContributions('panels') }, [fetchContributions])

  const showResults = activeTab?.type === 'query'

  const bottomPluginPanels: BottomTab[] = panelContributions
    .filter(c => c.meta.location === 'bottom')
    .map(c => ({ id: `plugin:${c.contributionId}`, title: c.meta.title as string }))

  const tabs: BottomTab[] = [
    ...(showResults ? [{ id: 'results' as const, title: 'Results' }] : []),
    ...bottomPluginPanels,
  ]

  // Fallback: if active panel is no longer available, switch to the first or hide.
  useEffect(() => {
    if (tabs.length === 0) return
    if (!tabs.find(t => t.id === bottomActivePanel)) {
      setBottomActivePanel(tabs[0].id as BottomPanelId)
    }
  }, [tabs, bottomActivePanel, setBottomActivePanel])

  if (tabs.length === 0) {
    return (
      <Flex align="center" justify="center" className="h-full bg-bg-primary">
        <Text color="muted" size="sm">No bottom panels for this tab</Text>
      </Flex>
    )
  }

  return (
    <Flex direction="column" className="h-full bg-bg-primary overflow-hidden">
      <BottomDockTabs
        tabs={tabs}
        activeId={bottomActivePanel}
        onSelect={(id) => setBottomActivePanel(id as BottomPanelId)}
        onClose={toggleBottomDock}
      />
      <Box className="flex-1 overflow-hidden">
        {bottomActivePanel === 'results' && showResults && activeTab && (() => {
          const t = activeTab as QueryTab
          if (t.results) {
            return <ResultsPanel results={t.results} sql={t.sql} tabId={t.id} aiExplanation={t.aiExplanation} />
          }
          if (t.error) {
            return (
              <Flex align="center" justify="center" className="h-full p-4">
                <Text color="error" size="sm" className="font-mono whitespace-pre-wrap">{t.error}</Text>
              </Flex>
            )
          }
          return (
            <Flex align="center" justify="center" className="h-full">
              <Text color="muted" size="sm">Run a query to see results</Text>
            </Flex>
          )
        })()}
        {bottomActivePanel.startsWith('plugin:') && (
          <PluginPanelMount surface="panels" componentId={bottomActivePanel.slice('plugin:'.length)} />
        )}
      </Box>
    </Flex>
  )
}
```

Note: `c.meta.location` access comes from the `UIContribution` shape — confirm the field exists by inspecting `src/renderer/src/stores/plugin-ui.ts` and `@shared/plugin-ui-types`. If `meta` doesn't carry `location`, fetch contributions filtered by location server-side instead — see Task 9 step 1 fallback.

- [ ] **Step 3: Verify type-check**

Run: `pnpm build`
Expected: no errors. If `c.meta.location` errors, see fallback in Task 9.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/shell/BottomDock.tsx src/renderer/src/components/shell/BottomDockTabs.tsx
git commit -m "feat(workbench): add BottomDock shell with tab strip"
```

---

## Task 7: Slim `QueryPanel` — remove inline Results

**Files:**
- Modify: `src/renderer/src/components/query/QueryPanel.tsx:158-172`

- [ ] **Step 1: Read current file**

The current file ends with:

```tsx
      {/* Results — bottom half */}
      <Flex direction="column" className="flex-1 min-h-25">
        {tab.results ? (
          <ResultsPanel results={tab.results} sql={tab.sql} tabId={tab.id} aiExplanation={tab.aiExplanation} />
        ) : tab.error ? (
          <Flex align="center" justify="center" className="flex-1 p-4">
            <Alert variant="error" title="Query Error" className="max-w-lg">
              <Text size="xs" color="secondary" as="p" className="font-mono whitespace-pre-wrap">{tab.error}</Text>
            </Alert>
          </Flex>
        ) : (
          <Flex align="center" justify="center" className="flex-1">
            ...
          </Flex>
        )}
      </Flex>
```

- [ ] **Step 2: Delete the Results block**

Delete the entire `{/* Results — bottom half */}` block (lines 158 to the matching `</Flex>`). Also remove now-unused imports: `ResultsPanel`, `Alert` (verify they're not used elsewhere in the file first via grep within file).

The editor block at line 147 should change from `className="flex-1 min-h-30 border-b border-border"` to `className="flex-1 min-h-30"` (no border-b — the bottom dock handles its own border).

- [ ] **Step 3: Verify type-check + tests**

Run: `pnpm build && pnpm test`
Expected: clean build, all existing tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/query/QueryPanel.tsx
git commit -m "refactor(workbench): remove inline results from QueryPanel"
```

---

## Task 8: Wire BottomDock into App layout

**Files:**
- Modify: `src/renderer/src/App.tsx`

- [ ] **Step 1: Add imports**

After existing imports in `App.tsx`, add:

```tsx
import { BottomDock } from '@/components/shell/BottomDock'
```

- [ ] **Step 2: Read settings + ui state**

After the existing `useSettingsStore` reads (around line 33), add:

```tsx
  const bottomDockHeight = useSettingsStore(s => s.settings.appearance.bottomDockHeight)
  const showBottomDock = useSettingsStore(s => s.settings.appearance.showBottomDock)
  const bottomDockVisible = useUiStore(s => s.bottomDockVisible)
  const setBottomDockHeight = useUiStore(s => s.setBottomDockHeight)
```

After the `useEffect` that wires keyboard shortcuts (around line 77), add:

```tsx
  // Initialize bottomDockVisible from persisted setting on mount
  useEffect(() => {
    useUiStore.setState({ bottomDockVisible: showBottomDock })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [prevBottomDockHeight, setPrevBottomDockHeight] = useState(bottomDockHeight)
  const handleBottomResize = (delta: number) => {
    // Dragging the handle DOWN increases delta; we want UP-drag to grow the dock.
    const current = useSettingsStore.getState().settings.appearance.bottomDockHeight
    setBottomDockHeight(current - delta)
  }
  const handleBottomResizeDoubleClick = () => {
    const current = useSettingsStore.getState().settings.appearance.bottomDockHeight
    if (current > 120) {
      setPrevBottomDockHeight(current)
      setBottomDockHeight(120)
    } else {
      setBottomDockHeight(prevBottomDockHeight > 120 ? prevBottomDockHeight : 240)
    }
  }
```

- [ ] **Step 3: Restructure the editor column**

In the JSX, the current editor `<Flex direction="column" className="flex-1 overflow-hidden">` (line 113) holds `<TabBar />` + a `<Box>` containing the active tab body. Wrap the tab body and the new bottom dock in a vertical layout.

Replace lines 113-153 (the editor column) with:

```tsx
        <Flex direction="column" className="flex-1 overflow-hidden">
          <TabBar />
          <Flex direction="column" className="flex-1 overflow-hidden">
            <Box className="flex-1 overflow-hidden">
              <SectionErrorBoundary label={activeTab?.title ?? 'Tab'} resetKey={activeTabId}>
                {/* keep existing tab-type switch verbatim */}
                {activeTab?.type === 'query' && (
                  <QueryPanel tab={activeTab as QueryTab} />
                )}
                {activeTab?.type === 'er-diagram' && (
                  <ERDiagram
                    connectionId={(activeTab as ErDiagramTab).connectionId}
                    schema={(activeTab as ErDiagramTab).schema}
                  />
                )}
                {activeTab?.type === 'connection-form' && (
                  <ConnectionFormView
                    tabId={activeTab.id}
                    editingId={(activeTab as ConnectionFormTab).editingId}
                  />
                )}
                {activeTab?.type === 'plugin-detail' && (
                  <PluginDetailView
                    pluginName={(activeTab as PluginDetailTab).pluginName}
                  />
                )}
                {activeTab?.type === 'install-plugin' && (
                  <InstallPluginTab />
                )}
                {activeTab?.type === 'settings' && (
                  <SettingsLayout />
                )}
              </SectionErrorBoundary>
              {!activeTab && (
                <Flex align="center" justify="center" className="flex-1 bg-bg-tertiary h-full">
                  <Box className="text-center">
                    <Heading level={1} className="text-2xl mb-2">dbstudio</Heading>
                    <Text color="secondary" as="p">Connect to a database to get started</Text>
                    <Text color="muted" size="sm" as="p" className="mt-1">Cmd+Shift+P to open command palette</Text>
                  </Box>
                </Flex>
              )}
            </Box>
            {bottomDockVisible && (
              <>
                <ResizeHandle
                  direction="vertical"
                  onResize={handleBottomResize}
                  onDoubleClick={handleBottomResizeDoubleClick}
                />
                <Box style={{ height: bottomDockHeight }} className="shrink-0">
                  <SectionErrorBoundary label="Bottom dock">
                    <BottomDock />
                  </SectionErrorBoundary>
                </Box>
              </>
            )}
          </Flex>
        </Flex>
```

- [ ] **Step 4: Smoke test**

Run: `pnpm dev`

Verify:
- Run a query — results appear in the bottom dock.
- Switch between two query tabs — results swap.
- Drag the resize handle — dock changes height; refresh, height persists.
- Click the × in the dock tab strip — dock hides.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/App.tsx
git commit -m "feat(workbench): mount BottomDock into App layout"
```

---

## Task 9: Build `<SecondarySidebar>` shell

**Files:**
- Create: `src/renderer/src/components/shell/SecondarySidebar.tsx`

- [ ] **Step 1: Verify `c.meta.location` access**

In `src/renderer/src/stores/plugin-ui.ts` and `@shared/plugin-ui-types`, confirm `UIContribution.meta` exposes the panel's `location` field. If `meta` is typed as `Record<string, unknown>`, the access works but needs a cast. If `meta.location` is unavailable at all, add a new IPC channel `plugins:ui:get-contributions-by-location` and use it instead. For v1, assume `meta.location: string` is accessible and add the cast where needed.

- [ ] **Step 2: Create the component**

Create `src/renderer/src/components/shell/SecondarySidebar.tsx`:

```tsx
import { useEffect } from 'react'
import { Flex, Box, Text } from '@/primitives'
import { useUiStore } from '@/stores/ui'
import { usePluginUIStore, selectContributions } from '@/stores/plugin-ui'
import { InspectorPanel } from '@/components/inspector/InspectorPanel'
import { PluginPanelMount } from '@/components/plugins/PluginPanelMount'

export function SecondarySidebar() {
  const active = useUiStore(s => s.secondaryActivePanel)
  const contributions = usePluginUIStore(selectContributions('panels'))
  const fetchContributions = usePluginUIStore(s => s.fetchContributions)

  useEffect(() => { fetchContributions('panels') }, [fetchContributions])

  if (active === 'inspector') {
    return (
      <Flex direction="column" className="h-full bg-bg-secondary border-l border-border overflow-hidden">
        <PanelHeader title="Inspector" />
        <Box className="flex-1 overflow-auto">
          <InspectorPanel />
        </Box>
      </Flex>
    )
  }

  if (active.startsWith('plugin:')) {
    const componentId = active.slice('plugin:'.length)
    const contribution = contributions.find(c => c.contributionId === componentId)
    return (
      <Flex direction="column" className="h-full bg-bg-secondary border-l border-border overflow-hidden">
        <PanelHeader title={(contribution?.meta?.title as string) ?? componentId} />
        <Box className="flex-1 overflow-hidden">
          <PluginPanelMount surface="panels" componentId={componentId} />
        </Box>
      </Flex>
    )
  }

  return (
    <Flex align="center" justify="center" className="h-full bg-bg-secondary border-l border-border">
      <Text color="muted" size="sm">No panel selected</Text>
    </Flex>
  )
}

function PanelHeader({ title }: { title: string }) {
  return (
    <Flex align="center" className="h-8 px-3 border-b border-border shrink-0">
      <Text size="xs" weight="semibold" className="uppercase tracking-wider">{title}</Text>
    </Flex>
  )
}
```

- [ ] **Step 3: Verify type-check**

Run: `pnpm build`
Expected: no errors (Inspector import will fail until Task 10 — temporarily stub it or do Task 10 first).

If `InspectorPanel` not yet present, create a stub at `src/renderer/src/components/inspector/InspectorPanel.tsx`:

```tsx
import { Box, Text } from '@/primitives'
export function InspectorPanel() {
  return <Box className="p-4"><Text color="muted">Inspector</Text></Box>
}
```

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/shell/SecondarySidebar.tsx src/renderer/src/components/inspector/InspectorPanel.tsx
git commit -m "feat(workbench): add SecondarySidebar shell with inspector stub"
```

---

## Task 10: Build `<SecondaryActivityBar>`

**Files:**
- Create: `src/renderer/src/components/shell/SecondaryActivityBar.tsx`

- [ ] **Step 1: Implement**

Create `src/renderer/src/components/shell/SecondaryActivityBar.tsx`:

```tsx
import { useEffect } from 'react'
import { ListTree, Puzzle } from 'lucide-react'
import { useUiStore } from '@/stores/ui'
import { usePluginUIStore, selectContributions } from '@/stores/plugin-ui'
import { Stack, Tooltip, IconButton, cn } from '@/primitives'

export function SecondaryActivityBar() {
  const active = useUiStore(s => s.secondaryActivePanel)
  const visible = useUiStore(s => s.secondarySidebarVisible)
  const setActive = useUiStore(s => s.setSecondaryActivePanel)
  const panelContributions = usePluginUIStore(selectContributions('panels'))
  const fetchContributions = usePluginUIStore(s => s.fetchContributions)

  useEffect(() => { fetchContributions('panels') }, [fetchContributions])

  const secondaryPlugins = panelContributions.filter(c => c.meta.location === 'secondary')

  const renderButton = (id: string, Icon: typeof ListTree, label: string) => {
    const isActive = active === id && visible
    return (
      <Tooltip key={id} content={label} side="left">
        <IconButton
          label={label}
          size="lg"
          variant="ghost"
          onClick={() => setActive(id)}
          className={cn(
            'rounded-lg transition-colors',
            isActive
              ? 'bg-accent/10 text-accent hover:bg-accent/10'
              : 'text-text-muted hover:text-text-primary hover:bg-white/5'
          )}
        >
          <Icon size={20} />
        </IconButton>
      </Tooltip>
    )
  }

  return (
    <Stack
      align="center"
      gap="xs"
      className="w-12 bg-bg-primary border-l border-border shrink-0 pt-2"
    >
      {renderButton('inspector', ListTree, 'Inspector')}
      {secondaryPlugins.map(c =>
        renderButton(`plugin:${c.contributionId}`, Puzzle, c.meta.title as string)
      )}
    </Stack>
  )
}
```

- [ ] **Step 2: Verify type-check**

Run: `pnpm build`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/shell/SecondaryActivityBar.tsx
git commit -m "feat(workbench): add right activity bar"
```

---

## Task 11: Build the Inspector

**Files:**
- Modify: `src/renderer/src/components/inspector/InspectorPanel.tsx` (replace stub)

- [ ] **Step 1: Implement context-aware Inspector**

Replace the stub at `src/renderer/src/components/inspector/InspectorPanel.tsx`:

```tsx
import { useSelectionStore } from '@/stores/selection'
import { useTabsStore } from '@/stores/tabs'
import { useSchemaStore } from '@/stores/schema'
import { Box, Flex, Stack, Text } from '@/primitives'
import type { QueryTab } from '@shared/types'

export function InspectorPanel() {
  const selection = useSelectionStore(s => s.selection)
  const activeTab = useTabsStore(s => s.tabs.find(t => t.id === s.activeTabId))

  // Row selection in a query tab
  if (selection?.kind === 'row') {
    return (
      <Stack direction="column" gap="none" className="p-3">
        {Object.entries(selection.row).map(([key, value]) => {
          const col = selection.columns.find(c => c.name === key)
          return (
            <Box key={key} className="py-2 border-b border-border last:border-b-0">
              <Flex align="baseline" gap="sm">
                <Text size="xs" weight="semibold" className="font-mono">{key}</Text>
                {col?.dataType && <Text size="xs" color="muted">{col.dataType}</Text>}
              </Flex>
              <Text size="sm" className="font-mono break-words whitespace-pre-wrap">
                {value === null ? 'NULL' : typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </Text>
            </Box>
          )
        })}
      </Stack>
    )
  }

  // ER node selection
  if (selection?.kind === 'erNode') {
    return <TableSummary connectionId={selection.connectionId} schema={selection.schema} table={selection.table} />
  }

  // No selection but on a query tab — show last-query stats
  if (activeTab?.type === 'query') {
    const t = activeTab as QueryTab
    return (
      <Stack direction="column" gap="sm" className="p-3">
        {t.results ? (
          <>
            <Stat label="Rows" value={String(t.results.rows.length)} />
            {t.results.durationMs !== undefined && (
              <Stat label="Duration" value={`${t.results.durationMs} ms`} />
            )}
            <Stat label="Status" value="OK" />
          </>
        ) : t.error ? (
          <Box>
            <Text size="xs" color="muted">Error</Text>
            <Text size="sm" className="font-mono whitespace-pre-wrap">{t.error}</Text>
          </Box>
        ) : (
          <Text size="sm" color="muted">Run a query to see stats. Click a row to inspect it.</Text>
        )}
      </Stack>
    )
  }

  return (
    <Flex align="center" justify="center" className="h-full p-4">
      <Text color="muted" size="sm">Nothing to inspect for this tab.</Text>
    </Flex>
  )
}

function TableSummary({ connectionId, schema, table }: { connectionId: string; schema?: string; table: string }) {
  const tables = useSchemaStore(s => s.tables[`${connectionId}:${schema ?? ''}`] ?? [])
  const t = tables.find(x => x.name === table)
  if (!t) return (
    <Flex align="center" justify="center" className="h-full p-4">
      <Text color="muted" size="sm">No metadata cached for {table}. Open the schema tree to refresh.</Text>
    </Flex>
  )
  return (
    <Stack direction="column" gap="sm" className="p-3">
      <Text size="sm" weight="semibold" className="font-mono">{t.name}</Text>
      <Box>
        <Text size="xs" color="muted" className="mb-1">Columns</Text>
        {t.columns?.map(c => (
          <Flex key={c.name} align="baseline" gap="sm" className="py-1 border-b border-border last:border-b-0">
            <Text size="xs" weight="semibold" className="font-mono">{c.name}</Text>
            <Text size="xs" color="muted">{c.dataType}</Text>
            {c.isPrimaryKey && <Text size="xs" color="accent">PK</Text>}
            {c.isForeignKey && <Text size="xs" color="accent">FK</Text>}
          </Flex>
        ))}
      </Box>
    </Stack>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Flex justify="between" align="baseline">
      <Text size="xs" color="muted">{label}</Text>
      <Text size="sm" className="font-mono">{value}</Text>
    </Flex>
  )
}
```

Note: This assumes `useSchemaStore` exposes `tables[<connectionId>:<schema>] -> SchemaTable[]`. Inspect `src/renderer/src/stores/schema.ts` before relying on this; if the keying or field name differs (e.g. `s.tablesByConnection`), adapt the call to match. Likewise verify `t.results.durationMs` exists on `QueryResult` in `shared/types`; if not, use `t.results.elapsedMs` or whatever the field is named, or drop the duration row.

- [ ] **Step 2: Verify type-check**

Run: `pnpm build`
Expected: clean. If schema-store accessors fail, adjust the `useSchemaStore` selector.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/inspector/InspectorPanel.tsx
git commit -m "feat(workbench): add context-aware Inspector"
```

---

## Task 12: Wire SecondarySidebar + SecondaryActivityBar into App

**Files:**
- Modify: `src/renderer/src/App.tsx`

- [ ] **Step 1: Add imports**

```tsx
import { SecondarySidebar } from '@/components/shell/SecondarySidebar'
import { SecondaryActivityBar } from '@/components/shell/SecondaryActivityBar'
```

- [ ] **Step 2: Read settings + state**

After existing reads:

```tsx
  const secondarySidebarWidth = useSettingsStore(s => s.settings.appearance.secondarySidebarWidth)
  const showSecondarySidebar = useSettingsStore(s => s.settings.appearance.showSecondarySidebar)
  const secondarySidebarVisible = useUiStore(s => s.secondarySidebarVisible)
  const setSecondarySidebarWidth = useUiStore(s => s.setSecondarySidebarWidth)
```

Add a one-shot initializer:

```tsx
  useEffect(() => {
    useUiStore.setState({ secondarySidebarVisible: showSecondarySidebar })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
```

Add resize handlers:

```tsx
  const [prevSecondaryWidth, setPrevSecondaryWidth] = useState(secondarySidebarWidth)
  const handleSecondaryResize = (delta: number) => {
    const current = useSettingsStore.getState().settings.appearance.secondarySidebarWidth
    // Handle sits to the LEFT of the sidebar — dragging LEFT (negative delta) grows it.
    setSecondarySidebarWidth(current - delta)
  }
  const handleSecondaryResizeDoubleClick = () => {
    const current = useSettingsStore.getState().settings.appearance.secondarySidebarWidth
    if (current > 220) {
      setPrevSecondaryWidth(current)
      setSecondarySidebarWidth(220)
    } else {
      setSecondarySidebarWidth(prevSecondaryWidth > 220 ? prevSecondaryWidth : 320)
    }
  }
```

- [ ] **Step 3: Remove the hard-mounted AI panel mount**

Delete the block at `App.tsx:169-171`:

```tsx
        <SectionErrorBoundary label="AI Assistant">
          <PluginPanelMount surface="panels" componentId="ai-chat-panel" />
        </SectionErrorBoundary>
```

Remove the now-unused `PluginPanelMount` import if no other usage in the file.

- [ ] **Step 4: Mount the new components**

In place of the deleted block (just before `</Flex>` of the workbench row), insert:

```tsx
        {secondarySidebarVisible && (
          <>
            <ResizeHandle
              direction="horizontal"
              onResize={handleSecondaryResize}
              onDoubleClick={handleSecondaryResizeDoubleClick}
            />
            <Flex direction="column" style={{ width: secondarySidebarWidth }} className="shrink-0 overflow-hidden">
              <SectionErrorBoundary label="Secondary sidebar">
                <SecondarySidebar />
              </SectionErrorBoundary>
            </Flex>
          </>
        )}
        <SecondaryActivityBar />
```

- [ ] **Step 5: Smoke test**

Run: `pnpm dev`

Verify:
- Right activity bar appears with an Inspector icon.
- Clicking Inspector opens the right sidebar; clicking again hides it.
- Resize handle drags correctly (LEFT grows, RIGHT shrinks).

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/App.tsx
git commit -m "feat(workbench): mount SecondarySidebar + SecondaryActivityBar"
```

---

## Task 13: Wire selection producers (AG Grid + ER)

**Files:**
- Modify: `src/renderer/src/components/results/ResultsGrid.tsx`
- Modify: `src/renderer/src/components/results/ResultsPanel.tsx` (pass tabId down)
- Modify: `src/renderer/src/components/er/ERDiagram.tsx`

- [ ] **Step 1: Plumb `tabId` into ResultsGrid**

Edit `src/renderer/src/components/results/ResultsPanel.tsx`. Pass `tabId` to `ResultsGrid`:

```tsx
<ResultsGrid results={results} tabId={tabId} />
```

- [ ] **Step 2: Hook AG Grid row clicks**

Edit `src/renderer/src/components/results/ResultsGrid.tsx`. Update the props interface to accept `tabId?: string`. Import the selection store at top:

```tsx
import { useSelectionStore } from '@/stores/selection'
```

Add to the `AgGridReact` props (around line 83):

```tsx
        onRowClicked={(e) => {
          if (!tabId || !e.data) return
          const columns = results.fields.map((f) => ({
            name: f.name,
            dataType: (f as { dataType?: string }).dataType ?? 'unknown',
          }))
          useSelectionStore.getState().setSelection({
            kind: 'row',
            tabId,
            row: e.data as Record<string, unknown>,
            columns,
          })
        }}
```

Adjust field-access name (`dataType` vs `type`) to match the actual `QueryResult.fields` shape in `shared/types`. Verify before assuming.

- [ ] **Step 3: Hook ER node clicks**

Edit `src/renderer/src/components/er/ERDiagram.tsx`. Find the existing node-click handler (search for `onNodeClick` or `onClick` on a node). Add a `useSelectionStore.getState().setSelection({ kind: 'erNode', connectionId, schema, table: node.id })` call.

If no node-click handler exists yet, attach one to the `<ReactFlow>` element:

```tsx
onNodeClick={(_, node) => {
  useSelectionStore.getState().setSelection({
    kind: 'erNode',
    connectionId,
    schema,
    table: node.id,
  })
}}
```

- [ ] **Step 4: Clear selection on tab close**

Edit `src/renderer/src/stores/tabs.ts`. In the `closeTab` action (find it via `closeTab:`), after removing the tab, call:

```ts
import { useSelectionStore } from './selection'
// ...
useSelectionStore.getState().clearForTab(tabId)
```

- [ ] **Step 5: Smoke test**

Run: `pnpm dev`

Verify:
- Open Inspector. Run a query. Click a row → Inspector shows row contents with column types.
- Click another row → Inspector updates.
- Close the query tab → Inspector goes back to "Nothing to inspect" or empty state.
- Open ER diagram, click a node → Inspector shows table summary.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/components/results/ResultsGrid.tsx src/renderer/src/components/results/ResultsPanel.tsx src/renderer/src/components/er/ERDiagram.tsx src/renderer/src/stores/tabs.ts
git commit -m "feat(workbench): wire selection producers for inspector"
```

---

## Task 14: Migrate AI chat panel to secondary location

**Files:**
- Modify: `src/main/plugins/bundled/ai/index.ts:27`
- Modify: `src/renderer/src/stores/ai.ts:64` (togglePanel)

- [ ] **Step 1: Change manifest location**

In `src/main/plugins/bundled/ai/index.ts:26-28`:

```ts
    panels: [
      { id: 'ai-chat', title: 'AI Assistant', icon: 'sparkles', location: 'secondary' }
    ],
```

- [ ] **Step 2: Replace `togglePanel`**

Edit `src/renderer/src/stores/ai.ts`. Replace the `togglePanel` implementation (around line 64):

```ts
import { useUiStore } from './ui'
// ...
  togglePanel: () => {
    const ui = useUiStore.getState()
    const target = 'plugin:ai-chat-panel'
    const isActive = ui.secondaryActivePanel === target && ui.secondarySidebarVisible
    if (isActive) {
      ui.toggleSecondarySidebar()
    } else {
      ui.setSecondaryActivePanel(target)
    }
    set({ panelOpen: !isActive })
  },
  openPanel: () => {
    useUiStore.getState().setSecondaryActivePanel('plugin:ai-chat-panel')
    set({ panelOpen: true })
  },
```

Note: `panelOpen` becomes a *mirror* of secondary sidebar state for the AI panel — other code reading `aiPanelOpen` continues to work but its source of truth is now `useUiStore`. In a follow-up we'd remove `panelOpen` entirely; for v1 keep the mirror for compatibility.

- [ ] **Step 3: Update ActivityBar reading of aiPanelOpen**

Edit `src/renderer/src/components/shell/ActivityBar.tsx:23`. Replace with a derived value:

```tsx
  const aiPanelOpen = useUiStore(
    s => s.secondarySidebarVisible && s.secondaryActivePanel === 'plugin:ai-chat-panel'
  )
```

Remove the `useAIStore(s => s.panelOpen)` line.

- [ ] **Step 4: Smoke test**

Run: `pnpm dev`

Verify:
- Sparkles button in the left activity bar toggles the AI chat in the right sidebar.
- Pressing Sparkles when AI panel is already active in the right sidebar hides the sidebar.
- Pressing Sparkles after switching to Inspector → switches active panel back to AI chat AND keeps the sidebar visible.
- AI chat icon also appears in the right activity bar (from the panel contribution).

- [ ] **Step 5: Commit**

```bash
git add src/main/plugins/bundled/ai/index.ts src/renderer/src/stores/ai.ts src/renderer/src/components/shell/ActivityBar.tsx
git commit -m "feat(workbench): migrate AI panel to secondary sidebar"
```

---

## Task 15: Keyboard shortcuts

**Files:**
- Modify: `src/renderer/src/App.tsx` (handleKeyDown)
- Modify: `shared/settings.ts` (keybindings defaults)

- [ ] **Step 1: Add keybinding defaults**

Append to `defaultSettings.keybindings` array in `shared/settings.ts`:

```ts
    { id: 'toggle-secondary-sidebar', label: 'Toggle Secondary Sidebar', keys: ['Ctrl+Alt+B', 'Cmd+Alt+B'], category: 'Panels' },
    { id: 'toggle-bottom-dock', label: 'Toggle Bottom Dock', keys: ['Ctrl+J', 'Cmd+J'], category: 'Panels' },
```

- [ ] **Step 2: Wire shortcuts**

In `src/renderer/src/App.tsx`, extend the `handleKeyDown` in the existing `useEffect`:

```tsx
      if (mod && e.altKey && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        useUiStore.getState().toggleSecondarySidebar()
      }
      if (mod && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'j') {
        e.preventDefault()
        useUiStore.getState().toggleBottomDock()
      }
```

Place these after the existing `mod + shift + t` block.

- [ ] **Step 3: Smoke test**

Run: `pnpm dev`

Verify:
- `Cmd+Alt+B` toggles right sidebar.
- `Cmd+J` toggles bottom dock.
- Existing `Cmd+B` still toggles left sidebar (or whatever the current binding does).

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/App.tsx shared/settings.ts
git commit -m "feat(workbench): add keyboard shortcuts for secondary sidebar and bottom dock"
```

---

## Task 16: Command palette entries

**Files:**
- Modify: `src/renderer/src/components/command-palette/CommandPalette.tsx`

- [ ] **Step 1: Add static commands**

In `CommandPalette.tsx`, find the `commands` `useMemo` block (line 33). Import additional store helpers:

```tsx
import { usePluginUIStore, selectContributions } from '@/stores/plugin-ui'
```

Inside the component, before the `useMemo`:

```tsx
  const toggleSecondary = useUiStore(s => s.toggleSecondarySidebar)
  const toggleBottom = useUiStore(s => s.toggleBottomDock)
  const setSecondaryActive = useUiStore(s => s.setSecondaryActivePanel)
  const panelContribs = usePluginUIStore(selectContributions('panels'))
```

Extend the `cmds` array:

```tsx
      { id: 'toggle-secondary-sidebar', title: 'View: Toggle Secondary Sidebar', category: 'View', keybinding: 'Cmd+Alt+B', action: toggleSecondary },
      { id: 'toggle-bottom-dock', title: 'View: Toggle Bottom Dock', category: 'View', keybinding: 'Cmd+J', action: toggleBottom },
      { id: 'show-inspector', title: 'View: Show Inspector', category: 'View', action: () => setSecondaryActive('inspector') },
```

Then auto-add plugin panel commands:

```tsx
    for (const c of panelContribs) {
      if (c.meta.location === 'secondary') {
        cmds.push({
          id: `show-secondary-${c.contributionId}`,
          title: `View: Show ${c.meta.title}`,
          category: 'View',
          action: () => setSecondaryActive(`plugin:${c.contributionId}`),
        })
      }
    }
```

Add `panelContribs` to the `useMemo` deps.

- [ ] **Step 2: Smoke test**

Run: `pnpm dev`

Verify:
- `Cmd+Shift+P` → "View: Toggle Secondary Sidebar", "View: Toggle Bottom Dock", "View: Show Inspector", and "View: Show AI Assistant" all appear and work.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/command-palette/CommandPalette.tsx
git commit -m "feat(workbench): add command palette entries for new docks"
```

---

## Task 17: Appearance settings UI

**Files:**
- Modify: `src/renderer/src/components/settings/categories/AppearanceSettings.tsx`

- [ ] **Step 1: Add controls for the four new settings**

In `AppearanceSettings.tsx`, find the existing sidebar-related controls (around line 86) and add:

```tsx
        <Toggle
          label="Show secondary sidebar by default"
          checked={appearance.showSecondarySidebar}
          onChange={(v) => setSetting('appearance.showSecondarySidebar', v)}
        />
        <NumberInput
          label="Secondary sidebar width (px)"
          min={220} max={640} step={10}
          value={appearance.secondarySidebarWidth}
          onChange={(v) => setSetting('appearance.secondarySidebarWidth', v)}
        />
        <Toggle
          label="Show bottom dock by default"
          checked={appearance.showBottomDock}
          onChange={(v) => setSetting('appearance.showBottomDock', v)}
        />
        <NumberInput
          label="Bottom dock height (px)"
          min={120} max={640} step={10}
          value={appearance.bottomDockHeight}
          onChange={(v) => setSetting('appearance.bottomDockHeight', v)}
        />
```

Use whatever `Toggle` / `NumberInput` import the existing controls in this file use — match the surrounding style.

- [ ] **Step 2: Smoke test**

Run: `pnpm dev`

Open Settings → Appearance. Toggle the four new controls. Restart the app and confirm persistence.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/settings/categories/AppearanceSettings.tsx
git commit -m "feat(workbench): add appearance settings for new docks"
```

---

## Task 18: Storybook coverage

**Files:**
- Create: `src/renderer/src/components/inspector/InspectorPanel.stories.tsx`
- Create: `src/renderer/src/components/shell/BottomDock.stories.tsx`
- Create: `src/renderer/src/components/shell/SecondarySidebar.stories.tsx`

- [ ] **Step 1: Inspector stories**

Create stories for each `Selection` kind. Use the project's existing story style as reference (check `src/renderer/src/components/shell/Sidebar.stories.tsx` if present, otherwise check any `*.stories.tsx`).

Pre-populate the selection store via a decorator that calls `useSelectionStore.setState(...)` before render. Stories: `RowSelection`, `ErNodeSelection`, `NoSelectionEmpty`, `NoSelectionWithQueryStats`.

- [ ] **Step 2: BottomDock stories**

Stories: `WithResults`, `WithNoActiveTab`, `WithPluginPanel`. Use `useTabsStore.setState(...)` in decorators to set up fixtures.

- [ ] **Step 3: SecondarySidebar stories**

Stories: `InspectorActive`, `PluginPanelActive`.

- [ ] **Step 4: Run story tests**

Use the storybook MCP `run-story-tests` if available — otherwise:

Run: `pnpm test -- --run` (runs both unit and storybook projects)
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/inspector/InspectorPanel.stories.tsx src/renderer/src/components/shell/BottomDock.stories.tsx src/renderer/src/components/shell/SecondarySidebar.stories.tsx
git commit -m "test(workbench): storybook coverage for new dock components"
```

---

## Task 19: Final verification

- [ ] **Step 1: Full test suite**

Run: `pnpm test`
Expected: all unit + storybook tests pass.

- [ ] **Step 2: Build**

Run: `pnpm build`
Expected: clean build.

- [ ] **Step 3: Manual smoke walkthrough**

Run: `pnpm dev`. Walk through every item in the spec's Testing section:

- Run query → results in bottom dock; switching query tabs swaps results.
- Click row → Inspector updates; click again → updates.
- ER node click → Inspector shows table summary.
- Sparkles toggles AI chat in right sidebar.
- Disable AI plugin (Extensions tab) → AI icon disappears from right activity bar.
- `Cmd+Alt+B` / `Cmd+J` / `Cmd+Shift+P` → "View: …" all work.
- Drag all three resize handles → sizes persist after restart.
- Double-click each handle → snaps to min then restores prev size.

- [ ] **Step 4: Final commit / tag (no code changes)**

If anything was tweaked during smoke testing, commit it. Otherwise no commit needed.

---

## Self-review summary

- **Spec coverage:** Tasks 1-3 cover settings + ui state. Task 4 covers selection store. Task 5 covers SDK extension. Tasks 6-8 cover bottom dock. Tasks 9-12 cover secondary sidebar + inspector + activity bar. Task 13 wires selection. Task 14 migrates AI panel. Tasks 15-16 cover invocation. Task 17 covers settings UI. Task 18 covers tests. Task 19 verifies.
- **Risk hotspots:**
  - `UIContribution.meta.location` access (Tasks 6, 10, 16) — confirm shape; fallback is server-side filtering.
  - `useSchemaStore` keying (Task 11) — verify field names before relying on the format used.
  - `QueryResult.fields[].dataType` access (Task 13) — verify field name in `shared/types`.
- **Out-of-scope items deferred:** drag-to-reorder, drag-to-move-panel, stacked panels, per-tab dock memory, native-menu IPC wiring (could be Task 20 if needed; the current spec lists menu entries but no IPC channels exist yet, so it's safe to defer — palette + shortcuts cover the entry points users actually use).
