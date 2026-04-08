import React, { useId, useRef } from 'react'
import { cn } from '../utils/cn'

type MenuItem = {
  label: string
  onSelect: () => void
  disabled?: boolean
}

type DropdownMenuProps = {
  trigger: React.ReactNode
  items: MenuItem[]
  className?: string
}

export function DropdownMenu({ trigger, items, className }: DropdownMenuProps) {
  const id = useId()
  const menuRef = useRef<HTMLDivElement>(null)

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const menuEl = menuRef.current
    if (!menuEl) return
    const itemEls = Array.from(
      menuEl.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])')
    )
    const current = document.activeElement
    const idx = itemEls.indexOf(current as HTMLButtonElement)

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = idx < itemEls.length - 1 ? itemEls[idx + 1] : itemEls[0]
      next?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = idx > 0 ? itemEls[idx - 1] : itemEls[itemEls.length - 1]
      prev?.focus()
    } else if (e.key === 'Escape') {
      // Close via hidePopover
      const popoverEl = menuEl.closest('[popover]') as HTMLElement | null
      popoverEl?.hidePopover?.()
    }
  }

  return (
    <div>
      {/* @ts-expect-error popoverTarget is not in React types yet */}
      <div popoverTarget={id}>{trigger}</div>
      {/* @ts-expect-error popover is not in React types yet */}
      <div
        id={id}
        popover="auto"
        className={cn(
          'bg-bg-elevated border border-border-default rounded-lg py-1 min-w-[160px] m-0',
          className
        )}
        onKeyDown={handleKeyDown}
        ref={menuRef}
      >
        <div role="menu">
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              disabled={item.disabled}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-hover focus:bg-hover disabled:opacity-50 disabled:pointer-events-none"
              onClick={() => {
                item.onSelect()
                const popoverEl = menuRef.current?.closest('[popover]') as HTMLElement | null
                popoverEl?.hidePopover?.()
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
