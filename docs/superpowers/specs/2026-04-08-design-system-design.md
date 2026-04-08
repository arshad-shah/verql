# dbstudio Design System, Resizable Layout, Storybook & Branding

**Date:** 2026-04-08
**Status:** Approved
**Scope:** Sub-project 1 — Primitive component library, theming, resizable panels, Storybook, app icon

---

## 1. Overview

Build a complete primitive UI component library (~50 components) for dbstudio that is:
- **Pure presentational** — no business logic, no stores, no IPC
- **Minimal flat** design language — clean surfaces, subtle borders, no shadows
- **Token-themed** — swappable color palettes via CSS custom properties
- **5 sizes** — `xs`, `sm`, `md`, `lg`, `xl` across all size-aware components
- **Documented in Storybook** with interactive playgrounds and accessibility checks

Additionally: resizable panel layout, and a custom app icon with consistent branding.

## 2. Tech Stack

- **Tailwind CSS v4** (already in use) — utility classes for all styling
- **class-variance-authority (CVA)** — type-safe variant prop definitions
- **tailwind-merge** — conflict-free className composition for consumer overrides
- **Native browser APIs** — `<dialog>`, `popover` attribute, CSS anchor positioning for interactive components
- **Storybook 8.x** — Vite builder, autodocs, accessibility addon
- **No Radix, no runtime CSS-in-JS, no component library dependencies**

## 3. File Structure

```
src/renderer/src/
├── primitives/                    # Design system
│   ├── index.ts                   # Barrel export for all primitives
│   ├── theme/
│   │   ├── tokens.css             # Base scale + semantic token definitions
│   │   ├── themes/
│   │   │   ├── dark.css           # Default dark theme
│   │   │   ├── light.css          # Light theme
│   │   │   └── midnight.css       # Example custom theme
│   │   └── ThemeProvider.tsx       # Applies data-theme attribute, useTheme() hook
│   ├── layout/
│   │   ├── Box.tsx
│   │   ├── Flex.tsx
│   │   ├── Grid.tsx
│   │   ├── Stack.tsx              # VStack + HStack via direction prop
│   │   ├── Container.tsx
│   │   ├── Divider.tsx
│   │   ├── Spacer.tsx
│   │   ├── ScrollArea.tsx
│   │   └── AspectRatio.tsx
│   ├── surfaces/
│   │   ├── Card.tsx
│   │   ├── Panel.tsx
│   │   ├── Sheet.tsx              # Native <dialog> slide-over
│   │   ├── Modal.tsx              # Native <dialog>
│   │   ├── Popover.tsx            # Native popover API
│   │   ├── Tooltip.tsx
│   │   ├── DropdownMenu.tsx
│   │   └── ContextMenu.tsx
│   ├── forms/
│   │   ├── Button.tsx
│   │   ├── IconButton.tsx
│   │   ├── Input.tsx
│   │   ├── Textarea.tsx
│   │   ├── Select.tsx
│   │   ├── Checkbox.tsx
│   │   ├── Radio.tsx
│   │   ├── Switch.tsx
│   │   ├── Slider.tsx
│   │   ├── Label.tsx
│   │   └── FormField.tsx
│   ├── data-display/
│   │   ├── Badge.tsx
│   │   ├── Tag.tsx
│   │   ├── Avatar.tsx
│   │   ├── Table.tsx
│   │   ├── List.tsx
│   │   ├── KeyValue.tsx
│   │   ├── EmptyState.tsx
│   │   └── Skeleton.tsx
│   ├── feedback/
│   │   ├── Toast.tsx
│   │   ├── Alert.tsx
│   │   ├── Progress.tsx
│   │   ├── Spinner.tsx
│   │   └── Banner.tsx
│   ├── navigation/
│   │   ├── Tabs.tsx
│   │   ├── Breadcrumb.tsx
│   │   ├── Link.tsx
│   │   └── Pagination.tsx
│   ├── typography/
│   │   ├── Text.tsx
│   │   ├── Heading.tsx
│   │   ├── Code.tsx
│   │   └── Kbd.tsx
│   └── utilities/
│       ├── VisuallyHidden.tsx
│       ├── Portal.tsx
│       └── ResizeHandle.tsx
```

## 4. Design Tokens & Theming

### 4.1 Token Architecture — Three Layers

