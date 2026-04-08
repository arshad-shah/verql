# dbstudio Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete 52-primitive design system with token-level theming, resizable panel layout, Storybook documentation, and app icon/branding for dbstudio.

**Architecture:** Pure presentational components using Tailwind CSS v4 + CVA for variant management. Three-layer design token system (raw scale -> semantic -> component) with theme switching via CSS custom properties and `data-theme` attribute. Storybook 8.x with Vite builder for component documentation. Resizable panels via pointer events driving CSS grid layouts.

**Tech Stack:** React 19, Tailwind CSS v4, class-variance-authority, tailwind-merge, Storybook 8.x, Vite, vitest

---

## Phase 1: Foundation (Tokens, Theme, Core Utils)

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install CVA and tailwind-merge**

```bash
pnpm add class-variance-authority tailwind-merge
```

- [ ] **Step 2: Verify installation**

```bash
pnpm ls class-variance-authority tailwind-merge
```

Expected: Both packages listed with versions.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add class-variance-authority and tailwind-merge"
```

---

### Task 2: Design Token CSS

**Files:**
- Create: `src/renderer/src/primitives/theme/tokens.css`
- Create: `src/renderer/src/primitives/theme/themes/dark.css`
- Create: `src/renderer/src/primitives/theme/themes/light.css`
- Create: `src/renderer/src/primitives/theme/themes/midnight.css`
- Modify: `src/renderer/src/styles/globals.css`

- [ ] **Step 1: Create base token file**

Create `src/renderer/src/primitives/theme/tokens.css`:

```css
/*
 * Design Token System — Three Layers
 *
 * Layer 1: Raw scale values (static, never themed)
 * Layer 2: Semantic tokens (remapped per theme)
 * Layer 3: Component tokens (reference semantic tokens)
 */

/* ── Layer 1: Raw Scale ── */

:root {
  /* Purple */
  --raw-purple-400: #9b8fff;
  --raw-purple-500: #7c6ff7;
  --raw-purple-600: #6558d4;
  --raw-purple-900: #1a1533;

  /* Neutral */
  --raw-neutral-50: #fafafa;
  --raw-neutral-100: #f0f0f0;
  --raw-neutral-200: #e0e0e0;
  --raw-neutral-300: #c0c0c0;
  --raw-neutral-400: #888888;
  --raw-neutral-500: #666666;
  --raw-neutral-600: #444444;
  --raw-neutral-700: #2a2a3e;
  --raw-neutral-800: #1a1a2e;
  --raw-neutral-850: #12121f;
  --raw-neutral-900: #0d0d1a;

  /* Status */
  --raw-green-500: #28c840;
  --raw-yellow-500: #e5c07b;
  --raw-red-500: #ff5f57;
  --raw-blue-500: #61afef;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 24px;

  /* Radii */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-full: 9999px;

  /* Typography */
  --font-xs: 0.75rem;    /* 12px */
  --font-sm: 0.875rem;   /* 14px */
  --font-base: 1rem;     /* 16px */
  --font-lg: 1.125rem;   /* 18px */
  --font-xl: 1.25rem;    /* 20px */
  --font-2xl: 1.5rem;    /* 24px */
  --font-3xl: 1.875rem;  /* 30px */

  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;

  --weight-normal: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;
}

/* ── Layer 2: Semantic Tokens (default = dark) ── */

:root {
  /* Backgrounds */
  --color-bg-primary: var(--raw-neutral-900);
  --color-bg-secondary: var(--raw-neutral-850);
  --color-bg-tertiary: var(--raw-neutral-800);
  --color-bg-elevated: var(--raw-neutral-700);

  /* Text */
  --color-text-primary: #ffffff;
  --color-text-secondary: var(--raw-neutral-400);
  --color-text-tertiary: var(--raw-neutral-500);
  --color-text-disabled: var(--raw-neutral-600);

  /* Borders */
  --color-border-default: var(--raw-neutral-700);
  --color-border-subtle: var(--raw-neutral-800);
  --color-border-strong: var(--raw-neutral-500);

  /* Accent */
  --color-accent: var(--raw-purple-500);
  --color-accent-hover: var(--raw-purple-400);
  --color-accent-muted: var(--raw-purple-900);

  /* Status */
  --color-success: var(--raw-green-500);
  --color-warning: var(--raw-yellow-500);
  --color-error: var(--raw-red-500);
  --color-info: var(--raw-blue-500);

  /* Interactive */
  --color-hover: rgba(255, 255, 255, 0.05);
  --color-active: rgba(255, 255, 255, 0.1);
  --color-focus-ring: var(--raw-purple-500);
  --color-disabled: var(--raw-neutral-600);
}
```

- [ ] **Step 2: Create dark theme file**

Create `src/renderer/src/primitives/theme/themes/dark.css`:

```css
/* Dark theme — default, matches :root tokens in tokens.css */
/* Explicitly declared so ThemeProvider can list it */
[data-theme="dark"] {
  --color-bg-primary: var(--raw-neutral-900);
  --color-bg-secondary: var(--raw-neutral-850);
  --color-bg-tertiary: var(--raw-neutral-800);
  --color-bg-elevated: var(--raw-neutral-700);

  --color-text-primary: #ffffff;
  --color-text-secondary: var(--raw-neutral-400);
  --color-text-tertiary: var(--raw-neutral-500);
  --color-text-disabled: var(--raw-neutral-600);

  --color-border-default: var(--raw-neutral-700);
  --color-border-subtle: var(--raw-neutral-800);
  --color-border-strong: var(--raw-neutral-500);

  --color-accent: var(--raw-purple-500);
  --color-accent-hover: var(--raw-purple-400);
  --color-accent-muted: var(--raw-purple-900);

  --color-hover: rgba(255, 255, 255, 0.05);
  --color-active: rgba(255, 255, 255, 0.1);
  --color-focus-ring: var(--raw-purple-500);
  --color-disabled: var(--raw-neutral-600);
}
```

- [ ] **Step 3: Create light theme file**

Create `src/renderer/src/primitives/theme/themes/light.css`:

```css
[data-theme="light"] {
  --color-bg-primary: #ffffff;
  --color-bg-secondary: var(--raw-neutral-50);
  --color-bg-tertiary: var(--raw-neutral-100);
  --color-bg-elevated: #ffffff;

  --color-text-primary: var(--raw-neutral-900);
  --color-text-secondary: var(--raw-neutral-500);
  --color-text-tertiary: var(--raw-neutral-400);
  --color-text-disabled: var(--raw-neutral-300);

  --color-border-default: var(--raw-neutral-200);
  --color-border-subtle: var(--raw-neutral-100);
  --color-border-strong: var(--raw-neutral-400);

  --color-accent: var(--raw-purple-500);
  --color-accent-hover: var(--raw-purple-600);
  --color-accent-muted: #f0eeff;

  --color-hover: rgba(0, 0, 0, 0.04);
  --color-active: rgba(0, 0, 0, 0.08);
  --color-focus-ring: var(--raw-purple-500);
  --color-disabled: var(--raw-neutral-300);
}
```

- [ ] **Step 4: Create midnight theme file**

Create `src/renderer/src/primitives/theme/themes/midnight.css`:

```css
[data-theme="midnight"] {
  --color-bg-primary: #0a0a12;
  --color-bg-secondary: #0e0e18;
  --color-bg-tertiary: #141422;
  --color-bg-elevated: #1e1e32;

  --color-text-primary: #e0e0f0;
  --color-text-secondary: #7878a0;
  --color-text-tertiary: #5555780;
  --color-text-disabled: #3a3a55;

  --color-border-default: #1e1e32;
  --color-border-subtle: #141422;
  --color-border-strong: #3a3a55;

  --color-accent: #8b7cf8;
  --color-accent-hover: #a89bf9;
  --color-accent-muted: #1a1533;

  --color-hover: rgba(255, 255, 255, 0.04);
  --color-active: rgba(255, 255, 255, 0.08);
  --color-focus-ring: #8b7cf8;
  --color-disabled: #3a3a55;
}
```

- [ ] **Step 5: Update globals.css to import token system**

Replace the contents of `src/renderer/src/styles/globals.css` with:

```css
@import "tailwindcss";
@import "../primitives/theme/tokens.css";
@import "../primitives/theme/themes/dark.css";
@import "../primitives/theme/themes/light.css";
@import "../primitives/theme/themes/midnight.css";

@theme {
  --color-bg-primary: var(--color-bg-primary);
  --color-bg-secondary: var(--color-bg-secondary);
  --color-bg-tertiary: var(--color-bg-tertiary);
  --color-bg-elevated: var(--color-bg-elevated);
  --color-border: var(--color-border-default);
  --color-border-subtle: var(--color-border-subtle);
  --color-border-strong: var(--color-border-strong);
  --color-accent: var(--color-accent);
  --color-accent-hover: var(--color-accent-hover);
  --color-accent-muted: var(--color-accent-muted);
  --color-success: var(--color-success);
  --color-warning: var(--color-warning);
  --color-error: var(--color-error);
  --color-info: var(--color-info);
  --color-text-primary: var(--color-text-primary);
  --color-text-secondary: var(--color-text-secondary);
  --color-text-muted: var(--color-text-tertiary);
  --color-text-disabled: var(--color-text-disabled);
  --color-hover: var(--color-hover);
  --color-active: var(--color-active);
  --color-focus-ring: var(--color-focus-ring);
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  user-select: none;
}

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--color-bg-primary); }
::-webkit-scrollbar-thumb { background: var(--color-border-default); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--color-text-tertiary); }

.drag-region { -webkit-app-region: drag; }
.no-drag { -webkit-app-region: no-drag; }

@keyframes slide-in-right {
  from { opacity: 0; transform: translateX(100%); }
  to { opacity: 1; transform: translateX(0); }
}
.toast-enter { animation: slide-in-right 0.2s ease-out; }
```

- [ ] **Step 6: Verify the app still compiles and renders**

```bash
pnpm dev
```

Open the app, confirm it looks identical to before (dark theme is the default, all existing color references still work via the `@theme` block mapping).

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/primitives/theme/ src/renderer/src/styles/globals.css
git commit -m "feat(tokens): add three-layer design token system with dark/light/midnight themes"
```

---

### Task 3: cn() Utility and ThemeProvider

**Files:**
- Create: `src/renderer/src/primitives/utils/cn.ts`
- Create: `src/renderer/src/primitives/theme/ThemeProvider.tsx`
- Test: `tests/unit/primitives/cn.test.ts`

- [ ] **Step 1: Write failing test for cn utility**

Create `tests/unit/primitives/cn.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { cn } from '../../../src/renderer/src/primitives/utils/cn'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('flex', 'items-center')).toBe('flex items-center')
  })

  it('handles conditional classes', () => {
    expect(cn('flex', false && 'hidden', 'gap-2')).toBe('flex gap-2')
  })

  it('deduplicates conflicting tailwind classes', () => {
    expect(cn('px-4', 'px-2')).toBe('px-2')
  })

  it('handles undefined and null', () => {
    expect(cn('flex', undefined, null, 'gap-2')).toBe('flex gap-2')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/unit/primitives/cn.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement cn utility**

Create `src/renderer/src/primitives/utils/cn.ts`:

```ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

Note: `clsx` is a dependency of `tailwind-merge`, so it's already available. If not:

```bash
pnpm add clsx
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm vitest run tests/unit/primitives/cn.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Create ThemeProvider**

Create `src/renderer/src/primitives/theme/ThemeProvider.tsx`:

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'dbstudio-theme'
const AVAILABLE_THEMES = ['dark', 'light', 'midnight'] as const

type Theme = (typeof AVAILABLE_THEMES)[number]

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  themes: readonly Theme[]
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getStoredTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && AVAILABLE_THEMES.includes(stored as Theme)) {
    return stored as Theme
  }
  return 'dark'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    if (AVAILABLE_THEMES.includes(newTheme)) {
      setThemeState(newTheme)
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

- [ ] **Step 6: Wire ThemeProvider into main.tsx**

Modify `src/renderer/src/main.tsx` — wrap the `<App />` with `<ThemeProvider>`:

```tsx
import { ThemeProvider } from '@/primitives/theme/ThemeProvider'

// Inside the render call, wrap App:
<ThemeProvider>
  <App />
</ThemeProvider>
```

- [ ] **Step 7: Verify the app loads with ThemeProvider**

```bash
pnpm dev
```

Open devtools, confirm `<html>` has `data-theme="dark"` attribute.

- [ ] **Step 8: Commit**

```bash
git add src/renderer/src/primitives/ tests/unit/primitives/
git commit -m "feat(primitives): add cn utility and ThemeProvider with useTheme hook"
```

---

### Task 4: Barrel Export Setup

**Files:**
- Create: `src/renderer/src/primitives/index.ts`
- Create: `src/renderer/src/primitives/layout/index.ts`
- Create: `src/renderer/src/primitives/surfaces/index.ts`
- Create: `src/renderer/src/primitives/forms/index.ts`
- Create: `src/renderer/src/primitives/data-display/index.ts`
- Create: `src/renderer/src/primitives/feedback/index.ts`
- Create: `src/renderer/src/primitives/navigation/index.ts`
- Create: `src/renderer/src/primitives/typography/index.ts`
- Create: `src/renderer/src/primitives/utilities/index.ts`

- [ ] **Step 1: Create category barrel files**

These start empty and grow as components are added. Create each file with a placeholder comment:

`src/renderer/src/primitives/layout/index.ts`:
```ts
// Layout primitives — re-exported from primitives/index.ts
```

`src/renderer/src/primitives/surfaces/index.ts`:
```ts
// Surface primitives
```

`src/renderer/src/primitives/forms/index.ts`:
```ts
// Form primitives
```

`src/renderer/src/primitives/data-display/index.ts`:
```ts
// Data display primitives
```

`src/renderer/src/primitives/feedback/index.ts`:
```ts
// Feedback primitives
```

`src/renderer/src/primitives/navigation/index.ts`:
```ts
// Navigation primitives
```

`src/renderer/src/primitives/typography/index.ts`:
```ts
// Typography primitives
```

`src/renderer/src/primitives/utilities/index.ts`:
```ts
// Utility primitives
```

- [ ] **Step 2: Create root barrel**

`src/renderer/src/primitives/index.ts`:
```ts
// Theme
export { ThemeProvider, useTheme } from './theme/ThemeProvider'

// Utils
export { cn } from './utils/cn'

// Layout
export * from './layout'

// Surfaces
export * from './surfaces'

// Forms
export * from './forms'

// Data Display
export * from './data-display'

// Feedback
export * from './feedback'

// Navigation
export * from './navigation'

// Typography
export * from './typography'

// Utilities
export * from './utilities'
```

- [ ] **Step 3: Verify import works**

```bash
pnpm dev
```

No errors at startup. You can test by temporarily adding `import { cn } from '@/primitives'` to any component.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/primitives/
git commit -m "chore(primitives): add barrel exports for all component categories"
```

---

## Phase 2: Layout Primitives

### Task 5: Box Component

**Files:**
- Create: `src/renderer/src/primitives/layout/Box.tsx`
- Modify: `src/renderer/src/primitives/layout/index.ts`
- Test: `tests/unit/primitives/layout/Box.test.tsx`

- [ ] **Step 1: Write failing test**

