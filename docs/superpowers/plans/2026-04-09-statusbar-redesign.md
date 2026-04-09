# Status Bar Command Dock — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current accent-colored status bar with a "Command Dock" — a three-zone interactive bar featuring bordered cards, contextual query metrics, a connection switcher dropdown, and a slide-out notification panel.

**Architecture:** The status bar is decomposed into focused components: ConnectionCard (left), StatusBarMetric chips (center), and tool cards (right) including NotificationBell + NotificationPanel. A new `useNotificationsStore` Zustand store provides the notification state. The existing connection/tab stores supply all other data. The ConnectionSwitcher is a custom popover-style dropdown.

**Tech Stack:** React 18, Zustand, Tailwind CSS v4, lucide-react icons, class-variance-authority, vitest + @testing-library/react

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/renderer/src/stores/notifications.ts` | Zustand store for notifications (add, read, clear, panel state) |
| `src/renderer/src/components/shell/StatusBarMetric.tsx` | Reusable tinted chip for contextual metrics |
| `src/renderer/src/components/shell/ConnectionCard.tsx` | Clickable connection display with status orb and dropdown toggle |
| `src/renderer/src/components/shell/ConnectionSwitcher.tsx` | Dropdown listing connections (active, connected, saved) with search |
| `src/renderer/src/components/shell/NotificationItem.tsx` | Single notification row (dot, message, source, timestamp) |
| `src/renderer/src/components/shell/NotificationPanel.tsx` | Slide-out panel with grouped notifications |
| `src/renderer/src/components/shell/NotificationBell.tsx` | Bell icon card with unread badge count |
| `src/renderer/src/components/shell/StatusBar.tsx` | Rewrite — assembles all zones |
| `src/renderer/src/components/shell/StatusBar.stories.tsx` | Rewrite — stories for new design |
| `tests/unit/stores/notifications.test.ts` | Tests for notification store |
| `tests/unit/components/shell/StatusBarMetric.test.tsx` | Tests for metric chip |
| `tests/unit/components/shell/NotificationItem.test.tsx` | Tests for notification row |
| `tests/unit/components/shell/ConnectionCard.test.tsx` | Tests for connection card |

---

## Task 1: Notification Store

**Files:**
- Create: `src/renderer/src/stores/notifications.ts`
- Create: `tests/unit/stores/notifications.test.ts`

- [ ] **Step 1: Write failing tests for the notification store**

Create `tests/unit/stores/notifications.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useNotificationsStore } from '../../../src/renderer/src/stores/notifications'

describe('useNotificationsStore', () => {
  beforeEach(() => {
    useNotificationsStore.setState({
      notifications: [],
      panelOpen: false,
    })
  })

  it('starts with empty notifications and panel closed', () => {
    const state = useNotificationsStore.getState()
    expect(state.notifications).toEqual([])
    expect(state.panelOpen).toBe(false)
  })

  it('adds a notification with generated id, timestamp, and read=false', () => {
    const { addNotification } = useNotificationsStore.getState()
    addNotification({ type: 'error', message: 'Query failed' })

    const { notifications } = useNotificationsStore.getState()
    expect(notifications).toHaveLength(1)
    expect(notifications[0].type).toBe('error')
    expect(notifications[0].message).toBe('Query failed')
    expect(notifications[0].read).toBe(false)
    expect(notifications[0].id).toBeDefined()
    expect(notifications[0].timestamp).toBeGreaterThan(0)
  })

  it('adds notification with optional source', () => {
    const { addNotification } = useNotificationsStore.getState()
    addNotification({
      type: 'info',
      message: 'Connected',
      source: { type: 'connection', id: 'c1', label: 'My DB' },
    })

    const { notifications } = useNotificationsStore.getState()
    expect(notifications[0].source).toEqual({ type: 'connection', id: 'c1', label: 'My DB' })
  })

  it('prepends new notifications (newest first)', () => {
    const { addNotification } = useNotificationsStore.getState()
    addNotification({ type: 'info', message: 'First' })
    addNotification({ type: 'error', message: 'Second' })

    const { notifications } = useNotificationsStore.getState()
    expect(notifications[0].message).toBe('Second')
    expect(notifications[1].message).toBe('First')
  })

  it('prunes oldest when exceeding 50 notifications', () => {
    const { addNotification } = useNotificationsStore.getState()
    for (let i = 0; i < 52; i++) {
      addNotification({ type: 'info', message: `Notification ${i}` })
    }

    const { notifications } = useNotificationsStore.getState()
    expect(notifications).toHaveLength(50)
    expect(notifications[0].message).toBe('Notification 51')
  })

  it('marks a single notification as read', () => {
    const { addNotification } = useNotificationsStore.getState()
    addNotification({ type: 'error', message: 'Fail' })

    const id = useNotificationsStore.getState().notifications[0].id
    useNotificationsStore.getState().markRead(id)

    expect(useNotificationsStore.getState().notifications[0].read).toBe(true)
  })

  it('marks all notifications as read', () => {
    const { addNotification } = useNotificationsStore.getState()
    addNotification({ type: 'error', message: 'One' })
    addNotification({ type: 'info', message: 'Two' })

    useNotificationsStore.getState().markAllRead()

    const { notifications } = useNotificationsStore.getState()
    expect(notifications.every(n => n.read)).toBe(true)
  })

  it('clears all notifications', () => {
    const { addNotification } = useNotificationsStore.getState()
    addNotification({ type: 'error', message: 'One' })
    addNotification({ type: 'info', message: 'Two' })

    useNotificationsStore.getState().clearAll()
    expect(useNotificationsStore.getState().notifications).toEqual([])
  })

  it('toggles panel open/closed', () => {
    const { togglePanel } = useNotificationsStore.getState()
    togglePanel()
    expect(useNotificationsStore.getState().panelOpen).toBe(true)
    togglePanel()
    expect(useNotificationsStore.getState().panelOpen).toBe(false)
  })

  it('closes panel explicitly', () => {
    useNotificationsStore.setState({ panelOpen: true })
    useNotificationsStore.getState().closePanel()
    expect(useNotificationsStore.getState().panelOpen).toBe(false)
  })

  it('computes unread count', () => {
    const { addNotification } = useNotificationsStore.getState()
    addNotification({ type: 'error', message: 'One' })
    addNotification({ type: 'info', message: 'Two' })
    addNotification({ type: 'info', message: 'Three' })

    expect(useNotificationsStore.getState().unreadCount()).toBe(3)

    const id = useNotificationsStore.getState().notifications[0].id
    useNotificationsStore.getState().markRead(id)
    expect(useNotificationsStore.getState().unreadCount()).toBe(2)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/stores/notifications.test.ts`
Expected: FAIL — module `stores/notifications` not found

- [ ] **Step 3: Implement the notification store**

Create `src/renderer/src/stores/notifications.ts`:

```typescript
import { create } from 'zustand'

export interface Notification {
  id: string
  type: 'error' | 'warning' | 'info' | 'success'
  message: string
  source?: { type: 'tab' | 'connection' | 'plugin'; id: string; label: string }
  timestamp: number
  read: boolean
}

interface NotificationsState {
  notifications: Notification[]
  panelOpen: boolean
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markRead: (id: string) => void
  markAllRead: () => void
  clearAll: () => void
  togglePanel: () => void
  closePanel: () => void
  unreadCount: () => number
}

const MAX_NOTIFICATIONS = 50

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  panelOpen: false,

  addNotification: (n) => {
    const notification: Notification = {
      ...n,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      read: false,
    }
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, MAX_NOTIFICATIONS),
    }))
  },

  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  clearAll: () => set({ notifications: [] }),

  togglePanel: () => set((state) => ({ panelOpen: !state.panelOpen })),

  closePanel: () => set({ panelOpen: false }),

  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}))
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/stores/notifications.test.ts`
Expected: All 11 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/stores/notifications.ts tests/unit/stores/notifications.test.ts
git commit -m "feat: add notification store with add/read/clear/panel state"
```

