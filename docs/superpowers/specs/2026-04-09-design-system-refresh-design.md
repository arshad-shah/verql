# Design System Refresh — Refined UI, Custom Inputs, Themes & Editor Theming

**Date:** 2026-04-09
**Approach:** Design System Refresh (Option B) — rework all 52 primitives with a unified refined dark UI aesthetic, add custom input system, 4 new dev themes with full Monaco editor parity, clean up stories.

---

## 1. Design Language: Refined Dark UI

A cohesive visual language applied to all 52 primitive components. Must look premium across all 7 themes (dark, light, midnight, dracula, nord, solarized, catppuccin).

### Core Visual Principles

**Surfaces:**
- Subtle inner shadows on inputs and cards for depth (`inset 0 1px 2px rgba(0,0,0,0.3)`)
- 1px borders at low opacity (`rgba(255,255,255,0.08)` on dark themes)
- Subtle background gradients on interactive elements (top slightly lighter than bottom)
- Layered backgrounds following the existing primary → secondary → tertiary → elevated hierarchy

**Focus & Interaction:**
- Soft accent glow on focus: `0 0 0 3px rgba(accent, 0.25)` replacing the current hard ring
- Smooth 150ms transitions on all interactive state changes (hover, focus, active)
- Hover: subtle background lift + border brightening
- Active/pressed: slight inward shift or darkening

**Typography:**
- Existing hierarchy preserved (primary → secondary → muted)
- Tighter letter-spacing on headings (`-0.01em`) for premium feel
- Monospace font for all data/code displays (numbers, dates, hex values)

**Borders & Radius:**
- Consistent 6px radius on most elements (matching current `--radius-md`)
- Borders at 8-15% opacity for subtlety
- No harsh outlines — everything breathes

### New Design Tokens

Added to `tokens.css` at the `:root` level:

```css
/* Shadows */
--shadow-input-inset: inset 0 1px 2px rgba(0,0,0,0.3);
--shadow-card: 0 1px 3px rgba(0,0,0,0.2);
--shadow-elevated: 0 4px 12px rgba(0,0,0,0.3);
--shadow-dropdown: 0 8px 24px rgba(0,0,0,0.4);

/* Focus glow — uses accent color, themed per-theme */
--shadow-focus-glow: 0 0 0 3px var(--color-focus-ring-alpha);
--color-focus-ring-alpha: rgba(124, 111, 247, 0.25); /* themed */

/* Transitions */
--transition-fast: 150ms ease;
--transition-normal: 200ms ease;
--transition-slow: 300ms ease;

/* Gradient helpers — themed */
--color-input-gradient-top: rgba(255,255,255,0.03);
--color-input-gradient-bottom: transparent;
--color-button-highlight: rgba(255,255,255,0.1); /* top inner highlight */
```

Each theme file overrides the shadow/gradient tokens with appropriate values (e.g., light theme uses darker shadows, inverted gradient directions).

### Components Modified

All 52 existing primitives get the refined treatment. Key changes per category:

**Forms (11 components):**
- Button: subtle top-edge highlight gradient, refined hover lift, shadow on solid variant
- Input: inset shadow, background gradient, soft focus glow replacing hard ring
- Textarea: same treatment as Input
- Select: same treatment as Input, custom dropdown arrow styling
- Checkbox: refined border, accent fill with subtle gradient, check animation
- Radio: same refinement as Checkbox
- Switch: smoother thumb shadow, track gradient, transition on toggle
- Slider: refined track with inset shadow, thumb with elevated shadow
- Label: tighter letter-spacing when uppercase
- FormField: no visual change (wrapper only)
- IconButton: same treatment as Button

**Surfaces (8 components):**
- Card: `--shadow-card`, subtle border, hover lift option
- Panel: refined border treatment
- Modal: `--shadow-elevated`, backdrop blur, refined border
- Sheet: elevated shadow, smooth slide animation
- Popover: `--shadow-dropdown`, refined border
- DropdownMenu: `--shadow-dropdown`, refined item hover states
- ContextMenu: same as DropdownMenu
- Tooltip: `--shadow-elevated`, refined arrow

**Feedback (5 components):**
- Alert: refined left-border accent, subtle background tint
- Banner: refined gradient background
- Toast: elevated shadow, smooth enter/exit transitions
- Spinner: no visual change (already minimal)
- Progress: refined track with inset shadow, gradient fill bar

**Data Display (8 components):**
- Table: refined header background, subtle row hover, border treatment
- Badge: subtle inner shadow, refined border
- Tag: same treatment as Badge, smoother dismiss animation
- Avatar: refined border, subtle shadow
- List: refined hover states, separator treatment
- KeyValue: refined key/value color contrast
- EmptyState: no significant visual change
- Skeleton: refined shimmer animation gradient

**Navigation (4 components):**
- Tabs: refined active indicator (gradient underline), smoother transitions
- Link: refined underline animation
- Breadcrumb: refined separator styling
- Pagination: button treatment matches Button refinements

