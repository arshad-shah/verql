import React, { useEffect, useRef } from 'react'
import { cn } from '../utils/cn'

type ModalProps = {
  open: boolean
  onClose: () => void
  className?: string
  children?: React.ReactNode
}

export function Modal({ open, onClose, className, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closingRef = useRef(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open) {
      dialog.showModal()
    } else {
      closingRef.current = true
      dialog.close()
      closingRef.current = false
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
      onClose={() => { if (!closingRef.current) onClose() }}
      onClick={handleClick}
      className={cn(
        'fixed inset-0 m-auto',
        'backdrop:bg-black/50 backdrop:backdrop-blur-sm bg-bg-secondary border border-border-default rounded-lg p-0 max-w-lg w-full max-h-[85vh] text-text-primary shadow-[var(--shadow-elevated)]',
        className
      )}
    >
      {children}
    </dialog>
  )
}