---

## Task 2: StatusBarMetric Chip Component

**Files:**
- Create: `src/renderer/src/components/shell/StatusBarMetric.tsx`
- Create: `tests/unit/components/shell/StatusBarMetric.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/components/shell/StatusBarMetric.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { StatusBarMetric } from '../../../../src/renderer/src/components/shell/StatusBarMetric'

describe('StatusBarMetric', () => {
  it('renders label text', () => {
    render(<StatusBarMetric color="success" label="142ms" />)
    expect(screen.getByText('142ms')).toBeInTheDocument()
  })

  it('renders with an icon when provided', () => {
    render(<StatusBarMetric color="success" label="142ms" icon="⚡" />)
    expect(screen.getByText('⚡')).toBeInTheDocument()
  })

  it('applies success color classes', () => {
    const { container } = render(<StatusBarMetric color="success" label="ok" />)
    const chip = container.firstChild as HTMLElement
    expect(chip.className).toContain('text-success')
  })

  it('applies error color classes', () => {
    const { container } = render(<StatusBarMetric color="error" label="fail" />)
    const chip = container.firstChild as HTMLElement
    expect(chip.className).toContain('text-error')
  })

  it('applies warning color classes', () => {
    const { container } = render(<StatusBarMetric color="warning" label="slow" />)
    const chip = container.firstChild as HTMLElement
    expect(chip.className).toContain('text-warning')
  })

  it('applies info color classes', () => {
    const { container } = render(<StatusBarMetric color="info" label="248 rows" />)
    const chip = container.firstChild as HTMLElement
    expect(chip.className).toContain('text-info')
  })

  it('shows animated pulse dot when animated prop is true', () => {
    const { container } = render(<StatusBarMetric color="warning" label="Running..." animated />)
    const dot = container.querySelector('[data-animated-dot]')
    expect(dot).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/components/shell/StatusBarMetric.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement StatusBarMetric**

Create `src/renderer/src/components/shell/StatusBarMetric.tsx`:

```tsx
import { cn } from '@/primitives/utils/cn'

const colorMap = {
  success: {
    bg: 'bg-success/8',
    border: 'border-success/15',
    text: 'text-success',
    dot: 'bg-success',
  },
  error: {
    bg: 'bg-error/8',
    border: 'border-error/15',
    text: 'text-error',
    dot: 'bg-error',
  },
  warning: {
    bg: 'bg-warning/8',
    border: 'border-warning/15',
    text: 'text-warning',
    dot: 'bg-warning',
  },
  info: {
    bg: 'bg-info/8',
    border: 'border-info/15',
    text: 'text-info',
    dot: 'bg-info',
  },
} as const

type MetricColor = keyof typeof colorMap

interface StatusBarMetricProps {
  color: MetricColor
  label: string
  icon?: string
  animated?: boolean
  className?: string
}

export function StatusBarMetric({ color, label, icon, animated, className }: StatusBarMetricProps) {
  const colors = colorMap[color]

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-[5px] border px-2 py-0.5 text-[10px]',
        colors.bg,
        colors.border,
        colors.text,
        className
      )}
    >
      {animated && (
        <div
          data-animated-dot
          className={cn('h-1.5 w-1.5 rounded-full animate-pulse', colors.dot)}
        />
      )}
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/components/shell/StatusBarMetric.test.tsx`
Expected: All 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/shell/StatusBarMetric.tsx tests/unit/components/shell/StatusBarMetric.test.tsx
git commit -m "feat: add StatusBarMetric tinted chip component"
```