**Typography (4 components):**
- Heading: tighter letter-spacing
- Text, Code, Kbd: refined background/border on Code and Kbd

**Layout (9 components):** No visual changes — these are structural wrappers.

**Utilities (3 components):** ResizeHandle gets refined hover/active styling.

---

## 2. Custom Input System

Six new specialized input components in `src/renderer/src/primitives/forms/`. All share the base Input's inset shadow, border, and focus glow tokens. All support controlled (`value`/`onChange`) and uncontrolled (`defaultValue`) modes with `forwardRef`.

### NumberInput

Stepper-style number input with +/- buttons.

**Props:**
- `value` / `defaultValue` / `onChange` — number
- `min` / `max` / `step` — constraints
- `size` — xs | sm | md | lg | xl (matches Input sizes)
- `error` — boolean
- `disabled` — boolean
- `precision` — decimal places

**Behavior:**
- +/- stepper buttons on left/right edges
- Keyboard: ArrowUp/ArrowDown to increment/decrement, Shift+Arrow for 10x step
- Direct text editing with validation on blur
- Clamping to min/max on blur
- Monospace value display

### SearchInput

Search-specific input with icon and optional features.

**Props:**
- `value` / `defaultValue` / `onChange` — string
- `size` — matches Input sizes
- `shortcut` — optional string (e.g., "⌘K") to show as badge
- `onClear` — callback when clear button clicked
- `loading` — shows spinner instead of search icon

**Behavior:**
- Leading search icon (magnifying glass)
- Clear button appears when value is non-empty
- Optional keyboard shortcut badge on right
- Loading spinner state replaces search icon

### PasswordInput

Password input with visibility toggle.

**Props:**
- `value` / `defaultValue` / `onChange` — string
- `size` — matches Input sizes
- `error` — boolean
- `showStrength` — boolean, shows strength meter below

**Behavior:**
- Eye icon button toggles between `type="password"` and `type="text"`
- Optional strength meter (weak/fair/strong/very strong) based on length + character variety
- Same base styling as Input

### TagsInput

Multi-value tag input.

**Props:**
- `value` / `defaultValue` / `onChange` — string[]
- `size` — matches Input sizes
- `maxTags` — optional limit
- `allowDuplicates` — boolean (default false)
- `validate` — optional `(tag: string) => boolean`
- `placeholder` — shown when no tags and input empty

**Behavior:**
- Enter or comma to add tag
- Backspace on empty input removes last tag
- Click × on tag to remove
- Tags styled with accent color tint (using `--color-accent-muted`)
- Input auto-grows, wraps to next line

### DatePicker

Date input with calendar dropdown.

**Props:**
- `value` / `defaultValue` / `onChange` — Date | string
- `size` — matches Input sizes
- `min` / `max` — date constraints
- `format` — display format string (default: "YYYY-MM-DD")
- `placeholder` — string

**Behavior:**
- Calendar icon triggers popover with month grid
- Manual text entry with format validation on blur
- Arrow keys navigate calendar grid
- Today button, month/year navigation
- Calendar uses Popover component internally
- No external date library — built with native Date API

### ColorInput

Color value input with preview swatch.

**Props:**
- `value` / `defaultValue` / `onChange` — string (hex)
- `size` — matches Input sizes
- `presets` — optional string[] of preset hex colors
- `showPicker` — boolean (default true), enables popover picker

**Behavior:**
- Color swatch preview on left edge
- Hex input with # prefix
- Optional popover with hue/saturation picker and preset swatches
- Validates hex format on blur

---

## 3. New Themes

Four new themes added alongside existing Dark, Light, Midnight. Each theme defines both CSS custom properties (for the app) and a Monaco editor theme (for syntax highlighting parity).

### Theme Definitions

Each theme CSS file goes in `src/renderer/src/primitives/theme/themes/` and defines the same semantic token set as existing themes.

**Dracula:**
- BG primary: `#282a36`, secondary: `#21222c`, tertiary: `#1e1f29`, elevated: `#44475a`
- Text primary: `#f8f8f2`, secondary: `#6272a4`
- Accent: `#bd93f9`, accent-hover: `#caa9fa`
- Status: success `#50fa7b`, warning `#f1fa8c`, error `#ff5555`, info `#8be9fd`
- Borders: `#44475a`

**Nord:**
- BG primary: `#2e3440`, secondary: `#282e39`, tertiary: `#242933`, elevated: `#3b4252`
- Text primary: `#eceff4`, secondary: `#4c566a`
- Accent: `#88c0d0`, accent-hover: `#8fbcbb`
- Status: success `#a3be8c`, warning `#ebcb8b`, error `#bf616a`, info `#81a1c1`
- Borders: `#3b4252`

**Solarized Dark:**
- BG primary: `#002b36`, secondary: `#001e26`, tertiary: `#00161d`, elevated: `#073642`
- Text primary: `#fdf6e3`, secondary: `#586e75`
- Accent: `#268bd2`, accent-hover: `#2aa198`
- Status: success `#859900`, warning `#b58900`, error `#dc322f`, info `#268bd2`
- Borders: `#073642`

