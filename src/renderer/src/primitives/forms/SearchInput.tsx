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
    defaultVariants: { size: 'md' },
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