---

## Task 3: NotificationItem Component

**Files:**
- Create: `src/renderer/src/components/shell/NotificationItem.tsx`
- Create: `tests/unit/components/shell/NotificationItem.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/components/shell/NotificationItem.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { NotificationItem } from '../../../../src/renderer/src/components/shell/NotificationItem'
import type { Notification } from '../../../../src/renderer/src/stores/notifications'

const makeNotification = (overrides: Partial<Notification> = {}): Notification => ({
  id: 'n1',
  type: 'error',
  message: 'Query failed: relation "userss" does not exist',
  timestamp: Date.now() - 120_000, // 2 minutes ago
  read: false,
  ...overrides,
})

describe('NotificationItem', () => {
  it('renders the notification message', () => {
    render(<NotificationItem notification={makeNotification()} onClick={() => {}} />)
    expect(screen.getByText(/Query failed/)).toBeInTheDocument()
  })

  it('renders source label and relative time', () => {
    render(
      <NotificationItem
        notification={makeNotification({
          source: { type: 'tab', id: 't1', label: 'User Query' },
        })}
        onClick={() => {}}
      />
    )
    expect(screen.getByText(/User Query/)).toBeInTheDocument()
  })

  it('applies dimmed style when read', () => {
    const { container } = render(
      <NotificationItem notification={makeNotification({ read: true })} onClick={() => {}} />
    )
    expect(container.firstChild).toHaveClass('opacity-60')
  })

  it('does not apply dimmed style when unread', () => {
    const { container } = render(
      <NotificationItem notification={makeNotification({ read: false })} onClick={() => {}} />
    )
    expect(container.firstChild).not.toHaveClass('opacity-60')
  })

  it('calls onClick when clicked', () => {
    const handler = vi.fn()
    render(<NotificationItem notification={makeNotification()} onClick={handler} />)
    fireEvent.click(screen.getByText(/Query failed/).closest('div[role="button"]')!)
    expect(handler).toHaveBeenCalledWith('n1')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/components/shell/NotificationItem.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement NotificationItem**

Create `src/renderer/src/components/shell/NotificationItem.tsx`:

```tsx
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
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(id)}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(id) }}
      className={cn(
        'flex items-start gap-2 px-3.5 py-1.5 cursor-pointer border-b border-white/[0.03] hover:bg-hover',
        read && 'opacity-60'
      )}
    >
      <div
        className={cn(
          'mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full',
          dotColorMap[type],
          read && 'opacity-40'
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-text-primary truncate">{message}</div>
        <div className="mt-0.5 text-[9px] text-text-tertiary">
          {source && <span>{source.label} · </span>}
          {formatRelativeTime(timestamp)}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/components/shell/NotificationItem.test.tsx`
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/shell/NotificationItem.tsx tests/unit/components/shell/NotificationItem.test.tsx
git commit -m "feat: add NotificationItem component with relative timestamps"
```

---

## Task 4: NotificationPanel Component

**Files:**
- Create: `src/renderer/src/components/shell/NotificationPanel.tsx`

- [ ] **Step 1: Implement NotificationPanel**

Create `src/renderer/src/components/shell/NotificationPanel.tsx`:

```tsx
import { useEffect, useRef } from 'react'
import { useNotificationsStore } from '@/stores/notifications'
import { NotificationItem } from './NotificationItem'
import { Bell } from 'lucide-react'
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

  // Close on Escape
  useEffect(() => {
    if (!panelOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [panelOpen, closePanel])

  // Close on click outside
  useEffect(() => {
    if (!panelOpen) return
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        closePanel()
      }
    }
    // Delay to avoid closing on the same click that opened it
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
    <div
      ref={panelRef}
      className={cn(
        'absolute bottom-full right-0 mb-0 w-80 max-h-[350px] overflow-y-auto',
        'bg-bg-secondary border border-border-default border-b-0',
        'rounded-t-lg shadow-[0_-4px_24px_rgba(0,0,0,0.4)]',
        'animate-in slide-in-from-bottom-2 duration-150'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border-default">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-primary">Notifications</span>
          {unread > 0 && (
            <span className="rounded-full bg-error/15 px-1.5 py-px text-[9px] font-semibold text-error">
              {unread} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button onClick={markAllRead} className="text-[10px] text-accent hover:text-accent-hover">
              Mark all read
            </button>
          )}
          <button onClick={closePanel} className="text-[10px] text-text-tertiary hover:text-text-secondary">
            ✕
          </button>
        </div>
      </div>

      {/* Body */}
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 px-4">
          <Bell size={24} className="text-text-disabled" />
          <span className="text-[11px] text-text-tertiary">All caught up</span>
          <span className="text-[10px] text-text-disabled">No new notifications</span>
        </div>
      ) : (
        grouped.map((group) => (
          <div key={group.category}>
            <div className={cn('px-3.5 pt-2 pb-0.5 text-[9px] uppercase tracking-wider font-semibold', categoryColors[group.category])}>
              {categoryLabels[group.category]}
            </div>
            {group.items.map((n) => (
              <NotificationItem key={n.id} notification={n} onClick={handleItemClick} />
            ))}
          </div>
        ))
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --project tsconfig.web.json 2>&1 | head -20`
Expected: No errors related to NotificationPanel

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/shell/NotificationPanel.tsx
git commit -m "feat: add NotificationPanel slide-out component with grouped categories"
```

---

## Task 5: NotificationBell Component

**Files:**
- Create: `src/renderer/src/components/shell/NotificationBell.tsx`

- [ ] **Step 1: Implement NotificationBell**

Create `src/renderer/src/components/shell/NotificationBell.tsx`:

```tsx
import { Bell } from 'lucide-react'
import { useNotificationsStore } from '@/stores/notifications'
import { NotificationPanel } from './NotificationPanel'
import { cn } from '@/primitives/utils/cn'

export function NotificationBell() {
  const { panelOpen, togglePanel, unreadCount } = useNotificationsStore()
  const unread = unreadCount()

  return (
    <div className="relative">
      <button
        onClick={togglePanel}
        className={cn(
          'flex items-center rounded-md border px-2 py-1 transition-colors',
          panelOpen
            ? 'border-accent/30 bg-accent/10'
            : 'border-border-default bg-bg-tertiary hover:bg-hover'
        )}
      >
        <Bell
          size={12}
          className={cn(panelOpen ? 'text-accent' : 'text-text-secondary')}
        />
        {unread > 0 && (
          <div className="absolute -right-1 -top-1 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-error px-0.5 text-[7px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </div>
        )}
      </button>
      <NotificationPanel />
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --project tsconfig.web.json 2>&1 | head -20`
Expected: No errors related to NotificationBell

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/shell/NotificationBell.tsx
git commit -m "feat: add NotificationBell with badge count and panel toggle"
```

---

## Task 6: ConnectionCard Component

**Files:**
- Create: `src/renderer/src/components/shell/ConnectionCard.tsx`
- Create: `tests/unit/components/shell/ConnectionCard.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/components/shell/ConnectionCard.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { ConnectionCard } from '../../../../src/renderer/src/components/shell/ConnectionCard'

describe('ConnectionCard', () => {
  const connected = {
    isConnected: true,
    isError: false,
    dbType: 'postgresql' as const,
    dbName: 'my_app_db',
    schema: 'public',
    isOpen: false,
    onClick: vi.fn(),
  }

  it('renders DB type abbreviation for postgresql', () => {
    render(<ConnectionCard {...connected} />)
    expect(screen.getByText('PG')).toBeInTheDocument()
  })

  it('renders database name', () => {
    render(<ConnectionCard {...connected} />)
    expect(screen.getByText('my_app_db')).toBeInTheDocument()
  })

  it('renders schema with / prefix', () => {
    render(<ConnectionCard {...connected} />)
    expect(screen.getByText('/ public')).toBeInTheDocument()
  })

  it('renders "No connection" when disconnected', () => {
    render(
      <ConnectionCard
        isConnected={false}
        isError={false}
        dbType={null}
        dbName={null}
        schema={null}
        isOpen={false}
        onClick={vi.fn()}
      />
    )
    expect(screen.getByText('No connection')).toBeInTheDocument()
  })

  it('renders "Connection lost" in error state', () => {
    render(
      <ConnectionCard
        {...connected}
        isError={true}
      />
    )
    expect(screen.getByText('Connection lost')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handler = vi.fn()
    render(<ConnectionCard {...connected} onClick={handler} />)
    fireEvent.click(screen.getByRole('button'))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('shows mysql abbreviation', () => {
    render(<ConnectionCard {...connected} dbType="mysql" />)
    expect(screen.getByText('MY')).toBeInTheDocument()
  })

  it('shows sqlite abbreviation', () => {
    render(<ConnectionCard {...connected} dbType="sqlite" />)
    expect(screen.getByText('SL')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/components/shell/ConnectionCard.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement ConnectionCard**

Create `src/renderer/src/components/shell/ConnectionCard.tsx`:

```tsx
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
  const abbreviation = dbType ? (DB_ABBREVIATIONS[dbType] ?? dbType.slice(0, 2).toUpperCase()) : null
  const typeColor = dbType ? (DB_TYPE_COLORS[dbType] ?? 'text-text-primary') : 'text-text-tertiary'

  const isDisconnected = !isConnected && !isError

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] transition-colors',
        isError
          ? 'border-error/20 bg-error/8 hover:bg-error/12'
          : isOpen
            ? 'border-accent/30 bg-accent/10'
            : 'border-border-default bg-bg-tertiary hover:bg-hover',
        isDisconnected && 'opacity-60'
      )}
    >
      {/* Status orb */}
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
          <span className={cn('font-semibold', isError ? 'text-error' : typeColor)}>
            {abbreviation}
          </span>
          <span className={cn(isError ? 'text-error' : 'text-text-primary')}>
            {dbName}
          </span>
          {isError ? (
            <span className="text-error/60">Connection lost</span>
          ) : (
            schema && <span className="text-text-tertiary">/ {schema}</span>
          )}
        </>
      ) : (
        <span className="text-text-tertiary">No connection</span>
      )}

      {/* Dropdown arrow */}
      <span className={cn('ml-0.5 text-[8px]', isOpen ? 'text-accent' : 'text-text-disabled')}>
        {isOpen ? '▴' : '▾'}
      </span>
    </button>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/components/shell/ConnectionCard.test.tsx`
Expected: All 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/shell/ConnectionCard.tsx tests/unit/components/shell/ConnectionCard.test.tsx
git commit -m "feat: add ConnectionCard with status orb, DB type colors, and state variants"
```

