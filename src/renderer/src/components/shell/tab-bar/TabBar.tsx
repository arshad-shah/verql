import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useTabsStore } from '@/stores/tabs'
import { useConnectionsStore } from '@/stores/connections'
import { Flex, IconButton, Tooltip, cn } from '@/primitives'
import { TabItem } from './TabItem'
import { useTabScroll } from './useTabScroll'
import { useTabDrag } from './useTabDrag'

export function TabBar() {
  const {
    tabs,
    activeTabId,
    setActiveTab,
    closeTab,
    closeOtherTabs,
    closeTabsToRight,
    closeAllTabs,
    addQueryTab,
    reorderTabs,
    duplicateTab,
  } = useTabsStore()
  const { activeConnectionId } = useConnectionsStore()

  const { scrollRef, canScrollLeft, canScrollRight, scrollLeft, scrollRight, onWheel } =
    useTabScroll()
  const { draggedIndex, dropIndex, onDragStart, onDragOver, onDragEnd } = useTabDrag({
    onReorder: reorderTabs,
  })

  const getContextMenuItems = (tabId: string, index: number) => {
    const tab = tabs.find(t => t.id === tabId)
    return [
      { label: 'Close', onSelect: () => closeTab(tabId) },
      { label: 'Close Others', onSelect: () => closeOtherTabs(tabId), disabled: tabs.length <= 1 },
      { label: 'Close to the Right', onSelect: () => closeTabsToRight(tabId), disabled: index >= tabs.length - 1 },
      { label: 'Close All', onSelect: () => closeAllTabs() },
      { label: 'Duplicate Tab', onSelect: () => duplicateTab(tabId), disabled: tab?.type !== 'query' },
      {
        label: 'Copy Title',
        onSelect: () => navigator.clipboard.writeText(tab?.title ?? ''),
      },
    ]
  }

  return (
    <Flex align="center" className="h-9 bg-bg-secondary border-b border-border shrink-0">
      {/* Scroll left arrow */}
      <button
        onClick={scrollLeft}
        className={cn(
          'shrink-0 w-7 h-full flex items-center justify-center text-text-muted hover:text-text-primary transition-opacity',
          canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        tabIndex={-1}
      >
        <ChevronLeft size={14} />
      </button>

      {/* Scrollable tab list */}
      <div
        ref={scrollRef}
        onWheel={onWheel}
        className="flex-1 flex items-stretch h-full overflow-x-hidden"
      >
        {tabs.map((tab, index) => (
          <TabItem
            key={tab.id}
            tab={tab}
            index={index}
            isActive={activeTabId === tab.id}
            isDragged={draggedIndex === index}
            isDropTarget={dropIndex === index && draggedIndex !== index}
            contextMenuItems={getContextMenuItems(tab.id, index)}
            onActivate={() => setActiveTab(tab.id)}
            onClose={() => closeTab(tab.id)}
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>

      {/* Scroll right arrow */}
      <button
        onClick={scrollRight}
        className={cn(
          'shrink-0 w-7 h-full flex items-center justify-center text-text-muted hover:text-text-primary transition-opacity',
          canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        tabIndex={-1}
      >
        <ChevronRight size={14} />
      </button>

      {/* New tab button */}
      <div className="shrink-0 border-l border-border h-full flex items-center">
        <Tooltip content="New Query Tab" side="bottom">
          <IconButton
            label="New Query Tab"
            size="xs"
            variant="ghost"
            onClick={() => addQueryTab(activeConnectionId)}
            className="px-3 h-full w-auto rounded-none text-text-muted hover:text-text-primary"
          >
            <Plus size={14} />
          </IconButton>
        </Tooltip>
      </div>
    </Flex>
  )
}