```
Layer 1: Raw scale        →  --color-purple-500: #7c6ff7
Layer 2: Semantic tokens  →  --color-accent: var(--color-purple-500)
Layer 3: Component tokens →  --button-bg: var(--color-accent)
```

Themes remap **Layer 2 only**. A theme file is ~30 lines of CSS overrides.

### 4.2 Semantic Token Set

| Category | Tokens | Names |
|----------|--------|-------|
| Background | 4 | `bg-primary`, `bg-secondary`, `bg-tertiary`, `bg-elevated` |
| Text | 4 | `text-primary`, `text-secondary`, `text-tertiary`, `text-disabled` |
| Border | 3 | `border-default`, `border-subtle`, `border-strong` |
| Accent | 3 | `accent`, `accent-hover`, `accent-muted` |
| Status | 4 | `success`, `warning`, `error`, `info` |
| Interactive | 4 | `hover`, `active`, `focus-ring`, `disabled` |
| Spacing | 5 | `xs`(4px), `sm`(8px), `md`(12px), `lg`(16px), `xl`(24px) |
| Radii | 4 | `sm`(4px), `md`(6px), `lg`(8px), `full`(9999px) |

### 4.3 ThemeProvider

- Reads preference from `localStorage` key `dbstudio-theme`
- Sets `data-theme` attribute on root element
- Theme CSS files use `[data-theme="midnight"] { ... }` selectors
- Exposes `useTheme()` hook: `{ theme: string, setTheme: (t: string) => void, themes: string[] }`
- Default theme: `dark`

### 4.4 Migration

Existing `globals.css` tokens map directly to this system. Rename to semantic naming convention, add theme layer on top. No visual changes during migration.

## 5. Component API Contract

Every primitive follows the same pattern:

### 5.1 Standard Contract

1. **Extends native element props** via `ComponentPropsWithRef<'element'>`
2. **Adds variant props** defined by CVA (`variant`, `size`, etc.)
3. **Forwards ref** to the root DOM element
4. **Spreads remaining props** onto root element
5. **Uses `tailwind-merge`** so consumers can override classes without conflicts
6. **Exports the component + its variants type** from the file

### 5.2 Size Scale

All size-aware components use the same 5-size scale:

| Size | Height | Padding | Font |
|------|--------|---------|------|
| `xs` | 24px (h-6) | px-2 | text-xs |
| `sm` | 28px (h-7) | px-3 | text-xs |
| `md` | 32px (h-8) | px-4 | text-sm |
| `lg` | 36px (h-9) | px-5 | text-sm |
| `xl` | 40px (h-10) | px-6 | text-base |

### 5.3 Layout Props

Layout components (`Box`, `Flex`, `Grid`, `Stack`) use constrained props that map to the token scale:

```tsx
<Flex direction="row" gap="md" align="center" wrap>
<Stack gap="sm">
<Grid columns={3} gap="md">
<Box padding="lg" radius="md">
```

Gap, padding, spacing props accept: `xs` | `sm` | `md` | `lg` | `xl`.

### 5.4 Interactive Components — Native Browser APIs

| Component | Implementation |
|-----------|---------------|
| `Modal` | `<dialog>` element + `showModal()` |
| `Sheet` | `<dialog>` + CSS slide-in animation |
| `Popover` | Native `popover` attribute + `popoverTarget` |
| `Tooltip` | CSS anchor positioning with fallback |
| `DropdownMenu` | `popover` API + keyboard navigation (arrow keys, enter, escape) |
| `ContextMenu` | `popover` API + `onContextMenu` event |

## 6. Resizable Panel Layout

### 6.1 Layout Zones

```
┌──────────────────────────────────────────────┐
│ TitleBar                                      │
├───┬──────────────────────────────────────────┤
│   │ TabBar                                    │
│ A │──────────────────────────────┬───────────│
│ c │                              │           │
│ t │   Editor Panel               │  Sidebar  │
│ i │                              │  ←→       │
│ v │──────── ↕ ──────────────────│           │
│ i │                              │           │
│ t │   Results Panel              │           │
│ y │                              │           │
│   │                              │           │
│ B │                              │           │
│ a │                              │           │
│ r │                              │           │
├───┴──────────────────────────────┴───────────┤
│ StatusBar                                     │
└──────────────────────────────────────────────┘
```

