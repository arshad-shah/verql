# Declarative Plugin UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable plugins to declare UI contributions (toolbar controls, selectors, status indicators, panels, context menus) and have the host render them using built-in primitives.

**Architecture:** Manifest declares contribution slots (activityBar, statusBar, contextMenus, tabs, selectors). At activation, plugins register widget trees and dynamic resolvers via `ctx.ui`. The renderer fetches contributions over 4 generic IPC channels and renders them via a recursive `WidgetRenderer` component using host primitives. A Zustand store caches contributions and resolver results.

**Tech Stack:** TypeScript, Electron IPC, React 19, Zustand, existing primitives (Select, Button, IconButton)

---

### Task 1: Widget and UI Contribution Types

Define all shared types for the widget vocabulary, contribution surfaces, and IPC payloads.

**Files:**
- Create: `shared/plugin-ui-types.ts`
- Modify: `shared/ipc.ts:4-198` — add 4 new IPC channels

- [ ] **Step 1: Write the shared widget types**

Create `shared/plugin-ui-types.ts` with the full widget vocabulary:

```typescript
// shared/plugin-ui-types.ts

// ─── Widget Base ────────────────────────────────────────────────────────────

export interface WidgetBase {
  id: string
  type: string
  visible?: boolean
  tooltip?: string
}

// ─── Widget Types ───────────────────────────────────────────────────────────

export interface SelectorWidget extends WidgetBase {
  type: 'selector'
  label: string
  options?: { value: string; label: string }[]
  resolver?: string
  value?: string
  onChange: string
}

export interface ActionButtonWidget extends WidgetBase {
  type: 'action-button'
  label: string
  icon?: string
  command: string
  variant?: 'primary' | 'secondary' | 'ghost'
}

export interface StatusIndicatorWidget extends WidgetBase {
  type: 'status-indicator'
  label: string
  icon: string
  status?: 'ok' | 'warning' | 'error' | 'loading'
}

export interface TextWidget extends WidgetBase {
  type: 'text'
  content: string
  style?: 'label' | 'value' | 'muted'
}

export interface TreeWidget extends WidgetBase {
  type: 'tree'
  resolver: string
  onSelect?: string
}

export interface ListWidget extends WidgetBase {
  type: 'list'
  items?: { id: string; label: string; icon?: string; action?: string }[]
  resolver?: string
}

export interface SectionWidget extends WidgetBase {
  type: 'section'
  label: string
  collapsible?: boolean
  collapsed?: boolean
  children: Widget[]
}

export interface SeparatorWidget extends WidgetBase {
  type: 'separator'
}

export type Widget =
  | SelectorWidget
  | ActionButtonWidget
  | StatusIndicatorWidget
  | TextWidget
  | TreeWidget
  | ListWidget
  | SectionWidget
  | SeparatorWidget

// ─── Contribution Surfaces ──────────────────────────────────────────────────

export type StatusBarZone = 'left' | 'center' | 'right'
export type ActivityBarZone = 'top' | 'bottom'
export type ContextMenuTarget = 'table' | 'column' | 'connection' | 'tab'
export type SelectorZone = 'statusBar.left' | 'statusBar.right' | 'panel'

// ─── Manifest Contribution Types ────────────────────────────────────────────

export interface ActivityBarContribution {
  id: string
  title: string
  icon: string
  zone?: ActivityBarZone
}

export interface StatusBarContribution {
  id: string
  zone: StatusBarZone
}

export interface ContextMenuContribution {
  id: string
  target: ContextMenuTarget
  label: string
  command: string
}

export interface TabContribution {
  id: string
  title: string
  icon: string
}

export interface SelectorContribution {
  id: string
  label: string
  zone: SelectorZone
  resolver?: string
  options?: { value: string; label: string }[]
  onChange: string
}

// ─── IPC Payloads ───────────────────────────────────────────────────────────

export type ContributionSurface = 'activityBar' | 'statusBar' | 'contextMenu' | 'tabs' | 'panels'

export interface UIContribution {
  pluginId: string
  pluginName: string
  surface: ContributionSurface
  contributionId: string
  widgets: Widget[]
  meta: Record<string, unknown>
}

export interface ResolverContext {
  connectionId: string
}
```

- [ ] **Step 2: Add IPC channels to the channel map**

In `shared/ipc.ts`, add these 4 channels after the existing `plugins:middleware-fields` entry (line 161):

```typescript
  'plugins:ui:get-contributions': {
    args: [surface: string]
    return: import('./plugin-ui-types').UIContribution[]
  }
  'plugins:ui:resolve': {
    args: [pluginId: string, resolverId: string, context: import('./plugin-ui-types').ResolverContext]
    return: { value: string; label: string }[]
  }
  'plugins:ui:action': {
    args: [pluginId: string, commandId: string, payload: Record<string, unknown>]
    return: void
  }
  // Event channel — renderer listens via window.electronAPI.on()
  'plugins:ui:contributions-changed': {
    args: []
    return: void
  }
```

- [ ] **Step 3: Commit**

```bash
git add shared/plugin-ui-types.ts shared/ipc.ts
git commit -m "feat(plugin-ui): add widget types and IPC channels for declarative plugin UI"
```

---

### Task 2: UIRegistry Implementation (Main Process)

Create the `UIRegistry` class that plugins use to register widget trees and resolvers at activation time.

**Files:**
- Create: `src/main/plugins/sdk/ui-registry.ts`
- Create: `tests/unit/ui-registry.test.ts`

- [ ] **Step 1: Write failing tests for UIRegistry**

