# Design System Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize all 52 primitives with a refined dark UI aesthetic, add 6 custom input components, 4 new dev themes with full Monaco editor syntax parity, and clean up all Storybook stories.

**Architecture:** Extend the existing 3-layer CSS token system with shadow/transition/gradient tokens. Restyle components via Tailwind classes in CVA definitions. New themes are CSS files with `[data-theme]` selectors. Monaco themes are defined programmatically via `defineTheme()` and auto-switch with the app theme. Stories follow a Default/Variants/States pattern, removing redundant Playground stories.

**Tech Stack:** React, TypeScript, Tailwind CSS v4, CVA (class-variance-authority), Monaco Editor, Storybook 8.x

**Spec:** `docs/superpowers/specs/2026-04-09-design-system-refresh-design.md`

---

## File Structure

### New Files
- `src/renderer/src/primitives/theme/themes/dracula.css` — Dracula theme tokens
- `src/renderer/src/primitives/theme/themes/nord.css` — Nord theme tokens
- `src/renderer/src/primitives/theme/themes/solarized.css` — Solarized Dark theme tokens
- `src/renderer/src/primitives/theme/themes/catppuccin.css` — Catppuccin Mocha theme tokens
- `src/renderer/src/primitives/forms/NumberInput.tsx` — Stepper number input
- `src/renderer/src/primitives/forms/SearchInput.tsx` — Search input with icon/shortcut
- `src/renderer/src/primitives/forms/PasswordInput.tsx` — Password with visibility toggle
- `src/renderer/src/primitives/forms/TagsInput.tsx` — Multi-value tag input
- `src/renderer/src/primitives/forms/DatePicker.tsx` — Date input with calendar popover
- `src/renderer/src/primitives/forms/ColorInput.tsx` — Color input with swatch preview
- `src/renderer/src/lib/monaco-themes.ts` — Monaco theme definitions for all 7 themes
- `src/renderer/src/primitives/forms/NumberInput.stories.tsx` — NumberInput stories
- `src/renderer/src/primitives/forms/SearchInput.stories.tsx` — SearchInput stories
- `src/renderer/src/primitives/forms/PasswordInput.stories.tsx` — PasswordInput stories
- `src/renderer/src/primitives/forms/TagsInput.stories.tsx` — TagsInput stories
- `src/renderer/src/primitives/forms/DatePicker.stories.tsx` — DatePicker stories
- `src/renderer/src/primitives/forms/ColorInput.stories.tsx` — ColorInput stories
- `src/renderer/src/components/query/QueryEditor.stories.tsx` — Editor story
- `src/renderer/src/primitives/patterns/ConnectionForm.stories.tsx` — Composition story
- `src/renderer/src/primitives/patterns/DataCard.stories.tsx` — Composition story
- `src/renderer/src/primitives/patterns/ConfirmDialog.stories.tsx` — Composition story

### Modified Files
- `src/renderer/src/primitives/theme/tokens.css` — Add shadow/transition/gradient tokens
- `src/renderer/src/primitives/theme/themes/dark.css` — Add themed shadow/gradient overrides
- `src/renderer/src/primitives/theme/themes/light.css` — Add themed shadow/gradient overrides
- `src/renderer/src/primitives/theme/themes/midnight.css` — Add themed shadow/gradient overrides
- `src/renderer/src/styles/globals.css` — Import new theme CSS files, extend @theme
- `src/renderer/src/primitives/theme/ThemeProvider.tsx` — Add 4 new theme names
- `.storybook/preview.tsx` — Add 7 themes to toolbar switcher
- `.storybook/main.ts` — Add patterns story path
- `src/renderer/src/primitives/forms/Button.tsx` — Refined styling
- `src/renderer/src/primitives/forms/Input.tsx` — Refined styling
- `src/renderer/src/primitives/forms/Textarea.tsx` — Refined styling
- `src/renderer/src/primitives/forms/Select.tsx` — Refined styling
- `src/renderer/src/primitives/forms/Checkbox.tsx` — Refined styling
- `src/renderer/src/primitives/forms/Radio.tsx` — Refined styling
- `src/renderer/src/primitives/forms/Switch.tsx` — Refined styling
- `src/renderer/src/primitives/forms/Slider.tsx` — Refined styling
- `src/renderer/src/primitives/forms/Label.tsx` — Tighter letter-spacing
- `src/renderer/src/primitives/forms/IconButton.tsx` — (in Button.tsx) Refined styling
- `src/renderer/src/primitives/surfaces/Card.tsx` — Refined styling
- `src/renderer/src/primitives/surfaces/Panel.tsx` — Refined styling
- `src/renderer/src/primitives/surfaces/Modal.tsx` — Refined styling
- `src/renderer/src/primitives/surfaces/Sheet.tsx` — Refined styling
- `src/renderer/src/primitives/surfaces/Popover.tsx` — Refined styling
- `src/renderer/src/primitives/surfaces/DropdownMenu.tsx` — Refined styling
- `src/renderer/src/primitives/surfaces/ContextMenu.tsx` — Refined styling
- `src/renderer/src/primitives/surfaces/Tooltip.tsx` — Refined styling
- `src/renderer/src/primitives/feedback/Alert.tsx` — Refined styling
- `src/renderer/src/primitives/feedback/Banner.tsx` — Refined styling
- `src/renderer/src/primitives/feedback/Toast.tsx` — Refined styling
- `src/renderer/src/primitives/feedback/Progress.tsx` — Refined styling
- `src/renderer/src/primitives/data-display/Table.tsx` — Refined styling
- `src/renderer/src/primitives/data-display/Badge.tsx` — Refined styling
- `src/renderer/src/primitives/data-display/Tag.tsx` — Refined styling
- `src/renderer/src/primitives/data-display/Avatar.tsx` — Refined styling
- `src/renderer/src/primitives/data-display/List.tsx` — Refined styling
- `src/renderer/src/primitives/data-display/KeyValue.tsx` — Refined styling
- `src/renderer/src/primitives/data-display/Skeleton.tsx` — Refined shimmer
- `src/renderer/src/primitives/navigation/Tabs.tsx` — Refined styling
- `src/renderer/src/primitives/navigation/Link.tsx` — Refined styling
- `src/renderer/src/primitives/navigation/Breadcrumb.tsx` — Refined styling
- `src/renderer/src/primitives/navigation/Pagination.tsx` — Refined styling
- `src/renderer/src/primitives/typography/Heading.tsx` — Tighter letter-spacing
- `src/renderer/src/primitives/typography/Code.tsx` — Refined styling
- `src/renderer/src/primitives/typography/Kbd.tsx` — Refined styling
- `src/renderer/src/primitives/utilities/ResizeHandle.tsx` — Refined hover/active
- `src/renderer/src/primitives/forms/index.ts` — Export new input components
- `src/renderer/src/components/query/QueryEditor.tsx` — Dynamic Monaco theming
- All 50 existing `.stories.tsx` files — Cleanup per new pattern

---

## Task 1: Extend Design Tokens

**Files:**
- Modify: `src/renderer/src/primitives/theme/tokens.css`

- [ ] **Step 1: Add shadow, transition, and gradient tokens to tokens.css**

Append the following new tokens inside the second `:root` block (Layer 2), after the `--color-disabled` line:

```css
  /* Shadows */
  --shadow-input-inset: inset 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.2);
  --shadow-elevated: 0 4px 12px rgba(0, 0, 0, 0.3);
  --shadow-dropdown: 0 8px 24px rgba(0, 0, 0, 0.4);
  --shadow-focus-glow: 0 0 0 3px rgba(124, 111, 247, 0.25);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
  --transition-slow: 300ms ease;

  /* Gradients */
  --color-input-gradient-top: rgba(255, 255, 255, 0.03);
  --color-input-gradient-bottom: transparent;
  --color-button-highlight: rgba(255, 255, 255, 0.1);
```

- [ ] **Step 2: Verify tokens.css is valid**

Run: `npx tailwindcss --input src/renderer/src/styles/globals.css --content '' 2>&1 | head -5`

Expected: No CSS syntax errors. Warnings about no content are fine.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/primitives/theme/tokens.css
git commit -m "feat: add shadow, transition, and gradient design tokens"
```

---

## Task 2: Update Existing Theme Files With New Tokens

**Files:**
- Modify: `src/renderer/src/primitives/theme/themes/dark.css`
- Modify: `src/renderer/src/primitives/theme/themes/light.css`
- Modify: `src/renderer/src/primitives/theme/themes/midnight.css`

- [ ] **Step 1: Add themed overrides to dark.css**

Append before the closing `}` of `[data-theme="dark"]`:

```css
  --shadow-input-inset: inset 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.2);
  --shadow-elevated: 0 4px 12px rgba(0, 0, 0, 0.3);
  --shadow-dropdown: 0 8px 24px rgba(0, 0, 0, 0.4);
  --shadow-focus-glow: 0 0 0 3px rgba(124, 111, 247, 0.25);
  --color-input-gradient-top: rgba(255, 255, 255, 0.03);
  --color-input-gradient-bottom: transparent;
  --color-button-highlight: rgba(255, 255, 255, 0.1);
```

- [ ] **Step 2: Add themed overrides to light.css**

Append before the closing `}` of `[data-theme="light"]`:

```css
  --shadow-input-inset: inset 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.08);
  --shadow-elevated: 0 4px 12px rgba(0, 0, 0, 0.1);
  --shadow-dropdown: 0 8px 24px rgba(0, 0, 0, 0.12);
  --shadow-focus-glow: 0 0 0 3px rgba(124, 111, 247, 0.2);
  --color-input-gradient-top: rgba(0, 0, 0, 0.02);
  --color-input-gradient-bottom: transparent;
  --color-button-highlight: rgba(255, 255, 255, 0.8);
```

- [ ] **Step 3: Add themed overrides to midnight.css**

Append before the closing `}` of `[data-theme="midnight"]`:

```css
  --shadow-input-inset: inset 0 1px 2px rgba(0, 0, 0, 0.5);
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.4);
  --shadow-elevated: 0 4px 12px rgba(0, 0, 0, 0.5);
  --shadow-dropdown: 0 8px 24px rgba(0, 0, 0, 0.6);
  --shadow-focus-glow: 0 0 0 3px rgba(139, 124, 248, 0.25);
  --color-input-gradient-top: rgba(255, 255, 255, 0.02);
  --color-input-gradient-bottom: transparent;
  --color-button-highlight: rgba(255, 255, 255, 0.06);
```

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/primitives/theme/themes/
git commit -m "feat: add shadow/gradient token overrides to dark, light, midnight themes"
```

---

## Task 3: Create Dracula, Nord, Solarized, Catppuccin Theme Files

**Files:**
- Create: `src/renderer/src/primitives/theme/themes/dracula.css`
- Create: `src/renderer/src/primitives/theme/themes/nord.css`
- Create: `src/renderer/src/primitives/theme/themes/solarized.css`
- Create: `src/renderer/src/primitives/theme/themes/catppuccin.css`

