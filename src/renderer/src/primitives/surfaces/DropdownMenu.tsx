import React, { useCallback, useState } from 'react'
import {
  useFloating,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  useTransitionStyles,
  offset,
  flip,
  shift,
  autoUpdate,
  FloatingPortal,
} from '@floating-ui/react'
import { cn } from '../utils/cn'

type MenuItem = {
  label: string
  onSelect: () => void
  disabled?: boolean
}

type DropdownMenuProps = {
  trigger: React.ReactElement
  items: MenuItem[]
  className?: string
}

export function DropdownMenu({ trigger, items, className }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const { refs, floatingStyles, context } = useFloating({
    placement: 'bottom-start',
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(4),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
    ],
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'menu' })

  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role])

  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    duration: { open: 150, close: 100 },
    initial: { opacity: 0, transform: 'scaleY(0.95)' },
    common: { transformOrigin: 'top', transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    open: { opacity: 1, transform: 'scaleY(1)' },
    close: { opacity: 0, transform: 'scaleY(0.95)' },
  })

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const menuEl = refs.floating.current
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
        setIsOpen(false)
      }
    },
    [refs.floating]
  )

  return (
    <div>
      {React.cloneElement(trigger as React.ReactElement<Record<string, unknown>>, {
        ref: refs.setReference,
        ...getReferenceProps(),
      })}

      {isMounted && (
        <FloatingPortal>
        <div
          ref={refs.setFloating}
          style={{ ...floatingStyles, zIndex: 50 }}
          {...getFloatingProps()}
        >
          <div
            role="menu"
            onKeyDown={handleKeyDown}
            className={cn(
              'bg-bg-elevated border border-border-default rounded-lg py-1 min-w-[160px] shadow-dropdown',
              className
            )}
            style={transitionStyles}
          >
            {items.map((item) => (
              <button
                key={item.label}
                role="menuitem"
                disabled={item.disabled}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-hover focus:bg-hover disabled:opacity-50 disabled:pointer-events-none transition-colors duration-(--transition-fast)"
                onClick={() => {
                  item.onSelect()
                  setIsOpen(false)
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        </FloatingPortal>
      )}
    </div>
  )
}
