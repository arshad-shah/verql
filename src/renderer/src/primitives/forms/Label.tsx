import React, { forwardRef } from 'react'
import { cn } from '../utils/cn'

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn('text-sm font-medium text-text-primary', className)}
        {...props}
      />
    )
  }
)

Label.displayName = 'Label'
