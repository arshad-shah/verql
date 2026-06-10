import { forwardRef } from 'react'
import { Input, type InputProps } from './Input'

export interface PasswordInputProps extends Omit<InputProps, 'type'> { }

/**
 * Password field — Cynosure's `Input` with `type="password"`, which carries the
 * built-in show/hide toggle. A thin wrapper kept for intent and a stable
 * `@/primitives` export; inherits the value-based `onChange` and `sm` default
 * from {@link Input}. (The old standalone strength meter was unused and dropped.)
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { placeholder = 'Password', ...props },
  ref
) {
  return <Input ref={ref} type="password" placeholder={placeholder} {...props} size="sm" />
})

PasswordInput.displayName = 'PasswordInput'
