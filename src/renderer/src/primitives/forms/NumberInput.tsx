import React, { forwardRef, useState, useCallback, useRef, useEffect } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const numberInputVariants = cva(
  'flex items-center border bg-[linear-gradient(180deg,var(--color-input-gradient-top),var(--color-input-gradient-bottom)),var(--color-bg-tertiary)] text-text-primary shadow-[var(--shadow-input-inset)] transition-all duration-[var(--transition-fast)] focus-within:shadow-[var(--shadow-focus-glow),var(--shadow-input-inset)]',
  {
    variants: {
      size: {
        xs: 'h-6 text-xs rounded',
        sm: 'h-7 text-xs rounded',
        md: 'h-8 text-sm rounded-md',
        lg: 'h-9 text-sm rounded-md',
        xl: 'h-10 text-base rounded-lg',
      },
      error: {
        true: 'border-error focus-within:shadow-[0_0_0_3px_rgba(255,95,87,0.25),var(--shadow-input-inset)]',
        false: 'border-border-default hover:border-border-strong',
      },
    },
    defaultVariants: { size: 'md', error: false },
  }
)

const stepperButtonClass =
  'flex items-center justify-center border-0 bg-transparent text-text-secondary hover:text-text-primary hover:bg-hover transition-colors duration-[var(--transition-fast)] disabled:opacity-50 disabled:pointer-events-none h-full px-2 select-none'

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

    const clamp = useCallback(
      (v: number) => Math.min(max, Math.max(min, v)),
      [min, max]
    )

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
      <div className={cn(numberInputVariants({ size, error }), disabled && 'opacity-50 pointer-events-none', className)}>
        <button
          type="button"
          tabIndex={-1}
          className={cn(stepperButtonClass, 'border-r border-border-default rounded-l-[inherit]')}
          onClick={decrement}
          disabled={disabled || currentValue <= min}
          aria-label="Decrement"
        >
          −
        </button>
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="decimal"
          className="flex-1 h-full bg-transparent text-center font-mono outline-none min-w-0 text-inherit"
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
          +
        </button>
      </div>
    )
  }
)

NumberInput.displayName = 'NumberInput'
