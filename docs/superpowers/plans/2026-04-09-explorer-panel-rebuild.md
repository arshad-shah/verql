# Explorer Panel Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the explorer panel using only primitive components, introducing two new primitives (Accordion, TreeItem) and replacing all custom one-off components.

**Architecture:** Two new primitives built with the Object.assign compound component pattern (Accordion) and CVA slot-based pattern (TreeItem). Explorer sections are then rewritten to compose these primitives with existing ones (SearchInput, DropdownMenu, ContextMenu, Select). Three custom components are deleted.

**Tech Stack:** React 19, TypeScript, CVA (class-variance-authority), Tailwind CSS, Vitest + React Testing Library, Storybook

**Spec:** `docs/superpowers/specs/2026-04-09-explorer-panel-rebuild-design.md`

---

## File Structure

### New Files
- `src/renderer/src/primitives/data-display/TreeItem.tsx` — TreeItem primitive
- `src/renderer/src/primitives/data-display/TreeItem.stories.tsx` — TreeItem stories
- `src/renderer/src/primitives/surfaces/Accordion.tsx` — Accordion primitive
- `src/renderer/src/primitives/surfaces/Accordion.stories.tsx` — Accordion stories
- `tests/unit/primitives/data-display/tree-item.test.tsx` — TreeItem tests
- `tests/unit/primitives/surfaces/accordion.test.tsx` — Accordion tests
- `src/renderer/src/lib/format.ts` — shared formatting utilities
- `src/renderer/src/components/explorer/icons.tsx` — explorer-specific icon helpers

### Modified Files
- `src/renderer/src/primitives/data-display/index.ts` — export TreeItem
- `src/renderer/src/primitives/surfaces/index.ts` — export Accordion
- `src/renderer/src/components/explorer/SearchFilter.tsx` — rewrite with SearchInput
- `src/renderer/src/components/explorer/ConnectionsSection.tsx` — rewrite with Accordion + TreeItem + DropdownMenu + ContextMenu
- `src/renderer/src/components/explorer/DatabasesSection.tsx` — rewrite with Accordion + Select
- `src/renderer/src/components/explorer/TablesSection.tsx` — rewrite with Accordion + TreeItem + DropdownMenu + ContextMenu
- `src/renderer/src/components/explorer/ViewsSection.tsx` — rewrite with Accordion + TreeItem + DropdownMenu + ContextMenu

### Deleted Files
- `src/renderer/src/components/explorer/AccordionSection.tsx`
- `src/renderer/src/components/explorer/OverflowMenu.tsx`
- `src/renderer/src/components/schema/SchemaTreeItem.tsx`

---

### Task 1: Accordion Primitive — Tests

**Files:**
- Create: `tests/unit/primitives/surfaces/accordion.test.tsx`

- [ ] **Step 1: Write failing tests for Accordion**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { Accordion } from '../../../../src/renderer/src/primitives/surfaces/Accordion'

