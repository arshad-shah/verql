import React, { useRef, useState } from 'react'
import {
  useFloating,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  useTransitionStyles,
  FloatingPortal,
  offset,
  flip,
  shift,
  arrow,
  autoUpdate,
  type Placement,
} from '@floating-ui/react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

type TooltipSide = 'top' | 'bottom' | 'left' | 'right'
type TooltipAlign = 'start' | 'center' | 'end'

const tooltipVariants = cva(
  'relative font-medium rounded-[9px] bg-bg-elevated border border-border-default text-text-primary shadow-elevated pointer-events-none whitespace-nowrap',
  {
    variants: {
      size: {
        sm: 'text-[11px] px-2 py-1',
        md: 'text-xs px-3 py-1.5',
        lg: 'text-sm px-4 py-2',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

type TooltipProps = VariantProps<typeof tooltipVariants> & {
  content: string
  side?: TooltipSide
  align?: TooltipAlign
  delay?: number
  className?: string
  children: React.ReactNode
}

const BEAK_DEPTH = 9

function buildPlacement(side: TooltipSide, align: TooltipAlign): Placement {
  if (align === 'center') return side
  return `${side}-${align}`
}

const transformOriginMap: Record<string, string> = {
  top: 'bottom center',
  bottom: 'top center',
  left: 'right center',
  right: 'left center',
}

// Pre-computed SVG paths per side — no CSS rotation needed.
// Vertical (top/bottom): 22x9 viewBox. Horizontal (left/right): 9x22 viewBox.
const beakGeometry: Record<string, { fill: string; stroke: string; w: number; h: number }> = {
  top: {
    fill: 'M0 0C0 0 6 0 9 6.5C10 8.5 12 8.5 13 6.5C16 0 22 0 22 0Z',
    stroke: 'M0.5 0C0.5 0 6 0 9 6.5C10 8.5 12 8.5 13 6.5C16 0 21.5 0 21.5 0',
    w: 22, h: 9,
  },
  bottom: {
    fill: 'M0 9C0 9 6 9 9 2.5C10 0.5 12 0.5 13 2.5C16 9 22 9 22 9Z',
    stroke: 'M0.5 9C0.5 9 6 9 9 2.5C10 0.5 12 0.5 13 2.5C16 9 21.5 9 21.5 9',
    w: 22, h: 9,
  },
  left: {
    fill: 'M0 0C0 0 0 6 6.5 9C8.5 10 8.5 12 6.5 13C0 16 0 22 0 22Z',
    stroke: 'M0 0.5C0 0.5 0 6 6.5 9C8.5 10 8.5 12 6.5 13C0 16 0 21.5 0 21.5',
    w: 9, h: 22,
  },
  right: {
    fill: 'M9 0C9 0 9 6 2.5 9C0.5 10 0.5 12 2.5 13C9 16 9 22 9 22Z',
    stroke: 'M9 0.5C9 0.5 9 6 2.5 9C0.5 10 0.5 12 2.5 13C9 16 9 21.5 9 21.5',
    w: 9, h: 22,
  },
}

const TooltipBeak = React.forwardRef<SVGSVGElement, {
  side: string
  x?: number
  y?: number
}>(function TooltipBeak({ side, x, y }, ref) {
  const isVertical = side === 'top' || side === 'bottom'
  const staticSide = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[side]!
  const geo = beakGeometry[side] ?? beakGeometry.top

  // When floating-ui's arrow middleware resolves a coordinate, it is the
  // beak's leading edge inside the floating panel. Use it raw — no centering
  // transform — so the beak stays anchored to the reference even when the
  // panel has been `shift`ed away from a viewport edge. Fall back to 50%
  // centering only before the first measurement.
  const style: React.CSSProperties = {
    position: 'absolute',
    [staticSide]: `-${BEAK_DEPTH}px`,
    ...(isVertical
      ? x != null
        ? { left: `${x}px` }
        : { left: '50%', transform: 'translateX(-50%)' }
      : y != null
        ? { top: `${y}px` }
        : { top: '50%', transform: 'translateY(-50%)' }),
    pointerEvents: 'none',
  }

  return (
    <svg
      ref={ref}
      data-tooltip-beak=""
      style={style}
      width={geo.w}
      height={geo.h}
      viewBox={`0 0 ${geo.w} ${geo.h}`}
      fill="none"
    >
      <path d={geo.fill} className="fill-bg-elevated" />
      <path d={geo.stroke} className="stroke-border-default" strokeWidth="1" fill="none" />
    </svg>
  )
})

export function Tooltip({
  content,
  side = 'top',
  align = 'center',
  delay = 400,
  size,
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
      offset(8 + BEAK_DEPTH),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      // padding here keeps the beak from overlapping the panel's rounded
      // corners when the floating element gets shifted near a viewport edge.
      arrow({ element: arrowRef, padding: 10 }),
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

  return (
    <>
      <span ref={refs.setReference} {...getReferenceProps()} className="inline-flex">
        {children}
      </span>
      {isMounted && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            role="tooltip"
            style={{ ...floatingStyles, zIndex: 50 }}
            {...getFloatingProps()}
          >
            <div
              className={cn(tooltipVariants({ size }), className)}
              style={{
                ...transitionStyles,
                letterSpacing: '0.01em',
              }}
            >
              {content}
              <TooltipBeak
                ref={arrowRef}
                side={resolvedSide}
                x={arrowData?.x}
                y={arrowData?.y}
              />
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  )
}
