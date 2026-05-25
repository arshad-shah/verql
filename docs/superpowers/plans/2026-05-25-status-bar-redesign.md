# Status Bar Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle [src/renderer/src/components/shell/StatusBar.tsx](../../../src/renderer/src/components/shell/StatusBar.tsx) into a VS Code–style edge-to-edge segmented bar without changing what data it shows.

**Architecture:** Decompose `StatusBar.tsx` into a small set of segment components driven by a shared `StatusBarSegment` primitive (CVA recipe). Extract the plugin-polling effect into `usePluginStatus`. Replace `ConnectionCard` with a new `ConnectionSegment` that owns the switcher trigger. Spec: [docs/superpowers/specs/2026-05-25-status-bar-redesign-design.md](../specs/2026-05-25-status-bar-redesign-design.md).

**Tech Stack:** React 19, Zustand, Tailwind, class-variance-authority, lucide-react, Vitest, Storybook (Vitest browser project).

---

## File Structure

```
src/renderer/src/components/shell/
  StatusBar.tsx                              # (modify) composition only
  StatusBar.stories.tsx                      # (modify) add segmented-bar stories
  ConnectionCard.tsx                         # (delete) sole consumer becomes ConnectionSegment
  status-bar/                                # (new dir)
    StatusBarSegment.tsx                     # (new) CVA primitive
    StatusBarSegment.stories.tsx             # (new)
    ConnectionSegment.tsx                    # (new) primary accent segment + switcher trigger
    SchemaSegment.tsx                        # (new) continuation segment
    MultiConnectionSegment.tsx               # (new)
    PluginStatusSegment.tsx                  # (new) polling presentation
    DevSegment.tsx                           # (new)
    usePluginStatus.ts                       # (new) extracted polling hook
    index.ts                                 # (new) barrel
tests/unit/
  usePluginStatus.test.ts                    # (new)
```

`Segment` files are presentation-only and store-aware where needed (each subscribes only to what it renders, to keep re-render scope tight).

---

## Conventions referenced in this plan

- Use the existing `cn` helper at `@/primitives/utils/cn`.
- Use `cva` with `VariantProps`, mirroring [Button.tsx](../../../src/renderer/src/primitives/forms/Button.tsx).
- Path aliases: `@` → `src/renderer/src`, `@shared` → `shared`.
- Test runner: `pnpm test -- --run <file>` for a single file.
- Storybook tests run as part of `pnpm test` (Vitest browser project) — no separate command needed.
- Branch is already `feat/status-bar-redesign` (created during spec).

---

### Task 1: `StatusBarSegment` primitive

The shared building block. Every segment in the bar renders through this so layout, dividers, and hover states stay uniform.

**Files:**
- Create: `src/renderer/src/components/shell/status-bar/StatusBarSegment.tsx`
- Create: `src/renderer/src/components/shell/status-bar/StatusBarSegment.stories.tsx`
- Create: `src/renderer/src/components/shell/status-bar/index.ts`

- [ ] **Step 1: Create the primitive**

`src/renderer/src/components/shell/status-bar/StatusBarSegment.tsx`:

