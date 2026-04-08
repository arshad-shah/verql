import React, { ComponentPropsWithRef, forwardRef } from 'react'
import { cn } from '../utils/cn'

type SpacingToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const gapMap: Record<SpacingToken, string> = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
  xl: 'gap-6',
}

const colsMap: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  12: 'grid-cols-12',
}

export interface GridProps extends ComponentPropsWithRef<'div'> {
  columns?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  gap?: SpacingToken
}

export const Grid = forwardRef<HTMLDivElement, GridProps>(
  ({ columns, gap, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'grid',
          columns && colsMap[columns],
          gap && gapMap[gap],
          className
        )}
        {...props}
      />
    )
  }
)

Grid.displayName = 'Grid'
