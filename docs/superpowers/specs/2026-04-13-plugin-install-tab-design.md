# Plugin Install Tab

## Overview

Replace the current "type a path" modal with a proper install experience: a full tab in the main editor area with a drag-and-drop zone and a native file browser button. Supports both `.zip` archives and plugin folders.

## Behavior

### Opening the tab

The "Install" button in the Extensions sidebar panel (`ExtensionsPanel.tsx`) opens an "Install Plugin" tab in the main editor area. If a tab with id `install-plugin` already exists, it focuses it instead of creating a duplicate.

### Tab identity

- **Id**: `install-plugin` (singleton)
- **Type**: `install-plugin` (new member of the `Tab` discriminated union)
- **Title**: "Install Plugin"
- **Icon**: `Package` (lucide) in the tab bar

### Tab content

Vertically and horizontally centered drop zone:

- Dashed border container, rounded corners
- Large muted package icon
- Heading: "Drop plugin here to install"
- Subtext: ".zip archive or plugin folder"
- "Browse Files..." button (accent style) that opens the native file dialog

### Drag-and-drop

- The entire tab content area is the drop target
- Accepts: directories and `.zip` files (validated on drop)
- **Drag-over state**: border color transitions to accent, background gets a subtle tint
- **Invalid drop** (non-zip file, URL, text): ignored, no error

### File browser

The "Browse Files..." button invokes a new IPC channel `plugins:open-install-dialog` which calls Electron's `dialog.showOpenDialog` with:
- `properties: ['openFile', 'openDirectory']`
- `filters: [{ name: 'Plugin Archive', extensions: ['zip'] }]`
- Returns the selected path (or `null` if cancelled)

### Install flow

1. User drops a file/folder or selects via the browser
2. Drop zone transitions to "Installing..." state with a spinner
3. For `.zip` files: new IPC channel `plugins:install-from-zip` extracts to a temp directory, then delegates to the existing `installFromPath` logic
4. For folders: uses the existing `plugins:install-from-path` IPC
5. **On success**: toast notification ("Plugin installed"), drop zone returns to idle, plugin appears in the Extensions sidebar
6. **On error**: inline error alert below the drop zone with the message, drop zone returns to idle

### Post-install

The tab stays open (VS Code behavior). The user can install more plugins or close the tab manually. No auto-close, no navigation.

## File changes

### `shared/types.ts`

Add `InstallPluginTab` interface and include it in the `Tab` union:

```ts
export interface InstallPluginTab {
  id: string
  type: 'install-plugin'
  title: string
}

export type Tab = QueryTab | TableTab | ErDiagramTab | ConnectionFormTab | PluginDetailTab | InstallPluginTab
```

### `shared/ipc.ts`

Add two IPC channels:

```ts
'plugins:open-install-dialog': {
  args: []
  return: string | null  // selected path, or null if cancelled
}
'plugins:install-from-zip': {
  args: [zipPath: string]
  return: { success: boolean; name?: string; error?: string }
}
```

### `src/main/ipc-handlers.ts`

Add handlers:

- `plugins:open-install-dialog` — calls `dialog.showOpenDialog` with file+directory support and `.zip` filter, returns the first selected path or null
- `plugins:install-from-zip` — extracts the zip to a temp directory using `node:zlib`/`tar` or the `extract-zip` pattern (Node built-ins), then delegates to `coordinator.installFromPath(tempDir)`, cleans up temp on completion

### `src/main/plugins/plugin-host.ts`

Add `installFromZip(zipPath: string)` method to `PluginBootCoordinator`:

1. Create temp directory via `fs.mkdtemp`
2. Extract zip contents using Node's built-in `child_process.execFile('unzip', ...)` (macOS/Linux) or `tar` fallback. Desktop app can rely on system tools.
3. Call existing `installFromPath(tempDir)`
4. Clean up temp directory in a `finally` block
5. Return the same `{ success, name, error }` shape

### `src/renderer/src/stores/tabs.ts`

Add `openInstallPlugin()` method:

```ts
openInstallPlugin: () => {
  const id = 'install-plugin'
  const existing = get().tabs.find(t => t.id === id)
  if (existing) { set({ activeTabId: id }); return id }
  const tab: InstallPluginTab = { id, type: 'install-plugin', title: 'Install Plugin' }
  set(s => ({ tabs: [...s.tabs, tab], activeTabId: id }))
  return id
}
```

### `src/renderer/src/components/plugins/InstallPluginTab.tsx` (new)

The tab content component. Structure:

- Full-height flex container, centered content
- Drop zone `<div>` with `onDragOver`, `onDragLeave`, `onDrop` handlers
- State machine: `idle` | `drag-over` | `installing` | `error`
- In `idle`: shows icon + text + browse button
- In `drag-over`: accent border + tinted background
- In `installing`: spinner + "Installing..."
- In `error`: idle layout + error alert below

Drop handler:
- Reads `e.dataTransfer.files` or `e.dataTransfer.items`
- For files: check if `.zip` extension, call `plugins:install-from-zip`
- For directories: get the path, call `plugins:install-from-path`
- On Electron, dropped files/folders expose their `path` property on the `File` object

Browse handler:
- Calls `plugins:open-install-dialog`
- If result is null, do nothing
- If path ends in `.zip`, call `plugins:install-from-zip`
- Otherwise, call `plugins:install-from-path`

### `src/renderer/src/App.tsx`

Add rendering case for the new tab type:

```tsx
{activeTab?.type === 'install-plugin' && (
  <InstallPluginTab />
)}
```

### `src/renderer/src/components/plugins/ExtensionsPanel.tsx`

Replace the install modal with opening the install tab:

- Remove the `showInstallPath` / `installPath` state and the `<Modal>` block
- Change the "Install" button's `onClick` to call `useTabsStore.getState().openInstallPlugin()`

### `src/renderer/src/components/shell/tab-bar/TabItem.tsx`

Add icon mapping for `install-plugin` tab type in `getTabIcon` (use `Package` from lucide).

## Out of scope

- Plugin marketplace / registry browsing
- Auto-update for installed plugins
- Plugin dependency resolution
- Drag-and-drop reordering within the Extensions sidebar
