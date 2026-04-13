# Extensions Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain extensions sidebar panel with a minimal list + full main-area tabbed detail view, and add plugin icon support.

**Architecture:** Add `PluginDetailTab` to the tab union so clicking a plugin in the sidebar opens a rich detail view as a tab in the main content area. Add `icon` field to plugin manifests, serve icons as data URIs via IPC. The detail view uses compact header + sub-tabs (Overview, Contributions, Errors, Settings).

**Tech Stack:** React 19, Zustand, Electron IPC, Tailwind CSS, lucide-react, design system primitives (Card, Badge, Tabs, SearchInput, EmptyState, etc.)

---

### Task 1: Add `icon` to PluginManifest and IPC response

**Files:**
- Modify: `src/main/plugins/types.ts:4` (add icon field)
- Modify: `shared/ipc.ts:97-108` (add icon to return type)
- Modify: `src/main/ipc-handlers.ts:473-485` (include icon in response)

- [ ] **Step 1: Add `icon` field to `PluginManifest`**

In `src/main/plugins/types.ts`, add `icon?: string` to the `PluginManifest` interface:

```typescript
export interface PluginManifest {
  name: string
  version: string
  displayName: string
  description: string
  main: string
  icon?: string
  contributes: {
```

- [ ] **Step 2: Update IPC return type in `shared/ipc.ts`**

In `shared/ipc.ts`, add `icon?: string` to the `plugins:list` return type:

```typescript
  'plugins:list': {
    args: []
    return: {
      name: string
      displayName: string
      version: string
      description: string
      bundled: boolean
      icon?: string
      status: { state: string; error?: string; phase?: string; contributions?: string[] }
      contributions: string[]
    }[]
  }
```

- [ ] **Step 3: Serve icon as data URI in the IPC handler**

In `src/main/ipc-handlers.ts`, update the `plugins:list` handler. Add a helper function above the handler and include `icon` in the response:

```typescript
import { readFileSync, existsSync } from 'fs'
import { resolve, extname } from 'path'
```

Add this helper before the `plugins:list` handler:

```typescript
  function resolvePluginIcon(plugin: { manifest: { icon?: string }; path: string }): string | undefined {
    if (!plugin.manifest.icon || plugin.path === '<bundled>') return undefined
    const iconPath = resolve(plugin.path, plugin.manifest.icon)
    if (!existsSync(iconPath)) return undefined
    const ext = extname(iconPath).toLowerCase()
    const mime = ext === '.svg' ? 'image/svg+xml' : ext === '.png' ? 'image/png' : 'image/jpeg'
    const data = readFileSync(iconPath)
    return `data:${mime};base64,${data.toString('base64')}`
  }
```

Update the `plugins:list` handler to include the icon:

```typescript
  handle('plugins:list', async () => {
    return pluginCoordinator.getLoadedPlugins().map(p => ({
      name: p.manifest.name,
      displayName: p.manifest.displayName,
      version: p.manifest.version,
      description: p.manifest.description,
      bundled: p.path === '<bundled>',
      icon: resolvePluginIcon(p),
      status: p.status as { state: string; error?: string; phase?: string; contributions?: string[] },
      contributions: p.status.state === 'active' ? p.status.contributions
        : p.status.state === 'degraded' ? p.status.contributions
        : []
    }))
  })
```

- [ ] **Step 4: Verify the build compiles**

Run: `pnpm build 2>&1 | tail -20`
Expected: Build succeeds with no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/main/plugins/types.ts shared/ipc.ts src/main/ipc-handlers.ts
git commit -m "feat: add icon field to plugin manifest and IPC response"
```

---

### Task 2: Add `PluginDetailTab` type and tab store method

**Files:**
- Modify: `shared/types.ts:98` (add PluginDetailTab)
- Modify: `src/renderer/src/stores/tabs.ts` (add openPluginDetail)
- Modify: `src/renderer/src/components/shell/tab-bar/tab-icons.ts` (add icon mapping)

- [ ] **Step 1: Add `PluginDetailTab` to the Tab union**

In `shared/types.ts`, add the new interface before the `Tab` type and update the union:

```typescript
export interface ConnectionFormTab {
  id: string
  type: 'connection-form'
  title: string
  editingId?: string
}

