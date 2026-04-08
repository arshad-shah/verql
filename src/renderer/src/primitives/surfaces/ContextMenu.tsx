import React, { useState } from 'react'
import { cn } from '../utils/cn'

type MenuItem = {
  label: string
  onSelect: () => void
  disabled?: boolean
}

type ContextMenuProps = {
  items: MenuItem[]
  className?: string
  children: React.ReactNode
}

type Position = { x: number; y: number }

export function ContextMenu({ items, className, children }: ContextMenuProps) {
  const [position, setPosition] = useState<Position | null>(null)

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    setPosition({ x: e.clientX, y: e.clientY })
  }

  function close() {
    setPosition(null)
  }

  return (
    <div onContextMenu={handleContextMenu}>
      {children}
      {position && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={close}
            aria-hidden="true"
          />
          <div
            role="menu"
            className={cn(
              'fixed z-50 bg-bg-elevated border border-border-default rounded-lg py-1 min-w-[160px]',
              className
            )}
            style={{ top: position.y, left: position.x }}
          >
            {items.map((item) => (
              <button
                key={item.label}
                role="menuitem"
                disabled={item.disabled}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-hover focus:bg-hover disabled:opacity-50 disabled:pointer-events-none"
                onClick={() => {
                  item.onSelect()
                  close()
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