- [ ] **Step 1: Create dracula.css**

```css
[data-theme="dracula"] {
  --color-bg-primary: #282a36;
  --color-bg-secondary: #21222c;
  --color-bg-tertiary: #1e1f29;
  --color-bg-elevated: #44475a;

  --color-text-primary: #f8f8f2;
  --color-text-secondary: #6272a4;
  --color-text-tertiary: #4a5480;
  --color-text-disabled: #3a3f5c;

  --color-border-default: #44475a;
  --color-border-subtle: #2c2d3a;
  --color-border-strong: #6272a4;

  --color-accent: #bd93f9;
  --color-accent-hover: #caa9fa;
  --color-accent-muted: #2d2540;

  --color-success: #50fa7b;
  --color-warning: #f1fa8c;
  --color-error: #ff5555;
  --color-info: #8be9fd;

  --color-hover: rgba(255, 255, 255, 0.05);
  --color-active: rgba(255, 255, 255, 0.1);
  --color-focus-ring: #bd93f9;
  --color-disabled: #3a3f5c;

  --shadow-input-inset: inset 0 1px 2px rgba(0, 0, 0, 0.35);
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.25);
  --shadow-elevated: 0 4px 12px rgba(0, 0, 0, 0.35);
  --shadow-dropdown: 0 8px 24px rgba(0, 0, 0, 0.45);
  --shadow-focus-glow: 0 0 0 3px rgba(189, 147, 249, 0.25);
  --color-input-gradient-top: rgba(255, 255, 255, 0.03);
  --color-input-gradient-bottom: transparent;
  --color-button-highlight: rgba(255, 255, 255, 0.1);
}
```

- [ ] **Step 2: Create nord.css**

```css
[data-theme="nord"] {
  --color-bg-primary: #2e3440;
  --color-bg-secondary: #282e39;
  --color-bg-tertiary: #242933;
  --color-bg-elevated: #3b4252;

  --color-text-primary: #eceff4;
  --color-text-secondary: #4c566a;
  --color-text-tertiary: #434c5e;
  --color-text-disabled: #3b4252;

  --color-border-default: #3b4252;
  --color-border-subtle: #2e3440;
  --color-border-strong: #4c566a;

  --color-accent: #88c0d0;
  --color-accent-hover: #8fbcbb;
  --color-accent-muted: #1e2a30;

  --color-success: #a3be8c;
  --color-warning: #ebcb8b;
  --color-error: #bf616a;
  --color-info: #81a1c1;

  --color-hover: rgba(255, 255, 255, 0.04);
  --color-active: rgba(255, 255, 255, 0.08);
  --color-focus-ring: #88c0d0;
  --color-disabled: #3b4252;

  --shadow-input-inset: inset 0 1px 2px rgba(0, 0, 0, 0.25);
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.2);
  --shadow-elevated: 0 4px 12px rgba(0, 0, 0, 0.25);
  --shadow-dropdown: 0 8px 24px rgba(0, 0, 0, 0.35);
  --shadow-focus-glow: 0 0 0 3px rgba(136, 192, 208, 0.25);
  --color-input-gradient-top: rgba(255, 255, 255, 0.02);
  --color-input-gradient-bottom: transparent;
  --color-button-highlight: rgba(255, 255, 255, 0.08);
}
```

- [ ] **Step 3: Create solarized.css**

```css
[data-theme="solarized"] {
  --color-bg-primary: #002b36;
  --color-bg-secondary: #001e26;
  --color-bg-tertiary: #00161d;
  --color-bg-elevated: #073642;

  --color-text-primary: #fdf6e3;
  --color-text-secondary: #586e75;
  --color-text-tertiary: #465a61;
  --color-text-disabled: #2e4449;

  --color-border-default: #073642;
  --color-border-subtle: #002b36;
  --color-border-strong: #586e75;

  --color-accent: #268bd2;
  --color-accent-hover: #2aa198;
  --color-accent-muted: #0a2a3a;

  --color-success: #859900;
  --color-warning: #b58900;
  --color-error: #dc322f;
  --color-info: #268bd2;

  --color-hover: rgba(255, 255, 255, 0.04);
  --color-active: rgba(255, 255, 255, 0.08);
  --color-focus-ring: #268bd2;
  --color-disabled: #2e4449;

  --shadow-input-inset: inset 0 1px 2px rgba(0, 0, 0, 0.35);
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.25);
  --shadow-elevated: 0 4px 12px rgba(0, 0, 0, 0.35);
  --shadow-dropdown: 0 8px 24px rgba(0, 0, 0, 0.45);
  --shadow-focus-glow: 0 0 0 3px rgba(38, 139, 210, 0.25);
  --color-input-gradient-top: rgba(255, 255, 255, 0.03);
  --color-input-gradient-bottom: transparent;
  --color-button-highlight: rgba(255, 255, 255, 0.08);
}
```

- [ ] **Step 4: Create catppuccin.css**

```css
[data-theme="catppuccin"] {
  --color-bg-primary: #1e1e2e;
  --color-bg-secondary: #181825;
  --color-bg-tertiary: #11111b;
  --color-bg-elevated: #313244;

  --color-text-primary: #cdd6f4;
  --color-text-secondary: #585b70;
  --color-text-tertiary: #45475a;
  --color-text-disabled: #313244;

  --color-border-default: #45475a;
  --color-border-subtle: #313244;
  --color-border-strong: #585b70;

  --color-accent: #cba6f7;
  --color-accent-hover: #b4befe;
  --color-accent-muted: #2a2240;

  --color-success: #a6e3a1;
  --color-warning: #f9e2af;
  --color-error: #f38ba8;
  --color-info: #89b4fa;

  --color-hover: rgba(255, 255, 255, 0.04);
  --color-active: rgba(255, 255, 255, 0.08);
  --color-focus-ring: #cba6f7;
  --color-disabled: #313244;

  --shadow-input-inset: inset 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.2);
  --shadow-elevated: 0 4px 12px rgba(0, 0, 0, 0.3);
  --shadow-dropdown: 0 8px 24px rgba(0, 0, 0, 0.4);
  --shadow-focus-glow: 0 0 0 3px rgba(203, 166, 247, 0.25);
  --color-input-gradient-top: rgba(255, 255, 255, 0.03);
  --color-input-gradient-bottom: transparent;
  --color-button-highlight: rgba(255, 255, 255, 0.08);
}
```

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/primitives/theme/themes/
git commit -m "feat: add Dracula, Nord, Solarized, Catppuccin theme files"
```

---

## Task 4: Wire Up New Themes (globals.css, ThemeProvider, Storybook)

**Files:**
- Modify: `src/renderer/src/styles/globals.css`
- Modify: `src/renderer/src/primitives/theme/ThemeProvider.tsx`
- Modify: `.storybook/preview.tsx`
- Modify: `.storybook/main.ts`

- [ ] **Step 1: Import new theme CSS files in globals.css**

Add after the midnight import line:

```css
@import "../primitives/theme/themes/dracula.css";
@import "../primitives/theme/themes/nord.css";
@import "../primitives/theme/themes/solarized.css";
@import "../primitives/theme/themes/catppuccin.css";
```

Also add the new shadow/transition tokens to the `@theme` block. Add after the `--color-focus-ring` line:

```css
  --shadow-input-inset: var(--shadow-input-inset);
  --shadow-card: var(--shadow-card);
  --shadow-elevated: var(--shadow-elevated);
  --shadow-dropdown: var(--shadow-dropdown);
  --shadow-focus-glow: var(--shadow-focus-glow);
  --transition-fast: var(--transition-fast);
  --transition-normal: var(--transition-normal);
  --transition-slow: var(--transition-slow);
  --color-input-gradient-top: var(--color-input-gradient-top);
  --color-input-gradient-bottom: var(--color-input-gradient-bottom);
  --color-button-highlight: var(--color-button-highlight);
```

- [ ] **Step 2: Update ThemeProvider with new theme names**

Replace the `AVAILABLE_THEMES` line:

```typescript
const AVAILABLE_THEMES = ['dark', 'light', 'midnight', 'dracula', 'nord', 'solarized', 'catppuccin'] as const
```

- [ ] **Step 3: Update Storybook preview with all 7 themes**

Replace the `withThemeByDataAttribute` call:

```typescript
    withThemeByDataAttribute({
      themes: {
        Dark: 'dark',
        Light: 'light',
        Midnight: 'midnight',
        Dracula: 'dracula',
        Nord: 'nord',
        Solarized: 'solarized',
        Catppuccin: 'catppuccin',
      },
      defaultTheme: 'Dark',
      attributeName: 'data-theme',
    }),
```

- [ ] **Step 4: Add patterns story path to Storybook main.ts**

Add to the `stories` array:

```typescript
  stories: [
    '../src/renderer/src/primitives/**/*.stories.tsx',
    '../src/renderer/src/components/**/*.stories.tsx',
    '../src/renderer/src/primitives/patterns/**/*.stories.tsx',
  ],
```

- [ ] **Step 5: Verify Storybook builds**

Run: `npx storybook build --quiet 2>&1 | tail -5`

Expected: Build completes without errors.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/styles/globals.css src/renderer/src/primitives/theme/ThemeProvider.tsx .storybook/preview.tsx .storybook/main.ts
git commit -m "feat: wire up 4 new themes in globals, ThemeProvider, and Storybook"
```

---

## Task 5: Restyle Form Components

**Files:**
- Modify: `src/renderer/src/primitives/forms/Button.tsx`
- Modify: `src/renderer/src/primitives/forms/Input.tsx`
- Modify: `src/renderer/src/primitives/forms/Textarea.tsx`
- Modify: `src/renderer/src/primitives/forms/Select.tsx`
- Modify: `src/renderer/src/primitives/forms/Checkbox.tsx`
- Modify: `src/renderer/src/primitives/forms/Radio.tsx`
- Modify: `src/renderer/src/primitives/forms/Switch.tsx`
- Modify: `src/renderer/src/primitives/forms/Slider.tsx`
- Modify: `src/renderer/src/primitives/forms/Label.tsx`

- [ ] **Step 1: Restyle Button**

Replace the `buttonVariants` base classes:

```typescript
const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-[var(--transition-fast)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus-glow)] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        solid:
          'bg-accent text-white hover:bg-accent-hover shadow-[inset_0_1px_0_var(--color-button-highlight),0_1px_2px_rgba(0,0,0,0.2)] hover:shadow-[inset_0_1px_0_var(--color-button-highlight),0_2px_4px_rgba(0,0,0,0.25)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]',
        outline:
          'border border-border-default bg-transparent hover:bg-hover hover:border-border-strong text-text-primary',
        ghost: 'bg-transparent hover:bg-hover text-text-primary',
        danger:
          'bg-error text-white hover:bg-error/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_1px_2px_rgba(0,0,0,0.2)]',
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
```

Apply the same treatment to the `iconButtonVariants`:

