import React, { useRef, useState } from 'react'
import {
  useFloating,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  useTransitionStyles,
  offset,
  flip,
  shift,
  arrow,
  autoUpdate,
  type Placement,
} from '@floating-ui/react'
import { cn } from '../utils/cn'

type TooltipSide = 'top' | 'bottom' | 'left' | 'right'
type TooltipAlign = 'start' | 'center' | 'end'

type TooltipProps = {
  content: string
  side?: TooltipSide
  align?: TooltipAlign
  delay?: number
  className?: string
  children: React.ReactNode
}

const BEAK_WIDTH = 22
const BEAK_HEIGHT = 9

function buildPlacement(side: TooltipSide, align: TooltipAlign): Placement {
  if (align === 'center') return side
  return `${side}-${align}`
}

const beakRotation: Record<string, string> = {
  top: 'rotate(0deg)',
  bottom: 'rotate(180deg)',
  left: 'rotate(-90deg)',
  right: 'rotate(90deg)',
}

const transformOriginMap: Record<string, string> = {
  top: 'bottom center',
  bottom: 'top center',
  left: 'right center',
  right: 'left center',
}

function TooltipBeak({
  side,
  x,
  y,
}: {
  side: string
  x?: number
  y?: number
}) {
  const isVertical = side === 'top' || side === 'bottom'
  const staticSide = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[side]!

  const style: React.CSSProperties = {
    position: 'absolute',
    [staticSide]: `-${BEAK_HEIGHT}px`,
    ...(isVertical
      ? { left: x != null ? `${x}px` : '50%', transform: `translateX(-50%) ${beakRotation[side]}` }
      : { top: y != null ? `${y}px` : '50%', transform: `translateY(-50%) ${beakRotation[side]}` }),
    pointerEvents: 'none',
  }

  return (
    <svg
      data-tooltip-beak=""
      style={style}
      width={BEAK_WIDTH}
      height={BEAK_HEIGHT}
      viewBox={`0 0 ${BEAK_WIDTH} ${BEAK_HEIGHT}`}
      fill="none"
    >
      <path
        d="M0 0C0 0 6 0 9 6.5C10 8.5 12 8.5 13 6.5C16 0 22 0 22 0Z"
        className="fill-bg-elevated"
      />
      <path
        d="M0.5 0C0.5 0 6 0 9 6.5C10 8.5 12 8.5 13 6.5C16 0 21.5 0 21.5 0"
        className="stroke-border-default"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  )
}

export function Tooltip({
  content,
  side = 'top',
  align = 'center',
  delay = 400,
  className,
  children,
}: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const arrowRef = useRef<SVGSVGElement>(null)

  const { refs, floatingStyles, context, middlewareData, placement } = useFloating({
    placement: buildPlacement(side, align),
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8 + BEAK_HEIGHT),
      flip(),
      shift({ padding: 8 }),
      arrow({ element: arrowRef, padding: 8 }),
    ],
  })

  const hover = useHover(context, { delay: { open: delay, close: 0 } })
  const focus = useFocus(context)
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'tooltip' })

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ])

  const resolvedSide = placement.split('-')[0]

  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    duration: { open: 150, close: 100 },
    initial: { opacity: 0, transform: 'scale(0.95)' },
    common: ({ side: s }) => ({
      transformOrigin: transformOriginMap[s] ?? 'center',
      transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    }),
    open: { opacity: 1, transform: 'scale(1)' },
    close: { opacity: 0, transform: 'scale(0.95)' },
  })

  const arrowData = middlewareData.arrow

  // Merge floating-ui reference props onto the child element so that
  // event listeners (mouseenter, focus, etc.) are attached directly to
  // the trigger rather than an intermediate wrapper.  This ensures
  // non-bubbling events like mouseenter reach the reference element.
  const referenceProps = getReferenceProps()
  const child = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        ref: refs.setReference,
        ...referenceProps,
      })
    : (
        <span ref={refs.setReference} {...referenceProps} className="inline-flex">
          {children}
        </span>
      )

  return (
    <>
      {child}
      {isMounted && (
        <div
          ref={refs.setFloating}
          role="tooltip"
          className={cn(
            'relative px-3 py-1.5 text-xs font-medium rounded-[9px]',
            'bg-bg-elevated border border-border-default text-text-primary',
            'shadow-[var(--shadow-elevated)]',
            'pointer-events-none whitespace-nowrap',
            className
          )}
          style={{
            ...floatingStyles,
            ...transitionStyles,
            zIndex: 50,
            letterSpacing: '0.01em',
          }}
          {...getFloatingProps()}
        >
          {content}
          <TooltipBeak
            side={resolvedSide}
            x={arrowData?.x}
            y={arrowData?.y}
          />
        </div>
      )}
    </>
  )
}
