import React, { ComponentPropsWithRef, forwardRef } from 'react'
import { cn } from '../utils/cn'

export type SpacerProps = ComponentPropsWithRef<'div'>

export const Spacer = forwardRef<HTMLDivElement, SpacerProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex-1', className)}
        {...props}
      />
    )
  }
)

Spacer.displayName = 'Spacer'