```typescript
// tests/unit/ui-registry.test.ts
import { describe, it, expect, vi } from 'vitest'
import { UIRegistryImpl } from '../../src/main/plugins/sdk/ui-registry'

describe('UIRegistryImpl', () => {
  it('registers and retrieves a panel widget tree', () => {
    const registry = new UIRegistryImpl()
    const widgets = [{ type: 'text' as const, id: 'hello', content: 'Hello' }]
    registry.registerPanel('my-panel', widgets)
    expect(registry.getPanel('my-panel')).toEqual(widgets)
  })

  it('registers and retrieves status bar widgets', () => {
    const registry = new UIRegistryImpl()
    const widgets = [{ type: 'status-indicator' as const, id: 'status', label: 'OK', icon: 'check' }]
    registry.registerStatusBar('my-status', widgets)
    expect(registry.getStatusBar('my-status')).toEqual(widgets)
  })

  it('registers and calls a resolver', async () => {
    const registry = new UIRegistryImpl()
    const resolver = vi.fn().mockResolvedValue([{ value: 'wh1', label: 'Warehouse 1' }])
    registry.registerResolver('warehouses', resolver)
    const result = await registry.resolve('warehouses', { connectionId: 'conn1' })
    expect(result).toEqual([{ value: 'wh1', label: 'Warehouse 1' }])
    expect(resolver).toHaveBeenCalledWith({ connectionId: 'conn1' })
  })

  it('invalidate emits a change event', () => {
    const registry = new UIRegistryImpl()
    const listener = vi.fn()
    registry.onChange(listener)
    registry.registerResolver('test', vi.fn())
    registry.invalidate('test')
    // onChange fires for registerResolver and invalidate
    expect(listener).toHaveBeenCalled()
  })

  it('dispose removes registered panel', () => {
    const registry = new UIRegistryImpl()
    const disposable = registry.registerPanel('temp', [{ type: 'text' as const, id: 't', content: 'x' }])
    expect(registry.getPanel('temp')).toBeDefined()
    disposable.dispose()
    expect(registry.getPanel('temp')).toBeUndefined()
  })

  it('clear removes all registrations', () => {
    const registry = new UIRegistryImpl()
    registry.registerPanel('p1', [])
    registry.registerStatusBar('s1', [])
    registry.registerResolver('r1', vi.fn())
    registry.clear()
    expect(registry.getPanel('p1')).toBeUndefined()
    expect(registry.getStatusBar('s1')).toBeUndefined()
  })

  it('registers and retrieves tab widget tree', () => {
    const registry = new UIRegistryImpl()
    const widgets = [{ type: 'text' as const, id: 'tab-content', content: 'Tab' }]
    registry.registerTab('my-tab', widgets)
    expect(registry.getTab('my-tab')).toEqual(widgets)
  })

  it('getAllContributions returns grouped contributions', () => {
    const registry = new UIRegistryImpl()
    registry.registerPanel('p1', [{ type: 'text' as const, id: 't', content: 'x' }])
    registry.registerStatusBar('s1', [{ type: 'status-indicator' as const, id: 's', label: 'OK', icon: 'check' }])
    const panels = registry.getAllPanels()
    const statusBars = registry.getAllStatusBars()
    expect(panels).toHaveLength(1)
    expect(statusBars).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test -- --run tests/unit/ui-registry.test.ts
```

Expected: FAIL — module `ui-registry` not found.

- [ ] **Step 3: Implement UIRegistry**

```typescript
// src/main/plugins/sdk/ui-registry.ts
import type { Widget, ResolverContext } from '@shared/plugin-ui-types'
import type { Disposable } from './types'

type ChangeListener = () => void
type ResolverFn = (context: ResolverContext) => Promise<{ value: string; label: string }[]>

export interface UIRegistry {
  registerPanel(id: string, widgets: Widget[]): Disposable
  registerStatusBar(id: string, widgets: Widget[]): Disposable
  registerTab(id: string, widgets: Widget[]): Disposable
  registerResolver(id: string, resolver: ResolverFn): Disposable
  invalidate(resolverId: string): void
}

export class UIRegistryImpl implements UIRegistry {
  private panels = new Map<string, Widget[]>()
  private statusBars = new Map<string, Widget[]>()
  private tabs = new Map<string, Widget[]>()
  private resolvers = new Map<string, ResolverFn>()
  private listeners = new Set<ChangeListener>()

  registerPanel(id: string, widgets: Widget[]): Disposable {
    this.panels.set(id, widgets)
    this.emit()
    return { dispose: () => { this.panels.delete(id); this.emit() } }
  }

  registerStatusBar(id: string, widgets: Widget[]): Disposable {
    this.statusBars.set(id, widgets)
    this.emit()
    return { dispose: () => { this.statusBars.delete(id); this.emit() } }
  }

  registerTab(id: string, widgets: Widget[]): Disposable {
    this.tabs.set(id, widgets)
    this.emit()
    return { dispose: () => { this.tabs.delete(id); this.emit() } }
  }

  registerResolver(id: string, resolver: ResolverFn): Disposable {
    this.resolvers.set(id, resolver)
    this.emit()
    return { dispose: () => { this.resolvers.delete(id); this.emit() } }
  }

  async resolve(resolverId: string, context: ResolverContext): Promise<{ value: string; label: string }[]> {
    const resolver = this.resolvers.get(resolverId)
    if (!resolver) throw new Error(`Resolver '${resolverId}' not found`)
    return resolver(context)
  }

  invalidate(_resolverId: string): void {
    this.emit()
  }

  getPanel(id: string): Widget[] | undefined { return this.panels.get(id) }
  getStatusBar(id: string): Widget[] | undefined { return this.statusBars.get(id) }
  getTab(id: string): Widget[] | undefined { return this.tabs.get(id) }
  getAllPanels(): { id: string; widgets: Widget[] }[] {
    return [...this.panels.entries()].map(([id, widgets]) => ({ id, widgets }))
  }
  getAllStatusBars(): { id: string; widgets: Widget[] }[] {
    return [...this.statusBars.entries()].map(([id, widgets]) => ({ id, widgets }))
  }
  getAllTabs(): { id: string; widgets: Widget[] }[] {
    return [...this.tabs.entries()].map(([id, widgets]) => ({ id, widgets }))
  }
  hasResolver(id: string): boolean { return this.resolvers.has(id) }

  onChange(listener: ChangeListener): Disposable {
    this.listeners.add(listener)
    return { dispose: () => { this.listeners.delete(listener) } }
  }

  clear(): void {
    this.panels.clear()
    this.statusBars.clear()
    this.tabs.clear()
    this.resolvers.clear()
    this.emit()
  }

  private emit(): void {
    for (const listener of this.listeners) listener()
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test -- --run tests/unit/ui-registry.test.ts
```