```tsx
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/primitives/utils/cn'

const segmentVariants = cva(
  'inline-flex items-center gap-1.5 h-full px-2.5 text-[11px] leading-none whitespace-nowrap select-none transition-colors',
  {
    variants: {
      tone: {
        // Neutral cell — most right-side segments
        default: 'text-text-secondary',
        // Primary accent — the connection cell
        primary: 'bg-accent text-text-inverse font-semibold',
        // Tinted continuation — the schema cell, reads as path
        schema: 'bg-accent/12 text-accent font-mono text-[10.5px]',
        // Soft accent — the multi-connection counter
        'accent-soft': 'text-warning',
        // Filled dev marker
        dev: 'bg-accent text-text-inverse font-bold uppercase tracking-wider text-[10px]',
        // Disconnected variant of the connection cell
        muted: 'bg-bg-tertiary text-text-primary',
      },
      side: {
        left: 'border-r border-border-default',
        right: 'border-l border-border-default',
        none: '',
      },
      interactive: {
        true: 'cursor-pointer hover:bg-hover/60',
        false: 'cursor-default',
      },
    },
    compoundVariants: [
      // Hover on the filled primary should brighten, not switch to the neutral hover
      { tone: 'primary', interactive: true, className: 'hover:bg-accent-emphasis' },
      { tone: 'schema', interactive: true, className: 'hover:bg-accent/20' },
      { tone: 'muted', interactive: true, className: 'hover:bg-hover' },
      // No hover swap for dev
      { tone: 'dev', interactive: true, className: 'hover:bg-accent' },
    ],
    defaultVariants: {
      tone: 'default',
      side: 'right',
      interactive: false,
    },
  }
)

type SegmentBaseProps = VariantProps<typeof segmentVariants> & {
  children: ReactNode
  className?: string
}

export type StatusBarSegmentProps =
  | (SegmentBaseProps & { as?: 'div' } & Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>)
  | (SegmentBaseProps & { as: 'button' } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>)

export const StatusBarSegment = forwardRef<HTMLElement, StatusBarSegmentProps>(
  ({ tone, side, interactive, className, children, as = 'div', ...rest }, ref) => {
    const cls = cn(segmentVariants({ tone, side, interactive }), className)
    if (as === 'button') {
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          className={cls}
          {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          {children}
        </button>
      )
    }
    return (
      <div ref={ref as React.Ref<HTMLDivElement>} className={cls} {...(rest as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    )
  }
)
StatusBarSegment.displayName = 'StatusBarSegment'
```

- [ ] **Step 2: Add a barrel**

`src/renderer/src/components/shell/status-bar/index.ts`:

```ts
export { StatusBarSegment } from './StatusBarSegment'
export type { StatusBarSegmentProps } from './StatusBarSegment'
```

- [ ] **Step 3: Add a Storybook story**

`src/renderer/src/components/shell/status-bar/StatusBarSegment.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import { StatusBarSegment } from './StatusBarSegment'

const meta: Meta<typeof StatusBarSegment> = {
  title: 'Components/Shell/StatusBar/StatusBarSegment',
  component: StatusBarSegment,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="flex h-7 items-stretch bg-bg-primary border border-border-default rounded">
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof StatusBarSegment>

export const Default: Story = { args: { tone: 'default', children: 'plugin · idle' } }
export const Primary: Story = { args: { tone: 'primary', interactive: true, as: 'button', children: 'analytics_prod' } }
export const Schema: Story = { args: { tone: 'schema', interactive: true, as: 'button', children: '/ public' } }
export const AccentSoft: Story = { args: { tone: 'accent-soft', children: '⇄ 3' } }
export const Muted: Story = { args: { tone: 'muted', interactive: true, as: 'button', children: 'No connection' } }
export const Dev: Story = { args: { tone: 'dev', children: 'DEV' } }
```

- [ ] **Step 4: Run the Storybook tests**

Run: `pnpm test -- --run src/renderer/src/components/shell/status-bar/StatusBarSegment.stories.tsx`
Expected: all stories pass and a11y checks succeed.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/shell/status-bar/StatusBarSegment.tsx \
        src/renderer/src/components/shell/status-bar/StatusBarSegment.stories.tsx \
        src/renderer/src/components/shell/status-bar/index.ts
git commit -m "feat(status-bar): add StatusBarSegment primitive"
```

---

### Task 2: Extract `usePluginStatus` hook

Lift the plugin-polling effect out of `StatusBar.tsx` so the segment that consumes it stays small.

**Files:**
- Create: `src/renderer/src/components/shell/status-bar/usePluginStatus.ts`
- Create: `tests/unit/usePluginStatus.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/unit/usePluginStatus.test.ts`:

```ts
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePluginStatus } from '@/components/shell/status-bar/usePluginStatus'
import { useNotificationsStore } from '@/stores/notifications'
import { IPC_CHANNELS } from '@shared/ipc'

