import React, { forwardRef } from 'react'
import { cn } from '../utils/cn'

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, ...props }, ref) => {
    return (
      <a
        ref={ref}
        className={cn(
          'text-accent hover:text-accent-hover underline-offset-2 hover:underline text-sm',
          className
        )}
        {...props}
      />
    )
  }
)

Link.displayName = 'Link'
