import { ChevronRight, ChevronDown } from 'lucide-react'
import { useUiStore } from '@/stores/ui'
import { Flex, Text, Badge, Box, Button } from '@/primitives'

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
    <Box className="border-b border-border">
      <Button
        variant="ghost"
        onClick={() => toggleSection(title)}
        className="w-full flex items-center gap-1 px-2 py-1.5 bg-bg-primary hover:bg-white/5 transition-colors rounded-none border-0 h-auto"
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
          <Flex as="span"
            align="center"
            gap="xs"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {actions}
          </Flex>
        )}
      </Button>
      {expanded && <Box className="pb-1">{children}</Box>}
    </Box>
  )
}
