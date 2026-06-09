import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { AlertCircle, Info, AlertTriangle, CheckCircle, X } from 'lucide-react'
import { cn } from '../utils/cn'
import { Flex } from '../layout/Flex'
import { Text } from '../typography/Text'
import { IconButton } from '@arshad-shah/cynosure-react/icon-button'

const bannerVariants = cva(
  'w-full px-4 py-2 shadow-[var(--shadow-card)]',
  {
    variants: {
      variant: {
        default: 'bg-bg-elevated text-text-primary',
        success: 'bg-success/10 text-success',
        info: 'bg-info/10 text-info',
        warning: 'bg-warning/10 text-warning',
        error: 'bg-error/10 text-error',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const variantIcons = {
  default: Info,
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
} as const

const variantTextColor = {
  default: undefined,
  success: 'success',
  info: undefined,
  warning: 'warning',
  error: 'error',
} as const

export interface BannerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof bannerVariants> {
  icon?: React.ReactNode
  onDismiss?: () => void
  action?: React.ReactNode
  children: React.ReactNode
}

export function Banner({ className, variant = 'default', icon, onDismiss, action, children, ...props }: BannerProps) {
  const IconComponent = variantIcons[variant ?? 'default']
  const textColor = variantTextColor[variant ?? 'default']
  const resolvedIcon = icon !== undefined ? icon : <IconComponent size={14} className="shrink-0" />

  return (
    <div className={cn(bannerVariants({ variant }), className)} {...props}>
      <Flex gap="sm" align="center">
        {resolvedIcon}
        <Text size="sm" color={textColor} className="flex-1">{children}</Text>
        {action}
        {onDismiss && (
          <IconButton
            label="Dismiss banner"
            icon={<X size={14} />}
            variant="ghost"
            colorScheme="neutral"
            size="xs"
            onClick={onDismiss}
            className="shrink-0 -mr-1"
          />
        )}
      </Flex>
    </div>
  )
}
