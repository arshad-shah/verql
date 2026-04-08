import React, { forwardRef } from 'react'
import { cn } from '../utils/cn'

type PanelProps = React.HTMLAttributes<HTMLDivElement>

export const Panel = forwardRef<HTMLDivElement, PanelProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('bg-bg-secondary border border-border-default', className)}
        {...props}
      />
    )
  }
)

Panel.displayName = 'Panel'
