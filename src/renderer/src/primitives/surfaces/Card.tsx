import React, { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const cardVariants = cva(
  'border border-border-default rounded-lg bg-bg-secondary',
  {
    variants: {
      padding: {
        none: '',
        sm: 'p-2',
        md: 'p-3',
        lg: 'p-4',
        xl: 'p-6',
      },
    },
    defaultVariants: {
      padding: 'md',
    },
  }
)

type CardProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof cardVariants>

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ padding, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ padding }), className)}
        {...props}
      />
    )
  }
)

Card.displayName = 'Card'