export interface PluginDetailTab {
  id: string
  type: 'plugin-detail'
  title: string
  pluginName: string
}

export type Tab = QueryTab | TableTab | ErDiagramTab | ConnectionFormTab | PluginDetailTab
```

- [ ] **Step 2: Add `openPluginDetail` to the tabs store**

In `src/renderer/src/stores/tabs.ts`, update the import and add the method.

Update the import:

```typescript
import type { Tab, QueryTab, QueryResult, ConnectionFormTab, PluginDetailTab } from '@shared/types'
```

Add to the `TabsState` interface (after `openConnectionForm`):

```typescript
  openPluginDetail: (pluginName: string, displayName: string) => string
```

Add the implementation in the store (after `openConnectionForm`):

```typescript
  openPluginDetail: (pluginName: string, displayName: string) => {
    const id = `plugin-${pluginName}`
    const existing = get().tabs.find(t => t.id === id)
    if (existing) {
      set({ activeTabId: id })
      return id
    }
    const tab: PluginDetailTab = {
      id,
      type: 'plugin-detail',
      title: displayName,
      pluginName
    }
    set((s) => ({
      tabs: [...s.tabs, tab],
      activeTabId: id
    }))
    return id
  },
```

- [ ] **Step 3: Add icon mapping for `plugin-detail` tab type**

In `src/renderer/src/components/shell/tab-bar/tab-icons.ts`, add the Puzzle icon:

```typescript
import { FileText, GitFork, Plug, Table2, Puzzle, type LucideIcon } from 'lucide-react'
import type { Tab } from '@shared/types'

interface TabIconConfig {
  icon: LucideIcon
  className: string
}

const tabIconMap: Record<Tab['type'], TabIconConfig> = {
  query: { icon: FileText, className: 'text-blue-400' },
  'er-diagram': { icon: GitFork, className: 'text-purple-400' },
  'connection-form': { icon: Plug, className: 'text-yellow-400' },
  table: { icon: Table2, className: 'text-sky-400' },
  'plugin-detail': { icon: Puzzle, className: 'text-emerald-400' },
}

export function getTabIcon(type: Tab['type']): TabIconConfig {
  return tabIconMap[type]
}
```

- [ ] **Step 4: Verify the build compiles**

Run: `pnpm build 2>&1 | tail -20`
Expected: Build succeeds with no type errors.

- [ ] **Step 5: Commit**

```bash
git add shared/types.ts src/renderer/src/stores/tabs.ts src/renderer/src/components/shell/tab-bar/tab-icons.ts
git commit -m "feat: add PluginDetailTab type and openPluginDetail store method"
```

---

### Task 3: Add `plugins:get-settings` and `plugins:set-settings` IPC channels

**Files:**
- Modify: `shared/ipc.ts` (add new channels)
- Modify: `src/main/ipc-handlers.ts` (add handlers)

- [ ] **Step 1: Add IPC channel types**

In `shared/ipc.ts`, add these channels after the `plugins:errors` entry:

```typescript
  'plugins:get-settings': {
    args: [name: string]
    return: { schema: { key: string; title: string; type: string; default?: string | number | boolean }[]; values: Record<string, unknown> }
  }
  'plugins:set-setting': {
    args: [name: string, key: string, value: unknown]
    return: void
  }
```

- [ ] **Step 2: Add IPC handlers**

In `src/main/ipc-handlers.ts`, add handlers after the `plugins:errors` handler (after line 512):

```typescript
  handle('plugins:get-settings', async (name) => {
    const plugin = pluginCoordinator.getPlugin(name)
    if (!plugin) return { schema: [], values: {} }
    const schema = plugin.manifest.contributes.settings ?? []
    const pluginSettings = (configStore.getSettingsCategory('plugins') as Record<string, unknown>)?.[name] as Record<string, unknown> | undefined
    const values: Record<string, unknown> = {}
    for (const setting of schema) {
      const stored = pluginSettings?.[setting.key]
      values[setting.key] = stored !== undefined ? stored : setting.default
    }
    return { schema, values }
  })

  handle('plugins:set-setting', async (name, key, value) => {
    configStore.setSetting(`plugins.${name}.${key}`, value)
  })
