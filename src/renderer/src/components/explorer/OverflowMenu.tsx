import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { MoreHorizontal } from 'lucide-react'
import { IconButton, Text } from '@/primitives'

export interface MenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'danger'
}

interface OverflowMenuProps {
  items: MenuItem[]
}

export function OverflowMenu({ items }: OverflowMenuProps) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const rect = buttonRef.current?.getBoundingClientRect()

  return (
    <>
      <IconButton
        ref={buttonRef}
        label="More actions"
        size="xs"
        variant="ghost"
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        className="text-text-muted hover:text-text-primary"
      >
        <MoreHorizontal size={12} />
      </IconButton>
      {open && rect && createPortal(
        <div
          ref={menuRef}
          className="fixed z-50 bg-bg-secondary border border-border rounded-lg shadow-xl py-1 min-w-36"
          style={{ top: rect.bottom + 4, left: rect.right - 144 }}
        >
          {items.map((item) => (
            <button
              key={item.label}
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                item.onClick()
              }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/5 transition-colors text-left ${
                item.variant === 'danger' ? 'text-error' : 'text-text-secondary'
              }`}
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              <Text size="xs" color={item.variant === 'danger' ? 'error' : 'secondary'}>{item.label}</Text>
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}