---

## Task 7: ConnectionSwitcher Dropdown

**Files:**
- Create: `src/renderer/src/components/shell/ConnectionSwitcher.tsx`

- [ ] **Step 1: Implement ConnectionSwitcher**

Create `src/renderer/src/components/shell/ConnectionSwitcher.tsx`:

```tsx
import { useState, useEffect, useRef } from 'react'
import { useConnectionsStore } from '@/stores/connections'
import { Search, Plus, Check } from 'lucide-react'
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

interface ConnectionSwitcherProps {
  isOpen: boolean
  onClose: () => void
  onNewConnection: () => void
}

export function ConnectionSwitcher({ isOpen, onClose, onNewConnection }: ConnectionSwitcherProps) {
  const { connections, activeConnectionId, connectedIds, setActiveConnection, connect } =
    useConnectionsStore()
  const [filter, setFilter] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus search on open
  useEffect(() => {
    if (isOpen) {
      setFilter('')
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handleClick)
    }, 0)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('mousedown', handleClick)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const lowerFilter = filter.toLowerCase()
  const filtered = connections.filter(
    (c) =>
      c.name.toLowerCase().includes(lowerFilter) ||
      c.database.toLowerCase().includes(lowerFilter) ||
      (c.host ?? '').toLowerCase().includes(lowerFilter)
  )

  const activeConn = filtered.find((c) => c.id === activeConnectionId)
  const connectedConns = filtered.filter(
    (c) => c.id !== activeConnectionId && connectedIds.has(c.id)
  )
  const savedConns = filtered.filter((c) => !connectedIds.has(c.id))

  const handleSelect = async (id: string) => {
    if (connectedIds.has(id)) {
      setActiveConnection(id)
    } else {
      await connect(id)
    }
    onClose()
  }

  const renderConnection = (c: typeof connections[0], isActive: boolean) => {
    const abbr = DB_ABBREVIATIONS[c.type] ?? c.type.slice(0, 2).toUpperCase()
    const color = DB_TYPE_COLORS[c.type] ?? 'text-text-primary'
    const isLive = connectedIds.has(c.id)

    return (
      <div
        key={c.id}
        role="button"
        tabIndex={0}
        onClick={() => handleSelect(c.id)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSelect(c.id) }}
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer',
          isActive
            ? 'bg-accent/10 border border-accent/20'
            : 'hover:bg-hover',
          !isLive && 'opacity-50'
        )}
      >
        <div
          className={cn(
            'h-[7px] w-[7px] shrink-0 rounded-full',
            isLive ? 'bg-success shadow-[0_0_4px_rgba(40,200,64,0.4)]' : 'bg-text-tertiary'
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className={cn('text-[10px] font-semibold', color)}>{abbr}</span>
            <span className="text-[10px] text-text-primary truncate">{c.name}</span>
          </div>
          <div className="text-[9px] text-text-tertiary truncate">
            {c.host ? `${c.host}${c.port ? `:${c.port}` : ''}` : c.database}
          </div>
        </div>
        {isActive && <Check size={10} className="text-accent shrink-0" />}
      </div>
    )
  }

  return (
    <div
      ref={panelRef}
      className={cn(
        'absolute bottom-full left-0 mb-1 w-[260px]',
        'bg-bg-secondary border border-border-default',
        'rounded-t-lg shadow-[0_-4px_20px_rgba(0,0,0,0.5)]',
        'animate-in slide-in-from-bottom-2 duration-150'
      )}
    >
      {/* Search */}
      <div className="p-2 border-b border-border-default">
        <div className="flex items-center gap-1.5 rounded-[5px] border border-border-default bg-bg-tertiary px-2 py-1">
          <Search size={11} className="text-text-tertiary shrink-0" />
          <input
            ref={inputRef}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter connections..."
            className="flex-1 bg-transparent text-[10px] text-text-primary placeholder:text-text-tertiary outline-none"
          />
        </div>
      </div>

      {/* Active */}
      {activeConn && (
        <div className="px-1.5 pt-1">
          <div className="px-1.5 py-1 text-[8px] uppercase tracking-wider text-text-tertiary font-semibold">
            Active
          </div>
          {renderConnection(activeConn, true)}
        </div>
      )}

      {/* Connected */}
      {connectedConns.length > 0 && (
        <div className="px-1.5 pt-0.5">
          <div className="px-1.5 py-1 text-[8px] uppercase tracking-wider text-text-tertiary font-semibold">
            Connected
          </div>
          {connectedConns.map((c) => renderConnection(c, false))}
        </div>
      )}

      {/* Saved */}
      {savedConns.length > 0 && (
        <div className="px-1.5 pt-0.5 border-t border-white/[0.03]">
          <div className="px-1.5 py-1 text-[8px] uppercase tracking-wider text-text-tertiary font-semibold">
            Saved
          </div>
          {savedConns.map((c) => renderConnection(c, false))}
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-border-default p-1.5">
        <button
          onClick={() => { onNewConnection(); onClose() }}
          className="flex w-full items-center justify-center gap-1 rounded-md py-1 text-[10px] text-accent hover:bg-hover"
        >
          <Plus size={10} />
          New connection
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --project tsconfig.web.json 2>&1 | head -20`
Expected: No errors related to ConnectionSwitcher

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/shell/ConnectionSwitcher.tsx
git commit -m "feat: add ConnectionSwitcher dropdown with search and grouped sections"
```

---

## Task 8: Rewrite StatusBar Component

**Files:**
- Rewrite: `src/renderer/src/components/shell/StatusBar.tsx`

- [ ] **Step 1: Rewrite the StatusBar**

Replace the entire contents of `src/renderer/src/components/shell/StatusBar.tsx`:

```tsx
import { useEffect, useState, useCallback, useRef } from 'react'
import { useConnectionsStore } from '@/stores/connections'
import { useTabsStore } from '@/stores/tabs'
import { useNotificationsStore } from '@/stores/notifications'
import { Flex, Spinner, Text } from '@/primitives'
import { cn } from '@/primitives/utils/cn'
import { ConnectionCard } from './ConnectionCard'
import { ConnectionSwitcher } from './ConnectionSwitcher'
import { StatusBarMetric } from './StatusBarMetric'
import { NotificationBell } from './NotificationBell'
import type { QueryTab } from '@shared/types'