```

- [ ] **Step 3: Verify the build compiles**

Run: `pnpm build 2>&1 | tail -20`
Expected: Build succeeds with no type errors.

- [ ] **Step 4: Commit**

```bash
git add shared/ipc.ts src/main/ipc-handlers.ts
git commit -m "feat: add plugins:get-settings and plugins:set-setting IPC channels"
```

---

### Task 4: Rewrite `ExtensionsPanel` as minimal sidebar list

**Files:**
- Modify: `src/renderer/src/components/plugins/ExtensionsPanel.tsx` (full rewrite)

- [ ] **Step 1: Rewrite ExtensionsPanel**

Replace the entire content of `src/renderer/src/components/plugins/ExtensionsPanel.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { FolderOpen, RefreshCw, Package } from 'lucide-react'
import { useTabsStore } from '@/stores/tabs'
import { useToastStore } from '@/stores/toast'
import { Stack, ScrollArea, Flex, Text, EmptyState, IconButton, Box, Modal, Input, Button, Spinner, SearchInput, cn } from '@/primitives'

interface PluginInfo {
  name: string
  displayName: string
  version: string
  description: string
  bundled: boolean
  icon?: string
  status: { state: string; error?: string; phase?: string; contributions?: string[] }
  contributions: string[]
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-400',
  degraded: 'bg-yellow-400',
  error: 'bg-red-400',
}

const ICON_GRADIENTS = [
  'from-blue-500 to-blue-600',
  'from-emerald-500 to-emerald-600',
  'from-purple-500 to-purple-600',
  'from-red-500 to-red-600',
  'from-amber-500 to-amber-600',
  'from-cyan-500 to-cyan-600',
  'from-pink-500 to-pink-600',
  'from-indigo-500 to-indigo-600',
]

function hashToIndex(str: string, max: number): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % max
}

