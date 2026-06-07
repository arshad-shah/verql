import React, { forwardRef } from 'react'
import { cn } from '../utils/cn'

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

/**
 * A toggle built as a hidden checkbox + a visual `<span>` track, so the thumb
 * is positioned with plain box math (no checkbox UA quirks) and stays pixel
 * centred. All colours derive from the `--color-switch-*` component tokens in
 * `theme/tokens.css`, so every bundled and plugin theme gets a legible,
 * on-brand switch for free.
 *
 * Geometry (border-box): track 36×20 with a 1px border → 34×18 padding box.
 * Thumb is 16px, inset 2px (`left-0.5`) and travels 14px (`translate-x-3.5`)
 * so the off/on insets are symmetric; it is vertically centred via
 * `top-1/2 -mt-2`, leaving `translate` free for a springy horizontal slide.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, disabled, ...props }, ref) => {
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
        <span
          aria-hidden="true"
          className={cn(
            // Track — neutral grey off, accent on. Fixed inset shadow so the
            // "well" depth reads the same on every theme.
            'relative h-5 w-9 rounded-full border border-border-strong',
            'bg-[var(--color-switch-track-off)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)]',
            'transition-colors duration-200 ease-out',
            'peer-hover:bg-[var(--color-switch-track-off-hover)]',
            'peer-checked:bg-[var(--color-switch-track-on)] peer-checked:border-[var(--color-switch-track-on)]',
            'peer-checked:peer-hover:bg-accent-hover peer-checked:peer-hover:border-accent-hover',
            // Focus ring (composes with the track shadow via Tailwind ring vars)
            'peer-focus-visible:ring-2 peer-focus-visible:ring-accent/50',
            // Disabled
            'peer-disabled:opacity-50',
            // Knob — a white surface lifted by a fixed drop shadow, so it stays
            // the lightest, raised element and reads identically on any track.
            // 1px inset matches the 1px vertical gap (track is 18px inner,
            // knob 16px) so the gap is uniform on all sides; travel is 16px.
            "before:absolute before:left-px before:top-1/2 before:-mt-2 before:h-4 before:w-4 before:rounded-full before:content-['']",
            'before:bg-[var(--color-switch-thumb)]',
            'before:shadow-[0_1px_2px_rgba(0,0,0,0.25),0_2px_4px_rgba(0,0,0,0.1)]',
            // Only the horizontal slide animates; the springy overshoot reads
            // well on translate but would make a scale shrink unevenly.
            'before:transition-transform before:duration-300 before:ease-[cubic-bezier(0.34,1.56,0.64,1)]',
            'peer-checked:before:translate-x-4'
          )}
        />
      </label>
    )
  }
)

Switch.displayName = 'Switch'