Expected: All 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/plugins/sdk/ui-registry.ts tests/unit/ui-registry.test.ts
git commit -m "feat(plugin-ui): implement UIRegistry for widget tree and resolver registration"
```

---

### Task 3: Wire UIRegistry into Plugin SDK

Integrate the UIRegistry into the plugin context so plugins can access `ctx.ui`.

**Files:**
- Modify: `src/main/plugins/sdk/types.ts:31-40` — add `ui` to PluginContext
- Modify: `src/main/plugins/sdk/index.ts:19-77` — add uiRegistry to ContextDeps and create scoped `ui` wrapper
- Modify: `src/main/plugins/plugin-host.ts:93-112` — add uiRegistry to BootDeps
- Modify: `src/main/ipc-handlers.ts:467-483` — create uiRegistry and pass to coordinator

- [ ] **Step 1: Add UIRegistry to PluginContext type**

In `src/main/plugins/sdk/types.ts`, add the import and the `ui` field to `PluginContext`:

After line 2, add:
```typescript
import type { UIRegistry } from './ui-registry'
```

In the `PluginContext` interface (lines 31-40), add `ui: UIRegistry` after `panels`:
```typescript
export interface PluginContext {
  drivers: DriverRegistry
  commands: CommandRegistry
  panels: PanelRegistry
  ui: UIRegistry
  schema: SchemaAccess
  connections: ConnectionAccess
  settings: PluginSettings
  keyring: KeyringAccess
  subscriptions: Disposable[]
}
```

- [ ] **Step 2: Wire UIRegistry into createPluginContext**

In `src/main/plugins/sdk/index.ts`, add the import:
```typescript
import { UIRegistryImpl } from './ui-registry'
```

Add to the `export` list:
```typescript
export { UIRegistryImpl } from './ui-registry'
```

Add `uiRegistry: UIRegistryImpl` to the `ContextDeps` interface (after `panelRegistry`).

In `createPluginContext`, add a scoped `ui` wrapper that auto-tracks disposables, following the same pattern as the existing `drivers`, `commands`, and `panels` wrappers:

```typescript
const ui = {
  registerPanel(id: string, widgets: Parameters<UIRegistryImpl['registerPanel']>[1]) {
    const disposable = deps.uiRegistry.registerPanel(id, widgets)
    subscriptions.push(disposable)
    return disposable
  },
  registerStatusBar(id: string, widgets: Parameters<UIRegistryImpl['registerStatusBar']>[1]) {
    const disposable = deps.uiRegistry.registerStatusBar(id, widgets)
    subscriptions.push(disposable)
    return disposable
  },
  registerTab(id: string, widgets: Parameters<UIRegistryImpl['registerTab']>[1]) {
    const disposable = deps.uiRegistry.registerTab(id, widgets)
    subscriptions.push(disposable)
    return disposable
  },
  registerResolver(id: string, resolver: Parameters<UIRegistryImpl['registerResolver']>[1]) {
    const disposable = deps.uiRegistry.registerResolver(id, resolver)
    subscriptions.push(disposable)
    return disposable
  },
  invalidate(resolverId: string) {
    deps.uiRegistry.invalidate(resolverId)
  }
}
```

Add `ui` to the returned context object.

- [ ] **Step 3: Add uiRegistry to BootDeps**

In `src/main/plugins/plugin-host.ts`, add the import:
```typescript
import type { UIRegistryImpl } from './sdk/ui-registry'
```

Add `uiRegistry: UIRegistryImpl` to the `BootDeps` interface (line 97, after `panelRegistry`).

Pass `uiRegistry` through to `createPluginContext` in `activatePlugin` (line 254):
```typescript
const context = createPluginContext({
  pluginName: plugin.manifest.name,
  driverRegistry: this.deps.driverRegistry,
  commandRegistry: this.deps.commandRegistry,
  panelRegistry: this.deps.panelRegistry,
  uiRegistry: this.deps.uiRegistry,
  schemaAccess: new SchemaAccessImpl(this.deps.getAdapter),
  connectionAccess: new ConnectionAccessImpl(this.deps.getAdapter, this.deps.getProfile),
  settingsStore: this.deps.settingsStore,
  keyring: this.deps.keyring
})
```

- [ ] **Step 4: Create UIRegistry instance in ipc-handlers and wire IPC channels**

In `src/main/ipc-handlers.ts`, add the import:
```typescript
import { UIRegistryImpl } from './plugins/sdk/ui-registry'
```

Create the registry instance near the existing registry instances (around line 467):
```typescript
const uiRegistry = new UIRegistryImpl()
```

Add `uiRegistry` to the `PluginBootCoordinator` constructor call.

Add the 4 new IPC handlers after the existing plugin handlers:

```typescript
// ─── Plugin UI ──────────────────────────────────────────────────────────────

handle('plugins:ui:get-contributions', async (surface) => {
  const contributions: import('@shared/plugin-ui-types').UIContribution[] = []

  for (const plugin of pluginCoordinator.getLoadedPlugins()) {
    if (plugin.status.state !== 'active' && plugin.status.state !== 'degraded') continue
    const pluginId = plugin.manifest.name

    if (surface === 'statusBar') {
      for (const entry of uiRegistry.getAllStatusBars()) {
        if (entry.id.startsWith(pluginId) || entry.id === pluginId + '-status') {
          contributions.push({
            pluginId,
            pluginName: plugin.manifest.displayName,
            surface: 'statusBar',
            contributionId: entry.id,
            widgets: entry.widgets,
            meta: {}
          })
        }
      }
    }

    if (surface === 'panels') {
      for (const entry of uiRegistry.getAllPanels()) {
        contributions.push({
          pluginId,
          pluginName: plugin.manifest.displayName,
          surface: 'panels',
          contributionId: entry.id,
          widgets: entry.widgets,
          meta: {}
        })
      }
    }

    if (surface === 'tabs') {
      for (const entry of uiRegistry.getAllTabs()) {
        contributions.push({
          pluginId,
          pluginName: plugin.manifest.displayName,
          surface: 'tabs',
          contributionId: entry.id,
          widgets: entry.widgets,
          meta: {}
        })
      }
    }

    if (surface === 'contextMenu') {
      const menus = plugin.manifest.contributes.contextMenus
      if (menus) {
        for (const menu of menus) {
          contributions.push({
            pluginId,
            pluginName: plugin.manifest.displayName,
            surface: 'contextMenu',
            contributionId: menu.id,
            widgets: [],
            meta: { target: menu.target, label: menu.label, command: menu.command }
          })
        }
      }
    }

    if (surface === 'activityBar') {
      const bars = plugin.manifest.contributes.activityBar
      if (bars) {
        for (const bar of bars) {
          contributions.push({
            pluginId,
            pluginName: plugin.manifest.displayName,
            surface: 'activityBar',
            contributionId: bar.id,
            widgets: [],
            meta: { title: bar.title, icon: bar.icon, zone: bar.zone ?? 'top' }
          })
        }
      }
    }
  }

  return contributions
})

handle('plugins:ui:resolve', async (pluginId, resolverId, context) => {
  return pluginCoordinator.safeCallWithBudget(pluginId, () =>
    uiRegistry.resolve(resolverId, context)
  )
})

handle('plugins:ui:action', async (pluginId, commandId, payload) => {
  await pluginCoordinator.safeCallWithBudget(pluginId, () =>
    commandRegistry.execute(commandId)
  )
})

// Forward UIRegistry changes to renderer
uiRegistry.onChange(() => {
  const win = BrowserWindow.getAllWindows()[0]
  if (win) win.webContents.send('plugins:ui:contributions-changed')
})
```

- [ ] **Step 5: Add new manifest contribution types**

In `src/main/plugins/types.ts`, add the new contribution types to the manifest. After the existing imports:

```typescript
import type { ActivityBarContribution, StatusBarContribution, ContextMenuContribution, TabContribution, SelectorContribution } from '@shared/plugin-ui-types'
```

Add the new fields to the `contributes` property in `PluginManifest` (after `settings`):

```typescript
    activityBar?: ActivityBarContribution[]
    statusBar?: StatusBarContribution[]
    contextMenus?: ContextMenuContribution[]
    tabs?: TabContribution[]
    selectors?: SelectorContribution[]
```

- [ ] **Step 6: Run existing tests to verify nothing breaks**

```bash
pnpm test -- --run
```

Expected: All existing tests pass, plus the UIRegistry tests from Task 2.

- [ ] **Step 7: Commit**

```bash
git add src/main/plugins/sdk/types.ts src/main/plugins/sdk/index.ts src/main/plugins/plugin-host.ts src/main/ipc-handlers.ts src/main/plugins/types.ts
git commit -m "feat(plugin-ui): wire UIRegistry into plugin SDK and IPC handlers"
```

---

### Task 4: Plugin UI Zustand Store (Renderer)

Create the renderer-side store that caches UI contributions and resolver results.

**Files:**
- Create: `src/renderer/src/stores/plugin-ui.ts`
- Create: `tests/unit/plugin-ui-store.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/unit/plugin-ui-store.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock electronAPI before importing the store
const mockInvoke = vi.fn()
const mockOn = vi.fn()
vi.mock('@/lib/electron-api', () => ({
  electronAPI: { invoke: mockInvoke, on: mockOn }
}))

