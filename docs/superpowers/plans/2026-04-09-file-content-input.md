# FileContentInput Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a `FileContentInput` form primitive that lets users browse for a file or paste content directly, plus a generic `dialog:open-file` IPC channel, and wire it into the connection form for SSH private key fields.

**Architecture:** New form primitive with two modes (browse/paste) using existing `DropdownMenu` for mode switching and `Textarea` for paste mode. IPC handler uses Electron's `dialog.showOpenDialog()` + `fs.readFile`. The connection form's `renderPluginField` gets a `'file'` type case.

**Tech Stack:** React 19, TypeScript, CVA, lucide-react icons, Electron IPC, Storybook

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `shared/ipc.ts` | Modify | Add `dialog:open-file` channel type |
| `src/main/ipc-handlers.ts` | Modify | Add `dialog:open-file` handler |
| `src/renderer/src/primitives/forms/FileContentInput.tsx` | Create | The primitive component |
| `src/renderer/src/primitives/forms/FileContentInput.stories.tsx` | Create | Storybook stories |
| `src/renderer/src/primitives/forms/index.ts` | Modify | Add barrel export |
| `src/renderer/src/components/connections/ConnectionFormView.tsx` | Modify | Add `'file'` type case in `renderPluginField` |
| `tests/unit/primitives/forms/FileContentInput.test.tsx` | Create | Unit tests |

---

### Task 1: Add `dialog:open-file` IPC channel

**Files:**
- Modify: `shared/ipc.ts:152-153`
- Modify: `src/main/ipc-handlers.ts:356-358`

- [ ] **Step 1: Add the channel type to `shared/ipc.ts`**

In `shared/ipc.ts`, add before the closing `}` of `IpcChannelMap` (before line 153):

```typescript
  'dialog:open-file': {
    args: [options?: { title?: string; filters?: { name: string; extensions: string[] }[] }]
    return: { filePath: string; content: string } | { cancelled: true }
  }
```

- [ ] **Step 2: Add the handler to `src/main/ipc-handlers.ts`**

In `src/main/ipc-handlers.ts`, add after the export section closing (after line 356, before the `// ─── Import` comment):

```typescript
  // ─── Dialog ─────────────────────────────────────────────────────────────────

  handle('dialog:open-file', async (options) => {
    const { filePaths, canceled } = await dialog.showOpenDialog({
      title: options?.title ?? 'Open File',
      filters: options?.filters ?? [{ name: 'All Files', extensions: ['*'] }],
      properties: ['openFile']
    })
    if (canceled || filePaths.length === 0) return { cancelled: true as const }

    const fullPath = filePaths[0]
    const content = fs.readFileSync(fullPath, 'utf-8')
    return { filePath: path.basename(fullPath), content }
  })
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add shared/ipc.ts src/main/ipc-handlers.ts
git commit -m "feat: add generic dialog:open-file IPC channel"
```

---

### Task 2: Create `FileContentInput` primitive

