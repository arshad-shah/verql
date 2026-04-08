import React, { ComponentPropsWithoutRef, forwardRef } from 'react'
import { cn } from '../utils/cn'

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

const levelStyles: Record<HeadingLevel, string> = {
  1: 'text-3xl font-bold',
  2: 'text-2xl font-semibold',
  3: 'text-xl font-semibold',
  4: 'text-lg font-medium',
  5: 'text-base font-medium',
  6: 'text-sm font-medium',
}

type HeadingProps = {
  level?: HeadingLevel
  className?: string
  children?: React.ReactNode
} & Omit<ComponentPropsWithoutRef<'h1'>, 'className' | 'children'>

export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ level = 2, className, ...props }, ref) => {
    const Component = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    return (
      <Component
        ref={ref}
        className={cn('text-text-primary', levelStyles[level], className)}
        {...props}
      />
    )
  }
)

Heading.displayName = 'Heading'
