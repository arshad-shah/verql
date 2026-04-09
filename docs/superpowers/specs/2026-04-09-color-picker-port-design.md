# Color Picker Port — Design Spec

**Date:** 2026-04-09
**Source:** css-inspector project (`/Users/ShahA/Documents/practice/extensions/css-inspector/src/ui/color-picker.js`)
**Target:** dbstudio design system (`src/renderer/src/primitives/forms/`)

## Goal

Replace the native `<input type="color">` inside `ColorInput` with a custom color picker ported from css-inspector. The picker is slimmed down to solid-color-only features and restyled to feel native to dbstudio's design system.

## Scope

### Keep (from css-inspector)

- **HSV canvas** — Saturation/value area with draggable pointer
- **Hue slider** — Horizontal track with draggable thumb
- **Alpha slider** — Horizontal track with transparency gradient and draggable thumb
- **Color preview** — Swatch showing current color over a transparency checkerboard
- **Format switching** — HEX / RGB / HSL toggle buttons with corresponding input fields
- **EyeDropper API** — Feature-detected; hidden when browser doesn't support it
- **Copy to clipboard** — One-click copy of the current color string
- **Preset swatches** — Configurable palette; default 18 colors from css-inspector: `#ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080, #ffffff, #c0c0c0, #808080, #404040, #000000, transparent`
- **Color conversion utilities** — HSV/RGB/HSL/HEX parsing and bidirectional conversion

### Cut

- **Gradient mode** — Solid/linear/radial/conic toggle, gradient stops, gradient track, gradient output, gradient controls
- **HWB format** — Niche; 3 formats (HEX/RGB/HSL) is sufficient
- **Named color map** — Only parse hex/rgb/hsl strings
- **Shadow DOM integration** — Not needed in React
- **Imperative positioning** — React handles this via the existing dropdown/popover pattern

### Enhance for dbstudio

- Theme tokens: `bg-secondary`, `bg-tertiary`, `border-default`, `border-strong`, `shadow-dropdown`, `accent`, `text-primary`, `text-secondary`, `text-muted`, `transition-fast`
- CVA size variants matching other form primitives (xs/sm/md/lg/xl)
- Smooth hover/focus transitions consistent with the design system
- Keyboard accessibility on the format buttons and preset swatches

## File Structure

```
src/renderer/src/primitives/forms/
  color-utils.ts           — Pure color conversion functions (zero deps, fully testable)
  ColorPicker.tsx           — The picker panel component
  ColorPicker.stories.tsx   — Stories for the picker in isolation
  ColorInput.tsx            — Updated outer wrapper (swatch + text input + dropdown)
  ColorInput.stories.tsx    — Updated stories
```

## Component APIs

### `color-utils.ts` — Pure Functions

```ts
// Conversions (all pure, no side effects)
hsvToRgb(h, s, v): [r, g, b]
rgbToHsv(r, g, b): [h, s, v]
rgbToHsl(r, g, b): [h, s, l]
hslToRgb(h, s, l): [r, g, b]
rgbToHex(r, g, b, a?): string
hexToRgb(hex): [r, g, b, a]

// Parsing — accepts hex, rgb(), rgba(), hsl(), hsla()
parseColor(str): [r, g, b, a]

// Formatting
formatColor(r, g, b, a, format: 'hex' | 'rgb' | 'hsl'): string

// Validation
isValidColor(str): boolean

// Helpers
clamp(value, min, max): number
```

### `ColorPicker` — Internal Panel Component

```tsx
interface ColorPickerProps {
  value: string                     // Current color string
  onChange: (color: string) => void  // Fires on every interaction
  format?: 'hex' | 'rgb' | 'hsl'   // Initial format, default 'hex'
  presets?: string[]                 // Custom palette, default 18 colors
  showEyeDropper?: boolean          // Default true, auto-hidden if unsupported
  showPresets?: boolean             // Default true
}
```

**Internal state:** `h`, `s`, `v`, `a` (HSV + alpha) — the canonical representation. All conversions derive from this.

**Interaction model (ported from css-inspector):**
- HSV canvas: `pointerdown` → track `pointermove` on document → `pointerup` cleanup
- Hue/alpha sliders: Same drag pattern
- Format buttons: Click toggles active format, re-renders input fields
- Preset swatches: Click sets color
- EyeDropper: Click opens native picker, result feeds back into state
- Copy: Click copies `formatColor(...)` to clipboard

### `ColorInput` — Public API (unchanged)

```tsx
interface ColorInputProps {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  presets?: string[]
  showPicker?: boolean              // Default true
  disabled?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}
```

**Internal change:** The popover dropdown currently renders `<input type="color">`. This is replaced with `<ColorPicker>` rendered in an absolutely-positioned dropdown panel (same pattern as the current implementation, just different content).

## Styling Approach

All styling uses Tailwind classes and dbstudio theme tokens. Key decisions:

- **Picker panel:** `bg-bg-secondary border border-border-default rounded-lg shadow-[var(--shadow-dropdown)]` — matches existing dropdown surfaces
- **HSV canvas:** 160px tall, full-width within the picker. Hue gradient overlay via CSS `linear-gradient`. Pointer is a small circle with `border-2 border-white shadow-md`
- **Slider tracks:** 12px tall, full-width, rounded. Hue uses the standard rainbow gradient. Alpha uses transparency checkerboard + color gradient
- **Format buttons:** Small pill buttons using `text-xs`, active state uses `bg-accent text-white`
- **Input fields:** Compact inputs matching the existing `Input` primitive styling at `xs` size
- **Preset swatches:** Grid of small color circles (20x20px), hover scale effect, border on active
- **Transitions:** All interactive elements use `transition-all duration-[var(--transition-fast)]`

## Interaction Details

### Drag Interactions (HSV canvas, hue track, alpha track)

Ported directly from css-inspector's `drag()` helper pattern:
1. `pointerdown` on the element: calculate initial position, start tracking
2. `pointermove` on `document`: update h/s/v/a based on pointer position relative to element bounds
3. `pointerup` on `document`: remove listeners

React implementation: Use `useCallback` refs for the handlers, attach/detach document listeners in the pointerdown handler (not in useEffect — same as the vanilla pattern).

### Keyboard Accessibility

- Format buttons: Focusable, Enter/Space to activate
- Preset swatches: Focusable, Enter/Space to select
- EyeDropper button: Focusable, Enter/Space to activate
- Copy button: Focusable, Enter/Space to copy
- Text inputs: Standard keyboard input, Enter to commit
- Escape: Close the picker dropdown (handled at ColorInput level)

## Testing

- **color-utils.ts:** Unit tests for all conversion functions and parsing edge cases
- **ColorPicker.stories.tsx:** Default story, play function that clicks format buttons and preset swatches
- **ColorInput.stories.tsx:** Updated stories exercising the new picker dropdown
