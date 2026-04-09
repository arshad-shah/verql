# Checkbox & Radio Primitives Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace browser-default Checkbox and Radio with fully custom-rendered controls using `appearance-none` + CSS pseudo-elements, matching the design system's visual language.

**Architecture:** Both components use hidden native `<input>` with `appearance-none` and Tailwind `before:` pseudo-elements for indicators (checkmark for Checkbox, dot for Radio). Same pattern as the existing Switch primitive. API surface unchanged.

**Tech Stack:** React 19, Tailwind CSS, class-variance-authority (not used — single size), forwardRef

---

### Task 1: Rewrite Checkbox Component

**Files:**
- Modify: `src/renderer/src/primitives/forms/Checkbox.tsx`

- [ ] **Step 1: Rewrite Checkbox.tsx with custom rendering**

Replace the entire component with:

```tsx
import React, { forwardRef } from 'react'
import { cn } from '../utils/cn'

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        ref={ref}
        className={cn(
          // Base: 16x16 box, hidden native appearance
          'relative h-4 w-4 cursor-pointer appearance-none rounded border border-border-default',
          'bg-[linear-gradient(180deg,var(--color-input-gradient-top),var(--color-input-gradient-bottom)),var(--color-bg-tertiary)]',
          'shadow-[var(--shadow-input-inset)]',
          'transition-all duration-[var(--transition-fast)]',
          // Hover
          'hover:border-border-strong',
          // Checked
          'checked:bg-accent checked:border-accent checked:shadow-none',
          'checked:hover:brightness-110',
          // Focus
          'focus:outline-none focus:shadow-[var(--shadow-focus-glow)]',
          'checked:focus:shadow-[var(--shadow-focus-glow)]',
          // Disabled
          'disabled:pointer-events-none disabled:opacity-50',
          // Checkmark pseudo-element (CSS border trick)
          'before:absolute before:left-1/2 before:top-1/2 before:-translate-x-1/2 before:-translate-y-[60%]',
          'before:h-[8px] before:w-[5px] before:rotate-45',
          'before:border-b-2 before:border-r-2 before:border-white',
          'before:opacity-0 before:scale-0',
          'before:transition-all before:duration-[var(--transition-fast)]',
          // Checkmark visible on checked
          'checked:before:opacity-100 checked:before:scale-100',
          className
        )}
        {...props}
      />
    )
  }
)

Checkbox.displayName = 'Checkbox'
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/primitives/forms/Checkbox.tsx
git commit -m "feat: rewrite Checkbox with custom appearance-none rendering"
```

---

### Task 2: Rewrite Radio Component

**Files:**
- Modify: `src/renderer/src/primitives/forms/Radio.tsx`

- [ ] **Step 1: Rewrite Radio.tsx with custom rendering**

Replace the entire component with:

```tsx
import React, { forwardRef } from 'react'
import { cn } from '../utils/cn'

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="radio"
        ref={ref}
        className={cn(
          // Base: 16x16 circle, hidden native appearance
          'relative h-4 w-4 cursor-pointer appearance-none rounded-full border border-border-default',
          'bg-[linear-gradient(180deg,var(--color-input-gradient-top),var(--color-input-gradient-bottom)),var(--color-bg-tertiary)]',
          'shadow-[var(--shadow-input-inset)]',
          'transition-all duration-[var(--transition-fast)]',
          // Hover
          'hover:border-border-strong',
          // Checked
          'checked:bg-accent checked:border-accent checked:shadow-none',
          'checked:hover:brightness-110',
          // Focus
          'focus:outline-none focus:shadow-[var(--shadow-focus-glow)]',
          'checked:focus:shadow-[var(--shadow-focus-glow)]',
          // Disabled
          'disabled:pointer-events-none disabled:opacity-50',
          // Dot pseudo-element
          'before:absolute before:left-1/2 before:top-1/2 before:-translate-x-1/2 before:-translate-y-1/2',
          'before:h-1.5 before:w-1.5 before:rounded-full before:bg-white',
          'before:opacity-0 before:scale-0',
          'before:transition-all before:duration-[var(--transition-fast)]',
          // Dot visible on checked
          'checked:before:opacity-100 checked:before:scale-100',
          className
        )}
        {...props}
      />
    )
  }
)

Radio.displayName = 'Radio'
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/primitives/forms/Radio.tsx
git commit -m "feat: rewrite Radio with custom appearance-none rendering"
```

---

### Task 3: Update Checkbox Stories

