import React, { forwardRef } from 'react'
import { cn } from '../utils/cn'

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="radio"
        ref={ref}
        className={cn(
          'h-4 w-4 rounded-full border border-border-default bg-bg-tertiary transition-all duration-[var(--transition-fast)]',
          'focus:outline-none focus:shadow-[var(--shadow-focus-glow)]',
          'checked:bg-accent checked:border-accent',
          'disabled:pointer-events-none disabled:opacity-50',
          className
        )}
        {...props}
      />
    )
  }
)

Radio.displayName = 'Radio'
