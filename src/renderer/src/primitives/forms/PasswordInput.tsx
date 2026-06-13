import React, { forwardRef, useReducer, useMemo } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '../utils/cn'
import { fieldSizeVariants } from './field-variants'

const passwordInputVariants = cva(
  [
    'flex items-center gap-[var(--field-gap)] border text-text-primary',
    'bg-[linear-gradient(180deg,var(--color-input-gradient-top),var(--color-input-gradient-bottom)),var(--color-bg-tertiary)]',
    'shadow-[var(--shadow-input-inset)]',
    'h-[var(--field-ctl-h)] px-[var(--field-px)] text-[length:var(--field-ctl-fs)] rounded-[var(--field-ctl-r)]',
    'transition-all duration-[var(--transition-fast)] motion-reduce:transition-none',
    'focus-within:shadow-[var(--shadow-focus-glow),var(--shadow-input-inset)]',
  ].join(' '),
  {
    variants: {
      size: fieldSizeVariants,
      error: {
        true: 'border-error focus-within:shadow-[var(--shadow-error-ring),var(--shadow-input-inset)]',
        false: 'border-border-default hover:border-border-strong',
      },
    },
    defaultVariants: { size: 'md', error: false },
  }
)

interface Strength {
  label: string
  fill: 1 | 2 | 3 | 4
  bar: string
  text: string
}

function getStrength(password: string): Strength {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (score <= 1) return { label: 'Weak', fill: 1, bar: 'bg-error', text: 'text-error' }
  if (score <= 2) return { label: 'Fair', fill: 2, bar: 'bg-warning', text: 'text-warning' }
  if (score <= 3) return { label: 'Strong', fill: 3, bar: 'bg-info', text: 'text-info' }
  return { label: 'Very strong', fill: 4, bar: 'bg-success', text: 'text-success' }
}

type PwState = { visible: boolean; value: string }
type PwAction = { type: 'toggle' } | { type: 'setValue'; value: string }
function pwReducer(s: PwState, a: PwAction): PwState {
  switch (a.type) {
    case 'toggle':
      return { ...s, visible: !s.visible }
    case 'setValue':
      return { ...s, value: a.value }
  }
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
    const [state, dispatch] = useReducer(pwReducer, { visible: false, value: defaultValue ?? '' })

    const currentValue = value ?? state.value
    const strength = useMemo(
      () => (showStrength ? getStrength(currentValue) : null),
      [showStrength, currentValue]
    )

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (value === undefined) dispatch({ type: 'setValue', value: e.target.value })
      onChange?.(e)
    }

    return (
      <div className="flex flex-col gap-1.5">
        <div className={cn(passwordInputVariants({ size, error }), disabled && 'opacity-50 pointer-events-none', className)}>
          <input
            ref={ref}
            type={state.visible ? 'text' : 'password'}
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
            onClick={() => dispatch({ type: 'toggle' })}
            className="shrink-0 text-text-muted hover:text-text-primary transition-colors duration-[var(--transition-fast)] motion-reduce:transition-none active:[&>svg]:scale-90"
            aria-label={state.visible ? 'Hide password' : 'Show password'}
          >
            {state.visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {strength && currentValue.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex flex-1 gap-1">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn(
                    'h-[3px] flex-1 rounded-full bg-bg-tertiary transition-colors duration-[var(--transition-normal)] motion-reduce:transition-none',
                    i < strength.fill && strength.bar
                  )}
                />
              ))}
            </div>
            <span className={cn('min-w-[64px] text-right text-[10px] font-semibold', strength.text)}>{strength.label}</span>
          </div>
        )}
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'
