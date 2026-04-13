# Plugin Install Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the manual path-entry modal with a full editor tab that supports drag-and-drop and native file browsing for plugin installation.

**Architecture:** Add an `InstallPluginTab` type to the tab union, a new `InstallPluginTab.tsx` component with drag-and-drop + browse UI, two new IPC channels (`plugins:open-install-dialog`, `plugins:install-from-zip`), and a zip-extraction method on `PluginBootCoordinator`. The Extensions sidebar "Install" button opens this tab instead of a modal.

**Tech Stack:** React, Zustand, Electron IPC, Electron `dialog.showOpenDialog`, Node `child_process.execFile` for zip extraction.

---

### Task 1: Add `InstallPluginTab` type and IPC channels

**Files:**
- Modify: `shared/types.ts:98-105`
- Modify: `shared/ipc.ts:118-121`

- [ ] **Step 1: Add InstallPluginTab interface to shared types**

In `shared/types.ts`, add the new tab interface before the `Tab` union and extend the union:

```ts
export interface InstallPluginTab {
  id: string
  type: 'install-plugin'
  title: string
}

export type Tab = QueryTab | TableTab | ErDiagramTab | ConnectionFormTab | PluginDetailTab | InstallPluginTab
```

- [ ] **Step 2: Add new IPC channels**

In `shared/ipc.ts`, add after the `plugins:install-from-path` channel (after line 121):

```ts
'plugins:install-from-zip': {
  args: [zipPath: string]
  return: { success: boolean; name?: string; error?: string }
}
'plugins:open-install-dialog': {
  args: []
  return: string | null
}
```

- [ ] **Step 3: Commit**

```bash
git add shared/types.ts shared/ipc.ts
git commit -m "feat: add InstallPluginTab type and IPC channels for plugin install"
```

---

### Task 2: Add tab icon and store method

**Files:**
- Modify: `src/renderer/src/components/shell/tab-bar/tab-icons.ts`
- Modify: `src/renderer/src/stores/tabs.ts`

- [ ] **Step 1: Add tab icon mapping**

In `src/renderer/src/components/shell/tab-bar/tab-icons.ts`, add `Package` to the lucide import and add the mapping entry:

Change the import:
```ts
import { FileText, GitFork, Package, Plug, Table2, Puzzle, type LucideIcon } from 'lucide-react'
```

Add to `tabIconMap`:
```ts
'install-plugin': { icon: Package, className: 'text-orange-400' },
```

- [ ] **Step 2: Add openInstallPlugin to tabs store**

In `src/renderer/src/stores/tabs.ts`, add the import for `InstallPluginTab`:

```ts
import type { Tab, QueryTab, QueryResult, ConnectionFormTab, PluginDetailTab, InstallPluginTab } from '@shared/types'
```

Add `openInstallPlugin` to the `TabsState` interface (after `openPluginDetail`):

```ts
openInstallPlugin: () => string
```

Add the implementation inside `create<TabsState>` (after `openPluginDetail`):

