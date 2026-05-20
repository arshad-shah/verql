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
      <div {...({ popoverTarget: id } as Record<string, unknown>)}>{trigger}</div>
      <div
        id={id}
        {...({ popover: 'auto' } as Record<string, unknown>)}
        className={cn(
          'bg-bg-elevated border border-border-default rounded-lg p-2 m-0 shadow-[var(--shadow-dropdown)]',
          className
        )}
      >
        {content}
      </div>
    </div>
  )
}
