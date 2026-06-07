import React, { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const sliderVariants = cva(
  cn(
    // Size-independent base
    'w-full rounded-full bg-bg-tertiary shadow-[var(--shadow-input-inset)] appearance-none cursor-pointer',
    '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-[var(--shadow-elevated)]',
    '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-[var(--shadow-elevated)]',
    'focus:outline-none focus:shadow-[var(--shadow-focus-glow)]',
    'disabled:pointer-events-none disabled:opacity-50'
  ),
  {
    variants: {
      size: {
        sm: 'h-1 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3',
        md: 'h-1.5 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4',
        lg: 'h-2 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

export interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof sliderVariants> {}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ className, size, ...props }, ref) => {
    return (
      <input
        type="range"
        ref={ref}
        className={cn(sliderVariants({ size }), className)}
        {...props}
      />
    )
  }
)

Slider.displayName = 'Slider'