Create `tests/unit/primitives/layout/Box.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Box } from '../../../../src/renderer/src/primitives/layout/Box'

describe('Box', () => {
  it('renders children', () => {
    render(<Box>Hello</Box>)
    expect(screen.getByText('Hello')).toBeDefined()
  })

  it('applies padding token class', () => {
    const { container } = render(<Box padding="md">Content</Box>)
    expect(container.firstChild).toHaveClass('p-3')
  })

  it('applies radius token class', () => {
    const { container } = render(<Box radius="lg">Content</Box>)
    expect(container.firstChild).toHaveClass('rounded-lg')
  })

  it('forwards ref', () => {
    let ref: HTMLDivElement | null = null
    render(<Box ref={(el) => { ref = el }}>Ref test</Box>)
    expect(ref).toBeInstanceOf(HTMLDivElement)
  })

  it('merges custom className', () => {
    const { container } = render(<Box className="custom-class">Content</Box>)
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('renders as a different element via as prop', () => {
    const { container } = render(<Box as="section">Section</Box>)
    expect(container.querySelector('section')).toBeDefined()
  })
})
```

- [ ] **Step 2: Update vitest config for React component tests**

Modify `vitest.config.ts` to add a separate test project for renderer components or update environment:

```ts
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    alias: {
      '@shared': resolve(__dirname, 'shared'),
      '@': resolve(__dirname, 'src/renderer/src')
    },
    setupFiles: ['tests/setup.ts']
  }
})
```

Create `tests/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 3: Run test to verify it fails**

```bash
pnpm vitest run tests/unit/primitives/layout/Box.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 4: Implement Box**

Create `src/renderer/src/primitives/layout/Box.tsx`:

```tsx
import { forwardRef, type ElementType, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cn } from '../utils/cn'

const paddingMap = {
  xs: 'p-1',
  sm: 'p-2',
  md: 'p-3',
  lg: 'p-4',
  xl: 'p-6',
} as const

const radiusMap = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
} as const

type SpacingToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type RadiusToken = 'sm' | 'md' | 'lg' | 'full'

interface BoxOwnProps {
  as?: ElementType
  padding?: SpacingToken
  paddingX?: SpacingToken
  paddingY?: SpacingToken
  radius?: RadiusToken
  children?: ReactNode
}

type BoxProps = BoxOwnProps & Omit<ComponentPropsWithRef<'div'>, keyof BoxOwnProps>

const paddingXMap = {
  xs: 'px-1',
  sm: 'px-2',
  md: 'px-3',
  lg: 'px-4',
  xl: 'px-6',
} as const

const paddingYMap = {
  xs: 'py-1',
  sm: 'py-2',
  md: 'py-3',
  lg: 'py-4',
  xl: 'py-6',
} as const

export const Box = forwardRef<HTMLDivElement, BoxProps>(function Box(
  { as: Component = 'div', padding, paddingX, paddingY, radius, className, children, ...props },
  ref
) {
  return (
    <Component
      ref={ref}
      className={cn(
        padding && paddingMap[padding],
        paddingX && paddingXMap[paddingX],
        paddingY && paddingYMap[paddingY],
        radius && radiusMap[radius],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
})
```

- [ ] **Step 5: Export from barrel**

Update `src/renderer/src/primitives/layout/index.ts`:

```ts
export { Box } from './Box'
```

- [ ] **Step 6: Run test to verify it passes**

```bash
pnpm vitest run tests/unit/primitives/layout/Box.test.tsx
```

Expected: All 6 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/primitives/layout/Box.tsx src/renderer/src/primitives/layout/index.ts tests/unit/primitives/layout/Box.test.tsx vitest.config.ts tests/setup.ts
git commit -m "feat(primitives): add Box layout component with padding and radius tokens"
```

---

### Task 6: Flex Component

**Files:**
- Create: `src/renderer/src/primitives/layout/Flex.tsx`
- Modify: `src/renderer/src/primitives/layout/index.ts`
- Test: `tests/unit/primitives/layout/Flex.test.tsx`

- [ ] **Step 1: Write failing test**

Create `tests/unit/primitives/layout/Flex.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Flex } from '../../../../src/renderer/src/primitives/layout/Flex'

