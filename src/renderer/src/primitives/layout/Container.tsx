import React, { ComponentPropsWithRef, forwardRef } from 'react'
import { cn } from '../utils/cn'

type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

const sizeMap: Record<ContainerSize, string> = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
}

export interface ContainerProps extends ComponentPropsWithRef<'div'> {
  size?: ContainerSize
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ size, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'mx-auto w-full px-4',
          size && sizeMap[size],
          className
        )}
        {...props}
      />
    )
  }
)

Container.displayName = 'Container'
