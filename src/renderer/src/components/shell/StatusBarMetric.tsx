import { cn } from '@/primitives/utils/cn'

const colorMap = {
  success: {
    bg: 'bg-success/8',
    border: 'border-success/15',
    text: 'text-success',
    dot: 'bg-success',
  },
  error: {
    bg: 'bg-error/8',
    border: 'border-error/15',
    text: 'text-error',
    dot: 'bg-error',
  },
  warning: {
    bg: 'bg-warning/8',
    border: 'border-warning/15',
    text: 'text-warning',
    dot: 'bg-warning',
  },
  info: {
    bg: 'bg-info/8',
    border: 'border-info/15',
    text: 'text-info',
    dot: 'bg-info',
  },
} as const

type MetricColor = keyof typeof colorMap

interface StatusBarMetricProps {
  color: MetricColor
  label: string
  icon?: string
  animated?: boolean
  className?: string
}

export function StatusBarMetric({ color, label, icon, animated, className }: StatusBarMetricProps) {
  const colors = colorMap[color]

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-[5px] border px-2 py-0.5 text-[10px]',
        colors.bg,
        colors.border,
        colors.text,
        className
      )}
    >
      {animated && (
        <div
          data-animated-dot
          className={cn('h-1.5 w-1.5 rounded-full animate-pulse', colors.dot)}
        />
      )}
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </div>
  )
}
