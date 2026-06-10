import { forwardRef, useMemo, useState } from 'react'
import { ChevronDown, ClipboardPaste, Upload } from 'lucide-react'
import { FileUpload } from '@arshad-shah/cynosure-react/file-upload'
import { Textarea } from '@arshad-shah/cynosure-react/textarea'
import { DropdownMenu } from '../surfaces/DropdownMenu'

export interface FileContentInputProps {
  /** Controlled value — the file's text contents. */
  value?: string
  /** Uncontrolled initial contents. */
  defaultValue?: string
  /** Fires with the next contents (or `''` when cleared). */
  onChange?: (content: string) => void
  placeholder?: string
  /** Accepted extensions/MIME types, e.g. `".pem,.key"`. */
  accept?: string
  disabled?: boolean
  className?: string
  id?: string
  /** @default "browse" */
  defaultMode?: 'browse' | 'paste'
}

/**
 * File-contents input — a value-based wrapper that reads and stores a file's
 * **text** (an inline SSH key, a certificate, …) rather than its path. Browse
 * mode delegates to Cynosure's `FileUpload` (reading the picked file via
 * `File.text()`); paste mode swaps in Cynosure's `Textarea`. A small dropdown
 * toggles between the two.
 */
export const FileContentInput = forwardRef<HTMLDivElement, FileContentInputProps>(
  function FileContentInput(
    {
      value: controlledValue,
      defaultValue = '',
      onChange,
      placeholder = 'Paste content here...',
      accept,
      disabled,
      className,
      id,
      defaultMode = 'browse',
    },
    ref
  ) {
    const isControlled = controlledValue !== undefined
    const [internalValue, setInternalValue] = useState(defaultValue)
    const [mode, setMode] = useState<'browse' | 'paste'>(defaultMode)
    const [fileName, setFileName] = useState<string | null>(null)
    const content = isControlled ? controlledValue : internalValue

    const setValue = (next: string): void => {
      if (!isControlled) setInternalValue(next)
      onChange?.(next)
    }

    // Reflect the current contents back as a chip so a loaded selection (a
    // picked file or pre-existing value) stays visible in the upload list.
    const files = useMemo(
      () => (content ? [new File([content], fileName ?? 'Pasted content')] : []),
      [content, fileName]
    )

    const menuItems = [
      {
        label: 'Browse file',
        onSelect: () => setMode('browse'),
        disabled: mode === 'browse',
      },
      {
        label: 'Paste content',
        onSelect: () => setMode('paste'),
        disabled: mode === 'paste',
      },
    ]

    return (
      <div ref={ref} id={id} className={className}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="flex items-center gap-1.5 text-xs text-text-muted">
            {mode === 'paste' ? <ClipboardPaste size={12} /> : <Upload size={12} />}
            {mode === 'paste' ? 'Paste content' : 'Browse file'}
          </span>
          <DropdownMenu
            trigger={
              <button
                type="button"
                disabled={disabled}
                aria-label="Input mode"
                className="flex items-center p-0.5 rounded text-text-muted hover:text-text-primary hover:bg-hover transition-colors"
              >
                <ChevronDown size={12} />
              </button>
            }
            items={menuItems}
          />
        </div>

        {mode === 'paste' ? (
          <Textarea
            value={content}
            onChange={setValue}
            placeholder={placeholder}
            disabled={disabled}
            rows={6}
            resize="vertical"
          />
        ) : (
          <FileUpload
            variant="compact"
            accept={accept}
            disabled={disabled}
            value={files}
            onFilesChange={async (next) => {
              const file = next[0]
              if (!file) {
                setFileName(null)
                setValue('')
                return
              }
              setFileName(file.name)
              setValue(await file.text())
            }}
          />
        )}
      </div>
    )
  }
)
