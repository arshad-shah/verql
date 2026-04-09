# FileContentInput Primitive — Design Spec

## Goal

Create a `FileContentInput` form primitive that lets users provide file content via browsing for a file (Electron dialog) or pasting content directly. Used for SSH private keys and any future file-content input need.

## Component: `FileContentInput`

**File:** `src/renderer/src/primitives/forms/FileContentInput.tsx`

### Props

```typescript
export interface FileContentInputProps extends VariantProps<typeof fileContentInputVariants> {
  value?: string
  defaultValue?: string
  onChange?: (content: string) => void
  placeholder?: string           // for paste textarea, default "Paste content here..."
  accept?: string                // file dialog filter extensions, e.g. '.pem,.key'
  disabled?: boolean
  className?: string
  id?: string                    // for FormField integration
}
```

**CVA Variants:**
- `size`: `'xs' | 'sm' | 'md' | 'lg' | 'xl'` — controls height of the browse-mode row (matches Input sizing)

### Visual States

**1. Browse mode — empty (default)**
- Single row styled like an Input (same border, bg, radius tokens)
- Left: `File` icon (lucide) + "No file selected" muted text
- Right: "Browse" `Button` (ghost, xs) + `DropdownMenu` trigger (chevron-down icon button) with two items: "Browse file" and "Paste content"

**2. Browse mode — file loaded**
- Left: `Shield` icon (lucide, accent color) + filename in monospace + "loaded" badge (accent tinted)
- Right: clear button (`X` icon) + `DropdownMenu` trigger
- Border tints to accent color to indicate loaded state

**3. Paste mode — empty or with content**
- Container with a small header bar: `ClipboardPaste` icon + "Paste content" label + `DropdownMenu` trigger (to switch back to "Browse file")
- Below header: `Textarea` (monospace, resizable vertically) with placeholder
- Content syncs bidirectionally with `value`/`onChange`

### Behavior

- **Mode switching** preserves content. If user browses a file then switches to paste mode, the file content appears in the textarea. If user types in paste mode then switches to browse mode, the content is kept (filename shows as "Pasted content").
- **Browse** calls `window.electronAPI.invoke('dialog:open-file', { accept })` which opens an Electron file dialog. On success, sets value to the file content and stores the filename for display.
- **Clear** resets value to empty string and clears filename.
- **Controlled/uncontrolled** pattern matches other primitives (internal state + controlled via `value` prop).

### Icons (all `lucide-react`, no emoji/ASCII)

- `File` — empty browse state
- `Shield` — file loaded indicator
- `X` — clear button
- `ChevronDown` — dropdown trigger
- `Upload` — "Browse file" menu item icon (not used directly, just in DropdownMenu label)
- `ClipboardPaste` — paste mode header icon

## IPC: `dialog:open-file`

### Type Definition (`shared/ipc.ts`)

```typescript
'dialog:open-file': {
  args: [options?: { title?: string; filters?: { name: string; extensions: string[] }[] }]
  return: { filePath: string; content: string } | { cancelled: true }
}
```

### Handler (`src/main/ipc-handlers.ts`)

- Uses `dialog.showOpenDialog()` with the provided filters
- On selection, reads the file with `fs.promises.readFile(filePath, 'utf-8')`
- Returns `{ filePath: path.basename(filePath), content }` (basename only, no full path exposed to renderer)
- Returns `{ cancelled: true }` if user cancels

## Integration

### ConnectionFormView update

In `src/renderer/src/components/connections/ConnectionFormView.tsx`, add a `'file'` case to `renderPluginField`:

```tsx
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

### Barrel export

Add to `src/renderer/src/primitives/forms/index.ts`:

```typescript
export { FileContentInput } from './FileContentInput'
export type { FileContentInputProps } from './FileContentInput'
```

## Stories

**File:** `src/renderer/src/primitives/forms/FileContentInput.stories.tsx`

Stories to create:
1. **Default** — empty browse mode, interactive play function that tests dropdown menu interaction
2. **WithContent** — pre-loaded with sample PEM key content, shows the "loaded" state
3. **PasteMode** — starts in paste mode with placeholder visible
4. **Disabled** — disabled state
5. **Sizes** — render function showing all size variants side by side

## Files Changed

| File | Action | Responsibility |
|------|--------|----------------|
| `shared/ipc.ts` | Modify | Add `dialog:open-file` channel type |
| `src/main/ipc-handlers.ts` | Modify | Add `dialog:open-file` handler |
| `src/renderer/src/primitives/forms/FileContentInput.tsx` | Create | The primitive component |
| `src/renderer/src/primitives/forms/FileContentInput.stories.tsx` | Create | Storybook stories |
| `src/renderer/src/primitives/forms/index.ts` | Modify | Add barrel export |
| `src/renderer/src/components/connections/ConnectionFormView.tsx` | Modify | Add `'file'` type case in `renderPluginField` |
| `tests/unit/primitives/forms/FileContentInput.test.tsx` | Create | Unit tests |
