import React, { forwardRef } from 'react'
import { cn } from '../utils/cn'

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        role="switch"
        ref={ref}
        aria-label={label}
        className={cn(
          'h-5 w-9 cursor-pointer appearance-none rounded-full bg-bg-tertiary transition-colors',
          'checked:bg-accent',
          'relative before:absolute before:top-0.5 before:left-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform',
          'checked:before:translate-x-4',
          'focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-0',
          'disabled:pointer-events-none disabled:opacity-50',
          className
        )}
        {...props}
      />
    )
  }
)

Switch.displayName = 'Switch'