describe('Flex', () => {
  it('renders as a flex container', () => {
    const { container } = render(<Flex>Content</Flex>)
    expect(container.firstChild).toHaveClass('flex')
  })

  it('applies direction', () => {
    const { container } = render(<Flex direction="column">Content</Flex>)
    expect(container.firstChild).toHaveClass('flex-col')
  })

  it('applies gap token', () => {
    const { container } = render(<Flex gap="md">Content</Flex>)
    expect(container.firstChild).toHaveClass('gap-3')
  })

  it('applies align and justify', () => {
    const { container } = render(<Flex align="center" justify="between">Content</Flex>)
    expect(container.firstChild).toHaveClass('items-center')
    expect(container.firstChild).toHaveClass('justify-between')
  })

  it('applies wrap', () => {
    const { container } = render(<Flex wrap>Content</Flex>)
    expect(container.firstChild).toHaveClass('flex-wrap')
  })

  it('forwards ref and spreads props', () => {
    let ref: HTMLDivElement | null = null
    render(<Flex ref={(el) => { ref = el }} data-testid="flex">Content</Flex>)
    expect(ref).toBeInstanceOf(HTMLDivElement)
    expect(screen.getByTestId('flex')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/unit/primitives/layout/Flex.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement Flex**

Create `src/renderer/src/primitives/layout/Flex.tsx`:

```tsx
import { forwardRef, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cn } from '../utils/cn'

const gapMap = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
  xl: 'gap-6',
} as const

const directionMap = {
  row: 'flex-row',
  column: 'flex-col',
  'row-reverse': 'flex-row-reverse',
  'column-reverse': 'flex-col-reverse',
} as const

const alignMap = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
} as const

const justifyMap = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
} as const

type SpacingToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface FlexOwnProps {
  direction?: keyof typeof directionMap
  gap?: SpacingToken
  align?: keyof typeof alignMap
  justify?: keyof typeof justifyMap
  wrap?: boolean
  children?: ReactNode
}

type FlexProps = FlexOwnProps & Omit<ComponentPropsWithRef<'div'>, keyof FlexOwnProps>

export const Flex = forwardRef<HTMLDivElement, FlexProps>(function Flex(
  { direction, gap, align, justify, wrap, className, children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        'flex',
        direction && directionMap[direction],
        gap && gapMap[gap],
        align && alignMap[align],
        justify && justifyMap[justify],
        wrap && 'flex-wrap',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
```

- [ ] **Step 4: Export from barrel**

Update `src/renderer/src/primitives/layout/index.ts`:

```ts
export { Box } from './Box'
export { Flex } from './Flex'
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pnpm vitest run tests/unit/primitives/layout/Flex.test.tsx
```

Expected: All 6 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/primitives/layout/Flex.tsx src/renderer/src/primitives/layout/index.ts tests/unit/primitives/layout/Flex.test.tsx
git commit -m "feat(primitives): add Flex layout component"
```

---

### Task 7: Stack Component

**Files:**
- Create: `src/renderer/src/primitives/layout/Stack.tsx`
- Modify: `src/renderer/src/primitives/layout/index.ts`
- Test: `tests/unit/primitives/layout/Stack.test.tsx`

- [ ] **Step 1: Write failing test**

Create `tests/unit/primitives/layout/Stack.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Stack } from '../../../../src/renderer/src/primitives/layout/Stack'

describe('Stack', () => {
  it('renders as vertical stack by default', () => {
    const { container } = render(<Stack>Content</Stack>)
    expect(container.firstChild).toHaveClass('flex')
    expect(container.firstChild).toHaveClass('flex-col')
  })

  it('renders as horizontal stack', () => {
    const { container } = render(<Stack direction="horizontal">Content</Stack>)
    expect(container.firstChild).toHaveClass('flex-row')
  })

  it('applies gap token', () => {
    const { container } = render(<Stack gap="lg">Content</Stack>)
    expect(container.firstChild).toHaveClass('gap-4')
  })

  it('applies align', () => {
    const { container } = render(<Stack align="center">Content</Stack>)
    expect(container.firstChild).toHaveClass('items-center')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/unit/primitives/layout/Stack.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement Stack**

Create `src/renderer/src/primitives/layout/Stack.tsx`:

```tsx
import { forwardRef, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cn } from '../utils/cn'

const gapMap = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
  xl: 'gap-6',
} as const

const alignMap = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
} as const

type SpacingToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface StackOwnProps {
  direction?: 'vertical' | 'horizontal'
  gap?: SpacingToken
  align?: keyof typeof alignMap
  children?: ReactNode
}

type StackProps = StackOwnProps & Omit<ComponentPropsWithRef<'div'>, keyof StackOwnProps>

export const Stack = forwardRef<HTMLDivElement, StackProps>(function Stack(
  { direction = 'vertical', gap, align, className, children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        'flex',
        direction === 'vertical' ? 'flex-col' : 'flex-row',
        gap && gapMap[gap],
        align && alignMap[align],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
```

- [ ] **Step 4: Export from barrel**

Update `src/renderer/src/primitives/layout/index.ts`:

```ts
export { Box } from './Box'
export { Flex } from './Flex'
export { Stack } from './Stack'
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pnpm vitest run tests/unit/primitives/layout/Stack.test.tsx
```

Expected: All 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/primitives/layout/Stack.tsx src/renderer/src/primitives/layout/index.ts tests/unit/primitives/layout/Stack.test.tsx
git commit -m "feat(primitives): add Stack layout component"
```

---

### Task 8: Grid, Container, Divider, Spacer, ScrollArea, AspectRatio

**Files:**
- Create: `src/renderer/src/primitives/layout/Grid.tsx`
- Create: `src/renderer/src/primitives/layout/Container.tsx`
- Create: `src/renderer/src/primitives/layout/Divider.tsx`
- Create: `src/renderer/src/primitives/layout/Spacer.tsx`
- Create: `src/renderer/src/primitives/layout/ScrollArea.tsx`
- Create: `src/renderer/src/primitives/layout/AspectRatio.tsx`
- Modify: `src/renderer/src/primitives/layout/index.ts`
- Test: `tests/unit/primitives/layout/layout-remaining.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/primitives/layout/layout-remaining.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Grid } from '../../../../src/renderer/src/primitives/layout/Grid'
import { Container } from '../../../../src/renderer/src/primitives/layout/Container'
import { Divider } from '../../../../src/renderer/src/primitives/layout/Divider'
import { Spacer } from '../../../../src/renderer/src/primitives/layout/Spacer'
import { ScrollArea } from '../../../../src/renderer/src/primitives/layout/ScrollArea'
import { AspectRatio } from '../../../../src/renderer/src/primitives/layout/AspectRatio'

describe('Grid', () => {
  it('renders as grid with columns', () => {
    const { container } = render(<Grid columns={3}>Content</Grid>)
    expect(container.firstChild).toHaveClass('grid')
    expect(container.firstChild).toHaveClass('grid-cols-3')
  })

  it('applies gap token', () => {
    const { container } = render(<Grid columns={2} gap="sm">Content</Grid>)
    expect(container.firstChild).toHaveClass('gap-2')
  })
})

describe('Container', () => {
  it('renders with max-width and centering', () => {
    const { container } = render(<Container>Content</Container>)
    expect(container.firstChild).toHaveClass('mx-auto')
    expect(container.firstChild).toHaveClass('w-full')
  })

  it('applies size variant', () => {
    const { container } = render(<Container size="sm">Content</Container>)
    expect(container.firstChild).toHaveClass('max-w-2xl')
  })
})

describe('Divider', () => {
  it('renders horizontal divider by default', () => {
    const { container } = render(<Divider />)
    expect(container.firstChild).toHaveClass('border-t')
  })

  it('renders vertical divider', () => {
    const { container } = render(<Divider orientation="vertical" />)
    expect(container.firstChild).toHaveClass('border-l')
  })
})

describe('Spacer', () => {
  it('renders as flex-1 spacer', () => {
    const { container } = render(<Spacer />)
    expect(container.firstChild).toHaveClass('flex-1')
  })
})

describe('ScrollArea', () => {
  it('renders with overflow auto', () => {
    const { container } = render(<ScrollArea>Content</ScrollArea>)
    expect(container.firstChild).toHaveClass('overflow-auto')
  })
})

describe('AspectRatio', () => {
  it('applies 16/9 ratio by default', () => {
    const { container } = render(<AspectRatio>Content</AspectRatio>)
    expect(container.firstChild).toHaveClass('aspect-video')
  })

  it('applies square ratio', () => {
    const { container } = render(<AspectRatio ratio="square">Content</AspectRatio>)
    expect(container.firstChild).toHaveClass('aspect-square')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/unit/primitives/layout/layout-remaining.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement Grid**

Create `src/renderer/src/primitives/layout/Grid.tsx`:

```tsx
import { forwardRef, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cn } from '../utils/cn'

const gapMap = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
  xl: 'gap-6',
} as const

type SpacingToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface GridOwnProps {
  columns?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  gap?: SpacingToken
  children?: ReactNode
}

type GridProps = GridOwnProps & Omit<ComponentPropsWithRef<'div'>, keyof GridOwnProps>

const colsMap: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  12: 'grid-cols-12',
}

export const Grid = forwardRef<HTMLDivElement, GridProps>(function Grid(
  { columns = 1, gap, className, children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn('grid', colsMap[columns], gap && gapMap[gap], className)}
      {...props}
    >
      {children}
    </div>
  )
})
```

- [ ] **Step 4: Implement Container**

Create `src/renderer/src/primitives/layout/Container.tsx`:

```tsx
import { forwardRef, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cn } from '../utils/cn'

const sizeMap = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
} as const

interface ContainerOwnProps {
  size?: keyof typeof sizeMap
  children?: ReactNode
}

type ContainerProps = ContainerOwnProps & Omit<ComponentPropsWithRef<'div'>, keyof ContainerOwnProps>

export const Container = forwardRef<HTMLDivElement, ContainerProps>(function Container(
  { size = 'lg', className, children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn('mx-auto w-full px-4', sizeMap[size], className)}
      {...props}
    >
      {children}
    </div>
  )
})
```

- [ ] **Step 5: Implement Divider**

Create `src/renderer/src/primitives/layout/Divider.tsx`:

```tsx
import { forwardRef, type ComponentPropsWithRef } from 'react'
import { cn } from '../utils/cn'

interface DividerOwnProps {
  orientation?: 'horizontal' | 'vertical'
}

type DividerProps = DividerOwnProps & Omit<ComponentPropsWithRef<'div'>, keyof DividerOwnProps>

export const Divider = forwardRef<HTMLDivElement, DividerProps>(function Divider(
  { orientation = 'horizontal', className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation={orientation}
      className={cn(
        'border-border-default',
        orientation === 'horizontal' ? 'border-t w-full' : 'border-l h-full',
        className
      )}
      {...props}
    />
  )
})
```

- [ ] **Step 6: Implement Spacer**

Create `src/renderer/src/primitives/layout/Spacer.tsx`:

```tsx
import { forwardRef, type ComponentPropsWithRef } from 'react'
import { cn } from '../utils/cn'

type SpacerProps = ComponentPropsWithRef<'div'>

export const Spacer = forwardRef<HTMLDivElement, SpacerProps>(function Spacer(
  { className, ...props },
  ref
) {
  return <div ref={ref} className={cn('flex-1', className)} {...props} />
})
```

- [ ] **Step 7: Implement ScrollArea**

Create `src/renderer/src/primitives/layout/ScrollArea.tsx`:

```tsx
import { forwardRef, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cn } from '../utils/cn'

interface ScrollAreaOwnProps {
  direction?: 'vertical' | 'horizontal' | 'both'
  children?: ReactNode
}

type ScrollAreaProps = ScrollAreaOwnProps & Omit<ComponentPropsWithRef<'div'>, keyof ScrollAreaOwnProps>

const overflowMap = {
  vertical: 'overflow-y-auto overflow-x-hidden',
  horizontal: 'overflow-x-auto overflow-y-hidden',
  both: 'overflow-auto',
} as const

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea(
  { direction = 'both', className, children, ...props },
  ref
) {
  return (
    <div ref={ref} className={cn(overflowMap[direction], className)} {...props}>
      {children}
    </div>
  )
})
```

- [ ] **Step 8: Implement AspectRatio**

Create `src/renderer/src/primitives/layout/AspectRatio.tsx`:

```tsx
import { forwardRef, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cn } from '../utils/cn'

const ratioMap = {
  square: 'aspect-square',
  video: 'aspect-video',
  '4/3': 'aspect-4/3',
} as const

interface AspectRatioOwnProps {
  ratio?: keyof typeof ratioMap
  children?: ReactNode
}

type AspectRatioProps = AspectRatioOwnProps & Omit<ComponentPropsWithRef<'div'>, keyof AspectRatioOwnProps>

export const AspectRatio = forwardRef<HTMLDivElement, AspectRatioProps>(function AspectRatio(
  { ratio = 'video', className, children, ...props },
  ref
) {
  return (
    <div ref={ref} className={cn(ratioMap[ratio], 'overflow-hidden', className)} {...props}>
      {children}
    </div>
  )
})
```

- [ ] **Step 9: Update barrel export**

Update `src/renderer/src/primitives/layout/index.ts`:

```ts
export { Box } from './Box'
export { Flex } from './Flex'
export { Stack } from './Stack'
export { Grid } from './Grid'
export { Container } from './Container'
export { Divider } from './Divider'
export { Spacer } from './Spacer'
export { ScrollArea } from './ScrollArea'
export { AspectRatio } from './AspectRatio'
```

- [ ] **Step 10: Run tests to verify they pass**

```bash
pnpm vitest run tests/unit/primitives/layout/
```

Expected: All layout tests PASS.

- [ ] **Step 11: Commit**

```bash
git add src/renderer/src/primitives/layout/ tests/unit/primitives/layout/
git commit -m "feat(primitives): add Grid, Container, Divider, Spacer, ScrollArea, AspectRatio"
```

---

## Phase 3: Typography Primitives

### Task 9: Text, Heading, Code, Kbd

**Files:**
- Create: `src/renderer/src/primitives/typography/Text.tsx`
- Create: `src/renderer/src/primitives/typography/Heading.tsx`
- Create: `src/renderer/src/primitives/typography/Code.tsx`
- Create: `src/renderer/src/primitives/typography/Kbd.tsx`
- Modify: `src/renderer/src/primitives/typography/index.ts`
- Test: `tests/unit/primitives/typography/typography.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/primitives/typography/typography.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Text } from '../../../../src/renderer/src/primitives/typography/Text'
import { Heading } from '../../../../src/renderer/src/primitives/typography/Heading'
import { Code } from '../../../../src/renderer/src/primitives/typography/Code'
import { Kbd } from '../../../../src/renderer/src/primitives/typography/Kbd'

describe('Text', () => {
  it('renders a span by default', () => {
    const { container } = render(<Text>Hello</Text>)
    expect(container.querySelector('span')).toBeDefined()
  })

  it('applies size variant', () => {
    const { container } = render(<Text size="sm">Hello</Text>)
    expect(container.firstChild).toHaveClass('text-sm')
  })

  it('applies color variant', () => {
    const { container } = render(<Text color="secondary">Hello</Text>)
    expect(container.firstChild).toHaveClass('text-text-secondary')
  })

  it('applies weight', () => {
    const { container } = render(<Text weight="semibold">Bold</Text>)
    expect(container.firstChild).toHaveClass('font-semibold')
  })

  it('renders as p element', () => {
    const { container } = render(<Text as="p">Paragraph</Text>)
    expect(container.querySelector('p')).toBeDefined()
  })
})

describe('Heading', () => {
  it('renders h2 by default', () => {
    const { container } = render(<Heading>Title</Heading>)
    expect(container.querySelector('h2')).toBeDefined()
  })

  it('renders correct heading level', () => {
    const { container } = render(<Heading level={3}>Title</Heading>)
    expect(container.querySelector('h3')).toBeDefined()
  })

  it('applies size based on level', () => {
    const { container } = render(<Heading level={1}>Title</Heading>)
    expect(container.firstChild).toHaveClass('text-3xl')
  })
})

describe('Code', () => {
  it('renders inline code', () => {
    const { container } = render(<Code>const x = 1</Code>)
    expect(container.querySelector('code')).toBeDefined()
    expect(container.firstChild).toHaveClass('font-mono')
  })

  it('renders block code', () => {
    const { container } = render(<Code block>const x = 1</Code>)
    expect(container.querySelector('pre')).toBeDefined()
  })
})

describe('Kbd', () => {
  it('renders a kbd element', () => {
    const { container } = render(<Kbd>Cmd+K</Kbd>)
    expect(container.querySelector('kbd')).toBeDefined()
  })

  it('has keyboard styling', () => {
    const { container } = render(<Kbd>Esc</Kbd>)
    expect(container.firstChild).toHaveClass('font-mono')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/unit/primitives/typography/typography.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement Text**

Create `src/renderer/src/primitives/typography/Text.tsx`:

```tsx
import { forwardRef, type ElementType, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const textVariants = cva('', {
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
    },
    color: {
      primary: 'text-text-primary',
      secondary: 'text-text-secondary',
      muted: 'text-text-muted',
      disabled: 'text-text-disabled',
      accent: 'text-accent',
      success: 'text-success',
      warning: 'text-warning',
      error: 'text-error',
    },
    weight: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
    truncate: {
      true: 'truncate',
    },
  },
  defaultVariants: {
    size: 'sm',
    color: 'primary',
    weight: 'normal',
  },
})

interface TextOwnProps extends VariantProps<typeof textVariants> {
  as?: ElementType
  children?: ReactNode
}

type TextProps = TextOwnProps & Omit<ComponentPropsWithRef<'span'>, keyof TextOwnProps>

export const Text = forwardRef<HTMLSpanElement, TextProps>(function Text(
  { as: Component = 'span', size, color, weight, truncate, className, children, ...props },
  ref
) {
  return (
    <Component
      ref={ref}
      className={cn(textVariants({ size, color, weight, truncate }), className)}
      {...props}
    >
      {children}
    </Component>
  )
})
```

- [ ] **Step 4: Implement Heading**

Create `src/renderer/src/primitives/typography/Heading.tsx`:

```tsx
import { forwardRef, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cn } from '../utils/cn'

const levelStyles = {
  1: 'text-3xl font-bold',
  2: 'text-2xl font-semibold',
  3: 'text-xl font-semibold',
  4: 'text-lg font-medium',
  5: 'text-base font-medium',
  6: 'text-sm font-medium',
} as const

interface HeadingOwnProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6
  children?: ReactNode
}

type HeadingProps = HeadingOwnProps & Omit<ComponentPropsWithRef<'h2'>, keyof HeadingOwnProps>

export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  { level = 2, className, children, ...props },
  ref
) {
  const Tag = `h${level}` as const
  return (
    <Tag
      ref={ref}
      className={cn('text-text-primary', levelStyles[level], className)}
      {...props}
    >
      {children}
    </Tag>
  )
})
```

- [ ] **Step 5: Implement Code**

Create `src/renderer/src/primitives/typography/Code.tsx`:

```tsx
import { forwardRef, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cn } from '../utils/cn'

interface CodeOwnProps {
  block?: boolean
  children?: ReactNode
}

type CodeProps = CodeOwnProps & Omit<ComponentPropsWithRef<'code'>, keyof CodeOwnProps>

export const Code = forwardRef<HTMLElement, CodeProps>(function Code(
  { block, className, children, ...props },
  ref
) {
  const classes = cn(
    'font-mono text-xs',
    block
      ? 'block bg-bg-tertiary p-3 rounded-md overflow-x-auto'
      : 'inline bg-bg-tertiary px-1.5 py-0.5 rounded',
    className
  )

  if (block) {
    return (
      <pre ref={ref} className={classes} {...props}>
        <code>{children}</code>
      </pre>
    )
  }

  return (
    <code ref={ref} className={classes} {...props}>
      {children}
    </code>
  )
})
```

- [ ] **Step 6: Implement Kbd**

Create `src/renderer/src/primitives/typography/Kbd.tsx`:

```tsx
import { forwardRef, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cn } from '../utils/cn'

interface KbdOwnProps {
  children?: ReactNode
}

type KbdProps = KbdOwnProps & Omit<ComponentPropsWithRef<'kbd'>, keyof KbdOwnProps>

export const Kbd = forwardRef<HTMLElement, KbdProps>(function Kbd(
  { className, children, ...props },
  ref
) {
  return (
    <kbd
      ref={ref}
      className={cn(
        'inline-flex items-center font-mono text-xs',
        'px-1.5 py-0.5 rounded border',
        'bg-bg-tertiary border-border-default text-text-secondary',
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  )
})
```

- [ ] **Step 7: Update barrel export**

Update `src/renderer/src/primitives/typography/index.ts`:

```ts
export { Text } from './Text'
export { Heading } from './Heading'
export { Code } from './Code'
export { Kbd } from './Kbd'
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
pnpm vitest run tests/unit/primitives/typography/
```

Expected: All typography tests PASS.

- [ ] **Step 9: Commit**

```bash
git add src/renderer/src/primitives/typography/ tests/unit/primitives/typography/
git commit -m "feat(primitives): add Text, Heading, Code, Kbd typography components"
```

---

## Phase 4: Form Primitives

### Task 10: Button and IconButton

**Files:**
- Create: `src/renderer/src/primitives/forms/Button.tsx`
- Create: `src/renderer/src/primitives/forms/IconButton.tsx`
- Modify: `src/renderer/src/primitives/forms/index.ts`
- Test: `tests/unit/primitives/forms/button.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/primitives/forms/button.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../../../../src/renderer/src/primitives/forms/Button'
import { IconButton } from '../../../../src/renderer/src/primitives/forms/IconButton'

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeDefined()
  })

  it('applies solid variant by default', () => {
    const { container } = render(<Button>Click</Button>)
    expect(container.firstChild).toHaveClass('bg-accent')
  })

  it('applies ghost variant', () => {
    const { container } = render(<Button variant="ghost">Click</Button>)
    expect(container.firstChild).toHaveClass('bg-transparent')
  })

  it('applies size md by default', () => {
    const { container } = render(<Button>Click</Button>)
    expect(container.firstChild).toHaveClass('h-8')
  })

  it('applies size xs', () => {
    const { container } = render(<Button size="xs">Click</Button>)
    expect(container.firstChild).toHaveClass('h-6')
  })

  it('handles click', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    fireEvent.click(screen.getByText('Click'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('is disabled when disabled prop is set', () => {
    const { container } = render(<Button disabled>Click</Button>)
    expect((container.firstChild as HTMLButtonElement).disabled).toBe(true)
  })

  it('forwards ref', () => {
    let ref: HTMLButtonElement | null = null
    render(<Button ref={(el) => { ref = el }}>Click</Button>)
    expect(ref).toBeInstanceOf(HTMLButtonElement)
  })
})

describe('IconButton', () => {
  it('renders with aria-label', () => {
    render(<IconButton label="Close"><span>X</span></IconButton>)
    expect(screen.getByLabelText('Close')).toBeDefined()
  })

  it('applies size', () => {
    const { container } = render(<IconButton label="Close" size="sm"><span>X</span></IconButton>)
    expect(container.firstChild).toHaveClass('h-7')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/unit/primitives/forms/button.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement Button**

Create `src/renderer/src/primitives/forms/Button.tsx`:

```tsx
import { forwardRef, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        solid: 'bg-accent text-white hover:bg-accent-hover',
        outline: 'border border-border-default bg-transparent hover:bg-hover text-text-primary',
        ghost: 'bg-transparent hover:bg-hover text-text-primary',
        danger: 'bg-error text-white hover:bg-error/90',
      },
      size: {
        xs: 'h-6 px-2 text-xs rounded',
        sm: 'h-7 px-3 text-xs rounded',
        md: 'h-8 px-4 text-sm rounded-md',
        lg: 'h-9 px-5 text-sm rounded-md',
        xl: 'h-10 px-6 text-base rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'solid',
      size: 'md',
    },
  }
)

export type ButtonVariants = VariantProps<typeof buttonVariants>

interface ButtonOwnProps extends ButtonVariants {
  children?: ReactNode
}

type ButtonProps = ButtonOwnProps & Omit<ComponentPropsWithRef<'button'>, keyof ButtonOwnProps>

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, className, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </button>
  )
})
```

- [ ] **Step 4: Implement IconButton**

Create `src/renderer/src/primitives/forms/IconButton.tsx`:

```tsx
import { forwardRef, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const iconButtonVariants = cva(
  'inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        solid: 'bg-accent text-white hover:bg-accent-hover',
        outline: 'border border-border-default bg-transparent hover:bg-hover text-text-primary',
        ghost: 'bg-transparent hover:bg-hover text-text-secondary hover:text-text-primary',
      },
      size: {
        xs: 'h-6 w-6 rounded',
        sm: 'h-7 w-7 rounded',
        md: 'h-8 w-8 rounded-md',
        lg: 'h-9 w-9 rounded-md',
        xl: 'h-10 w-10 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'md',
    },
  }
)

interface IconButtonOwnProps extends VariantProps<typeof iconButtonVariants> {
  label: string
  children?: ReactNode
}

type IconButtonProps = IconButtonOwnProps & Omit<ComponentPropsWithRef<'button'>, keyof IconButtonOwnProps>

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant, size, label, className, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      aria-label={label}
      className={cn(iconButtonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </button>
  )
})
```

- [ ] **Step 5: Update barrel export**

Update `src/renderer/src/primitives/forms/index.ts`:

```ts
export { Button, type ButtonVariants } from './Button'
export { IconButton } from './IconButton'
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
pnpm vitest run tests/unit/primitives/forms/button.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/primitives/forms/ tests/unit/primitives/forms/
git commit -m "feat(primitives): add Button and IconButton with CVA variants"
```

---

### Task 11: Input, Textarea, Label, FormField

**Files:**
- Create: `src/renderer/src/primitives/forms/Input.tsx`
- Create: `src/renderer/src/primitives/forms/Textarea.tsx`
- Create: `src/renderer/src/primitives/forms/Label.tsx`
- Create: `src/renderer/src/primitives/forms/FormField.tsx`
- Modify: `src/renderer/src/primitives/forms/index.ts`
- Test: `tests/unit/primitives/forms/inputs.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/primitives/forms/inputs.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Input } from '../../../../src/renderer/src/primitives/forms/Input'
import { Textarea } from '../../../../src/renderer/src/primitives/forms/Textarea'
import { Label } from '../../../../src/renderer/src/primitives/forms/Label'
import { FormField } from '../../../../src/renderer/src/primitives/forms/FormField'

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input placeholder="Type here" />)
    expect(screen.getByPlaceholderText('Type here')).toBeDefined()
  })

  it('applies size md by default', () => {
    const { container } = render(<Input />)
    expect(container.firstChild).toHaveClass('h-8')
  })

  it('applies error state', () => {
    const { container } = render(<Input error />)
    expect(container.firstChild).toHaveClass('border-error')
  })
})

describe('Textarea', () => {
  it('renders a textarea element', () => {
    render(<Textarea placeholder="Type here" />)
    expect(screen.getByPlaceholderText('Type here').tagName).toBe('TEXTAREA')
  })
})

describe('Label', () => {
  it('renders a label element', () => {
    render(<Label htmlFor="test">Name</Label>)
    expect(screen.getByText('Name').tagName).toBe('LABEL')
  })
})

describe('FormField', () => {
  it('renders label and children', () => {
    render(
      <FormField label="Email">
        <Input placeholder="email" />
      </FormField>
    )
    expect(screen.getByText('Email')).toBeDefined()
    expect(screen.getByPlaceholderText('email')).toBeDefined()
  })

  it('renders error message', () => {
    render(
      <FormField label="Email" error="Required">
        <Input />
      </FormField>
    )
    expect(screen.getByText('Required')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/unit/primitives/forms/inputs.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement Input**

Create `src/renderer/src/primitives/forms/Input.tsx`:

```tsx
import { forwardRef, type ComponentPropsWithRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const inputVariants = cva(
  'w-full border bg-bg-tertiary text-text-primary placeholder:text-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      size: {
        xs: 'h-6 px-2 text-xs rounded',
        sm: 'h-7 px-3 text-xs rounded',
        md: 'h-8 px-3 text-sm rounded-md',
        lg: 'h-9 px-4 text-sm rounded-md',
        xl: 'h-10 px-4 text-base rounded-lg',
      },
      error: {
        true: 'border-error focus:ring-error',
        false: 'border-border-default',
      },
    },
    defaultVariants: {
      size: 'md',
      error: false,
    },
  }
)

interface InputOwnProps extends VariantProps<typeof inputVariants> {}

type InputProps = InputOwnProps & Omit<ComponentPropsWithRef<'input'>, keyof InputOwnProps>

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { size, error, className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(inputVariants({ size, error }), className)}
      {...props}
    />
  )
})
```

- [ ] **Step 4: Implement Textarea**

Create `src/renderer/src/primitives/forms/Textarea.tsx`:

```tsx
import { forwardRef, type ComponentPropsWithRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const textareaVariants = cva(
  'w-full border bg-bg-tertiary text-text-primary placeholder:text-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring disabled:pointer-events-none disabled:opacity-50 resize-y',
  {
    variants: {
      size: {
        sm: 'px-3 py-2 text-xs rounded',
        md: 'px-3 py-2 text-sm rounded-md',
        lg: 'px-4 py-3 text-sm rounded-md',
      },
      error: {
        true: 'border-error focus:ring-error',
        false: 'border-border-default',
      },
    },
    defaultVariants: {
      size: 'md',
      error: false,
    },
  }
)

interface TextareaOwnProps extends VariantProps<typeof textareaVariants> {}

type TextareaProps = TextareaOwnProps & Omit<ComponentPropsWithRef<'textarea'>, keyof TextareaOwnProps>

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { size, error, className, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={cn(textareaVariants({ size, error }), className)}
      {...props}
    />
  )
})
```

- [ ] **Step 5: Implement Label**

Create `src/renderer/src/primitives/forms/Label.tsx`:

```tsx
import { forwardRef, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cn } from '../utils/cn'

interface LabelOwnProps {
  children?: ReactNode
}

type LabelProps = LabelOwnProps & Omit<ComponentPropsWithRef<'label'>, keyof LabelOwnProps>

export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { className, children, ...props },
  ref
) {
  return (
    <label
      ref={ref}
      className={cn('text-sm font-medium text-text-primary', className)}
      {...props}
    >
      {children}
    </label>
  )
})
```

- [ ] **Step 6: Implement FormField**

Create `src/renderer/src/primitives/forms/FormField.tsx`:

```tsx
import { type ReactNode, useId } from 'react'
import { Label } from './Label'
import { cn } from '../utils/cn'

interface FormFieldProps {
  label: string
  error?: string
  hint?: string
  className?: string
  children: ReactNode
}

export function FormField({ label, error, hint, className, children }: FormFieldProps) {
  const id = useId()

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      <div>{children}</div>
      {error && <p className="text-xs text-error">{error}</p>}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  )
}
```

- [ ] **Step 7: Update barrel export**

Update `src/renderer/src/primitives/forms/index.ts`:

```ts
export { Button, type ButtonVariants } from './Button'
export { IconButton } from './IconButton'
export { Input } from './Input'
export { Textarea } from './Textarea'
export { Label } from './Label'
export { FormField } from './FormField'
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
pnpm vitest run tests/unit/primitives/forms/inputs.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 9: Commit**

```bash
git add src/renderer/src/primitives/forms/ tests/unit/primitives/forms/
git commit -m "feat(primitives): add Input, Textarea, Label, FormField"
```

---

### Task 12: Select, Checkbox, Radio, Switch, Slider

**Files:**
- Create: `src/renderer/src/primitives/forms/Select.tsx`
- Create: `src/renderer/src/primitives/forms/Checkbox.tsx`
- Create: `src/renderer/src/primitives/forms/Radio.tsx`
- Create: `src/renderer/src/primitives/forms/Switch.tsx`
- Create: `src/renderer/src/primitives/forms/Slider.tsx`
- Modify: `src/renderer/src/primitives/forms/index.ts`
- Test: `tests/unit/primitives/forms/controls.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/primitives/forms/controls.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Select } from '../../../../src/renderer/src/primitives/forms/Select'
import { Checkbox } from '../../../../src/renderer/src/primitives/forms/Checkbox'
import { Radio } from '../../../../src/renderer/src/primitives/forms/Radio'
import { Switch } from '../../../../src/renderer/src/primitives/forms/Switch'
import { Slider } from '../../../../src/renderer/src/primitives/forms/Slider'

describe('Select', () => {
  it('renders a select element', () => {
    render(
      <Select>
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>
    )
    expect(screen.getByRole('combobox')).toBeDefined()
  })

  it('applies size md by default', () => {
    const { container } = render(<Select><option>A</option></Select>)
    expect(container.firstChild).toHaveClass('h-8')
  })
})

describe('Checkbox', () => {
  it('renders a checkbox input', () => {
    render(<Checkbox />)
    expect(screen.getByRole('checkbox')).toBeDefined()
  })

  it('handles onChange', () => {
    const onChange = vi.fn()
    render(<Checkbox onChange={onChange} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledOnce()
  })
})

describe('Radio', () => {
  it('renders a radio input', () => {
    render(<Radio name="test" value="a" />)
    expect(screen.getByRole('radio')).toBeDefined()
  })
})

describe('Switch', () => {
  it('renders a checkbox with switch role', () => {
    render(<Switch label="Toggle" />)
    expect(screen.getByRole('switch')).toBeDefined()
  })

  it('toggles on click', () => {
    const onChange = vi.fn()
    render(<Switch label="Toggle" onChange={onChange} />)
    fireEvent.click(screen.getByRole('switch'))
    expect(onChange).toHaveBeenCalledOnce()
  })
})

describe('Slider', () => {
  it('renders a range input', () => {
    render(<Slider min={0} max={100} />)
    expect(screen.getByRole('slider')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/unit/primitives/forms/controls.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement Select**

Create `src/renderer/src/primitives/forms/Select.tsx`:

```tsx
import { forwardRef, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const selectVariants = cva(
  'w-full border bg-bg-tertiary text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring disabled:pointer-events-none disabled:opacity-50 appearance-none cursor-pointer',
  {
    variants: {
      size: {
        xs: 'h-6 px-2 pr-6 text-xs rounded',
        sm: 'h-7 px-3 pr-7 text-xs rounded',
        md: 'h-8 px-3 pr-8 text-sm rounded-md',
        lg: 'h-9 px-4 pr-9 text-sm rounded-md',
        xl: 'h-10 px-4 pr-10 text-base rounded-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

interface SelectOwnProps extends VariantProps<typeof selectVariants> {
  children?: ReactNode
}

type SelectProps = SelectOwnProps & Omit<ComponentPropsWithRef<'select'>, keyof SelectOwnProps>

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { size, className, children, ...props },
  ref
) {
  return (
    <select
      ref={ref}
      className={cn(selectVariants({ size }), 'border-border-default', className)}
      {...props}
    >
      {children}
    </select>
  )
})
```

- [ ] **Step 4: Implement Checkbox**

Create `src/renderer/src/primitives/forms/Checkbox.tsx`:

```tsx
import { forwardRef, type ComponentPropsWithRef } from 'react'
import { cn } from '../utils/cn'

type CheckboxProps = Omit<ComponentPropsWithRef<'input'>, 'type'>

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        'h-4 w-4 rounded border border-border-default bg-bg-tertiary text-accent',
        'focus:ring-2 focus:ring-focus-ring focus:outline-none',
        'checked:bg-accent checked:border-accent',
        'cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  )
})
```

- [ ] **Step 5: Implement Radio**

Create `src/renderer/src/primitives/forms/Radio.tsx`:

```tsx
import { forwardRef, type ComponentPropsWithRef } from 'react'
import { cn } from '../utils/cn'

type RadioProps = Omit<ComponentPropsWithRef<'input'>, 'type'>

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type="radio"
      className={cn(
        'h-4 w-4 rounded-full border border-border-default bg-bg-tertiary text-accent',
        'focus:ring-2 focus:ring-focus-ring focus:outline-none',
        'checked:border-accent',
        'cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  )
})
```

- [ ] **Step 6: Implement Switch**

Create `src/renderer/src/primitives/forms/Switch.tsx`:

```tsx
import { forwardRef, type ComponentPropsWithRef } from 'react'
import { cn } from '../utils/cn'

interface SwitchOwnProps {
  label: string
}

type SwitchProps = SwitchOwnProps & Omit<ComponentPropsWithRef<'input'>, 'type' | keyof SwitchOwnProps>

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type="checkbox"
      role="switch"
      aria-label={label}
      className={cn(
        'relative h-5 w-9 appearance-none rounded-full border border-border-default bg-bg-tertiary',
        'before:absolute before:top-0.5 before:left-0.5 before:h-3.5 before:w-3.5 before:rounded-full before:bg-text-secondary before:transition-transform',
        'checked:bg-accent checked:border-accent checked:before:translate-x-4 checked:before:bg-white',
        'focus:ring-2 focus:ring-focus-ring focus:outline-none',
        'cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  )
})
```

- [ ] **Step 7: Implement Slider**

Create `src/renderer/src/primitives/forms/Slider.tsx`:

```tsx
import { forwardRef, type ComponentPropsWithRef } from 'react'
import { cn } from '../utils/cn'

type SliderProps = Omit<ComponentPropsWithRef<'input'>, 'type'>

export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  { className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type="range"
      className={cn(
        'w-full h-1.5 rounded-full bg-bg-tertiary appearance-none cursor-pointer',
        '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent',
        'focus:outline-none focus:ring-2 focus:ring-focus-ring',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  )
})
```

- [ ] **Step 8: Update barrel export**

Update `src/renderer/src/primitives/forms/index.ts`:

```ts
export { Button, type ButtonVariants } from './Button'
export { IconButton } from './IconButton'
export { Input } from './Input'
export { Textarea } from './Textarea'
export { Label } from './Label'
export { FormField } from './FormField'
export { Select } from './Select'
export { Checkbox } from './Checkbox'
export { Radio } from './Radio'
export { Switch } from './Switch'
export { Slider } from './Slider'
```

- [ ] **Step 9: Run tests to verify they pass**

```bash
pnpm vitest run tests/unit/primitives/forms/controls.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 10: Commit**

```bash
git add src/renderer/src/primitives/forms/ tests/unit/primitives/forms/
git commit -m "feat(primitives): add Select, Checkbox, Radio, Switch, Slider"
```

---

## Phase 5: Surface Primitives

### Task 13: Card and Panel

**Files:**
- Create: `src/renderer/src/primitives/surfaces/Card.tsx`
- Create: `src/renderer/src/primitives/surfaces/Panel.tsx`
- Modify: `src/renderer/src/primitives/surfaces/index.ts`
- Test: `tests/unit/primitives/surfaces/card-panel.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/primitives/surfaces/card-panel.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card } from '../../../../src/renderer/src/primitives/surfaces/Card'
import { Panel } from '../../../../src/renderer/src/primitives/surfaces/Panel'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>)
    expect(screen.getByText('Card content')).toBeDefined()
  })

  it('applies default styling', () => {
    const { container } = render(<Card>Content</Card>)
    expect(container.firstChild).toHaveClass('border')
    expect(container.firstChild).toHaveClass('rounded-lg')
  })

  it('applies padding variant', () => {
    const { container } = render(<Card padding="lg">Content</Card>)
    expect(container.firstChild).toHaveClass('p-4')
  })
})

describe('Panel', () => {
  it('renders children', () => {
    render(<Panel>Panel content</Panel>)
    expect(screen.getByText('Panel content')).toBeDefined()
  })

  it('applies background', () => {
    const { container } = render(<Panel>Content</Panel>)
    expect(container.firstChild).toHaveClass('bg-bg-secondary')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/unit/primitives/surfaces/card-panel.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement Card**

Create `src/renderer/src/primitives/surfaces/Card.tsx`:

```tsx
import { forwardRef, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const cardVariants = cva(
  'border border-border-default rounded-lg bg-bg-secondary',
  {
    variants: {
      padding: {
        none: '',
        sm: 'p-2',
        md: 'p-3',
        lg: 'p-4',
        xl: 'p-6',
      },
    },
    defaultVariants: {
      padding: 'md',
    },
  }
)

interface CardOwnProps extends VariantProps<typeof cardVariants> {
  children?: ReactNode
}

type CardProps = CardOwnProps & Omit<ComponentPropsWithRef<'div'>, keyof CardOwnProps>

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { padding, className, children, ...props },
  ref
) {
  return (
    <div ref={ref} className={cn(cardVariants({ padding }), className)} {...props}>
      {children}
    </div>
  )
})
```

- [ ] **Step 4: Implement Panel**

Create `src/renderer/src/primitives/surfaces/Panel.tsx`:

```tsx
import { forwardRef, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cn } from '../utils/cn'

interface PanelOwnProps {
  children?: ReactNode
}

type PanelProps = PanelOwnProps & Omit<ComponentPropsWithRef<'div'>, keyof PanelOwnProps>

export const Panel = forwardRef<HTMLDivElement, PanelProps>(function Panel(
  { className, children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn('bg-bg-secondary border-border-default', className)}
      {...props}
    >
      {children}
    </div>
  )
})
```

- [ ] **Step 5: Update barrel export**

Update `src/renderer/src/primitives/surfaces/index.ts`:

```ts
export { Card } from './Card'
export { Panel } from './Panel'
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
pnpm vitest run tests/unit/primitives/surfaces/card-panel.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/primitives/surfaces/ tests/unit/primitives/surfaces/
git commit -m "feat(primitives): add Card and Panel surface components"
```

---

### Task 14: Modal and Sheet (Native Dialog)

**Files:**
- Create: `src/renderer/src/primitives/surfaces/Modal.tsx`
- Create: `src/renderer/src/primitives/surfaces/Sheet.tsx`
- Modify: `src/renderer/src/primitives/surfaces/index.ts`
- Test: `tests/unit/primitives/surfaces/dialog.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/primitives/surfaces/dialog.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from '../../../../src/renderer/src/primitives/surfaces/Modal'
import { Sheet } from '../../../../src/renderer/src/primitives/surfaces/Sheet'

// jsdom doesn't support dialog element natively, mock showModal/close
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn()
  HTMLDialogElement.prototype.close = vi.fn()
})

