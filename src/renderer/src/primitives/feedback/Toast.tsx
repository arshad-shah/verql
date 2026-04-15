import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '../utils/cn'
import { Flex } from '../layout/Flex'
import { Text } from '../typography/Text'
import { IconButton } from '../forms/Button'

const toastVariants = cva(
  'px-3 py-2 rounded-lg border text-sm shadow-[var(--shadow-elevated)] toast-enter',
  {
    variants: {
      variant: {
        default: 'bg-bg-elevated border-border-default text-text-primary',
        success: 'bg-success/5 border-success text-success',
        error: 'bg-error/5 border-error text-error',
        warning: 'bg-warning/5 border-warning text-warning',
        info: 'bg-info/5 border-info text-info',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const variantIcons = {
  default: null,
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
} as const

const variantTextColor = {
  default: undefined,
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'accent',
} as const

export interface ToastProps extends VariantProps<typeof toastVariants> {
  message: string
  onDismiss: () => void
  className?: string
}

export function Toast({ message, onDismiss, variant = 'default', className }: ToastProps) {
  const IconComponent = variantIcons[variant ?? 'default']
  const textColor = variantTextColor[variant ?? 'default']

  return (
    <div className={cn(toastVariants({ variant }), className)}>
      <Flex gap="sm" align="center">
        {IconComponent && <IconComponent size={14} className="shrink-0" />}
        <Text size="sm" color={textColor} className="flex-1">{message}</Text>
        <IconButton
          label="Dismiss"
          variant="ghost"
          size="xs"
          onClick={onDismiss}
          className="shrink-0 -mr-1"
        >
          <X size={14} />
        </IconButton>
      </Flex>
    </div>
  )
}
