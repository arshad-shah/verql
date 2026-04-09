import React, { ComponentPropsWithoutRef, forwardRef } from 'react'
import { cn } from '../utils/cn'

type CodeProps = {
  block?: boolean
  className?: string
  children?: React.ReactNode
} & Omit<ComponentPropsWithoutRef<'code'>, 'className' | 'children'>

export const Code = forwardRef<HTMLElement, CodeProps>(
  ({ block = false, className, children, ...props }, ref) => {
    if (block) {
      return (
        <pre className={cn('block bg-bg-tertiary p-3 rounded-md overflow-x-auto shadow-[var(--shadow-input-inset)]', className)}>
          <code ref={ref} className="font-mono text-xs" {...props}>
            {children}
          </code>
        </pre>
      )
    }

    return (
      <code
        ref={ref}
        className={cn('font-mono text-xs bg-bg-tertiary px-1.5 py-0.5 rounded', className)}
        {...props}
      >
        {children}
      </code>
    )
  }
)

Code.displayName = 'Code'