**Files:**
- Modify: `src/renderer/src/primitives/forms/Checkbox.stories.tsx`

- [ ] **Step 1: Rewrite Checkbox stories**

Replace the entire file with:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, expect, userEvent } from 'storybook/test'
import { Checkbox } from './Checkbox'

const meta: Meta<typeof Checkbox> = {
  title: 'Primitives/Forms/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  argTypes: {
    disabled: { control: 'boolean' },
    defaultChecked: { control: 'boolean' },
  },
}
export default meta
type Story = StoryObj<typeof Checkbox>

export const Default: Story = {
  args: { onChange: fn() },
  play: async ({ args, canvas }) => {
    const checkbox = canvas.getByRole('checkbox')
    await userEvent.click(checkbox)
    await expect(args.onChange).toHaveBeenCalledOnce()
  },
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {[
        { label: 'Unchecked', defaultChecked: false },
        { label: 'Checked', defaultChecked: true },
        { label: 'Disabled', disabled: true },
        { label: 'Disabled + checked', defaultChecked: true, disabled: true },
      ].map(({ label, ...props }) => (
        <label key={label} className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
          <Checkbox {...props} />
          {label}
        </label>
      ))}
    </div>
  ),
}
```

- [ ] **Step 2: Run story tests**

Use the `run-story-tests` MCP tool with stories filter for `Primitives/Forms/Checkbox`.
Expected: All tests pass, no accessibility violations.

- [ ] **Step 3: Preview stories**

Use the `preview-stories` MCP tool to get preview URLs for the Checkbox stories. Share URLs with user for visual verification.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/primitives/forms/Checkbox.stories.tsx
git commit -m "feat: update Checkbox stories for custom-rendered design"
```

---

### Task 4: Update Radio Stories

**Files:**
- Modify: `src/renderer/src/primitives/forms/Radio.stories.tsx`

- [ ] **Step 1: Rewrite Radio stories**

Replace the entire file with:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, expect, userEvent } from 'storybook/test'
import { Radio } from './Radio'

const meta: Meta<typeof Radio> = {
  title: 'Primitives/Forms/Radio',
  component: Radio,
  tags: ['autodocs'],
  argTypes: {
    disabled: { control: 'boolean' },
  },
}
export default meta
type Story = StoryObj<typeof Radio>

export const Default: Story = {
  args: {
    name: 'default',
    value: 'option',
    onChange: fn(),
  },
  play: async ({ args, canvas }) => {
    const radio = canvas.getByRole('radio')
    await userEvent.click(radio)
    await expect(args.onChange).toHaveBeenCalledOnce()
  },
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {[
        { label: 'Unselected', name: 'states', value: 'a' },
        { label: 'Selected', name: 'states', value: 'b', defaultChecked: true },
        { label: 'Disabled', name: 'states-disabled', value: 'c', disabled: true },
        { label: 'Disabled + selected', name: 'states-disabled-sel', value: 'd', defaultChecked: true, disabled: true },
      ].map(({ label, ...props }) => (
        <label key={label} className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
          <Radio {...props} />
          {label}
        </label>
      ))}
    </div>
  ),
}

export const RadioGroup: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {['PostgreSQL', 'MySQL', 'SQLite', 'MongoDB'].map((db, i) => (
        <label key={db} className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
          <Radio name="db" value={db.toLowerCase()} defaultChecked={i === 0} />
          {db}
        </label>
      ))}
    </div>
  ),
}
```

- [ ] **Step 2: Run story tests**

Use the `run-story-tests` MCP tool with stories filter for `Primitives/Forms/Radio`.
Expected: All tests pass, no accessibility violations.

- [ ] **Step 3: Preview stories**

Use the `preview-stories` MCP tool to get preview URLs for the Radio stories. Share URLs with user for visual verification.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/primitives/forms/Radio.stories.tsx
git commit -m "feat: update Radio stories for custom-rendered design"
```

---

### Task 5: Final Verification

- [ ] **Step 1: Type-check the full project**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 2: Run all story tests**

Use the `run-story-tests` MCP tool with no filter to run all stories.
Expected: All tests pass.

- [ ] **Step 3: Verify consumers are unaffected**

Grep for Checkbox/Radio usage to confirm no API changes needed:

Run: `grep -rn 'Checkbox\|Radio' src/renderer/src/components/ --include='*.tsx' | head -20`
Expected: ConnectionForm, SettingsPanel, ExportModal use Checkbox with same props as before. No Radio consumers outside stories.
