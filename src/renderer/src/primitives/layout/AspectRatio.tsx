import React, { ComponentPropsWithRef, forwardRef } from 'react'
import { cn } from '../utils/cn'

type AspectRatioValue = 'square' | 'video' | '4/3'

const ratioMap: Record<AspectRatioValue, string> = {
  square: 'aspect-square',
  video: 'aspect-video',
  '4/3': 'aspect-[4/3]',
}

export interface AspectRatioProps extends ComponentPropsWithRef<'div'> {
  ratio?: AspectRatioValue
}

export const AspectRatio = forwardRef<HTMLDivElement, AspectRatioProps>(
  ({ ratio = 'video', className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(ratioMap[ratio], 'overflow-hidden', className)}
        {...props}
      />
    )
  }
)

AspectRatio.displayName = 'AspectRatio'
