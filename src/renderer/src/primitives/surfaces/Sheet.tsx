import React, { useEffect, useRef } from 'react'
import { cn } from '../utils/cn'

type SheetSide = 'right' | 'left' | 'bottom'

type SheetProps = {
  open: boolean
  onClose: () => void
  side?: SheetSide
  className?: string
  children?: React.ReactNode
}

const sideStyles: Record<SheetSide, string> = {
  right: 'fixed top-0 right-0 h-full rounded-l-lg',
  left: 'fixed top-0 left-0 h-full rounded-r-lg',
  bottom: 'fixed bottom-0 left-0 w-full rounded-t-lg',
}

export function Sheet({ open, onClose, side = 'right', className, children }: SheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [open])

  function handleClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) {
      onClose()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={handleClick}
      className={cn(
        'backdrop:bg-black/50 bg-bg-secondary border border-border-default p-0 max-h-full max-w-sm text-text-primary shadow-[var(--shadow-elevated)]',
        sideStyles[side],
        className
      )}
    >
      {children}
    </dialog>
  )
}