interface PluginStatus {
  total: number
  active: number
  failed: number
  loading: boolean
}

const isDev = import.meta.env.DEV

export function StatusBar() {
  const { activeConnectionId, connections, connectedIds } = useConnectionsStore()
  const { tabs, activeTabId } = useTabsStore()
  const addNotification = useNotificationsStore((s) => s.addNotification)
  const active = connections.find((c) => c.id === activeConnectionId)
  const isConnected = activeConnectionId ? connectedIds.has(activeConnectionId) : false
  const activeTab = tabs.find((t) => t.id === activeTabId)
  const queryTab = activeTab?.type === 'query' ? (activeTab as QueryTab) : null

  const [pluginStatus, setPluginStatus] = useState<PluginStatus>({
    total: 0,
    active: 0,
    failed: 0,
    loading: true,
  })
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [showNewConnection, setShowNewConnection] = useState(false)
  const pluginFailNotified = useRef(false)

  // Plugin polling (same logic as before, with notification on failure)
  useEffect(() => {
    const check = async () => {
      try {
        const list = await window.electronAPI.invoke('plugins:list')
        const activating = list.some(
          (p: { status: { state: string } }) =>
            p.status.state === 'activating' ||
            p.status.state === 'discovered' ||
            p.status.state === 'validated' ||
            p.status.state === 'resolved'
        )
        const activeCount = list.filter(
          (p: { status: { state: string } }) =>
            p.status.state === 'active' || p.status.state === 'degraded'
        ).length
        const failedCount = list.filter(
          (p: { status: { state: string } }) => p.status.state === 'error'
        ).length

        setPluginStatus({
          total: list.length,
          active: activeCount,
          failed: failedCount,
          loading: activating,
        })

        // Notify once when plugin failures are detected
        if (failedCount > 0 && !pluginFailNotified.current) {
          pluginFailNotified.current = true
          addNotification({
            type: 'warning',
            message: `${failedCount} plugin(s) failed to load`,
            source: { type: 'plugin', id: 'system', label: 'Plugin system' },
          })
        }
      } catch {
        setPluginStatus({ total: 0, active: 0, failed: 0, loading: false })
      }
    }

    check()
    const interval = setInterval(check, 2000)
    const timeout = setTimeout(() => clearInterval(interval), 15000)
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [addNotification])

  // Close switcher when new-connection form is needed
  const handleNewConnection = useCallback(() => {
    setShowNewConnection(true)
  }, [])

  // Emit event for App.tsx to handle new connection form
  useEffect(() => {
    if (showNewConnection) {
      window.dispatchEvent(new CustomEvent('statusbar:new-connection'))
      setShowNewConnection(false)
    }
  }, [showNewConnection])

  const connectionCount = connectedIds.size

  return (
    <Flex
      align="center"
      className="relative h-[38px] shrink-0 select-none border-t border-border-default bg-bg-primary px-3"
    >
      {/* Left zone */}
      <Flex align="center" gap="xs" className="mr-auto">
        <div className="relative">
          <ConnectionCard
            isConnected={isConnected}
            isError={false}
            dbType={active?.type ?? null}
            dbName={active?.name ?? null}
            schema={queryTab?.schema ?? null}
            isOpen={switcherOpen}
            onClick={() => setSwitcherOpen((prev) => !prev)}
          />
          <ConnectionSwitcher
            isOpen={switcherOpen}
            onClose={() => setSwitcherOpen(false)}
            onNewConnection={handleNewConnection}
          />
        </div>

        {/* Connection count badge */}
        {connectionCount > 1 && (
          <div className="flex items-center gap-1 rounded-[5px] border border-accent/15 bg-accent/8 px-1.5 py-0.5">
            <Text size="xs" color="accent" className="text-[10px]">
              ↔ {connectionCount}
            </Text>
          </div>
        )}
      </Flex>

      {/* Center zone — contextual metrics */}
      <Flex align="center" gap="xs">
        {!isConnected ? (
          <Text size="xs" color="disabled">—</Text>
        ) : queryTab?.isExecuting ? (
          <StatusBarMetric color="warning" label="Running..." animated />
        ) : queryTab?.error ? (
          <StatusBarMetric color="error" label="Query failed" icon="⚠" />
        ) : queryTab?.results ? (
          <>
            <StatusBarMetric
              color="success"
              label={`⚡ ${queryTab.results.duration}ms`}
            />
            <StatusBarMetric
              color="info"
              label={`${queryTab.results.rowCount} rows`}
            />
          </>
        ) : null}
      </Flex>

      {/* Right zone — tools */}
      <Flex align="center" gap="xs" className="ml-auto">
        {/* Plugin status */}
        <div
          className={cn(
            'flex items-center gap-1 rounded-md border border-border-default bg-bg-tertiary px-2 py-1'
          )}
        >
          {pluginStatus.loading ? (
            <>
              <Spinner size="xs" label="Loading plugins" />
              <Text size="xs" color="secondary" className="text-[10px]">
                Loading...
              </Text>
            </>
          ) : (
            <>
              <div
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  pluginStatus.failed > 0 ? 'bg-warning' : 'bg-success'
                )}
              />
              <Text size="xs" color="secondary" className="text-[10px]">
                {pluginStatus.failed > 0
                  ? `${pluginStatus.active}/${pluginStatus.total} plugins`
                  : `${pluginStatus.active} plugins`}
              </Text>
            </>
          )}
        </div>

        {/* Notification bell */}
        <NotificationBell />

        {/* DEV badge */}
        {isDev && (
          <div className="rounded-md bg-accent px-1.5 py-1 text-[9px] font-semibold text-white">
            DEV
          </div>
        )}
      </Flex>
    </Flex>
  )
}
```

- [ ] **Step 2: Wire up the new-connection event in App.tsx**

In `src/renderer/src/App.tsx`, add an event listener for `statusbar:new-connection`. Find the `useEffect` that sets up `menu:new-connection` and add:

```typescript
// Inside the existing useEffect that handles menu events, add:
const handleStatusBarNewConn = () => setShowNewConnection(true)
window.addEventListener('statusbar:new-connection', handleStatusBarNewConn)