```ts
openInstallPlugin: () => {
  const id = 'install-plugin'
  const existing = get().tabs.find(t => t.id === id)
  if (existing) {
    set({ activeTabId: id })
    return id
  }
  const tab: InstallPluginTab = {
    id,
    type: 'install-plugin',
    title: 'Install Plugin'
  }
  set((s) => ({
    tabs: [...s.tabs, tab],
    activeTabId: id
  }))
  return id
},
```

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/shell/tab-bar/tab-icons.ts src/renderer/src/stores/tabs.ts
git commit -m "feat: add install-plugin tab icon and store method"
```

---

### Task 3: Implement IPC handlers for zip install and file dialog

**Files:**
- Modify: `src/main/ipc-handlers.ts:521-523`
- Modify: `src/main/plugins/plugin-host.ts:472-507`

- [ ] **Step 1: Add installFromZip to PluginBootCoordinator**

In `src/main/plugins/plugin-host.ts`, add the following method after `installFromPath` (after line 507):

```ts
installFromZip(zipPath: string): { success: boolean; name?: string; error?: string } {
  const tmpDir = path.join(os.tmpdir(), `dbstudio-plugin-${Date.now()}`)
  try {
    fs.mkdirSync(tmpDir, { recursive: true })
    execFileSync('unzip', ['-o', '-q', zipPath, '-d', tmpDir])
    // The zip may contain a single top-level directory or files at root.
    // Check if there's exactly one subdirectory — if so, install from that.
    const entries = fs.readdirSync(tmpDir).filter(e => fs.statSync(path.join(tmpDir, e)).isDirectory())
    const installDir = entries.length === 1 ? path.join(tmpDir, entries[0]) : tmpDir
    return this.installFromPath(installDir)
  } catch (err) {
    return { success: false, error: (err as Error).message }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}
```

Add `os` and `execFileSync` to the imports at the top of `plugin-host.ts`:

```ts
import os from 'os'
import { execFileSync } from 'child_process'
```

- [ ] **Step 2: Add IPC handlers**

In `src/main/ipc-handlers.ts`, add after the `plugins:install-from-path` handler (after line 523):

```ts
handle('plugins:install-from-zip', async (zipPath) => {
  return pluginCoordinator.installFromZip(zipPath)
})

handle('plugins:open-install-dialog', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select Plugin',
    properties: ['openFile', 'openDirectory'],
    filters: [{ name: 'Plugin Archive', extensions: ['zip'] }]
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
})
```

Make sure `dialog` is imported from `electron` at the top of the file. Check existing imports — it's likely already imported; if not, add it to the electron import.

- [ ] **Step 3: Verify build compiles**

Run: `pnpm build`
Expected: Build succeeds with no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/main/ipc-handlers.ts src/main/plugins/plugin-host.ts
git commit -m "feat: add IPC handlers for zip install and native file dialog"
```

---

### Task 4: Create the InstallPluginTab component

**Files:**
- Create: `src/renderer/src/components/plugins/InstallPluginTab.tsx`

- [ ] **Step 1: Create the component**

Create `src/renderer/src/components/plugins/InstallPluginTab.tsx`:

```tsx
import { useState, useCallback } from 'react'
import { Package, Upload } from 'lucide-react'
import { useToastStore } from '@/stores/toast'
import { Flex, Box, Text, Button, Spinner } from '@/primitives'

type InstallState = 'idle' | 'drag-over' | 'installing' | 'error'

export function InstallPluginTab() {
  const [state, setState] = useState<InstallState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const addToast = useToastStore((s) => s.addToast)

  const installFromPath = useCallback(async (filePath: string) => {
    setState('installing')
    setErrorMessage(null)
    try {
      const result = filePath.endsWith('.zip')
        ? await window.electronAPI.invoke('plugins:install-from-zip', filePath)
        : await window.electronAPI.invoke('plugins:install-from-path', filePath)
      if (result.success) {
        addToast({ type: 'success', title: 'Plugin installed', message: result.name ?? undefined })
      } else {
        setErrorMessage(result.error ?? 'Installation failed')
        setState('error')
        return
      }
    } catch (err) {
      setErrorMessage((err as Error).message)
      setState('error')
      return
    }
    setState('idle')
  }, [addToast])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setState((s) => (s === 'installing' ? s : 'drag-over'))
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setState((s) => (s === 'installing' ? s : 'idle'))
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (state === 'installing') return
      const files = e.dataTransfer.files
      if (files.length === 0) return
      const file = files[0]
      const filePath = (file as File & { path?: string }).path
      if (!filePath) return
      installFromPath(filePath)
    },
    [state, installFromPath]
  )

  const handleBrowse = useCallback(async () => {
    if (state === 'installing') return
    const filePath = await window.electronAPI.invoke('plugins:open-install-dialog')
    if (!filePath) return
    installFromPath(filePath)
  }, [state, installFromPath])

  const isOver = state === 'drag-over'
  const isInstalling = state === 'installing'

  return (
    <Flex
      align="center"
      justify="center"
      className="h-full"
      style={{ background: 'var(--color-bg-primary)' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Box className="w-full max-w-md px-6">
        <Flex
          direction="column"
          align="center"
          gap="md"
          className="rounded-xl py-12 px-8 transition-colors duration-150"
          style={{
            border: `2px dashed ${isOver ? 'var(--color-accent)' : 'var(--color-border-default)'}`,
            background: isOver
              ? 'color-mix(in srgb, var(--color-accent) 5%, transparent)'
              : 'var(--color-bg-secondary)',
          }}
        >
          {isInstalling ? (
            <>
              <Spinner size="md" />
              <Text size="sm" color="muted">
                Installing plugin...
              </Text>
            </>
          ) : (
            <>
              <Box
                className="rounded-full p-4"
                style={{
                  background: isOver
                    ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)'
                    : 'var(--color-bg-tertiary)',
                }}
              >
                {isOver ? (
                  <Upload
                    size={32}
                    style={{ color: 'var(--color-accent)' }}
                  />
                ) : (
                  <Package
                    size={32}
                    style={{ color: 'var(--color-text-disabled)' }}
                  />
                )}
              </Box>
              <Flex direction="column" align="center" gap="xs">
                <Text size="sm" weight="semibold" color="primary">
                  Drop plugin here to install
                </Text>
                <Text size="xs" color="muted">
                  .zip archive or plugin folder
                </Text>
              </Flex>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBrowse}
                className="mt-2"
              >
                Browse Files...
              </Button>
            </>
          )}
        </Flex>

        {state === 'error' && errorMessage && (
          <Box
            className="mt-3 rounded-lg px-3 py-2 text-xs"
            style={{
              background: 'color-mix(in srgb, var(--color-error) 10%, transparent)',
              color: 'var(--color-error)',
              border: '1px solid color-mix(in srgb, var(--color-error) 20%, transparent)',
            }}
          >
            {errorMessage}
          </Box>
        )}
      </Box>
    </Flex>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/plugins/InstallPluginTab.tsx
git commit -m "feat: create InstallPluginTab component with drag-and-drop"
```

