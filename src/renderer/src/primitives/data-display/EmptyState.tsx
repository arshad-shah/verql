import React from 'react'
import {
  EmptyState as CynEmptyState,
  EmptyStateIcon,
  EmptyStateTitle,
  EmptyStateDescription,
  EmptyStateActions,
} from '@arshad-shah/cynosure-react/empty-state'

export interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  /** Vertical and typographic scale. @default "md" */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

/**
 * Placeholder for empty regions (first-run, empty search, filtered-to-zero).
 *
 * A thin props-based wrapper over Cynosure's slotted `EmptyState` so the
 * existing `title`/`description`/`icon`/`action` call sites keep working while
 * the component is styled by Cynosure (no Tailwind). `variant="subtle"` keeps
 * the borderless look — it blends with the surrounding container rather than
 * drawing Cynosure's default bordered card.
 */
export function EmptyState({ title, description, icon, action, size = 'md', className }: EmptyStateProps) {
  return (
    <CynEmptyState size={size} variant="subtle" className={className}>
      {icon && <EmptyStateIcon>{icon}</EmptyStateIcon>}
      <EmptyStateTitle>{title}</EmptyStateTitle>
      {description && <EmptyStateDescription>{description}</EmptyStateDescription>}
      {action && <EmptyStateActions>{action}</EmptyStateActions>}
    </CynEmptyState>
  )
}
