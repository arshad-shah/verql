import React, { forwardRef, useState, useCallback } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { File, Shield, X, ChevronDown, ClipboardPaste, Upload } from 'lucide-react'
import { cn } from '../utils/cn'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@arshad-shah/cynosure-react/dropdown-menu'
import { Textarea } from '@arshad-shah/cynosure-react/textarea'
import { IPC_CHANNELS } from '@shared/ipc'

const browseRowVariants = cva(
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
    const [dragOver, setDragOver] = useState(false)

    const currentValue = isControlled ? controlledValue : internalValue

    const setValue = (v: string) => {
      if (!isControlled) setInternalValue(v)
      onChange?.(v)
    }

    const hasContent = currentValue.length > 0

    const acceptExtensions = accept
      ?.split(',')
      .map((e) => e.trim().toLowerCase().replace(/^\./, ''))

    const isAcceptedFile = (name: string) => {
      if (!acceptExtensions) return true
      const ext = name.split('.').pop()?.toLowerCase()
      return ext ? acceptExtensions.includes(ext) : true
    }

    const readFileContent = (file: globalThis.File) => {
      const reader = new FileReader()
      reader.onload = () => {
        setFileName(file.name)
        setMode('browse')
        setValue(reader.result as string)
      }
      reader.readAsText(file)
    }

    const handleBrowse = async () => {
      const filters = accept
        ? [{ name: 'Files', extensions: accept.split(',').map(e => e.trim().replace(/^\./, '')) }]
        : undefined
      const result = await window.electronAPI.invoke(IPC_CHANNELS.DIALOG_OPEN_FILE, { filters })
      if ('cancelled' in result) return
      setFileName(result.filePath)
      setMode('browse')
      setValue(result.content)
    }

    const handleClear = () => {
      setFileName(null)
      setValue('')
    }

    const handlePasteChange = (value: string) => {
      setValue(value)
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
        // In Electron, dropped files have a .path property for native dialog fallback
        // But for content reading, use FileReader
        readFileContent(file)
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [disabled, acceptExtensions]
    )

    const menuItems = mode === 'browse'
      ? [
          { label: 'Browse file', onSelect: handleBrowse },
          { label: 'Paste content', onSelect: () => setMode('paste') },
        ]
      : [
          { label: 'Browse file', onSelect: () => { setMode('browse'); handleBrowse() } },
          { label: 'Paste content', onSelect: () => {}, disabled: true },
        ]

    const displayName = fileName ?? (hasContent ? 'Pasted content' : null)

    if (mode === 'paste') {
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
            'border rounded-md overflow-hidden',
            'bg-[linear-gradient(180deg,var(--color-input-gradient-top),var(--color-input-gradient-bottom)),var(--color-bg-tertiary)]',
            'shadow-[var(--shadow-input-inset)]',
            dragOver ? 'border-accent ring-1 ring-accent/30' : 'border-border-default',
            disabled && 'opacity-50 pointer-events-none'
          )}>
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-border-default">
              <span className="flex items-center gap-1.5 text-xs text-text-muted">
                <ClipboardPaste size={12} />
                Paste content
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" aria-label="Input mode" className="flex items-center p-0.5 rounded text-text-muted hover:text-text-primary hover:bg-hover transition-colors">
                    <ChevronDown size={12} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {menuItems.map((item) => (
                    <DropdownMenuItem key={item.label} disabled={'disabled' in item ? item.disabled : undefined} onSelect={item.onSelect}>
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Textarea
              value={currentValue}
              onChange={handlePasteChange}
              placeholder={placeholder}
              disabled={disabled}
              variant="ghost"
              resize="vertical"
              className="min-h-[120px] font-mono text-xs"
            />
          </div>
        </div>
      )
    }

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
          browseRowVariants({ size }),
          dragOver
            ? 'border-accent ring-1 ring-accent/30 bg-accent/5'
            : hasContent
              ? 'border-accent/30 bg-accent/5'
              : 'border-border-default hover:border-border-strong',
          disabled && 'opacity-50 pointer-events-none'
        )}>
          {dragOver ? (
            <Upload size={14} className="shrink-0 text-accent" />
          ) : hasContent ? (
            <Shield size={14} className="shrink-0 text-accent" />
          ) : (
            <File size={14} className="shrink-0 text-text-muted" />
          )}

          <span className={cn(
            'flex-1 truncate',
            dragOver
              ? 'text-accent font-medium'
              : hasContent ? 'font-mono text-text-primary' : 'text-text-muted'
          )}>
            {dragOver ? 'Drop file here' : displayName ?? 'No file selected'}
          </span>

          {hasContent && !dragOver && (
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

          {!hasContent && !dragOver && (
            <button
              type="button"
              onClick={handleBrowse}
              disabled={disabled}
              className="shrink-0 px-2 py-0.5 rounded text-xs text-text-secondary bg-bg-tertiary border border-border-default hover:border-border-strong hover:text-text-primary transition-colors"
            >
              Browse
            </button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={disabled}
                aria-label="Input mode"
                className="shrink-0 p-0.5 rounded text-text-muted hover:text-text-primary hover:bg-hover transition-colors"
              >
                <ChevronDown size={12} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {menuItems.map((item) => (
                    <DropdownMenuItem key={item.label} disabled={'disabled' in item ? item.disabled : undefined} onSelect={item.onSelect}>
                      {item.label}
                    </DropdownMenuItem>
                  ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    )
  }
)

FileContentInput.displayName = 'FileContentInput'
