import React, { useState } from 'react'
import { cn } from '../utils/cn'

type TooltipSide = 'top' | 'bottom' | 'left' | 'right'

type TooltipProps = {
  content: string
  side?: TooltipSide
  className?: string
  children: React.ReactNode
}

const positionMap: Record<TooltipSide, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
  left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
  right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
}

export function Tooltip({ content, side = 'top', className, children }: TooltipProps) {
  const [visible, setVisible] = useState(false)

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      <span
        role="tooltip"
        className={cn(
          'absolute z-50 pointer-events-none px-2 py-1 text-xs rounded bg-bg-elevated border border-border-default text-text-primary whitespace-nowrap',
          positionMap[side],
          !visible && 'hidden',
          className
        )}
      >
        {content}
      </span>
    </span>
  )
}