describe('usePluginUIStore', () => {
  beforeEach(() => {
    vi.resetModules()
    mockInvoke.mockReset()
    mockOn.mockReset()
  })

  it('fetchContributions calls IPC and stores result', async () => {
    const contributions = [
      { pluginId: 'snowflake', pluginName: 'Snowflake', surface: 'statusBar', contributionId: 'sf-status', widgets: [], meta: {} }
    ]
    mockInvoke.mockResolvedValue(contributions)

    const { usePluginUIStore } = await import('../../src/renderer/src/stores/plugin-ui')
    await usePluginUIStore.getState().fetchContributions('statusBar')
    expect(mockInvoke).toHaveBeenCalledWith('plugins:ui:get-contributions', 'statusBar')
    expect(usePluginUIStore.getState().contributions.statusBar).toEqual(contributions)
  })

  it('resolveOptions calls IPC and caches result', async () => {
    const options = [{ value: 'wh1', label: 'Warehouse 1' }]
    mockInvoke.mockResolvedValue(options)

    const { usePluginUIStore } = await import('../../src/renderer/src/stores/plugin-ui')
    const result = await usePluginUIStore.getState().resolveOptions('snowflake', 'warehouses', 'conn1')
    expect(mockInvoke).toHaveBeenCalledWith('plugins:ui:resolve', 'snowflake', 'warehouses', { connectionId: 'conn1' })
    expect(result).toEqual(options)
    // Cached
    expect(usePluginUIStore.getState().resolverCache['warehouses:conn1']).toEqual(options)
  })

  it('executeAction calls IPC', async () => {
    mockInvoke.mockResolvedValue(undefined)

    const { usePluginUIStore } = await import('../../src/renderer/src/stores/plugin-ui')
    await usePluginUIStore.getState().executeAction('snowflake', 'snowflake:use-warehouse', { value: 'WH1' })
    expect(mockInvoke).toHaveBeenCalledWith('plugins:ui:action', 'snowflake', 'snowflake:use-warehouse', { value: 'WH1' })
  })

  it('invalidateResolver clears cached entry', async () => {
    mockInvoke.mockResolvedValue([{ value: 'a', label: 'A' }])

    const { usePluginUIStore } = await import('../../src/renderer/src/stores/plugin-ui')
    await usePluginUIStore.getState().resolveOptions('snowflake', 'warehouses', 'conn1')
    expect(usePluginUIStore.getState().resolverCache['warehouses:conn1']).toBeDefined()
    usePluginUIStore.getState().invalidateResolver('warehouses', 'conn1')
    expect(usePluginUIStore.getState().resolverCache['warehouses:conn1']).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test -- --run tests/unit/plugin-ui-store.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the store**

```typescript
// src/renderer/src/stores/plugin-ui.ts
import { create } from 'zustand'
import type { UIContribution, ContributionSurface } from '@shared/plugin-ui-types'

interface ResolverCache {
  [key: string]: { value: string; label: string }[] | undefined
}

interface PluginUIState {
  contributions: Record<string, UIContribution[]>
  resolverCache: ResolverCache
  fetchContributions: (surface: ContributionSurface) => Promise<void>
  resolveOptions: (pluginId: string, resolverId: string, connectionId: string) => Promise<{ value: string; label: string }[]>
  executeAction: (pluginId: string, commandId: string, payload: Record<string, unknown>) => Promise<void>
  invalidateResolver: (resolverId: string, connectionId: string) => void
  invalidateAll: () => void
}

export const usePluginUIStore = create<PluginUIState>((set, get) => ({
  contributions: {},
  resolverCache: {},

  fetchContributions: async (surface) => {
    const result = await window.electronAPI.invoke('plugins:ui:get-contributions', surface)
    set((state) => ({
      contributions: { ...state.contributions, [surface]: result }
    }))
  },

  resolveOptions: async (pluginId, resolverId, connectionId) => {
    const cacheKey = `${resolverId}:${connectionId}`
    const cached = get().resolverCache[cacheKey]
    if (cached) return cached

    const result = await window.electronAPI.invoke('plugins:ui:resolve', pluginId, resolverId, { connectionId })
    set((state) => ({
      resolverCache: { ...state.resolverCache, [cacheKey]: result }
    }))
    return result
  },

  executeAction: async (pluginId, commandId, payload) => {
    await window.electronAPI.invoke('plugins:ui:action', pluginId, commandId, payload)
  },

  invalidateResolver: (resolverId, connectionId) => {
    const cacheKey = `${resolverId}:${connectionId}`
    set((state) => {
      const next = { ...state.resolverCache }
      delete next[cacheKey]
      return { resolverCache: next }
    })
  },

  invalidateAll: () => {
    set({ resolverCache: {}, contributions: {} })
  },
}))

// Listen for contribution changes from main process
if (typeof window !== 'undefined' && window.electronAPI) {
  window.electronAPI.on('plugins:ui:contributions-changed', () => {
    const store = usePluginUIStore.getState()
    store.invalidateAll()
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test -- --run tests/unit/plugin-ui-store.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/stores/plugin-ui.ts tests/unit/plugin-ui-store.test.ts
git commit -m "feat(plugin-ui): add Zustand store for plugin UI contributions and resolver caching"
```

---

### Task 5: WidgetRenderer Component

Build the recursive React component that maps widget types to host primitives.

**Files:**
- Create: `src/renderer/src/components/plugin-ui/WidgetRenderer.tsx`
- Create: `src/renderer/src/components/plugin-ui/widgets/SelectorWidget.tsx`
- Create: `src/renderer/src/components/plugin-ui/widgets/ActionButtonWidget.tsx`
- Create: `src/renderer/src/components/plugin-ui/widgets/StatusIndicatorWidget.tsx`
- Create: `src/renderer/src/components/plugin-ui/widgets/TextWidget.tsx`
- Create: `src/renderer/src/components/plugin-ui/widgets/SectionWidget.tsx`

- [ ] **Step 1: Create the SelectorWidget renderer**

This is the most complex widget — it handles both static options and dynamic resolvers.

```typescript
// src/renderer/src/components/plugin-ui/widgets/SelectorWidget.tsx
import { useEffect, useState } from 'react'
import { Select } from '@/primitives'
import { usePluginUIStore } from '@/stores/plugin-ui'
import { useConnectionsStore } from '@/stores/connections'
import type { SelectorWidget as SelectorWidgetType } from '@shared/plugin-ui-types'

interface Props {
  widget: SelectorWidgetType
  pluginId: string
}

export function SelectorWidgetRenderer({ widget, pluginId }: Props) {
  const activeConnectionId = useConnectionsStore((s) => s.activeConnectionId)
  const { resolveOptions, executeAction } = usePluginUIStore()
  const [options, setOptions] = useState(widget.options ?? [])
  const [value, setValue] = useState(widget.value ?? '')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!widget.resolver || !activeConnectionId) return
    let cancelled = false
    setLoading(true)
    resolveOptions(pluginId, widget.resolver, activeConnectionId)
      .then((resolved) => {
        if (!cancelled) {
          setOptions(resolved)
          if (!value && resolved.length > 0) setValue(resolved[0].value)
        }
      })
      .catch(() => { /* resolver failed — keep existing options */ })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [widget.resolver, activeConnectionId, pluginId, resolveOptions])

  const handleChange = (newValue: string) => {
    setValue(newValue)
    executeAction(pluginId, widget.onChange, { value: newValue, connectionId: activeConnectionId ?? '' })
  }

  if (widget.visible === false) return null

  return (
    <Select
      label={widget.label}
      value={value}
      onChange={handleChange}
      options={options}
      size="xs"
      disabled={loading}
    />
  )
}
```

- [ ] **Step 2: Create ActionButtonWidget renderer**

```typescript
// src/renderer/src/components/plugin-ui/widgets/ActionButtonWidget.tsx
import { Button } from '@/primitives'
import { usePluginUIStore } from '@/stores/plugin-ui'
import type { ActionButtonWidget as ActionButtonWidgetType } from '@shared/plugin-ui-types'

interface Props {
  widget: ActionButtonWidgetType
  pluginId: string
}

export function ActionButtonWidgetRenderer({ widget, pluginId }: Props) {
  const executeAction = usePluginUIStore((s) => s.executeAction)

  if (widget.visible === false) return null

  return (
    <Button
      variant={widget.variant ?? 'ghost'}
      size="xs"
      onClick={() => executeAction(pluginId, widget.command, {})}
    >
      {widget.label}
    </Button>
  )
}
```

- [ ] **Step 3: Create StatusIndicatorWidget renderer**

```typescript
// src/renderer/src/components/plugin-ui/widgets/StatusIndicatorWidget.tsx
import { Flex, Text } from '@/primitives'
import { cn } from '@/primitives/utils/cn'
import type { StatusIndicatorWidget as StatusIndicatorWidgetType } from '@shared/plugin-ui-types'

interface Props {
  widget: StatusIndicatorWidgetType
}

const statusColors: Record<string, string> = {
  ok: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  loading: 'bg-accent animate-pulse',
}

export function StatusIndicatorWidgetRenderer({ widget }: Props) {
  if (widget.visible === false) return null

  return (
    <Flex align="center" gap="xs">
      <div className={cn('h-1.5 w-1.5 rounded-full', statusColors[widget.status ?? 'ok'])} />
      <Text size="xs" color="secondary" className="text-[10px]">
        {widget.label}
      </Text>
    </Flex>
  )
}
```

- [ ] **Step 4: Create TextWidget renderer**

```typescript
// src/renderer/src/components/plugin-ui/widgets/TextWidget.tsx
import { Text } from '@/primitives'
import type { TextWidget as TextWidgetType } from '@shared/plugin-ui-types'

interface Props {
  widget: TextWidgetType
}

const styleMap: Record<string, string> = {
  label: 'text-text-muted uppercase tracking-wider',
  value: 'text-text-primary',
  muted: 'text-text-disabled',
}

export function TextWidgetRenderer({ widget }: Props) {
  if (widget.visible === false) return null

  return (
    <Text size="xs" className={styleMap[widget.style ?? 'value']}>
      {widget.content}
    </Text>
  )
}
```

- [ ] **Step 5: Create SectionWidget renderer**

```typescript
// src/renderer/src/components/plugin-ui/widgets/SectionWidget.tsx
import { useState } from 'react'
import { Flex, Text } from '@/primitives'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/primitives/utils/cn'
import { WidgetRenderer } from '../WidgetRenderer'
import type { SectionWidget as SectionWidgetType } from '@shared/plugin-ui-types'

interface Props {
  widget: SectionWidgetType
  pluginId: string
}

export function SectionWidgetRenderer({ widget, pluginId }: Props) {
  const [collapsed, setCollapsed] = useState(widget.collapsed ?? false)
  const collapsible = widget.collapsible ?? true

  if (widget.visible === false) return null

  return (
    <div className="space-y-1">
      <Flex
        align="center"
        gap="xs"
        className={cn('px-2 py-1', collapsible && 'cursor-pointer')}
        onClick={() => collapsible && setCollapsed(!collapsed)}
      >
        {collapsible && (
          <ChevronRight
            size={12}
            className={cn('text-text-muted transition-transform', !collapsed && 'rotate-90')}
          />
        )}
        <Text size="xs" color="muted" className="uppercase tracking-wider">
          {widget.label}
        </Text>
      </Flex>
      {!collapsed && (
        <div className="space-y-1 pl-2">
          <WidgetRenderer widgets={widget.children} pluginId={pluginId} />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Create the main WidgetRenderer**

```typescript
// src/renderer/src/components/plugin-ui/WidgetRenderer.tsx
import type { Widget } from '@shared/plugin-ui-types'
import { SelectorWidgetRenderer } from './widgets/SelectorWidget'
import { ActionButtonWidgetRenderer } from './widgets/ActionButtonWidget'
import { StatusIndicatorWidgetRenderer } from './widgets/StatusIndicatorWidget'
import { TextWidgetRenderer } from './widgets/TextWidget'
import { SectionWidgetRenderer } from './widgets/SectionWidget'

interface Props {
  widgets: Widget[]
  pluginId: string
}

export function WidgetRenderer({ widgets, pluginId }: Props) {
  return (
    <>
      {widgets.map((widget) => {
        switch (widget.type) {
          case 'selector':
            return <SelectorWidgetRenderer key={widget.id} widget={widget} pluginId={pluginId} />
          case 'action-button':
            return <ActionButtonWidgetRenderer key={widget.id} widget={widget} pluginId={pluginId} />
          case 'status-indicator':
            return <StatusIndicatorWidgetRenderer key={widget.id} widget={widget} />
          case 'text':
            return <TextWidgetRenderer key={widget.id} widget={widget} />
          case 'section':
            return <SectionWidgetRenderer key={widget.id} widget={widget} pluginId={pluginId} />
          case 'separator':
            return <hr key={widget.id} className="border-border-default my-1" />
          default:
            return null
        }
      })}
    </>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/components/plugin-ui/
git commit -m "feat(plugin-ui): add WidgetRenderer and individual widget renderers"
```

---

### Task 6: Integrate Plugin UI into StatusBar

Wire the plugin UI store and WidgetRenderer into the existing StatusBar component so plugin-contributed widgets appear in the correct zones.

**Files:**
- Modify: `src/renderer/src/components/shell/StatusBar.tsx`

- [ ] **Step 1: Add plugin UI imports and fetch hook**

At the top of `StatusBar.tsx`, add:

```typescript
import { usePluginUIStore } from '@/stores/plugin-ui'
import { WidgetRenderer } from '@/components/plugin-ui/WidgetRenderer'
```

Inside the `StatusBar` component, add a hook to fetch status bar contributions:

```typescript
const statusBarContributions = usePluginUIStore((s) => s.contributions.statusBar ?? [])
const fetchContributions = usePluginUIStore((s) => s.fetchContributions)

useEffect(() => {
  fetchContributions('statusBar')
}, [fetchContributions])
```

- [ ] **Step 2: Render plugin widgets in the left zone**

After the connection count badge (line 138), before the closing `</Flex>` of the left zone, add:

```typescript
{/* Plugin-contributed status bar widgets (left zone) */}
{statusBarContributions
  .filter((c) => c.meta.zone === 'left' || !c.meta.zone)
  .map((c) => (
    <WidgetRenderer key={c.contributionId} widgets={c.widgets} pluginId={c.pluginId} />
  ))}
```

- [ ] **Step 3: Render plugin widgets in the right zone**

Before the plugin status indicator in the right zone (line 166), add:

```typescript
{/* Plugin-contributed status bar widgets (right zone) */}
{statusBarContributions
  .filter((c) => c.meta.zone === 'right')
  .map((c) => (
    <WidgetRenderer key={c.contributionId} widgets={c.widgets} pluginId={c.pluginId} />
  ))}
```

- [ ] **Step 4: Run the dev server and verify**

```bash
pnpm dev
```

Open the app. The status bar should render without errors. No plugin widgets will appear yet since no plugins register UI contributions — but the existing status bar should be unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/shell/StatusBar.tsx
git commit -m "feat(plugin-ui): integrate WidgetRenderer into StatusBar for plugin contributions"
```

---

### Task 7: Integrate Plugin UI into ActivityBar and Sidebar

Make the ActivityBar show plugin-contributed panel icons and the Sidebar render plugin panels.

**Files:**
- Modify: `src/renderer/src/stores/ui.ts:4` — extend ActivityPanel type
- Modify: `src/renderer/src/components/shell/ActivityBar.tsx`
- Modify: `src/renderer/src/components/shell/Sidebar.tsx`

- [ ] **Step 1: Extend ActivityPanel to support plugin panels**

In `src/renderer/src/stores/ui.ts`, change the `ActivityPanel` type to accept plugin panel IDs:

```typescript
export type ActivityPanel = 'explorer' | 'query' | 'charts' | 'extensions' | 'settings' | (string & {})
```

The `(string & {})` trick preserves autocomplete for the known literal types while allowing arbitrary plugin panel IDs.

- [ ] **Step 2: Add plugin icons to ActivityBar**

In `src/renderer/src/components/shell/ActivityBar.tsx`, add imports:

```typescript
import { useEffect } from 'react'
import { usePluginUIStore } from '@/stores/plugin-ui'
```

Inside the `ActivityBar` component, fetch activity bar contributions:

```typescript
const activityBarContributions = usePluginUIStore((s) => s.contributions.activityBar ?? [])
const fetchContributions = usePluginUIStore((s) => s.fetchContributions)

useEffect(() => {
  fetchContributions('activityBar')
}, [fetchContributions])
```

After the `topItems.map(...)` call (line 44), render plugin activity bar items:

```typescript
{activityBarContributions
  .filter((c) => c.meta.zone === 'top' || !c.meta.zone)
  .map((c) => renderButton(
    `plugin:${c.contributionId}` as ActivityPanel,
    Puzzle, // Fallback icon — use Puzzle for all plugin panels
    c.meta.title as string
  ))}
```

- [ ] **Step 3: Render plugin panels in Sidebar**

In `src/renderer/src/components/shell/Sidebar.tsx`, add imports:

```typescript
import { usePluginUIStore } from '@/stores/plugin-ui'
import { WidgetRenderer } from '@/components/plugin-ui/WidgetRenderer'
```

Inside the component, fetch panel contributions:

```typescript
const panelContributions = usePluginUIStore((s) => s.contributions.panels ?? [])
const fetchContributions = usePluginUIStore((s) => s.fetchContributions)

useEffect(() => {
  fetchContributions('panels')
}, [fetchContributions])
```

In the `ScrollArea`, after the `{activePanel === 'extensions' && <ExtensionsPanel />}` line (line 66), add:

```typescript
{/* Plugin-contributed panels */}
{panelContributions
  .filter((c) => activePanel === `plugin:${c.contributionId}`)
  .map((c) => (
    <div key={c.contributionId} className="p-3 space-y-2">
      <WidgetRenderer widgets={c.widgets} pluginId={c.pluginId} />
    </div>
  ))}
```

Also update the `titles` record to dynamically include plugin panel titles:

```typescript
const pluginTitles = Object.fromEntries(
  panelContributions.map((c) => [`plugin:${c.contributionId}`, c.pluginName])
)
const allTitles = { ...titles, ...pluginTitles }
```

Use `allTitles` instead of `titles` in the header.

- [ ] **Step 4: Run dev server and verify**

```bash
pnpm dev
```

Open the app. ActivityBar and Sidebar should render without errors. Existing panels (Explorer, Saved Queries, etc.) should still work.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/stores/ui.ts src/renderer/src/components/shell/ActivityBar.tsx src/renderer/src/components/shell/Sidebar.tsx
git commit -m "feat(plugin-ui): integrate plugin panels into ActivityBar and Sidebar"
```

---

### Task 8: Integrate Plugin UI into Context Menus

Add plugin-contributed context menu items to the existing context menu primitive.

**Files:**
- Modify: `src/renderer/src/primitives/surfaces/ContextMenu.tsx:1-68` — accept pluginItems prop
- Modify: `src/renderer/src/components/explorer/TableNode.tsx` — pass plugin context menu items

- [ ] **Step 1: Extend ContextMenu to accept plugin items**

In `src/renderer/src/primitives/surfaces/ContextMenu.tsx`, the component already takes a `MenuItem[]` prop. The integration happens at the call site — we need to provide a hook for fetching context menu contributions.

Create a small hook:

Create `src/renderer/src/components/plugin-ui/usePluginContextMenu.ts`:

```typescript
// src/renderer/src/components/plugin-ui/usePluginContextMenu.ts
import { useEffect } from 'react'
import { usePluginUIStore } from '@/stores/plugin-ui'
import type { ContextMenuTarget } from '@shared/plugin-ui-types'

export function usePluginContextMenuItems(target: ContextMenuTarget) {
  const contributions = usePluginUIStore((s) => s.contributions.contextMenu ?? [])
  const fetchContributions = usePluginUIStore((s) => s.fetchContributions)
  const executeAction = usePluginUIStore((s) => s.executeAction)

  useEffect(() => {
    fetchContributions('contextMenu')
  }, [fetchContributions])

  const items = contributions
    .filter((c) => c.meta.target === target)
    .map((c) => ({
      label: `${c.pluginName}: ${c.meta.label}`,
      onSelect: () => executeAction(c.pluginId, c.meta.command as string, {}),
    }))

  return items
}
```

- [ ] **Step 2: Wire into TableNode context menu**

In `src/renderer/src/components/explorer/TableNode.tsx`, import the hook:

```typescript
import { usePluginContextMenuItems } from '@/components/plugin-ui/usePluginContextMenu'
```

Inside the component, call the hook and merge items:

```typescript
const pluginTableItems = usePluginContextMenuItems('table')
```

Append `pluginTableItems` to the existing `menuItems` array (wherever the context menu items are constructed):

```typescript
const allMenuItems = [...menuItems, ...pluginTableItems]
```

Pass `allMenuItems` to the ContextMenu component.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/plugin-ui/usePluginContextMenu.ts src/renderer/src/components/explorer/TableNode.tsx
git commit -m "feat(plugin-ui): add plugin-contributed context menu items"
```

---

### Task 9: Migrate Snowflake Plugin to Declarative UI

Convert the Snowflake plugin to use the new declarative UI system — registering selectors for warehouse, role, database, and schema.

**Files:**
- Modify: `src/main/plugins/bundled/snowflake/index.ts`

- [ ] **Step 1: Update Snowflake manifest with UI contributions**

In `src/main/plugins/bundled/snowflake/index.ts`, add UI declarations to the manifest:

```typescript
export const manifest: PluginManifest = {
  name: 'dbstudio-plugin-snowflake',
  version: '1.0.0',
  displayName: 'Snowflake',
  description: 'Snowflake data warehouse driver',
  main: 'index.js',
  contributes: {
    drivers: [{ id: 'snowflake', name: 'Snowflake' }],
    statusBar: [
      { id: 'snowflake-selectors', zone: 'left' }
    ]
  }
}
```

- [ ] **Step 2: Register UI widgets and resolvers in activate()**

Replace the `activate` function with the full declarative UI registration:

```typescript
export function activate(ctx: PluginContext): void {
  const adapter = { current: null as import('./snowflake-adapter').SnowflakeAdapter | null }

  ctx.drivers.register('snowflake', {
    createAdapter: (config) => {
      const inst = new SnowflakeAdapter(config)
      adapter.current = inst
      return inst
    },
    connectionFields: [
      { key: 'account', label: 'Account Identifier', type: 'text', required: true },
      { key: 'host', label: 'Host Override', type: 'text' },
      { key: 'username', label: 'Username', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
      {
        key: 'authenticator', label: 'Authenticator', type: 'select', default: 'externalbrowser',
        options: [
          { value: 'externalbrowser', label: 'SSO (Browser)' },
          { value: 'snowflake', label: 'Username / Password' },
          { value: 'SNOWFLAKE_JWT', label: 'Key Pair (JWT)' },
          { value: 'oauth', label: 'OAuth' },
          { value: 'https://okta.example.com', label: 'Okta (enter URL)' },
        ],
      },
      { key: 'privateKeyPath', label: 'Private Key File', type: 'file' },
      { key: 'passphrase', label: 'Key Passphrase', type: 'password' },
      { key: 'role', label: 'Role', type: 'select', fetchable: true, step: 1 },
      { key: 'warehouse', label: 'Warehouse', type: 'select', fetchable: true, step: 1 },
      { key: 'database', label: 'Database', type: 'select', fetchable: true, step: 2 },
      { key: 'schema', label: 'Schema', type: 'select', fetchable: true, step: 2, default: 'PUBLIC' },
    ]
  })

  // ── Declarative UI: Status bar selectors ──────────────────────────────────

  ctx.ui.registerStatusBar('snowflake-selectors', [
    { type: 'selector', id: 'sf-role', label: 'Role', resolver: 'sf-roles', onChange: 'dbstudio-plugin-snowflake:use-role' },
    { type: 'selector', id: 'sf-warehouse', label: 'Warehouse', resolver: 'sf-warehouses', onChange: 'dbstudio-plugin-snowflake:use-warehouse' },
    { type: 'selector', id: 'sf-database', label: 'Database', resolver: 'sf-databases', onChange: 'dbstudio-plugin-snowflake:use-database' },
    { type: 'selector', id: 'sf-schema', label: 'Schema', resolver: 'sf-schemas', onChange: 'dbstudio-plugin-snowflake:use-schema' },
  ])

  // ── Dynamic resolvers ─────────────────────────────────────────────────────

  ctx.ui.registerResolver('sf-roles', async ({ connectionId }) => {
    const options = await ctx.connections.query(connectionId, 'SHOW ROLES')
    return options.rows.map((r) => {
      const name = String(r['"name"'] ?? r.name ?? '')
      return { value: name, label: name }
    }).filter((o) => o.value)
  })

  ctx.ui.registerResolver('sf-warehouses', async ({ connectionId }) => {
    const options = await ctx.connections.query(connectionId, 'SHOW WAREHOUSES')
    return options.rows.map((r) => {
      const name = String(r['"name"'] ?? r.name ?? '')
      return { value: name, label: name }
    }).filter((o) => o.value)
  })

  ctx.ui.registerResolver('sf-databases', async ({ connectionId }) => {
    const options = await ctx.connections.query(connectionId, 'SHOW DATABASES')
    return options.rows.map((r) => {
      const name = String(r['"name"'] ?? r.name ?? '')
      return { value: name, label: name }
    }).filter((o) => o.value)
  })

  ctx.ui.registerResolver('sf-schemas', async ({ connectionId }) => {
    const options = await ctx.connections.query(connectionId, 'SHOW SCHEMAS')
    return options.rows.map((r) => {
      const name = String(r['"name"'] ?? r.name ?? '')
      return { value: name, label: name }
    }).filter((o) => o.value)
  })

  // ── Commands for selector onChange ─────────────────────────────────────────

  ctx.commands.register('use-role', async () => {
    // The value comes from the widget action payload — for now this is a stub
    // that will be enhanced when the command registry supports payloads
  })

  ctx.commands.register('use-warehouse', async () => {})
  ctx.commands.register('use-database', async () => {})
  ctx.commands.register('use-schema', async () => {})
}
```

- [ ] **Step 3: Run tests to ensure nothing breaks**

```bash
pnpm test -- --run
```

Expected: All tests pass.

- [ ] **Step 4: Run the dev server and connect to Snowflake (if available)**

```bash
pnpm dev
```

If a Snowflake connection is available, connect and verify that the status bar shows the 4 selectors (Role, Warehouse, Database, Schema) in the left zone.

- [ ] **Step 5: Commit**

```bash
git add src/main/plugins/bundled/snowflake/index.ts
git commit -m "feat(plugin-ui): migrate Snowflake plugin to declarative UI with status bar selectors"
```

---

### Task 10: Command Registry Enhancement — Support Payloads

The current `CommandRegistry` handlers take no arguments. Widget actions need to pass payloads (e.g., the selected value). Enhance the command registry to accept a payload parameter.

**Files:**
- Modify: `src/main/plugins/sdk/types.ts:75-77` — change CommandRegistry handler signature
- Modify: `src/main/plugins/sdk/command-registry.ts` — accept payload in execute
- Modify: `src/main/ipc-handlers.ts` — pass payload to command execution
- Create: `tests/unit/command-registry-payload.test.ts`

- [ ] **Step 1: Write failing test for payload support**

```typescript
// tests/unit/command-registry-payload.test.ts
import { describe, it, expect, vi } from 'vitest'
import { CommandRegistryImpl } from '../../src/main/plugins/sdk/command-registry'

describe('CommandRegistry payload support', () => {
  it('passes payload to command handler', async () => {
    const registry = new CommandRegistryImpl()
    const handler = vi.fn()
    registry.register('test:cmd', handler)
    await registry.execute('test:cmd', undefined, { value: 'hello' })
    expect(handler).toHaveBeenCalledWith({ value: 'hello' })
  })

  it('works without payload (backwards compatible)', async () => {
    const registry = new CommandRegistryImpl()
    const handler = vi.fn()
    registry.register('test:cmd', handler)
    await registry.execute('test:cmd')
    expect(handler).toHaveBeenCalledWith(undefined)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test -- --run tests/unit/command-registry-payload.test.ts
```

Expected: FAIL — `execute` doesn't accept payload.

- [ ] **Step 3: Update CommandRegistry types and implementation**

In `src/main/plugins/sdk/types.ts`, update the `CommandRegistry` interface:

```typescript
export interface CommandRegistry {
  register(id: string, handler: (payload?: Record<string, unknown>) => void | Promise<void>): Disposable
}
```

In `src/main/plugins/sdk/command-registry.ts`, update the implementation:

```typescript
export class CommandRegistryImpl implements CommandRegistry {
  private commands = new Map<string, (payload?: Record<string, unknown>) => void | Promise<void>>()

  register(id: string, handler: (payload?: Record<string, unknown>) => void | Promise<void>): Disposable {
    if (this.commands.has(id)) {
      throw new Error(`Command '${id}' is already registered`)
    }
    this.commands.set(id, handler)
    return { dispose: () => { this.commands.delete(id) } }
  }

  async execute(id: string, wrapper?: <T>(fn: () => T | Promise<T>) => Promise<T>, payload?: Record<string, unknown>): Promise<void> {
    const handler = this.commands.get(id)
    if (!handler) {
      throw new Error(`Command '${id}' not found`)
    }
    if (wrapper) {
      await wrapper(() => handler(payload))
    } else {
      await handler(payload)
    }
  }

  has(id: string): boolean {
    return this.commands.has(id)
  }

  getCommandIds(): string[] {
    return [...this.commands.keys()]
  }

  clear(): void {
    this.commands.clear()
  }
}
```

- [ ] **Step 4: Pass payload through IPC action handler**

In `src/main/ipc-handlers.ts`, update the `plugins:ui:action` handler:

```typescript
handle('plugins:ui:action', async (pluginId, commandId, payload) => {
  await pluginCoordinator.safeCallWithBudget(pluginId, () =>
    commandRegistry.execute(commandId, undefined, payload)
  )
})
```

- [ ] **Step 5: Update Snowflake command handlers to use payloads**

In `src/main/plugins/bundled/snowflake/index.ts`, update the command registrations to use the adapter and payload:

```typescript
  ctx.commands.register('use-role', async (payload) => {
    if (payload?.value && payload?.connectionId) {
      await ctx.connections.query(payload.connectionId as string, `USE ROLE "${payload.value}"`)
      ctx.ui.invalidate('sf-warehouses')
      ctx.ui.invalidate('sf-databases')
    }
  })

  ctx.commands.register('use-warehouse', async (payload) => {
    if (payload?.value && payload?.connectionId) {
      await ctx.connections.query(payload.connectionId as string, `USE WAREHOUSE "${payload.value}"`)
    }
  })

  ctx.commands.register('use-database', async (payload) => {
    if (payload?.value && payload?.connectionId) {
      await ctx.connections.query(payload.connectionId as string, `USE DATABASE "${payload.value}"`)
      ctx.ui.invalidate('sf-schemas')
    }
  })

  ctx.commands.register('use-schema', async (payload) => {
    if (payload?.value && payload?.connectionId) {
      await ctx.connections.query(payload.connectionId as string, `USE SCHEMA "${payload.value}"`)
    }
  })
```

- [ ] **Step 6: Run all tests**

```bash
pnpm test -- --run
```

Expected: All tests pass, including the new payload tests.

- [ ] **Step 7: Commit**

```bash
git add src/main/plugins/sdk/types.ts src/main/plugins/sdk/command-registry.ts src/main/ipc-handlers.ts src/main/plugins/bundled/snowflake/index.ts tests/unit/command-registry-payload.test.ts
git commit -m "feat(plugin-ui): enhance CommandRegistry with payload support for widget actions"
```

---

### Task 11: Preload Bridge — Expose New IPC Channels

Ensure the preload script exposes the new `plugins:ui:*` channels to the renderer.

**Files:**
- Modify: `src/preload/index.ts` (or wherever the preload bridge is defined)

- [ ] **Step 1: Check current preload implementation**

Read `src/preload/index.ts` to understand how channels are exposed. The typed `invoke()` and `on()` methods should automatically support new channels if they read from `IpcChannelMap`. If they do, no changes are needed.

If the preload uses an allowlist of channel names, add the 4 new channels:
- `'plugins:ui:get-contributions'`
- `'plugins:ui:resolve'`
- `'plugins:ui:action'`
- `'plugins:ui:contributions-changed'`

- [ ] **Step 2: Verify the `on` method works for the contributions-changed event**

The `plugins:ui:contributions-changed` channel is a push event from main→renderer. Ensure the preload's `on()` method registers it with `ipcRenderer.on()`. If it uses a whitelist for event channels, add the new channel.

- [ ] **Step 3: Run dev server and check console for IPC errors**

```bash
pnpm dev
```

Open DevTools console. Verify no errors about unrecognized IPC channels.

- [ ] **Step 4: Commit (if changes were needed)**

```bash
git add src/preload/
git commit -m "feat(plugin-ui): expose plugin UI IPC channels in preload bridge"
```

---

### Task 12: End-to-End Verification

Verify the full pipeline works: plugin declares → host renders → user interacts → plugin responds.

**Files:** No new files — verification only.

- [ ] **Step 1: Run all tests**

```bash
pnpm test -- --run
```

Expected: All tests pass.

- [ ] **Step 2: Run the dev server**

```bash
pnpm dev
```

- [ ] **Step 3: Verify status bar rendering**

Open the app. The status bar should render without errors. If no Snowflake connection is active, the selectors should not appear (they only show when connected to a Snowflake database).

- [ ] **Step 4: Verify ActivityBar and Sidebar**

Click through all ActivityBar panels (Explorer, Saved Queries, Charts, Extensions, Settings). Each should render correctly. If a plugin declares an activityBar contribution, its icon should appear.

- [ ] **Step 5: Verify context menus**

Right-click a table in the explorer. The context menu should show any plugin-contributed items grouped by plugin name.

- [ ] **Step 6: Final commit with any fixes**

If any fixes were needed during verification:

```bash
git add -A
git commit -m "fix(plugin-ui): address issues found during end-to-end verification"
```
