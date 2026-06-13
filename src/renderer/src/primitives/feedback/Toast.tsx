import React, { useCallback, useEffect, useRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '../utils/cn'
import { Flex } from '../layout/Flex'
import { Text } from '../typography/Text'
import { IconButton } from '../forms/Button'

const toastVariants = cva(
  cn(
    'toast relative overflow-hidden border rounded-[var(--field-r-lg)] shadow-[var(--shadow-elevated)] toast-enter',
    // density-aware padding; extra left padding clears the rail
    'py-[calc(var(--field-gap)+2px)] pr-[calc(var(--field-px)+1px)] pl-[calc(var(--field-px)+5px)]',
  ),
  {
    variants: {
      variant: {
        default: 'bg-bg-elevated border-border-default',
        success:
          '[--toast-vc:var(--color-success)] bg-[color-mix(in_srgb,var(--color-success)_6%,var(--color-bg-elevated))] border-[color-mix(in_srgb,var(--color-success)_26%,var(--color-border-default))]',
        error:
          '[--toast-vc:var(--color-error)] bg-[color-mix(in_srgb,var(--color-error)_6%,var(--color-bg-elevated))] border-[color-mix(in_srgb,var(--color-error)_26%,var(--color-border-default))]',
        warning:
          '[--toast-vc:var(--color-warning)] bg-[color-mix(in_srgb,var(--color-warning)_6%,var(--color-bg-elevated))] border-[color-mix(in_srgb,var(--color-warning)_26%,var(--color-border-default))]',
        info:
          '[--toast-vc:var(--color-info)] bg-[color-mix(in_srgb,var(--color-info)_6%,var(--color-bg-elevated))] border-[color-mix(in_srgb,var(--color-info)_26%,var(--color-border-default))]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

const variantIcons = {
  default: null,
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
} as const

export interface ToastProps extends VariantProps<typeof toastVariants> {
  message: string
  onDismiss: () => void
  /**
   * When set (ms), renders an auto-dismiss progress track that pauses while
   * hovered and calls `onDismiss` when it elapses. Omit to let the toast
   * manager own timing (no track is rendered).
   */
  duration?: number
  className?: string
}

export function Toast({ message, onDismiss, variant = 'default', duration, className }: ToastProps) {
  const v = variant ?? 'default'
  const IconComponent = variantIcons[v]
  const showRail = v !== 'default'

  // auto-dismiss with pause-on-hover — only active when `duration` is provided
  const remaining = useRef(duration ?? 0)
  const startedAt = useRef(0)
  const timer = useRef<number | null>(null)
  const paused = useRef(false)

  const clear = useCallback(() => {
    if (timer.current != null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  const arm = useCallback(() => {
    if (duration == null) return
    startedAt.current = Date.now()
    timer.current = window.setTimeout(onDismiss, Math.max(0, remaining.current))
  }, [duration, onDismiss])

  useEffect(() => {
    if (duration == null) return
    remaining.current = duration
    paused.current = false
    arm()
    return clear
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration])

  const handleMouseEnter = () => {
    if (duration == null || paused.current) return
    paused.current = true
    clear()
    remaining.current -= Date.now() - startedAt.current
  }
  const handleMouseLeave = () => {
    if (duration == null || !paused.current) return
    paused.current = false
    arm()
  }

  return (
    <div
      className={cn(toastVariants({ variant }), className)}
      role={v === 'error' || v === 'warning' ? 'alert' : 'status'}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showRail && (
        <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-[var(--toast-vc)]" />
      )}

      <Flex gap="sm" align="start">
        {IconComponent && (
          <IconComponent size={15} className="shrink-0 mt-px text-[var(--toast-vc)]" />
        )}
        <Text size="sm" className="flex-1 min-w-0 leading-snug">
          {message}
        </Text>
        <IconButton
          label="Dismiss"
          variant="ghost"
          size="xs"
          onClick={onDismiss}
          className="shrink-0 -mr-1 -mt-0.5"
        >
          <X size={14} />
        </IconButton>
      </Flex>

      {duration != null && (
        <span
          aria-hidden
          className="toast-progress absolute inset-x-0 bottom-0 h-[2px] origin-left bg-[var(--toast-vc,var(--color-accent))]"
          style={{ animationDuration: `${duration}ms` }}
        />
      )}
    </div>
  )
}
