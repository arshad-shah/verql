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

const directionMap: Record<string, string> = {
  row: 'flex-row',
  column: 'flex-col',
  'row-reverse': 'flex-row-reverse',
  'column-reverse': 'flex-col-reverse',
}

const alignMap: Record<string, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
}

const justifyMap: Record<string, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
}

export interface FlexProps extends ComponentPropsWithRef<'div'> {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  gap?: SpacingToken
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  wrap?: boolean
}

export const Flex = forwardRef<HTMLDivElement, FlexProps>(
  ({ direction, gap, align, justify, wrap, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          direction && directionMap[direction],
          gap && gapMap[gap],
          align && alignMap[align],
          justify && justifyMap[justify],
          wrap && 'flex-wrap',
          className
        )}
        {...props}
      />
    )
  }
)

Flex.displayName = 'Flex'
