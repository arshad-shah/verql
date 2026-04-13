import { useState } from 'react'
import { X } from 'lucide-react'
import type { Tab } from '@shared/types'
import { Flex, Text, Tooltip, ContextMenu, cn, IconButton } from '@/primitives'
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
          'group relative px-2.5 py-1 cursor-pointer shrink-0 select-none rounded-lg transition-all duration-[var(--transition-fast)]',
          isActive
            ? 'bg-bg-tertiary border border-border-subtle shadow-[var(--shadow-card)]'
            : 'bg-transparent border border-transparent hover:bg-[rgba(255,255,255,0.04)] hover:border-border-subtle',
          isDragged && 'opacity-50',
          isDropTarget && 'before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-accent before:rounded-full',
        )}
      >
        <Icon size={14} className={cn(iconColor, 'shrink-0')} />
        <Tooltip content={tab.title} side="bottom" delay={600}>
          <Text
            size="xs"
            color={isActive ? 'primary' : 'secondary'}
            truncate
            className={cn('max-w-32', isActive && 'font-medium')}
          >
            {tab.title}
          </Text>
        </Tooltip>

        {/* Close / dirty indicator */}
        <IconButton
          size="tab-action"
          label={isDirty ? 'Close tab (unsaved changes)' : 'Close tab'}
          variant="tab-action"
          className={cn(
            'ml-0.5 transition-opacity duration-[var(--transition-fast)]',
            !isActive && !isDirty && 'opacity-0 group-hover:opacity-100',
          )}
          onClick={(e) => { e.stopPropagation(); onClose() }}
          onMouseEnter={() => setCloseHovered(true)}
          onMouseLeave={() => setCloseHovered(false)}
        >
          {isDirty && !closeHovered ? (
            <span
              className="block h-[7px] w-[7px] rounded-full bg-warning"
              aria-label="Unsaved changes"
            />
          ) : (
            <X
              size={10}
              strokeWidth={2.5}
              className={cn(
                'transition-colors duration-[var(--transition-fast)]',
                isDirty && closeHovered
                  ? 'text-error'
                  : 'text-text-tertiary group-hover:text-text-secondary',
              )}
            />
          )}
        </IconButton>
      </Flex>
    </ContextMenu>
  )
}
