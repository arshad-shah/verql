import React, { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const linkVariants = cva(
  'text-accent hover:text-accent-hover underline-offset-2 hover:underline transition-colors duration-[var(--transition-fast)]',
  {
    variants: {
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

export interface LinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof linkVariants> {}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, size, ...props }, ref) => {
    return (
      <a
        ref={ref}
        className={cn(linkVariants({ size }), className)}
        {...props}
      />
    )
  }
)

Link.displayName = 'Link'
