# Checkbox & Radio Primitives Redesign

## Goal

Replace the current browser-default Checkbox and Radio primitives with fully custom-rendered controls that match the design system's visual language (accent fills, input gradients, focus glow, transitions).

## Decisions

- **Rendering approach:** `appearance-none` + CSS pseudo-elements (same pattern as Switch)
- **Checked indicator style:** Filled accent background with white indicator (checkmark for Checkbox, dot for Radio)
- **Size variants:** None -- single size (16x16), consistent with Switch
- **API:** No changes -- same `forwardRef<HTMLInputElement>`, same `InputHTMLAttributes` extension

## Checkbox Visual Spec

### Dimensions
- 16x16px, `border-radius: 4px` (Tailwind `rounded`)

### States

| State | Background | Border | Indicator |
|-------|-----------|--------|-----------|
| Unchecked | Input gradient (`linear-gradient` top/bottom) + `bg-tertiary` | `border-border-default` | None |
| Unchecked + hover | Same | `border-border-strong` | None |
| Checked | `bg-accent` | `border-accent` | White checkmark (CSS border trick `before:` pseudo-element, ~5x8px rotated "L") |
| Checked + hover | Slight brightness bump on accent | `border-accent` | Same |
| Focus | Any state + `shadow-[var(--shadow-focus-glow)]` | — | — |
| Disabled | Any state + `opacity-50`, `pointer-events-none` | — | — |

### Checkmark Implementation (CSS border trick)
The `before:` pseudo-element is positioned center, sized ~5px wide x 8px tall, with `border-bottom: 2px solid white` and `border-right: 2px solid white`, rotated 45deg. Hidden by default (`opacity-0 scale-0`), transitions to visible on `checked:` (`opacity-100 scale-100`).

## Radio Visual Spec

### Dimensions
- 16x16px, `border-radius: 50%` (Tailwind `rounded-full`)

### States
Same state matrix as Checkbox, except:
- **Indicator:** 6x6px white circle (`before:` pseudo-element, `rounded-full`), centered
- Scales from 0 to 1 on checked (`checked:before:scale-100`)

## Shared Styling

Both components use:
- `transition-all duration-[var(--transition-fast)]` on the input
- `before:transition-all before:duration-[var(--transition-fast)]` on the pseudo-element
- Inset shadow `shadow-[var(--shadow-input-inset)]` in unchecked state (matches Input, Select, TagsInput)
- Focus glow `shadow-[var(--shadow-focus-glow)]` (matches all form controls)

## Files Changed

| File | Change |
|------|--------|
| `src/renderer/src/primitives/forms/Checkbox.tsx` | Rewrite with `appearance-none` + pseudo-element checkmark |
| `src/renderer/src/primitives/forms/Radio.tsx` | Rewrite with `appearance-none` + pseudo-element dot |
| `src/renderer/src/primitives/forms/Checkbox.stories.tsx` | Update to cover all visual states |
| `src/renderer/src/primitives/forms/Radio.stories.tsx` | Update to cover all visual states |

## No Breaking Changes

API surface is identical. Consumers (ConnectionForm, SettingsPanel, ExportModal) require zero changes.