```typescript
const iconButtonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-[var(--transition-fast)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus-glow)] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        solid:
          'bg-accent text-white hover:bg-accent-hover shadow-[inset_0_1px_0_var(--color-button-highlight),0_1px_2px_rgba(0,0,0,0.2)]',
        outline:
          'border border-border-default bg-transparent hover:bg-hover hover:border-border-strong text-text-primary',
        ghost: 'bg-transparent hover:bg-hover text-text-primary',
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
```

- [ ] **Step 2: Restyle Input**

Replace the `inputVariants` base classes:

```typescript
const inputVariants = cva(
  'w-full border bg-[linear-gradient(180deg,var(--color-input-gradient-top),var(--color-input-gradient-bottom)),var(--color-bg-tertiary)] text-text-primary placeholder:text-text-muted shadow-[var(--shadow-input-inset)] transition-all duration-[var(--transition-fast)] focus:outline-none focus:shadow-[var(--shadow-focus-glow),var(--shadow-input-inset)] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      size: {
        xs: 'h-6 px-2 text-xs rounded',
        sm: 'h-7 px-3 text-xs rounded',
        md: 'h-8 px-4 text-sm rounded-md',
        lg: 'h-9 px-5 text-sm rounded-md',
        xl: 'h-10 px-6 text-base rounded-lg',
      },
      error: {
        true: 'border-error focus:shadow-[0_0_0_3px_rgba(255,95,87,0.25),var(--shadow-input-inset)]',
        false: 'border-border-default hover:border-border-strong',
      },
    },
    defaultVariants: {
      size: 'md',
      error: false,
    },
  }
)
```

- [ ] **Step 3: Restyle Textarea**

Replace the `textareaVariants` base classes (same treatment as Input):

```typescript
const textareaVariants = cva(
  'w-full border bg-[linear-gradient(180deg,var(--color-input-gradient-top),var(--color-input-gradient-bottom)),var(--color-bg-tertiary)] text-text-primary placeholder:text-text-muted shadow-[var(--shadow-input-inset)] transition-all duration-[var(--transition-fast)] focus:outline-none focus:shadow-[var(--shadow-focus-glow),var(--shadow-input-inset)] disabled:pointer-events-none disabled:opacity-50 resize-y',
  {
    variants: {
      size: {
        sm: 'px-3 py-1.5 text-xs rounded',
        md: 'px-4 py-2 text-sm rounded-md',
        lg: 'px-5 py-2.5 text-sm rounded-md',
      },
      error: {
        true: 'border-error focus:shadow-[0_0_0_3px_rgba(255,95,87,0.25),var(--shadow-input-inset)]',
        false: 'border-border-default hover:border-border-strong',
      },
    },
    defaultVariants: {
      size: 'md',
      error: false,
    },
  }
)
```

- [ ] **Step 4: Restyle Select**

Replace the `selectVariants` base classes:

```typescript
const selectVariants = cva(
  'w-full appearance-none border border-border-default bg-[linear-gradient(180deg,var(--color-input-gradient-top),var(--color-input-gradient-bottom)),var(--color-bg-tertiary)] text-text-primary shadow-[var(--shadow-input-inset)] transition-all duration-[var(--transition-fast)] focus:outline-none focus:shadow-[var(--shadow-focus-glow),var(--shadow-input-inset)] hover:border-border-strong disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      size: {
        xs: 'h-6 px-2 text-xs rounded',
        sm: 'h-7 px-3 text-xs rounded',
        md: 'h-8 px-4 text-sm rounded-md',
        lg: 'h-9 px-5 text-sm rounded-md',
        xl: 'h-10 px-6 text-base rounded-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)
```

- [ ] **Step 5: Restyle Checkbox**

Replace the `className` in the Checkbox component:

```typescript
className={cn(
  'h-4 w-4 rounded border border-border-default bg-bg-tertiary transition-all duration-[var(--transition-fast)]',
  'focus:outline-none focus:shadow-[var(--shadow-focus-glow)]',
  'checked:bg-accent checked:border-accent',
  'disabled:pointer-events-none disabled:opacity-50',
  className
)}
```

- [ ] **Step 6: Restyle Radio**

Replace the `className` in the Radio component:

```typescript
className={cn(
  'h-4 w-4 rounded-full border border-border-default bg-bg-tertiary transition-all duration-[var(--transition-fast)]',
  'focus:outline-none focus:shadow-[var(--shadow-focus-glow)]',
  'checked:bg-accent checked:border-accent',
  'disabled:pointer-events-none disabled:opacity-50',
  className
)}
```

- [ ] **Step 7: Restyle Switch**

Replace the `className` in the Switch component:

```typescript
className={cn(
  'h-5 w-9 cursor-pointer appearance-none rounded-full bg-bg-tertiary transition-all duration-[var(--transition-fast)]',
  'checked:bg-accent',
  'relative before:absolute before:top-0.5 before:left-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:shadow-[0_1px_3px_rgba(0,0,0,0.3)] before:transition-transform before:duration-[var(--transition-fast)]',
  'checked:before:translate-x-4',
  'focus:outline-none focus:shadow-[var(--shadow-focus-glow)]',
  'disabled:pointer-events-none disabled:opacity-50',
  className
)}
```

- [ ] **Step 8: Restyle Slider**

Replace the `className` in the Slider component:

```typescript
className={cn(
  'w-full h-1.5 rounded-full bg-bg-tertiary shadow-[var(--shadow-input-inset)] appearance-none cursor-pointer',
  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-[var(--shadow-elevated)]',
  '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-[var(--shadow-elevated)]',
  'focus:outline-none focus:shadow-[var(--shadow-focus-glow)]',
  'disabled:pointer-events-none disabled:opacity-50',
  className
)}
```

- [ ] **Step 9: Restyle Label**

Replace the `className` in the Label component:

```typescript
className={cn('text-sm font-medium text-text-primary tracking-tight', className)}
```

- [ ] **Step 10: Verify TypeScript compiles**

Run: `npx tsc --noEmit --project tsconfig.web.json 2>&1 | tail -10`

Expected: No type errors in form components.

- [ ] **Step 11: Commit**

```bash
git add src/renderer/src/primitives/forms/
git commit -m "feat: restyle all form primitives with refined design language"
```

---

## Task 6: Restyle Surface Components

**Files:**
- Modify: `src/renderer/src/primitives/surfaces/Card.tsx`
- Modify: `src/renderer/src/primitives/surfaces/Panel.tsx`
- Modify: `src/renderer/src/primitives/surfaces/Modal.tsx`
- Modify: `src/renderer/src/primitives/surfaces/Sheet.tsx`
- Modify: `src/renderer/src/primitives/surfaces/Popover.tsx`
- Modify: `src/renderer/src/primitives/surfaces/DropdownMenu.tsx`
- Modify: `src/renderer/src/primitives/surfaces/ContextMenu.tsx`
- Modify: `src/renderer/src/primitives/surfaces/Tooltip.tsx`

- [ ] **Step 1: Restyle Card**

In the Card CVA, update the base classes to add card shadow and refined border:

Replace `'rounded-lg border border-border-default bg-bg-secondary'` with:
```
'rounded-lg border border-border-default bg-bg-secondary shadow-[var(--shadow-card)] transition-shadow duration-[var(--transition-fast)]'
```

- [ ] **Step 2: Restyle Panel**

Replace `'rounded-lg border border-border-default bg-bg-secondary p-4'` with:
```
'rounded-lg border border-border-default bg-bg-secondary shadow-[var(--shadow-card)] p-4'
```

- [ ] **Step 3: Restyle Modal**

In the Modal component's inner `<div>`, add elevated shadow and backdrop blur. Find the dialog's inner content div className and add:
- `shadow-[var(--shadow-elevated)]` to the content container
- `backdrop:bg-black/50 backdrop:backdrop-blur-sm` to the dialog element

- [ ] **Step 4: Restyle Sheet**

Add `shadow-[var(--shadow-elevated)]` to the Sheet's content panel className.

- [ ] **Step 5: Restyle Popover**

Add `shadow-[var(--shadow-dropdown)] border border-border-default` to the Popover content className.

- [ ] **Step 6: Restyle DropdownMenu**

Add `shadow-[var(--shadow-dropdown)]` to the menu popover container. Update item hover to use refined `hover:bg-hover` transition.

- [ ] **Step 7: Restyle ContextMenu**

Add `shadow-[var(--shadow-dropdown)]` to the context menu container. Same item hover refinement as DropdownMenu.

- [ ] **Step 8: Restyle Tooltip**

Add `shadow-[var(--shadow-elevated)]` to the tooltip content span.

- [ ] **Step 9: Commit**

```bash
git add src/renderer/src/primitives/surfaces/
git commit -m "feat: restyle all surface primitives with shadows and refined borders"
```

---

## Task 7: Restyle Feedback, Data Display, Navigation, Typography, Utilities

**Files:**
- Modify: All feedback, data-display, navigation, typography, and utility component files

- [ ] **Step 1: Restyle feedback components**

**Alert.tsx:** Add a left accent border by updating the base CVA class. Replace the base `'rounded-md border p-3'` with:
```
'rounded-md border-l-4 border p-3 shadow-[var(--shadow-card)]'
```

**Banner.tsx:** Add `shadow-[var(--shadow-card)]` to the base classes.

**Toast.tsx:** Replace base class to include elevated shadow and animation:
```
'flex items-center gap-2 rounded-md border px-3 py-2 text-sm shadow-[var(--shadow-elevated)] toast-enter'
```

**Progress.tsx:** Add inset shadow to the track element. The progress background div should get:
```
'h-full rounded-full bg-accent transition-all duration-[var(--transition-normal)]'
```
And the track container should get `shadow-[var(--shadow-input-inset)]`.

- [ ] **Step 2: Restyle data display components**

**Table.tsx:** Add `hover:bg-hover transition-colors duration-[var(--transition-fast)]` to Row if not already there. Add subtle header background to Header: `bg-bg-secondary`.

**Badge.tsx:** Add `shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]` to base classes.

**Tag.tsx:** Add `transition-all duration-[var(--transition-fast)]` to the tag container.

**Avatar.tsx:** Add `shadow-[var(--shadow-card)] ring-1 ring-border-default` to avatar base.

**List.tsx:** Add `transition-colors duration-[var(--transition-fast)]` to Item.

**KeyValue.tsx:** No changes needed — the existing styling is sufficient.

**Skeleton.tsx:** No changes needed — animate-pulse is already refined.

- [ ] **Step 3: Restyle navigation components**

**Tabs.tsx:** Update the active tab indicator. Change the active tab button border-bottom to use a gradient effect:
```
border-b-2 border-accent
```
And add `transition-all duration-[var(--transition-fast)]` to all tab buttons.

**Link.tsx:** Add `transition-colors duration-[var(--transition-fast)]` to the base classes.

**Breadcrumb.tsx:** Add `transition-colors duration-[var(--transition-fast)]` to the clickable breadcrumb buttons.

