# Primitives Consolidation & Settings System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a comprehensive, persisted settings system and migrate all app components to use the primitives design system exclusively.

**Architecture:** ConfigStore expands to hold all app settings in `config.json`. A new Zustand `settings` store in the renderer acts as a reactive cache, synced via typed IPC channels. ThemeProvider reads from the store instead of localStorage. All components are composed from primitives — zero raw HTML elements.

**Tech Stack:** Electron, React 19, Zustand, TypeScript, Tailwind CSS, CVA, Monaco Editor, Vitest

---

## File Structure

### New Files
- `shared/settings.ts` — Settings type definitions + defaults
- `src/renderer/src/stores/settings.ts` — Zustand settings store
- `src/renderer/src/components/settings/SettingsLayout.tsx` — VS Code-style sidebar + content layout
- `src/renderer/src/components/settings/categories/GeneralSettings.tsx`
- `src/renderer/src/components/settings/categories/AppearanceSettings.tsx`
- `src/renderer/src/components/settings/categories/EditorSettings.tsx`
- `src/renderer/src/components/settings/categories/ConnectionSettings.tsx`
- `src/renderer/src/components/settings/categories/DataDisplaySettings.tsx`
- `src/renderer/src/components/settings/categories/KeybindingsSettings.tsx`
- `src/renderer/src/components/settings/categories/PluginSettings.tsx`
- `src/renderer/src/components/settings/SettingRow.tsx` — Reusable setting row layout component

### Modified Files
- `shared/ipc.ts` — Add settings IPC channels
- `src/main/config/store.ts` — Extend ConfigStore with settings CRUD + event broadcasting
- `src/main/ipc-handlers.ts` — Register settings IPC handlers
- `src/preload/index.ts` — No changes needed (generic invoke/on already works)
- `src/renderer/src/primitives/theme/ThemeProvider.tsx` — Read from settings store instead of localStorage
- `src/renderer/src/stores/ui.ts` — Move sidebar/split to settings store, remove localStorage
- `src/renderer/src/components/settings/SettingsPanel.tsx` — Full rewrite using SettingsLayout
- `src/renderer/src/components/query/QueryEditor.tsx` — Read editor settings from store
- `src/renderer/src/components/shell/NotificationBell.tsx` — Migrate to primitives
- `src/renderer/src/components/shell/NotificationPanel.tsx` — Migrate to primitives
- `src/renderer/src/components/shell/NotificationItem.tsx` — Migrate to primitives
- `src/renderer/src/components/shell/ConnectionSwitcher.tsx` — Migrate to primitives
- `src/renderer/src/components/shell/ConnectionCard.tsx` — Migrate to primitives
- `src/renderer/src/components/shell/StatusBar.tsx` — Migrate to primitives
- `src/renderer/src/components/connections/ConnectionForm.tsx` — Migrate custom dropdown to Select
- `src/renderer/src/components/connections/ConnectionTestButton.tsx` — Migrate to primitives
- `src/renderer/src/components/command-palette/CommandPalette.tsx` — Migrate to Modal primitive
- `src/renderer/src/components/saved-queries/SavedQueriesPanel.tsx` — Migrate to primitives
- `src/renderer/src/components/export/ExportModal.tsx` — Migrate feedback to Alert
- `src/renderer/src/components/import/ImportModal.tsx` — Migrate feedback to Alert

---

## Part 1: Settings System

### Task 1: Settings Type Definitions & Defaults

**Files:**
- Create: `shared/settings.ts`

- [ ] **Step 1: Create settings types and defaults**

```typescript
// shared/settings.ts
export const AVAILABLE_THEMES = ['dark', 'light', 'midnight', 'dracula', 'nord', 'solarized', 'catppuccin'] as const
export type Theme = (typeof AVAILABLE_THEMES)[number]

export interface GeneralSettings {
  queryTimeout: number
  maxHistoryItems: number
  defaultPageSize: number
}

export interface AppearanceSettings {
  theme: Theme
  uiDensity: 'compact' | 'comfortable' | 'spacious'
  sidebarPosition: 'left' | 'right'
  accentColor: string
  sidebarWidth: number
  splitRatio: number
}

export interface EditorSettings {
  fontSize: number
  fontFamily: string
  tabSize: number
  wordWrap: boolean
  minimap: boolean
  lineNumbers: boolean
  bracketMatching: boolean
  cursorStyle: 'line' | 'block' | 'underline'
  ligatures: boolean
}

export interface ConnectionDefaultSettings {
  autoReconnect: boolean
  defaultSslMode: 'disable' | 'prefer' | 'require'
  defaultPorts: Record<string, number>
}

export interface DataDisplaySettings {
  nullDisplay: string
  dateFormat: 'iso' | 'locale' | 'custom'
  numberFormat: 'raw' | 'locale'
  maxColumnWidth: number
}

export interface KeyBinding {
  id: string
  label: string
  keys: string[]
  category: string
}

export interface AppSettings {
  general: GeneralSettings
  appearance: AppearanceSettings
  editor: EditorSettings
  connectionDefaults: ConnectionDefaultSettings
  dataDisplay: DataDisplaySettings
  keybindings: KeyBinding[]
  plugins: Record<string, Record<string, unknown>>
}

export const defaultSettings: AppSettings = {
  general: {
    queryTimeout: 30,
    maxHistoryItems: 200,
    defaultPageSize: 100,
  },
  appearance: {
    theme: 'dark',
    uiDensity: 'comfortable',
    sidebarPosition: 'left',
    accentColor: '#7c6ff7',
    sidebarWidth: 240,
    splitRatio: 50,
  },
  editor: {
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
    tabSize: 2,
    wordWrap: true,
    minimap: false,
    lineNumbers: true,
    bracketMatching: true,
    cursorStyle: 'line',
    ligatures: true,
  },
  connectionDefaults: {
    autoReconnect: false,
    defaultSslMode: 'prefer',
    defaultPorts: {
      postgresql: 5432,
      mysql: 3306,
      mongodb: 27017,
      redis: 6379,
    },
  },
  dataDisplay: {
    nullDisplay: 'NULL',
    dateFormat: 'iso',
    numberFormat: 'raw',
    maxColumnWidth: 300,
  },
  keybindings: [
    { id: 'execute-query', label: 'Execute Query', keys: ['Ctrl+Enter', 'Cmd+Enter'], category: 'Query Execution' },
    { id: 'new-tab', label: 'New Tab', keys: ['Ctrl+T', 'Cmd+T'], category: 'Navigation' },
    { id: 'close-tab', label: 'Close Tab', keys: ['Ctrl+W', 'Cmd+W'], category: 'Navigation' },
    { id: 'toggle-sidebar', label: 'Toggle Sidebar', keys: ['Ctrl+B', 'Cmd+B'], category: 'Panels' },
    { id: 'command-palette', label: 'Command Palette', keys: ['Ctrl+Shift+P', 'Cmd+Shift+P'], category: 'Navigation' },
    { id: 'focus-editor', label: 'Focus Editor', keys: ['Ctrl+1', 'Cmd+1'], category: 'Editor' },
    { id: 'save-query', label: 'Save Query', keys: ['Ctrl+S', 'Cmd+S'], category: 'Query Execution' },
  ],
  plugins: {},
}

/** Deep merge user settings with defaults so new keys get defaults automatically */
export function mergeWithDefaults(persisted: Partial<AppSettings>): AppSettings {
  const result = { ...defaultSettings }
  for (const key of Object.keys(defaultSettings) as (keyof AppSettings)[]) {
    if (key === 'keybindings' || key === 'plugins') {
      if (persisted[key] !== undefined) {
        (result as any)[key] = persisted[key]
      }
    } else if (persisted[key] !== undefined) {
      (result as any)[key] = { ...(defaultSettings as any)[key], ...(persisted as any)[key] }
    }
  }
  return result
}
```

- [ ] **Step 2: Verify the types compile**

Run: `npx tsc --noEmit --project tsconfig.json 2>&1 | head -20`
Expected: No errors related to `shared/settings.ts`

- [ ] **Step 3: Commit**

```bash
git add shared/settings.ts
git commit -m "feat: add settings type definitions and defaults"
```

---

### Task 2: Extend ConfigStore for Settings

**Files:**
- Modify: `src/main/config/store.ts`

- [ ] **Step 1: Add settings to ConfigStore**

