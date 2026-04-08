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
        'backdrop:bg-black/50 bg-bg-secondary border border-border-default rounded-lg p-0 max-w-lg w-full text-text-primary',
        className
      )}
    >
      {children}
    </dialog>
  )
}
