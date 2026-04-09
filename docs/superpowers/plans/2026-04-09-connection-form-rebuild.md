# Connection Form Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the modal-based connection form with a full-screen tab-based view built entirely from design system primitives.

**Architecture:** Add a `ConnectionFormTab` type to the existing discriminated union tab system. The form renders in the editor area as a centered, scrollable, sectioned layout. All inputs use primitives (`FormField`, `Input`, `NumberInput`, `PasswordInput`, `Select`, `Switch`, `ColorInput`). The old `ConnectionForm.tsx` modal component is deleted.

**Tech Stack:** React 19, TypeScript, Zustand, design system primitives (CVA-based)

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `shared/types.ts` | Modify | Add `ConnectionFormTab` interface, update `Tab` union |
| `src/renderer/src/stores/tabs.ts` | Modify | Add `openConnectionForm()` action |
| `src/renderer/src/components/connections/ConnectionFormView.tsx` | Create | Full-screen connection form component |
| `src/renderer/src/App.tsx` | Modify | Render `ConnectionFormView` for `connection-form` tabs, update menu trigger |
| `src/renderer/src/components/explorer/ConnectionsSection.tsx` | Modify | Replace modal trigger with tab-based trigger |
| `src/renderer/src/components/connections/ConnectionForm.tsx` | Delete | Replaced by `ConnectionFormView` |
| `tests/unit/components/connections/ConnectionFormView.test.tsx` | Create | Unit tests for form rendering and behavior |

---

### Task 1: Add `ConnectionFormTab` type

**Files:**
- Modify: `shared/types.ts:56-85`

- [ ] **Step 1: Add `ConnectionFormTab` interface and update `Tab` union**

In `shared/types.ts`, add the new interface after `ErDiagramTab` (after line 83) and update the `Tab` union on line 85:

```typescript
export interface ConnectionFormTab {
  id: string
  type: 'connection-form'
  title: string
  editingId?: string
}

export type Tab = QueryTab | TableTab | ErDiagramTab | ConnectionFormTab
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors (existing code doesn't switch exhaustively on tab types)

- [ ] **Step 3: Commit**

```bash
git add shared/types.ts
git commit -m "feat: add ConnectionFormTab type to tab union"
```

---

### Task 2: Add `openConnectionForm` action to tabs store

**Files:**
- Modify: `src/renderer/src/stores/tabs.ts:1-131`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/stores/tabs-connection-form.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useTabsStore } from '../../../src/renderer/src/stores/tabs'

describe('openConnectionForm', () => {
  beforeEach(() => {
    useTabsStore.setState({ tabs: [], activeTabId: null })
  })

  it('opens a new connection form tab', () => {
    const id = useTabsStore.getState().openConnectionForm()
    const state = useTabsStore.getState()
    expect(state.tabs).toHaveLength(1)
    expect(state.activeTabId).toBe(id)
    const tab = state.tabs[0]
    expect(tab.type).toBe('connection-form')
    expect(tab.title).toBe('New Connection')
    expect((tab as any).editingId).toBeUndefined()
  })

  it('opens an editing form tab with editingId', () => {
    const id = useTabsStore.getState().openConnectionForm('conn-123')
    const tab = useTabsStore.getState().tabs[0]
    expect(tab.type).toBe('connection-form')
    expect((tab as any).editingId).toBe('conn-123')
  })

  it('reuses existing tab for same editingId', () => {
    useTabsStore.getState().openConnectionForm('conn-123')
    useTabsStore.getState().openConnectionForm('conn-123')
    expect(useTabsStore.getState().tabs).toHaveLength(1)
  })

  it('opens separate tabs for different editingIds', () => {
    useTabsStore.getState().openConnectionForm('conn-1')
    useTabsStore.getState().openConnectionForm('conn-2')
    expect(useTabsStore.getState().tabs).toHaveLength(2)
  })

  it('reuses existing new-connection tab', () => {
    useTabsStore.getState().openConnectionForm()
    useTabsStore.getState().openConnectionForm()
    expect(useTabsStore.getState().tabs).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/stores/tabs-connection-form.test.ts`
Expected: FAIL — `openConnectionForm` is not a function

- [ ] **Step 3: Implement `openConnectionForm` in the tabs store**

