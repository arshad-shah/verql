import { forwardRef } from 'react'
import { NumberInput as CynNumberInput } from '@arshad-shah/cynosure-react/number-input'

export interface NumberInputProps {
  value?: number
  defaultValue?: number
  onChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  precision?: number
  disabled?: boolean
  /** @default "md" */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  error?: boolean
  className?: string
  id?: string
  'aria-label'?: string
  'aria-labelledby'?: string
}

/** Cynosure's NumberInput exposes only sm/md/lg; fold the wider in-house scale in. */
const SIZE_MAP = { xs: 'sm', sm: 'sm', md: 'md', lg: 'lg', xl: 'lg' } as const

/**
 * Numeric stepper input — a props-based wrapper over Cynosure's `NumberInput`
 * (React Aria `NumberField` under the hood) that keeps the in-house API so the
 * existing call sites work unchanged and the component is styled by Cynosure
 * (no Tailwind). Maps `min`/`max` → `minValue`/`maxValue`, `error` → `invalid`,
 * `disabled` → `isDisabled`, and `precision` → fixed `formatOptions`. React
 * Aria emits `NaN` when the field is cleared; we swallow it so callers (settings
 * stores) only ever receive real numbers, matching the old behaviour.
 */
export const NumberInput = forwardRef<HTMLDivElement, NumberInputProps>(function NumberInput(
  {
    value,
    defaultValue,
    onChange,
    min,
    max,
    step,
    precision,
    disabled,
    size = 'md',
    error,
    className,
    id,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
  },
  ref
) {
  return (
    <CynNumberInput
      ref={ref}
      value={value}
      defaultValue={defaultValue}
      onChange={(v) => {
        if (!Number.isNaN(v)) onChange?.(v)
      }}
      minValue={min}
      maxValue={max}
      step={step}
      isDisabled={disabled}
      invalid={error}
      size={SIZE_MAP[size]}
      className={className}
      id={id}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      incrementLabel="Increment"
      decrementLabel="Decrement"
      formatOptions={
        precision !== undefined
          ? { minimumFractionDigits: precision, maximumFractionDigits: precision }
          : undefined
      }
    />
  )
})

NumberInput.displayName = 'NumberInput'