**Pagination.tsx:** Apply the same button refinement treatment (focus glow, transitions) to prev/next buttons.

- [ ] **Step 4: Restyle typography and utility components**

**Heading.tsx:** Add `tracking-tight` to all heading level class mappings.

**Code.tsx:** Add `shadow-[var(--shadow-input-inset)]` to the block variant's `pre` element.

**Kbd.tsx:** Add `shadow-[inset_0_-1px_0_rgba(0,0,0,0.2)]` to create a subtle pressed-key effect.

**ResizeHandle.tsx:** Add `hover:bg-accent/20 active:bg-accent/30 transition-colors duration-[var(--transition-fast)]` to the handle element.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/primitives/feedback/ src/renderer/src/primitives/data-display/ src/renderer/src/primitives/navigation/ src/renderer/src/primitives/typography/ src/renderer/src/primitives/utilities/
git commit -m "feat: restyle feedback, data-display, navigation, typography, utility primitives"
```

---

## Task 8: Build NumberInput Component

**Files:**
- Create: `src/renderer/src/primitives/forms/NumberInput.tsx`

- [ ] **Step 1: Create NumberInput component**

```typescript
import React, { forwardRef, useState, useCallback, useRef, useEffect } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const numberInputVariants = cva(
  'flex items-center border bg-[linear-gradient(180deg,var(--color-input-gradient-top),var(--color-input-gradient-bottom)),var(--color-bg-tertiary)] text-text-primary shadow-[var(--shadow-input-inset)] transition-all duration-[var(--transition-fast)] focus-within:shadow-[var(--shadow-focus-glow),var(--shadow-input-inset)]',
  {
    variants: {
      size: {
        xs: 'h-6 text-xs rounded',
        sm: 'h-7 text-xs rounded',
        md: 'h-8 text-sm rounded-md',
        lg: 'h-9 text-sm rounded-md',
        xl: 'h-10 text-base rounded-lg',
      },
      error: {
        true: 'border-error focus-within:shadow-[0_0_0_3px_rgba(255,95,87,0.25),var(--shadow-input-inset)]',
        false: 'border-border-default hover:border-border-strong',
      },
    },
    defaultVariants: {
      size: 'md',
      error: false,
    },
  }
)

const stepperButtonClass =
  'flex items-center justify-center border-0 bg-transparent text-text-secondary hover:text-text-primary hover:bg-hover transition-colors duration-[var(--transition-fast)] disabled:opacity-50 disabled:pointer-events-none h-full px-2 select-none'

export interface NumberInputProps extends VariantProps<typeof numberInputVariants> {
  value?: number
  defaultValue?: number
  onChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  precision?: number
  disabled?: boolean
  className?: string
  placeholder?: string
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value: controlledValue,
      defaultValue = 0,
      onChange,
      min = -Infinity,
      max = Infinity,
      step = 1,
      precision,
      disabled,
      size,
      error,
      className,
      placeholder,
    },
    ref
  ) => {
    const isControlled = controlledValue !== undefined
    const [internalValue, setInternalValue] = useState(defaultValue)
    const [textValue, setTextValue] = useState('')
    const [isEditing, setIsEditing] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const currentValue = isControlled ? controlledValue : internalValue

    const formatValue = useCallback(
      (v: number) => (precision !== undefined ? v.toFixed(precision) : String(v)),
      [precision]
    )

    const clamp = useCallback(
      (v: number) => Math.min(max, Math.max(min, v)),
      [min, max]
    )

    const setValue = useCallback(
      (next: number) => {
        const clamped = clamp(next)
        if (!isControlled) setInternalValue(clamped)
        onChange?.(clamped)
      },
      [clamp, isControlled, onChange]
    )

    const increment = useCallback(() => setValue(currentValue + step), [currentValue, step, setValue])
    const decrement = useCallback(() => setValue(currentValue - step), [currentValue, step, setValue])

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setValue(currentValue + (e.shiftKey ? step * 10 : step))
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          setValue(currentValue - (e.shiftKey ? step * 10 : step))
        }
      },
      [currentValue, step, setValue]
    )

    const handleFocus = () => {
      setTextValue(formatValue(currentValue))
      setIsEditing(true)
    }

    const handleBlur = () => {
      const parsed = parseFloat(textValue)
      if (!isNaN(parsed)) setValue(parsed)
      setIsEditing(false)
    }

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setTextValue(e.target.value)
    }

    // Merge refs
    useEffect(() => {
      if (typeof ref === 'function') ref(inputRef.current)
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = inputRef.current
    }, [ref])

    return (
      <div className={cn(numberInputVariants({ size, error }), disabled && 'opacity-50 pointer-events-none', className)}>
        <button
          type="button"
          tabIndex={-1}
          className={cn(stepperButtonClass, 'border-r border-border-default rounded-l-[inherit]')}
          onClick={decrement}
          disabled={disabled || currentValue <= min}
          aria-label="Decrement"
        >
          −
        </button>
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          className="flex-1 h-full bg-transparent text-center font-mono outline-none min-w-0 text-inherit"
          value={isEditing ? textValue : formatValue(currentValue)}
          onChange={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          aria-valuenow={currentValue}
          aria-valuemin={min !== -Infinity ? min : undefined}
          aria-valuemax={max !== Infinity ? max : undefined}
          role="spinbutton"
        />
        <button
          type="button"
          tabIndex={-1}
          className={cn(stepperButtonClass, 'border-l border-border-default rounded-r-[inherit]')}
          onClick={increment}
          disabled={disabled || currentValue >= max}
          aria-label="Increment"
        >
          +
        </button>
      </div>
    )
  }
)

NumberInput.displayName = 'NumberInput'
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --project tsconfig.web.json 2>&1 | grep NumberInput`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/primitives/forms/NumberInput.tsx
git commit -m "feat: add NumberInput component with stepper and keyboard support"
```

---

## Task 9: Build SearchInput Component

**Files:**
- Create: `src/renderer/src/primitives/forms/SearchInput.tsx`

- [ ] **Step 1: Create SearchInput component**

```typescript
import React, { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const searchInputVariants = cva(
  'flex items-center gap-2 border bg-[linear-gradient(180deg,var(--color-input-gradient-top),var(--color-input-gradient-bottom)),var(--color-bg-tertiary)] text-text-primary shadow-[var(--shadow-input-inset)] transition-all duration-[var(--transition-fast)] focus-within:shadow-[var(--shadow-focus-glow),var(--shadow-input-inset)] border-border-default hover:border-border-strong',
  {
    variants: {
      size: {
        xs: 'h-6 px-2 text-xs rounded',
        sm: 'h-7 px-2 text-xs rounded',
        md: 'h-8 px-3 text-sm rounded-md',
        lg: 'h-9 px-3 text-sm rounded-md',
        xl: 'h-10 px-4 text-base rounded-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

export interface SearchInputProps extends VariantProps<typeof searchInputVariants> {
  value?: string
  defaultValue?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClear?: () => void
  shortcut?: string
  loading?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, defaultValue, onChange, onClear, shortcut, loading, disabled, placeholder = 'Search...', size, className, ...props }, ref) => {
    const hasValue = value !== undefined ? value.length > 0 : false

    return (
      <div className={cn(searchInputVariants({ size }), disabled && 'opacity-50 pointer-events-none', className)}>
        {loading ? (
          <svg className="h-4 w-4 animate-spin text-text-muted shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="h-4 w-4 text-text-muted shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        )}
        <input
          ref={ref}
          type="text"
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 h-full bg-transparent outline-none min-w-0 text-inherit placeholder:text-text-muted"
          {...props}
        />
        {hasValue && onClear && (
          <button
            type="button"
            tabIndex={-1}
            onClick={onClear}
            className="text-text-muted hover:text-text-primary transition-colors shrink-0"
            aria-label="Clear search"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
        {shortcut && (
          <kbd className="shrink-0 rounded bg-bg-elevated/50 px-1.5 py-0.5 text-[10px] font-mono text-text-muted border border-border-default">
            {shortcut}
          </kbd>
        )}
      </div>
    )
  }
)

SearchInput.displayName = 'SearchInput'
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/primitives/forms/SearchInput.tsx
git commit -m "feat: add SearchInput component with icon, clear, shortcut badge"
```

---

## Task 10: Build PasswordInput Component

**Files:**
- Create: `src/renderer/src/primitives/forms/PasswordInput.tsx`

- [ ] **Step 1: Create PasswordInput component**

```typescript
import React, { forwardRef, useState } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const passwordInputVariants = cva(
  'flex items-center gap-2 border bg-[linear-gradient(180deg,var(--color-input-gradient-top),var(--color-input-gradient-bottom)),var(--color-bg-tertiary)] text-text-primary shadow-[var(--shadow-input-inset)] transition-all duration-[var(--transition-fast)] focus-within:shadow-[var(--shadow-focus-glow),var(--shadow-input-inset)]',
  {
    variants: {
      size: {
        xs: 'h-6 px-2 text-xs rounded',
        sm: 'h-7 px-3 text-xs rounded',
        md: 'h-8 px-3 text-sm rounded-md',
        lg: 'h-9 px-3 text-sm rounded-md',
        xl: 'h-10 px-4 text-base rounded-lg',
      },
      error: {
        true: 'border-error focus-within:shadow-[0_0_0_3px_rgba(255,95,87,0.25),var(--shadow-input-inset)]',
        false: 'border-border-default hover:border-border-strong',
      },
    },
    defaultVariants: {
      size: 'md',
      error: false,
    },
  }
)

function getStrength(password: string): { label: string; percent: number; color: string } {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (score <= 1) return { label: 'Weak', percent: 25, color: 'bg-error' }
  if (score <= 2) return { label: 'Fair', percent: 50, color: 'bg-warning' }
  if (score <= 3) return { label: 'Strong', percent: 75, color: 'bg-info' }
  return { label: 'Very strong', percent: 100, color: 'bg-success' }
}

export interface PasswordInputProps extends VariantProps<typeof passwordInputVariants> {
  value?: string
  defaultValue?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  showStrength?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ value, defaultValue, onChange, showStrength, disabled, placeholder = 'Password', size, error, className, ...props }, ref) => {
    const [visible, setVisible] = useState(false)
    const [internalValue, setInternalValue] = useState(defaultValue ?? '')

    const currentValue = value ?? internalValue
    const strength = showStrength ? getStrength(currentValue) : null

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (value === undefined) setInternalValue(e.target.value)
      onChange?.(e)
    }

    return (
      <div className="flex flex-col gap-1.5">
        <div className={cn(passwordInputVariants({ size, error }), disabled && 'opacity-50 pointer-events-none', className)}>
          <input
            ref={ref}
            type={visible ? 'text' : 'password'}
            value={value}
            defaultValue={value === undefined ? defaultValue : undefined}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 h-full bg-transparent outline-none min-w-0 text-inherit placeholder:text-text-muted"
            {...props}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible(!visible)}
            className="text-text-muted hover:text-text-primary transition-colors shrink-0"
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        {strength && currentValue.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full bg-bg-tertiary overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-[var(--transition-normal)]', strength.color)}
                style={{ width: `${strength.percent}%` }}
              />
            </div>
            <span className="text-[10px] text-text-muted">{strength.label}</span>
          </div>
        )}
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/primitives/forms/PasswordInput.tsx
git commit -m "feat: add PasswordInput component with visibility toggle and strength meter"
```

