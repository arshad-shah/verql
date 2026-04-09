# Tooltip Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the basic tooltip with a polished, Floating UI-powered tooltip featuring a soft rounded SVG beak and spring-feel animation.

**Architecture:** Single-file rewrite of `Tooltip.tsx` using `@floating-ui/react` for positioning + custom SVG beak component. Drop-in replacement — same API, no migration needed. Tests use vitest + testing-library in jsdom.

**Tech Stack:** @floating-ui/react, React 19, Tailwind CSS, Vitest, Storybook 10

---

### Task 1: Install @floating-ui/react

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the dependency**

Run:
```bash
pnpm add @floating-ui/react
```

- [ ] **Step 2: Verify installation**

Run:
```bash
pnpm list @floating-ui/react
```

Expected: `@floating-ui/react` listed with a version (e.g., `0.27.x` or similar).

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add @floating-ui/react dependency"
```

---

### Task 2: Write tooltip unit tests

**Files:**
- Create: `tests/unit/primitives/surfaces/tooltip.test.tsx`

These tests define the expected behavior before the implementation is written. They will fail until Task 3 is complete.

- [ ] **Step 1: Write the test file**

Create `tests/unit/primitives/surfaces/tooltip.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import React from 'react'
import { Tooltip } from '../../../../src/renderer/src/primitives/surfaces/Tooltip'

