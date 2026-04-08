import { Plus, X } from 'lucide-react'
import { useTabsStore } from '@/stores/tabs'
import { useConnectionsStore } from '@/stores/connections'
import { Flex, IconButton, Text, Tooltip, cn } from '@/primitives'

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, addQueryTab } = useTabsStore()
  const { activeConnectionId } = useConnectionsStore()

  return (
    <Flex
      align="center"
      className="h-9 bg-bg-primary border-b border-border shrink-0 overflow-x-auto"
    >
      {tabs.map((tab) => (
        <Flex
          key={tab.id}
          align="center"
          gap="xs"
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            'group px-3 py-1.5 cursor-pointer border-r border-border shrink-0',
            activeTabId === tab.id
              ? 'border-b-2 border-b-accent bg-bg-tertiary'
              : ''
          )}
        >
          <Text
            size="xs"
            color={activeTabId === tab.id ? 'primary' : 'muted'}
            truncate
            className="max-w-30"
          >
            {tab.title}
          </Text>
          <IconButton
            label={`Close ${tab.title}`}
            size="xs"
            variant="ghost"
            onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 h-auto w-auto hover:bg-white/10"
          >
            <X size={10} />
          </IconButton>
        </Flex>
      ))}
      <Tooltip content="New Query Tab" side="bottom">
        <IconButton
          label="New Query Tab"
          size="xs"
          variant="ghost"
          onClick={() => addQueryTab(activeConnectionId)}
          className="px-3 py-1.5 shrink-0 text-text-muted hover:text-text-primary h-full w-auto rounded-none"
        >
          <Plus size={12} />
        </IconButton>
      </Tooltip>
    </Flex>
  )
}