**Files:**
- Create: `src/renderer/src/primitives/forms/FileContentInput.tsx`
- Create: `tests/unit/primitives/forms/FileContentInput.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/primitives/forms/FileContentInput.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileContentInput } from '../../../../src/renderer/src/primitives/forms/FileContentInput'

// Mock electronAPI
const mockInvoke = vi.fn()
Object.defineProperty(window, 'electronAPI', {
  value: { invoke: mockInvoke, on: vi.fn().mockReturnValue(vi.fn()) },
  writable: true
})

describe('FileContentInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders in browse mode by default', () => {
    render(<FileContentInput />)
    expect(screen.getByText('No file selected')).toBeTruthy()
    expect(screen.getByText('Browse')).toBeTruthy()
  })

  it('calls dialog:open-file when browse is clicked', async () => {
    mockInvoke.mockResolvedValue({ filePath: 'id_rsa', content: 'key-content' })
    const onChange = vi.fn()
    render(<FileContentInput onChange={onChange} />)
    await userEvent.click(screen.getByText('Browse'))
    expect(mockInvoke).toHaveBeenCalledWith('dialog:open-file', expect.any(Object))
    expect(onChange).toHaveBeenCalledWith('key-content')
  })

  it('shows filename after file is loaded', async () => {
    mockInvoke.mockResolvedValue({ filePath: 'id_ed25519', content: 'key-data' })
    render(<FileContentInput />)
    await userEvent.click(screen.getByText('Browse'))
    expect(screen.getByText('id_ed25519')).toBeTruthy()
    expect(screen.getByText('loaded')).toBeTruthy()
  })

  it('does not update on cancelled dialog', async () => {
    mockInvoke.mockResolvedValue({ cancelled: true })
    const onChange = vi.fn()
    render(<FileContentInput onChange={onChange} />)
    await userEvent.click(screen.getByText('Browse'))
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText('No file selected')).toBeTruthy()
  })

  it('clears content when clear button is clicked', async () => {
    mockInvoke.mockResolvedValue({ filePath: 'key.pem', content: 'data' })
    const onChange = vi.fn()
    render(<FileContentInput onChange={onChange} />)
    await userEvent.click(screen.getByText('Browse'))
    const clearBtn = screen.getByLabelText('Clear')
    await userEvent.click(clearBtn)
    expect(onChange).toHaveBeenLastCalledWith('')
    expect(screen.getByText('No file selected')).toBeTruthy()
  })

  it('renders in paste mode and accepts input', async () => {
    const onChange = vi.fn()
    render(<FileContentInput defaultMode="paste" onChange={onChange} />)
    const textarea = screen.getByPlaceholderText('Paste content here...')
    await userEvent.type(textarea, 'pasted-key')
    expect(onChange).toHaveBeenCalled()
  })

  it('renders as disabled', () => {
    render(<FileContentInput disabled />)
    expect(screen.getByText('Browse').closest('button')).toHaveProperty('disabled', true)
  })

  it('shows controlled value content', () => {
    render(<FileContentInput value="some-key-content" />)
    expect(screen.getByText('Pasted content')).toBeTruthy()
    expect(screen.getByText('loaded')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- --run tests/unit/primitives/forms/FileContentInput.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Create the `FileContentInput` component**

Create `src/renderer/src/primitives/forms/FileContentInput.tsx`:

```tsx
import React, { forwardRef, useState } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { File, Shield, X, ChevronDown, Upload, ClipboardPaste } from 'lucide-react'
import { cn } from '../utils/cn'
import { DropdownMenu } from '../surfaces/DropdownMenu'
import { Textarea } from './Textarea'
import { IconButton } from './Button'

