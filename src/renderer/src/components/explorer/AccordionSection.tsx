import { ChevronRight, ChevronDown } from 'lucide-react'
import { useUiStore } from '@/stores/ui'
import { Flex, Text, Badge } from '@/primitives'

interface AccordionSectionProps {
  title: string
  count?: number
  defaultExpanded?: boolean
  actions?: React.ReactNode
  children: React.ReactNode
}

export function AccordionSection({ title, count, actions, children }: AccordionSectionProps) {
  const expanded = useUiStore((s) => s.expandedSections[title] ?? true)
  const toggleSection = useUiStore((s) => s.toggleSection)

  return (
    <div className="border-b border-border">
      <button
        onClick={() => toggleSection(title)}
        className="w-full flex items-center gap-1 px-2 py-1.5 bg-bg-primary hover:bg-white/5 transition-colors"
      >
        {expanded
          ? <ChevronDown size={12} className="text-text-muted shrink-0" />
          : <ChevronRight size={12} className="text-text-muted shrink-0" />
        }
        <Text size="xs" color="muted" className="text-[10px] uppercase tracking-wider flex-1 text-left">{title}</Text>
        {count !== undefined && (
          <Badge size="sm" className="text-[9px] leading-4">{count}</Badge>
        )}
        {actions && (
          <span
            className="flex items-center gap-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
          </span>
        )}
      </button>
      {expanded && <div className="pb-1">{children}</div>}
    </div>
  )
}
