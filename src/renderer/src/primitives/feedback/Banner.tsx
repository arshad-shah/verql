import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const bannerVariants = cva(
  'w-full px-4 py-2 text-sm shadow-[var(--shadow-card)]',
  {
    variants: {
      variant: {
        default: 'bg-bg-elevated text-text-primary',
        info: 'bg-info/10 text-info',
        warning: 'bg-warning/10 text-warning',
        error: 'bg-error/10 text-error',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BannerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bannerVariants> {}

export function Banner({ className, variant, ...props }: BannerProps) {
  return (
    <div className={cn(bannerVariants({ variant }), className)} {...props} />
  )
}