---

## Task 11: Build TagsInput Component

**Files:**
- Create: `src/renderer/src/primitives/forms/TagsInput.tsx`

- [ ] **Step 1: Create TagsInput component**

```typescript
import React, { forwardRef, useState, useCallback, useRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const tagsInputVariants = cva(
  'flex items-center flex-wrap gap-1 border bg-[linear-gradient(180deg,var(--color-input-gradient-top),var(--color-input-gradient-bottom)),var(--color-bg-tertiary)] text-text-primary shadow-[var(--shadow-input-inset)] transition-all duration-[var(--transition-fast)] focus-within:shadow-[var(--shadow-focus-glow),var(--shadow-input-inset)] border-border-default hover:border-border-strong',
  {
    variants: {
      size: {
        xs: 'min-h-6 px-1.5 py-0.5 text-xs rounded',
        sm: 'min-h-7 px-2 py-0.5 text-xs rounded',
        md: 'min-h-8 px-2 py-1 text-sm rounded-md',
        lg: 'min-h-9 px-3 py-1 text-sm rounded-md',
        xl: 'min-h-10 px-3 py-1.5 text-base rounded-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

export interface TagsInputProps extends VariantProps<typeof tagsInputVariants> {
  value?: string[]
  defaultValue?: string[]
  onChange?: (tags: string[]) => void
  maxTags?: number
  allowDuplicates?: boolean
  validate?: (tag: string) => boolean
  disabled?: boolean
  placeholder?: string
  className?: string
}

export const TagsInput = forwardRef<HTMLInputElement, TagsInputProps>(
  (
    {
      value: controlledValue,
      defaultValue = [],
      onChange,
      maxTags,
      allowDuplicates = false,
      validate,
      disabled,
      placeholder = 'Add tag...',
      size,
      className,
    },
    ref
  ) => {
    const isControlled = controlledValue !== undefined
    const [internalTags, setInternalTags] = useState(defaultValue)
    const [inputValue, setInputValue] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    const tags = isControlled ? controlledValue : internalTags

    const setTags = useCallback(
      (next: string[]) => {
        if (!isControlled) setInternalTags(next)
        onChange?.(next)
      },
      [isControlled, onChange]
    )

    const addTag = useCallback(
      (raw: string) => {
        const tag = raw.trim()
        if (!tag) return
        if (maxTags && tags.length >= maxTags) return
        if (!allowDuplicates && tags.includes(tag)) return
        if (validate && !validate(tag)) return
        setTags([...tags, tag])
        setInputValue('')
      },
      [tags, maxTags, allowDuplicates, validate, setTags]
    )

    const removeTag = useCallback(
      (index: number) => {
        setTags(tags.filter((_, i) => i !== index))
      },
      [tags, setTags]
    )

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
        e.preventDefault()
        addTag(inputValue)
      } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
        removeTag(tags.length - 1)
      }
    }

    // Merge refs
    const mergedRef = (el: HTMLInputElement | null) => {
      (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el
      if (typeof ref === 'function') ref(el)
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = el
    }

    return (
      <div
        className={cn(tagsInputVariants({ size }), disabled && 'opacity-50 pointer-events-none', className)}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 rounded bg-accent-muted text-accent border border-accent/20 px-1.5 py-0.5 text-[11px] leading-tight"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation()
                  removeTag(i)
                }}
                className="opacity-60 hover:opacity-100 transition-opacity"
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            )}
          </span>
        ))}
        <input
          ref={mergedRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          disabled={disabled || (maxTags !== undefined && tags.length >= maxTags)}
          className="flex-1 h-full bg-transparent outline-none min-w-[60px] text-inherit placeholder:text-text-muted"
        />
      </div>
    )
  }
)

TagsInput.displayName = 'TagsInput'
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/primitives/forms/TagsInput.tsx
git commit -m "feat: add TagsInput component with add/remove and validation"
```

---

## Task 12: Build DatePicker Component

**Files:**
- Create: `src/renderer/src/primitives/forms/DatePicker.tsx`

- [ ] **Step 1: Create DatePicker component**

```typescript
import React, { forwardRef, useState, useCallback, useRef, useEffect } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const dateInputVariants = cva(
  'flex items-center gap-2 border bg-[linear-gradient(180deg,var(--color-input-gradient-top),var(--color-input-gradient-bottom)),var(--color-bg-tertiary)] text-text-primary shadow-[var(--shadow-input-inset)] transition-all duration-[var(--transition-fast)] focus-within:shadow-[var(--shadow-focus-glow),var(--shadow-input-inset)] border-border-default hover:border-border-strong',
  {
    variants: {
      size: {
        xs: 'h-6 px-2 text-xs rounded',
        sm: 'h-7 px-2 text-xs rounded',
        md: 'h-8 px-3 text-sm rounded-md',
        lg: 'h-9 px-3 text-sm rounded-md',
        xl: 'h-10 px-4 text-base rounded-lg',
      },
    },
    defaultVariants: { size: 'md' },
  }
)

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseDate(s: string): Date | null {
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const d = new Date(+match[1], +match[2] - 1, +match[3])
  return isNaN(d.getTime()) ? null : d
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export interface DatePickerProps extends VariantProps<typeof dateInputVariants> {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  min?: string
  max?: string
  disabled?: boolean
  placeholder?: string
  className?: string
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ value: controlledValue, defaultValue, onChange, min, max, disabled, placeholder = 'YYYY-MM-DD', size, className }, ref) => {
    const isControlled = controlledValue !== undefined
    const [internalValue, setInternalValue] = useState(defaultValue ?? '')
    const [textValue, setTextValue] = useState('')
    const [isEditing, setIsEditing] = useState(false)
    const [showCalendar, setShowCalendar] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const currentValue = isControlled ? controlledValue : internalValue
    const currentDate = parseDate(currentValue) ?? new Date()
    const [viewYear, setViewYear] = useState(currentDate.getFullYear())
    const [viewMonth, setViewMonth] = useState(currentDate.getMonth())

    const setValue = useCallback(
      (v: string) => {
        if (!isControlled) setInternalValue(v)
        onChange?.(v)
      },
      [isControlled, onChange]
    )

    const selectDay = useCallback(
      (day: number) => {
        const d = new Date(viewYear, viewMonth, day)
        setValue(formatDate(d))
        setShowCalendar(false)
      },
      [viewYear, viewMonth, setValue]
    )

    const handleBlur = () => {
      setIsEditing(false)
      const d = parseDate(textValue)
      if (d) setValue(formatDate(d))
    }

    const handleFocus = () => {
      setTextValue(currentValue)
      setIsEditing(true)
    }

    const isDateDisabled = useCallback(
      (day: number) => {
        const dateStr = formatDate(new Date(viewYear, viewMonth, day))
        if (min && dateStr < min) return true
        if (max && dateStr > max) return true
        return false
      },
      [viewYear, viewMonth, min, max]
    )

    // Close calendar on outside click
    useEffect(() => {
      if (!showCalendar) return
      const handler = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setShowCalendar(false)
        }
      }
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }, [showCalendar])

    const daysInMonth = getDaysInMonth(viewYear, viewMonth)
    const firstDay = getFirstDayOfWeek(viewYear, viewMonth)
    const selectedDateStr = currentValue

    const prevMonth = () => {
      if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11) }
      else setViewMonth(viewMonth - 1)
    }
    const nextMonth = () => {
      if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0) }
      else setViewMonth(viewMonth + 1)
    }

    return (
      <div ref={containerRef} className="relative">
        <div className={cn(dateInputVariants({ size }), disabled && 'opacity-50 pointer-events-none', className)}>
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowCalendar(!showCalendar)}
            className="text-text-muted hover:text-text-primary transition-colors shrink-0"
            aria-label="Toggle calendar"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </button>
          <input
            ref={ref}
            type="text"
            value={isEditing ? textValue : currentValue}
            onChange={(e) => setTextValue(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 h-full bg-transparent outline-none min-w-0 font-mono text-inherit placeholder:text-text-muted"
          />
        </div>

        {showCalendar && (
          <div className="absolute top-full left-0 mt-1 z-50 rounded-md border border-border-default bg-bg-secondary shadow-[var(--shadow-dropdown)] p-3 w-[260px]">
            <div className="flex items-center justify-between mb-2">
              <button type="button" onClick={prevMonth} className="p-1 hover:bg-hover rounded text-text-secondary transition-colors" aria-label="Previous month">‹</button>
              <span className="text-sm font-medium text-text-primary">{MONTH_NAMES[viewMonth]} {viewYear}</span>
              <button type="button" onClick={nextMonth} className="p-1 hover:bg-hover rounded text-text-secondary transition-colors" aria-label="Next month">›</button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center text-[11px] text-text-muted mb-1">
              {DAY_HEADERS.map((d) => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const dateStr = formatDate(new Date(viewYear, viewMonth, day))
                const isSelected = dateStr === selectedDateStr
                const isToday = dateStr === formatDate(new Date())
                const isDisabled = isDateDisabled(day)

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => !isDisabled && selectDay(day)}
                    disabled={isDisabled}
                    className={cn(
                      'h-7 w-7 rounded text-xs transition-colors',
                      isSelected && 'bg-accent text-white',
                      !isSelected && isToday && 'border border-accent text-accent',
                      !isSelected && !isToday && 'hover:bg-hover text-text-primary',
                      isDisabled && 'opacity-30 pointer-events-none'
                    )}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => { const today = new Date(); setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); selectDay(today.getDate()) }}
              className="mt-2 w-full text-xs text-accent hover:underline"
            >
              Today
            </button>
          </div>
        )}
      </div>
    )
  }
)

DatePicker.displayName = 'DatePicker'
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/primitives/forms/DatePicker.tsx
git commit -m "feat: add DatePicker component with calendar popover"
```

---

## Task 13: Build ColorInput Component

**Files:**
- Create: `src/renderer/src/primitives/forms/ColorInput.tsx`

- [ ] **Step 1: Create ColorInput component**