const browseRowVariants = cva(
  'flex items-center gap-2 border bg-[linear-gradient(180deg,var(--color-input-gradient-top),var(--color-input-gradient-bottom)),var(--color-bg-tertiary)] text-text-primary shadow-[var(--shadow-input-inset)] transition-all duration-[var(--transition-fast)]',
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

export interface FileContentInputProps extends VariantProps<typeof browseRowVariants> {
  value?: string
  defaultValue?: string
  onChange?: (content: string) => void
  placeholder?: string
  accept?: string
  disabled?: boolean
  className?: string
  id?: string
  defaultMode?: 'browse' | 'paste'
}

export const FileContentInput = forwardRef<HTMLDivElement, FileContentInputProps>(
  (
    {
      value: controlledValue,
      defaultValue = '',
      onChange,
      placeholder = 'Paste content here...',
      accept,
      disabled,
      size,
      className,
      id,
      defaultMode = 'browse',
    },
    ref
  ) => {
    const isControlled = controlledValue !== undefined
    const [internalValue, setInternalValue] = useState(defaultValue)
    const [mode, setMode] = useState<'browse' | 'paste'>(defaultMode)
    const [fileName, setFileName] = useState<string | null>(null)

    const currentValue = isControlled ? controlledValue : internalValue

    const setValue = (v: string) => {
      if (!isControlled) setInternalValue(v)
      onChange?.(v)
    }

    const hasContent = currentValue.length > 0

    const handleBrowse = async () => {
      const filters = accept
        ? [{ name: 'Files', extensions: accept.split(',').map(e => e.trim().replace(/^\./, '')) }]
        : undefined
      const result = await window.electronAPI.invoke('dialog:open-file', { filters })
      if ('cancelled' in result) return
      setFileName(result.filePath)
      setMode('browse')
      setValue(result.content)
    }

    const handleClear = () => {
      setFileName(null)
      setValue('')
    }

    const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value)
    }

    const menuItems = mode === 'browse'
      ? [
          { label: 'Browse file', onSelect: handleBrowse },
          { label: 'Paste content', onSelect: () => setMode('paste') },
        ]
      : [
          { label: 'Browse file', onSelect: () => { setMode('browse'); handleBrowse() } },
          { label: 'Paste content', onSelect: () => {} , disabled: true },
        ]

    // Determine display name for loaded content
    const displayName = fileName ?? (hasContent ? 'Pasted content' : null)

    if (mode === 'paste') {
      return (
        <div ref={ref} id={id} className={cn('flex flex-col', className)}>
          <div className={cn(
            'border border-border-default rounded-md overflow-hidden',
            'bg-[linear-gradient(180deg,var(--color-input-gradient-top),var(--color-input-gradient-bottom)),var(--color-bg-tertiary)]',
            'shadow-[var(--shadow-input-inset)]',
            disabled && 'opacity-50 pointer-events-none'
          )}>
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-border-default">
              <span className="flex items-center gap-1.5 text-xs text-text-muted">
                <ClipboardPaste size={12} />
                Paste content
              </span>
              <DropdownMenu
                trigger={
                  <button type="button" className="flex items-center p-0.5 rounded text-text-muted hover:text-text-primary hover:bg-hover transition-colors">
                    <ChevronDown size={12} />
                  </button>
                }
                items={menuItems}
              />
            </div>
            <Textarea
              value={currentValue}
              onChange={handlePasteChange}
              placeholder={placeholder}
              disabled={disabled}
              className="border-0 rounded-none shadow-none focus:shadow-none min-h-[120px] font-mono text-xs resize-y"
            />
          </div>
        </div>
      )
    }

    // Browse mode
    return (
      <div ref={ref} id={id} className={cn('flex flex-col', className)}>
        <div className={cn(
          browseRowVariants({ size }),
          hasContent
            ? 'border-accent/30 bg-accent/5'
            : 'border-border-default hover:border-border-strong',
          disabled && 'opacity-50 pointer-events-none'
        )}>
          {hasContent ? (
            <Shield size={14} className="shrink-0 text-accent" />
          ) : (
            <File size={14} className="shrink-0 text-text-muted" />
          )}

          <span className={cn(
            'flex-1 truncate',
            hasContent ? 'font-mono text-text-primary' : 'text-text-muted'
          )}>
            {displayName ?? 'No file selected'}
          </span>

          {hasContent && (
            <>
              <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium text-accent bg-accent/10">
                loaded
              </span>
              <button
                type="button"
                onClick={handleClear}
                disabled={disabled}
                className="shrink-0 p-0.5 rounded text-text-muted hover:text-text-primary hover:bg-hover transition-colors"
                aria-label="Clear"
              >
                <X size={12} />
              </button>
            </>
          )}

          {!hasContent && (
            <button
              type="button"
              onClick={handleBrowse}
              disabled={disabled}
              className="shrink-0 px-2 py-0.5 rounded text-xs text-text-secondary bg-bg-tertiary border border-border-default hover:border-border-strong hover:text-text-primary transition-colors"
            >
              Browse
            </button>
          )}

          <DropdownMenu
            trigger={
              <button
                type="button"
                disabled={disabled}
                className="shrink-0 p-0.5 rounded text-text-muted hover:text-text-primary hover:bg-hover transition-colors"
              >
                <ChevronDown size={12} />
              </button>
            }
            items={menuItems}
          />
        </div>
      </div>
    )
  }
)

FileContentInput.displayName = 'FileContentInput'
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- --run tests/unit/primitives/forms/FileContentInput.test.tsx`
Expected: All 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/primitives/forms/FileContentInput.tsx tests/unit/primitives/forms/FileContentInput.test.tsx
git commit -m "feat: create FileContentInput form primitive"
```

---

### Task 3: Add barrel export and wire into connection form

**Files:**
- Modify: `src/renderer/src/primitives/forms/index.ts:51`
- Modify: `src/renderer/src/components/connections/ConnectionFormView.tsx`

- [ ] **Step 1: Add barrel export**

In `src/renderer/src/primitives/forms/index.ts`, add after the `ColorPicker` exports (after line 50, before the `color-utils` line):

```typescript
export { FileContentInput } from './FileContentInput'
export type { FileContentInputProps } from './FileContentInput'
```

- [ ] **Step 2: Add `FileContentInput` import to `ConnectionFormView.tsx`**

Update the primitives import in `src/renderer/src/components/connections/ConnectionFormView.tsx` (line 7-12):

```typescript
import {
  ScrollArea, Container, Stack, Flex, Box, Divider,
  Heading, Text,
  FormField, Input, NumberInput, PasswordInput, Select, Switch, ColorInput, FileContentInput,
  Button
} from '@/primitives'
```

- [ ] **Step 3: Add `'file'` type case to `renderPluginField`**

In `src/renderer/src/components/connections/ConnectionFormView.tsx`, add after the `field.type === 'number'` block (after line 141, before the default `return`):

