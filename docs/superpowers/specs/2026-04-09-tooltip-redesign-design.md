# Tooltip Redesign — Design Spec

## Overview

Rewrite the Tooltip primitive with a modern, playful-polished design featuring a soft rounded SVG beak, spring-feel animation, and smart positioning via Floating UI. Drop-in replacement for the existing component — no migration needed.

## Goals

- Replace the current basic `useState`-toggled tooltip with a polished, production-quality component
- Add a distinctive soft rounded SVG beak (arrow) that gives the tooltip character
- Smooth fade + scale animation with spring easing
- Smart positioning that auto-flips near viewport edges
- Maintain the same API surface so existing usages (TabBar, Sidebar, ActivityBar) work unchanged

## Visual Design

### Tooltip Body

- Background: `bg-elevated` semantic token (works across all themes)
- Border: 1px `border-default` with subtle opacity
- Border radius: 9px (slightly larger than standard `radius-md` for a softer feel)
- Shadow: `shadow-elevated` token
- Text: `text-primary`, 13px, font-weight 500
- Padding: 6px 12px
- Letter spacing: 0.01em

### Beak (Arrow)

- Shape: Soft rounded teardrop via SVG bezier path
- Size: 22px wide, 9px tall
- Path: `M0 0C0 0 6 0 9 6.5C10 8.5 12 8.5 13 6.5C16 0 22 0 22 0Z`
- Fill matches tooltip background
- Border stroke continues from tooltip body for seamless connection
- Rotated via CSS transform per placement side (0°/90°/180°/270°)
- Positioned dynamically by Floating UI arrow middleware

### Animation

- Enter: opacity 0 → 1, scale 0.95 → 1
- Exit: opacity 1 → 0, scale 1 → 0.95
- Easing: `cubic-bezier(0.34, 1.56, 0.64, 1)` (subtle spring overshoot)
- Duration: 150ms in, 100ms out
- Transform origin: set per side (e.g., "bottom center" when tooltip is above)

## API

```typescript
interface TooltipProps {
  /** Tooltip text */
  content: string
  /** Preferred placement side */
  side?: 'top' | 'bottom' | 'left' | 'right'  // default: 'top'
  /** Alignment along the side axis */
  align?: 'start' | 'center' | 'end'           // default: 'center'
  /** Delay before showing (ms) */
  delay?: number                                 // default: 400
  /** Additional CSS classes on tooltip element */
  className?: string
  /** Trigger element */
  children: ReactNode
}
```

**Backward compatible** with the existing API. The `align` and `delay` props are new additions; existing usages that only pass `content`, `side`, `className`, and `children` continue to work unchanged.

## Implementation

### Dependency

- **@floating-ui/react** — positioning engine with flip, offset, shift, and arrow middleware
- ~4KB gzipped, purpose-built for this exact use case

### Positioning Strategy

- `useFloating` hook with placement derived from `side` + `align` props
- Middleware stack: `offset(8)` → `flip()` → `shift({ padding: 8 })` → `arrow()`
- Arrow middleware returns `x`/`y` coordinates for beak positioning
- Flip middleware auto-switches to opposite side when near viewport edge

### Beak Component

- Internal `TooltipBeak` component renders the SVG path
- Accepts `side` (actual resolved placement) and arrow coordinates from Floating UI
- Applies CSS rotation per side:
  - top: 0° (beak points down)
  - bottom: 180° (beak points up)
  - left: 90° (beak points right)
  - right: -90° (beak points left)
- Positioned absolutely relative to tooltip body

### Show/Hide Logic

- `useHover` and `useFocus` from `@floating-ui/react` for interaction handling
- `useRole` for `role="tooltip"` accessibility
- `useDismiss` for Escape key dismissal
- `useInteractions` to merge all interaction hooks
- Show delay configurable via `delay` prop (default 400ms)
- Hide delay: 0ms (instant)

### Rendering

- Tooltip content rendered via Portal (existing `Portal` primitive in `primitives/utilities/`)
- Conditional render based on `isOpen` state from `useFloating`

### Theming

Uses existing semantic tokens — no new CSS custom properties needed:
- `--color-bg-elevated` for background
- `--color-text-primary` for text
- `--color-border-default` for border
- `--shadow-elevated` for box shadow

Works across all themes (dark, light, midnight, dracula, nord, solarized, catppuccin) automatically.

## Files Changed

| File | Action |
|------|--------|
| `src/renderer/src/primitives/surfaces/Tooltip.tsx` | Rewrite |
| `src/renderer/src/primitives/surfaces/Tooltip.stories.tsx` | Update stories |
| `tests/unit/primitives/surfaces/tooltip.test.tsx` | Add/update tests |
| `package.json` | Add `@floating-ui/react` dependency |

## Existing Usages (no changes needed)

- `src/renderer/src/components/shell/TabBar.tsx` — `<Tooltip content="New Query Tab" side="bottom">`
- `src/renderer/src/components/shell/Sidebar.tsx` — `<Tooltip content="Import data" side="left">`
- `src/renderer/src/components/shell/ActivityBar.tsx` — `<Tooltip content="..." side="right">`

## Out of Scope

- Rich content (ReactNode) in tooltip body — text-only for now
- Tooltip groups / delay groups — can be added later if needed
- Controlled open/close state — keep it uncontrolled