describe('Modal', () => {
  it('renders a dialog element', () => {
    render(<Modal open onClose={() => {}}>Modal content</Modal>)
    expect(screen.getByRole('dialog')).toBeDefined()
  })

  it('renders children when open', () => {
    render(<Modal open onClose={() => {}}>Modal content</Modal>)
    expect(screen.getByText('Modal content')).toBeDefined()
  })

  it('calls onClose when clicking backdrop', () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose}>Content</Modal>)
    const dialog = screen.getByRole('dialog')
    // Simulate backdrop click (click on dialog element itself)
    fireEvent.click(dialog)
    expect(onClose).toHaveBeenCalled()
  })
})

describe('Sheet', () => {
  it('renders a dialog element', () => {
    render(<Sheet open onClose={() => {}}>Sheet content</Sheet>)
    expect(screen.getByRole('dialog')).toBeDefined()
  })

  it('applies side variant', () => {
    render(<Sheet open onClose={() => {}} side="right">Content</Sheet>)
    expect(screen.getByRole('dialog')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/unit/primitives/surfaces/dialog.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement Modal**

Create `src/renderer/src/primitives/surfaces/Modal.tsx`:

```tsx
import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '../utils/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  className?: string
  children: ReactNode
}

export function Modal({ open, onClose, className, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose()
      }}
      onClose={onClose}
      className={cn(
        'backdrop:bg-black/50',
        'bg-bg-secondary border border-border-default rounded-lg p-0',
        'max-w-lg w-full',
        'text-text-primary',
        className
      )}
    >
      {children}
    </dialog>
  )
}
```

- [ ] **Step 4: Implement Sheet**

Create `src/renderer/src/primitives/surfaces/Sheet.tsx`:

```tsx
import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '../utils/cn'

const sideStyles = {
  right: 'ml-auto mr-0 h-full rounded-l-lg animate-[slide-in-right_0.2s_ease-out]',
  left: 'mr-auto ml-0 h-full rounded-r-lg animate-[slide-in-left_0.2s_ease-out]',
  bottom: 'mt-auto mb-0 w-full rounded-t-lg animate-[slide-in-up_0.2s_ease-out]',
} as const

interface SheetProps {
  open: boolean
  onClose: () => void
  side?: keyof typeof sideStyles
  className?: string
  children: ReactNode
}

export function Sheet({ open, onClose, side = 'right', className, children }: SheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose()
      }}
      onClose={onClose}
      className={cn(
        'backdrop:bg-black/50',
        'bg-bg-secondary border border-border-default p-0 m-0',
        'text-text-primary',
        'max-h-full max-w-sm',
        sideStyles[side],
        className
      )}
    >
      {children}
    </dialog>
  )
}
```

- [ ] **Step 5: Update barrel export**

Update `src/renderer/src/primitives/surfaces/index.ts`:

```ts
export { Card } from './Card'
export { Panel } from './Panel'
export { Modal } from './Modal'
export { Sheet } from './Sheet'
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
pnpm vitest run tests/unit/primitives/surfaces/dialog.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/primitives/surfaces/ tests/unit/primitives/surfaces/
git commit -m "feat(primitives): add Modal and Sheet using native dialog element"
```

---

### Task 15: Popover, Tooltip, DropdownMenu, ContextMenu

**Files:**
- Create: `src/renderer/src/primitives/surfaces/Popover.tsx`
- Create: `src/renderer/src/primitives/surfaces/Tooltip.tsx`
- Create: `src/renderer/src/primitives/surfaces/DropdownMenu.tsx`
- Create: `src/renderer/src/primitives/surfaces/ContextMenu.tsx`
- Modify: `src/renderer/src/primitives/surfaces/index.ts`
- Test: `tests/unit/primitives/surfaces/popover.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/primitives/surfaces/popover.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Popover } from '../../../../src/renderer/src/primitives/surfaces/Popover'
import { Tooltip } from '../../../../src/renderer/src/primitives/surfaces/Tooltip'
import { DropdownMenu } from '../../../../src/renderer/src/primitives/surfaces/DropdownMenu'
import { ContextMenu } from '../../../../src/renderer/src/primitives/surfaces/ContextMenu'

describe('Popover', () => {
  it('renders trigger and content', () => {
    render(
      <Popover
        trigger={<button>Open</button>}
        content={<div>Popover content</div>}
      />
    )
    expect(screen.getByText('Open')).toBeDefined()
  })
})

describe('Tooltip', () => {
  it('renders children', () => {
    render(
      <Tooltip content="Help text">
        <button>Hover me</button>
      </Tooltip>
    )
    expect(screen.getByText('Hover me')).toBeDefined()
  })
})

describe('DropdownMenu', () => {
  it('renders trigger', () => {
    render(
      <DropdownMenu
        trigger={<button>Menu</button>}
        items={[{ label: 'Item 1', onSelect: () => {} }]}
      />
    )
    expect(screen.getByText('Menu')).toBeDefined()
  })
})

describe('ContextMenu', () => {
  it('renders children', () => {
    render(
      <ContextMenu items={[{ label: 'Copy', onSelect: () => {} }]}>
        <div>Right-click me</div>
      </ContextMenu>
    )
    expect(screen.getByText('Right-click me')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/unit/primitives/surfaces/popover.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement Popover**

Create `src/renderer/src/primitives/surfaces/Popover.tsx`:

```tsx
import { useId, type ReactNode } from 'react'
import { cn } from '../utils/cn'

interface PopoverProps {
  trigger: ReactNode
  content: ReactNode
  className?: string
}

export function Popover({ trigger, content, className }: PopoverProps) {
  const id = useId()
  const popoverId = `popover-${id}`

  return (
    <div className="relative inline-block">
      <div popoverTarget={popoverId}>{trigger}</div>
      <div
        id={popoverId}
        popover="auto"
        className={cn(
          'bg-bg-elevated border border-border-default rounded-lg p-2',
          'text-text-primary shadow-none',
          'm-0',
          className
        )}
      >
        {content}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Implement Tooltip**

Create `src/renderer/src/primitives/surfaces/Tooltip.tsx`:

```tsx
import { useState, type ReactNode } from 'react'
import { cn } from '../utils/cn'

interface TooltipProps {
  content: string
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  children: ReactNode
}

const sidePositions = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
  left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
  right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
} as const

export function Tooltip({ content, side = 'top', className, children }: TooltipProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-50 pointer-events-none',
            'px-2 py-1 text-xs rounded',
            'bg-bg-elevated border border-border-default text-text-primary',
            'whitespace-nowrap',
            sidePositions[side],
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Implement DropdownMenu**

Create `src/renderer/src/primitives/surfaces/DropdownMenu.tsx`:

```tsx
import { useId, useRef, useEffect, type ReactNode, type KeyboardEvent } from 'react'
import { cn } from '../utils/cn'

interface MenuItem {
  label: string
  onSelect: () => void
  disabled?: boolean
}

interface DropdownMenuProps {
  trigger: ReactNode
  items: MenuItem[]
  className?: string
}

export function DropdownMenu({ trigger, items, className }: DropdownMenuProps) {
  const id = useId()
  const popoverId = `dropdown-${id}`
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const menu = menuRef.current
    if (!menu) return

    const observer = new MutationObserver(() => {
      if (menu.matches(':popover-open')) {
        const first = menu.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')
        first?.focus()
      }
    })
    observer.observe(menu, { attributes: true })
    return () => observer.disconnect()
  }, [])

  const handleKeyDown = (e: KeyboardEvent, index: number) => {
    const menuItems = menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')
    if (!menuItems) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = (index + 1) % menuItems.length
      menuItems[next]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = (index - 1 + menuItems.length) % menuItems.length
      menuItems[prev]?.focus()
    } else if (e.key === 'Escape') {
      menuRef.current?.hidePopover()
    }
  }

  return (
    <div className="relative inline-block">
      <div popoverTarget={popoverId}>{trigger}</div>
      <div
        id={popoverId}
        ref={menuRef}
        popover="auto"
        role="menu"
        className={cn(
          'bg-bg-elevated border border-border-default rounded-lg py-1',
          'text-text-primary shadow-none m-0 min-w-[160px]',
          className
        )}
      >
        {items.map((item, i) => (
          <button
            key={item.label}
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              item.onSelect()
              menuRef.current?.hidePopover()
            }}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={cn(
              'w-full text-left px-3 py-1.5 text-sm',
              'hover:bg-hover focus:bg-hover focus:outline-none',
              'disabled:opacity-50 disabled:pointer-events-none'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Implement ContextMenu**

Create `src/renderer/src/primitives/surfaces/ContextMenu.tsx`:

```tsx
import { useRef, useState, type ReactNode, type MouseEvent } from 'react'
import { cn } from '../utils/cn'

interface ContextMenuItem {
  label: string
  onSelect: () => void
  disabled?: boolean
}

interface ContextMenuProps {
  items: ContextMenuItem[]
  className?: string
  children: ReactNode
}

export function ContextMenu({ items, className, children }: ContextMenuProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault()
    setPosition({ x: e.clientX, y: e.clientY })
  }

  const close = () => setPosition(null)

  return (
    <>
      <div onContextMenu={handleContextMenu}>{children}</div>
      {position && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} onContextMenu={(e) => { e.preventDefault(); close() }} />
          <div
            ref={menuRef}
            role="menu"
            style={{ top: position.y, left: position.x }}
            className={cn(
              'fixed z-50',
              'bg-bg-elevated border border-border-default rounded-lg py-1',
              'text-text-primary shadow-none min-w-[160px]',
              className
            )}
          >
            {items.map((item) => (
              <button
                key={item.label}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  item.onSelect()
                  close()
                }}
                className={cn(
                  'w-full text-left px-3 py-1.5 text-sm',
                  'hover:bg-hover focus:bg-hover focus:outline-none',
                  'disabled:opacity-50 disabled:pointer-events-none'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  )
}
```

- [ ] **Step 7: Update barrel export**

Update `src/renderer/src/primitives/surfaces/index.ts`:

```ts
export { Card } from './Card'
export { Panel } from './Panel'
export { Modal } from './Modal'
export { Sheet } from './Sheet'
export { Popover } from './Popover'
export { Tooltip } from './Tooltip'
export { DropdownMenu } from './DropdownMenu'
export { ContextMenu } from './ContextMenu'
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
pnpm vitest run tests/unit/primitives/surfaces/popover.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 9: Commit**

```bash
git add src/renderer/src/primitives/surfaces/ tests/unit/primitives/surfaces/
git commit -m "feat(primitives): add Popover, Tooltip, DropdownMenu, ContextMenu"
```

---

## Phase 6: Data Display Primitives

### Task 16: Badge, Tag, Avatar, Skeleton, EmptyState, KeyValue

**Files:**
- Create: `src/renderer/src/primitives/data-display/Badge.tsx`
- Create: `src/renderer/src/primitives/data-display/Tag.tsx`
- Create: `src/renderer/src/primitives/data-display/Avatar.tsx`
- Create: `src/renderer/src/primitives/data-display/Skeleton.tsx`
- Create: `src/renderer/src/primitives/data-display/EmptyState.tsx`
- Create: `src/renderer/src/primitives/data-display/KeyValue.tsx`
- Modify: `src/renderer/src/primitives/data-display/index.ts`
- Test: `tests/unit/primitives/data-display/data-display.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/primitives/data-display/data-display.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Badge } from '../../../../src/renderer/src/primitives/data-display/Badge'
import { Tag } from '../../../../src/renderer/src/primitives/data-display/Tag'
import { Avatar } from '../../../../src/renderer/src/primitives/data-display/Avatar'
import { Skeleton } from '../../../../src/renderer/src/primitives/data-display/Skeleton'
import { EmptyState } from '../../../../src/renderer/src/primitives/data-display/EmptyState'
import { KeyValue } from '../../../../src/renderer/src/primitives/data-display/KeyValue'

describe('Badge', () => {
  it('renders with text', () => {
    render(<Badge>New</Badge>)
    expect(screen.getByText('New')).toBeDefined()
  })

  it('applies variant', () => {
    const { container } = render(<Badge variant="success">Ok</Badge>)
    expect(container.firstChild).toHaveClass('bg-success/10')
  })
})

describe('Tag', () => {
  it('renders with text', () => {
    render(<Tag>React</Tag>)
    expect(screen.getByText('React')).toBeDefined()
  })

  it('shows dismiss button when onDismiss provided', () => {
    const onDismiss = vi.fn()
    render(<Tag onDismiss={onDismiss}>React</Tag>)
    fireEvent.click(screen.getByLabelText('Remove'))
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})

describe('Avatar', () => {
  it('renders initials when no src', () => {
    render(<Avatar name="John Doe" />)
    expect(screen.getByText('JD')).toBeDefined()
  })

  it('applies size', () => {
    const { container } = render(<Avatar name="JD" size="lg" />)
    expect(container.firstChild).toHaveClass('h-9')
  })
})

describe('Skeleton', () => {
  it('renders with animate-pulse', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveClass('animate-pulse')
  })
})

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No data" description="Nothing here" />)
    expect(screen.getByText('No data')).toBeDefined()
    expect(screen.getByText('Nothing here')).toBeDefined()
  })
})

describe('KeyValue', () => {
  it('renders label and value', () => {
    render(<KeyValue label="Host" value="localhost" />)
    expect(screen.getByText('Host')).toBeDefined()
    expect(screen.getByText('localhost')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/unit/primitives/data-display/data-display.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement Badge**

Create `src/renderer/src/primitives/data-display/Badge.tsx`:

```tsx
import { type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const badgeVariants = cva(
  'inline-flex items-center font-medium rounded-full',
  {
    variants: {
      variant: {
        default: 'bg-bg-elevated text-text-secondary',
        accent: 'bg-accent/10 text-accent',
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning',
        error: 'bg-error/10 text-error',
        info: 'bg-info/10 text-info',
      },
      size: {
        sm: 'text-xs px-1.5 py-0.5',
        md: 'text-xs px-2 py-0.5',
        lg: 'text-sm px-2.5 py-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  className?: string
  children: ReactNode
}

export function Badge({ variant, size, className, children }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)}>
      {children}
    </span>
  )
}
```

- [ ] **Step 4: Implement Tag**

Create `src/renderer/src/primitives/data-display/Tag.tsx`:

```tsx
import { type ReactNode } from 'react'
import { cn } from '../utils/cn'

interface TagProps {
  onDismiss?: () => void
  className?: string
  children: ReactNode
}

export function Tag({ onDismiss, className, children }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded',
        'bg-bg-elevated text-text-secondary border border-border-default',
        className
      )}
    >
      {children}
      {onDismiss && (
        <button
          aria-label="Remove"
          onClick={onDismiss}
          className="hover:text-text-primary ml-0.5"
        >
          ×
        </button>
      )}
    </span>
  )
}
```

- [ ] **Step 5: Implement Avatar**

Create `src/renderer/src/primitives/data-display/Avatar.tsx`:

```tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const avatarVariants = cva(
  'inline-flex items-center justify-center rounded-full bg-accent/10 text-accent font-medium',
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-7 w-7 text-xs',
        md: 'h-8 w-8 text-sm',
        lg: 'h-9 w-9 text-sm',
        xl: 'h-10 w-10 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

interface AvatarProps extends VariantProps<typeof avatarVariants> {
  name: string
  src?: string
  className?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function Avatar({ name, src, size, className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(avatarVariants({ size }), 'object-cover', className)}
      />
    )
  }

  return (
    <span className={cn(avatarVariants({ size }), className)}>
      {getInitials(name)}
    </span>
  )
}
```

- [ ] **Step 6: Implement Skeleton**

Create `src/renderer/src/primitives/data-display/Skeleton.tsx`:

```tsx
import { cn } from '../utils/cn'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse bg-bg-elevated rounded-md h-4 w-full', className)}
    />
  )
}
```

- [ ] **Step 7: Implement EmptyState**

Create `src/renderer/src/primitives/data-display/EmptyState.tsx`:

```tsx
import { type ReactNode } from 'react'
import { cn } from '../utils/cn'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      {icon && <div className="mb-3 text-text-muted">{icon}</div>}
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
```

- [ ] **Step 8: Implement KeyValue**

Create `src/renderer/src/primitives/data-display/KeyValue.tsx`:

```tsx
import { type ReactNode } from 'react'
import { cn } from '../utils/cn'

interface KeyValueProps {
  label: string
  value: ReactNode
  className?: string
}

export function KeyValue({ label, value, className }: KeyValueProps) {
  return (
    <div className={cn('flex items-baseline justify-between gap-2', className)}>
      <dt className="text-xs text-text-secondary shrink-0">{label}</dt>
      <dd className="text-sm text-text-primary text-right truncate">{value}</dd>
    </div>
  )
}
```

- [ ] **Step 9: Update barrel export**

Update `src/renderer/src/primitives/data-display/index.ts`:

```ts
export { Badge } from './Badge'
export { Tag } from './Tag'
export { Avatar } from './Avatar'
export { Skeleton } from './Skeleton'
export { EmptyState } from './EmptyState'
export { KeyValue } from './KeyValue'
```

- [ ] **Step 10: Run tests to verify they pass**

```bash
pnpm vitest run tests/unit/primitives/data-display/
```

Expected: All tests PASS.

- [ ] **Step 11: Commit**

```bash
git add src/renderer/src/primitives/data-display/ tests/unit/primitives/data-display/
git commit -m "feat(primitives): add Badge, Tag, Avatar, Skeleton, EmptyState, KeyValue"
```

---

### Task 17: Table and List

**Files:**
- Create: `src/renderer/src/primitives/data-display/Table.tsx`
- Create: `src/renderer/src/primitives/data-display/List.tsx`
- Modify: `src/renderer/src/primitives/data-display/index.ts`
- Test: `tests/unit/primitives/data-display/table-list.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/primitives/data-display/table-list.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Table } from '../../../../src/renderer/src/primitives/data-display/Table'
import { List } from '../../../../src/renderer/src/primitives/data-display/List'

describe('Table', () => {
  it('renders a table with headers and rows', () => {
    render(
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.Head>Name</Table.Head>
            <Table.Head>Age</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Alice</Table.Cell>
            <Table.Cell>30</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    )
    expect(screen.getByText('Name')).toBeDefined()
    expect(screen.getByText('Alice')).toBeDefined()
  })
})

describe('List', () => {
  it('renders list items', () => {
    render(
      <List>
        <List.Item>Item 1</List.Item>
        <List.Item>Item 2</List.Item>
      </List>
    )
    expect(screen.getByText('Item 1')).toBeDefined()
    expect(screen.getByText('Item 2')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/unit/primitives/data-display/table-list.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement Table**

Create `src/renderer/src/primitives/data-display/Table.tsx`:

```tsx
import { forwardRef, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cn } from '../utils/cn'

type TableRootProps = ComponentPropsWithRef<'table'> & { children: ReactNode }

const TableRoot = forwardRef<HTMLTableElement, TableRootProps>(function TableRoot(
  { className, children, ...props }, ref
) {
  return (
    <table ref={ref} className={cn('w-full text-sm', className)} {...props}>
      {children}
    </table>
  )
})

type SectionProps = ComponentPropsWithRef<'thead'> & { children: ReactNode }

const Header = forwardRef<HTMLTableSectionElement, SectionProps>(function Header(
  { className, children, ...props }, ref
) {
  return (
    <thead ref={ref} className={cn('border-b border-border-default', className)} {...props}>
      {children}
    </thead>
  )
})

type BodyProps = ComponentPropsWithRef<'tbody'> & { children: ReactNode }

const Body = forwardRef<HTMLTableSectionElement, BodyProps>(function Body(
  { className, children, ...props }, ref
) {
  return (
    <tbody ref={ref} className={cn('[&>tr:not(:last-child)]:border-b [&>tr:not(:last-child)]:border-border-subtle', className)} {...props}>
      {children}
    </tbody>
  )
})

type RowProps = ComponentPropsWithRef<'tr'> & { children: ReactNode }

const Row = forwardRef<HTMLTableRowElement, RowProps>(function Row(
  { className, children, ...props }, ref
) {
  return (
    <tr ref={ref} className={cn('hover:bg-hover transition-colors', className)} {...props}>
      {children}
    </tr>
  )
})

type HeadProps = ComponentPropsWithRef<'th'> & { children?: ReactNode }

const Head = forwardRef<HTMLTableCellElement, HeadProps>(function Head(
  { className, children, ...props }, ref
) {
  return (
    <th ref={ref} className={cn('text-left text-xs font-medium text-text-secondary px-3 py-2', className)} {...props}>
      {children}
    </th>
  )
})

type CellProps = ComponentPropsWithRef<'td'> & { children?: ReactNode }

const Cell = forwardRef<HTMLTableCellElement, CellProps>(function Cell(
  { className, children, ...props }, ref
) {
  return (
    <td ref={ref} className={cn('px-3 py-2 text-text-primary', className)} {...props}>
      {children}
    </td>
  )
})

export const Table = Object.assign(TableRoot, { Header, Body, Row, Head, Cell })
```

- [ ] **Step 4: Implement List**

Create `src/renderer/src/primitives/data-display/List.tsx`:

```tsx
import { forwardRef, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cn } from '../utils/cn'

type ListRootProps = ComponentPropsWithRef<'ul'> & { children: ReactNode }

const ListRoot = forwardRef<HTMLUListElement, ListRootProps>(function ListRoot(
  { className, children, ...props }, ref
) {
  return (
    <ul ref={ref} className={cn('flex flex-col', className)} {...props}>
      {children}
    </ul>
  )
})

type ItemProps = ComponentPropsWithRef<'li'> & { children: ReactNode }

const Item = forwardRef<HTMLLIElement, ItemProps>(function Item(
  { className, children, ...props }, ref
) {
  return (
    <li ref={ref} className={cn('px-3 py-2 text-sm text-text-primary', className)} {...props}>
      {children}
    </li>
  )
})

export const List = Object.assign(ListRoot, { Item })
```

- [ ] **Step 5: Update barrel export**

Update `src/renderer/src/primitives/data-display/index.ts` — add:

```ts
export { Table } from './Table'
export { List } from './List'
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
pnpm vitest run tests/unit/primitives/data-display/table-list.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/primitives/data-display/ tests/unit/primitives/data-display/
git commit -m "feat(primitives): add Table and List compound components"
```

---

## Phase 7: Feedback Primitives

### Task 18: Toast, Alert, Progress, Spinner, Banner

**Files:**
- Create: `src/renderer/src/primitives/feedback/Toast.tsx`
- Create: `src/renderer/src/primitives/feedback/Alert.tsx`
- Create: `src/renderer/src/primitives/feedback/Progress.tsx`
- Create: `src/renderer/src/primitives/feedback/Spinner.tsx`
- Create: `src/renderer/src/primitives/feedback/Banner.tsx`
- Modify: `src/renderer/src/primitives/feedback/index.ts`
- Test: `tests/unit/primitives/feedback/feedback.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/primitives/feedback/feedback.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Toast } from '../../../../src/renderer/src/primitives/feedback/Toast'
import { Alert } from '../../../../src/renderer/src/primitives/feedback/Alert'
import { Progress } from '../../../../src/renderer/src/primitives/feedback/Progress'
import { Spinner } from '../../../../src/renderer/src/primitives/feedback/Spinner'
import { Banner } from '../../../../src/renderer/src/primitives/feedback/Banner'

describe('Toast', () => {
  it('renders message', () => {
    render(<Toast message="Saved!" onDismiss={() => {}} />)
    expect(screen.getByText('Saved!')).toBeDefined()
  })

  it('applies variant', () => {
    const { container } = render(<Toast message="Error" variant="error" onDismiss={() => {}} />)
    expect(container.firstChild).toHaveClass('border-error')
  })

  it('calls onDismiss when close clicked', () => {
    const onDismiss = vi.fn()
    render(<Toast message="Saved!" onDismiss={onDismiss} />)
    fireEvent.click(screen.getByLabelText('Dismiss'))
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})

describe('Alert', () => {
  it('renders title and children', () => {
    render(<Alert title="Warning">Details here</Alert>)
    expect(screen.getByText('Warning')).toBeDefined()
    expect(screen.getByText('Details here')).toBeDefined()
  })
})

describe('Progress', () => {
  it('renders with value', () => {
    const { container } = render(<Progress value={60} />)
    expect(container.querySelector('[role="progressbar"]')).toBeDefined()
  })
})

describe('Spinner', () => {
  it('renders with accessible label', () => {
    render(<Spinner label="Loading" />)
    expect(screen.getByLabelText('Loading')).toBeDefined()
  })
})

describe('Banner', () => {
  it('renders message', () => {
    render(<Banner>Maintenance scheduled</Banner>)
    expect(screen.getByText('Maintenance scheduled')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/unit/primitives/feedback/feedback.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement Toast**

Create `src/renderer/src/primitives/feedback/Toast.tsx`:

```tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const toastVariants = cva(
  'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm',
  {
    variants: {
      variant: {
        default: 'bg-bg-elevated border-border-default text-text-primary',
        success: 'bg-success/5 border-success text-success',
        error: 'bg-error/5 border-error text-error',
        warning: 'bg-warning/5 border-warning text-warning',
        info: 'bg-info/5 border-info text-info',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

interface ToastProps extends VariantProps<typeof toastVariants> {
  message: string
  onDismiss: () => void
  className?: string
}

export function Toast({ message, variant, onDismiss, className }: ToastProps) {
  return (
    <div className={cn(toastVariants({ variant }), className)}>
      <span className="flex-1">{message}</span>
      <button
        aria-label="Dismiss"
        onClick={onDismiss}
        className="shrink-0 hover:opacity-70"
      >
        ×
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Implement Alert**

Create `src/renderer/src/primitives/feedback/Alert.tsx`:

```tsx
import { type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const alertVariants = cva(
  'rounded-lg border px-4 py-3',
  {
    variants: {
      variant: {
        default: 'bg-bg-elevated border-border-default',
        success: 'bg-success/5 border-success/20',
        error: 'bg-error/5 border-error/20',
        warning: 'bg-warning/5 border-warning/20',
        info: 'bg-info/5 border-info/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

interface AlertProps extends VariantProps<typeof alertVariants> {
  title?: string
  className?: string
  children?: ReactNode
}

export function Alert({ title, variant, className, children }: AlertProps) {
  return (
    <div role="alert" className={cn(alertVariants({ variant }), className)}>
      {title && <p className="text-sm font-medium text-text-primary">{title}</p>}
      {children && <div className="text-sm text-text-secondary mt-1">{children}</div>}
    </div>
  )
}
```

- [ ] **Step 5: Implement Progress**

Create `src/renderer/src/primitives/feedback/Progress.tsx`:

```tsx
import { cn } from '../utils/cn'

interface ProgressProps {
  value: number
  max?: number
  className?: string
}

export function Progress({ value, max = 100, className }: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn('h-1.5 w-full bg-bg-elevated rounded-full overflow-hidden', className)}
    >
      <div
        className="h-full bg-accent rounded-full transition-[width] duration-200"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
```

- [ ] **Step 6: Implement Spinner**

Create `src/renderer/src/primitives/feedback/Spinner.tsx`:

```tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const spinnerVariants = cva(
  'animate-spin rounded-full border-2 border-current border-t-transparent',
  {
    variants: {
      size: {
        xs: 'h-3 w-3',
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
        xl: 'h-8 w-8',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

interface SpinnerProps extends VariantProps<typeof spinnerVariants> {
  label?: string
  className?: string
}

export function Spinner({ size, label = 'Loading', className }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn(spinnerVariants({ size }), 'text-accent', className)}
    >
      <span className="sr-only">{label}</span>
    </div>
  )
}
```

- [ ] **Step 7: Implement Banner**

Create `src/renderer/src/primitives/feedback/Banner.tsx`:

```tsx
import { type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const bannerVariants = cva(
  'w-full px-4 py-2 text-sm',
  {
    variants: {
      variant: {
        default: 'bg-bg-elevated text-text-primary',
        info: 'bg-info/10 text-info',
        warning: 'bg-warning/10 text-warning',
        error: 'bg-error/10 text-error',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

interface BannerProps extends VariantProps<typeof bannerVariants> {
  className?: string
  children: ReactNode
}

export function Banner({ variant, className, children }: BannerProps) {
  return (
    <div className={cn(bannerVariants({ variant }), className)}>
      {children}
    </div>
  )
}
```

- [ ] **Step 8: Update barrel export**

Update `src/renderer/src/primitives/feedback/index.ts`:

```ts
export { Toast } from './Toast'
export { Alert } from './Alert'
export { Progress } from './Progress'
export { Spinner } from './Spinner'
export { Banner } from './Banner'
```

- [ ] **Step 9: Run tests to verify they pass**

```bash
pnpm vitest run tests/unit/primitives/feedback/
```

Expected: All tests PASS.

- [ ] **Step 10: Commit**

```bash
git add src/renderer/src/primitives/feedback/ tests/unit/primitives/feedback/
git commit -m "feat(primitives): add Toast, Alert, Progress, Spinner, Banner"
```

---

## Phase 8: Navigation Primitives

### Task 19: Tabs, Breadcrumb, Link, Pagination

**Files:**
- Create: `src/renderer/src/primitives/navigation/Tabs.tsx`
- Create: `src/renderer/src/primitives/navigation/Breadcrumb.tsx`
- Create: `src/renderer/src/primitives/navigation/Link.tsx`
- Create: `src/renderer/src/primitives/navigation/Pagination.tsx`
- Modify: `src/renderer/src/primitives/navigation/index.ts`
- Test: `tests/unit/primitives/navigation/navigation.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/primitives/navigation/navigation.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Tabs } from '../../../../src/renderer/src/primitives/navigation/Tabs'
import { Breadcrumb } from '../../../../src/renderer/src/primitives/navigation/Breadcrumb'
import { Link } from '../../../../src/renderer/src/primitives/navigation/Link'
import { Pagination } from '../../../../src/renderer/src/primitives/navigation/Pagination'

describe('Tabs', () => {
  it('renders tab labels', () => {
    render(
      <Tabs
        tabs={[
          { id: 'a', label: 'Tab A' },
          { id: 'b', label: 'Tab B' },
        ]}
        activeTab="a"
        onTabChange={() => {}}
      />
    )
    expect(screen.getByText('Tab A')).toBeDefined()
    expect(screen.getByText('Tab B')).toBeDefined()
  })

  it('calls onTabChange when clicked', () => {
    const onTabChange = vi.fn()
    render(
      <Tabs
        tabs={[{ id: 'a', label: 'Tab A' }, { id: 'b', label: 'Tab B' }]}
        activeTab="a"
        onTabChange={onTabChange}
      />
    )
    fireEvent.click(screen.getByText('Tab B'))
    expect(onTabChange).toHaveBeenCalledWith('b')
  })
})

describe('Breadcrumb', () => {
  it('renders items with separators', () => {
    render(
      <Breadcrumb
        items={[
          { label: 'Home' },
          { label: 'Settings' },
          { label: 'Profile' },
        ]}
      />
    )
    expect(screen.getByText('Home')).toBeDefined()
    expect(screen.getByText('Settings')).toBeDefined()
    expect(screen.getByText('Profile')).toBeDefined()
  })
})

describe('Link', () => {
  it('renders an anchor element', () => {
    render(<Link href="#">Click here</Link>)
    expect(screen.getByText('Click here').tagName).toBe('A')
  })
})

describe('Pagination', () => {
  it('renders page info', () => {
    render(<Pagination page={2} totalPages={10} onPageChange={() => {}} />)
    expect(screen.getByText('2 / 10')).toBeDefined()
  })

  it('calls onPageChange for next', () => {
    const onPageChange = vi.fn()
    render(<Pagination page={2} totalPages={10} onPageChange={onPageChange} />)
    fireEvent.click(screen.getByLabelText('Next page'))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/unit/primitives/navigation/navigation.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement Tabs**

Create `src/renderer/src/primitives/navigation/Tabs.tsx`:

```tsx
import { cn } from '../utils/cn'

interface Tab {
  id: string
  label: string
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <div role="tablist" className={cn('flex gap-0 border-b border-border-default', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={tab.id === activeTab}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'px-3 py-2 text-sm font-medium transition-colors relative',
            tab.id === activeTab
              ? 'text-text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-accent'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Implement Breadcrumb**

Create `src/renderer/src/primitives/navigation/Breadcrumb.tsx`:

```tsx
import { cn } from '../utils/cn'

interface BreadcrumbItem {
  label: string
  onClick?: () => void
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1 text-sm', className)}>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-text-muted">/</span>}
          {item.onClick ? (
            <button onClick={item.onClick} className="text-text-secondary hover:text-text-primary">
              {item.label}
            </button>
          ) : (
            <span className={i === items.length - 1 ? 'text-text-primary' : 'text-text-secondary'}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}
```

- [ ] **Step 5: Implement Link**

Create `src/renderer/src/primitives/navigation/Link.tsx`:

```tsx
import { forwardRef, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cn } from '../utils/cn'

interface LinkOwnProps {
  children?: ReactNode
}

type LinkProps = LinkOwnProps & Omit<ComponentPropsWithRef<'a'>, keyof LinkOwnProps>

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { className, children, ...props },
  ref
) {
  return (
    <a
      ref={ref}
      className={cn('text-accent hover:text-accent-hover underline-offset-2 hover:underline text-sm', className)}
      {...props}
    >
      {children}
    </a>
  )
})
```

- [ ] **Step 6: Implement Pagination**

Create `src/renderer/src/primitives/navigation/Pagination.tsx`:

```tsx
import { cn } from '../utils/cn'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  return (
    <nav aria-label="Pagination" className={cn('flex items-center gap-2 text-sm', className)}>
      <button
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="px-2 py-1 rounded text-text-secondary hover:text-text-primary hover:bg-hover disabled:opacity-50 disabled:pointer-events-none"
      >
        ‹
      </button>
      <span className="text-text-primary">{page} / {totalPages}</span>
      <button
        aria-label="Next page"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="px-2 py-1 rounded text-text-secondary hover:text-text-primary hover:bg-hover disabled:opacity-50 disabled:pointer-events-none"
      >
        ›
      </button>
    </nav>
  )
}
```

- [ ] **Step 7: Update barrel export**

Update `src/renderer/src/primitives/navigation/index.ts`:

```ts
export { Tabs } from './Tabs'
export { Breadcrumb } from './Breadcrumb'
export { Link } from './Link'
export { Pagination } from './Pagination'
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
pnpm vitest run tests/unit/primitives/navigation/
```

Expected: All tests PASS.

- [ ] **Step 9: Commit**

```bash
git add src/renderer/src/primitives/navigation/ tests/unit/primitives/navigation/
git commit -m "feat(primitives): add Tabs, Breadcrumb, Link, Pagination"
```

---

## Phase 9: Utility Primitives

### Task 20: VisuallyHidden, Portal, ResizeHandle

**Files:**
- Create: `src/renderer/src/primitives/utilities/VisuallyHidden.tsx`
- Create: `src/renderer/src/primitives/utilities/Portal.tsx`
- Create: `src/renderer/src/primitives/utilities/ResizeHandle.tsx`
- Modify: `src/renderer/src/primitives/utilities/index.ts`
- Test: `tests/unit/primitives/utilities/utilities.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/primitives/utilities/utilities.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VisuallyHidden } from '../../../../src/renderer/src/primitives/utilities/VisuallyHidden'
import { Portal } from '../../../../src/renderer/src/primitives/utilities/Portal'
import { ResizeHandle } from '../../../../src/renderer/src/primitives/utilities/ResizeHandle'

describe('VisuallyHidden', () => {
  it('renders children but hides them visually', () => {
    render(<VisuallyHidden>Hidden text</VisuallyHidden>)
    const el = screen.getByText('Hidden text')
    expect(el).toBeDefined()
    expect(el).toHaveClass('sr-only')
  })
})

describe('Portal', () => {
  it('renders children into document body', () => {
    render(<Portal>Portal content</Portal>)
    expect(screen.getByText('Portal content')).toBeDefined()
  })
})

describe('ResizeHandle', () => {
  it('renders with correct cursor for horizontal', () => {
    const { container } = render(
      <ResizeHandle direction="horizontal" onResize={() => {}} />
    )
    expect(container.firstChild).toHaveClass('cursor-col-resize')
  })

  it('renders with correct cursor for vertical', () => {
    const { container } = render(
      <ResizeHandle direction="vertical" onResize={() => {}} />
    )
    expect(container.firstChild).toHaveClass('cursor-row-resize')
  })

  it('calls onResize during pointer drag', () => {
    const onResize = vi.fn()
    const { container } = render(
      <ResizeHandle direction="horizontal" onResize={onResize} />
    )
    const handle = container.firstChild as HTMLElement
    fireEvent.pointerDown(handle, { clientX: 100, clientY: 100 })
    fireEvent.pointerMove(document, { clientX: 110, clientY: 100 })
    fireEvent.pointerUp(document)
    expect(onResize).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/unit/primitives/utilities/utilities.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement VisuallyHidden**

Create `src/renderer/src/primitives/utilities/VisuallyHidden.tsx`:

```tsx
import { type ReactNode } from 'react'

interface VisuallyHiddenProps {
  children: ReactNode
}

export function VisuallyHidden({ children }: VisuallyHiddenProps) {
  return <span className="sr-only">{children}</span>
}
```

- [ ] **Step 4: Implement Portal**

Create `src/renderer/src/primitives/utilities/Portal.tsx`:

```tsx
import { createPortal } from 'react-dom'
import { type ReactNode } from 'react'

interface PortalProps {
  children: ReactNode
  container?: Element
}

export function Portal({ children, container }: PortalProps) {
  return createPortal(children, container ?? document.body)
}
```

- [ ] **Step 5: Implement ResizeHandle**

Create `src/renderer/src/primitives/utilities/ResizeHandle.tsx`:

```tsx
import { useCallback, useRef } from 'react'
import { cn } from '../utils/cn'

interface ResizeHandleProps {
  direction: 'horizontal' | 'vertical'
  onResize: (delta: number) => void
  onResizeEnd?: (finalPosition: number) => void
  onDoubleClick?: () => void
  className?: string
}

export function ResizeHandle({
  direction,
  onResize,
  onResizeEnd,
  onDoubleClick,
  className,
}: ResizeHandleProps) {
  const startPos = useRef(0)
  const currentPos = useRef(0)

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      const pos = direction === 'horizontal' ? e.clientX : e.clientY
      startPos.current = pos
      currentPos.current = pos

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const newPos = direction === 'horizontal' ? moveEvent.clientX : moveEvent.clientY
        const delta = newPos - currentPos.current
        currentPos.current = newPos
        onResize(delta)
      }

      const handlePointerUp = (upEvent: PointerEvent) => {
        document.removeEventListener('pointermove', handlePointerMove)
        document.removeEventListener('pointerup', handlePointerUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        const finalPos = direction === 'horizontal' ? upEvent.clientX : upEvent.clientY
        onResizeEnd?.(finalPos)
      }

      document.addEventListener('pointermove', handlePointerMove)
      document.addEventListener('pointerup', handlePointerUp)
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize'
      document.body.style.userSelect = 'none'
    },
    [direction, onResize, onResizeEnd]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const step = e.shiftKey ? 50 : 10
      if (direction === 'horizontal') {
        if (e.key === 'ArrowLeft') { e.preventDefault(); onResize(-step) }
        if (e.key === 'ArrowRight') { e.preventDefault(); onResize(step) }
      } else {
        if (e.key === 'ArrowUp') { e.preventDefault(); onResize(-step) }
        if (e.key === 'ArrowDown') { e.preventDefault(); onResize(step) }
      }
    },
    [direction, onResize]
  )

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-orientation={direction}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      onDoubleClick={onDoubleClick}
      className={cn(
        'shrink-0 bg-transparent hover:bg-accent/50 transition-colors',
        direction === 'horizontal'
          ? 'w-1 cursor-col-resize hover:w-0.5'
          : 'h-1 cursor-row-resize hover:h-0.5',
        className
      )}
    />
  )
}
```

- [ ] **Step 6: Update barrel export**

Update `src/renderer/src/primitives/utilities/index.ts`:

```ts
export { VisuallyHidden } from './VisuallyHidden'
export { Portal } from './Portal'
export { ResizeHandle } from './ResizeHandle'
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
pnpm vitest run tests/unit/primitives/utilities/
```

Expected: All tests PASS.

- [ ] **Step 8: Commit**

```bash
git add src/renderer/src/primitives/utilities/ tests/unit/primitives/utilities/
git commit -m "feat(primitives): add VisuallyHidden, Portal, ResizeHandle"
```

---

## Phase 10: Resizable App Layout

### Task 21: Integrate ResizeHandle into App Layout

**Files:**
- Modify: `src/renderer/src/App.tsx`
- Modify: `src/renderer/src/stores/ui.ts`

- [ ] **Step 1: Add layout sizes to ui store**

Modify `src/renderer/src/stores/ui.ts` — add sidebar width and split ratio state with localStorage persistence:

```ts
import { create } from 'zustand'

export type ActivityPanel = 'explorer' | 'query' | 'charts' | 'extensions' | 'settings'

const SIDEBAR_WIDTH_KEY = 'dbstudio-sidebar-width'
const SPLIT_RATIO_KEY = 'dbstudio-split-ratio'

function loadNumber(key: string, fallback: number): number {
  const stored = localStorage.getItem(key)
  if (stored) {
    const parsed = parseFloat(stored)
    if (!isNaN(parsed)) return parsed
  }
  return fallback
}

interface UiState {
  activePanel: ActivityPanel
  sidebarVisible: boolean
  expandedSections: Record<string, boolean>
  sidebarWidth: number
  splitRatio: number
  setActivePanel: (panel: ActivityPanel) => void
  toggleSidebar: () => void
  toggleSection: (title: string) => void
  setSidebarWidth: (width: number) => void
  setSplitRatio: (ratio: number) => void
}

export const useUiStore = create<UiState>((set) => ({
  activePanel: 'explorer',
  sidebarVisible: true,
  expandedSections: {
    CONNECTIONS: true,
    DATABASES: true,
    TABLES: true,
    VIEWS: true
  },
  sidebarWidth: loadNumber(SIDEBAR_WIDTH_KEY, 240),
  splitRatio: loadNumber(SPLIT_RATIO_KEY, 50),
  setActivePanel: (panel) =>
    set((state) => ({
      activePanel: panel,
      sidebarVisible: state.activePanel === panel ? !state.sidebarVisible : true
    })),
  toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),
  toggleSection: (title) =>
    set((state) => ({
      expandedSections: {
        ...state.expandedSections,
        [title]: !state.expandedSections[title]
      }
    })),
  setSidebarWidth: (width) => {
    const clamped = Math.max(180, Math.min(480, width))
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(clamped))
    set({ sidebarWidth: clamped })
  },
  setSplitRatio: (ratio) => {
    const clamped = Math.max(20, Math.min(80, ratio))
    localStorage.setItem(SPLIT_RATIO_KEY, String(clamped))
    set({ splitRatio: clamped })
  },
}))
```

- [ ] **Step 2: Update App.tsx to use ResizeHandle and dynamic sizes**

Replace `src/renderer/src/App.tsx` with:

```tsx
import { useState, useEffect, useCallback } from 'react'
import { ActivityBar } from '@/components/shell/ActivityBar'
import { Sidebar } from '@/components/shell/Sidebar'
import { TitleBar } from '@/components/shell/TitleBar'
import { StatusBar } from '@/components/shell/StatusBar'
import { TabBar } from '@/components/shell/TabBar'
import { ToastContainer } from '@/components/shell/ToastContainer'
import { QueryPanel } from '@/components/query/QueryPanel'
import { ERDiagram } from '@/components/er/ERDiagram'
import { CommandPalette } from '@/components/command-palette/CommandPalette'
import { ResizeHandle } from '@/primitives'
import { useTabsStore } from '@/stores/tabs'
import { useUiStore } from '@/stores/ui'
import type { QueryTab, ErDiagramTab } from '@shared/types'

export function App() {
  const { tabs, activeTabId } = useTabsStore()
  const { sidebarVisible, sidebarWidth, setSidebarWidth } = useUiStore()
  const activeTab = tabs.find(t => t.id === activeTabId)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [prevSidebarWidth, setPrevSidebarWidth] = useState(sidebarWidth)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault()
        setPaletteOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSidebarResize = useCallback((delta: number) => {
    setSidebarWidth(sidebarWidth - delta)
  }, [sidebarWidth, setSidebarWidth])

  const handleSidebarDoubleClick = useCallback(() => {
    if (sidebarWidth > 180) {
      setPrevSidebarWidth(sidebarWidth)
      setSidebarWidth(0)
    } else {
      setSidebarWidth(prevSidebarWidth || 240)
    }
  }, [sidebarWidth, prevSidebarWidth, setSidebarWidth])

  return (
    <div className="flex flex-col h-screen bg-bg-primary text-text-primary">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <ActivityBar />
        {sidebarVisible && (
          <>
            <div style={{ width: sidebarWidth }} className="shrink-0 overflow-hidden">
              <Sidebar />
            </div>
            <ResizeHandle
              direction="horizontal"
              onResize={handleSidebarResize}
              onDoubleClick={handleSidebarDoubleClick}
            />
          </>
        )}
        <div className="flex-1 flex flex-col overflow-hidden">
          <TabBar />
          <div className="flex-1 overflow-hidden">
            {activeTab?.type === 'query' && (
              <QueryPanel tab={activeTab as QueryTab} />
            )}
            {activeTab?.type === 'er-diagram' && (
              <ERDiagram
                connectionId={(activeTab as ErDiagramTab).connectionId}
                schema={(activeTab as ErDiagramTab).schema}
              />
            )}
            {!activeTab && (
              <div className="flex-1 flex items-center justify-center bg-bg-tertiary h-full">
                <div className="text-center">
                  <h1 className="text-2xl font-semibold mb-2">dbstudio</h1>
                  <p className="text-text-secondary">Connect to a database to get started</p>
                  <p className="text-text-muted text-sm mt-1">Cmd+Shift+P to open command palette</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <StatusBar />
      <ToastContainer />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
```

- [ ] **Step 3: Update Sidebar to fill its container instead of setting its own width**

In `src/renderer/src/components/shell/Sidebar.tsx`, change the root div from `w-60` to `w-full h-full`:

Find: `className="w-60 bg-bg-secondary border-r border-border flex flex-col shrink-0"`
Replace: `className="w-full h-full bg-bg-secondary border-r border-border flex flex-col"`

- [ ] **Step 4: Verify the app works with resizable sidebar**

```bash
pnpm dev
```

Test: Drag the resize handle between sidebar and main content. Verify sidebar resizes, min/max constraints work, double-click collapses and restores.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/App.tsx src/renderer/src/stores/ui.ts src/renderer/src/components/shell/Sidebar.tsx
git commit -m "feat(layout): add resizable sidebar with drag handle and collapse"
```

---

## Phase 11: Storybook

### Task 22: Install and Configure Storybook

**Files:**
- Create: `.storybook/main.ts`
- Create: `.storybook/preview.ts`
- Create: `.storybook/manager.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Storybook**

```bash
pnpm add -D storybook @storybook/react-vite @storybook/addon-essentials @storybook/addon-a11y @storybook/addon-themes @storybook/blocks @storybook/react
```

- [ ] **Step 2: Create .storybook/main.ts**

Create `.storybook/main.ts`:

```ts
import type { StorybookConfig } from '@storybook/react-vite'
import { resolve } from 'path'

const config: StorybookConfig = {
  stories: ['../src/renderer/src/primitives/**/*.stories.tsx'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (config) => {
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': resolve(__dirname, '../src/renderer/src'),
      '@shared': resolve(__dirname, '../shared'),
    }
    return config
  },
  docs: {
    autodocs: 'tag',
  },
}

export default config
```

- [ ] **Step 3: Create .storybook/preview.ts**

Create `.storybook/preview.ts`:

```ts
import type { Preview } from '@storybook/react'
import '../src/renderer/src/styles/globals.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: { disable: true },
    layout: 'centered',
  },
  decorators: [
    (Story) => {
      document.documentElement.setAttribute('data-theme', 'dark')
      return Story()
    },
  ],
}

export default preview
```

- [ ] **Step 4: Create .storybook/manager.ts**

Create `.storybook/manager.ts`:

```ts
import { addons } from 'storybook/manager-api'
import { themes } from '@storybook/theming'

addons.setConfig({
  theme: themes.dark,
})
```

- [ ] **Step 5: Add storybook scripts to package.json**

Add to the `scripts` section of `package.json`:

```json
"storybook": "storybook dev -p 6006",
"build-storybook": "storybook build"
```

- [ ] **Step 6: Verify Storybook starts**

```bash
pnpm storybook
```

Expected: Storybook starts on port 6006 with no stories yet (empty state).

- [ ] **Step 7: Commit**

```bash
git add .storybook/ package.json pnpm-lock.yaml
git commit -m "chore: configure Storybook 8 with Vite, a11y addon, and dark theme"
```

---

### Task 23: Write Stories for Button (Template for All Stories)

**Files:**
- Create: `src/renderer/src/primitives/forms/Button.stories.tsx`

- [ ] **Step 1: Create Button stories**

Create `src/renderer/src/primitives/forms/Button.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta = {
  title: 'Forms/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['solid', 'outline', 'ghost', 'danger'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    disabled: { control: 'boolean' },
    children: { control: 'text' },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    children: 'Button',
    variant: 'solid',
    size: 'md',
  },
}

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(['solid', 'outline', 'ghost', 'danger'] as const).map((variant) => (
        <div key={variant} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ width: 60, fontSize: 12, color: '#888' }}>{variant}</span>
          {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <Button key={size} variant={variant} size={size}>
              {size}
            </Button>
          ))}
        </div>
      ))}
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8 }}>
      <Button>Default</Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
}
```

- [ ] **Step 2: Verify stories render in Storybook**

```bash
pnpm storybook
```

Open http://localhost:6006, navigate to Forms/Button. Verify Playground has controls, AllVariants shows the grid, States shows default/disabled.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/primitives/forms/Button.stories.tsx
git commit -m "feat(storybook): add Button stories as template for all primitives"
```

---

### Task 24: Write Stories for Remaining Primitives

**Files:**
- Create stories for every primitive (one `.stories.tsx` per component)

This task follows the exact same pattern as Task 23. For each primitive, create a `.stories.tsx` file alongside the component with:
1. **meta** — title following `Category/ComponentName` pattern, autodocs tag, argTypes for all variant props
2. **Playground** — default args story with controls
3. **AllVariants** — grid of variant × size combinations (where applicable)
4. **States** — static renders of hover/focus/disabled states

- [ ] **Step 1: Create stories for all layout primitives**

Create stories for: `Box`, `Flex`, `Stack`, `Grid`, `Container`, `Divider`, `Spacer`, `ScrollArea`, `AspectRatio`.

Each story file follows this pattern (example for Flex):

`src/renderer/src/primitives/layout/Flex.stories.tsx`:
```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Flex } from './Flex'

const meta = {
  title: 'Layout/Flex',
  component: Flex,
  tags: ['autodocs'],
  argTypes: {
    direction: { control: 'select', options: ['row', 'column', 'row-reverse', 'column-reverse'] },
    gap: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    align: { control: 'select', options: ['start', 'center', 'end', 'stretch', 'baseline'] },
    justify: { control: 'select', options: ['start', 'center', 'end', 'between', 'around', 'evenly'] },
    wrap: { control: 'boolean' },
  },
} satisfies Meta<typeof Flex>

export default meta
type Story = StoryObj<typeof meta>

const Box = ({ children }: { children: string }) => (
  <div style={{ padding: '8px 16px', background: 'var(--color-bg-tertiary)', borderRadius: 4, fontSize: 12 }}>
    {children}
  </div>
)

export const Playground: Story = {
  args: { direction: 'row', gap: 'md', align: 'center' },
  render: (args) => (
    <Flex {...args}>
      <Box>Item 1</Box>
      <Box>Item 2</Box>
      <Box>Item 3</Box>
    </Flex>
  ),
}

export const Directions: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {(['row', 'column'] as const).map((dir) => (
        <div key={dir}>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>{dir}</p>
          <Flex direction={dir} gap="sm">
            <Box>A</Box><Box>B</Box><Box>C</Box>
          </Flex>
        </div>
      ))}
    </div>
  ),
}
```

Repeat for all layout primitives, adapting argTypes and render examples to match each component's props.

- [ ] **Step 2: Create stories for all typography primitives**

Stories for: `Text`, `Heading`, `Code`, `Kbd`. Example pattern:

`src/renderer/src/primitives/typography/Text.stories.tsx`:
```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Text } from './Text'

const meta = {
  title: 'Typography/Text',
  component: Text,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'base', 'lg', 'xl'] },
    color: { control: 'select', options: ['primary', 'secondary', 'muted', 'disabled', 'accent', 'success', 'warning', 'error'] },
    weight: { control: 'select', options: ['normal', 'medium', 'semibold', 'bold'] },
    as: { control: 'select', options: ['span', 'p', 'div'] },
  },
} satisfies Meta<typeof Text>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: { children: 'The quick brown fox jumps over the lazy dog', size: 'sm', color: 'primary' },
}

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(['xs', 'sm', 'base', 'lg', 'xl'] as const).map((size) => (
        <Text key={size} size={size}>Text size: {size}</Text>
      ))}
    </div>
  ),
}

export const AllColors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(['primary', 'secondary', 'muted', 'disabled', 'accent', 'success', 'warning', 'error'] as const).map((color) => (
        <Text key={color} color={color}>Color: {color}</Text>
      ))}
    </div>
  ),
}
```

- [ ] **Step 3: Create stories for all form primitives**

Stories for: `IconButton`, `Input`, `Textarea`, `Label`, `FormField`, `Select`, `Checkbox`, `Radio`, `Switch`, `Slider`. Follow the Button story pattern — Playground + AllVariants + States.

- [ ] **Step 4: Create stories for all surface primitives**

Stories for: `Card`, `Panel`, `Modal`, `Sheet`, `Popover`, `Tooltip`, `DropdownMenu`, `ContextMenu`. Interactive components should show triggered/open states.

- [ ] **Step 5: Create stories for all data display primitives**

Stories for: `Badge`, `Tag`, `Avatar`, `Skeleton`, `EmptyState`, `KeyValue`, `Table`, `List`.

- [ ] **Step 6: Create stories for all feedback primitives**

Stories for: `Toast`, `Alert`, `Progress`, `Spinner`, `Banner`.

- [ ] **Step 7: Create stories for all navigation primitives**

Stories for: `Tabs`, `Breadcrumb`, `Link`, `Pagination`.

- [ ] **Step 8: Create stories for utility primitives**

Stories for: `ResizeHandle` (VisuallyHidden and Portal don't need visual stories).

- [ ] **Step 9: Verify all stories render**

```bash
pnpm storybook
```

Navigate through all categories in Storybook sidebar. Verify every component renders, controls work, and autodocs generate.

- [ ] **Step 10: Commit**

```bash
git add src/renderer/src/primitives/**/*.stories.tsx
git commit -m "feat(storybook): add stories for all 52 primitives"
```

---

## Phase 12: App Icon & Branding

### Task 25: Create App Icon SVG

**Files:**
- Create: `build/icon.svg`

- [ ] **Step 1: Create the SVG icon**

Create `build/icon.svg` — a minimal symbolic database icon with the purple accent:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" fill="none">
  <!-- Background circle -->
  <rect width="1024" height="1024" rx="224" fill="#0d0d1a"/>

  <!-- Database layers — three stacked rounded shapes -->
  <!-- Bottom layer -->
  <ellipse cx="512" cy="680" rx="260" ry="60" fill="#2a2a3e"/>
  <rect x="252" y="580" width="520" height="100" fill="#2a2a3e"/>
  <ellipse cx="512" cy="580" rx="260" ry="60" fill="#3a3a55"/>

  <!-- Middle layer -->
  <ellipse cx="512" cy="540" rx="260" ry="60" fill="#2a2a3e"/>
  <rect x="252" y="440" width="520" height="100" fill="#2a2a3e"/>
  <ellipse cx="512" cy="440" rx="260" ry="60" fill="#4a4a6a"/>

  <!-- Top layer — accent color -->
  <ellipse cx="512" cy="400" rx="260" ry="60" fill="#5548b0"/>
  <rect x="252" y="300" width="520" height="100" fill="#5548b0"/>
  <ellipse cx="512" cy="300" rx="260" ry="60" fill="#7c6ff7"/>

  <!-- Terminal cursor blink -->
  <rect x="472" y="260" width="80" height="4" rx="2" fill="#ffffff" opacity="0.9"/>

  <!-- Subtle glow on top layer -->
  <ellipse cx="512" cy="300" rx="200" ry="40" fill="#7c6ff7" opacity="0.15"/>
</svg>
```

- [ ] **Step 2: Verify the SVG renders correctly**

Open `build/icon.svg` in a browser. Verify: dark background rounded square, three stacked elliptical database layers (bottom grey, middle lighter grey, top purple), small white cursor line on top.

- [ ] **Step 3: Commit**

```bash
git add build/icon.svg
git commit -m "feat(branding): add dbstudio app icon SVG"
```

---

### Task 26: Generate Platform Icon Files

**Files:**
- Create: `build/icon.png`
- Create: `build/icon.icns`
- Create: `build/icon.ico`

- [ ] **Step 1: Install icon generation tool**

```bash
pnpm add -D electron-icon-builder
```

- [ ] **Step 2: Convert SVG to PNG first (electron-icon-builder needs PNG input)**

You need a 1024x1024 PNG. Use the `sharp` library or `sips` on macOS:

```bash
sips -s format png -z 1024 1024 build/icon.svg --out build/icon.png 2>/dev/null || npx sharp-cli -i build/icon.svg -o build/icon.png resize 1024 1024
```

If neither works, install sharp:
```bash
pnpm add -D sharp-cli
npx sharp-cli -i build/icon.svg -o build/icon.png resize 1024 1024
```

- [ ] **Step 3: Generate platform icons**

```bash
npx electron-icon-builder --input=build/icon.png --output=build/
```

This generates:
- `build/icons/mac/icon.icns`
- `build/icons/win/icon.ico`
- `build/icons/png/` with multiple sizes

- [ ] **Step 4: Move icons to expected locations**

```bash
cp build/icons/mac/icon.icns build/icon.icns
cp build/icons/win/icon.ico build/icon.ico
```

- [ ] **Step 5: Update electron-builder config if needed**

Check `package.json` for a `build` key. If electron-builder config references icon paths, make sure they point to `build/icon.icns` (mac) and `build/icon.ico` (win). The defaults should work if files are in `build/`.

- [ ] **Step 6: Verify icons build correctly**

```bash
pnpm build
```

Expected: Build completes without icon-related errors.

- [ ] **Step 7: Commit**

```bash
git add build/ package.json pnpm-lock.yaml
git commit -m "feat(branding): generate platform-specific app icons from SVG"
```

---

## Phase 13: Final Verification

### Task 27: Run All Tests

**Files:** None (verification only)

- [ ] **Step 1: Run the full test suite**

```bash
pnpm vitest run
```

Expected: All tests pass — both existing unit tests and new primitive tests.

- [ ] **Step 2: Run Storybook build**

```bash
pnpm build-storybook
```

Expected: Static Storybook build completes without errors.

- [ ] **Step 3: Run the app**

```bash
pnpm dev
```

Expected: App launches, sidebar is resizable, all existing functionality works unchanged.

- [ ] **Step 4: Verify theme switching works**

Open browser devtools console in the Electron app:
```js
document.documentElement.setAttribute('data-theme', 'light')
document.documentElement.setAttribute('data-theme', 'midnight')
document.documentElement.setAttribute('data-theme', 'dark')
```

Expected: Entire UI re-themes on each change.

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address any issues from final verification"
```
