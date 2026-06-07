import React, { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const surfaceVariants = cva('relative overflow-hidden', {
  variants: {
    tone: { accent: '', neutral: '' },
    intensity: { subtle: '', bold: '' },
  },
  defaultVariants: { tone: 'accent', intensity: 'subtle' },
})

/**
 * Theme-aware decorative gradients, derived from the active theme tokens via
 * color-mix so the surface fits light/dark and any plugin theme automatically.
 * Indexed by `tone` then `intensity`.
 */
const BACKGROUND: Record<'accent' | 'neutral', Record<'subtle' | 'bold', string>> = {
  accent: {
    subtle:
      'radial-gradient(150px 150px at 28% 18%, color-mix(in oklab, var(--color-accent) 26%, transparent), transparent 70%),' +
      'linear-gradient(160deg, color-mix(in oklab, var(--color-accent) 12%, var(--color-bg-primary)), var(--color-bg-primary))',
    bold:
      'radial-gradient(180px 180px at 26% 14%, color-mix(in oklab, var(--color-accent) 42%, transparent), transparent 70%),' +
      'linear-gradient(160deg, color-mix(in oklab, var(--color-accent) 22%, var(--color-bg-primary)), var(--color-bg-primary))',
  },
  neutral: {
    subtle:
      'linear-gradient(160deg, color-mix(in oklab, var(--color-text-primary) 8%, var(--color-bg-primary)), var(--color-bg-primary))',
    bold:
      'linear-gradient(160deg, color-mix(in oklab, var(--color-text-primary) 16%, var(--color-bg-primary)), var(--color-bg-primary))',
  },
}

export interface GradientSurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof surfaceVariants> {}

/**
 * A decorative surface that paints a soft, theme-derived gradient — for brand
 * hero panels, empty states, callouts, etc. It only owns the background (plus
 * `relative overflow-hidden`); compose layout inside with Flex/Stack/Box.
 */
export const GradientSurface = forwardRef<HTMLDivElement, GradientSurfaceProps>(
  ({ tone, intensity, className, style, children, ...props }, ref) => {
    const t = tone ?? 'accent'
    const i = intensity ?? 'subtle'
    return (
      <div
        ref={ref}
        className={cn(surfaceVariants({ tone, intensity }), className)}
        style={{ background: BACKGROUND[t][i], ...style }}
        {...props}
      >
        {children}
      </div>
    )
  }
)

GradientSurface.displayName = 'GradientSurface'