describe('Tooltip', () => {
  it('renders the trigger element', () => {
    render(
      <Tooltip content="Hello">
        <button>Trigger</button>
      </Tooltip>
    )
    expect(screen.getByText('Trigger')).toBeInTheDocument()
  })

  it('does not show tooltip content initially', () => {
    render(
      <Tooltip content="Hello">
        <button>Trigger</button>
      </Tooltip>
    )
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows tooltip on hover after delay', async () => {
    vi.useFakeTimers()
    render(
      <Tooltip content="Tooltip text" delay={0}>
        <button>Trigger</button>
      </Tooltip>
    )

    await act(async () => {
      fireEvent.mouseEnter(screen.getByText('Trigger'))
    })
    await act(async () => {
      vi.advanceTimersByTime(1)
    })

    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    expect(screen.getByRole('tooltip')).toHaveTextContent('Tooltip text')
    vi.useRealTimers()
  })

  it('hides tooltip on mouse leave', async () => {
    vi.useFakeTimers()
    render(
      <Tooltip content="Tooltip text" delay={0}>
        <button>Trigger</button>
      </Tooltip>
    )

    await act(async () => {
      fireEvent.mouseEnter(screen.getByText('Trigger'))
    })
    await act(async () => {
      vi.advanceTimersByTime(1)
    })

    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    await act(async () => {
      fireEvent.mouseLeave(screen.getByText('Trigger'))
    })
    await act(async () => {
      vi.advanceTimersByTime(200)
    })

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    vi.useRealTimers()
  })

  it('shows tooltip on focus', async () => {
    vi.useFakeTimers()
    render(
      <Tooltip content="Focus tooltip" delay={0}>
        <button>Trigger</button>
      </Tooltip>
    )

    await act(async () => {
      fireEvent.focus(screen.getByText('Trigger'))
    })
    await act(async () => {
      vi.advanceTimersByTime(1)
    })

    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    expect(screen.getByRole('tooltip')).toHaveTextContent('Focus tooltip')
    vi.useRealTimers()
  })

  it('renders the SVG beak element', async () => {
    vi.useFakeTimers()
    const { container } = render(
      <Tooltip content="With beak" delay={0}>
        <button>Trigger</button>
      </Tooltip>
    )

    await act(async () => {
      fireEvent.mouseEnter(screen.getByText('Trigger'))
    })
    await act(async () => {
      vi.advanceTimersByTime(1)
    })

    const svg = document.querySelector('[data-tooltip-beak]')
    expect(svg).toBeInTheDocument()
    expect(svg?.tagName.toLowerCase()).toBe('svg')
    vi.useRealTimers()
  })

  it('applies custom className', async () => {
    vi.useFakeTimers()
    render(
      <Tooltip content="Styled" className="custom-class" delay={0}>
        <button>Trigger</button>
      </Tooltip>
    )

    await act(async () => {
      fireEvent.mouseEnter(screen.getByText('Trigger'))
    })
    await act(async () => {
      vi.advanceTimersByTime(1)
    })

    expect(screen.getByRole('tooltip')).toHaveClass('custom-class')
    vi.useRealTimers()
  })

  it('defaults side to top', () => {
    // Verify the component renders without specifying side (no crash)
    const { container } = render(
      <Tooltip content="Default side">
        <button>Trigger</button>
      </Tooltip>
    )
    expect(container).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:
```bash
pnpm test -- --run tests/unit/primitives/surfaces/tooltip.test.tsx
```

Expected: Tests fail because the current Tooltip doesn't support the `delay` prop and doesn't use portals/Floating UI. This confirms the tests are testing the new behavior.

- [ ] **Step 3: Commit the failing tests**

```bash
git add tests/unit/primitives/surfaces/tooltip.test.tsx
git commit -m "test: add tooltip unit tests (red)"
```

---

### Task 3: Rewrite the Tooltip component

**Files:**
- Modify: `src/renderer/src/primitives/surfaces/Tooltip.tsx`

- [ ] **Step 1: Rewrite Tooltip.tsx**

Replace the full contents of `src/renderer/src/primitives/surfaces/Tooltip.tsx` with:

```tsx
import React, { useRef } from 'react'
import {
  useFloating,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  useTransitionStyles,
  offset,
  flip,
  shift,
  arrow,
  autoUpdate,
  type Placement,
} from '@floating-ui/react'
import { cn } from '../utils/cn'

type TooltipSide = 'top' | 'bottom' | 'left' | 'right'
type TooltipAlign = 'start' | 'center' | 'end'

type TooltipProps = {
  content: string
  side?: TooltipSide
  align?: TooltipAlign
  delay?: number
  className?: string
  children: React.ReactNode
}

const BEAK_WIDTH = 22
const BEAK_HEIGHT = 9

function buildPlacement(side: TooltipSide, align: TooltipAlign): Placement {
  if (align === 'center') return side
  return `${side}-${align}`
}

const beakRotation: Record<string, string> = {
  top: 'rotate(0deg)',
  bottom: 'rotate(180deg)',
  left: 'rotate(-90deg)',
  right: 'rotate(90deg)',
}

const transformOriginMap: Record<string, string> = {
  top: 'bottom center',
  bottom: 'top center',
  left: 'right center',
  right: 'left center',
}

function TooltipBeak({
  side,
  x,
  y,
}: {
  side: string
  x?: number
  y?: number
}) {
  const isVertical = side === 'top' || side === 'bottom'
  const staticSide = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[side]!

  const style: React.CSSProperties = {
    position: 'absolute',
    [staticSide]: `-${BEAK_HEIGHT}px`,
    ...(isVertical
      ? { left: x != null ? `${x}px` : '50%', transform: `translateX(-50%) ${beakRotation[side]}` }
      : { top: y != null ? `${y}px` : '50%', transform: `translateY(-50%) ${beakRotation[side]}` }),
    pointerEvents: 'none',
  }

  return (
    <svg
      data-tooltip-beak=""
      style={style}
      width={BEAK_WIDTH}
      height={BEAK_HEIGHT}
      viewBox={`0 0 ${BEAK_WIDTH} ${BEAK_HEIGHT}`}
      fill="none"
    >
      <path
        d="M0 0C0 0 6 0 9 6.5C10 8.5 12 8.5 13 6.5C16 0 22 0 22 0Z"
        className="fill-bg-elevated"
      />
      <path
        d="M0.5 0C0.5 0 6 0 9 6.5C10 8.5 12 8.5 13 6.5C16 0 21.5 0 21.5 0"
        className="stroke-border-default"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  )
}

export function Tooltip({
  content,
  side = 'top',
  align = 'center',
  delay = 400,
  className,
  children,
}: TooltipProps) {
  const arrowRef = useRef<SVGSVGElement>(null)

  const { refs, floatingStyles, context, middlewareData, placement } = useFloating({
    placement: buildPlacement(side, align),
    open: undefined,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8 + BEAK_HEIGHT),
      flip(),
      shift({ padding: 8 }),
      arrow({ element: arrowRef, padding: 8 }),
    ],
  })

  const [isOpen, setIsOpen] = React.useState(false)

  const { refs: floatingRefs, floatingStyles: fStyles, context: ctx, middlewareData: mData, placement: resolvedPlacement } = useFloating({
    placement: buildPlacement(side, align),
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8 + BEAK_HEIGHT),
      flip(),
      shift({ padding: 8 }),
      arrow({ element: arrowRef, padding: 8 }),
    ],
  })

  const hover = useHover(ctx, { delay: { open: delay, close: 0 } })
  const focus = useFocus(ctx)
  const dismiss = useDismiss(ctx)
  const role = useRole(ctx, { role: 'tooltip' })

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ])

  const resolvedSide = resolvedPlacement.split('-')[0]

  const { isMounted, styles: transitionStyles } = useTransitionStyles(ctx, {
    duration: { open: 150, close: 100 },
    initial: { opacity: 0, transform: 'scale(0.95)' },
    common: ({ side: s }) => ({
      transformOrigin: transformOriginMap[s] ?? 'center',
    }),
    open: { opacity: 1, transform: 'scale(1)' },
    close: { opacity: 0, transform: 'scale(0.95)' },
  })

  const arrowData = mData.arrow

  return (
    <>
      <span ref={floatingRefs.setReference} {...getReferenceProps()} className="inline-flex">
        {children}
      </span>
      {isMounted && (
        <div
          ref={floatingRefs.setFloating}
          role="tooltip"
          style={{ ...fStyles, zIndex: 50 }}
          {...getFloatingProps()}
        >
          <div
            className={cn(
              'relative px-3 py-1.5 text-xs font-medium rounded-[9px]',
              'bg-bg-elevated border border-border-default text-text-primary',
              'shadow-[var(--shadow-elevated)]',
              'pointer-events-none whitespace-nowrap',
              className
            )}
            style={{
              ...transitionStyles,
              letterSpacing: '0.01em',
            }}
          >
            {content}
            <TooltipBeak
              side={resolvedSide}
              x={arrowData?.x}
              y={arrowData?.y}
            />
          </div>
        </div>
      )}
    </>
  )
}
```

**Wait — the above has a bug.** There are two `useFloating` calls. Let me correct. The full correct implementation is:

Replace the full contents of `src/renderer/src/primitives/surfaces/Tooltip.tsx` with:

```tsx
import React, { useRef, useState } from 'react'
import {
  useFloating,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  useTransitionStyles,
  offset,
  flip,
  shift,
  arrow,
  autoUpdate,
  type Placement,
} from '@floating-ui/react'
import { cn } from '../utils/cn'

type TooltipSide = 'top' | 'bottom' | 'left' | 'right'
type TooltipAlign = 'start' | 'center' | 'end'

type TooltipProps = {
  content: string
  side?: TooltipSide
  align?: TooltipAlign
  delay?: number
  className?: string
  children: React.ReactNode
}

const BEAK_WIDTH = 22
const BEAK_HEIGHT = 9

function buildPlacement(side: TooltipSide, align: TooltipAlign): Placement {
  if (align === 'center') return side
  return `${side}-${align}`
}

const beakRotation: Record<string, string> = {
  top: 'rotate(0deg)',
  bottom: 'rotate(180deg)',
  left: 'rotate(-90deg)',
  right: 'rotate(90deg)',
}

const transformOriginMap: Record<string, string> = {
  top: 'bottom center',
  bottom: 'top center',
  left: 'right center',
  right: 'left center',
}

function TooltipBeak({
  side,
  x,
  y,
}: {
  side: string
  x?: number
  y?: number
}) {
  const isVertical = side === 'top' || side === 'bottom'
  const staticSide = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[side]!

  const style: React.CSSProperties = {
    position: 'absolute',
    [staticSide]: `-${BEAK_HEIGHT}px`,
    ...(isVertical
      ? { left: x != null ? `${x}px` : '50%', transform: `translateX(-50%) ${beakRotation[side]}` }
      : { top: y != null ? `${y}px` : '50%', transform: `translateY(-50%) ${beakRotation[side]}` }),
    pointerEvents: 'none',
  }

  return (
    <svg
      data-tooltip-beak=""
      style={style}
      width={BEAK_WIDTH}
      height={BEAK_HEIGHT}
      viewBox={`0 0 ${BEAK_WIDTH} ${BEAK_HEIGHT}`}
      fill="none"
    >
      <path
        d="M0 0C0 0 6 0 9 6.5C10 8.5 12 8.5 13 6.5C16 0 22 0 22 0Z"
        className="fill-bg-elevated"
      />
      <path
        d="M0.5 0C0.5 0 6 0 9 6.5C10 8.5 12 8.5 13 6.5C16 0 21.5 0 21.5 0"
        className="stroke-border-default"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  )
}

export function Tooltip({
  content,
  side = 'top',
  align = 'center',
  delay = 400,
  className,
  children,
}: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const arrowRef = useRef<SVGSVGElement>(null)

  const { refs, floatingStyles, context, middlewareData, placement } = useFloating({
    placement: buildPlacement(side, align),
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8 + BEAK_HEIGHT),
      flip(),
      shift({ padding: 8 }),
      arrow({ element: arrowRef, padding: 8 }),
    ],
  })

  const hover = useHover(context, { delay: { open: delay, close: 0 } })
  const focus = useFocus(context)
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'tooltip' })

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ])

  const resolvedSide = placement.split('-')[0]

  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    duration: { open: 150, close: 100 },
    initial: { opacity: 0, transform: 'scale(0.95)' },
    common: ({ side: s }) => ({
      transformOrigin: transformOriginMap[s] ?? 'center',
      transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    }),
    open: { opacity: 1, transform: 'scale(1)' },
    close: { opacity: 0, transform: 'scale(0.95)' },
  })

  const arrowData = middlewareData.arrow

  return (
    <>
      <span ref={refs.setReference} {...getReferenceProps()} className="inline-flex">
        {children}
      </span>
      {isMounted && (
        <div
          ref={refs.setFloating}
          role="tooltip"
          style={{ ...floatingStyles, zIndex: 50 }}
          {...getFloatingProps()}
        >
          <div
            className={cn(
              'relative px-3 py-1.5 text-xs font-medium rounded-[9px]',
              'bg-bg-elevated border border-border-default text-text-primary',
              'shadow-[var(--shadow-elevated)]',
              'pointer-events-none whitespace-nowrap',
              className
            )}
            style={{
              ...transitionStyles,
              letterSpacing: '0.01em',
            }}
          >
            {content}
            <TooltipBeak
              side={resolvedSide}
              x={arrowData?.x}
              y={arrowData?.y}
            />
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Run the tests**

Run:
```bash
pnpm test -- --run tests/unit/primitives/surfaces/tooltip.test.tsx
```

Expected: All 7 tests pass.

- [ ] **Step 3: Verify existing usages still compile**

The API is backward-compatible. Verify by running:
```bash
pnpm build
```

Expected: Build succeeds with no type errors. The existing usages in `TabBar.tsx`, `Sidebar.tsx`, and `ActivityBar.tsx` pass `content`, `side`, and `children` — all still supported.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/primitives/surfaces/Tooltip.tsx
git commit -m "feat: rewrite tooltip with Floating UI and SVG beak"
```

---

### Task 4: Update Storybook stories

**Files:**
- Modify: `src/renderer/src/primitives/surfaces/Tooltip.stories.tsx`

- [ ] **Step 1: Rewrite the stories file**

Replace the full contents of `src/renderer/src/primitives/surfaces/Tooltip.stories.tsx` with:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, userEvent, expect } from 'storybook/test'
import { Tooltip } from './Tooltip'
import { Button } from '../forms/Button'

const meta = {
  title: 'Primitives/Surfaces/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    side: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
    },
    align: {
      control: 'select',
      options: ['start', 'center', 'end'],
    },
    delay: { control: 'number' },
    content: { control: 'text' },
  },
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    content: 'Copy to clipboard',
    side: 'top',
    delay: 0,
    children: <Button variant="outline">Hover me</Button>,
  },
  play: async ({ canvas }) => {
    const trigger = canvas.getByText('Hover me')
    await userEvent.hover(trigger)
    const tooltip = await canvas.findByRole('tooltip')
    await expect(tooltip).toHaveTextContent('Copy to clipboard')
    await userEvent.unhover(trigger)
  },
}