Replace the full content of `src/main/config/store.ts`:

```typescript
import fs from 'fs'
import path from 'path'
import type { ConnectionProfile } from '@shared/types'
import type { AppSettings } from '@shared/settings'
import { defaultSettings, mergeWithDefaults } from '@shared/settings'

interface ConfigData {
  connections: ConnectionProfile[]
  settings: AppSettings
}

type SettingsListener = (key: string, value: unknown) => void

export class ConfigStore {
  private filePath: string
  private data: ConfigData
  private listeners: SettingsListener[] = []

  constructor(filePath: string) {
    this.filePath = filePath
    this.data = this.load()
  }

  private load(): ConfigData {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8')
        const parsed = JSON.parse(raw)
        return {
          connections: parsed.connections ?? [],
          settings: mergeWithDefaults(parsed.settings ?? {}),
        }
      }
    } catch {
      // Corrupted file — start fresh
    }
    return { connections: [], settings: { ...defaultSettings } }
  }

  private save(): void {
    const dir = path.dirname(this.filePath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8')
  }

  // ─── Connections ──────────────────────────────────────────────
  listConnections(): ConnectionProfile[] {
    return [...this.data.connections]
  }

  getConnection(id: string): ConnectionProfile | undefined {
    return this.data.connections.find(c => c.id === id)
  }

  saveConnection(profile: ConnectionProfile): ConnectionProfile {
    const idx = this.data.connections.findIndex(c => c.id === profile.id)
    if (idx >= 0) {
      this.data.connections[idx] = profile
    } else {
      this.data.connections.push(profile)
    }
    this.save()
    return profile
  }

  deleteConnection(id: string): void {
    this.data.connections = this.data.connections.filter(c => c.id !== id)
    this.save()
  }

  // ─── Settings ─────────────────────────────────────────────────
  getAllSettings(): AppSettings {
    return this.data.settings
  }

  getSettingsCategory<K extends keyof AppSettings>(category: K): AppSettings[K] {
    return this.data.settings[category]
  }

  setSetting(keyPath: string, value: unknown): void {
    const parts = keyPath.split('.')
    let target: any = this.data.settings
    for (let i = 0; i < parts.length - 1; i++) {
      if (target[parts[i]] === undefined) target[parts[i]] = {}
      target = target[parts[i]]
    }
    target[parts[parts.length - 1]] = value
    this.save()
    this.notifyListeners(keyPath, value)
  }

  resetCategory(category: keyof AppSettings): void {
    (this.data.settings as any)[category] = (defaultSettings as any)[category]
    this.save()
    this.notifyListeners(category, (this.data.settings as any)[category])
  }

  onSettingsChanged(listener: SettingsListener): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners(key: string, value: unknown): void {
    for (const listener of this.listeners) {
      listener(key, value)
    }
  }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors in `config/store.ts`

- [ ] **Step 3: Commit**

```bash
git add src/main/config/store.ts
git commit -m "feat: extend ConfigStore with settings CRUD and change listeners"
```

---

### Task 3: Add Settings IPC Channels

**Files:**
- Modify: `shared/ipc.ts`
- Modify: `src/main/ipc-handlers.ts`

- [ ] **Step 1: Add settings channels to IpcChannelMap**

In `shared/ipc.ts`, add these entries before the closing `}` of `IpcChannelMap`:

```typescript
  'settings:get-all': {
    args: []
    return: import('@shared/settings').AppSettings
  }
  'settings:get': {
    args: [category: string]
    return: unknown
  }
  'settings:set': {
    args: [keyPath: string, value: unknown]
    return: void
  }
  'settings:reset': {
    args: [category: string]
    return: import('@shared/settings').AppSettings[keyof import('@shared/settings').AppSettings]
  }
```

Also add the import at the top:

```typescript
import type { AppSettings } from './settings'
```

And update the channel definitions to use the imported type instead of `import()` expressions:

```typescript
  'settings:get-all': {
    args: []
    return: AppSettings
  }
  'settings:get': {
    args: [category: string]
    return: unknown
  }
  'settings:set': {
    args: [keyPath: string, value: unknown]
    return: void
  }
  'settings:reset': {
    args: [category: string]
    return: unknown
  }
```

- [ ] **Step 2: Register settings IPC handlers**

In `src/main/ipc-handlers.ts`, add after the connections handlers (around line 60) and before the db handlers:

```typescript
  // ─── Settings ───────────────────────────────────────────────────────────────
  handle('settings:get-all', async () => {
    return configStore.getAllSettings()
  })

  handle('settings:get', async (category) => {
    return configStore.getSettingsCategory(category as keyof AppSettings)
  })

  handle('settings:set', async (keyPath, value) => {
    configStore.setSetting(keyPath, value)
    mainWindow?.webContents.send('settings:changed', keyPath, value)
  })

  handle('settings:reset', async (category) => {
    configStore.resetCategory(category as keyof AppSettings)
    const updated = configStore.getSettingsCategory(category as keyof AppSettings)
    mainWindow?.webContents.send('settings:changed', category, updated)
    return updated
  })
