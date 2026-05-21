import { useState, useCallback, useRef, type DragEvent } from 'react'

interface UseTabDragOptions {
  onReorder: (fromIndex: number, toIndex: number) => void
}

export function useTabDrag({ onReorder }: UseTabDragOptions) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const dragStartX = useRef(0)
  const hasMoved = useRef(false)

  const onDragStart = useCallback((e: DragEvent, index: number) => {
    dragStartX.current = e.clientX
    hasMoved.current = false
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    // Set a transparent drag image
    const ghost = document.createElement('div')
    ghost.style.opacity = '0'
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 0, 0)
    requestAnimationFrame(() => ghost.remove())
  }, [])

  const onDragOver = useCallback((e: DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (!hasMoved.current && Math.abs(e.clientX - dragStartX.current) > 3) {
      hasMoved.current = true
    }
    if (hasMoved.current) {
      setDropIndex(index)
    }
  }, [])

  const onDragEnd = useCallback(() => {
    if (hasMoved.current && draggedIndex !== null && dropIndex !== null && draggedIndex !== dropIndex) {
      onReorder(draggedIndex, dropIndex)
    }
    setDraggedIndex(null)
    setDropIndex(null)
    hasMoved.current = false
  }, [draggedIndex, dropIndex, onReorder])

  return {
    draggedIndex,
    dropIndex,
    onDragStart,
    onDragOver,
    onDragEnd,
  }
}