### 6.2 Resize Handles

Three resize handles:

1. **Sidebar edge** — horizontal, resizes sidebar width. Min 180px, max 480px.
2. **Editor/Results split** — vertical, resizes split ratio. Min 20%, max 80%.
3. **ActivityBar** — fixed width, not resizable.

### 6.3 ResizeHandle Primitive

- **Hit area:** 4px wide/tall, 1px visible line
- **Hover:** Expands to 2px, accent color
- **Cursor:** `col-resize` or `row-resize`
- **Events:** `onResize(delta)` during drag, `onResizeEnd(finalSize)` on release
- **Keyboard:** Arrow keys move 10px, Shift+arrow moves 50px
- **Persistence:** Sizes saved to `localStorage`, restored on startup
- **Collapse:** Double-click collapses panel, double-click again restores
- **Animation:** 150ms ease-out transition on collapse/expand

### 6.4 Implementation

- Pure pointer events: `onPointerDown` → track `pointermove` on `document` → `onPointerUp`
- Parent layout uses CSS `grid-template-columns` / `grid-template-rows` with persisted pixel/percentage values
- No resize observer needed — handle drives the layout directly

## 7. Storybook

### 7.1 Configuration

```
.storybook/
├── main.ts          # Vite builder, story globs, addons
├── preview.ts       # Global decorators (ThemeProvider, global CSS)
└── manager.ts       # Dark theme for Storybook UI
```

### 7.2 Story Convention

Stories live alongside components: `Button.tsx` + `Button.stories.tsx`

Every primitive gets four story types:
1. **Playground** — interactive controls for all props
2. **All Variants** — grid of every variant × size combination
3. **States** — hover, focus, active, disabled rendered statically
4. **Theme preview** — theme switcher decorator on all stories

### 7.3 Addons

- `@storybook/addon-essentials` — controls, actions, viewport, docs
- `@storybook/addon-a11y` — automated accessibility checks
- `@storybook/addon-themes` — theme switcher in toolbar

### 7.4 Autodocs

Enabled globally. Generates documentation pages from component prop types and JSDoc comments.

### 7.5 NPM Scripts

- `pnpm storybook` — dev server on port 6006
- `pnpm build-storybook` — static build

## 8. App Icon & Branding

### 8.1 Icon Concept

Minimal symbolic icon — stacked cylindrical database layers rendered as simple geometric shapes (rounded rectangles/ellipses) with the purple accent `#7c6ff7`. Not literal 3D — flat layered shapes suggesting data storage, with a subtle terminal/cursor element for the "studio" aspect.

### 8.2 Deliverables

| File | Purpose | Sizes |
|------|---------|-------|
| `build/icon.svg` | Source file | Vector |
| `build/icon.icns` | macOS app icon | 1024 → 16 |
| `build/icon.ico` | Windows icon | 256 → 16 |
| `build/icon.png` | Linux AppImage | 512x512 |
| `build/tray-icon.png` | System tray (future) | 16, 32 |

### 8.3 Branding Rules

- App name: **dbstudio**
- Brand color: `#7c6ff7` (purple accent)
- Icon uses the same minimal flat design language as the component system
- Title bar shows icon + app name
- macOS DMG background image with centered icon

### 8.4 Generation

Create icon as SVG in code (clean geometric shapes). Use `electron-icon-builder` or conversion script to generate all platform-specific sizes from the SVG source.

## 9. Component Inventory (Complete)

### Layout (9)
Box, Flex, Grid, Stack, Container, Divider, Spacer, ScrollArea, AspectRatio

### Surfaces (8)
Card, Panel, Sheet, Modal, Popover, Tooltip, DropdownMenu, ContextMenu

### Forms (11)
Button, IconButton, Input, Textarea, Select, Checkbox, Radio, Switch, Slider, Label, FormField

### Data Display (8)
Badge, Tag, Avatar, Table, List, KeyValue, EmptyState, Skeleton

### Feedback (5)
Toast, Alert, Progress, Spinner, Banner

### Navigation (4)
Tabs, Breadcrumb, Link, Pagination

### Typography (4)
Text, Heading, Code, Kbd

### Utilities (3)
VisuallyHidden, Portal, ResizeHandle

**Total: 52 primitives**
