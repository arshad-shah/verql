import React, { forwardRef, useState } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { File, Shield, X, ChevronDown, ClipboardPaste } from 'lucide-react'
import { cn } from '../utils/cn'
import { DropdownMenu } from '../surfaces/DropdownMenu'
import { Textarea } from './Textarea'

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
          { label: 'Paste content', onSelect: () => {}, disabled: true },
        ]

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
                  <button type="button" aria-label="Input mode" className="flex items-center p-0.5 rounded text-text-muted hover:text-text-primary hover:bg-hover transition-colors">
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
                aria-label="Input mode"
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