function PluginIcon({ plugin, size = 28 }: { plugin: PluginInfo; size?: number }) {
  if (plugin.icon) {
    return (
      <img
        src={plugin.icon}
        alt={plugin.displayName}
        className="rounded-lg object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }
  const gradient = ICON_GRADIENTS[hashToIndex(plugin.name, ICON_GRADIENTS.length)]
  return (
    <Flex
      align="center"
      justify="center"
      className={`bg-gradient-to-br ${gradient} rounded-lg text-white font-bold shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.43 }}
    >
      {plugin.displayName.charAt(0).toUpperCase()}
    </Flex>
  )
}

export { PluginIcon }

export function ExtensionsPanel() {
  const [plugins, setPlugins] = useState<PluginInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showInstallPath, setShowInstallPath] = useState(false)
  const [installPath, setInstallPath] = useState('')
  const openPluginDetail = useTabsStore(s => s.openPluginDetail)
  const activeTabId = useTabsStore(s => s.activeTabId)
  const addToast = useToastStore(s => s.addToast)

  const loadPlugins = async () => {
    setLoading(true)
    const list = await window.electronAPI.invoke('plugins:list')
    setPlugins(list)
    setLoading(false)
  }

  useEffect(() => { loadPlugins() }, [])

  const handleInstallFromFolder = async () => {
    if (!installPath.trim()) return
    const result = await window.electronAPI.invoke('plugins:install-from-path', installPath.trim())
    if (result.success) {
      setShowInstallPath(false)
      setInstallPath('')
      await loadPlugins()
    } else {
      addToast({ type: 'error', title: 'Install failed', message: result.error })
    }
  }

  if (loading) {
    return (
      <Flex align="center" justify="center" className="py-8">
        <Spinner size="sm" />
      </Flex>
    )
  }

  const filtered = plugins.filter(p =>
    p.displayName.toLowerCase().includes(search.toLowerCase())
  )
  const bundledPlugins = filtered.filter(p => p.bundled)
  const installedPlugins = filtered.filter(p => !p.bundled)

  return (
    <Stack className="h-full">
      <Flex direction="row" align="center" gap="xs" className="px-2 py-1.5">
        <SearchInput
          size="xs"
          placeholder="Search extensions..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          className="flex-1"
        />
        <IconButton
          label="Install from folder"
          size="xs"
          variant="ghost"
          onClick={() => setShowInstallPath(true)}
          className="text-text-muted hover:text-text-primary shrink-0"
        >
          <FolderOpen size={12} />
        </IconButton>
        <IconButton
          label="Refresh"
          size="xs"
          variant="ghost"
          onClick={loadPlugins}
          className="text-text-muted hover:text-text-primary shrink-0"
        >
          <RefreshCw size={11} />
        </IconButton>
      </Flex>

      <ScrollArea direction="vertical" className="flex-1 px-1">
        {filtered.length === 0 && (
          <EmptyState
            icon={<Package size={24} className="text-text-muted" />}
            title={search ? 'No matches' : 'No extensions'}
            className="py-8"
          />
        )}

        {bundledPlugins.length > 0 && (
          <>
            <Box className="px-2 pt-2 pb-1">
              <Text size="xs" color="muted" weight="medium" className="text-[10px] uppercase tracking-wide">Built-in</Text>
            </Box>
            {bundledPlugins.map(plugin => (
              <PluginRow
                key={plugin.name}
                plugin={plugin}
                isSelected={activeTabId === `plugin-${plugin.name}`}
                onClick={() => openPluginDetail(plugin.name, plugin.displayName)}
              />
            ))}
          </>
        )}

        {installedPlugins.length > 0 && (
          <>
            <Box className="px-2 pt-3 pb-1">
              <Text size="xs" color="muted" weight="medium" className="text-[10px] uppercase tracking-wide">Installed</Text>
            </Box>
            {installedPlugins.map(plugin => (
              <PluginRow
                key={plugin.name}
                plugin={plugin}
                isSelected={activeTabId === `plugin-${plugin.name}`}
                onClick={() => openPluginDetail(plugin.name, plugin.displayName)}
              />
            ))}
          </>
        )}

        {filtered.length > 0 && (
          <Text size="xs" color="muted" className="text-[10px] text-center py-3 block">
            {plugins.length} extension{plugins.length !== 1 ? 's' : ''}
          </Text>
        )}
      </ScrollArea>

      <Modal open={showInstallPath} onClose={() => { setShowInstallPath(false); setInstallPath('') }} className="w-[420px] max-w-[90vw]">
        <Stack gap="md" className="p-4">
          <Text size="sm" weight="semibold">Install Plugin from Directory</Text>
          <Input
            value={installPath}
            onChange={e => setInstallPath(e.target.value)}
            placeholder="/path/to/plugin"
            size="sm"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleInstallFromFolder() }}
          />
        </Stack>
        <Flex direction="row" justify="end" gap="sm" className="px-4 py-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={() => { setShowInstallPath(false); setInstallPath('') }}>Cancel</Button>
          <Button variant="solid" size="sm" onClick={handleInstallFromFolder} disabled={!installPath.trim()}>Install</Button>
        </Flex>
      </Modal>
    </Stack>
  )
}

function PluginRow({ plugin, isSelected, onClick }: { plugin: PluginInfo; isSelected: boolean; onClick: () => void }) {
  const statusColor = STATUS_COLORS[plugin.status.state] ?? 'bg-gray-500'

  return (
    <Flex
      direction="row"
      align="center"
      gap="sm"
      onClick={onClick}
      className={cn(
        'px-2 py-1.5 rounded-md cursor-pointer transition-colors',
        isSelected
          ? 'bg-accent/10 border-l-2 border-l-accent'
          : 'hover:bg-white/5'
      )}
    >
      <PluginIcon plugin={plugin} size={28} />
      <Text size="xs" weight="medium" color="primary" truncate className="flex-1 min-w-0">
        {plugin.displayName}
      </Text>
      <Box className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColor}`} />
    </Flex>
  )
}
```

- [ ] **Step 2: Verify the dev server renders the sidebar correctly**

Run: `pnpm dev`
Check: Navigate to the Extensions panel in the sidebar. Verify the list shows plugin icons (letter avatars), names, and status dots. Clicking a plugin should not crash (the detail tab rendering isn't wired yet).

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/plugins/ExtensionsPanel.tsx
git commit -m "feat: rewrite ExtensionsPanel as minimal sidebar list"
```

---

### Task 5: Rewrite `PluginDetailView` as main-area tabbed view

**Files:**
- Modify: `src/renderer/src/components/plugins/PluginDetailView.tsx` (full rewrite)

- [ ] **Step 1: Rewrite PluginDetailView**

Replace the entire content of `src/renderer/src/components/plugins/PluginDetailView.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { Power, PowerOff, Trash2, CheckCircle, AlertTriangle, XCircle, Clock, PowerOff as PowerOffIcon, Settings } from 'lucide-react'
import { ConfirmDialog } from '@/components/shell/ConfirmDialog'
import { PluginIcon } from './ExtensionsPanel'
import { useToastStore } from '@/stores/toast'
import { Stack, ScrollArea, Flex, Text, Button, Badge, Box, Card, Code, Tabs, EmptyState, Alert, Input, Switch, PasswordInput } from '@/primitives'

interface PluginInfo {
  name: string
  displayName: string
  version: string
  description: string
  bundled: boolean
  icon?: string
  status: { state: string; error?: string; phase?: string; contributions?: string[] }
  contributions: string[]
}

interface ErrorRecord {
  timestamp: number
  error: string
  stack?: string
}

interface SettingSchema {
  key: string
  title: string
  type: string
  default?: string | number | boolean
}

interface Props {
  pluginName: string
}

const STATE_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'default'; icon: typeof CheckCircle }> = {
  active: { label: 'Active', variant: 'success', icon: CheckCircle },
  degraded: { label: 'Degraded', variant: 'warning', icon: AlertTriangle },
  error: { label: 'Error', variant: 'error', icon: XCircle },
  inactive: { label: 'Disabled', variant: 'default', icon: PowerOffIcon },
  discovered: { label: 'Discovered', variant: 'default', icon: Clock },
  validated: { label: 'Validated', variant: 'default', icon: Clock },
  resolved: { label: 'Ready', variant: 'default', icon: Clock },
  activating: { label: 'Loading...', variant: 'info' as 'default', icon: Clock },
}

const CONTRIBUTION_BADGE_VARIANTS: Record<string, 'accent' | 'info' | 'success' | 'warning' | 'error' | 'default'> = {
  driver: 'accent',
  command: 'info',
  panel: 'success',
  exporter: 'warning',
  importer: 'warning',
  theme: 'default',
  middleware: 'default',
  setting: 'default',
}

const DETAIL_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'contributions', label: 'Contributions' },
  { id: 'errors', label: 'Errors' },
  { id: 'settings', label: 'Settings' },
]

export function PluginDetailView({ pluginName }: Props) {
  const [plugin, setPlugin] = useState<PluginInfo | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [errors, setErrors] = useState<ErrorRecord[]>([])
  const [expandedError, setExpandedError] = useState<number | null>(null)
  const [showUninstallConfirm, setShowUninstallConfirm] = useState(false)
  const [settingsSchema, setSettingsSchema] = useState<SettingSchema[]>([])
  const [settingsValues, setSettingsValues] = useState<Record<string, unknown>>({})
  const addToast = useToastStore(s => s.addToast)

  const loadPlugin = async () => {
    const list: PluginInfo[] = await window.electronAPI.invoke('plugins:list')
    const found = list.find(p => p.name === pluginName)
    if (found) setPlugin(found)
  }

  useEffect(() => { loadPlugin() }, [pluginName])

  useEffect(() => {
    window.electronAPI.invoke('plugins:errors', pluginName)
      .then(setErrors)
      .catch(() => {})
  }, [pluginName])

  useEffect(() => {
    window.electronAPI.invoke('plugins:get-settings', pluginName)
      .then(({ schema, values }: { schema: SettingSchema[]; values: Record<string, unknown> }) => {
        setSettingsSchema(schema)
        setSettingsValues(values)
      })
      .catch(() => {})
  }, [pluginName])

  const handleActivate = async () => {
    const result = await window.electronAPI.invoke('plugins:activate', pluginName)
    if (!result.success) addToast({ type: 'error', title: 'Failed to activate', message: result.error })
    await loadPlugin()
  }

  const handleDeactivate = async () => {
    await window.electronAPI.invoke('plugins:deactivate', pluginName)
    await loadPlugin()
  }

  const handleUninstall = async () => {
    setShowUninstallConfirm(false)
    await window.electronAPI.invoke('plugins:uninstall', pluginName)
  }

  const handleSettingChange = async (key: string, value: unknown) => {
    setSettingsValues(prev => ({ ...prev, [key]: value }))
    await window.electronAPI.invoke('plugins:set-setting', pluginName, key, value)
  }

  if (!plugin) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <Text color="muted">Loading...</Text>
      </Flex>
    )
  }

  const stateConfig = STATE_CONFIG[plugin.status.state] ?? STATE_CONFIG.inactive
  const isActive = plugin.status.state === 'active' || plugin.status.state === 'degraded'

  return (
    <Flex direction="column" className="h-full bg-bg-primary">
      {/* Compact Header */}
      <Box className="px-6 py-5 border-b border-border-default shrink-0">
        <Flex direction="row" align="center" gap="md">
          <PluginIcon plugin={plugin} size={48} />
          <Box className="flex-1 min-w-0">
            <Flex direction="row" align="center" gap="sm" className="flex-wrap">
              <Text size="lg" weight="semibold" color="primary">{plugin.displayName}</Text>
              <Text size="xs" color="muted">v{plugin.version}</Text>
              <Badge size="sm" variant={stateConfig.variant}>{stateConfig.label}</Badge>
              {plugin.bundled && <Badge size="sm">Built-in</Badge>}
            </Flex>
            <Text size="sm" color="secondary" as="p" className="mt-1 leading-relaxed">{plugin.description}</Text>
          </Box>
          <Flex direction="row" gap="sm" className="shrink-0">
            {isActive ? (
              <Button variant="outline" size="sm" onClick={handleDeactivate} className="flex items-center gap-1.5">
                <PowerOff size={14} /> Disable
              </Button>
            ) : (
              <Button variant="solid" size="sm" onClick={handleActivate} className="flex items-center gap-1.5">
                <Power size={14} /> Enable
              </Button>
            )}
            {!plugin.bundled && (
              <Button variant="outline" size="sm" onClick={() => setShowUninstallConfirm(true)} className="flex items-center gap-1.5 hover:text-error hover:border-error/30">
                <Trash2 size={14} /> Uninstall
              </Button>
            )}
          </Flex>
        </Flex>
      </Box>

      {/* Sub-Tabs */}
      <Tabs
        tabs={DETAIL_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="px-6 shrink-0"
      />

      {/* Tab Content */}
      <ScrollArea direction="vertical" className="flex-1">
        <Box className="px-6 py-5">
          {activeTab === 'overview' && (
            <OverviewTab plugin={plugin} stateConfig={stateConfig} errors={errors} />
          )}
          {activeTab === 'contributions' && (
            <ContributionsTab contributions={plugin.contributions} />
          )}
          {activeTab === 'errors' && (
            <ErrorsTab errors={errors} expandedError={expandedError} onToggleError={setExpandedError} />
          )}
          {activeTab === 'settings' && (
            <SettingsTab schema={settingsSchema} values={settingsValues} onChange={handleSettingChange} />
          )}
        </Box>
      </ScrollArea>

      <ConfirmDialog
        open={showUninstallConfirm}
        title={`Uninstall "${plugin.displayName}"?`}
        message="This plugin will be permanently removed."
        confirmLabel="Uninstall"
        variant="danger"
        onConfirm={handleUninstall}
        onCancel={() => setShowUninstallConfirm(false)}
      />
    </Flex>
  )
}

function OverviewTab({ plugin, stateConfig, errors }: {
  plugin: PluginInfo
  stateConfig: { label: string; variant: string; icon: typeof CheckCircle }
  errors: ErrorRecord[]
}) {
  const StateIcon = stateConfig.icon
  return (
    <Stack gap="lg">
      {/* Stat Cards */}
      <Flex direction="row" gap="md">
        <Card padding="md" className="flex-1">
          <Text size="xs" color="muted" weight="medium" className="text-[10px] uppercase tracking-wide mb-2 block">Status</Text>
          <Flex direction="row" align="center" gap="xs">
            <StateIcon size={16} className={`text-${stateConfig.variant === 'default' ? 'text-muted' : stateConfig.variant}`} />
            <Text size="sm" weight="medium">{stateConfig.label}</Text>
          </Flex>
        </Card>
        <Card padding="md" className="flex-1">
          <Text size="xs" color="muted" weight="medium" className="text-[10px] uppercase tracking-wide mb-2 block">Contributions</Text>
          <Text size="sm" weight="medium">{plugin.contributions.length} registered</Text>
        </Card>
        <Card padding="md" className="flex-1">
          <Text size="xs" color="muted" weight="medium" className="text-[10px] uppercase tracking-wide mb-2 block">Errors</Text>
          <Text size="sm" weight="medium">{errors.length > 0 ? `${errors.length} recorded` : 'None'}</Text>
        </Card>
      </Flex>

      {/* Error alert if present */}
      {plugin.status.error && (
        <Alert variant="error">{plugin.status.error}</Alert>
      )}

      {/* Details Card */}
      <Card padding="md">
        <Text size="xs" color="muted" weight="medium" className="text-[10px] uppercase tracking-wide mb-3 block">Details</Text>
        <Stack gap="sm">
          <DetailRow label="Identifier" value={plugin.name} mono />
          <DetailRow label="Version" value={plugin.version} />
          <DetailRow label="Source" value={plugin.bundled ? 'Built-in' : 'User installed'} />
          {plugin.status.phase && plugin.status.state === 'error' && (
            <DetailRow label="Failed during" value={plugin.status.phase} />
          )}
        </Stack>
      </Card>
    </Stack>
  )
}

function ContributionsTab({ contributions }: { contributions: string[] }) {
  if (contributions.length === 0) {
    return <EmptyState title="No contributions" description="This extension has no registered contributions" className="py-12" />
  }

  return (
    <Card padding="md">
      <Stack gap="xs">
        {contributions.map((c, i) => {
          const [type, name] = c.includes(':') ? c.split(':') : ['feature', c]
          const variant = CONTRIBUTION_BADGE_VARIANTS[type] ?? 'default'
          return (
            <Flex key={i} direction="row" align="center" gap="sm" className="py-1">
              <Badge size="sm" variant={variant} className="w-20 text-center justify-center shrink-0">{type}</Badge>
              <Text size="sm" color="secondary">{name}</Text>
            </Flex>
          )
        })}
      </Stack>
    </Card>
  )
}

function ErrorsTab({ errors, expandedError, onToggleError }: {
  errors: ErrorRecord[]
  expandedError: number | null
  onToggleError: (i: number | null) => void
}) {
  if (errors.length === 0) {
    return <EmptyState title="No errors" description="No errors have been recorded for this extension" className="py-12" />
  }

  return (
    <Card padding="md">
      <Stack gap="xs">
        {errors.slice(-20).reverse().map((err, i) => (
          <Box key={i}>
            <Flex
              direction="row"
              align="start"
              gap="sm"
              onClick={() => onToggleError(expandedError === i ? null : i)}
              className="py-1.5 cursor-pointer hover:bg-white/5 rounded px-2 -mx-2 transition-colors"
            >
              <XCircle size={14} className="text-error mt-0.5 shrink-0" />
              <Box className="flex-1 min-w-0">
                <Text size="xs" color="secondary" truncate className="block">{err.error}</Text>
                <Text size="xs" color="muted" className="text-[10px]">{new Date(err.timestamp).toLocaleString()}</Text>
              </Box>
            </Flex>
            {expandedError === i && err.stack && (
              <Code block className="text-[11px] text-text-muted bg-bg-tertiary rounded p-3 mt-1 overflow-x-auto whitespace-pre-wrap">
                {err.stack}
              </Code>
            )}
          </Box>
        ))}
      </Stack>
    </Card>
  )
}

function SettingsTab({ schema, values, onChange }: {
  schema: SettingSchema[]
  values: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
}) {
  if (schema.length === 0) {
    return <EmptyState title="No settings" description="This extension has no configurable settings" className="py-12" />
  }

  return (
    <Card padding="md">
      <Stack gap="md">
        {schema.map(setting => (
          <Box key={setting.key}>
            <Text size="sm" weight="medium" className="mb-1 block">{setting.title}</Text>
            {setting.type === 'boolean' ? (
              <Switch
                label={setting.title}
                checked={Boolean(values[setting.key])}
                onChange={e => onChange(setting.key, e.target.checked)}
              />
            ) : setting.type === 'password' ? (
              <PasswordInput
                size="sm"
                value={String(values[setting.key] ?? '')}
                onChange={e => onChange(setting.key, e.target.value)}
              />
            ) : setting.type === 'number' ? (
              <Input
                type="number"
                size="sm"
                value={String(values[setting.key] ?? '')}
                onChange={e => onChange(setting.key, Number(e.target.value))}
              />
            ) : (
              <Input
                size="sm"
                value={String(values[setting.key] ?? '')}
                onChange={e => onChange(setting.key, e.target.value)}
              />
            )}
          </Box>
        ))}
      </Stack>
    </Card>
  )
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <Flex direction="row" align="center" justify="between">
      <Text size="xs" color="muted">{label}</Text>
      <Text size="xs" color="secondary" className={mono ? 'font-mono' : ''}>{value}</Text>
    </Flex>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/plugins/PluginDetailView.tsx
git commit -m "feat: rewrite PluginDetailView as main-area tabbed detail view"
```

---

### Task 6: Wire PluginDetailView into App.tsx

**Files:**
- Modify: `src/renderer/src/App.tsx` (add plugin-detail tab rendering)

- [ ] **Step 1: Add import for PluginDetailView**

In `src/renderer/src/App.tsx`, add the import after the existing component imports:

```typescript
import { PluginDetailView } from '@/components/plugins/PluginDetailView'
```

Add `PluginDetailTab` to the type import:

```typescript
import type { QueryTab, ErDiagramTab, ConnectionFormTab, PluginDetailTab } from '@shared/types'
```

- [ ] **Step 2: Add the rendering case for `plugin-detail` tabs**

In `src/renderer/src/App.tsx`, add this block after the `connection-form` rendering case (after line 128):

```tsx
                {activeTab?.type === 'plugin-detail' && (
                  <PluginDetailView
                    pluginName={(activeTab as PluginDetailTab).pluginName}
                  />
                )}
```

- [ ] **Step 3: Verify the full flow works**

Run: `pnpm dev`
Check:
1. Open the Extensions panel in the sidebar
2. Verify the minimal list renders with icons, names, and status dots
3. Click a plugin — it should open a new tab in the main content area
4. Verify the detail view shows the header with icon, name, version, badges, and actions
5. Click through all 4 sub-tabs (Overview, Contributions, Errors, Settings)
6. Click the same plugin again — it should activate the existing tab, not create a duplicate
7. Close the tab — it should close normally

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/App.tsx
git commit -m "feat: wire PluginDetailView into main content area tab rendering"
```

---

### Task 7: Clean up old code and verify

**Files:**
- Modify: `src/renderer/src/components/shell/Sidebar.tsx` (remove PluginDetailView import if present)
- Modify: `src/renderer/src/components/settings/categories/PluginSettings.tsx` (no changes needed, still works independently)

- [ ] **Step 1: Verify Sidebar no longer imports PluginDetailView**

The Sidebar (`src/renderer/src/components/shell/Sidebar.tsx`) currently imports only `ExtensionsPanel`, which is correct. No changes needed here.

- [ ] **Step 2: Run the full test suite**

Run: `pnpm test`
Expected: All tests pass. If any tests reference the old `PluginDetailView` props (`plugin`, `onBack`, `onRefresh`), they need updating.

- [ ] **Step 3: Run the build**

Run: `pnpm build 2>&1 | tail -20`
Expected: Clean build with no errors.

- [ ] **Step 4: Final manual verification**

Run: `pnpm dev`
Check the complete flow:
1. Sidebar extensions list: search, filtering, install button, refresh
2. Click plugin → opens detail tab with correct icon and info
3. Enable/Disable toggle works and updates the sidebar status dot
4. Sub-tabs all render correctly
5. Multiple plugin detail tabs can be open simultaneously
6. Tab bar shows Puzzle icon with emerald color for plugin tabs

- [ ] **Step 5: Commit any remaining fixes**

```bash
git add -A
git commit -m "chore: clean up and verify extensions page redesign"
```
