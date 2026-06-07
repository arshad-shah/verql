import React, { useEffect, useRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const modalVariants = cva(
  'fixed inset-0 m-auto backdrop:bg-black/50 backdrop:backdrop-blur-sm bg-bg-secondary border border-border-default rounded-lg p-0 w-full text-text-primary shadow-[var(--shadow-elevated)]',
  {
    variants: {
      size: {
        sm: 'max-w-sm max-h-[70vh]',
        md: 'max-w-lg max-h-[85vh]',
        lg: 'max-w-2xl max-h-[90vh]',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

type ModalProps = VariantProps<typeof modalVariants> & {
  open: boolean
  onClose: () => void
  className?: string
  children?: React.ReactNode
}

export function Modal({ open, onClose, size, className, children }: ModalProps) {
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
      className={cn(modalVariants({ size }), className)}
    >
      {children}
    </dialog>
  )
}