```typescript
import React, { forwardRef, useState, useRef, useEffect } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const colorInputVariants = cva(
  'flex items-center gap-2 border bg-[linear-gradient(180deg,var(--color-input-gradient-top),var(--color-input-gradient-bottom)),var(--color-bg-tertiary)] text-text-primary shadow-[var(--shadow-input-inset)] transition-all duration-[var(--transition-fast)] focus-within:shadow-[var(--shadow-focus-glow),var(--shadow-input-inset)] border-border-default hover:border-border-strong',
  {
    variants: {
      size: {
        xs: 'h-6 px-2 text-xs rounded',
        sm: 'h-7 px-2 text-xs rounded',
        md: 'h-8 px-3 text-sm rounded-md',
        lg: 'h-9 px-3 text-sm rounded-md',
        xl: 'h-10 px-4 text-base rounded-lg',
      },
    },
    defaultVariants: { size: 'md' },
  }
)

function isValidHex(s: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s)
}

export interface ColorInputProps extends VariantProps<typeof colorInputVariants> {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  presets?: string[]
  showPicker?: boolean
  disabled?: boolean
  className?: string
}

export const ColorInput = forwardRef<HTMLInputElement, ColorInputProps>(
  ({ value: controlledValue, defaultValue = '#7c6ff7', onChange, presets, showPicker = true, disabled, size, className }, ref) => {
    const isControlled = controlledValue !== undefined
    const [internalValue, setInternalValue] = useState(defaultValue)
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const currentValue = isControlled ? controlledValue : internalValue

    const setValue = (v: string) => {
      if (!isControlled) setInternalValue(v)
      onChange?.(v)
    }

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      // Allow typing — validate on blur
      if (!isControlled) setInternalValue(raw)
      if (isValidHex(raw)) onChange?.(raw)
    }

    const handleBlur = () => {
      // Normalize on blur
      if (!isValidHex(currentValue)) {
        setValue(defaultValue)
      }
    }

    // Close picker on outside click
    useEffect(() => {
      if (!isOpen) return
      const handler = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false)
        }
      }
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }, [isOpen])

    return (
      <div ref={containerRef} className="relative">
        <div className={cn(colorInputVariants({ size }), disabled && 'opacity-50 pointer-events-none', className)}>
          <button
            type="button"
            tabIndex={-1}
            onClick={() => showPicker && setIsOpen(!isOpen)}
            className="shrink-0"
            aria-label="Pick color"
          >
            <div
              className="w-5 h-5 rounded border border-border-default"
              style={{ backgroundColor: isValidHex(currentValue) ? currentValue : defaultValue }}
            />
          </button>
          <input
            ref={ref}
            type="text"
            value={currentValue}
            onChange={handleTextChange}
            onBlur={handleBlur}
            disabled={disabled}
            className="flex-1 h-full bg-transparent outline-none min-w-0 font-mono text-inherit"
            maxLength={7}
          />
        </div>

        {isOpen && showPicker && (
          <div className="absolute top-full left-0 mt-1 z-50 rounded-md border border-border-default bg-bg-secondary shadow-[var(--shadow-dropdown)] p-3 w-[200px]">
            <input
              type="color"
              value={isValidHex(currentValue) ? currentValue : defaultValue}
              onChange={(e) => setValue(e.target.value)}
              className="w-full h-32 rounded border-0 cursor-pointer bg-transparent"
            />
            {presets && presets.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {presets.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => { setValue(color); setIsOpen(false) }}
                    className={cn(
                      'w-6 h-6 rounded border transition-all',
                      currentValue === color ? 'border-accent scale-110' : 'border-border-default hover:scale-110'
                    )}
                    style={{ backgroundColor: color }}
                    aria-label={`Select ${color}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
)

ColorInput.displayName = 'ColorInput'
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/primitives/forms/ColorInput.tsx
git commit -m "feat: add ColorInput component with swatch, hex input, and picker"
```

---

## Task 14: Export New Input Components

**Files:**
- Modify: `src/renderer/src/primitives/forms/index.ts`

- [ ] **Step 1: Add exports for all 6 new components**

Append to the end of the file:

```typescript
export { NumberInput } from './NumberInput'
export type { NumberInputProps } from './NumberInput'

export { SearchInput } from './SearchInput'
export type { SearchInputProps } from './SearchInput'

export { PasswordInput } from './PasswordInput'
export type { PasswordInputProps } from './PasswordInput'

export { TagsInput } from './TagsInput'
export type { TagsInputProps } from './TagsInput'

export { DatePicker } from './DatePicker'
export type { DatePickerProps } from './DatePicker'

export { ColorInput } from './ColorInput'
export type { ColorInputProps } from './ColorInput'
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --project tsconfig.web.json 2>&1 | tail -5`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/primitives/forms/index.ts
git commit -m "feat: export all new custom input components from forms barrel"
```

---

## Task 15: Create Monaco Theme Definitions

**Files:**
- Create: `src/renderer/src/lib/monaco-themes.ts`

- [ ] **Step 1: Create monaco-themes.ts**

```typescript
import type { Monaco } from '@monaco-editor/react'

interface ThemeDef {
  base: 'vs' | 'vs-dark'
  colors: Record<string, string>
  rules: Array<{ token: string; foreground: string; fontStyle?: string }>
}

const themes: Record<string, ThemeDef> = {
  'dbterm-dark': {
    base: 'vs-dark',
    colors: {
      'editor.background': '#0d0d1a',
      'editor.foreground': '#ffffff',
      'editor.lineHighlightBackground': '#ffffff0d',
      'editor.selectionBackground': '#7c6ff740',
      'editorLineNumber.foreground': '#666666',
      'editorCursor.foreground': '#7c6ff7',
      'editor.selectionHighlightBackground': '#7c6ff720',
      'editorBracketMatch.background': '#7c6ff730',
      'editorBracketMatch.border': '#7c6ff750',
    },
    rules: [
      { token: 'keyword', foreground: '#c678dd' },
      { token: 'string', foreground: '#98c379' },
      { token: 'number', foreground: '#d19a66' },
      { token: 'comment', foreground: '#5c6370', fontStyle: 'italic' },
      { token: 'type', foreground: '#e5c07b' },
      { token: 'identifier', foreground: '#61afef' },
      { token: 'operator', foreground: '#56b6c2' },
      { token: 'delimiter', foreground: '#abb2bf' },
    ],
  },

  'dbterm-light': {
    base: 'vs',
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#0d0d1a',
      'editor.lineHighlightBackground': '#0000000a',
      'editor.selectionBackground': '#7c6ff730',
      'editorLineNumber.foreground': '#888888',
      'editorCursor.foreground': '#7c6ff7',
      'editor.selectionHighlightBackground': '#7c6ff715',
      'editorBracketMatch.background': '#7c6ff720',
      'editorBracketMatch.border': '#7c6ff740',
    },
    rules: [
      { token: 'keyword', foreground: '#a626a4' },
      { token: 'string', foreground: '#50a14f' },
      { token: 'number', foreground: '#986801' },
      { token: 'comment', foreground: '#a0a1a7', fontStyle: 'italic' },
      { token: 'type', foreground: '#c18401' },
      { token: 'identifier', foreground: '#4078f2' },
      { token: 'operator', foreground: '#0184bc' },
      { token: 'delimiter', foreground: '#383a42' },
    ],
  },

  'dbterm-midnight': {
    base: 'vs-dark',
    colors: {
      'editor.background': '#0a0a12',
      'editor.foreground': '#e0e0f0',
      'editor.lineHighlightBackground': '#ffffff0a',
      'editor.selectionBackground': '#8b7cf840',
      'editorLineNumber.foreground': '#555578',
      'editorCursor.foreground': '#8b7cf8',
      'editor.selectionHighlightBackground': '#8b7cf820',
      'editorBracketMatch.background': '#8b7cf830',
      'editorBracketMatch.border': '#8b7cf850',
    },
    rules: [
      { token: 'keyword', foreground: '#c678dd' },
      { token: 'string', foreground: '#98c379' },
      { token: 'number', foreground: '#d19a66' },
      { token: 'comment', foreground: '#555578', fontStyle: 'italic' },
      { token: 'type', foreground: '#e5c07b' },
      { token: 'identifier', foreground: '#61afef' },
      { token: 'operator', foreground: '#56b6c2' },
      { token: 'delimiter', foreground: '#a0a0c0' },
    ],
  },

  'dbterm-dracula': {
    base: 'vs-dark',
    colors: {
      'editor.background': '#282a36',
      'editor.foreground': '#f8f8f2',
      'editor.lineHighlightBackground': '#ffffff0a',
      'editor.selectionBackground': '#bd93f940',
      'editorLineNumber.foreground': '#6272a4',
      'editorCursor.foreground': '#f8f8f2',
      'editor.selectionHighlightBackground': '#bd93f920',
      'editorBracketMatch.background': '#bd93f930',
      'editorBracketMatch.border': '#bd93f950',
    },
    rules: [
      { token: 'keyword', foreground: '#ff79c6' },
      { token: 'string', foreground: '#f1fa8c' },
      { token: 'number', foreground: '#bd93f9' },
      { token: 'comment', foreground: '#6272a4', fontStyle: 'italic' },
      { token: 'type', foreground: '#8be9fd', fontStyle: 'italic' },
      { token: 'identifier', foreground: '#50fa7b' },
      { token: 'operator', foreground: '#ff79c6' },
      { token: 'delimiter', foreground: '#f8f8f2' },
    ],
  },

  'dbterm-nord': {
    base: 'vs-dark',
    colors: {
      'editor.background': '#2e3440',
      'editor.foreground': '#d8dee9',
      'editor.lineHighlightBackground': '#ffffff08',
      'editor.selectionBackground': '#88c0d040',
      'editorLineNumber.foreground': '#4c566a',
      'editorCursor.foreground': '#d8dee9',
      'editor.selectionHighlightBackground': '#88c0d020',
      'editorBracketMatch.background': '#88c0d030',
      'editorBracketMatch.border': '#88c0d050',
    },
    rules: [
      { token: 'keyword', foreground: '#81a1c1' },
      { token: 'string', foreground: '#a3be8c' },
      { token: 'number', foreground: '#b48ead' },
      { token: 'comment', foreground: '#4c566a', fontStyle: 'italic' },
      { token: 'type', foreground: '#8fbcbb' },
      { token: 'identifier', foreground: '#88c0d0' },
      { token: 'operator', foreground: '#81a1c1' },
      { token: 'delimiter', foreground: '#eceff4' },
    ],
  },

  'dbterm-solarized': {
    base: 'vs-dark',
    colors: {
      'editor.background': '#002b36',
      'editor.foreground': '#839496',
      'editor.lineHighlightBackground': '#ffffff08',
      'editor.selectionBackground': '#268bd240',
      'editorLineNumber.foreground': '#586e75',
      'editorCursor.foreground': '#839496',
      'editor.selectionHighlightBackground': '#268bd220',
      'editorBracketMatch.background': '#268bd230',
      'editorBracketMatch.border': '#268bd250',
    },
    rules: [
      { token: 'keyword', foreground: '#859900' },
      { token: 'string', foreground: '#2aa198' },
      { token: 'number', foreground: '#d33682' },
      { token: 'comment', foreground: '#586e75', fontStyle: 'italic' },
      { token: 'type', foreground: '#b58900' },
      { token: 'identifier', foreground: '#268bd2' },
      { token: 'operator', foreground: '#859900' },
      { token: 'delimiter', foreground: '#93a1a1' },
    ],
  },

  'dbterm-catppuccin': {
    base: 'vs-dark',
    colors: {
      'editor.background': '#1e1e2e',
      'editor.foreground': '#cdd6f4',
      'editor.lineHighlightBackground': '#ffffff08',
      'editor.selectionBackground': '#cba6f740',
      'editorLineNumber.foreground': '#585b70',
      'editorCursor.foreground': '#f5e0dc',
      'editor.selectionHighlightBackground': '#cba6f720',
      'editorBracketMatch.background': '#cba6f730',
      'editorBracketMatch.border': '#cba6f750',
    },
    rules: [
      { token: 'keyword', foreground: '#cba6f7' },
      { token: 'string', foreground: '#a6e3a1' },
      { token: 'number', foreground: '#fab387' },
      { token: 'comment', foreground: '#585b70', fontStyle: 'italic' },
      { token: 'type', foreground: '#f9e2af' },
      { token: 'identifier', foreground: '#89b4fa' },
      { token: 'operator', foreground: '#89dceb' },
      { token: 'delimiter', foreground: '#bac2de' },
    ],
  },
}

const APP_TO_MONACO: Record<string, string> = {
  dark: 'dbterm-dark',
  light: 'dbterm-light',
  midnight: 'dbterm-midnight',
  dracula: 'dbterm-dracula',
  nord: 'dbterm-nord',
  solarized: 'dbterm-solarized',
  catppuccin: 'dbterm-catppuccin',
}

let defined = false

export function defineAppThemes(monaco: Monaco): void {
  if (defined) return
  for (const [name, def] of Object.entries(themes)) {
    monaco.editor.defineTheme(name, {
      base: def.base,
      inherit: true,
      colors: def.colors,
      rules: def.rules,
    })
  }
  defined = true
}

export function getMonacoThemeName(appTheme: string): string {
  return APP_TO_MONACO[appTheme] ?? 'dbterm-dark'
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/lib/monaco-themes.ts
git commit -m "feat: add Monaco theme definitions for all 7 app themes"
```

