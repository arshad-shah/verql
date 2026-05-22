import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const skeletonVariants = cva('skeleton-token block overflow-hidden relative isolate', {
  variants: {
    shape: {
      line: 'h-4 w-full rounded-md',
      block: 'h-24 w-full rounded-md',
      circle: 'rounded-full aspect-square',
      pill: 'h-6 w-24 rounded-full',
    },
    animation: {
      shimmer: 'skeleton-token--shimmer',
      pulse: 'skeleton-token--pulse',
      none: '',
    },
  },
  defaultVariants: {
    shape: 'line',
    animation: 'shimmer',
  },
})

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

/**
 * Theme-aware loading placeholder. Colours derive from
 * `--color-skeleton-base` / `--color-skeleton-highlight`, which in turn fall
 * back to a `color-mix()` of the active theme's `--color-text-primary`. That
 * guarantees the placeholder is visible on any bundled or plugin-supplied
 * theme — light or dark — without the theme having to know the component
 * exists.
 */
export function Skeleton({ className, shape, animation, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      data-skeleton=""
      className={cn(skeletonVariants({ shape, animation }), className)}
      {...props}
    />
  )
}
