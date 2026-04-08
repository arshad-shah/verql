import React, { ComponentPropsWithoutRef, forwardRef } from 'react'
import { cn } from '../utils/cn'

type KbdProps = {
  className?: string
  children?: React.ReactNode
} & Omit<ComponentPropsWithoutRef<'kbd'>, 'className' | 'children'>

export const Kbd = forwardRef<HTMLElement, KbdProps>(({ className, children, ...props }, ref) => {
  return (
    <kbd
      ref={ref}
      className={cn(
        'inline-flex items-center font-mono text-xs px-1.5 py-0.5 rounded border bg-bg-tertiary border-border-default text-text-secondary',
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  )
})

Kbd.displayName = 'Kbd'