---

## Task 16: Integrate Monaco Theming Into QueryEditor

**Files:**
- Modify: `src/renderer/src/components/query/QueryEditor.tsx`

- [ ] **Step 1: Update QueryEditor to use dynamic theming**

Add imports at the top:

```typescript
import { defineAppThemes, getMonacoThemeName } from '@/lib/monaco-themes'
import { useTheme } from '@/primitives'
```

Inside the component, add theme hook:

```typescript
const { theme } = useTheme()
```

In `handleMount`, add `defineAppThemes(monaco)` call:

```typescript
const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor

    defineAppThemes(monaco)

    if (!completionRegistered && language === 'sql') {
      registerSqlCompletionProvider(monaco)
      completionRegistered = true
    }

    editor.addAction({
      id: 'execute-query',
      label: 'Execute Query',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => onExecute()
    })

    editor.focus()
  }, [onExecute, language])
```

Replace `theme="vs-dark"` with:

```typescript
theme={getMonacoThemeName(theme)}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --project tsconfig.web.json 2>&1 | grep -i "error" | head -5`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/query/QueryEditor.tsx
git commit -m "feat: integrate dynamic Monaco theming with app theme switching"
```

---

## Task 17: Clean Up All Existing Stories

**Files:**
- Modify: All 50 existing `.stories.tsx` files

This is the largest task. Each story file gets standardized to the Default/Variants/States pattern, removing Playground, AllVariants redundancy, and inconsistent naming.

- [ ] **Step 1: Clean up form stories**

For each form story file (`Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch`, `Slider`, `Label`, `FormField`, `IconButton`):

1. Rename `Playground` to `Default` (keep args, remove it being a separate interactive story)
2. Rename `AllVariants` to `Variants`
3. Merge separate `Sizes` stories into `Variants`
4. Keep `States` if it shows distinct states (disabled, error)
5. Remove any duplicate stories that show the same thing as `Variants`

Pattern for a form component story (e.g., Button):

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'Primitives/Forms/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['solid', 'outline', 'ghost', 'danger'] },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    disabled: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Default: Story = {
  args: { children: 'Button', variant: 'solid', size: 'md' },
}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(['solid', 'outline', 'ghost', 'danger'] as const).map((variant) => (
        <div key={variant} className="flex items-center gap-3">
          <span className="w-16 text-xs text-text-muted">{variant}</span>
          {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <Button key={size} variant={variant} size={size}>{size}</Button>
          ))}
        </div>
      ))}
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button>Default</Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
}
```

Apply this pattern to every form component. Key variations:
- **Input**: Default with placeholder, Variants for sizes, States for error + disabled
- **Textarea**: Same as Input
- **Select**: Default with sample options, Variants for sizes
- **Checkbox/Radio**: Default, States (checked, disabled, error)
- **Switch**: Default, States (on, off, disabled)
- **Slider**: Default with min/max
- **Label**: Default only (no variants)
- **FormField**: Default showing label + input + hint, WithError showing error state

- [ ] **Step 2: Clean up surface stories**

Apply same pattern to `Card`, `Panel`, `Modal`, `Sheet`, `Popover`, `DropdownMenu`, `ContextMenu`, `Tooltip`:

- Rename `Playground`/`Interactive`/`Example` → `Default`
- Interactive components (Modal, Sheet) keep `useState` in Default
- Card: Default, Variants (padding sizes)
- Tooltip: Default, Positions (top/bottom/left/right)

- [ ] **Step 3: Clean up feedback stories**

Apply pattern to `Alert`, `Banner`, `Toast`, `Spinner`, `Progress`:

- Alert: Default, Variants (all 5 types), WithTitle
- Toast: Default, Variants (all 5 types)
- Spinner: Default, Sizes
- Progress: Default, States (0%, 50%, 100%)

- [ ] **Step 4: Clean up data display stories**

Apply pattern to `Table`, `Badge`, `Tag`, `Avatar`, `List`, `KeyValue`, `EmptyState`, `Skeleton`:

- Table: Default (with sample data)
- Badge: Default, Variants (all colors × sizes)
- Avatar: Default, WithImage, WithInitials, Sizes

- [ ] **Step 5: Clean up navigation stories**

Apply pattern to `Tabs`, `Link`, `Breadcrumb`, `Pagination`:

- Tabs: Default (interactive with useState)
- Pagination: Default (interactive with useState)

- [ ] **Step 6: Clean up typography and layout stories**

Apply pattern to `Text`, `Heading`, `Code`, `Kbd`, and layout components:

- Text: Default, Variants (sizes × colors)
- Heading: Default, Levels (h1-h6)
- Layout stories: Default only (structural, minimal)

- [ ] **Step 7: Clean up utility stories**

ResizeHandle: Default (interactive), StatusBar story: Default

- [ ] **Step 8: Verify Storybook builds**

Run: `npx storybook build --quiet 2>&1 | tail -5`

Expected: Build completes without errors.

- [ ] **Step 9: Commit**

```bash
git add src/renderer/src/primitives/**/*.stories.tsx src/renderer/src/components/**/*.stories.tsx
git commit -m "refactor: standardize all stories to Default/Variants/States pattern"
```

---

## Task 18: Add Stories for Custom Input Components

**Files:**
- Create: `src/renderer/src/primitives/forms/NumberInput.stories.tsx`
- Create: `src/renderer/src/primitives/forms/SearchInput.stories.tsx`
- Create: `src/renderer/src/primitives/forms/PasswordInput.stories.tsx`
- Create: `src/renderer/src/primitives/forms/TagsInput.stories.tsx`
- Create: `src/renderer/src/primitives/forms/DatePicker.stories.tsx`
- Create: `src/renderer/src/primitives/forms/ColorInput.stories.tsx`

- [ ] **Step 1: Create NumberInput.stories.tsx**

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { NumberInput } from './NumberInput'

const meta: Meta<typeof NumberInput> = {
  title: 'Primitives/Forms/NumberInput',
  component: NumberInput,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    error: { control: 'boolean' },
    disabled: { control: 'boolean' },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    precision: { control: 'number' },
  },
}

export default meta
type Story = StoryObj<typeof NumberInput>

export const Default: Story = {
  args: { defaultValue: 42, min: 0, max: 100, step: 1, size: 'md' },
}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-48">
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <NumberInput key={size} size={size} defaultValue={10} min={0} max={99} />
      ))}
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-48">
      <NumberInput defaultValue={50} min={0} max={100} />
      <NumberInput defaultValue={50} min={0} max={100} error />
      <NumberInput defaultValue={50} min={0} max={100} disabled />
    </div>
  ),
}

export const WithPrecision: Story = {
  args: { defaultValue: 3.14, step: 0.01, precision: 2, size: 'md' },
}
```

- [ ] **Step 2: Create SearchInput.stories.tsx**

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { SearchInput } from './SearchInput'

const meta: Meta<typeof SearchInput> = {
  title: 'Primitives/Forms/SearchInput',
  component: SearchInput,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    shortcut: { control: 'text' },
  },
}

export default meta
type Story = StoryObj<typeof SearchInput>

export const Default: Story = {
  render: function Render() {
    const [value, setValue] = useState('')
    return (
      <div className="w-72">
        <SearchInput
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onClear={() => setValue('')}
          placeholder="Search tables..."
          shortcut="⌘K"
        />
      </div>
    )
  },
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-72">
      <SearchInput placeholder="Default" shortcut="⌘K" />
      <SearchInput placeholder="Loading..." loading />
      <SearchInput placeholder="Disabled" disabled />
    </div>
  ),
}
```

- [ ] **Step 3: Create PasswordInput.stories.tsx**

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { PasswordInput } from './PasswordInput'

const meta: Meta<typeof PasswordInput> = {
  title: 'Primitives/Forms/PasswordInput',
  component: PasswordInput,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    error: { control: 'boolean' },
    disabled: { control: 'boolean' },
    showStrength: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof PasswordInput>

export const Default: Story = {
  args: { placeholder: 'Enter password', size: 'md' },
}

export const WithStrengthMeter: Story = {
  args: { defaultValue: 'MyP@ss123', showStrength: true, size: 'md' },
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-64">
      <PasswordInput placeholder="Default" />
      <PasswordInput placeholder="Error" error />
      <PasswordInput placeholder="Disabled" disabled />
    </div>
  ),
}
```

- [ ] **Step 4: Create TagsInput.stories.tsx**

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { TagsInput } from './TagsInput'

const meta: Meta<typeof TagsInput> = {
  title: 'Primitives/Forms/TagsInput',
  component: TagsInput,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    maxTags: { control: 'number' },
    disabled: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof TagsInput>

export const Default: Story = {
  render: function Render() {
    const [tags, setTags] = useState(['users', 'orders'])
    return (
      <div className="w-80">
        <TagsInput value={tags} onChange={setTags} placeholder="Add table..." />
      </div>
    )
  },
}

export const WithMaxTags: Story = {
  args: { defaultValue: ['tag1', 'tag2'], maxTags: 3, placeholder: 'Max 3 tags' },
  decorators: [(Story) => <div className="w-80"><Story /></div>],
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-80">
      <TagsInput defaultValue={['active']} placeholder="Default" />
      <TagsInput defaultValue={['locked']} disabled />
    </div>
  ),
}
```

