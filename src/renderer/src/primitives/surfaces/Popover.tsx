import React, { useId } from 'react'
import { cn } from '../utils/cn'

type PopoverProps = {
  trigger: React.ReactNode
  content: React.ReactNode
  className?: string
}

export function Popover({ trigger, content, className }: PopoverProps) {
  const id = useId()

  return (
    <div>
      {/* @ts-expect-error popoverTarget is not in React types yet */}
      <div popoverTarget={id}>{trigger}</div>
      {/* @ts-expect-error popover is not in React types yet */}
      <div
        id={id}
        popover="auto"
        className={cn(
          'bg-bg-elevated border border-border-default rounded-lg p-2 m-0',
          className
        )}
      >
        {content}
      </div>
    </div>
  )
}
