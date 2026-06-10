import { forwardRef, type InputHTMLAttributes, type CSSProperties, type ReactNode } from 'react'
import { Input as CynInput } from '@arshad-shah/cynosure-react/input'

type InputType = 'text' | 'email' | 'password' | 'tel' | 'url' | 'search' | 'number'
type InputVariant = 'outline' | 'filled' | 'ghost' | 'flat'

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'value' | 'defaultValue' | 'onChange' | 'type'> {
  /** @default "sm" */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** Renders the invalid state. Mapped to Cynosure's `invalid`. */
  error?: boolean
  type?: InputType
  /** @default "outline" — `ghost` removes the surface for inline/embedded fields. */
  variant?: InputVariant
  value?: string | number
  defaultValue?: string | number
  /** Value-based change handler — receives the next string, not the event. */
  onChange?: (value: string) => void
  leadingSlot?: ReactNode | ReactNode[]
  trailingSlot?: ReactNode | ReactNode[]
  clearable?: boolean
  className?: string
  style?: CSSProperties
}

/** Cynosure's Input exposes only sm/md/lg; fold the wider in-house scale in. */
const SIZE_MAP = { xs: 'sm', sm: 'sm', md: 'md', lg: 'lg', xl: 'lg' } as const

/**
 * Single-line text field — a props-based wrapper over Cynosure's `Input`
 * (no Tailwind). Keeps the in-house `error` and `xs`/`xl` ergonomics by mapping
 * `error` → `invalid` and folding the sizes onto Cynosure's `sm`/`lg`, and
 * coerces a numeric `value`/`defaultValue` to a string. `onChange` is
 * value-based — it receives the next string rather than a change event.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = 'sm', error, value, defaultValue, ...rest },
  ref
) {
  return (
    <CynInput
      ref={ref}
      size={SIZE_MAP[size]}
      invalid={error}
      value={value != null ? String(value) : undefined}
      defaultValue={defaultValue != null ? String(defaultValue) : undefined}
      {...rest}
    />
  )
})

Input.displayName = 'Input'