In `src/renderer/src/stores/tabs.ts`, update the `TabsState` interface (add after line 33):

```typescript
openConnectionForm: (editingId?: string) => string
```

Update the import on line 2:

```typescript
import type { Tab, QueryTab, QueryResult, ConnectionFormTab } from '@shared/types'
```

Add the implementation inside the `create` call (after the `openErDiagram` method, before the closing `}))`:

```typescript
openConnectionForm: (editingId?: string) => {
  const formId = editingId ? `conn-form-${editingId}` : 'conn-form-new'
  const existing = get().tabs.find(t => t.id === formId)
  if (existing) {
    set({ activeTabId: formId })
    return formId
  }
  const tab: ConnectionFormTab = {
    id: formId,
    type: 'connection-form',
    title: editingId ? 'Edit Connection' : 'New Connection',
    editingId
  }
  set((s) => ({
    tabs: [...s.tabs, tab],
    activeTabId: tab.id
  }))
  return tab.id
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/stores/tabs-connection-form.test.ts`
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/stores/tabs.ts tests/unit/stores/tabs-connection-form.test.ts
git commit -m "feat: add openConnectionForm action to tabs store"
```

---

### Task 3: Build `ConnectionFormView` component

**Files:**
- Create: `src/renderer/src/components/connections/ConnectionFormView.tsx`

This is the main component. It uses only primitives.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/components/connections/ConnectionFormView.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConnectionFormView } from '../../../../src/renderer/src/components/connections/ConnectionFormView'

// Mock electronAPI
const mockInvoke = vi.fn().mockResolvedValue([])
const mockOn = vi.fn().mockReturnValue(vi.fn())
Object.defineProperty(window, 'electronAPI', {
  value: { invoke: mockInvoke, on: mockOn },
  writable: true
})

// Mock stores
const mockSaveConnection = vi.fn().mockResolvedValue(undefined)
const mockCloseTab = vi.fn()
const mockConnections: any[] = []

vi.mock('../../../../src/renderer/src/stores/connections', () => ({
  useConnectionsStore: (selector: any) => selector({
    connections: mockConnections,
    saveConnection: mockSaveConnection
  })
}))

vi.mock('../../../../src/renderer/src/stores/tabs', () => ({
  useTabsStore: (selector: any) => selector({
    closeTab: mockCloseTab
  })
}))

describe('ConnectionFormView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInvoke.mockResolvedValue([])
  })

  it('renders the new connection heading', () => {
    render(<ConnectionFormView tabId="conn-form-new" />)
    expect(screen.getByText('New Connection')).toBeTruthy()
  })

  it('renders database type select', () => {
    render(<ConnectionFormView tabId="conn-form-new" />)
    const select = screen.getByLabelText('Database Type')
    expect(select).toBeTruthy()
    expect(select.tagName).toBe('SELECT')
  })

  it('renders connection name input', () => {
    render(<ConnectionFormView tabId="conn-form-new" />)
    expect(screen.getByLabelText('Connection Name')).toBeTruthy()
  })

  it('renders host and port for postgresql', () => {
    render(<ConnectionFormView tabId="conn-form-new" />)
    expect(screen.getByLabelText('Host')).toBeTruthy()
    expect(screen.getByLabelText('Port')).toBeTruthy()
  })

  it('renders password input with visibility toggle', () => {
    render(<ConnectionFormView tabId="conn-form-new" />)
    expect(screen.getByPlaceholderText('Password')).toBeTruthy()
    expect(screen.getByLabelText('Show password')).toBeTruthy()
  })

  it('renders SSL switch', () => {
    render(<ConnectionFormView tabId="conn-form-new" />)
    expect(screen.getByRole('switch')).toBeTruthy()
  })

  it('renders cancel and save buttons', () => {
    render(<ConnectionFormView tabId="conn-form-new" />)
    expect(screen.getByText('Cancel')).toBeTruthy()
    expect(screen.getByText('Add Connection')).toBeTruthy()
  })

  it('shows database file input for sqlite', async () => {
    render(<ConnectionFormView tabId="conn-form-new" />)
    const select = screen.getByLabelText('Database Type')
    await userEvent.selectOptions(select, 'sqlite')
    expect(screen.getByLabelText('Database File')).toBeTruthy()
    expect(screen.queryByLabelText('Host')).toBeNull()
  })

  it('closes tab on cancel click', async () => {
    render(<ConnectionFormView tabId="conn-form-new" />)
    await userEvent.click(screen.getByText('Cancel'))
    expect(mockCloseTab).toHaveBeenCalledWith('conn-form-new')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/components/connections/ConnectionFormView.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Create the `ConnectionFormView` component**

Create `src/renderer/src/components/connections/ConnectionFormView.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { ConnectionTestButton } from './ConnectionTestButton'
import { useConnectionsStore } from '@/stores/connections'
import { useTabsStore } from '@/stores/tabs'
import type { ConnectionProfile, DatabaseType } from '@shared/types'
import {
  ScrollArea, Container, Stack, Flex, Box, Divider,
  Heading, Text,
  FormField, Input, NumberInput, PasswordInput, Select, Switch, ColorInput,
  Button
} from '@/primitives'

interface Props {
  tabId: string
  editingId?: string
}

interface PluginDriver {
  driverId: string
  driverName: string
  connectionFields: { key: string; label: string; type: string; required?: boolean; default?: string | number | boolean; group?: string }[]
}

interface MiddlewareField {
  key: string; label: string; type: string; required?: boolean; default?: string | number | boolean; group?: string
}

const BUILTIN_TYPES: { value: DatabaseType; label: string; defaultPort: number }[] = [
  { value: 'postgresql', label: 'PostgreSQL', defaultPort: 5432 },
  { value: 'mysql', label: 'MySQL', defaultPort: 3306 },
  { value: 'sqlite', label: 'SQLite', defaultPort: 0 }
]

const COLOR_PRESETS = ['#7c6ff7', '#28c840', '#e5c07b', '#61afef', '#ff5f57', '#c678dd']

export function ConnectionFormView({ tabId, editingId }: Props) {
  const saveConnection = useConnectionsStore(s => s.saveConnection)
  const connections = useConnectionsStore(s => s.connections)
  const closeTab = useTabsStore(s => s.closeTab)

  const [pluginDrivers, setPluginDrivers] = useState<PluginDriver[]>([])
  const [middlewareFields, setMiddlewareFields] = useState<MiddlewareField[]>([])
  const [sshExpanded, setSshExpanded] = useState(false)

  const existingProfile = editingId ? connections.find(c => c.id === editingId) : undefined

  const [profile, setProfile] = useState<Record<string, unknown>>({
    id: crypto.randomUUID(),
    name: '',
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: '',
    username: '',
    password: '',
    color: '#7c6ff7',
    ...(existingProfile ?? {})
  })

  useEffect(() => {
    window.electronAPI.invoke('plugins:connection-fields').then(setPluginDrivers).catch(() => {})
    window.electronAPI.invoke('plugins:middleware-fields').then(setMiddlewareFields).catch(() => {})
  }, [])

  const allTypes = [
    ...BUILTIN_TYPES.map(t => ({ value: t.value, label: t.label })),
    ...pluginDrivers.map(d => ({ value: d.driverId as DatabaseType, label: d.driverName.charAt(0).toUpperCase() + d.driverName.slice(1) }))
  ]

  const isBuiltin = BUILTIN_TYPES.some(t => t.value === profile.type)
  const activePluginDriver = pluginDrivers.find(d => d.driverId === profile.type)
  const isSqlite = profile.type === 'sqlite'
  const sshFields = middlewareFields.filter(f => f.group === 'ssh')

  const update = (patch: Record<string, unknown>) => setProfile(p => ({ ...p, ...patch }))

  const handleTypeChange = (type: DatabaseType) => {
    const builtinPort = BUILTIN_TYPES.find(t => t.value === type)?.defaultPort
    if (builtinPort !== undefined) {
      update({ type, port: builtinPort })
    } else {
      const driver = pluginDrivers.find(d => d.driverId === type)
      const defaults: Record<string, unknown> = { type }
      if (driver) {
        for (const field of driver.connectionFields) {
          if (field.default !== undefined && profile[field.key] === undefined) {
            defaults[field.key] = field.default
          }
        }
      }
      update(defaults)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await saveConnection(profile as ConnectionProfile)
    closeTab(tabId)
  }

  const handleCancel = () => closeTab(tabId)

  const renderPluginField = (field: { key: string; label: string; type: string; required?: boolean; default?: string | number | boolean }) => {
    const value = profile[field.key] ?? field.default ?? ''

    if (field.type === 'boolean') {
      return (
        <Flex key={field.key} direction="row" align="center" gap="sm">
          <Switch
            label={field.label}
            checked={!!profile[field.key]}
            onChange={(e) => update({ [field.key]: e.target.checked })}
          />
          <Text size="sm" color="secondary">{field.label}</Text>
        </Flex>
      )
    }

    if (field.type === 'password') {
      return (
        <FormField key={field.key} label={field.label}>
          <PasswordInput
            value={String(value)}
            onChange={(e) => update({ [field.key]: e.target.value })}
            size="sm"
          />
        </FormField>
      )
    }

    if (field.type === 'number') {
      return (
        <FormField key={field.key} label={field.label}>
          <NumberInput
            value={Number(value) || 0}
            onChange={(v) => update({ [field.key]: v })}
            size="sm"
          />
        </FormField>
      )
    }

    return (
      <FormField key={field.key} label={field.label}>
        <Input
          required={field.required}
          value={String(value)}
          onChange={(e) => update({ [field.key]: e.target.value })}
          size="sm"
        />
      </FormField>
    )
  }

  return (
    <ScrollArea direction="vertical" className="h-full bg-bg-primary">
      <Container size="sm" className="py-8">
        <form onSubmit={handleSubmit}>
          <Stack gap="xl">
            {/* Header */}
            <Flex direction="row" align="center" justify="between">
              <Heading level={2}>{editingId ? 'Edit Connection' : 'New Connection'}</Heading>
              <Flex direction="row" gap="sm">
                <Button type="button" variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
                <Button type="submit" variant="solid" size="sm">
                  {editingId ? 'Save Changes' : 'Add Connection'}
                </Button>
              </Flex>
            </Flex>

            <Divider />

            {/* Database Type */}
            <Stack gap="md">
              <Text size="xs" color="muted" weight="semibold" className="uppercase tracking-wider">Database Type</Text>
              <FormField label="Database Type">
                <Select
                  size="sm"
                  value={String(profile.type)}
                  onChange={(e) => handleTypeChange(e.target.value as DatabaseType)}
                >
                  {allTypes.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </FormField>
            </Stack>

            {/* General */}
            <Stack gap="md">
              <Text size="xs" color="muted" weight="semibold" className="uppercase tracking-wider">General</Text>
              <FormField label="Connection Name">
                <Input
                  required
                  value={String(profile.name ?? '')}
                  onChange={(e) => update({ name: e.target.value })}
                  placeholder="My Database"
                  size="sm"
                />
              </FormField>
              <FormField label="Color">
                <ColorInput
                  value={String(profile.color ?? '#7c6ff7')}
                  onChange={(v) => update({ color: v })}
                  presets={COLOR_PRESETS}
                  size="sm"
                />
              </FormField>
            </Stack>

            {/* Connection fields */}
            {isBuiltin ? (
              <Stack gap="md">
                <Text size="xs" color="muted" weight="semibold" className="uppercase tracking-wider">Connection</Text>
                {isSqlite ? (
                  <FormField label="Database File">
                    <Input
                      required
                      value={String(profile.database ?? '')}
                      onChange={(e) => update({ database: e.target.value })}
                      placeholder="/path/to/database.sqlite"
                      size="sm"
                    />
                  </FormField>
                ) : (
                  <>
                    <Flex direction="row" gap="md">
                      <FormField label="Host" className="flex-1">
                        <Input
                          required
                          value={String(profile.host ?? '')}
                          onChange={(e) => update({ host: e.target.value })}
                          placeholder="localhost"
                          size="sm"
                        />
                      </FormField>
                      <FormField label="Port" className="w-28">
                        <NumberInput
                          value={Number(profile.port) || 0}
                          onChange={(v) => update({ port: v })}
                          min={0}
                          max={65535}
                          size="sm"
                        />
                      </FormField>
                    </Flex>
                    <FormField label="Database">
                      <Input
                        required
                        value={String(profile.database ?? '')}
                        onChange={(e) => update({ database: e.target.value })}
                        placeholder="mydb"
                        size="sm"
                      />
                    </FormField>
                  </>
                )}
              </Stack>
            ) : activePluginDriver ? (
              <Stack gap="md">
                <Text size="xs" color="muted" weight="semibold" className="uppercase tracking-wider">Connection</Text>
                {activePluginDriver.connectionFields.filter(f => !f.group).map(renderPluginField)}
              </Stack>
            ) : null}

            {/* Authentication */}
            {isBuiltin && !isSqlite && (
              <Stack gap="md">
                <Text size="xs" color="muted" weight="semibold" className="uppercase tracking-wider">Authentication</Text>
                <Flex direction="row" gap="md">
                  <FormField label="Username" className="flex-1">
                    <Input
                      value={String(profile.username ?? '')}
                      onChange={(e) => update({ username: e.target.value })}
                      placeholder="postgres"
                      size="sm"
                    />
                  </FormField>
                  <FormField label="Password" className="flex-1">
                    <PasswordInput
                      value={String(profile.password ?? '')}
                      onChange={(e) => update({ password: e.target.value })}
                      size="sm"
                    />
                  </FormField>
                </Flex>
                <Flex direction="row" align="center" gap="sm">
                  <Switch
                    label="Use SSL"
                    checked={!!profile.ssl}
                    onChange={(e) => update({ ssl: e.target.checked })}
                  />
                  <Text size="sm" color="secondary">Use SSL</Text>
                </Flex>
              </Stack>
            )}

            {/* SSH Tunnel */}
            {sshFields.length > 0 && !isSqlite && (
              <Box className="border border-border-default rounded-lg overflow-hidden">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSshExpanded(!sshExpanded)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-none border-0 h-auto justify-start"
                >
                  {sshExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <Text size="sm" color="secondary">SSH Tunnel</Text>
                </Button>
                {sshExpanded && (
                  <Stack gap="md" className="px-3 pb-3">
                    {sshFields.map(renderPluginField)}
                  </Stack>
                )}
              </Box>
            )}

            {/* Test Connection */}
            <ConnectionTestButton profile={profile as ConnectionProfile} />
          </Stack>
        </form>
      </Container>
    </ScrollArea>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/components/connections/ConnectionFormView.test.tsx`
Expected: All 9 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/connections/ConnectionFormView.tsx tests/unit/components/connections/ConnectionFormView.test.tsx
git commit -m "feat: create ConnectionFormView with primitives-only UI"
```

---

### Task 4: Wire up `ConnectionFormView` in App.tsx

**Files:**
- Modify: `src/renderer/src/App.tsx:1-158`

- [ ] **Step 1: Add the import for `ConnectionFormView` and `ConnectionFormTab`**

At the top of `App.tsx`, add after the existing imports (after line 11):

```typescript
import { ConnectionFormView } from '@/components/connections/ConnectionFormView'
```

Update the types import on line 18:

```typescript
import type { QueryTab, ErDiagramTab, ConnectionFormTab } from '@shared/types'
```

- [ ] **Step 2: Add the `connection-form` tab rendering case**

In the tab content area (after the `er-diagram` block, after line 107), add:

```tsx
{activeTab?.type === 'connection-form' && (
  <ConnectionFormView
    tabId={activeTab.id}
    editingId={(activeTab as ConnectionFormTab).editingId}
  />
)}
```

- [ ] **Step 3: Update the menu trigger to use tab store**

Replace the `ConnectionFormFromMenu` usage. Change line 29:

```typescript
const openConnectionForm = useTabsStore(s => s.openConnectionForm)
```

Remove `const [showNewConnection, setShowNewConnection] = useState(false)` from line 29.

Replace all `setShowNewConnection(true)` calls (lines 45, 49) with `openConnectionForm()`.

Remove the `{showNewConnection && ...}` block (lines 138-140).

Remove the `ConnectionFormFromMenu` function at the bottom (lines 145-158) and the `ConnectionForm` import (line 146).

Remove `handleStatusBarNewConn` function and its event listener — replace with direct `openConnectionForm` call in the event listener:

In the `useEffect`, the relevant section becomes:

```typescript
const cleanups = [
  window.electronAPI.on('menu:new-query-tab', () => addQueryTab(activeConnectionId)),
  window.electronAPI.on('menu:new-connection', () => openConnectionForm()),
  window.electronAPI.on('menu:toggle-command-palette', () => setPaletteOpen(prev => !prev)),
]

const handleStatusBarNewConn = () => openConnectionForm()
window.addEventListener('statusbar:new-connection', handleStatusBarNewConn)
```

Also update the `useEffect` dependency array to include `openConnectionForm`.

- [ ] **Step 4: Verify the app compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/App.tsx
git commit -m "feat: render ConnectionFormView in editor tab area"
```

---

### Task 5: Update `ConnectionsSection` to use tab-based form

**Files:**
- Modify: `src/renderer/src/components/explorer/ConnectionsSection.tsx:1-153`

- [ ] **Step 1: Replace modal state with tab store action**

Remove the `ConnectionForm` import (line 5):
```typescript
// DELETE: import { ConnectionForm } from '@/components/connections/ConnectionForm'
```

Add tabs store import:
```typescript
import { useTabsStore } from '@/stores/tabs'
```

Inside the component, add:
```typescript
const openConnectionForm = useTabsStore(s => s.openConnectionForm)
```

Remove the `showForm` and `editing` state variables (lines 15-16):
```typescript
// DELETE: const [showForm, setShowForm] = useState(false)
// DELETE: const [editing, setEditing] = useState<ConnectionProfile | undefined>()
```

- [ ] **Step 2: Update all form triggers**

Update `handleSave` (lines 21-25) — this is no longer needed since the form view handles save internally. Remove it.

Update the "New Connection" button onClick (line 80):
```typescript
onClick={() => openConnectionForm()}
```

Update the "Edit" button onClick (line 125):
```typescript
onClick={(e) => { e.stopPropagation(); openConnectionForm(conn.id) }}
```

Update `handleDuplicate` (lines 36-43) — duplicate creates a copy and opens a new-connection form. Since the form tab doesn't support pre-seeded data from a duplicate, we handle this by saving the duplicate first:

```typescript
const handleDuplicate = async (conn: ConnectionProfile) => {
  const duplicate: ConnectionProfile = {
    ...conn,
    id: crypto.randomUUID(),
    name: `${conn.name} (copy)`
  }
  await saveConnection(duplicate)
  openConnectionForm(duplicate.id)
}
```

- [ ] **Step 3: Remove the modal rendering**

Remove the `{showForm && <ConnectionForm ... />}` block (lines 136-138).

- [ ] **Step 4: Verify the app compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/explorer/ConnectionsSection.tsx
git commit -m "feat: replace ConnectionForm modal with tab-based form in sidebar"
```

---

### Task 6: Delete old `ConnectionForm.tsx`

**Files:**
- Delete: `src/renderer/src/components/connections/ConnectionForm.tsx`

- [ ] **Step 1: Verify no remaining imports of `ConnectionForm`**

Run: `grep -r "ConnectionForm" src/renderer/src/ --include="*.tsx" --include="*.ts" -l`

Expected: Only `ConnectionFormView.tsx` and possibly test files should appear. `ConnectionForm.tsx` should NOT be imported anywhere.

- [ ] **Step 2: Delete the old file**

```bash
rm src/renderer/src/components/connections/ConnectionForm.tsx
```

- [ ] **Step 3: Verify the app compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Run all tests**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove old modal-based ConnectionForm"
```

---

### Task 7: Smoke test and final verification

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`
Expected: All tests pass, no regressions

- [ ] **Step 2: Run the type checker**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Start the dev server and manually verify**

Run: `pnpm dev`

Manual checks:
1. Click "New Connection" in the sidebar → connection form tab opens in editor area
2. Select different database types → fields update correctly
3. Switch to SQLite → shows file path field, hides host/port/auth
4. Fill form and click "Add Connection" → connection saved, tab closes
5. Click edit on an existing connection → form opens pre-filled
6. Click Cancel → tab closes without saving
7. Test Connection button works
8. Multiple form tabs can coexist (one new + one edit)
9. Opening same form twice reuses existing tab

- [ ] **Step 4: Final commit if any adjustments needed**

Only if fixes were made during smoke testing.
