import React, { createContext, useContext, useState } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'
import { ChevronDown, ChevronRight } from 'lucide-react'

/* ── Context ────────────────────────────────────────────── */

type AccordionSize = 'sm' | 'md'

const SizeContext = createContext<AccordionSize>('sm')

interface ItemContext {
  open: boolean
  toggle: () => void
}

const ItemContext = createContext<ItemContext>({ open: false, toggle: () => {} })

/* ── Variants ───────────────────────────────────────────── */

const triggerVariants = cva(
  'w-full flex items-center gap-1 bg-bg-primary hover:bg-hover transition-colors duration-[var(--transition-fast)] cursor-pointer border-0 text-left',
  {
    variants: {
      size: {
        sm: 'px-2 py-1.5 text-xs',
        md: 'px-3 py-2 text-sm',
      },
    },
    defaultVariants: { size: 'sm' },
  }
)

/* ── Sub-components ─────────────────────────────────────── */

function Actions({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      className={cn('flex items-center gap-1 shrink-0', props.className)}
      onClick={(e) => {
        e.stopPropagation()
        props.onClick?.(e)
      }}
    >
      {children}
    </span>
  )
}

function Trigger({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { open, toggle } = useContext(ItemContext)
  const size = useContext(SizeContext)
  const Chevron = open ? ChevronDown : ChevronRight

  // Separate Actions from other children so they live outside the button
  const childArray = React.Children.toArray(children)
  const actions = childArray.filter(
    (c) => React.isValidElement(c) && c.type === Actions
  )
  const rest = childArray.filter(
    (c) => !(React.isValidElement(c) && c.type === Actions)
  )

  return (
    <div className={cn(triggerVariants({ size }), className)} {...props}>
      <button
        type="button"
        className="flex items-center gap-1 flex-1 min-w-0 bg-transparent border-0 p-0 text-inherit cursor-pointer"
        onClick={toggle}
        aria-expanded={open}
      >
        <Chevron size={12} className="text-text-muted shrink-0" />
        {rest}
      </button>
      {actions}
    </div>
  )
}

function Content({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { open } = useContext(ItemContext)
  if (!open) return null
  return (
    <div className={cn('pb-1', className)} {...props}>
      {children}
    </div>
  )
}

interface ItemProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function Item({
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  children,
  className,
  ...props
}: ItemProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  function toggle() {
    if (isControlled) {
      onOpenChange?.(!open)
    } else {
      setUncontrolledOpen((prev) => !prev)
    }
  }

  return (
    <ItemContext.Provider value={{ open, toggle }}>
      <div className={cn('border-b border-border-default', className)} {...props}>
        {children}
      </div>
    </ItemContext.Provider>
  )
}

/* ── Root ────────────────────────────────────────────────── */

interface AccordionProps extends VariantProps<typeof triggerVariants> {
  children: React.ReactNode
  className?: string
}

function AccordionRoot({ size = 'sm', children, className }: AccordionProps) {
  return (
    <SizeContext.Provider value={size ?? 'sm'}>
      <div className={className}>{children}</div>
    </SizeContext.Provider>
  )
}

export const Accordion = Object.assign(AccordionRoot, {
  Item,
  Trigger,
  Actions,
  Content,
})
