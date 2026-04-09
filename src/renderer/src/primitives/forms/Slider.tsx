import React, { forwardRef } from 'react'
import { cn } from '../utils/cn'

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="range"
        ref={ref}
        className={cn(
          'w-full h-1.5 rounded-full bg-bg-tertiary shadow-[var(--shadow-input-inset)] appearance-none cursor-pointer',
          '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-[var(--shadow-elevated)]',
          '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-[var(--shadow-elevated)]',
          'focus:outline-none focus:shadow-[var(--shadow-focus-glow)]',
          'disabled:pointer-events-none disabled:opacity-50',
          className
        )}
        {...props}
      />
    )
  }
)

Slider.displayName = 'Slider'