// In the cleanup, add:
window.removeEventListener('statusbar:new-connection', handleStatusBarNewConn)
```

- [ ] **Step 3: Verify the app builds**

Run: `npx tsc --noEmit --project tsconfig.web.json 2>&1 | head -30`
Expected: No compilation errors

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/shell/StatusBar.tsx src/renderer/src/App.tsx
git commit -m "feat: rewrite StatusBar as Command Dock with three-zone layout"
```

---

## Task 9: Add Notification Dispatchers

**Files:**
- Modify: `src/renderer/src/components/query/QueryPanel.tsx`
- Modify: `src/renderer/src/stores/connections.ts`

- [ ] **Step 1: Add notification dispatch on query failure**

In `src/renderer/src/components/query/QueryPanel.tsx`, import the notifications store at the top:

```typescript
import { useNotificationsStore } from '@/stores/notifications'
```

Inside the `QueryPanel` component, get `addNotification`:

```typescript
const addNotification = useNotificationsStore(s => s.addNotification)
```

In the `handleExecute` catch block, add a notification dispatch after `setTabError`:

```typescript
catch (err) {
  const message = (err as Error).message
  setTabError(tab.id, message)
  addNotification({
    type: 'error',
    message: `Query failed: ${message}`,
    source: { type: 'tab', id: tab.id, label: tab.title },
  })
}
```

