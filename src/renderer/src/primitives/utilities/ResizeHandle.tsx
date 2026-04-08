import React, { useRef, useCallback } from 'react'
import { cn } from '../utils/cn'

export interface ResizeHandleProps {
  direction: 'horizontal' | 'vertical'
  onResize: (delta: number) => void
  onResizeEnd?: () => void
  onDoubleClick?: () => void
  className?: string
}

export function ResizeHandle({
  direction,
  onResize,
  onResizeEnd,
  onDoubleClick,
  className,
}: ResizeHandleProps) {
  const startPosRef = useRef<number>(0)

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const current = direction === 'horizontal' ? e.clientX : e.clientY
      const delta = current - startPosRef.current
      startPosRef.current = current
      onResize(delta)
    },
    [direction, onResize]
  )

  const handlePointerUp = useCallback(() => {
    document.removeEventListener('pointermove', handlePointerMove)
    document.removeEventListener('pointerup', handlePointerUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    onResizeEnd?.()
  }, [handlePointerMove, onResizeEnd])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      startPosRef.current = direction === 'horizontal' ? e.clientX : e.clientY
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize'
      document.body.style.userSelect = 'none'
      document.addEventListener('pointermove', handlePointerMove)
      document.addEventListener('pointerup', handlePointerUp)
    },
    [direction, handlePointerMove, handlePointerUp]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const smallStep = 10
      const largeStep = 50
      const step = e.shiftKey ? largeStep : smallStep

      if (direction === 'horizontal') {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          onResize(-step)
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          onResize(step)
        }
      } else {
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          onResize(-step)
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          onResize(step)
        }
      }
    },
    [direction, onResize]
  )

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-orientation={direction}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      onDoubleClick={onDoubleClick}
      className={cn(
        'shrink-0 bg-transparent hover:bg-accent/50 transition-colors',
        direction === 'horizontal' ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize',
        className
      )}
    />
  )
}