type PluginRow = { status: { state: string } }

function mockInvoke(rows: PluginRow[]) {
  const invoke = vi.fn(async (channel: string) => {
    if (channel === IPC_CHANNELS.PLUGINS_LIST) return rows
    return undefined
  })
  // @ts-expect-error mocked global
  globalThis.window.electronAPI = { invoke, on: vi.fn(() => () => {}) }
  return invoke
}

beforeEach(() => {
  useNotificationsStore.setState({ notifications: [], unreadCount: 0 } as never)
})
afterEach(() => vi.restoreAllMocks())

describe('usePluginStatus', () => {
  it('reports active + total counts after first poll', async () => {
    mockInvoke([
      { status: { state: 'active' } },
      { status: { state: 'active' } },
      { status: { state: 'error' } },
    ])
    const { result } = renderHook(() => usePluginStatus())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.active).toBe(2)
    expect(result.current.total).toBe(3)
    expect(result.current.failed).toBe(1)
  })

  it('reports loading=true while any plugin is in a transitional state', async () => {
    mockInvoke([
      { status: { state: 'activating' } },
      { status: { state: 'active' } },
    ])
    const { result } = renderHook(() => usePluginStatus())
    await waitFor(() => expect(result.current.total).toBe(2))
    expect(result.current.loading).toBe(true)
  })

  it('fires a single notification when failures are detected', async () => {
    mockInvoke([{ status: { state: 'error' } }])
    const add = vi.spyOn(useNotificationsStore.getState(), 'addNotification')
    const { rerender } = renderHook(() => usePluginStatus())
    await waitFor(() => expect(add).toHaveBeenCalledTimes(1))
    rerender()
    expect(add).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test -- --run tests/unit/usePluginStatus.test.ts`
Expected: FAIL with "Cannot find module '@/components/shell/status-bar/usePluginStatus'".

- [ ] **Step 3: Implement the hook**

`src/renderer/src/components/shell/status-bar/usePluginStatus.ts`:

```ts
import { useEffect, useRef, useState } from 'react'
import { useNotificationsStore } from '@/stores/notifications'
import { IPC_CHANNELS } from '@shared/ipc'

export interface PluginStatus {
  total: number
  active: number
  failed: number
  loading: boolean
}

const TRANSITIONAL = new Set(['activating', 'discovered', 'validated', 'resolved'])
const HEALTHY = new Set(['active', 'degraded'])

export function usePluginStatus(): PluginStatus {
  const addNotification = useNotificationsStore((s) => s.addNotification)
  const [status, setStatus] = useState<PluginStatus>({
    total: 0, active: 0, failed: 0, loading: true,
  })
  const notifiedRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      try {
        const list = (await window.electronAPI.invoke(IPC_CHANNELS.PLUGINS_LIST)) as Array<{
          status: { state: string }
        }>
        if (cancelled) return
        const loading = list.some((p) => TRANSITIONAL.has(p.status.state))
        const active = list.filter((p) => HEALTHY.has(p.status.state)).length
        const failed = list.filter((p) => p.status.state === 'error').length
        setStatus({ total: list.length, active, failed, loading })

        if (failed > 0 && !notifiedRef.current) {
          notifiedRef.current = true
          addNotification({
            type: 'warning',
            title: 'Plugin load failure',
            message: `${failed} plugin(s) failed to load`,
            source: { type: 'plugin', id: 'system', label: 'Plugin system' },
          })
        }
      } catch {
        if (!cancelled) setStatus({ total: 0, active: 0, failed: 0, loading: false })
      }
    }

    check()
    const interval = setInterval(check, 2000)
    const timeout = setTimeout(() => clearInterval(interval), 15000)
    return () => {
      cancelled = true
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [addNotification])

  return status
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test -- --run tests/unit/usePluginStatus.test.ts`
Expected: all three tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/shell/status-bar/usePluginStatus.ts \
        tests/unit/usePluginStatus.test.ts
git commit -m "feat(status-bar): extract usePluginStatus hook"
```

---

### Task 3: Left-side segments (Connection, Schema, MultiConnection)

These three segments make up the left cluster. `ConnectionSegment` owns the switcher dropdown and replaces what `ConnectionCard` did.

**Files:**
- Create: `src/renderer/src/components/shell/status-bar/ConnectionSegment.tsx`
- Create: `src/renderer/src/components/shell/status-bar/SchemaSegment.tsx`
- Create: `src/renderer/src/components/shell/status-bar/MultiConnectionSegment.tsx`
- Modify: `src/renderer/src/components/shell/status-bar/index.ts`

- [ ] **Step 1: Create `ConnectionSegment`**

`src/renderer/src/components/shell/status-bar/ConnectionSegment.tsx`:

```tsx
import { useState } from 'react'
import { useConnectionsStore } from '@/stores/connections'
import { ConnectionSwitcher } from '../ConnectionSwitcher'
import { StatusBarSegment } from './StatusBarSegment'
import { cn } from '@/primitives/utils/cn'

const DB_ABBREVIATIONS: Record<string, string> = {
  postgresql: 'PG',
  mysql: 'MY',
  sqlite: 'SL',
  mongodb: 'MG',
  redis: 'RD',
}

interface Props {
  onNewConnection: () => void
}

export function ConnectionSegment({ onNewConnection }: Props) {
  const [open, setOpen] = useState(false)
  const { activeConnectionId, connections, connectedIds } = useConnectionsStore()
  const active = connections.find((c) => c.id === activeConnectionId)
  const isConnected = activeConnectionId ? connectedIds.has(activeConnectionId) : false
  const driver = active?.type
    ? (DB_ABBREVIATIONS[active.type] ?? active.type.slice(0, 2).toUpperCase())
    : null

  return (
    <div className="relative h-full">
      <StatusBarSegment
        as="button"
        tone={isConnected ? 'primary' : 'muted'}
        side="left"
        interactive
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        aria-label="Toggle connection switcher"
      >
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            isConnected
              ? 'bg-success shadow-[0_0_0_2px_rgba(40,200,64,0.25)]'
              : 'bg-text-tertiary'
          )}
        />
        {isConnected && active ? (
          <>
            <span>{active.name}</span>
            {driver && (
              <span className="rounded-sm bg-white/18 px-1 py-px text-[9.5px] font-medium">
                {driver}
              </span>
            )}
          </>
        ) : (
          <>
            <span>No connection</span>
            <span className="rounded-sm bg-white/8 px-1 py-px text-[9.5px] font-medium opacity-80">
              click to connect
            </span>
          </>
        )}
      </StatusBarSegment>
      <ConnectionSwitcher
        isOpen={open}
        onClose={() => setOpen(false)}
        onNewConnection={onNewConnection}
      />
    </div>
  )
}
```

- [ ] **Step 2: Create `SchemaSegment`**

`src/renderer/src/components/shell/status-bar/SchemaSegment.tsx`:

```tsx
import { useTabsStore } from '@/stores/tabs'
import type { QueryTab } from '@shared/types'
import { StatusBarSegment } from './StatusBarSegment'

interface Props {
  onClick: () => void
}

export function SchemaSegment({ onClick }: Props) {
  const { tabs, activeTabId } = useTabsStore()
  const activeTab = tabs.find((t) => t.id === activeTabId)
  const queryTab = activeTab?.type === 'query' ? (activeTab as QueryTab) : null
  if (!queryTab?.schema) return null
  return (
    <StatusBarSegment
      as="button"
      tone="schema"
      side="left"
      interactive
      onClick={onClick}
      aria-label={`Switch schema (current: ${queryTab.schema})`}
    >
      / {queryTab.schema}
    </StatusBarSegment>
  )
}
```

- [ ] **Step 3: Create `MultiConnectionSegment`**

`src/renderer/src/components/shell/status-bar/MultiConnectionSegment.tsx`:

```tsx
import { ArrowLeftRight } from 'lucide-react'
import { useConnectionsStore } from '@/stores/connections'
import { StatusBarSegment } from './StatusBarSegment'

interface Props {
  onClick: () => void
}

export function MultiConnectionSegment({ onClick }: Props) {
  const count = useConnectionsStore((s) => s.connectedIds.size)
  if (count <= 1) return null
  return (
    <StatusBarSegment
      as="button"
      tone="accent-soft"
      side="left"
      interactive
      onClick={onClick}
      aria-label={`${count} active connections`}
    >
      <ArrowLeftRight size={11} aria-hidden />
      <span>{count}</span>
    </StatusBarSegment>
  )
}
```

- [ ] **Step 4: Update the barrel**

`src/renderer/src/components/shell/status-bar/index.ts`:

```ts
export { StatusBarSegment } from './StatusBarSegment'
export type { StatusBarSegmentProps } from './StatusBarSegment'
export { ConnectionSegment } from './ConnectionSegment'
export { SchemaSegment } from './SchemaSegment'
export { MultiConnectionSegment } from './MultiConnectionSegment'
export { usePluginStatus } from './usePluginStatus'
export type { PluginStatus } from './usePluginStatus'
```

- [ ] **Step 5: Type-check**

Run: `pnpm build`
Expected: builds without TypeScript errors. (Compositions land in Task 5; nothing depends on the new files yet.)

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/components/shell/status-bar/ConnectionSegment.tsx \
        src/renderer/src/components/shell/status-bar/SchemaSegment.tsx \
        src/renderer/src/components/shell/status-bar/MultiConnectionSegment.tsx \
        src/renderer/src/components/shell/status-bar/index.ts
git commit -m "feat(status-bar): add left-side segments"
```

---

### Task 4: Right-side segments (PluginStatus, Dev)

**Files:**
- Create: `src/renderer/src/components/shell/status-bar/PluginStatusSegment.tsx`
- Create: `src/renderer/src/components/shell/status-bar/DevSegment.tsx`
- Modify: `src/renderer/src/components/shell/status-bar/index.ts`

- [ ] **Step 1: Create `PluginStatusSegment`**

`src/renderer/src/components/shell/status-bar/PluginStatusSegment.tsx`:

```tsx
import { Spinner } from '@/primitives'
import { cn } from '@/primitives/utils/cn'
import { StatusBarSegment } from './StatusBarSegment'
import { usePluginStatus } from './usePluginStatus'

export function PluginStatusSegment() {
  const status = usePluginStatus()
  if (status.loading) {
    return (
      <StatusBarSegment tone="default" side="right" aria-label="Plugins loading">
        <Spinner size="xs" label="Loading plugins" />
        <span className="text-[10px]">Loading…</span>
      </StatusBarSegment>
    )
  }
  const warn = status.failed > 0
  return (
    <StatusBarSegment
      tone="default"
      side="right"
      aria-label={warn ? `${status.failed} plugins failed` : `${status.active} plugins active`}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', warn ? 'bg-warning' : 'bg-success')} />
      <span className="text-[10px]">
        {warn ? `${status.active}/${status.total} plugins` : `${status.active} plugins`}
      </span>
    </StatusBarSegment>
  )
}
```

- [ ] **Step 2: Create `DevSegment`**

`src/renderer/src/components/shell/status-bar/DevSegment.tsx`:

```tsx
import { StatusBarSegment } from './StatusBarSegment'

const isDev = import.meta.env.DEV

export function DevSegment() {
  if (!isDev) return null
  return (
    <StatusBarSegment tone="dev" side="right" aria-label="Development build">
      DEV
    </StatusBarSegment>
  )
}
```

- [ ] **Step 3: Update the barrel**

`src/renderer/src/components/shell/status-bar/index.ts`:

```ts
export { StatusBarSegment } from './StatusBarSegment'
export type { StatusBarSegmentProps } from './StatusBarSegment'
export { ConnectionSegment } from './ConnectionSegment'
export { SchemaSegment } from './SchemaSegment'
export { MultiConnectionSegment } from './MultiConnectionSegment'
export { PluginStatusSegment } from './PluginStatusSegment'
export { DevSegment } from './DevSegment'
export { usePluginStatus } from './usePluginStatus'
export type { PluginStatus } from './usePluginStatus'
```

- [ ] **Step 4: Type-check**

Run: `pnpm build`
Expected: success.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/shell/status-bar/PluginStatusSegment.tsx \
        src/renderer/src/components/shell/status-bar/DevSegment.tsx \
        src/renderer/src/components/shell/status-bar/index.ts
git commit -m "feat(status-bar): add right-side segments"
```

---

### Task 5: Rewire `StatusBar`, delete `ConnectionCard`, refresh stories

The pre-existing `StatusBar.stories.tsx` already drives the real component through store state — we just need to update the composition and confirm the existing stories still render and pass the browser test suite. Then we delete the now-unused `ConnectionCard`.

**Files:**
- Modify: `src/renderer/src/components/shell/StatusBar.tsx`
- Modify: `src/renderer/src/components/shell/StatusBar.stories.tsx`
- Delete: `src/renderer/src/components/shell/ConnectionCard.tsx`

- [ ] **Step 1: Replace `StatusBar.tsx`**

Overwrite `src/renderer/src/components/shell/StatusBar.tsx` with:

```tsx
import { useCallback, useEffect, useState } from 'react'
import { Flex } from '@/primitives'
import { useConnectionsStore } from '@/stores/connections'
import { usePluginUIStore, selectContributions } from '@/stores/plugin-ui'
import { WidgetRenderer } from '@/components/plugin-ui/WidgetRenderer'
import {
  ConnectionSegment,
  SchemaSegment,
  MultiConnectionSegment,
  PluginStatusSegment,
  DevSegment,
} from './status-bar'

export function StatusBar() {
  const { activeConnectionId, connections, connectedIds } = useConnectionsStore()
  const active = connections.find((c) => c.id === activeConnectionId)
  const isConnected = activeConnectionId ? connectedIds.has(activeConnectionId) : false

  const [showNewConnection, setShowNewConnection] = useState(false)
  const handleNewConnection = useCallback(() => setShowNewConnection(true), [])

  // Emit event for App.tsx to handle new connection form (unchanged contract)
  useEffect(() => {
    if (showNewConnection) {
      window.dispatchEvent(new CustomEvent('statusbar:new-connection'))
      setShowNewConnection(false)
    }
  }, [showNewConnection])

  const statusBarContributions = usePluginUIStore(selectContributions('statusBar'))
  useEffect(() => {
    usePluginUIStore.getState().fetchContributions('statusBar')
  }, [])

  // Schema segment uses the switcher too; trigger by re-using the connection segment's open state
  // via a window event so we don't have to lift state. ConnectionSegment listens for this.
  // (Simpler alternative: keep the click no-op for now — see decision below.)
  const openSwitcher = useCallback(() => {
    window.dispatchEvent(new CustomEvent('statusbar:open-switcher'))
  }, [])

  return (
    <Flex
      align="center"
      className="relative h-7 shrink-0 select-none border-t border-border-default bg-bg-primary"
    >
      {/* Left cluster */}
      <Flex align="stretch" className="h-full">
        <ConnectionSegment onNewConnection={handleNewConnection} />
        <SchemaSegment onClick={openSwitcher} />
        <MultiConnectionSegment onClick={openSwitcher} />
      </Flex>

      <div className="flex-1" />

      {/* Right cluster */}
      <Flex align="stretch" className="h-full">
        {isConnected &&
          statusBarContributions
            .filter(
              (c) =>
                c.meta.zone === 'right' && active?.type && c.pluginId.includes(active.type)
            )
            .map((c) => (
              <div key={c.contributionId} className="flex items-center border-l border-border-default px-2">
                <WidgetRenderer widgets={c.widgets} pluginId={c.pluginId} />
              </div>
            ))}
        <PluginStatusSegment />
        <DevSegment />
      </Flex>
    </Flex>
  )
}
```

- [ ] **Step 2: Wire the schema/multi switcher trigger inside `ConnectionSegment`**

Edit `src/renderer/src/components/shell/status-bar/ConnectionSegment.tsx` — add a window-event listener so `SchemaSegment` and `MultiConnectionSegment` clicks open the same dropdown without prop-drilling. Replace the existing `useState` block with:

```tsx
import { useEffect, useState } from 'react'
// ...

const [open, setOpen] = useState(false)
useEffect(() => {
  const handler = () => setOpen(true)
  window.addEventListener('statusbar:open-switcher', handler)
  return () => window.removeEventListener('statusbar:open-switcher', handler)
}, [])
```

(All other code in `ConnectionSegment` is unchanged from Task 3.)

- [ ] **Step 3: Add a coverage story for each composite state**

Append the following stories to `src/renderer/src/components/shell/StatusBar.stories.tsx` (the file already exports `Default`; keep it). The `seed()` helper in the file already accepts `connections` and `connectedIds`; if the file's existing types need a tweak to accept multiple connections, follow the existing pattern:

```tsx
const SECOND: ConnectionProfile = {
  id: 'sb-second', name: 'analytics_ro', type: 'mysql',
  host: 'db.read.io', port: 3306, database: 'analytics', username: 'reader',
  password: '', color: '#f5a623',
}

export const Disconnected: StoryObj<typeof StatusBar> = {
  render: () => {
    seed({ connectedIds: [], activeId: null, schema: null })
    return <StatusBar />
  },
}

export const MultipleConnections: StoryObj<typeof StatusBar> = {
  render: () => {
    seed({ connections: [PROD, SECOND], connectedIds: ['sb-prod', 'sb-second'] })
    return <StatusBar />
  },
}

export const NoSchema: StoryObj<typeof StatusBar> = {
  render: () => {
    seed({ schema: null })
    return <StatusBar />
  },
}
```

(The existing `Default` story already covers the connected+schema case.)

- [ ] **Step 4: Delete `ConnectionCard.tsx`**

```bash
git rm src/renderer/src/components/shell/ConnectionCard.tsx
```

- [ ] **Step 5: Type-check and run the full test suite**

Run: `pnpm build`
Expected: success, no TS errors, no stray `ConnectionCard` import.

Run: `pnpm test`
Expected: all unit tests + all Storybook tests pass. If the Storybook a11y check flags low contrast on the schema or dev tones, tweak the corresponding `tone` classes in `StatusBarSegment.tsx` (Task 1, Step 1) until it passes — do not bypass the check.

- [ ] **Step 6: Verify visually**

Run: `pnpm storybook` and open `Components/Shell/StatusBar` — confirm `Default`, `Disconnected`, `MultipleConnections`, `NoSchema` all render the segmented look from the mockup. Stop Storybook when done.

- [ ] **Step 7: Commit**

```bash
git add -A src/renderer/src/components/shell/
git commit -m "feat(status-bar): rewire StatusBar to segmented layout and drop ConnectionCard"
```

---

## Verification Checklist

After Task 5 finishes:

- `pnpm build` → success
- `pnpm test` → all green
- `git log --oneline feat/status-bar-redesign ^main` shows: spec commit + 5 task commits
- Visual: `pnpm dev` shows the new segmented bar at the bottom of the app, switcher dropdown opens from the primary segment, plugin status segment polls and updates.
