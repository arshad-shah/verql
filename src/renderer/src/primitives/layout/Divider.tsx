import React, { ComponentPropsWithRef, forwardRef } from 'react'
import { cn } from '../utils/cn'

export interface DividerProps extends ComponentPropsWithRef<'div'> {
  orientation?: 'horizontal' | 'vertical'
}

export const Divider = forwardRef<HTMLDivElement, DividerProps>(
  ({ orientation = 'horizontal', className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation={orientation}
        className={cn(
          'border-border-default',
          orientation === 'horizontal' ? 'border-t w-full' : 'border-l h-full',
          className
        )}
        {...props}
      />
    )
  }
)

Divider.displayName = 'Divider'