```

Also add the import at the top of `ipc-handlers.ts`:

```typescript
import type { AppSettings } from '@shared/settings'
```

Note: The `registerIpcHandlers` function needs access to `mainWindow` for broadcasting. Check the function signature — if `mainWindow` isn't passed in, add it as a parameter:

```typescript
export function registerIpcHandlers(mainWindow: BrowserWindow | null) {
```

If the function already receives it (check the existing signature), use it directly.

- [ ] **Step 3: Fix the plugin settingsStore hack**

In `src/main/ipc-handlers.ts`, replace the hacky `settingsStore` block (lines 383-390):

```typescript
    settingsStore: {
      get: (key) => {
        const pluginSettings = configStore.getSettingsCategory('plugins')
        return pluginSettings[key]
      },
      set: (key, value) => {
        configStore.setSetting(`plugins.${key}`, value)
      }
    }
```

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add shared/ipc.ts src/main/ipc-handlers.ts
git commit -m "feat: add settings IPC channels and handlers"
```

---

### Task 4: Zustand Settings Store

**Files:**
- Create: `src/renderer/src/stores/settings.ts`

- [ ] **Step 1: Create the settings store**

```typescript
// src/renderer/src/stores/settings.ts
import { create } from 'zustand'
import type { AppSettings } from '@shared/settings'
import { defaultSettings } from '@shared/settings'

interface SettingsState {
  settings: AppSettings
  loaded: boolean
  hydrate: () => Promise<void>
  set: (keyPath: string, value: unknown) => Promise<void>
  resetCategory: (category: keyof AppSettings) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,
  loaded: false,

  hydrate: async () => {
    const settings = await window.electronAPI.invoke('settings:get-all')
    set({ settings, loaded: true })
  },

  set: async (keyPath: string, value: unknown) => {
    // Optimistic update
    set((state) => {
      const newSettings = { ...state.settings }
      const parts = keyPath.split('.')
      let target: any = newSettings
      for (let i = 0; i < parts.length - 1; i++) {
        target[parts[i]] = { ...target[parts[i]] }
        target = target[parts[i]]
      }
      target[parts[parts.length - 1]] = value
      return { settings: newSettings }
    })
    // Persist via IPC
    await window.electronAPI.invoke('settings:set', keyPath, value)
  },

  resetCategory: async (category: keyof AppSettings) => {
    const updated = await window.electronAPI.invoke('settings:reset', category)
    set((state) => ({
      settings: { ...state.settings, [category]: updated },
    }))
  },
}))

// Listen for settings changes broadcast from main process
export function initSettingsListener(): () => void {
  return window.electronAPI.on('settings:changed', (keyPath: unknown, value: unknown) => {
    const store = useSettingsStore.getState()
    const parts = (keyPath as string).split('.')
    const newSettings = { ...store.settings }
    let target: any = newSettings
    for (let i = 0; i < parts.length - 1; i++) {
      target[parts[i]] = { ...target[parts[i]] }
      target = target[parts[i]]
    }
    target[parts[parts.length - 1]] = value
    useSettingsStore.setState({ settings: newSettings })
  })
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/stores/settings.ts
git commit -m "feat: add Zustand settings store with IPC sync"
```

---

### Task 5: Update ThemeProvider to Read from Settings Store

**Files:**
- Modify: `src/renderer/src/primitives/theme/ThemeProvider.tsx`

- [ ] **Step 1: Rewrite ThemeProvider**

Replace the full content of `ThemeProvider.tsx`:

```typescript
import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useSettingsStore } from '@/stores/settings'

const AVAILABLE_THEMES = ['dark', 'light', 'midnight', 'dracula', 'nord', 'solarized', 'catppuccin'] as const
type Theme = (typeof AVAILABLE_THEMES)[number]

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  themes: readonly Theme[]
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSettingsStore((s) => s.settings.appearance.theme)
  const setSetting = useSettingsStore((s) => s.set)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    if (AVAILABLE_THEMES.includes(newTheme)) {
      setSetting('appearance.theme', newTheme)
    }
  }

  return (
    <ThemeContext value={{ theme, setTheme, themes: AVAILABLE_THEMES }}>
      {children}
    </ThemeContext>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/primitives/theme/ThemeProvider.tsx
git commit -m "refactor: ThemeProvider reads from settings store instead of localStorage"
```

---

### Task 6: Migrate UI Store Away from localStorage

**Files:**
- Modify: `src/renderer/src/stores/ui.ts`

- [ ] **Step 1: Remove localStorage from UI store**

Replace the full content of `src/renderer/src/stores/ui.ts`:

```typescript
import { create } from 'zustand'
import { useSettingsStore } from './settings'

export type ActivityPanel = 'explorer' | 'query' | 'charts' | 'extensions' | 'settings'

interface UiState {
  activePanel: ActivityPanel
  sidebarVisible: boolean
  expandedSections: Record<string, boolean>
  setActivePanel: (panel: ActivityPanel) => void
  toggleSidebar: () => void
  setSidebarWidth: (width: number) => void
  setSplitRatio: (ratio: number) => void
  toggleSection: (title: string) => void
}

export const useUiStore = create<UiState>((set) => ({
  activePanel: 'explorer',
  sidebarVisible: true,
  expandedSections: {
    CONNECTIONS: true,
    DATABASES: true,
    TABLES: true,
    VIEWS: true,
  },
  setActivePanel: (panel) =>
    set((state) => ({
      activePanel: panel,
      sidebarVisible: state.activePanel === panel ? !state.sidebarVisible : true,
    })),
  toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),
  setSidebarWidth: (width) => {
    const clamped = Math.min(480, Math.max(180, width))
    useSettingsStore.getState().set('appearance.sidebarWidth', clamped)
  },
  setSplitRatio: (ratio) => {
    const clamped = Math.min(80, Math.max(20, ratio))
    useSettingsStore.getState().set('appearance.splitRatio', clamped)
  },
  toggleSection: (title) =>
    set((state) => ({
      expandedSections: {
        ...state.expandedSections,
        [title]: !state.expandedSections[title],
      },
    })),
}))
```

Note: Components that read `sidebarWidth` and `splitRatio` from `useUiStore` now need to read from `useSettingsStore` instead. Find and update those call sites:

Run: `grep -rn 'sidebarWidth\|splitRatio' src/renderer/src/ --include='*.tsx' --include='*.ts' | grep -v 'node_modules\|stores/ui\|stores/settings\|\.stories\.'`

Update each usage to read from `useSettingsStore(s => s.settings.appearance.sidebarWidth)` and `useSettingsStore(s => s.settings.appearance.splitRatio)`.

- [ ] **Step 2: Verify it compiles and fix any import issues**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: Fix any components still importing `sidebarWidth`/`splitRatio` from `useUiStore`

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/stores/ui.ts
git commit -m "refactor: migrate UI store from localStorage to settings store"
```

---

### Task 7: Hydrate Settings on App Start

**Files:**
- Modify: `src/renderer/src/App.tsx` (or main entry component)

- [ ] **Step 1: Find the app entry point**

Run: `grep -rn 'ThemeProvider' src/renderer/src/ --include='*.tsx' | grep -v stories | grep -v node_modules`

Find where `ThemeProvider` wraps the app. This is where we add settings hydration.

- [ ] **Step 2: Add settings hydration**

In the component that renders `ThemeProvider`, add:

```typescript
import { useSettingsStore, initSettingsListener } from '@/stores/settings'
import { useEffect } from 'react'

// Inside the component, before the return:
const hydrate = useSettingsStore((s) => s.hydrate)
const loaded = useSettingsStore((s) => s.loaded)

useEffect(() => {
  hydrate()
  const unsub = initSettingsListener()
  return unsub
}, [hydrate])

if (!loaded) return null // or a loading spinner
```

Make sure `ThemeProvider` renders inside this gate so it reads the hydrated theme.

- [ ] **Step 3: localStorage migration — one-time**

Add a migration check that runs once on first hydration. In the hydrate function or in the app entry, after settings load:

```typescript
// In hydrate or after it completes — check if localStorage keys exist
const oldTheme = localStorage.getItem('dbstudio-theme')
const oldSidebarWidth = localStorage.getItem('dbstudio-sidebar-width')
const oldSplitRatio = localStorage.getItem('dbstudio-split-ratio')

if (oldTheme || oldSidebarWidth || oldSplitRatio) {
  if (oldTheme) await window.electronAPI.invoke('settings:set', 'appearance.theme', oldTheme)
  if (oldSidebarWidth) await window.electronAPI.invoke('settings:set', 'appearance.sidebarWidth', parseFloat(oldSidebarWidth))
  if (oldSplitRatio) await window.electronAPI.invoke('settings:set', 'appearance.splitRatio', parseFloat(oldSplitRatio))
  localStorage.removeItem('dbstudio-theme')
  localStorage.removeItem('dbstudio-sidebar-width')
  localStorage.removeItem('dbstudio-split-ratio')
  // Re-hydrate with migrated values
  const settings = await window.electronAPI.invoke('settings:get-all')
  useSettingsStore.setState({ settings })
}
```

- [ ] **Step 4: Verify app starts correctly**

Run: `pnpm dev`
Expected: App launches, theme applies correctly, no errors in console

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/
git commit -m "feat: hydrate settings on app start with localStorage migration"
```

---

### Task 8: SettingRow Component

**Files:**
- Create: `src/renderer/src/components/settings/SettingRow.tsx`

- [ ] **Step 1: Create reusable setting row**

```typescript
// src/renderer/src/components/settings/SettingRow.tsx
import { Flex, Text } from '@/primitives'
import type { ReactNode } from 'react'

interface SettingRowProps {
  label: string
  description: string
  children: ReactNode
}

export function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <Flex direction="row" align="center" justify="between" className="py-2">
      <div className="flex-1 min-w-0 mr-4">
        <Text size="sm" color="primary">{label}</Text>
        <Text size="xs" color="muted" className="mt-0.5">{description}</Text>
      </div>
      <div className="shrink-0">{children}</div>
    </Flex>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/settings/SettingRow.tsx
git commit -m "feat: add reusable SettingRow component"
```

---

### Task 9: Settings Layout (Sidebar + Content)

**Files:**
- Create: `src/renderer/src/components/settings/SettingsLayout.tsx`

- [ ] **Step 1: Create the VS Code-style settings layout**

```typescript
// src/renderer/src/components/settings/SettingsLayout.tsx
import { useState } from 'react'
import { Flex, Box, ScrollArea, Text, Button, Divider } from '@/primitives'
import { GeneralSettings } from './categories/GeneralSettings'
import { AppearanceSettings } from './categories/AppearanceSettings'
import { EditorSettings } from './categories/EditorSettings'
import { ConnectionSettings } from './categories/ConnectionSettings'
import { DataDisplaySettings } from './categories/DataDisplaySettings'
import { KeybindingsSettings } from './categories/KeybindingsSettings'
import { PluginSettings } from './categories/PluginSettings'

const categories = [
  { id: 'general', label: 'General' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'editor', label: 'Editor' },
  { id: 'connections', label: 'Connections' },
  { id: 'data-display', label: 'Data Display' },
  { id: 'keybindings', label: 'Keybindings' },
  { id: 'plugins', label: 'Plugins' },
] as const

type CategoryId = (typeof categories)[number]['id']

const categoryComponents: Record<CategoryId, () => JSX.Element> = {
  general: GeneralSettings,
  appearance: AppearanceSettings,
  editor: EditorSettings,
  connections: ConnectionSettings,
  'data-display': DataDisplaySettings,
  keybindings: KeybindingsSettings,
  plugins: PluginSettings,
}

export function SettingsLayout() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('general')
  const ActiveComponent = categoryComponents[activeCategory]

  return (
    <Flex direction="row" className="h-full">
      {/* Sidebar */}
      <Box className="w-48 border-r border-border-default shrink-0">
        <ScrollArea direction="vertical" className="h-full">
          <Box className="py-2">
            <Text size="xs" color="muted" className="px-4 py-2 uppercase tracking-wider font-semibold">
              Settings
            </Text>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant="ghost"
                size="sm"
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full justify-start rounded-none px-4 ${
                  activeCategory === cat.id
                    ? 'bg-hover border-l-2 border-l-accent text-text-primary'
                    : 'border-l-2 border-l-transparent text-text-secondary'
                }`}
              >
                {cat.label}
              </Button>
            ))}
          </Box>
        </ScrollArea>
      </Box>

      {/* Content */}
      <ScrollArea direction="vertical" className="flex-1">
        <Box className="p-6 max-w-2xl">
          <ActiveComponent />
        </Box>
      </ScrollArea>
    </Flex>
  )
}
```

- [ ] **Step 2: Commit** (will compile after category components are created in next tasks)

```bash
git add src/renderer/src/components/settings/SettingsLayout.tsx
git commit -m "feat: add VS Code-style settings layout with sidebar categories"
```

---

### Task 10: General Settings Category

**Files:**
- Create: `src/renderer/src/components/settings/categories/GeneralSettings.tsx`

- [ ] **Step 1: Create GeneralSettings**

```typescript
// src/renderer/src/components/settings/categories/GeneralSettings.tsx
import { Stack, Divider, Flex, Button, Heading, Text } from '@/primitives'
import { NumberInput, Select } from '@/primitives'
import { useSettingsStore } from '@/stores/settings'
import { SettingRow } from '../SettingRow'