- [ ] **Step 2: Add notification dispatch on connect/disconnect**

In `src/renderer/src/stores/connections.ts`, import the notifications store at the top:

```typescript
import { useNotificationsStore } from './notifications'
```

In the `connect` method, after `if (result.success)`, add:

```typescript
const conn = get().connections.find(c => c.id === id)
useNotificationsStore.getState().addNotification({
  type: 'info',
  message: `Connected to ${conn?.name ?? id}`,
  source: { type: 'connection', id, label: conn?.name ?? id },
})
```

After the `if (result.success)` block, add an else for failure:

```typescript
if (!result.success) {
  const conn = get().connections.find(c => c.id === id)
  useNotificationsStore.getState().addNotification({
    type: 'error',
    message: `Connection failed: ${result.error ?? 'Unknown error'}`,
    source: { type: 'connection', id, label: conn?.name ?? id },
  })
}
```

In the `disconnect` method, after `removeConnected(id)`, add:

```typescript
const conn = get().connections.find(c => c.id === id)
useNotificationsStore.getState().addNotification({
  type: 'info',
  message: `Disconnected from ${conn?.name ?? id}`,
  source: { type: 'connection', id, label: conn?.name ?? id },
})
```

- [ ] **Step 3: Verify the app builds**

Run: `npx tsc --noEmit --project tsconfig.web.json 2>&1 | head -20`
Expected: No compilation errors

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/query/QueryPanel.tsx src/renderer/src/stores/connections.ts
git commit -m "feat: dispatch notifications on query failure and connect/disconnect"
```

---

## Task 10: Rewrite Storybook Stories

**Files:**
- Rewrite: `src/renderer/src/components/shell/StatusBar.stories.tsx`

- [ ] **Step 1: Rewrite stories for the Command Dock**

Replace the entire contents of `src/renderer/src/components/shell/StatusBar.stories.tsx`:

```tsx
import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Flex, Text, Spinner } from '@/primitives'
import { Bell } from 'lucide-react'
import { StatusBarMetric } from './StatusBarMetric'
import { ConnectionCard } from './ConnectionCard'
import { cn } from '@/primitives/utils/cn'

/**
 * The Command Dock sits at the bottom of the application window.
 * Three-zone layout: connection card (left), contextual metrics (center), tools (right).
 *
 * ## Zones
 *
 * | Zone   | Content                                    |
 * |--------|--------------------------------------------|
 * | Left   | Connection card with status orb, DB type, name, schema |
 * | Center | Contextual metrics (query time, rows, running state) |
 * | Right  | Plugin status, notification bell, DEV badge |
 */

function DockShell({ children }: { children: React.ReactNode }) {
  return <div style={{ width: 1200 }}>{children}</div>
}

function DockWrapper({
  left,
  center,
  right,
}: {
  left: React.ReactNode
  center?: React.ReactNode
  right: React.ReactNode
}) {
  return (
    <Flex
      align="center"
      className="relative h-[38px] shrink-0 select-none border-t border-border-default bg-bg-primary px-3"
    >
      <Flex align="center" gap="xs" className="mr-auto">
        {left}
      </Flex>
      <Flex align="center" gap="xs">
        {center}
      </Flex>
      <Flex align="center" gap="xs" className="ml-auto">
        {right}
      </Flex>
    </Flex>
  )
}