export const AllSides: Story = {
  args: { content: '', children: null as any },
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 48, padding: 80 }}>
      {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
        <Tooltip key={side} content={`Tooltip on ${side}`} side={side} delay={0}>
          <Button variant="outline" style={{ width: '100%' }}>
            side=&quot;{side}&quot;
          </Button>
        </Tooltip>
      ))}
    </div>
  ),
}

export const WithDelay: Story = {
  args: {
    content: 'Appears after 800ms',
    side: 'bottom',
    delay: 800,
    children: <Button variant="outline">Hover and wait</Button>,
  },
}

export const FocusTrigger: Story = {
  args: {
    content: 'Triggered by focus',
    side: 'top',
    delay: 0,
    children: <Button variant="outline">Tab to me</Button>,
  },
  play: async ({ canvas }) => {
    const trigger = canvas.getByText('Tab to me')
    trigger.focus()
    const tooltip = await canvas.findByRole('tooltip')
    await expect(tooltip).toHaveTextContent('Triggered by focus')
  },
}
```

- [ ] **Step 2: Run story tests**

Use the `run-story-tests` MCP tool with the tooltip stories to verify they pass. Also use the `preview-stories` MCP tool to get preview URLs and share them with the user.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/primitives/surfaces/Tooltip.stories.tsx
git commit -m "feat: update tooltip stories for new design"
```

---

### Task 5: Final verification

- [ ] **Step 1: Run full unit test suite**

Run:
```bash
pnpm test -- --run
```

Expected: All tests pass, including the new tooltip tests and all existing tests.

- [ ] **Step 2: Run full story test suite**

Use the `run-story-tests` MCP tool with no story filter to run the full suite.

Expected: All story tests pass.

- [ ] **Step 3: Build check**

Run:
```bash
pnpm build
```

Expected: Build succeeds with no errors.

- [ ] **Step 4: Share story preview links**

Use the `preview-stories` MCP tool to get URLs for the tooltip stories and share them with the user for visual verification.