**Catppuccin Mocha:**
- BG primary: `#1e1e2e`, secondary: `#181825`, tertiary: `#11111b`, elevated: `#313244`
- Text primary: `#cdd6f4`, secondary: `#585b70`
- Accent: `#cba6f7`, accent-hover: `#b4befe`
- Status: success `#a6e3a1`, warning `#f9e2af`, error `#f38ba8`, info `#89b4fa`
- Borders: `#45475a`

### ThemeProvider Changes

Update `AVAILABLE_THEMES` to include `'dracula' | 'nord' | 'solarized' | 'catppuccin'`. No other structural changes — the existing `data-theme` attribute mechanism works as-is.

### Storybook Preview Changes

Update `withThemeByDataAttribute` in `.storybook/preview.tsx` to include all 7 themes in the toolbar switcher.

---

## 4. Monaco Editor Theming

### Architecture

Create a `src/renderer/src/lib/monaco-themes.ts` module that:
1. Exports a `defineAppThemes(monaco: Monaco)` function called once on editor mount
2. Defines 7 Monaco themes using `monaco.editor.defineTheme()` — one per app theme
3. Maps semantic token colors from CSS variables to Monaco's `IStandaloneThemeData` format

### Theme Mapping

Each Monaco theme defines these token colors:
- `editor.background` — maps to `--color-bg-primary` or appropriate editor-specific bg
- `editor.foreground` — maps to `--color-text-primary`
- `editor.lineHighlightBackground` — maps to `--color-hover`
- `editor.selectionBackground` — accent at ~30% opacity
- `editorLineNumber.foreground` — maps to `--color-text-tertiary`
- `editorCursor.foreground` — maps to `--color-accent`

Syntax token rules per theme:
- Keywords (SELECT, FROM, WHERE): theme-specific keyword color
- Strings: theme-specific string color
- Numbers: theme-specific number color
- Comments: theme-specific comment color (usually text-tertiary)
- Functions/identifiers: theme-specific function color
- Types: theme-specific type color
- Operators: theme-specific operator color

### QueryEditor Integration

Modify `QueryEditor.tsx`:
1. Import `defineAppThemes` and call it in `handleMount`
2. Replace hardcoded `theme="vs-dark"` with a reactive theme prop derived from `useTheme()`
3. Map app theme names to Monaco theme names (e.g., `'dark'` → `'dbterm-dark'`)
4. When app theme changes, call `monaco.editor.setTheme()` to switch

### Editor Story

New story at `src/renderer/src/components/query/QueryEditor.stories.tsx`:
- Wraps editor in ThemeProvider
- Provides mock `onExecute` that logs to Storybook actions panel
- Pre-filled with sample SQL query
- Language switcher control (SQL, JSON, plaintext)
- Full height container matching app layout
- Monaco themes react to Storybook toolbar theme switcher

---

## 5. Story Cleanup

### Pattern: Per-Component Stories

Every component story file follows this structure:

```typescript
// 1. Default — primary use case, hero for docs page
export const Default: Story = { args: { /* sensible defaults */ } }

// 2. Variants — grid of all visual variants (only if component has variants)
export const Variants: Story = { render: () => <VariantsGrid /> }

// 3. States — disabled, error, loading, empty (only if applicable)
export const States: Story = { render: () => <StatesGrid /> }

// 4. [Feature] — one story per significant behavior
export const WithIcon: Story = { /* ... */ }
```

### What Gets Removed

- All `Playground` stories — `Default` with autodocs controls replaces them
- Duplicate `AllVariants` stories that repeat what `Variants` shows
- Separate size-only stories (e.g., `Sizes`) — sizes fold into `Variants` grid
- Inconsistent names like `Example`, `Interactive` — replaced with `Default`

### What Gets Added

**Composition stories** under `Patterns/` category:
- `ConnectionForm` — FormField + Input + PasswordInput + Select + Button
- `DataCard` — Card + Badge + KeyValue + Table
- `ConfirmDialog` — Modal + Text + Button group

**Component stories** under `Components/` category:
- `QueryEditor` — Full editor story (described in Section 4)

### Naming Conventions

- Story titles use category path: `Primitives/Forms/Button`, `Primitives/Surfaces/Card`
- Pattern stories: `Patterns/ConnectionForm`
- Component stories: `Components/QueryEditor`
- Story exports: PascalCase (`Default`, `Variants`, `States`, `WithIcon`)
- All stories include `tags: ['autodocs']`

### Story Quality Rules

- Every story must demonstrate a specific, distinct state or behavior
- No story should duplicate what another story in the same file shows
- Composition stories use realistic data, not lorem ipsum
- Interactive stories (Modal, Tabs, etc.) use `useState` to show real behavior
- Render helpers (grids, showcases) are local to the story file, not shared utilities