- [ ] **Step 5: Create DatePicker.stories.tsx**

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { DatePicker } from './DatePicker'

const meta: Meta<typeof DatePicker> = {
  title: 'Primitives/Forms/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    disabled: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof DatePicker>

export const Default: Story = {
  render: function Render() {
    const [value, setValue] = useState('2026-04-09')
    return (
      <div className="w-56">
        <DatePicker value={value} onChange={setValue} />
      </div>
    )
  },
}

export const WithConstraints: Story = {
  args: { defaultValue: '2026-04-09', min: '2026-01-01', max: '2026-12-31' },
  decorators: [(Story) => <div className="w-56"><Story /></div>],
}
```

- [ ] **Step 6: Create ColorInput.stories.tsx**

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { ColorInput } from './ColorInput'

const meta: Meta<typeof ColorInput> = {
  title: 'Primitives/Forms/ColorInput',
  component: ColorInput,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    disabled: { control: 'boolean' },
    showPicker: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof ColorInput>

export const Default: Story = {
  render: function Render() {
    const [color, setColor] = useState('#7c6ff7')
    return (
      <div className="w-48">
        <ColorInput value={color} onChange={setColor} />
      </div>
    )
  },
}

export const WithPresets: Story = {
  args: {
    defaultValue: '#7c6ff7',
    presets: ['#ff5555', '#50fa7b', '#f1fa8c', '#bd93f9', '#ff79c6', '#8be9fd', '#7c6ff7', '#61afef'],
  },
  decorators: [(Story) => <div className="w-48"><Story /></div>],
}
```

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/primitives/forms/*.stories.tsx
git commit -m "feat: add stories for all 6 custom input components"
```

---

## Task 19: Add Composition Stories and Editor Story

**Files:**
- Create: `src/renderer/src/primitives/patterns/ConnectionForm.stories.tsx`
- Create: `src/renderer/src/primitives/patterns/DataCard.stories.tsx`
- Create: `src/renderer/src/primitives/patterns/ConfirmDialog.stories.tsx`
- Create: `src/renderer/src/components/query/QueryEditor.stories.tsx`

- [ ] **Step 1: Create patterns directory**

Run: `mkdir -p src/renderer/src/primitives/patterns`

- [ ] **Step 2: Create ConnectionForm.stories.tsx**

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { FormField } from '../forms/FormField'
import { Input } from '../forms/Input'
import { PasswordInput } from '../forms/PasswordInput'
import { Select } from '../forms/Select'
import { Button } from '../forms/Button'
import { NumberInput } from '../forms/NumberInput'

const meta: Meta = {
  title: 'Patterns/ConnectionForm',
  tags: ['autodocs'],
}

export default meta

export const Default: StoryObj = {
  render: function Render() {
    const [dbType, setDbType] = useState('postgresql')
    return (
      <div className="w-96 rounded-lg border border-border-default bg-bg-secondary p-6 shadow-[var(--shadow-card)]">
        <h3 className="text-lg font-semibold text-text-primary mb-4">New Connection</h3>
        <div className="flex flex-col gap-4">
          <FormField label="Database Type">
            <Select value={dbType} onChange={(e) => setDbType(e.target.value)}>
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="sqlite">SQLite</option>
              <option value="mongodb">MongoDB</option>
            </Select>
          </FormField>
          <FormField label="Host">
            <Input placeholder="localhost" defaultValue="localhost" />
          </FormField>
          <FormField label="Port">
            <NumberInput defaultValue={5432} min={1} max={65535} />
          </FormField>
          <FormField label="Database">
            <Input placeholder="mydb" />
          </FormField>
          <FormField label="Username">
            <Input placeholder="postgres" />
          </FormField>
          <FormField label="Password">
            <PasswordInput placeholder="Enter password" showStrength />
          </FormField>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1">Test</Button>
            <Button variant="solid" className="flex-1">Connect</Button>
          </div>
        </div>
      </div>
    )
  },
}
```

- [ ] **Step 3: Create DataCard.stories.tsx**

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from '../data-display/Badge'
import { KeyValue } from '../data-display/KeyValue'
import { Table } from '../data-display/Table'

const meta: Meta = {
  title: 'Patterns/DataCard',
  tags: ['autodocs'],
}

export default meta

export const Default: StoryObj = {
  render: () => (
    <div className="w-[480px] rounded-lg border border-border-default bg-bg-secondary shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between p-4 border-b border-border-default">
        <h3 className="text-sm font-semibold text-text-primary">users</h3>
        <div className="flex gap-1.5">
          <Badge variant="accent">PostgreSQL</Badge>
          <Badge variant="success">Connected</Badge>
        </div>
      </div>
      <div className="p-4 border-b border-border-default">
        <KeyValue
          items={[
            { label: 'Rows', value: '12,847' },
            { label: 'Size', value: '4.2 MB' },
            { label: 'Last modified', value: '2026-04-09' },
          ]}
        />
      </div>
      <div className="p-4">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head>Column</Table.Head>
              <Table.Head>Type</Table.Head>
              <Table.Head>Nullable</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {[
              { col: 'id', type: 'serial', nullable: 'NO' },
              { col: 'name', type: 'varchar(255)', nullable: 'NO' },
              { col: 'email', type: 'varchar(255)', nullable: 'NO' },
              { col: 'created_at', type: 'timestamp', nullable: 'YES' },
            ].map((row) => (
              <Table.Row key={row.col}>
                <Table.Cell className="font-mono text-xs">{row.col}</Table.Cell>
                <Table.Cell className="text-text-secondary text-xs">{row.type}</Table.Cell>
                <Table.Cell className="text-xs">{row.nullable}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    </div>
  ),
}
```

- [ ] **Step 4: Create ConfirmDialog.stories.tsx**

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Modal } from '../surfaces/Modal'
import { Button } from '../forms/Button'
import { Text } from '../typography/Text'

const meta: Meta = {
  title: 'Patterns/ConfirmDialog',
  tags: ['autodocs'],
}

export default meta

export const Default: StoryObj = {
  render: function Render() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button variant="danger" onClick={() => setOpen(true)}>
          Drop Table
        </Button>
        <Modal open={open} onClose={() => setOpen(false)}>
          <div className="p-6 max-w-sm">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Drop Table?</h3>
            <Text size="sm" color="secondary">
              This will permanently delete the <strong>users</strong> table and all its data. This action cannot be undone.
            </Text>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={() => setOpen(false)}>Drop Table</Button>
            </div>
          </div>
        </Modal>
      </>
    )
  },
}
```

- [ ] **Step 5: Create QueryEditor.stories.tsx**

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { useRef, useCallback, useState, useEffect } from 'react'
import Editor, { type Monaco, type OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { defineAppThemes, getMonacoThemeName } from '@/lib/monaco-themes'

const meta: Meta = {
  title: 'Components/QueryEditor',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
}

export default meta

const SAMPLE_SQL = `-- Sample query: find active users with recent orders
SELECT
  u.id,
  u.name,
  u.email,
  COUNT(o.id) AS order_count,
  MAX(o.created_at) AS last_order
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE u.active = true
  AND u.created_at >= '2026-01-01'
GROUP BY u.id, u.name, u.email
HAVING COUNT(o.id) > 0
ORDER BY order_count DESC
LIMIT 50;`

const SAMPLE_JSON = `{
  "find": "users",
  "filter": { "active": true },
  "projection": { "name": 1, "email": 1 },
  "sort": { "created_at": -1 },
  "limit": 50
}`

export const Default: StoryObj = {
  render: function Render() {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
    const [language, setLanguage] = useState<'sql' | 'json' | 'plaintext'>('sql')
    const onExecute = fn()

    // Detect theme from data-theme attribute
    const [theme, setTheme] = useState(
      document.documentElement.getAttribute('data-theme') ?? 'dark'
    )

    useEffect(() => {
      const observer = new MutationObserver(() => {
        const t = document.documentElement.getAttribute('data-theme') ?? 'dark'
        setTheme(t)
      })
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
      return () => observer.disconnect()
    }, [])

    const handleMount: OnMount = useCallback((editor, monaco) => {
      editorRef.current = editor
      defineAppThemes(monaco)
      monaco.editor.setTheme(getMonacoThemeName(theme))

      editor.addAction({
        id: 'execute-query',
        label: 'Execute Query',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        run: () => onExecute(),
      })

      editor.focus()
    }, [onExecute, theme])

    // Update theme when it changes
    useEffect(() => {
      if (editorRef.current) {
        const monaco = (window as any).monaco
        if (monaco) monaco.editor.setTheme(getMonacoThemeName(theme))
      }
    }, [theme])

    const content = language === 'json' ? SAMPLE_JSON : language === 'plaintext' ? 'PING' : SAMPLE_SQL

    return (
      <div className="flex flex-col h-[500px] bg-bg-primary">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border-default bg-bg-secondary">
          <span className="text-xs text-text-muted">Language:</span>
          {(['sql', 'json', 'plaintext'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                language === lang
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-hover'
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
          <span className="flex-1" />
          <span className="text-[10px] text-text-muted">⌘+Enter to execute</span>
        </div>
        <div className="flex-1">
          <Editor
            language={language}
            value={content}
            theme={getMonacoThemeName(theme)}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              padding: { top: 8, bottom: 8 },
              renderLineHighlight: 'line',
              suggestOnTriggerCharacters: true,
              quickSuggestions: true,
              scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
            }}
            onMount={handleMount}
          />
        </div>
      </div>
    )
  },
}
```

- [ ] **Step 6: Verify Storybook builds**

Run: `npx storybook build --quiet 2>&1 | tail -5`

Expected: Build completes without errors.

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/primitives/patterns/ src/renderer/src/components/query/QueryEditor.stories.tsx
git commit -m "feat: add composition stories (ConnectionForm, DataCard, ConfirmDialog) and QueryEditor story"
```

---

## Task 20: Final Verification

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit --project tsconfig.web.json 2>&1 | tail -10`

Expected: No errors.

- [ ] **Step 2: Run Storybook build**

Run: `npx storybook build --quiet 2>&1 | tail -10`

Expected: Build succeeds.

- [ ] **Step 3: Run existing tests**

Run: `npx vitest run 2>&1 | tail -20`

Expected: All existing tests pass.

- [ ] **Step 4: Final commit if any fixes needed**

Only if Steps 1-3 revealed issues that needed fixing:

```bash
git add -A
git commit -m "fix: resolve build/test issues from design system refresh"
```
