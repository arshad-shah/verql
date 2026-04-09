import React, { useRef, useCallback, useState } from 'react'
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
  const [isDragging, setIsDragging] = useState(false)

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
    setIsDragging(false)
    onResizeEnd?.()
  }, [handlePointerMove, onResizeEnd])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      startPosRef.current = direction === 'horizontal' ? e.clientX : e.clientY
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize'
      document.body.style.userSelect = 'none'
      setIsDragging(true)
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

  const isHorizontal = direction === 'horizontal'

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-orientation={direction}
      aria-valuenow={0}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      onDoubleClick={onDoubleClick}
      className={cn(
        'group/resize relative shrink-0 focus-visible:outline-none hover:bg-accent/20 active:bg-accent/30 transition-colors duration-[var(--transition-fast)]',
        isHorizontal
          ? 'w-1 cursor-col-resize'
          : 'h-1 cursor-row-resize',
        className
      )}
    >
      {/* Wider invisible hit zone */}
      <div
        className={cn(
          'absolute z-10',
          isHorizontal
            ? 'inset-y-0 -left-1.5 -right-1.5 cursor-col-resize'
            : 'inset-x-0 -top-1.5 -bottom-1.5 cursor-row-resize'
        )}
      />

      {/* Border line — always visible, tints on hover */}
      <div
        className={cn(
          'absolute transition-colors duration-150',
          isHorizontal
            ? 'top-0 bottom-0 left-1/2 w-px -translate-x-1/2'
            : 'left-0 right-0 top-1/2 h-px -translate-y-1/2',
          isDragging
            ? 'bg-accent'
            : 'bg-border-default group-hover/resize:bg-accent/50'
        )}
      />

      {/* Centered pill grab handle — fades in on hover */}
      <div
        className={cn(
          'absolute z-20 pointer-events-none',
          'transition-all duration-200 ease-out rounded-full',
          isHorizontal
            ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8'
            : 'top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 h-1 w-8',
          isDragging
            ? 'bg-accent opacity-100 scale-100'
            : 'bg-text-quaternary opacity-0 scale-75 group-hover/resize:opacity-100 group-hover/resize:scale-100 group-hover/resize:bg-accent/70'
        )}
      />

      {/* Focus indicator */}
      <div
        className={cn(
          'absolute pointer-events-none transition-opacity duration-150',
          'opacity-0 group-focus-visible/resize:opacity-100',
          isHorizontal
            ? 'top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-accent'
            : 'left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-accent'
        )}
      />
    </div>
  )
}