export function GeneralSettings() {
  const general = useSettingsStore((s) => s.settings.general)
  const setSetting = useSettingsStore((s) => s.set)
  const resetCategory = useSettingsStore((s) => s.resetCategory)

  return (
    <Stack gap="md">
      <div>
        <Heading level={4}>General</Heading>
        <Text size="xs" color="muted" className="mt-1">Basic application settings</Text>
      </div>

      <SettingRow label="Query Timeout" description="Maximum time in seconds before a query is cancelled">
        <NumberInput
          value={general.queryTimeout}
          onChange={(v) => setSetting('general.queryTimeout', v)}
          min={5}
          max={300}
          size="sm"
          className="w-20"
        />
      </SettingRow>

      <SettingRow label="Max History Items" description="Number of recent queries to keep in history">
        <NumberInput
          value={general.maxHistoryItems}
          onChange={(v) => setSetting('general.maxHistoryItems', v)}
          min={50}
          max={1000}
          step={50}
          size="sm"
          className="w-20"
        />
      </SettingRow>

      <SettingRow label="Default Page Size" description="Number of rows to fetch per page when browsing tables">
        <Select
          value={general.defaultPageSize}
          onChange={(e) => setSetting('general.defaultPageSize', parseInt(e.target.value))}
          size="sm"
          className="w-24"
        >
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={500}>500</option>
          <option value={1000}>1000</option>
        </Select>
      </SettingRow>

      <Divider />

      <Flex justify="end">
        <Button variant="outline" size="sm" onClick={() => resetCategory('general')}>
          Reset to Defaults
        </Button>
      </Flex>
    </Stack>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/settings/categories/GeneralSettings.tsx
git commit -m "feat: add General settings category"
```

---

### Task 11: Appearance Settings Category

**Files:**
- Create: `src/renderer/src/components/settings/categories/AppearanceSettings.tsx`

- [ ] **Step 1: Create AppearanceSettings with theme picker**

```typescript
// src/renderer/src/components/settings/categories/AppearanceSettings.tsx
import { Stack, Grid, Box, Divider, Flex, Button, Heading, Text } from '@/primitives'
import { Select, ColorInput } from '@/primitives'
import { useSettingsStore } from '@/stores/settings'
import { useTheme } from '@/primitives'
import { SettingRow } from '../SettingRow'
import type { Theme } from '@shared/settings'

const themePreview: Record<string, { bg: string; sidebar: string; text: string; accent: string; label: string }> = {
  dark: { bg: '#1e1e2e', sidebar: '#313244', text: '#cdd6f4', accent: '#b4befe', label: 'Dark' },
  light: { bg: '#eff1f5', sidebar: '#ccd0da', text: '#4c4f69', accent: '#7287fd', label: 'Light' },
  midnight: { bg: '#0d1117', sidebar: '#161b22', text: '#c9d1d9', accent: '#a78bfa', label: 'Midnight' },
  dracula: { bg: '#282a36', sidebar: '#44475a', text: '#f8f8f2', accent: '#bd93f9', label: 'Dracula' },
  nord: { bg: '#2e3440', sidebar: '#3b4252', text: '#eceff4', accent: '#88c0d0', label: 'Nord' },
  solarized: { bg: '#002b36', sidebar: '#073642', text: '#839496', accent: '#268bd2', label: 'Solarized' },
  catppuccin: { bg: '#1e1e2e', sidebar: '#313244', text: '#cdd6f4', accent: '#f5c2e7', label: 'Catppuccin' },
}

export function AppearanceSettings() {
  const appearance = useSettingsStore((s) => s.settings.appearance)
  const setSetting = useSettingsStore((s) => s.set)
  const resetCategory = useSettingsStore((s) => s.resetCategory)
  const { theme: currentTheme, setTheme } = useTheme()

  return (
    <Stack gap="md">
      <div>
        <Heading level={4}>Appearance</Heading>
        <Text size="xs" color="muted" className="mt-1">Customize how dbstudio looks and feels</Text>
      </div>

      {/* Theme Picker */}
      <div>
        <Text size="sm" color="primary" className="mb-1">Theme</Text>
        <Text size="xs" color="muted" className="mb-3">Choose a color theme for the application</Text>
        <Grid columns={4} gap="sm">
          {Object.entries(themePreview).map(([key, preview]) => (
            <button
              key={key}
              onClick={() => setTheme(key as Theme)}
              className={`rounded-lg border-2 p-2.5 transition-colors cursor-pointer ${
                currentTheme === key
                  ? 'border-accent'
                  : 'border-transparent hover:border-border-default'
              }`}
              style={{ background: preview.bg }}
            >
              <Flex gap="xs" className="mb-2 h-1.5">
                <div className="flex-1 rounded-sm" style={{ background: preview.sidebar }} />
                <div className="flex-[2] rounded-sm" style={{ background: preview.bg, border: `1px solid ${preview.sidebar}` }} />
              </Flex>
              <Flex gap="xs" className="mb-1.5">
                <div className="h-0.5 w-3 rounded-sm" style={{ background: preview.text }} />
                <div className="h-0.5 w-5 rounded-sm" style={{ background: preview.sidebar }} />
              </Flex>
              <Flex gap="xs">
                <div className="h-0.5 w-2 rounded-sm" style={{ background: preview.accent }} />
                <div className="h-0.5 w-4 rounded-sm" style={{ background: preview.sidebar }} />
              </Flex>
              <Text size="xs" className="mt-2 text-center" style={{ color: preview.text }}>
                {preview.label} {currentTheme === key ? '✓' : ''}
              </Text>
            </button>
          ))}
        </Grid>
      </div>

      <Divider />

      <SettingRow label="UI Density" description="Controls spacing and padding across the interface">
        <Select
          value={appearance.uiDensity}
          onChange={(e) => setSetting('appearance.uiDensity', e.target.value)}
          size="sm"
          className="w-32"
        >
          <option value="compact">Compact</option>
          <option value="comfortable">Comfortable</option>
          <option value="spacious">Spacious</option>
        </Select>
      </SettingRow>

      <SettingRow label="Sidebar Position" description="Place the sidebar on the left or right side">
        <Select
          value={appearance.sidebarPosition}
          onChange={(e) => setSetting('appearance.sidebarPosition', e.target.value)}
          size="sm"
          className="w-32"
        >
          <option value="left">Left</option>
          <option value="right">Right</option>
        </Select>
      </SettingRow>

      <SettingRow label="Accent Color" description="Highlight color for active elements and focus rings">
        <ColorInput
          value={appearance.accentColor}
          onChange={(v) => setSetting('appearance.accentColor', v)}
          size="sm"
        />
      </SettingRow>

      <Divider />

      <Flex justify="end">
        <Button variant="outline" size="sm" onClick={() => resetCategory('appearance')}>
          Reset to Defaults
        </Button>
      </Flex>
    </Stack>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/settings/categories/AppearanceSettings.tsx
git commit -m "feat: add Appearance settings with visual theme picker"
```

---

### Task 12: Editor Settings Category

**Files:**
- Create: `src/renderer/src/components/settings/categories/EditorSettings.tsx`

- [ ] **Step 1: Create EditorSettings**

```typescript
// src/renderer/src/components/settings/categories/EditorSettings.tsx
import { Stack, Divider, Flex, Button, Heading, Text } from '@/primitives'
import { NumberInput, Select, Switch } from '@/primitives'
import { useSettingsStore } from '@/stores/settings'
import { SettingRow } from '../SettingRow'

export function EditorSettings() {
  const editor = useSettingsStore((s) => s.settings.editor)
  const setSetting = useSettingsStore((s) => s.set)
  const resetCategory = useSettingsStore((s) => s.resetCategory)

  return (
    <Stack gap="md">
      <div>
        <Heading level={4}>Editor</Heading>
        <Text size="xs" color="muted" className="mt-1">Configure the SQL editor</Text>
      </div>

      <SettingRow label="Font Size" description="Editor font size in pixels">
        <NumberInput
          value={editor.fontSize}
          onChange={(v) => setSetting('editor.fontSize', v)}
          min={10}
          max={24}
          size="sm"
          className="w-20"
        />
      </SettingRow>

      <SettingRow label="Font Family" description="Font used in the editor">
        <Select
          value={editor.fontFamily}
          onChange={(e) => setSetting('editor.fontFamily', e.target.value)}
          size="sm"
          className="w-48"
        >
          <option value="'JetBrains Mono', 'SF Mono', 'Fira Code', monospace">JetBrains Mono</option>
          <option value="'SF Mono', 'Fira Code', monospace">SF Mono</option>
          <option value="'Fira Code', monospace">Fira Code</option>
          <option value="'Cascadia Code', monospace">Cascadia Code</option>
          <option value="monospace">System Monospace</option>
        </Select>
      </SettingRow>

      <SettingRow label="Tab Size" description="Number of spaces per tab">
        <Select
          value={editor.tabSize}
          onChange={(e) => setSetting('editor.tabSize', parseInt(e.target.value))}
          size="sm"
          className="w-24"
        >
          <option value={2}>2 spaces</option>
          <option value={4}>4 spaces</option>
        </Select>
      </SettingRow>

      <SettingRow label="Cursor Style" description="Shape of the editor cursor">
        <Select
          value={editor.cursorStyle}
          onChange={(e) => setSetting('editor.cursorStyle', e.target.value)}
          size="sm"
          className="w-28"
        >
          <option value="line">Line</option>
          <option value="block">Block</option>
          <option value="underline">Underline</option>
        </Select>
      </SettingRow>

      <Divider />

      <SettingRow label="Word Wrap" description="Wrap long lines in the editor">
        <Switch label="Word wrap" checked={editor.wordWrap} onChange={(e) => setSetting('editor.wordWrap', e.target.checked)} />
      </SettingRow>

      <SettingRow label="Minimap" description="Show code minimap on the right side">
        <Switch label="Minimap" checked={editor.minimap} onChange={(e) => setSetting('editor.minimap', e.target.checked)} />
      </SettingRow>

      <SettingRow label="Line Numbers" description="Show line numbers in the gutter">
        <Switch label="Line numbers" checked={editor.lineNumbers} onChange={(e) => setSetting('editor.lineNumbers', e.target.checked)} />
      </SettingRow>

      <SettingRow label="Bracket Matching" description="Highlight matching brackets">
        <Switch label="Bracket matching" checked={editor.bracketMatching} onChange={(e) => setSetting('editor.bracketMatching', e.target.checked)} />
      </SettingRow>

      <SettingRow label="Ligatures" description="Enable font ligatures (e.g., => becomes ⇒)">
        <Switch label="Ligatures" checked={editor.ligatures} onChange={(e) => setSetting('editor.ligatures', e.target.checked)} />
      </SettingRow>

      <Divider />

      <Flex justify="end">
        <Button variant="outline" size="sm" onClick={() => resetCategory('editor')}>
          Reset to Defaults
        </Button>
      </Flex>
    </Stack>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/settings/categories/EditorSettings.tsx
git commit -m "feat: add Editor settings category"
```

---

### Task 13: Connection, Data Display, Keybindings, Plugin Settings Categories

**Files:**
- Create: `src/renderer/src/components/settings/categories/ConnectionSettings.tsx`
- Create: `src/renderer/src/components/settings/categories/DataDisplaySettings.tsx`
- Create: `src/renderer/src/components/settings/categories/KeybindingsSettings.tsx`
- Create: `src/renderer/src/components/settings/categories/PluginSettings.tsx`

- [ ] **Step 1: Create ConnectionSettings**

```typescript
// src/renderer/src/components/settings/categories/ConnectionSettings.tsx
import { Stack, Divider, Flex, Button, Heading, Text } from '@/primitives'
import { NumberInput, Select, Switch } from '@/primitives'
import { useSettingsStore } from '@/stores/settings'
import { SettingRow } from '../SettingRow'

export function ConnectionSettings() {
  const conn = useSettingsStore((s) => s.settings.connectionDefaults)
  const setSetting = useSettingsStore((s) => s.set)
  const resetCategory = useSettingsStore((s) => s.resetCategory)

  return (
    <Stack gap="md">
      <div>
        <Heading level={4}>Connections</Heading>
        <Text size="xs" color="muted" className="mt-1">Default settings for new database connections</Text>
      </div>

      <SettingRow label="Auto Reconnect" description="Automatically reconnect when a connection is lost">
        <Switch label="Auto reconnect" checked={conn.autoReconnect} onChange={(e) => setSetting('connectionDefaults.autoReconnect', e.target.checked)} />
      </SettingRow>

      <SettingRow label="Default SSL Mode" description="SSL mode for new connections">
        <Select
          value={conn.defaultSslMode}
          onChange={(e) => setSetting('connectionDefaults.defaultSslMode', e.target.value)}
          size="sm"
          className="w-28"
        >
          <option value="disable">Disable</option>
          <option value="prefer">Prefer</option>
          <option value="require">Require</option>
        </Select>
      </SettingRow>

      <Divider />

      <Text size="xs" color="muted" className="uppercase tracking-wider font-semibold">Default Ports</Text>

      {Object.entries(conn.defaultPorts).map(([dbType, port]) => (
        <SettingRow key={dbType} label={dbType} description={`Default port for ${dbType} connections`}>
          <NumberInput
            value={port}
            onChange={(v) => setSetting(`connectionDefaults.defaultPorts.${dbType}`, v)}
            min={1}
            max={65535}
            size="sm"
            className="w-24"
          />
        </SettingRow>
      ))}

      <Divider />

      <Flex justify="end">
        <Button variant="outline" size="sm" onClick={() => resetCategory('connectionDefaults')}>
          Reset to Defaults
        </Button>
      </Flex>
    </Stack>
  )
}
```

- [ ] **Step 2: Create DataDisplaySettings**

```typescript
// src/renderer/src/components/settings/categories/DataDisplaySettings.tsx
import { Stack, Divider, Flex, Button, Heading, Text } from '@/primitives'
import { Input, Select, NumberInput } from '@/primitives'
import { useSettingsStore } from '@/stores/settings'
import { SettingRow } from '../SettingRow'

export function DataDisplaySettings() {
  const display = useSettingsStore((s) => s.settings.dataDisplay)
  const setSetting = useSettingsStore((s) => s.set)
  const resetCategory = useSettingsStore((s) => s.resetCategory)

  return (
    <Stack gap="md">
      <div>
        <Heading level={4}>Data Display</Heading>
        <Text size="xs" color="muted" className="mt-1">How query results and table data are displayed</Text>
      </div>

      <SettingRow label="Null Display" description="Text shown for NULL values in results">
        <Input
          value={display.nullDisplay}
          onChange={(e) => setSetting('dataDisplay.nullDisplay', e.target.value)}
          size="sm"
          className="w-24"
        />
      </SettingRow>

      <SettingRow label="Date Format" description="How date values are formatted">
        <Select
          value={display.dateFormat}
          onChange={(e) => setSetting('dataDisplay.dateFormat', e.target.value)}
          size="sm"
          className="w-28"
        >
          <option value="iso">ISO 8601</option>
          <option value="locale">Locale</option>
          <option value="custom">Custom</option>
        </Select>
      </SettingRow>

      <SettingRow label="Number Format" description="How numeric values are formatted">
        <Select
          value={display.numberFormat}
          onChange={(e) => setSetting('dataDisplay.numberFormat', e.target.value)}
          size="sm"
          className="w-28"
        >
          <option value="raw">Raw</option>
          <option value="locale">Locale</option>
        </Select>
      </SettingRow>

      <SettingRow label="Max Column Width" description="Maximum width in pixels for result columns">
        <NumberInput
          value={display.maxColumnWidth}
          onChange={(v) => setSetting('dataDisplay.maxColumnWidth', v)}
          min={100}
          max={800}
          step={50}
          size="sm"
          className="w-24"
        />
      </SettingRow>

      <Divider />

      <Flex justify="end">
        <Button variant="outline" size="sm" onClick={() => resetCategory('dataDisplay')}>
          Reset to Defaults
        </Button>
      </Flex>
    </Stack>
  )
}
```

- [ ] **Step 3: Create KeybindingsSettings**

```typescript
// src/renderer/src/components/settings/categories/KeybindingsSettings.tsx
import { useState, useMemo } from 'react'
import { Stack, Heading, Text, Divider } from '@/primitives'
import { SearchInput } from '@/primitives'
import { Table, Kbd } from '@/primitives'
import { useSettingsStore } from '@/stores/settings'

export function KeybindingsSettings() {
  const keybindings = useSettingsStore((s) => s.settings.keybindings)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search) return keybindings
    const q = search.toLowerCase()
    return keybindings.filter(
      (kb) => kb.label.toLowerCase().includes(q) || kb.category.toLowerCase().includes(q)
    )
  }, [keybindings, search])

  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {}
    for (const kb of filtered) {
      if (!groups[kb.category]) groups[kb.category] = []
      groups[kb.category].push(kb)
    }
    return groups
  }, [filtered])

  const isMac = navigator.platform.includes('Mac')

  return (
    <Stack gap="md">
      <div>
        <Heading level={4}>Keybindings</Heading>
        <Text size="xs" color="muted" className="mt-1">Keyboard shortcuts for common actions</Text>
      </div>

      <SearchInput
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onClear={() => setSearch('')}
        placeholder="Search keybindings..."
        size="sm"
      />

      {Object.entries(grouped).map(([category, bindings]) => (
        <div key={category}>
          <Text size="xs" color="muted" className="uppercase tracking-wider font-semibold mb-2">
            {category}
          </Text>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Action</Table.Head>
                <Table.Head>Shortcut</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {bindings.map((kb) => (
                <Table.Row key={kb.id}>
                  <Table.Cell>
                    <Text size="sm">{kb.label}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    {kb.keys
                      .filter((k) => isMac ? k.startsWith('Cmd') : k.startsWith('Ctrl'))
                      .map((k, i) => (
                        <Kbd key={i}>{k}</Kbd>
                      ))}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
          <Divider className="my-2" />
        </div>
      ))}
    </Stack>
  )
}
```

- [ ] **Step 4: Create PluginSettings**

```typescript
// src/renderer/src/components/settings/categories/PluginSettings.tsx
import { useState, useEffect } from 'react'
import { Stack, Flex, Divider, Heading, Text } from '@/primitives'
import { Switch } from '@/primitives'
import { Spinner } from '@/primitives'

interface PluginInfo {
  name: string
  displayName: string
  version: string
  description: string
  bundled: boolean
  status: { state: string; error?: string }
  contributions: string[]
}

export function PluginSettings() {
  const [plugins, setPlugins] = useState<PluginInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.electronAPI.invoke('plugins:list').then((list) => {
      setPlugins(list)
      setLoading(false)
    })
  }, [])

  const handleToggle = async (name: string, active: boolean) => {
    if (active) {
      await window.electronAPI.invoke('plugins:activate', name)
    } else {
      await window.electronAPI.invoke('plugins:deactivate', name)
    }
    const list = await window.electronAPI.invoke('plugins:list')
    setPlugins(list)
  }

  if (loading) {
    return (
      <Flex align="center" justify="center" className="py-12">
        <Spinner />
      </Flex>
    )
  }

  return (
    <Stack gap="md">
      <div>
        <Heading level={4}>Plugins</Heading>
        <Text size="xs" color="muted" className="mt-1">Manage installed extensions</Text>
      </div>

      {plugins.map((plugin) => (
        <div key={plugin.name}>
          <Flex direction="row" align="start" justify="between" className="py-2">
            <div className="flex-1 min-w-0 mr-4">
              <Flex direction="row" align="center" gap="sm">
                <Text size="sm" weight="semibold">{plugin.displayName}</Text>
                <Text size="xs" color="muted">v{plugin.version}</Text>
                {plugin.bundled && (
                  <Text size="xs" color="accent" className="bg-accent/10 px-1.5 py-0.5 rounded">Bundled</Text>
                )}
              </Flex>
              <Text size="xs" color="secondary" className="mt-0.5">{plugin.description}</Text>
              {plugin.status.error && (
                <Text size="xs" color="error" className="mt-1">{plugin.status.error}</Text>
              )}
            </div>
            <Switch
              label={`Toggle ${plugin.displayName}`}
              checked={plugin.status.state === 'active' || plugin.status.state === 'degraded'}
              onChange={(e) => handleToggle(plugin.name, e.target.checked)}
            />
          </Flex>
          <Divider />
        </div>
      ))}
    </Stack>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/settings/categories/
git commit -m "feat: add Connection, DataDisplay, Keybindings, and Plugin settings categories"
```

---

### Task 14: Rewrite SettingsPanel to Use SettingsLayout

**Files:**
- Modify: `src/renderer/src/components/settings/SettingsPanel.tsx`

- [ ] **Step 1: Replace SettingsPanel content**

Replace the full content of `SettingsPanel.tsx`:

```typescript
// src/renderer/src/components/settings/SettingsPanel.tsx
import { SettingsLayout } from './SettingsLayout'

export function SettingsPanel() {
  return <SettingsLayout />
}
```

- [ ] **Step 2: Verify it compiles and renders**

Run: `npx tsc --noEmit 2>&1 | head -20`
Then: `pnpm dev` — navigate to Settings panel and verify it renders.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/settings/SettingsPanel.tsx
git commit -m "refactor: rewrite SettingsPanel to use new SettingsLayout"
```

---

### Task 15: Wire QueryEditor to Read Settings

**Files:**
- Modify: `src/renderer/src/components/query/QueryEditor.tsx`

- [ ] **Step 1: Replace hardcoded editor options with settings**

In `QueryEditor.tsx`, add the settings store import and read editor settings:

```typescript
import { useSettingsStore } from '@/stores/settings'
```

Inside the component, add:

```typescript
const editorSettings = useSettingsStore((s) => s.settings.editor)
```

Replace the hardcoded `options` prop on `<Editor>`:

```typescript
options={{
  minimap: { enabled: editorSettings.minimap },
  fontSize: editorSettings.fontSize,
  fontFamily: editorSettings.fontFamily,
  lineNumbers: editorSettings.lineNumbers ? 'on' : 'off',
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: editorSettings.tabSize,
  wordWrap: editorSettings.wordWrap ? 'on' : 'off',
  cursorStyle: editorSettings.cursorStyle,
  fontLigatures: editorSettings.ligatures,
  matchBrackets: editorSettings.bracketMatching ? 'always' : 'never',
  padding: { top: 8, bottom: 8 },
  renderLineHighlight: 'line',
  suggestOnTriggerCharacters: true,
  quickSuggestions: true,
  scrollbar: {
    verticalScrollbarSize: 8,
    horizontalScrollbarSize: 8,
  },
}}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Test in dev mode**

Run: `pnpm dev`
Expected: Change font size in Settings → Editor → verify the query editor updates

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/query/QueryEditor.tsx
git commit -m "feat: QueryEditor reads settings from settings store"
```

---

## Part 2: Component Migration

### Task 16: Migrate NotificationBell

**Files:**
- Modify: `src/renderer/src/components/shell/NotificationBell.tsx`

- [ ] **Step 1: Replace raw button with IconButton + Badge**

Replace the full content:

```typescript
import { Bell } from 'lucide-react'
import { useNotificationsStore } from '@/stores/notifications'
import { NotificationPanel } from './NotificationPanel'
import { Box, IconButton, Badge } from '@/primitives'

export function NotificationBell() {
  const { panelOpen, togglePanel, unreadCount } = useNotificationsStore()
  const unread = unreadCount()

  return (
    <Box className="relative">
      <IconButton
        onClick={togglePanel}
        variant={panelOpen ? 'outline' : 'ghost'}
        size="sm"
        aria-label="Notifications"
        className={panelOpen ? 'border-accent/30 bg-accent/10' : ''}
      >
        <Bell size={12} />
      </IconButton>
      {unread > 0 && (
        <Badge
          variant="error"
          size="sm"
          className="absolute -right-1 -top-1 h-[14px] min-w-[14px] px-0.5 text-[7px]"
        >
          {unread > 9 ? '9+' : unread}
        </Badge>
      )}
      <NotificationPanel />
    </Box>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/shell/NotificationBell.tsx
git commit -m "refactor: migrate NotificationBell to IconButton + Badge primitives"
```

---

### Task 17: Migrate NotificationItem

**Files:**
- Modify: `src/renderer/src/components/shell/NotificationItem.tsx`

- [ ] **Step 1: Replace div role=button with Button primitive**

Replace the full content:

```typescript
import { Flex, Box, Text, Button } from '@/primitives'
import { cn } from '@/primitives/utils/cn'
import type { Notification } from '@/stores/notifications'

const dotColorMap: Record<Notification['type'], string> = {
  error: 'bg-error',
  warning: 'bg-warning',
  info: 'bg-info',
  success: 'bg-success',
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface NotificationItemProps {
  notification: Notification
  onClick: (id: string) => void
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const { id, type, message, source, timestamp, read } = notification

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onClick(id)}
      className={cn(
        'w-full justify-start rounded-none px-3.5 py-1.5 h-auto border-b border-white/[0.03]',
        read && 'opacity-60'
      )}
    >
      <Flex direction="row" align="start" gap="sm" className="w-full">
        <Box
          className={cn(
            'mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full',
            dotColorMap[type],
            read && 'opacity-40'
          )}
        />
        <Box className="min-w-0 flex-1 text-left">
          <Text size="xs" color="primary" truncate>{message}</Text>
          <Text size="xs" color="muted" className="mt-0.5 text-[9px]">
            {source && <span>{source.label} · </span>}
            {formatRelativeTime(timestamp)}
          </Text>
        </Box>
      </Flex>
    </Button>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/shell/NotificationItem.tsx
git commit -m "refactor: migrate NotificationItem from div role=button to Button primitive"
```

---

### Task 18: Migrate NotificationPanel

**Files:**
- Modify: `src/renderer/src/components/shell/NotificationPanel.tsx`

- [ ] **Step 1: Replace raw HTML with primitives**

Replace the full content:

```typescript
import { useEffect, useRef } from 'react'
import { useNotificationsStore } from '@/stores/notifications'
import { NotificationItem } from './NotificationItem'
import { Bell, X } from 'lucide-react'
import { Box, Flex, Text, Button, IconButton, Divider } from '@/primitives'
import { EmptyState } from '@/primitives'
import { cn } from '@/primitives/utils/cn'

const categoryOrder = ['error', 'warning', 'info', 'success'] as const

const categoryLabels: Record<string, string> = {
  error: 'Errors',
  warning: 'Warnings',
  info: 'Info',
  success: 'Success',
}

const categoryColors: Record<string, string> = {
  error: 'text-error',
  warning: 'text-warning',
  info: 'text-info',
  success: 'text-success',
}

export function NotificationPanel() {
  const { notifications, panelOpen, closePanel, markRead, markAllRead, unreadCount } =
    useNotificationsStore()
  const panelRef = useRef<HTMLDivElement>(null)
  const unread = unreadCount()

  useEffect(() => {
    if (!panelOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [panelOpen, closePanel])

  useEffect(() => {
    if (!panelOpen) return
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        closePanel()
      }
    }
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handleClick)
    }, 0)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('mousedown', handleClick)
    }
  }, [panelOpen, closePanel])

  if (!panelOpen) return null

  const grouped = categoryOrder
    .map((cat) => ({
      category: cat,
      items: notifications.filter((n) => n.type === cat),
    }))
    .filter((g) => g.items.length > 0)

  const handleItemClick = (id: string) => {
    markRead(id)
  }

  return (
    <Box
      ref={panelRef}
      className={cn(
        'fixed bottom-9.5 right-0 w-80 max-h-87.5 overflow-y-auto z-50',
        'bg-bg-secondary border border-border-default border-b-0',
        'rounded-t-lg shadow-[0_-4px_24px_rgba(0,0,0,0.4)]',
        'animate-in slide-in-from-bottom-2 duration-150'
      )}
    >
      <Flex direction="row" align="center" justify="between" className="px-3.5 py-2.5 border-b border-border-default">
        <Flex direction="row" align="center" gap="sm">
          <Text size="xs" weight="semibold">Notifications</Text>
          {unread > 0 && (
            <Text size="xs" color="error" className="rounded-full bg-error/15 px-1.5 py-px text-[9px] font-semibold">
              {unread} new
            </Text>
          )}
        </Flex>
        <Flex direction="row" align="center" gap="sm">
          {unread > 0 && (
            <Button variant="ghost" size="xs" onClick={markAllRead} className="text-[10px] text-accent">
              Mark all read
            </Button>
          )}
          <IconButton variant="ghost" size="xs" onClick={closePanel} aria-label="Close notifications">
            <X size={12} />
          </IconButton>
        </Flex>
      </Flex>

      {grouped.length === 0 ? (
        <EmptyState
          icon={<Bell size={24} />}
          title="All caught up"
          description="No new notifications"
          className="py-8"
        />
      ) : (
        grouped.map((group) => (
          <Box key={group.category}>
            <Text
              size="xs"
              className={cn('px-3.5 pt-2 pb-0.5 text-[9px] uppercase tracking-wider font-semibold', categoryColors[group.category])}
            >
              {categoryLabels[group.category]}
            </Text>
            {group.items.map((n) => (
              <NotificationItem key={n.id} notification={n} onClick={handleItemClick} />
            ))}
          </Box>
        ))
      )}
    </Box>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/shell/NotificationPanel.tsx
git commit -m "refactor: migrate NotificationPanel to primitives"
```

---

### Task 19: Migrate ConnectionCard

**Files:**
- Modify: `src/renderer/src/components/shell/ConnectionCard.tsx`

- [ ] **Step 1: Replace raw button with Button primitive**

Replace the full content:

```typescript
import { Button, Flex, Text } from '@/primitives'
import { cn } from '@/primitives/utils/cn'

const DB_ABBREVIATIONS: Record<string, string> = {
  postgresql: 'PG',
  mysql: 'MY',
  sqlite: 'SL',
  mongodb: 'MG',
  redis: 'RD',
}

const DB_TYPE_COLORS: Record<string, string> = {
  postgresql: 'text-accent',
  mysql: 'text-warning',
  sqlite: 'text-info',
  mongodb: 'text-[#ff8c6b]',
  redis: 'text-error',
}

interface ConnectionCardProps {
  isConnected: boolean
  isError: boolean
  dbType: string | null
  dbName: string | null
  schema: string | null
  isOpen: boolean
  onClick: () => void
}

export function ConnectionCard({
  isConnected,
  isError,
  dbType,
  dbName,
  schema,
  isOpen,
  onClick,
}: ConnectionCardProps) {
  const abbreviation = dbType
    ? (DB_ABBREVIATIONS[dbType] ?? dbType.slice(0, 2).toUpperCase())
    : null
  const typeColor = dbType
    ? (DB_TYPE_COLORS[dbType] ?? 'text-text-primary')
    : 'text-text-tertiary'
  const isDisconnected = !isConnected && !isError

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        'gap-1.5 px-2.5 py-1 text-[10px]',
        isError
          ? 'border border-error/20 bg-error/8 hover:bg-error/12'
          : isOpen
            ? 'border border-accent/30 bg-accent/10'
            : 'border border-border-default bg-bg-tertiary',
        isDisconnected && 'opacity-60'
      )}
    >
      <div
        className={cn(
          'h-[7px] w-[7px] shrink-0 rounded-full',
          isError && 'bg-error shadow-[0_0_4px_rgba(255,95,87,0.4)]',
          isConnected && !isError && 'bg-success shadow-[0_0_4px_rgba(40,200,64,0.4)]',
          isDisconnected && 'bg-text-tertiary'
        )}
      />

      {isConnected || isError ? (
        <>
          <Text size="xs" weight="semibold" className={isError ? 'text-error' : typeColor}>
            {abbreviation}
          </Text>
          <Text size="xs" color={isError ? 'error' : 'primary'}>{dbName}</Text>
          {isError ? (
            <Text size="xs" className="text-error/60">Connection lost</Text>
          ) : (
            schema && <Text size="xs" color="muted">/ {schema}</Text>
          )}
        </>
      ) : (
        <Text size="xs" color="muted">No connection</Text>
      )}

      <Text size="xs" className={cn('ml-0.5 text-[8px]', isOpen ? 'text-accent' : 'text-text-disabled')}>
        {isOpen ? '▴' : '▾'}
      </Text>
    </Button>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/shell/ConnectionCard.tsx
git commit -m "refactor: migrate ConnectionCard to Button + Text primitives"
```

---

### Task 20: Migrate ConnectionSwitcher

**Files:**
- Modify: `src/renderer/src/components/shell/ConnectionSwitcher.tsx`

- [ ] **Step 1: Read the current file to understand the full structure**

Run: Read `src/renderer/src/components/shell/ConnectionSwitcher.tsx` completely before making changes.

- [ ] **Step 2: Replace raw HTML elements with primitives**

Key replacements in the file:
- Replace `<div role="button">` (the trigger) with `<Button variant="ghost">` from primitives
- Replace raw `<input>` (search filter) with `<SearchInput>` from primitives
- Replace `<button>` for "New connection" with `<Button>` from primitives
- Replace layout `<div>`s with `<Box>`, `<Flex>`, `<ScrollArea>`
- Replace `<span>`s for text with `<Text>` primitive

Import primitives:
```typescript
import { Box, Flex, ScrollArea, Text, Button, Divider } from '@/primitives'
import { SearchInput } from '@/primitives'
```

Replace throughout — maintain the same logic, just swap the elements. Refer to the current file for all occurrences.

- [ ] **Step 3: Verify it compiles and renders**

Run: `npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/shell/ConnectionSwitcher.tsx
git commit -m "refactor: migrate ConnectionSwitcher to primitives"
```

---

### Task 21: Migrate ConnectionForm Custom Dropdown

**Files:**
- Modify: `src/renderer/src/components/connections/ConnectionForm.tsx`

- [ ] **Step 1: Read the current file**

Read `src/renderer/src/components/connections/ConnectionForm.tsx` fully before modifying.

- [ ] **Step 2: Replace custom dropdown with Select primitive**

Find the custom dropdown implementation (the manual `<div>` dropdown with positioning and keyboard handling) and replace it with:

```typescript
<Select
  value={selectedDbType}
  onChange={(e) => setSelectedDbType(e.target.value)}
  size="sm"
>
  {dbTypes.map(type => (
    <option key={type} value={type}>{type}</option>
  ))}
</Select>
```

Import `Select` from primitives if not already imported.

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/connections/ConnectionForm.tsx
git commit -m "refactor: replace custom dropdown with Select primitive in ConnectionForm"
```

---

### Task 22: Migrate Feedback Components (ExportModal, ImportModal, ConnectionTestButton)

**Files:**
- Modify: `src/renderer/src/components/export/ExportModal.tsx`
- Modify: `src/renderer/src/components/import/ImportModal.tsx`
- Modify: `src/renderer/src/components/connections/ConnectionTestButton.tsx`

- [ ] **Step 1: Read all three files**

Read each file to understand the feedback patterns.

- [ ] **Step 2: Migrate ExportModal feedback**

In `ExportModal.tsx`, replace manual Text-based result feedback with `Alert` primitive:

```typescript
import { Alert } from '@/primitives'

// Replace the result feedback section with:
{result && (
  <Alert variant={result.error ? 'error' : 'success'}>
    {result.error || result.message}
  </Alert>
)}
```

- [ ] **Step 3: Migrate ImportModal feedback**

Same pattern as ExportModal — replace manual feedback text with `Alert`.

- [ ] **Step 4: Migrate ConnectionTestButton**

Replace the manual icon+text status display. The component likely shows success/error states inline. Replace with `Text` using proper `color` prop:

```typescript
import { Text, Spinner } from '@/primitives'

// For testing state:
<Spinner size="sm" />

// For success:
<Text size="xs" color="success">Connected successfully</Text>

// For error:
<Text size="xs" color="error">{error}</Text>
```

- [ ] **Step 5: Verify all compile**

Run: `npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/components/export/ExportModal.tsx src/renderer/src/components/import/ImportModal.tsx src/renderer/src/components/connections/ConnectionTestButton.tsx
git commit -m "refactor: migrate feedback patterns to Alert/Text primitives"
```

---

### Task 23: Migrate CommandPalette to Modal Primitive

**Files:**
- Modify: `src/renderer/src/components/command-palette/CommandPalette.tsx`

- [ ] **Step 1: Read the current file**

Read `CommandPalette.tsx` fully.

- [ ] **Step 2: Replace custom backdrop + modal with Modal primitive**

Replace the custom `<div>` backdrop and modal container with `<Modal>`:

```typescript
import { Modal, Box, Flex, Text } from '@/primitives'
import { SearchInput } from '@/primitives'

// Replace the outer container:
<Modal open={isOpen} onClose={onClose}>
  <Box className="p-0">
    <SearchInput
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Type a command..."
      size="md"
      className="border-b border-border-default rounded-none"
    />
    {/* ... command list items ... */}
  </Box>
</Modal>
```

Replace any raw `<div>`s inside the command list with `<Flex>` and `<Text>`.

- [ ] **Step 3: Verify it compiles and test**

Run: `npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/command-palette/CommandPalette.tsx
git commit -m "refactor: migrate CommandPalette to Modal primitive"
```

---

### Task 24: Migrate SavedQueriesPanel and StatusBar

**Files:**
- Modify: `src/renderer/src/components/saved-queries/SavedQueriesPanel.tsx`
- Modify: `src/renderer/src/components/shell/StatusBar.tsx`

- [ ] **Step 1: Read both files**

Read each file fully.

- [ ] **Step 2: Migrate SavedQueriesPanel**

Replace custom hover divs and layout with primitives:
- Outer container → `<Stack>` or `<Box>`
- Each query item → `<Button variant="ghost">` with `<Text>` inside
- Section headers → `<Text>` primitive
- Icons stay from lucide-react

- [ ] **Step 3: Migrate StatusBar**

Replace custom layout divs:
- Main container `<div>` → `<Flex>`
- Section containers → `<Flex>` or `<Box>`
- Text spans → `<Text size="xs">`

Note: StatusBar is a thin bar at the bottom, so keep sizing compact. Only replace the container divs and text elements — don't change the overall structure.

- [ ] **Step 4: Verify both compile**

Run: `npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/saved-queries/SavedQueriesPanel.tsx src/renderer/src/components/shell/StatusBar.tsx
git commit -m "refactor: migrate SavedQueriesPanel and StatusBar to primitives"
```

---

### Task 25: Final Verification

- [ ] **Step 1: Type check the full project**

Run: `npx tsc --noEmit`
Expected: Zero errors

- [ ] **Step 2: Run all tests**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 3: Run dev mode and manual verification**

Run: `pnpm dev`
Expected:
- Settings panel opens with sidebar categories
- Theme switching works (click a theme card → app changes immediately)
- Editor settings apply to QueryEditor (change font size, verify)
- All migrated components render correctly
- No raw `<button>`, `<input>`, or `<div role="button">` in migrated files

- [ ] **Step 4: Grep for remaining raw HTML in components**

Run: `grep -rn '<button\|<input\|role="button"' src/renderer/src/components/ --include='*.tsx' | grep -v 'node_modules\|\.stories\.'`

Review any remaining hits — they should only be in third-party wrapper components (ResultsGrid, ERDiagram) or be part of primitive internals.

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address remaining issues from primitives consolidation"
```
