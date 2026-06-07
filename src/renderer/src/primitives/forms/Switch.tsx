import React, { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

/**
 * Toggle: a hidden checkbox (`peer`) drives a visual track whose thumb is the
 * track's `::before`, laid out as a flex item.
 *
 * Why this shape:
 * - The track is `shrink-0`, so a tight flex row can't compress it (compression
 *   was what squished the thumb into an oval).
 * - The thumb is a flex item centred by the track's `items-center` — no
 *   `top-1/2 -mt` subpixel math — and its height equals the content box, so it
 *   is pixel-centred; equal width/height makes it a perfect circle.
 * - Per size, padding (1px) + the 1px border give a uniform 2px gap on all four
 *   sides, and the checked translate equals exactly (content width − thumb), so
 *   the off/on insets match.
 *
 * Colours come from the `--color-switch-*` component tokens (see theme/tokens.css)
 * so the toggle reads consistently on every theme.
 */
const switchVariants = cva(
  [
    'relative inline-flex shrink-0 items-center rounded-full border border-border-strong p-px',
    'bg-[var(--color-switch-track-off)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)]',
    'transition-colors duration-200 ease-out',
    'peer-hover:bg-[var(--color-switch-track-off-hover)]',
    'peer-checked:bg-[var(--color-switch-track-on)] peer-checked:border-[var(--color-switch-track-on)]',
    'peer-checked:peer-hover:bg-accent-hover peer-checked:peer-hover:border-accent-hover',
    'peer-focus-visible:ring-2 peer-focus-visible:ring-accent/50',
    'peer-disabled:opacity-50',
    // Thumb (::before) — flex-centred, exact-fit, perfect circle, white + lifted.
    "before:content-[''] before:shrink-0 before:rounded-full before:bg-[var(--color-switch-thumb)]",
    'before:shadow-[0_1px_2px_rgba(0,0,0,0.25),0_2px_4px_rgba(0,0,0,0.1)]',
    'before:transition-transform before:duration-300 before:ease-[cubic-bezier(0.34,1.56,0.64,1)]',
  ],
  {
    variants: {
      size: {
        sm: 'h-4 w-7 before:h-3 before:w-3 peer-checked:before:translate-x-3',
        md: 'h-5 w-9 before:h-4 before:w-4 peer-checked:before:translate-x-4',
        lg: 'h-6 w-11 before:h-5 before:w-5 peer-checked:before:translate-x-5',
      },
    },
    defaultVariants: { size: 'md' },
  }
)

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'>,
    VariantProps<typeof switchVariants> {
  label: string
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, disabled, size, ...props }, ref) => {
    return (
      <label
        className={cn(
          'relative inline-flex shrink-0 items-center align-middle',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
          '[-webkit-tap-highlight-color:transparent]',
          className
        )}
      >
        <input
          type="checkbox"
          role="switch"
          ref={ref}
          aria-label={label}
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />
        <span aria-hidden="true" className={cn(switchVariants({ size }))} />
      </label>
    )
  }
)

Switch.displayName = 'Switch'
