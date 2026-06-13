import React, { forwardRef, useState, useCallback, useRef, useEffect } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const numberInputVariants = cva(
  [
    'inline-flex items-center overflow-hidden border text-text-primary',
    'bg-[linear-gradient(180deg,var(--color-input-gradient-top),var(--color-input-gradient-bottom)),var(--color-bg-tertiary)]',
    'shadow-[var(--shadow-input-inset)]',
    // size is driven by density tokens via the size variant below
    'h-[var(--ni-ctl-h)] rounded-[var(--ni-ctl-r)] text-[length:var(--ni-ctl-fs)]',
    'transition-all duration-[var(--transition-fast)] motion-reduce:transition-none',
    'focus-within:shadow-[var(--shadow-focus-glow),var(--shadow-input-inset)]',
  ].join(' '),
  {
    variants: {
      size: {
        xs: '[--ni-ctl-h:var(--ni-h-xs)] [--ni-ctl-fs:var(--ni-fs-xs)] [--ni-ctl-r:var(--ni-r-sm)]',
        sm: '[--ni-ctl-h:var(--ni-h-sm)] [--ni-ctl-fs:var(--ni-fs-sm)] [--ni-ctl-r:var(--ni-r-sm)]',
        md: '[--ni-ctl-h:var(--ni-h-md)] [--ni-ctl-fs:var(--ni-fs-md)] [--ni-ctl-r:var(--ni-r-md)]',
        lg: '[--ni-ctl-h:var(--ni-h-lg)] [--ni-ctl-fs:var(--ni-fs-lg)] [--ni-ctl-r:var(--ni-r-md)]',
        xl: '[--ni-ctl-h:var(--ni-h-xl)] [--ni-ctl-fs:var(--ni-fs-xl)] [--ni-ctl-r:var(--ni-r-lg)]',
      },
      error: {
        true: 'border-error focus-within:shadow-[var(--shadow-error-ring),var(--shadow-input-inset)]',
        false: 'border-border-default hover:border-border-strong',
      },
    },
    defaultVariants: { size: 'md', error: false },
  }
)

// Square-ish stepper cells that stay proportional to the control height across densities.
const stepperButtonClass = cn(
  'flex shrink-0 items-center justify-center w-[calc(var(--ni-ctl-h)*0.84)] h-full',
  'border-0 bg-transparent text-text-secondary cursor-pointer select-none',
  'transition-colors duration-[var(--transition-fast)] motion-reduce:transition-none',
  'hover:text-text-primary hover:bg-hover',
  'active:[&>svg]:scale-[0.86]',
  'disabled:text-text-disabled disabled:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed'
)

const stepIconClass =
  'h-[1.1em] w-[1.1em] transition-transform duration-[var(--transition-fast)] motion-reduce:transition-none'

const MinusIcon = () => (
  <svg
    className={stepIconClass}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M4 8h8" />
  </svg>
)

const PlusIcon = () => (
  <svg
    className={stepIconClass}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M8 4v8M4 8h8" />
  </svg>
)

export interface NumberInputProps extends VariantProps<typeof numberInputVariants> {
  value?: number
  defaultValue?: number
  onChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  precision?: number
  disabled?: boolean
  className?: string
  placeholder?: string
  id?: string
  'aria-label'?: string
  'aria-labelledby'?: string
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value: controlledValue,
      defaultValue = 0,
      onChange,
      min = -Infinity,
      max = Infinity,
      step = 1,
      precision,
      disabled,
      size,
      error,
      className,
      placeholder,
      id,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
    },
    ref
  ) => {
    const isControlled = controlledValue !== undefined
    const [internalValue, setInternalValue] = useState(defaultValue)
    const [textValue, setTextValue] = useState('')
    const [isEditing, setIsEditing] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const currentValue = isControlled ? controlledValue : internalValue

    const formatValue = useCallback(
      (v: number) => (precision !== undefined ? v.toFixed(precision) : String(v)),
      [precision]
    )

    const clamp = useCallback((v: number) => Math.min(max, Math.max(min, v)), [min, max])

    const setValue = useCallback(
      (next: number) => {
        const clamped = clamp(next)
        if (!isControlled) setInternalValue(clamped)
        onChange?.(clamped)
      },
      [clamp, isControlled, onChange]
    )

    const increment = useCallback(() => setValue(currentValue + step), [currentValue, step, setValue])
    const decrement = useCallback(() => setValue(currentValue - step), [currentValue, step, setValue])

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setValue(currentValue + (e.shiftKey ? step * 10 : step))
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          setValue(currentValue - (e.shiftKey ? step * 10 : step))
        }
      },
      [currentValue, step, setValue]
    )

    const handleFocus = () => {
      setTextValue(formatValue(currentValue))
      setIsEditing(true)
    }

    const handleBlur = () => {
      const parsed = parseFloat(textValue)
      if (!isNaN(parsed)) setValue(parsed)
      setIsEditing(false)
    }

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setTextValue(e.target.value)
    }

    useEffect(() => {
      if (typeof ref === 'function') ref(inputRef.current)
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = inputRef.current
    }, [ref])

    return (
      <div
        className={cn(
          numberInputVariants({ size, error }),
          disabled && 'opacity-50 pointer-events-none',
          className
        )}
      >
        <button
          type="button"
          tabIndex={-1}
          className={cn(stepperButtonClass, 'border-r border-border-default rounded-l-[inherit]')}
          onClick={decrement}
          disabled={disabled || currentValue <= min}
          aria-label="Decrement"
        >
          <MinusIcon />
        </button>
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="decimal"
          className="flex-1 h-full min-w-0 bg-transparent text-center font-mono tabular-nums tracking-[-0.01em] outline-none text-inherit placeholder:text-text-muted px-1.5"
          value={isEditing ? textValue : formatValue(currentValue)}
          onChange={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          aria-valuenow={currentValue}
          aria-valuemin={min !== -Infinity ? min : undefined}
          aria-valuemax={max !== Infinity ? max : undefined}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          role="spinbutton"
        />
        <button
          type="button"
          tabIndex={-1}
          className={cn(stepperButtonClass, 'border-l border-border-default rounded-r-[inherit]')}
          onClick={increment}
          disabled={disabled || currentValue >= max}
          aria-label="Increment"
        >
          <PlusIcon />
        </button>
      </div>
    )
  }
)

NumberInput.displayName = 'NumberInput'
