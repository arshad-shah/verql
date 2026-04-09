import { useState } from 'react'
import { X } from 'lucide-react'
import type { Tab } from '@shared/types'
import { Flex, Text, Tooltip, ContextMenu, cn } from '@/primitives'
import { getTabIcon } from './tab-icons'

interface TabItemProps {
  tab: Tab
  index: number
  isActive: boolean
  isDragged: boolean
  isDropTarget: boolean
  contextMenuItems: { label: string; onSelect: () => void; disabled?: boolean }[]
  onActivate: () => void
  onClose: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragEnd: () => void
}

export function TabItem({
  tab,
  isActive,
  isDragged,
  isDropTarget,
  contextMenuItems,
  onActivate,
  onClose,
  onDragStart,
  onDragOver,
  onDragEnd,
}: TabItemProps) {
  const [closeHovered, setCloseHovered] = useState(false)
  const { icon: Icon, className: iconColor } = getTabIcon(tab.type)
  const isDirty = tab.type === 'query' && tab.isDirty

  return (
    <ContextMenu items={contextMenuItems}>
      <Flex
        align="center"
        gap="xs"
        data-tab-id={tab.id}
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onClick={onActivate}
        onAuxClick={(e) => { if (e.button === 1) { e.preventDefault(); onClose() } }}
        className={cn(
          'group relative px-3 cursor-pointer shrink-0 h-full select-none',
          'border-r border-border',
          isActive
            ? 'bg-bg-primary border-t-2 border-t-accent'
            : 'bg-bg-secondary hover:bg-bg-tertiary border-t-2 border-t-transparent',
          isDragged && 'opacity-50',
          isDropTarget && 'before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:bg-accent before:rounded-full',
        )}
      >
        <Icon size={14} className={cn(iconColor, 'shrink-0')} />
        <Tooltip content={tab.title} side="bottom" delay={600}>
          <Text
            size="xs"
            color={isActive ? 'primary' : 'muted'}
            truncate
            className="max-w-32"
          >
            {tab.title}
          </Text>
        </Tooltip>
        <div
          className={cn(
            'shrink-0 w-4 h-4 flex items-center justify-center rounded',
            'transition-opacity',
            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          )}
          onClick={(e) => { e.stopPropagation(); onClose() }}
          onMouseEnter={() => setCloseHovered(true)}
          onMouseLeave={() => setCloseHovered(false)}
        >
          {isDirty && !closeHovered ? (
            <div className="w-2 h-2 rounded-full bg-text-muted" />
          ) : (
            <X size={10} className="text-text-muted hover:text-text-primary" />
          )}
        </div>
      </Flex>
    </ContextMenu>
  )
}
