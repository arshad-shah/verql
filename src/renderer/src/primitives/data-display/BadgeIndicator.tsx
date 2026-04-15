import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const indicatorVariants = cva(
  'absolute flex items-center justify-center rounded-full bg-error ring-2 ring-bg-primary',
  {
    variants: {
      variant: {
        dot: 'h-2.5 w-2.5',
        number:
          'min-w-[18px] h-[18px] px-1 text-[12px] font-bold leading-none text-white',
      },
    },
    defaultVariants: {
      variant: 'dot',
    },
  }
)

export interface BadgeIndicatorProps
  extends VariantProps<typeof indicatorVariants> {
  /** The content to wrap with a badge indicator */
  children: React.ReactNode
  /** Count to display when variant is "number". Clamped to max. */
  count?: number
  /** Maximum number to display before showing "max+" (default 99) */
  max?: number
  /** Hide the indicator */
  hidden?: boolean
  /** Additional class name for the indicator dot/number */
  className?: string
}

export function BadgeIndicator({
  children,
  variant = 'dot',
  count,
  max = 99,
  hidden = false,
  className,
}: BadgeIndicatorProps) {
  const isHidden = hidden || (variant === 'number' && (count == null || count <= 0))

  if (isHidden) {
    return <>{children}</>
  }

  const displayCount =
    variant === 'number' && count != null
      ? count > max
        ? `${max}+`
        : `${count}`
      : null

  return (
    <span className="relative inline-flex">
      {children}
      <span
        className={cn(
          indicatorVariants({ variant }),
          variant === 'dot' ? 'top-1 right' : 'top-0.5 right-0.5 -translate-y-1/3 translate-x-1/3',
          className
        )}
      >
        {displayCount}
      </span>
    </span>
  )
}
