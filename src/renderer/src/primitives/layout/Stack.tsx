import React, { ComponentPropsWithRef, forwardRef } from 'react'
import { cn } from '../utils/cn'

type SpacingToken = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const gapMap: Record<SpacingToken, string> = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
  xl: 'gap-6',
}

const alignMap: Record<string, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
}

export interface StackProps extends ComponentPropsWithRef<'div'> {
  direction?: 'vertical' | 'horizontal'
  gap?: SpacingToken
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
}

export const Stack = forwardRef<HTMLDivElement, StackProps>(
  ({ direction = 'vertical', gap, align, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          direction === 'horizontal' ? 'flex-row' : 'flex-col',
          gap && gapMap[gap],
          align && alignMap[align],
          className
        )}
        {...props}
      />
    )
  }
)

Stack.displayName = 'Stack'