```typescript
    if (field.type === 'file') {
      return (
        <FormField key={field.key} label={field.label}>
          <FileContentInput
            value={String(value)}
            onChange={(content) => update({ [field.key]: content })}
            accept=".pem,.key"
            size="sm"
          />
        </FormField>
      )
    }
```

- [ ] **Step 4: Verify types compile and tests pass**

Run: `npx tsc --noEmit && pnpm test`
Expected: No type errors, all tests pass

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/primitives/forms/index.ts src/renderer/src/components/connections/ConnectionFormView.tsx
git commit -m "feat: wire FileContentInput into connection form for file fields"
```

---

### Task 4: Create Storybook stories

**Files:**
- Create: `src/renderer/src/primitives/forms/FileContentInput.stories.tsx`

- [ ] **Step 1: Create the stories file**

Create `src/renderer/src/primitives/forms/FileContentInput.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { FileContentInput } from './FileContentInput'

const meta: Meta<typeof FileContentInput> = {
  title: 'Primitives/Forms/FileContentInput',
  component: FileContentInput,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    disabled: { control: 'boolean' },
    defaultMode: { control: 'select', options: ['browse', 'paste'] },
  },
  args: {
    onChange: fn(),
  },
}
export default meta
type Story = StoryObj<typeof FileContentInput>

export const Default: Story = {
  args: { size: 'md', placeholder: 'Paste your private key here...' },
}

export const WithContent: Story = {
  args: {
    value: '-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAABG5v\nbmUAAAAEbm9uZQAAAAAAAAABAAAA\nMwAAAAtzc2gtZWQyNTUxOQAAACDr\n-----END OPENSSH PRIVATE KEY-----',
    size: 'md',
  },
}

export const PasteMode: Story = {
  args: {
    defaultMode: 'paste',
    placeholder: 'Paste your private key here...',
    size: 'md',
  },
}

export const Disabled: Story = {
  args: { disabled: true, size: 'md' },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-80">
      <FileContentInput size="xs" />
      <FileContentInput size="sm" />
      <FileContentInput size="md" />
      <FileContentInput size="lg" />
      <FileContentInput size="xl" />
    </div>
  ),
}
```

- [ ] **Step 2: Verify stories compile**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/primitives/forms/FileContentInput.stories.tsx
git commit -m "feat: add FileContentInput storybook stories"
```

---

### Task 5: Update ConnectionTestButton stories (if missing)

**Files:**
- Check/Create: `src/renderer/src/components/connections/ConnectionTestButton.stories.tsx`

- [ ] **Step 1: Check if story exists**

Run: `ls src/renderer/src/components/connections/ConnectionTestButton.stories.tsx 2>/dev/null || echo "missing"`

- [ ] **Step 2: Create story if missing**

If missing, create `src/renderer/src/components/connections/ConnectionTestButton.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ConnectionTestButton } from './ConnectionTestButton'

const meta: Meta<typeof ConnectionTestButton> = {
  title: 'Components/Connections/ConnectionTestButton',
  component: ConnectionTestButton,
  tags: ['autodocs'],
  args: {
    profile: {
      id: 'test-1',
      name: 'Test DB',
      type: 'postgresql',
      host: 'localhost',
      port: 5432,
      database: 'testdb',
      username: 'postgres',
      password: '',
    },
  },
}
export default meta
type Story = StoryObj<typeof ConnectionTestButton>

export const Default: Story = {}
```

- [ ] **Step 3: Commit if created**

```bash
git add src/renderer/src/components/connections/ConnectionTestButton.stories.tsx
git commit -m "feat: add ConnectionTestButton storybook story"
```

---

### Task 6: Final verification

- [ ] **Step 1: Run full test suite**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 2: Run type checker**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Verify Storybook builds**

Run: `pnpm storybook --ci --smoke-test` (or just `npx tsc --noEmit` if storybook smoke test isn't available)
Expected: No build errors

- [ ] **Step 4: Manual verification with `pnpm dev`**

Run: `pnpm dev`

Manual checks:
1. Open a new connection form tab
2. Select a database type that has an SSH tunnel section (any non-SQLite built-in type)
3. Expand SSH Tunnel section
4. The "Private Key" field shows the new FileContentInput in browse mode
5. Click "Browse" — Electron file dialog opens
6. Select a key file — filename and "loaded" badge appear
7. Click the chevron dropdown — "Browse file" and "Paste content" options appear
8. Switch to "Paste content" — textarea appears with monospace font
9. Type content — it works
10. Switch back to browse — content is preserved
11. Click clear (X) — resets to empty state
