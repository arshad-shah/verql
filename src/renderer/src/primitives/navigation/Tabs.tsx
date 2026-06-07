import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const tabVariants = cva(
  'font-medium transition-all duration-(--transition-fast) relative',
  {
    variants: {
      size: {
        sm: 'text-xs px-2 py-1',
        md: 'text-sm px-3 py-2',
        lg: 'text-base px-4 py-3',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

export interface TabItem {
  id: string
  label: string
}

export interface TabsProps extends VariantProps<typeof tabVariants> {
  tabs: TabItem[]
  activeTab: string
  onTabChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, activeTab, onTabChange, className, size }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn('flex gap-0 border-b border-border-default', className)}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              tabVariants({ size }),
              isActive
                ? 'text-text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-accent'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