---

### Task 5: Wire up App.tsx and ExtensionsPanel

**Files:**
- Modify: `src/renderer/src/App.tsx`
- Modify: `src/renderer/src/components/plugins/ExtensionsPanel.tsx`

- [ ] **Step 1: Add install tab rendering to App.tsx**

In `src/renderer/src/App.tsx`, add the import:

```ts
import { InstallPluginTab } from '@/components/plugins/InstallPluginTab'
```

Add the rendering case after the `plugin-detail` block (after line 133):

```tsx
{activeTab?.type === 'install-plugin' && (
  <InstallPluginTab />
)}
```

- [ ] **Step 2: Replace the install modal in ExtensionsPanel**

In `src/renderer/src/components/plugins/ExtensionsPanel.tsx`:

Add the tabs store import:
```ts
import { useTabsStore } from '@/stores/tabs'
```

Remove these state variables from the component (lines 23-24):
```ts
const [showInstallPath, setShowInstallPath] = useState(false)
const [installPath, setInstallPath] = useState('')
```

Remove the `handleInstallFromFolder` function (lines 54-64).

Add at the top of the component function:
```ts
const openInstallPlugin = useTabsStore(s => s.openInstallPlugin)
```

Replace the "Install" button's `onClick` (line 163) from `() => setShowInstallPath(true)` to `openInstallPlugin`:

```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={openInstallPlugin}
  className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary"
>
  <FolderOpen size={12} /> Install
</Button>
```

Remove the entire `<Modal>` block (lines 217-233) — the install path modal and all its contents.

Remove the `Modal` and `Input` imports from the primitives import if they are no longer used elsewhere in the file. Remove `Alert` too if unused. Check the remaining JSX before removing.

- [ ] **Step 3: Verify build compiles**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/App.tsx src/renderer/src/components/plugins/ExtensionsPanel.tsx
git commit -m "feat: wire install-plugin tab into App and Extensions panel"
```

---

### Task 6: Verify and test

**Files:**
- None (verification only)

- [ ] **Step 1: Run full test suite**

Run: `pnpm test`
Expected: All tests pass. No regressions from adding the new tab type (the `Tab` union change may cause test failures if tests exhaustively match on tab types — fix any that appear).

- [ ] **Step 2: Run build**

Run: `pnpm build`
Expected: Clean build, no warnings related to the new code.

- [ ] **Step 3: Manual verification checklist**

Run: `pnpm dev`

Verify:
1. Extensions sidebar shows "Install" button
2. Clicking "Install" opens an "Install Plugin" tab in the editor area with Package icon
3. Clicking "Install" again when tab is already open focuses it (no duplicate)
4. Drop zone shows the centered layout with icon, text, and "Browse Files..." button
5. Dragging a file over the drop zone shows the accent-colored drag-over state
6. Dragging away returns to idle state
7. "Browse Files..." button opens native file dialog
8. Tab stays open after install (can install multiple)
9. Tab can be closed with X button or Cmd+W

- [ ] **Step 4: Commit any test fixes**

```bash
git add -A
git commit -m "fix: update tests for InstallPluginTab type"
```