function PluginCard({ active, total, loading }: { active: number; total: number; loading?: boolean }) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-border-default bg-bg-tertiary px-2 py-1">
      {loading ? (
        <>
          <Spinner size="xs" label="Loading plugins" />
          <Text size="xs" color="secondary" className="text-[10px]">Loading...</Text>
        </>
      ) : (
        <>
          <div className={cn('h-1.5 w-1.5 rounded-full', active < total ? 'bg-warning' : 'bg-success')} />
          <Text size="xs" color="secondary" className="text-[10px]">
            {active < total ? `${active}/${total} plugins` : `${active} plugins`}
          </Text>
        </>
      )}
    </div>
  )
}

function BellCard({ count }: { count: number }) {
  return (
    <div className="relative flex items-center rounded-md border border-border-default bg-bg-tertiary px-2 py-1">
      <Bell size={12} className="text-text-secondary" />
      {count > 0 && (
        <div className="absolute -right-1 -top-1 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-error px-0.5 text-[7px] font-bold text-white">
          {count}
        </div>
      )}
    </div>
  )
}

function DevBadge() {
  return <div className="rounded-md bg-accent px-1.5 py-1 text-[9px] font-semibold text-white">DEV</div>
}

const meta = {
  title: 'Shell/StatusBar',
  tags: ['autodocs'],
  decorators: [(Story: React.ComponentType) => <DockShell><Story /></DockShell>],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** No active connection — disconnected state. */
export const Disconnected: Story = {
  render: () => (
    <DockWrapper
      left={
        <ConnectionCard isConnected={false} isError={false} dbType={null} dbName={null} schema={null} isOpen={false} onClick={() => {}} />
      }
      center={<Text size="xs" color="disabled">—</Text>}
      right={<><PluginCard active={3} total={3} /><BellCard count={0} /><DevBadge /></>}
    />
  ),
}

/** Connected to PostgreSQL with query results. */
export const ConnectedPostgres: Story = {
  render: () => (
    <DockWrapper
      left={
        <ConnectionCard isConnected isError={false} dbType="postgresql" dbName="my_app_db" schema="public" isOpen={false} onClick={() => {}} />
      }
      center={
        <>
          <StatusBarMetric color="success" label="⚡ 142ms" />
          <StatusBarMetric color="info" label="248 rows" />
        </>
      }
      right={<><PluginCard active={5} total={5} /><BellCard count={2} /><DevBadge /></>}
    />
  ),
}

/** Multiple active connections. */
export const MultipleConnections: Story = {
  render: () => (
    <DockWrapper
      left={
        <>
          <ConnectionCard isConnected isError={false} dbType="mysql" dbName="staging_mysql" schema={null} isOpen={false} onClick={() => {}} />
          <div className="flex items-center gap-1 rounded-[5px] border border-accent/15 bg-accent/8 px-1.5 py-0.5">
            <Text size="xs" color="accent" className="text-[10px]">↔ 3</Text>
          </div>
        </>
      }
      center={<StatusBarMetric color="success" label="⚡ 89ms" />}
      right={<><PluginCard active={4} total={4} /><BellCard count={0} /></>}
    />
  ),
}

/** Query currently running with elapsed time. */
export const QueryRunning: Story = {
  render: () => (
    <DockWrapper
      left={
        <ConnectionCard isConnected isError={false} dbType="postgresql" dbName="analytics_db" schema="reporting" isOpen={false} onClick={() => {}} />
      }
      center={<StatusBarMetric color="warning" label="Running..." animated />}
      right={<><PluginCard active={3} total={3} /><BellCard count={0} /><DevBadge /></>}
    />
  ),
}

/** Connection error state. */
export const ConnectionError: Story = {
  render: () => (
    <DockWrapper
      left={
        <ConnectionCard isConnected isError dbType="postgresql" dbName="prod_db" schema={null} isOpen={false} onClick={() => {}} />
      }
      center={<StatusBarMetric color="error" label="⚠ Reconnecting..." />}
      right={<><PluginCard active={3} total={3} /><BellCard count={3} /><DevBadge /></>}
    />
  ),
}

/** Plugins still loading during boot. */
export const PluginsLoading: Story = {
  render: () => (
    <DockWrapper
      left={
        <ConnectionCard isConnected={false} isError={false} dbType={null} dbName={null} schema={null} isOpen={false} onClick={() => {}} />
      }
      center={<Text size="xs" color="disabled">—</Text>}
      right={<><PluginCard active={0} total={0} loading /><BellCard count={0} /></>}
    />
  ),
}

/** Some plugins failed to load. */
export const PluginsFailed: Story = {
  render: () => (
    <DockWrapper
      left={
        <ConnectionCard isConnected isError={false} dbType="sqlite" dbName="local.db" schema={null} isOpen={false} onClick={() => {}} />
      }
      center={<StatusBarMetric color="success" label="⚡ 12ms" />}
      right={<><PluginCard active={3} total={5} /><BellCard count={1} /><DevBadge /></>}
    />
  ),
}
```

- [ ] **Step 2: Verify Storybook compiles**

Run: `npx storybook build --quiet 2>&1 | tail -5`
Expected: Build completes without errors (or check with `npx tsc --noEmit --project tsconfig.web.json`)

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/shell/StatusBar.stories.tsx
git commit -m "feat: rewrite StatusBar stories for Command Dock design"
```

---

## Task 11: Run All Tests and Final Verification

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: All tests pass, including new notification store and component tests

- [ ] **Step 2: Run type checking**

Run: `npx tsc --noEmit --project tsconfig.web.json`
Expected: No type errors

- [ ] **Step 3: Fix any failures**

If any tests fail or type errors exist, fix them before proceeding.

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve test and type errors from StatusBar redesign"
```
