import React, { forwardRef } from 'react'
import { cn } from '../utils/cn'

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        ref={ref}
        className={cn(
          // Base: 16x16 box, hidden native appearance
          'relative h-4 w-4 cursor-pointer appearance-none rounded border border-border-default',
          'bg-[linear-gradient(180deg,var(--color-input-gradient-top),var(--color-input-gradient-bottom)),var(--color-bg-tertiary)]',
          'shadow-input-inset',
          'transition-all duration-(--transition-fast)',
          // Hover
          'hover:border-border-strong',
          // Checked
          'checked:bg-accent checked:border-accent checked:shadow-none',
          'checked:hover:brightness-110',
          // Focus
          'focus:outline-none focus:shadow-[var(--shadow-focus-glow)]',
          'checked:focus:shadow-focus-glow',
          // Disabled
          'disabled:pointer-events-none disabled:opacity-50',
          // Checkmark pseudo-element (CSS border trick)
          'before:absolute before:left-1/2 before:top-1/2 before:-translate-x-1/2 before:-translate-y-[60%]',
          'before:h-2 before:w-1.25 before:rotate-45',
          'before:border-b-2 before:border-r-2 before:border-white',
          'before:opacity-0 before:scale-0',
          'before:transition-all before:duration-(--transition-fast)',
          // Checkmark visible on checked
          'checked:before:opacity-100 checked:before:scale-100',
          className
        )}
        {...props}
      />
    )
  }
)

Checkbox.displayName = 'Checkbox'
