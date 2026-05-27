import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const avatarVariants = cva(
  'inline-flex items-center justify-center rounded-full bg-accent/10 text-accent font-medium shadow-[var(--shadow-card)] ring-1 ring-border-default',
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-7 w-7 text-xs',
        md: 'h-8 w-8 text-sm',
        lg: 'h-9 w-9 text-sm',
        xl: 'h-10 w-10 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  name: string
  src?: string
  /** Render an icon (e.g. a lucide glyph) instead of initials. `src` wins over this. */
  icon?: React.ReactNode
  className?: string
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

export function Avatar({ name, src, icon, size, className }: AvatarProps) {
  return (
    <span className={cn(avatarVariants({ size }), className)} aria-label={name}>
      {src ? (
        <img src={src} alt={name} className="h-full w-full rounded-full object-cover" />
      ) : icon ? (
        icon
      ) : (
        getInitials(name)
      )}
    </span>
  )
}
