import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '../utils/cn'
import { Flex } from '../layout/Flex'
import { Text } from '../typography/Text'
import { IconButton } from '../forms/Button'

const alertVariants = cva(
  'rounded-lg border border-l-4 px-4 py-3 shadow-[var(--shadow-card)]',
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
  default: Info,
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

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string
  icon?: React.ReactNode
  onClose?: () => void
}

export function Alert({ className, variant = 'default', title, icon, onClose, children, ...props }: AlertProps) {
  const IconComponent = variantIcons[variant ?? 'default']
  const textColor = variantTextColor[variant ?? 'default']
  const resolvedIcon = icon !== undefined ? icon : <IconComponent size={16} className="mt-0.5 shrink-0" />

  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Flex gap="sm" align="start">
        {resolvedIcon}
        <Flex direction="column" gap="xs" className="min-w-0 flex-1">
          {title && <Text size="sm" weight="medium" color={textColor}>{title}</Text>}
          {children && <Text size="sm" color={textColor === undefined ? 'secondary' : textColor} className="opacity-90">{children}</Text>}
        </Flex>
        {onClose && (
          <IconButton
            label="Close alert"
            variant="ghost"
            size="xs"
            onClick={onClose}
            className="shrink-0 -mr-1 -mt-0.5"
          >
            <X size={14} />
          </IconButton>
        )}
      </Flex>
    </div>
  )
}
