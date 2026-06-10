import { forwardRef, useMemo, useState } from 'react'
import { FileUpload } from '@arshad-shah/cynosure-react/file-upload'

export interface FilePathInputProps {
  /** Controlled value — the chosen file's absolute on-disk path. */
  value?: string
  /** Uncontrolled initial path. */
  defaultValue?: string
  /** Fires with the next absolute path (or `''` when cleared). */
  onChange?: (filePath: string) => void
  /** Accepted extensions/MIME types, e.g. `".csv,.json"`. */
  accept?: string
  disabled?: boolean
  className?: string
  id?: string
}

const basename = (p: string): string => p.split(/[/\\]/).pop() || p

/**
 * File-path picker — a value-based wrapper over Cynosure's `FileUpload` that
 * stores the chosen file's **native on-disk path** (the SQLite database file, a
 * private-key file the adapter reads itself, …) rather than its contents.
 *
 * The path is recovered from the picked `File` via `webUtils.getPathForFile`
 * (exposed on `electronAPI`), since Electron 32+ removed `File.path`. A saved
 * path with no live `File` is shown as a name-only chip in the upload list.
 */
export const FilePathInput = forwardRef<HTMLDivElement, FilePathInputProps>(function FilePathInput(
  { value: controlledValue, defaultValue = '', onChange, accept, disabled, className, id },
  ref
) {
  const isControlled = controlledValue !== undefined
  const [internalValue, setInternalValue] = useState(defaultValue)
  const path = isControlled ? controlledValue : internalValue

  // FileUpload renders from a `File[]`; reflect the current path back as a
  // name-only chip so an existing selection stays visible.
  const files = useMemo(() => (path ? [new File([], basename(path))] : []), [path])

  const setValue = (next: string): void => {
    if (!isControlled) setInternalValue(next)
    onChange?.(next)
  }

  return (
    <FileUpload
      ref={ref}
      id={id}
      className={className}
      variant="compact"
      accept={accept}
      disabled={disabled}
      value={files}
      onFilesChange={(next) => {
        const file = next[0]
        setValue(file ? window.electronAPI.getPathForFile(file) : '')
      }}
    />
  )
})
