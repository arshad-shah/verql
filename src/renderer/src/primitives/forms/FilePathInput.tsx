import React, { forwardRef, useState, useCallback } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { File, X, Upload, HardDrive } from 'lucide-react'
import { cn } from '../utils/cn'
import { IPC_CHANNELS } from '@shared/ipc'

const rowVariants = cva(
  'flex items-center gap-2 border bg-[linear-gradient(180deg,var(--color-input-gradient-top),var(--color-input-gradient-bottom)),var(--color-bg-tertiary)] text-text-primary shadow-[var(--shadow-input-inset)] transition-all duration-[var(--transition-fast)]',
  {
    variants: {
      size: {
        xs: 'h-7 px-2 text-xs rounded',
        sm: 'h-8 px-2 text-xs rounded',
        md: 'h-9 px-3 text-sm rounded-md',
        lg: 'h-10 px-3 text-sm rounded-md',
        xl: 'h-12 px-4 text-base rounded-lg',
      },
    },
    defaultVariants: { size: 'md' },
  }
)

export interface FilePathInputProps extends VariantProps<typeof rowVariants> {
  value?: string
  defaultValue?: string
  onChange?: (filePath: string) => void
  placeholder?: string
  accept?: string
  disabled?: boolean
  className?: string
  id?: string
}

export const FilePathInput = forwardRef<HTMLDivElement, FilePathInputProps>(
  (
    {
      value: controlledValue,
      defaultValue = '',
      onChange,
      placeholder = 'No file selected',
      accept,
      disabled,
      size,
      className,
      id,
    },
    ref
  ) => {
    const isControlled = controlledValue !== undefined
    const [internalValue, setInternalValue] = useState(defaultValue)
    const [dragOver, setDragOver] = useState(false)

    const currentValue = isControlled ? controlledValue : internalValue
    const hasValue = currentValue.length > 0

    const setValue = (v: string) => {
      if (!isControlled) setInternalValue(v)
      onChange?.(v)
    }

    const acceptExtensions = accept
      ?.split(',')
      .map((e) => e.trim().toLowerCase().replace(/^\./, ''))

    const isAcceptedFile = (name: string) => {
      if (!acceptExtensions) return true
      const ext = name.split('.').pop()?.toLowerCase()
      return ext ? acceptExtensions.includes(ext) : true
    }

    const handleBrowse = async () => {
      const filters = accept
        ? [{ name: 'Files', extensions: accept.split(',').map(e => e.trim().replace(/^\./, '')) }]
        : undefined
      const result = await window.electronAPI.invoke(IPC_CHANNELS.DIALOG_OPEN_FILE_PATH, { filters })
      if ('cancelled' in result) return
      setValue(result.filePath)
    }

    const handleClear = () => {
      setValue('')
    }

    const handleDragOver = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!disabled) setDragOver(true)
      },
      [disabled]
    )

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOver(false)
    }, [])

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragOver(false)
        if (disabled) return
        const files = e.dataTransfer.files
        if (files.length === 0) return
        const file = files[0]
        if (!isAcceptedFile(file.name)) return
        // In Electron, dropped files expose a .path property with the full native path
        const filePath = (file as globalThis.File & { path?: string }).path
        if (filePath) {
          setValue(filePath)
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [disabled, acceptExtensions]
    )

    const displayName = hasValue
      ? currentValue.split(/[/\\]/).pop() ?? currentValue
      : null

    return (
      <div
        ref={ref}
        id={id}
        className={cn('flex flex-col', className)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={cn(
          rowVariants({ size }),
          dragOver
            ? 'border-accent ring-1 ring-accent/30 bg-accent/5'
            : hasValue
              ? 'border-accent/30 bg-accent/5'
              : 'border-border-default hover:border-border-strong',
          disabled && 'opacity-50 pointer-events-none'
        )}>
          {dragOver ? (
            <Upload size={14} className="shrink-0 text-accent" />
          ) : hasValue ? (
            <HardDrive size={14} className="shrink-0 text-accent" />
          ) : (
            <File size={14} className="shrink-0 text-text-muted" />
          )}

          <span
            className={cn(
              'flex-1 truncate',
              dragOver
                ? 'text-accent font-medium'
                : hasValue ? 'font-mono text-text-primary' : 'text-text-muted'
            )}
            title={hasValue ? currentValue : undefined}
          >
            {dragOver ? 'Drop file here' : displayName ?? placeholder}
          </span>

          {hasValue && !dragOver && (
            <>
              <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium text-accent bg-accent/10">
                selected
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

          {!hasValue && !dragOver && (
            <button
              type="button"
              onClick={handleBrowse}
              disabled={disabled}
              className="shrink-0 px-2 py-0.5 rounded text-xs text-text-secondary bg-bg-tertiary border border-border-default hover:border-border-strong hover:text-text-primary transition-colors"
            >
              Browse
            </button>
          )}
        </div>
      </div>
    )
  }
)

FilePathInput.displayName = 'FilePathInput'
