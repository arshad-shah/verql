import { X } from 'lucide-react'
import { Flex, cn } from '@/primitives'

export interface BottomTab {
  id: string
  title: string
}

interface Props {
  tabs: BottomTab[]
  activeId: string
  onSelect: (id: string) => void
  onClose: () => void
}

export function BottomDockTabs({ tabs, activeId, onSelect, onClose }: Props) {
  return (
    <Flex align="center" className="h-8 border-b border-border bg-bg-secondary px-1 shrink-0">
      {tabs.map(t => (
        <button
          key={t.id}
          type="button"
          onClick={() => onSelect(t.id)}
          className={cn(
            'h-7 px-3 text-xs rounded-sm transition-colors',
            activeId === t.id
              ? 'bg-bg-primary text-text-primary'
              : 'text-text-muted hover:text-text-primary hover:bg-white/5'
          )}
        >
          {t.title}
        </button>
      ))}
      <div className="flex-1" />
      <button
        type="button"
        aria-label="Hide bottom dock"
        onClick={onClose}
        className="h-7 w-7 inline-flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/5 rounded-sm"
      >
        <X size={14} />
      </button>
    </Flex>
  )
}