describe('Accordion', () => {
  it('renders trigger text', () => {
    render(
      <Accordion>
        <Accordion.Item>
          <Accordion.Trigger>Section Title</Accordion.Trigger>
          <Accordion.Content>Content here</Accordion.Content>
        </Accordion.Item>
      </Accordion>
    )
    expect(screen.getByText('Section Title')).toBeInTheDocument()
  })

  it('is open by default when defaultOpen is true', () => {
    render(
      <Accordion>
        <Accordion.Item defaultOpen>
          <Accordion.Trigger>Title</Accordion.Trigger>
          <Accordion.Content>Visible content</Accordion.Content>
        </Accordion.Item>
      </Accordion>
    )
    expect(screen.getByText('Visible content')).toBeInTheDocument()
  })

  it('is closed by default when defaultOpen is not set', () => {
    render(
      <Accordion>
        <Accordion.Item>
          <Accordion.Trigger>Title</Accordion.Trigger>
          <Accordion.Content>Hidden content</Accordion.Content>
        </Accordion.Item>
      </Accordion>
    )
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument()
  })

  it('toggles content on trigger click', () => {
    render(
      <Accordion>
        <Accordion.Item>
          <Accordion.Trigger>Toggle Me</Accordion.Trigger>
          <Accordion.Content>Toggled content</Accordion.Content>
        </Accordion.Item>
      </Accordion>
    )
    expect(screen.queryByText('Toggled content')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Toggle Me'))
    expect(screen.getByText('Toggled content')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Toggle Me'))
    expect(screen.queryByText('Toggled content')).not.toBeInTheDocument()
  })

  it('supports controlled mode with open and onOpenChange', () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(
      <Accordion>
        <Accordion.Item open={false} onOpenChange={onOpenChange}>
          <Accordion.Trigger>Controlled</Accordion.Trigger>
          <Accordion.Content>Controlled content</Accordion.Content>
        </Accordion.Item>
      </Accordion>
    )
    expect(screen.queryByText('Controlled content')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Controlled'))
    expect(onOpenChange).toHaveBeenCalledWith(true)

    rerender(
      <Accordion>
        <Accordion.Item open={true} onOpenChange={onOpenChange}>
          <Accordion.Trigger>Controlled</Accordion.Trigger>
          <Accordion.Content>Controlled content</Accordion.Content>
        </Accordion.Item>
      </Accordion>
    )
    expect(screen.getByText('Controlled content')).toBeInTheDocument()
  })

  it('renders actions without toggling on click', () => {
    const actionFn = vi.fn()
    render(
      <Accordion>
        <Accordion.Item defaultOpen>
          <Accordion.Trigger>
            Title
            <Accordion.Actions>
              <button onClick={actionFn}>Add</button>
            </Accordion.Actions>
          </Accordion.Trigger>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
      </Accordion>
    )
    fireEvent.click(screen.getByText('Add'))
    expect(actionFn).toHaveBeenCalledTimes(1)
    // Content should still be visible (action click didn't toggle)
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('renders a chevron icon in the trigger', () => {
    const { container } = render(
      <Accordion>
        <Accordion.Item defaultOpen>
          <Accordion.Trigger>Title</Accordion.Trigger>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
      </Accordion>
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders multiple items', () => {
    render(
      <Accordion>
        <Accordion.Item defaultOpen>
          <Accordion.Trigger>First</Accordion.Trigger>
          <Accordion.Content>First content</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.Trigger>Second</Accordion.Trigger>
          <Accordion.Content>Second content</Accordion.Content>
        </Accordion.Item>
      </Accordion>
    )
    expect(screen.getByText('First content')).toBeInTheDocument()
    expect(screen.queryByText('Second content')).not.toBeInTheDocument()
  })

  it('applies sm size variant', () => {
    const { container } = render(
      <Accordion size="sm">
        <Accordion.Item defaultOpen>
          <Accordion.Trigger>Title</Accordion.Trigger>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
      </Accordion>
    )
    const trigger = container.querySelector('button')
    expect(trigger).toHaveClass('text-xs')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- --run tests/unit/primitives/surfaces/accordion.test.tsx`
Expected: FAIL — module `Accordion` not found

- [ ] **Step 3: Commit red tests**

```bash
git add tests/unit/primitives/surfaces/accordion.test.tsx
git commit -m "test: add Accordion primitive tests (red)"
```

---

### Task 2: Accordion Primitive — Implementation

**Files:**
- Create: `src/renderer/src/primitives/surfaces/Accordion.tsx`
- Modify: `src/renderer/src/primitives/surfaces/index.ts`

- [ ] **Step 1: Implement the Accordion primitive**

```tsx
import React, { createContext, useContext, useState } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'
import { ChevronDown, ChevronRight } from 'lucide-react'

/* ── Context ────────────────────────────────────────────── */

type AccordionSize = 'sm' | 'md'

const SizeContext = createContext<AccordionSize>('sm')

interface ItemContext {
  open: boolean
  toggle: () => void
}

const ItemContext = createContext<ItemContext>({ open: false, toggle: () => {} })

/* ── Variants ───────────────────────────────────────────── */

const triggerVariants = cva(
  'w-full flex items-center gap-1 bg-bg-primary hover:bg-hover transition-colors duration-[var(--transition-fast)] cursor-pointer border-0 text-left',
  {
    variants: {
      size: {
        sm: 'px-2 py-1.5 text-xs',
        md: 'px-3 py-2 text-sm',
      },
    },
    defaultVariants: { size: 'sm' },
  }
)

/* ── Sub-components ─────────────────────────────────────── */

function Actions({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      className={cn('flex items-center gap-1 shrink-0', props.className)}
      onClick={(e) => {
        e.stopPropagation()
        props.onClick?.(e)
      }}
    >
      {children}
    </span>
  )
}

function Trigger({ children, className, ...props }: React.HTMLAttributes<HTMLButtonElement>) {
  const { open, toggle } = useContext(ItemContext)
  const size = useContext(SizeContext)
  const Chevron = open ? ChevronDown : ChevronRight

  return (
    <button
      type="button"
      className={cn(triggerVariants({ size }), className)}
      onClick={toggle}
      aria-expanded={open}
      {...props}
    >
      <Chevron size={12} className="text-text-muted shrink-0" />
      {children}
    </button>
  )
}

function Content({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { open } = useContext(ItemContext)
  if (!open) return null
  return (
    <div className={cn('pb-1', className)} {...props}>
      {children}
    </div>
  )
}

interface ItemProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function Item({ defaultOpen = false, open: controlledOpen, onOpenChange, children, className, ...props }: ItemProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  function toggle() {
    if (isControlled) {
      onOpenChange?.(!open)
    } else {
      setUncontrolledOpen((prev) => !prev)
    }
  }

  return (
    <ItemContext.Provider value={{ open, toggle }}>
      <div className={cn('border-b border-border-default', className)} {...props}>
        {children}
      </div>
    </ItemContext.Provider>
  )
}

/* ── Root ────────────────────────────────────────────────── */

interface AccordionProps extends VariantProps<typeof triggerVariants> {
  children: React.ReactNode
  className?: string
}

function AccordionRoot({ size = 'sm', children, className }: AccordionProps) {
  return (
    <SizeContext.Provider value={size ?? 'sm'}>
      <div className={className}>{children}</div>
    </SizeContext.Provider>
  )
}

export const Accordion = Object.assign(AccordionRoot, {
  Item,
  Trigger,
  Actions,
  Content,
})
```

- [ ] **Step 2: Add export to barrel file**

Add to `src/renderer/src/primitives/surfaces/index.ts`:

```ts
export { Accordion } from './Accordion'
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `pnpm test -- --run tests/unit/primitives/surfaces/accordion.test.tsx`
Expected: All 9 tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/primitives/surfaces/Accordion.tsx src/renderer/src/primitives/surfaces/index.ts tests/unit/primitives/surfaces/accordion.test.tsx
git commit -m "feat: add Accordion primitive"
```

---

### Task 3: Accordion Primitive — Stories

**Files:**
- Create: `src/renderer/src/primitives/surfaces/Accordion.stories.tsx`

- [ ] **Step 1: Write stories**

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Accordion } from './Accordion'
import { Badge } from '../data-display/Badge'
import { Plus, RefreshCw } from 'lucide-react'

const meta = {
  title: 'Primitives/Surfaces/Accordion',
  component: Accordion,
  tags: ['autodocs'],
} satisfies Meta<typeof Accordion>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div style={{ width: 280, border: '1px solid var(--color-border-default)', borderRadius: 8, overflow: 'hidden' }}>
      <Accordion>
        <Accordion.Item defaultOpen>
          <Accordion.Trigger>
            <span style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>Connections</span>
            <Badge size="sm">3</Badge>
            <Accordion.Actions>
              <button style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 2 }}>
                <Plus size={12} />
              </button>
            </Accordion.Actions>
          </Accordion.Trigger>
          <Accordion.Content>
            <div style={{ padding: '4px 8px', fontSize: 12, color: 'var(--color-text-secondary)' }}>
              Connection items would go here
            </div>
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.Trigger>
            <span style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>Tables</span>
            <Badge size="sm">12</Badge>
          </Accordion.Trigger>
          <Accordion.Content>
            <div style={{ padding: '4px 8px', fontSize: 12, color: 'var(--color-text-secondary)' }}>
              Table items would go here
            </div>
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.Trigger>
            <span style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>Views</span>
            <Badge size="sm">2</Badge>
          </Accordion.Trigger>
          <Accordion.Content>
            <div style={{ padding: '4px 8px', fontSize: 12, color: 'var(--color-text-secondary)' }}>
              View items would go here
            </div>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 32 }}>
      <div style={{ width: 240 }}>
        <p style={{ fontSize: 12, marginBottom: 8, color: 'var(--color-text-secondary)' }}>Size: sm (default)</p>
        <div style={{ border: '1px solid var(--color-border-default)', borderRadius: 8, overflow: 'hidden' }}>
          <Accordion size="sm">
            <Accordion.Item defaultOpen>
              <Accordion.Trigger>Small Section</Accordion.Trigger>
              <Accordion.Content>
                <div style={{ padding: '4px 8px', fontSize: 12, color: 'var(--color-text-secondary)' }}>Content</div>
              </Accordion.Content>
            </Accordion.Item>
          </Accordion>
        </div>
      </div>
      <div style={{ width: 280 }}>
        <p style={{ fontSize: 12, marginBottom: 8, color: 'var(--color-text-secondary)' }}>Size: md</p>
        <div style={{ border: '1px solid var(--color-border-default)', borderRadius: 8, overflow: 'hidden' }}>
          <Accordion size="md">
            <Accordion.Item defaultOpen>
              <Accordion.Trigger>Medium Section</Accordion.Trigger>
              <Accordion.Content>
                <div style={{ padding: '8px 12px', fontSize: 13, color: 'var(--color-text-secondary)' }}>Content</div>
              </Accordion.Content>
            </Accordion.Item>
          </Accordion>
        </div>
      </div>
    </div>
  ),
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/primitives/surfaces/Accordion.stories.tsx
git commit -m "docs: add Accordion primitive stories"
```

---

### Task 4: TreeItem Primitive — Tests

**Files:**
- Create: `tests/unit/primitives/data-display/tree-item.test.tsx`

- [ ] **Step 1: Write failing tests for TreeItem**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { TreeItem } from '../../../../src/renderer/src/primitives/data-display/TreeItem'

describe('TreeItem', () => {
  it('renders label text', () => {
    render(<TreeItem label="users" />)
    expect(screen.getByText('users')).toBeInTheDocument()
  })

  it('renders icon when provided', () => {
    render(<TreeItem label="users" icon={<span data-testid="icon">T</span>} />)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('renders meta when provided', () => {
    render(<TreeItem label="users" meta={<span>1.2k</span>} />)
    expect(screen.getByText('1.2k')).toBeInTheDocument()
  })

  it('renders actions when provided', () => {
    render(<TreeItem label="users" actions={<button>Menu</button>} />)
    expect(screen.getByText('Menu')).toBeInTheDocument()
  })

  it('indents based on depth', () => {
    const { container } = render(<TreeItem label="column" depth={2} />)
    const row = container.firstElementChild?.firstElementChild as HTMLElement
    expect(row.style.paddingLeft).toBe('40px') // 8 + 2 * 16
  })

  it('renders chevron when onToggle is provided', () => {
    const { container } = render(<TreeItem label="users" onToggle={() => {}} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders spacer instead of chevron for leaf nodes', () => {
    const { container } = render(<TreeItem label="id" depth={1} />)
    // No onToggle means no chevron — should have a spacer span instead
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn()
    render(<TreeItem label="users" onToggle={onToggle} />)
    fireEvent.click(screen.getByText('users'))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('renders children when expanded', () => {
    render(
      <TreeItem label="users" expanded={true} onToggle={() => {}}>
        <TreeItem label="id" depth={1} />
      </TreeItem>
    )
    expect(screen.getByText('id')).toBeInTheDocument()
  })

  it('hides children when not expanded', () => {
    render(
      <TreeItem label="users" expanded={false} onToggle={() => {}}>
        <TreeItem label="id" depth={1} />
      </TreeItem>
    )
    expect(screen.queryByText('id')).not.toBeInTheDocument()
  })

  it('applies selected styling', () => {
    const { container } = render(<TreeItem label="users" selected />)
    const row = container.firstElementChild?.firstElementChild as HTMLElement
    expect(row.className).toContain('bg-accent')
  })

  it('supports keyboard Enter to toggle', () => {
    const onToggle = vi.fn()
    const { container } = render(<TreeItem label="users" onToggle={onToggle} />)
    const row = container.firstElementChild?.firstElementChild as HTMLElement
    fireEvent.keyDown(row, { key: 'Enter' })
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('applies default depth 0 indentation', () => {
    const { container } = render(<TreeItem label="root" />)
    const row = container.firstElementChild?.firstElementChild as HTMLElement
    expect(row.style.paddingLeft).toBe('8px') // 8 + 0 * 16
  })

  it('applies sm size variant', () => {
    const { container } = render(<TreeItem label="users" size="sm" />)
    const row = container.firstElementChild?.firstElementChild as HTMLElement
    expect(row.className).toContain('text-xs')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- --run tests/unit/primitives/data-display/tree-item.test.tsx`
Expected: FAIL — module `TreeItem` not found

- [ ] **Step 3: Commit red tests**

```bash
git add tests/unit/primitives/data-display/tree-item.test.tsx
git commit -m "test: add TreeItem primitive tests (red)"
```

---

### Task 5: TreeItem Primitive — Implementation

**Files:**
- Create: `src/renderer/src/primitives/data-display/TreeItem.tsx`
- Modify: `src/renderer/src/primitives/data-display/index.ts`

- [ ] **Step 1: Implement the TreeItem primitive**

```tsx
import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'
import { ChevronDown, ChevronRight } from 'lucide-react'

const treeItemRowVariants = cva(
  'flex items-center gap-1.5 cursor-pointer rounded transition-colors duration-[var(--transition-fast)] group',
  {
    variants: {
      size: {
        sm: 'py-0.5 px-1 text-xs',
        md: 'py-1 px-2 text-sm',
      },
      selected: {
        true: 'bg-accent/10 text-accent',
        false: 'hover:bg-hover text-text-secondary',
      },
    },
    defaultVariants: { size: 'sm', selected: false },
  }
)

export interface TreeItemProps extends VariantProps<typeof treeItemRowVariants> {
  label: string
  icon?: React.ReactNode
  depth?: number
  expanded?: boolean
  onToggle?: () => void
  meta?: React.ReactNode
  actions?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function TreeItem({
  label,
  icon,
  depth = 0,
  expanded,
  onToggle,
  selected,
  meta,
  actions,
  children,
  size,
  className,
}: TreeItemProps) {
  const hasChildren = children !== undefined
  const paddingLeft = 8 + depth * 16

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggle?.()
    }
  }

  return (
    <div className={className}>
      <div
        className={cn(treeItemRowVariants({ size, selected }))}
        style={{ paddingLeft }}
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        tabIndex={onToggle ? 0 : undefined}
        role={onToggle ? 'treeitem' : undefined}
        aria-expanded={onToggle ? expanded : undefined}
      >
        {onToggle ? (
          expanded ? (
            <ChevronDown size={12} className="text-text-muted shrink-0" />
          ) : (
            <ChevronRight size={12} className="text-text-muted shrink-0" />
          )
        ) : (
          <span className="w-3 shrink-0" />
        )}
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="flex-1 truncate">{label}</span>
        {meta && <span className="shrink-0 text-text-muted text-[9px]">{meta}</span>}
        {actions && (
          <span
            className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
          </span>
        )}
      </div>
      {expanded && hasChildren && <div>{children}</div>}
    </div>
  )
}
```

- [ ] **Step 2: Add export to barrel file**

Add to `src/renderer/src/primitives/data-display/index.ts`:

```ts
export { TreeItem } from './TreeItem'
export type { TreeItemProps } from './TreeItem'
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `pnpm test -- --run tests/unit/primitives/data-display/tree-item.test.tsx`
Expected: All 14 tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/primitives/data-display/TreeItem.tsx src/renderer/src/primitives/data-display/index.ts tests/unit/primitives/data-display/tree-item.test.tsx
git commit -m "feat: add TreeItem primitive"
```

---

### Task 6: TreeItem Primitive — Stories

**Files:**
- Create: `src/renderer/src/primitives/data-display/TreeItem.stories.tsx`

- [ ] **Step 1: Write stories**

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { TreeItem } from './TreeItem'
import { Table2, Eye, Key, Link, Hash } from 'lucide-react'

const meta = {
  title: 'Primitives/Data Display/TreeItem',
  component: TreeItem,
  tags: ['autodocs'],
} satisfies Meta<typeof TreeItem>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => {
    const [expanded, setExpanded] = useState(true)
    return (
      <div style={{ width: 260, border: '1px solid var(--color-border-default)', borderRadius: 8, padding: '4px 0', overflow: 'hidden' }}>
        <TreeItem
          label="users"
          icon={<Table2 size={12} className="text-accent" />}
          depth={0}
          expanded={expanded}
          onToggle={() => setExpanded(!expanded)}
          meta="1.2k"
        >
          <TreeItem label="id" icon={<Key size={11} className="text-warning" />} depth={1} meta="integer" />
          <TreeItem label="email" icon={<Hash size={11} className="text-text-muted" />} depth={1} meta="varchar(255)" />
          <TreeItem label="org_id" icon={<Link size={11} className="text-info" />} depth={1} meta="uuid" />
        </TreeItem>
        <TreeItem
          label="organizations"
          icon={<Table2 size={12} className="text-accent" />}
          depth={0}
          expanded={false}
          onToggle={() => {}}
          meta="48"
        />
        <TreeItem
          label="active_users"
          icon={<Eye size={12} className="text-info" />}
          depth={0}
          expanded={false}
          onToggle={() => {}}
        />
      </div>
    )
  },
}

export const Selected: Story = {
  render: () => (
    <div style={{ width: 260, border: '1px solid var(--color-border-default)', borderRadius: 8, padding: '4px 0', overflow: 'hidden' }}>
      <TreeItem label="users" icon={<Table2 size={12} className="text-accent" />} depth={0} selected onToggle={() => {}} />
      <TreeItem label="organizations" icon={<Table2 size={12} className="text-accent" />} depth={0} onToggle={() => {}} />
      <TreeItem label="sessions" icon={<Table2 size={12} className="text-accent" />} depth={0} onToggle={() => {}} />
    </div>
  ),
}

export const DeepNesting: Story = {
  render: () => (
    <div style={{ width: 300, border: '1px solid var(--color-border-default)', borderRadius: 8, padding: '4px 0', overflow: 'hidden' }}>
      <TreeItem label="Level 0" depth={0} expanded onToggle={() => {}}>
        <TreeItem label="Level 1" depth={1} expanded onToggle={() => {}}>
          <TreeItem label="Level 2" depth={2} expanded onToggle={() => {}}>
            <TreeItem label="Leaf at depth 3" depth={3} />
          </TreeItem>
        </TreeItem>
      </TreeItem>
    </div>
  ),
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/primitives/data-display/TreeItem.stories.tsx
git commit -m "docs: add TreeItem primitive stories"
```

---

### Task 7: Shared Utilities — Format Helpers and Explorer Icons

**Files:**
- Create: `src/renderer/src/lib/format.ts`
- Create: `src/renderer/src/components/explorer/icons.tsx`

- [ ] **Step 1: Create format utilities**

```ts
export function formatRowCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`
  return String(count)
}
```

- [ ] **Step 2: Create explorer icon helpers**

```tsx
import { Table2, Eye, Key, Link, Hash } from 'lucide-react'
import type { SchemaColumn } from '@shared/types'

export function TableIcon({ type }: { type: 'table' | 'view' }) {
  return type === 'view'
    ? <Eye size={12} className="text-info" />
    : <Table2 size={12} className="text-accent" />
}

export function ColumnIcon({ column }: { column: SchemaColumn }) {
  if (column.isPrimaryKey) return <Key size={11} className="text-warning" />
  if (column.isForeignKey) return <Link size={11} className="text-info" />
  return <Hash size={11} className="text-text-muted" />
}
```

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/lib/format.ts src/renderer/src/components/explorer/icons.tsx
git commit -m "refactor: extract format utils and explorer icon helpers"
```

---

### Task 8: Rebuild SearchFilter

**Files:**
- Modify: `src/renderer/src/components/explorer/SearchFilter.tsx`

- [ ] **Step 1: Rewrite SearchFilter with SearchInput primitive**

Replace the entire file content:

```tsx
import { useRef, useEffect, useState } from 'react'
import { useSchemaStore } from '@/stores/schema'
import { useConnectionsStore } from '@/stores/connections'
import { SearchInput, Box } from '@/primitives'

export function SearchFilter() {
  const filterText = useSchemaStore((s) => s.filterText)
  const setFilterText = useSchemaStore((s) => s.setFilterText)
  const activeConnectionId = useConnectionsStore((s) => s.activeConnectionId)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const [localValue, setLocalValue] = useState(filterText)

  useEffect(() => {
    setFilterText('')
    setLocalValue('')
  }, [activeConnectionId, setFilterText])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalValue(value)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setFilterText(value), 150)
  }

  const handleClear = () => {
    setFilterText('')
    setLocalValue('')
    inputRef.current?.focus()
  }

  return (
    <Box className="px-2 py-1.5 border-b border-border-default">
      <SearchInput
        ref={inputRef}
        size="sm"
        placeholder="Filter tables, views..."
        value={localValue}
        onChange={handleChange}
        onClear={handleClear}
      />
    </Box>
  )
}
```

- [ ] **Step 2: Verify the app still compiles**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/explorer/SearchFilter.tsx
git commit -m "refactor: rebuild SearchFilter with SearchInput primitive"
```

---

### Task 9: Rebuild ConnectionsSection

**Files:**
- Modify: `src/renderer/src/components/explorer/ConnectionsSection.tsx`

- [ ] **Step 1: Rewrite ConnectionsSection with Accordion + TreeItem + DropdownMenu + ContextMenu**

Replace the entire file content:

```tsx
import { useEffect, useState } from 'react'
import { Plus, PlugZap, Unplug, Pencil, Trash2, Copy } from 'lucide-react'
import { useConnectionsStore } from '@/stores/connections'
import { useUiStore } from '@/stores/ui'
import { useToastStore } from '@/stores/toast'
import { ConnectionForm } from '@/components/connections/ConnectionForm'
import { ConfirmDialog } from '@/components/shell/ConfirmDialog'
import type { ConnectionProfile } from '@shared/types'
import { Accordion, TreeItem, DropdownMenu, ContextMenu, IconButton, Text, Box } from '@/primitives'

export function ConnectionsSection() {
  const { connections, connectedIds, activeConnectionId, loadConnections, saveConnection, deleteConnection, connect, disconnect, setActiveConnection } = useConnectionsStore()
  const expanded = useUiStore((s) => s.expandedSections['CONNECTIONS'] ?? true)
  const toggleSection = useUiStore((s) => s.toggleSection)
  const addToast = useToastStore((s) => s.addToast)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ConnectionProfile | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<ConnectionProfile | null>(null)

  useEffect(() => { loadConnections() }, [loadConnections])

  const handleSave = async (profile: ConnectionProfile) => {
    await saveConnection(profile)
    setShowForm(false)
    setEditing(undefined)
  }

  const handleConnect = async (id: string) => {
    if (connectedIds.has(id)) {
      setActiveConnection(id)
    } else {
      const result = await connect(id)
      if (!result.success) addToast({ type: 'error', title: 'Connection failed', message: result.error })
    }
  }

  const handleDuplicate = async (conn: ConnectionProfile) => {
    const duplicate: ConnectionProfile = {
      ...conn,
      id: crypto.randomUUID(),
      name: `${conn.name} (copy)`,
    }
    setEditing(duplicate)
    setShowForm(true)
  }

  const getMenuItems = (conn: ConnectionProfile) => {
    const isConnected = connectedIds.has(conn.id)
    const items = []
    if (isConnected) {
      items.push({ label: 'Disconnect', onSelect: () => disconnect(conn.id) })
    }
    items.push({ label: 'Duplicate', onSelect: () => handleDuplicate(conn) })
    items.push({ label: 'Delete', onSelect: () => setDeleteTarget(conn) })
    return items
  }

  return (
    <>
      <Accordion>
        <Accordion.Item open={expanded} onOpenChange={() => toggleSection('CONNECTIONS')}>
          <Accordion.Trigger>
            <Text size="xs" color="muted" className="uppercase tracking-wider flex-1 text-left">{`CONNECTIONS`}</Text>
            <Badge size="sm">{connections.length}</Badge>
            <Accordion.Actions>
              <IconButton
                label="New Connection"
                size="xs"
                variant="ghost"
                onClick={() => { setEditing(undefined); setShowForm(true) }}
                className="text-text-muted hover:text-text-primary"
              >
                <Plus size={12} />
              </IconButton>
            </Accordion.Actions>
          </Accordion.Trigger>
          <Accordion.Content>
            <Box className="px-1">
              {connections.length === 0 && (
                <Text size="xs" color="muted" as="p" className="px-2 py-4 text-center">No connections yet</Text>
              )}
              {connections.map((conn) => {
                const isConnected = connectedIds.has(conn.id)
                const isActive = activeConnectionId === conn.id

                return (
                  <ContextMenu key={conn.id} items={getMenuItems(conn)}>
                    <TreeItem
                      label={conn.name}
                      icon={
                        <Box
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: isConnected ? (conn.color ?? 'var(--color-accent)') : 'var(--color-text-disabled)' }}
                        />
                      }
                      selected={isActive}
                      onToggle={() => handleConnect(conn.id)}
                      actions={
                        <>
                          <IconButton
                            label={isConnected ? 'Disconnect' : 'Connect'}
                            size="xs"
                            variant="ghost"
                            onClick={() => isConnected ? disconnect(conn.id) : handleConnect(conn.id)}
                            className={isConnected ? 'text-success hover:text-error' : 'text-text-muted hover:text-success'}
                          >
                            {isConnected ? <Unplug size={12} /> : <PlugZap size={12} />}
                          </IconButton>
                          <IconButton
                            label="Edit"
                            size="xs"
                            variant="ghost"
                            onClick={() => { setEditing(conn); setShowForm(true) }}
                            className="text-text-muted hover:text-text-primary"
                          >
                            <Pencil size={12} />
                          </IconButton>
                          <DropdownMenu
                            trigger={
                              <IconButton
                                label="More actions"
                                size="xs"
                                variant="ghost"
                                className="text-text-muted hover:text-text-primary"
                              >
                                <span style={{ fontSize: 12, lineHeight: 1 }}>···</span>
                              </IconButton>
                            }
                            items={getMenuItems(conn)}
                          />
                        </>
                      }
                    />
                  </ContextMenu>
                )
              })}
            </Box>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion>
      {showForm && (
        <ConnectionForm initial={editing} onSave={handleSave} onClose={() => { setShowForm(false); setEditing(undefined) }} />
      )}
      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete "${deleteTarget?.name}"?`}
        message="This connection profile will be permanently removed."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (deleteTarget) deleteConnection(deleteTarget.id)
          setDeleteTarget(null)
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
```

**Note:** There is a missing `Badge` import — add it to the import line:

```tsx
import { Accordion, TreeItem, DropdownMenu, ContextMenu, IconButton, Text, Box, Badge } from '@/primitives'
```

- [ ] **Step 2: Verify the app still compiles**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/explorer/ConnectionsSection.tsx
git commit -m "refactor: rebuild ConnectionsSection with Accordion + TreeItem + DropdownMenu + ContextMenu"
```

---

### Task 10: Rebuild DatabasesSection

**Files:**
- Modify: `src/renderer/src/components/explorer/DatabasesSection.tsx`

- [ ] **Step 1: Rewrite DatabasesSection with Accordion + Select**

Replace the entire file content:

```tsx
import { useEffect, useState } from 'react'
import { RefreshCw, Database, GitFork } from 'lucide-react'
import { useSchemaStore } from '@/stores/schema'
import { useConnectionsStore } from '@/stores/connections'
import { useUiStore } from '@/stores/ui'
import { useTabsStore } from '@/stores/tabs'
import { useToastStore } from '@/stores/toast'
import { Accordion, IconButton, Text, Box, Flex, Button, Select, Badge } from '@/primitives'

interface DatabasesSectionProps {
  connectionId: string
  activeSchema: string
  onSchemaChange: (schema: string) => void
  activeDatabase: string
  onDatabaseChange: (db: string) => void
}

export function DatabasesSection({ connectionId, activeSchema, onSchemaChange, activeDatabase, onDatabaseChange }: DatabasesSectionProps) {
  const { schemas, fetchSchemas, fetchDatabases, clearCache } = useSchemaStore()
  const conn = useConnectionsStore((s) => s.connections.find(c => c.id === connectionId))
  const expanded = useUiStore((s) => s.expandedSections['DATABASES'] ?? true)
  const toggleSection = useUiStore((s) => s.toggleSection)
  const { openErDiagram } = useTabsStore()
  const addToast = useToastStore((s) => s.addToast)

  const [databaseList, setDatabaseList] = useState<string[]>([])
  const [switching, setSwitching] = useState(false)

  const schemaList = schemas.get(connectionId) ?? []
  const isSqlite = conn?.type === 'sqlite'

  useEffect(() => {
    fetchDatabases(connectionId)
      .then(dbs => setDatabaseList(dbs))
      .catch(() => setDatabaseList([]))
    fetchSchemas(connectionId)
  }, [connectionId, fetchDatabases, fetchSchemas])

  const handleRefresh = () => {
    clearCache(connectionId)
    setDatabaseList([])
    fetchDatabases(connectionId)
      .then(dbs => setDatabaseList(dbs))
      .catch(() => setDatabaseList([]))
    fetchSchemas(connectionId)
  }

  const handleSwitchDatabase = async (db: string) => {
    if (db === activeDatabase || switching) return
    setSwitching(true)
    try {
      await window.electronAPI.invoke('db:switch-database', connectionId, db)
      clearCache(connectionId)
      onDatabaseChange(db)
      const newSchemas = await fetchSchemas(connectionId)
      const newDefault = conn?.type === 'mysql' ? db : 'public'
      const resolved = newSchemas.includes(newDefault) ? newDefault : newSchemas[0] ?? 'public'
      onSchemaChange(resolved)
      addToast({ type: 'success', title: `Switched to ${db}` })
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to switch database', message: (err as Error).message })
    } finally {
      setSwitching(false)
    }
  }

  if (isSqlite && databaseList.length <= 1 && schemaList.length <= 1) return null

  return (
    <Accordion>
      <Accordion.Item open={expanded} onOpenChange={() => toggleSection('DATABASES')}>
        <Accordion.Trigger>
          <Text size="xs" color="muted" className="uppercase tracking-wider flex-1 text-left">{`DATABASES`}</Text>
          {databaseList.length > 0 && <Badge size="sm">{databaseList.length}</Badge>}
          <Accordion.Actions>
            <IconButton
              label="ER Diagram"
              size="xs"
              variant="ghost"
              onClick={() => openErDiagram(connectionId, activeSchema)}
              className="text-text-muted hover:text-accent"
            >
              <GitFork size={12} />
            </IconButton>
            <IconButton
              label="Refresh"
              size="xs"
              variant="ghost"
              onClick={handleRefresh}
              className="text-text-muted hover:text-text-primary"
            >
              <RefreshCw size={11} />
            </IconButton>
          </Accordion.Actions>
        </Accordion.Trigger>
        <Accordion.Content>
          <Box className="px-2 py-1">
            {databaseList.length > 1 && (
              <Flex wrap gap="xs" className="mb-2">
                {databaseList.map(db => (
                  <Button
                    key={db}
                    variant="outline"
                    size="xs"
                    onClick={() => handleSwitchDatabase(db)}
                    disabled={switching || db === activeDatabase}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] h-auto ${
                      db === activeDatabase
                        ? 'bg-accent/10 text-accent border-accent/30'
                        : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-text-secondary border-border-default'
                    } disabled:opacity-50`}
                  >
                    <Database size={9} />
                    {db}
                  </Button>
                ))}
              </Flex>
            )}

            {schemaList.length > 1 && (
              <Flex align="center" gap="xs">
                <Text size="xs" color="muted" className="text-[10px]">Schema:</Text>
                <Select
                  size="xs"
                  value={activeSchema}
                  onChange={(e) => onSchemaChange(e.target.value)}
                  className="max-w-32"
                >
                  {schemaList.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </Flex>
            )}

            {schemaList.length <= 1 && (
              <Flex align="center" gap="xs">
                <Text size="xs" color="muted" className="text-[10px]">Schema:</Text>
                <Text size="xs" color="secondary">{activeSchema}</Text>
              </Flex>
            )}
          </Box>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  )
}
```

- [ ] **Step 2: Verify the app still compiles**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/explorer/DatabasesSection.tsx
git commit -m "refactor: rebuild DatabasesSection with Accordion + Select"
```

---

### Task 11: Rebuild TablesSection

**Files:**
- Modify: `src/renderer/src/components/explorer/TablesSection.tsx`

- [ ] **Step 1: Rewrite TablesSection with Accordion + TreeItem + DropdownMenu + ContextMenu**

Replace the entire file content:

```tsx
import { useEffect } from 'react'
import { Download, Copy, PenSquare, ArrowRight, MoreHorizontal } from 'lucide-react'
import { useSchemaStore } from '@/stores/schema'
import { useUiStore } from '@/stores/ui'
import { useTabsStore } from '@/stores/tabs'
import { useToastStore } from '@/stores/toast'
import { TableIcon, ColumnIcon } from '@/components/explorer/icons'
import { formatRowCount } from '@/lib/format'
import { Accordion, TreeItem, DropdownMenu, ContextMenu, IconButton, Text, Box, Badge } from '@/primitives'

interface TablesSectionProps {
  connectionId: string
  activeSchema: string
  onExportTable: (tableName: string) => void
}

export function TablesSection({ connectionId, activeSchema, onExportTable }: TablesSectionProps) {
  const { tables, columns, expandedTables, rowCounts, filterText, cacheVersion, fetchTables, fetchColumns, fetchRowCount, toggleTable } = useSchemaStore()
  const expanded = useUiStore((s) => s.expandedSections['TABLES'] ?? true)
  const toggleSection = useUiStore((s) => s.toggleSection)
  const { addQueryTab, updateTabSql } = useTabsStore()
  const addToast = useToastStore((s) => s.addToast)

  const tableKey = `${connectionId}:${activeSchema}`
  const allTables = tables.get(tableKey) ?? []
  const tableList = allTables.filter(t => t.type === 'table')
  const filtered = filterText
    ? tableList.filter(t => t.name.toLowerCase().includes(filterText.toLowerCase()))
    : tableList

  useEffect(() => {
    fetchTables(connectionId, activeSchema)
  }, [connectionId, activeSchema, cacheVersion, fetchTables])

  useEffect(() => {
    filtered.forEach(t => {
      fetchRowCount(connectionId, t.name, activeSchema)
    })
  }, [connectionId, activeSchema, filtered.length, fetchRowCount])

  const handleExpandTable = async (tableName: string) => {
    const key = `${connectionId}:${activeSchema}:${tableName}`
    toggleTable(key)
    if (!expandedTables.has(key)) {
      await fetchColumns(connectionId, tableName, activeSchema)
    }
  }

  const getMenuItems = (tableName: string) => [
    {
      label: 'Export',
      onSelect: () => onExportTable(tableName),
    },
    {
      label: 'Copy name',
      onSelect: () => {
        navigator.clipboard.writeText(tableName)
        addToast({ type: 'success', title: 'Copied table name' })
      },
    },
    {
      label: 'Copy SELECT',
      onSelect: () => {
        const sql = `SELECT * FROM "${activeSchema}"."${tableName}" LIMIT 100;`
        navigator.clipboard.writeText(sql)
        addToast({ type: 'success', title: 'Copied SELECT query' })
      },
    },
    {
      label: 'Open in tab',
      onSelect: () => {
        const sql = `SELECT * FROM "${activeSchema}"."${tableName}" LIMIT 100;`
        const tabId = addQueryTab(connectionId)
        updateTabSql(tabId, sql)
      },
    },
  ]

  return (
    <Accordion>
      <Accordion.Item open={expanded} onOpenChange={() => toggleSection('TABLES')}>
        <Accordion.Trigger>
          <Text size="xs" color="muted" className="uppercase tracking-wider flex-1 text-left">{`TABLES`}</Text>
          <Badge size="sm">{filtered.length}</Badge>
        </Accordion.Trigger>
        <Accordion.Content>
          <Box className="px-1">
            {filtered.length === 0 && (
              <Text size="xs" color="muted" as="p" className="px-2 py-3 text-center">
                {filterText ? 'No matching tables' : 'No tables found'}
              </Text>
            )}
            {filtered.map(table => {
              const colKey = `${connectionId}:${activeSchema}:${table.name}`
              const isExpanded = expandedTables.has(colKey)
              const cols = columns.get(colKey) ?? []
              const count = rowCounts.get(colKey)

              return (
                <ContextMenu key={table.name} items={getMenuItems(table.name)}>
                  <TreeItem
                    label={table.name}
                    icon={<TableIcon type="table" />}
                    depth={0}
                    expanded={isExpanded}
                    onToggle={() => handleExpandTable(table.name)}
                    meta={count !== undefined ? formatRowCount(count) : undefined}
                    actions={
                      <DropdownMenu
                        trigger={
                          <IconButton label="More actions" size="xs" variant="ghost" className="text-text-muted hover:text-text-primary">
                            <MoreHorizontal size={12} />
                          </IconButton>
                        }
                        items={getMenuItems(table.name)}
                      />
                    }
                  >
                    {cols.map(col => (
                      <TreeItem
                        key={col.name}
                        label={`${col.name} ${col.dataType}`}
                        icon={<ColumnIcon column={col} />}
                        depth={1}
                        meta={
                          col.isForeignKey && col.references
                            ? <span className="inline-flex items-center gap-0.5"><ArrowRight size={9} />{col.references.table}.{col.references.column}</span>
                            : undefined
                        }
                      />
                    ))}
                  </TreeItem>
                </ContextMenu>
              )
            })}
          </Box>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  )
}
```

- [ ] **Step 2: Verify the app still compiles**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/explorer/TablesSection.tsx
git commit -m "refactor: rebuild TablesSection with Accordion + TreeItem + DropdownMenu + ContextMenu"
```

---

### Task 12: Rebuild ViewsSection

**Files:**
- Modify: `src/renderer/src/components/explorer/ViewsSection.tsx`

- [ ] **Step 1: Rewrite ViewsSection with Accordion + TreeItem + DropdownMenu + ContextMenu**

Replace the entire file content:

```tsx
import { useEffect } from 'react'
import { Copy, PenSquare, ArrowRight, MoreHorizontal } from 'lucide-react'
import { useSchemaStore } from '@/stores/schema'
import { useUiStore } from '@/stores/ui'
import { useTabsStore } from '@/stores/tabs'
import { useToastStore } from '@/stores/toast'
import { TableIcon, ColumnIcon } from '@/components/explorer/icons'
import { Accordion, TreeItem, DropdownMenu, ContextMenu, IconButton, Text, Box, Badge } from '@/primitives'

interface ViewsSectionProps {
  connectionId: string
  activeSchema: string
}

export function ViewsSection({ connectionId, activeSchema }: ViewsSectionProps) {
  const { tables, columns, expandedTables, filterText, cacheVersion, fetchTables, fetchColumns, toggleTable } = useSchemaStore()
  const expanded = useUiStore((s) => s.expandedSections['VIEWS'] ?? true)
  const toggleSection = useUiStore((s) => s.toggleSection)
  const { addQueryTab, updateTabSql } = useTabsStore()
  const addToast = useToastStore((s) => s.addToast)

  const tableKey = `${connectionId}:${activeSchema}`
  const allTables = tables.get(tableKey) ?? []
  const viewList = allTables.filter(t => t.type === 'view')
  const filtered = filterText
    ? viewList.filter(v => v.name.toLowerCase().includes(filterText.toLowerCase()))
    : viewList

  useEffect(() => {
    fetchTables(connectionId, activeSchema)
  }, [connectionId, activeSchema, cacheVersion, fetchTables])

  const handleExpandView = async (viewName: string) => {
    const key = `${connectionId}:${activeSchema}:${viewName}`
    toggleTable(key)
    if (!expandedTables.has(key)) {
      await fetchColumns(connectionId, viewName, activeSchema)
    }
  }

  const getMenuItems = (viewName: string) => [
    {
      label: 'Copy name',
      onSelect: () => {
        navigator.clipboard.writeText(viewName)
        addToast({ type: 'success', title: 'Copied view name' })
      },
    },
    {
      label: 'Copy SELECT',
      onSelect: () => {
        const sql = `SELECT * FROM "${activeSchema}"."${viewName}" LIMIT 100;`
        navigator.clipboard.writeText(sql)
        addToast({ type: 'success', title: 'Copied SELECT query' })
      },
    },
    {
      label: 'Open in tab',
      onSelect: () => {
        const sql = `SELECT * FROM "${activeSchema}"."${viewName}" LIMIT 100;`
        const tabId = addQueryTab(connectionId)
        updateTabSql(tabId, sql)
      },
    },
  ]

  if (viewList.length === 0 && !filterText) return null

  return (
    <Accordion>
      <Accordion.Item open={expanded} onOpenChange={() => toggleSection('VIEWS')}>
        <Accordion.Trigger>
          <Text size="xs" color="muted" className="uppercase tracking-wider flex-1 text-left">{`VIEWS`}</Text>
          <Badge size="sm">{filtered.length}</Badge>
        </Accordion.Trigger>
        <Accordion.Content>
          <Box className="px-1">
            {filtered.length === 0 && (
              <Text size="xs" color="muted" as="p" className="px-2 py-3 text-center">
                {filterText ? 'No matching views' : 'No views found'}
              </Text>
            )}
            {filtered.map(view => {
              const colKey = `${connectionId}:${activeSchema}:${view.name}`
              const isExpanded = expandedTables.has(colKey)
              const cols = columns.get(colKey) ?? []

              return (
                <ContextMenu key={view.name} items={getMenuItems(view.name)}>
                  <TreeItem
                    label={view.name}
                    icon={<TableIcon type="view" />}
                    depth={0}
                    expanded={isExpanded}
                    onToggle={() => handleExpandView(view.name)}
                    actions={
                      <DropdownMenu
                        trigger={
                          <IconButton label="More actions" size="xs" variant="ghost" className="text-text-muted hover:text-text-primary">
                            <MoreHorizontal size={12} />
                          </IconButton>
                        }
                        items={getMenuItems(view.name)}
                      />
                    }
                  >
                    {cols.map(col => (
                      <TreeItem
                        key={col.name}
                        label={`${col.name} ${col.dataType}`}
                        icon={<ColumnIcon column={col} />}
                        depth={1}
                        meta={
                          col.isForeignKey && col.references
                            ? <span className="inline-flex items-center gap-0.5"><ArrowRight size={9} />{col.references.table}.{col.references.column}</span>
                            : undefined
                        }
                      />
                    ))}
                  </TreeItem>
                </ContextMenu>
              )
            })}
          </Box>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  )
}
```

- [ ] **Step 2: Verify the app still compiles**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/explorer/ViewsSection.tsx
git commit -m "refactor: rebuild ViewsSection with Accordion + TreeItem + DropdownMenu + ContextMenu"
```

---

### Task 13: Update Sidebar Imports and Delete Old Components

**Files:**
- Modify: `src/renderer/src/components/shell/Sidebar.tsx`
- Delete: `src/renderer/src/components/explorer/AccordionSection.tsx`
- Delete: `src/renderer/src/components/explorer/OverflowMenu.tsx`
- Delete: `src/renderer/src/components/schema/SchemaTreeItem.tsx`

- [ ] **Step 1: Check Sidebar.tsx for any remaining imports of deleted components**

The current `Sidebar.tsx` doesn't import AccordionSection, OverflowMenu, or SchemaTreeItem directly — those are used by the section components. Verify no other files import the deleted components.

Run: `grep -r "AccordionSection\|OverflowMenu\|SchemaTreeItem" src/renderer/src/ --include="*.tsx" --include="*.ts" -l`

Expected: Only the files being deleted and possibly the old section files (which are already rewritten).

- [ ] **Step 2: Delete the old components**

```bash
git rm src/renderer/src/components/explorer/AccordionSection.tsx
git rm src/renderer/src/components/explorer/OverflowMenu.tsx
git rm src/renderer/src/components/schema/SchemaTreeItem.tsx
```

- [ ] **Step 3: Verify the app still compiles**

Run: `pnpm build`
Expected: Build succeeds — no remaining references to deleted files

- [ ] **Step 4: Run all tests**

Run: `pnpm test`
Expected: All tests pass (new primitive tests + existing tests)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: delete AccordionSection, OverflowMenu, SchemaTreeItem — replaced by primitives"
```

---

### Task 14: Final Verification

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 2: Run the build**

Run: `pnpm build`
Expected: Build succeeds with no warnings about missing modules

- [ ] **Step 3: Run the dev server and manually verify**

Run: `pnpm dev`
Expected: Explorer panel renders correctly with all sections — connections, databases, tables (with column expansion), views. Right-click context menus work. Schema dropdown works. Search filter works.

- [ ] **Step 4: Commit any remaining fixes if needed**
