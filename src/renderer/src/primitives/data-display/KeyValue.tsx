import React from 'react'
import { cn } from '../utils/cn'

export interface KeyValueProps {
  label: string
  value: React.ReactNode
  className?: string
}

export function KeyValue({ label, value, className }: KeyValueProps) {
  return (
    <dl className={cn('flex items-baseline justify-between gap-2', className)}>
      <dt className="text-xs text-text-secondary">{label}</dt>
      <dd className="text-sm text-text-primary text-right truncate">{value}</dd>
    </dl>
  )
}
