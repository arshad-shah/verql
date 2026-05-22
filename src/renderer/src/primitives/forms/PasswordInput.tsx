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
        true: 'border-error focus-within:shadow-[var(--shadow-error-ring),var(--shadow-input-inset)]',
        false: 'border-border-default hover:border-border-strong',
      },
    },
    defaultVariants: { size: 'md', error: false },
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
