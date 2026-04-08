import React, { ComponentPropsWithRef, forwardRef } from 'react'
import { cn } from '../utils/cn'

type ScrollDirection = 'vertical' | 'horizontal' | 'both'

const overflowMap: Record<ScrollDirection, string> = {
  vertical: 'overflow-y-auto',
  horizontal: 'overflow-x-auto',
  both: 'overflow-auto',
}

export interface ScrollAreaProps extends ComponentPropsWithRef<'div'> {
  direction?: ScrollDirection
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ direction = 'both', className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(overflowMap[direction], className)}
        {...props}
      />
    )
  }
)

ScrollArea.displayName = 'ScrollArea'
