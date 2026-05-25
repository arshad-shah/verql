import { useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useTabsStore } from '@/stores/tabs'
import { requestCloseTab } from '@/stores/tab-actions'
import { useConnectionsStore } from '@/stores/connections'
import { initialAutoCommit } from '@/lib/initial-autocommit'
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
  const { activeConnectionId, connections } = useConnectionsStore()
  const activeProfile = connections.find(c => c.id === activeConnectionId) ?? null

  const { scrollRef, canScrollLeft, canScrollRight, scrollLeft, scrollRight, scrollIntoView, onWheel } =
    useTabScroll()
  const { draggedIndex, dropIndex, onDragStart, onDragOver, onDragEnd } = useTabDrag({
    onReorder: reorderTabs,
  })

  // Keep the active tab scrolled into view
  useEffect(() => {
    if (activeTabId) {
      scrollIntoView(activeTabId)
    }
  }, [activeTabId, scrollIntoView])

  const getContextMenuItems = (tabId: string, index: number) => {
    const tab = tabs.find(t => t.id === tabId)
    return [
      { label: 'Close', onSelect: () => requestCloseTab(tabId, closeTab) },
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
    <Flex
      align="end"
      gap="xs"
      className="h-10 shrink-0 bg-tab-bar-bg px-2 pt-1.5"
    >
      {/* Scroll left arrow */}
      {canScrollLeft && (
        <IconButton
          label="Scroll tabs left"
          size="xs"
          variant="ghost"
          onClick={scrollLeft}
          tabIndex={-1}
        className={cn(
          'shrink-0 text-text-tertiary hover:text-text-primary transition-opacity',
        )}
      >
        <ChevronLeft size={14} />
      </IconButton>)}

      {/* Scrollable tab trough */}
      <Flex
        ref={scrollRef}
        onWheel={onWheel}
        align="end"
        className="flex-1 h-full overflow-x-hidden gap-0.5"
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
            onClose={() => requestCloseTab(tab.id, closeTab)}
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDragEnd={onDragEnd}
          />
        ))}
      </Flex>

      {/* Scroll right arrow */}
  { canScrollRight && (
    <IconButton
      label="Scroll tabs right"
      size="xs"
      variant="ghost"
      onClick={scrollRight}
      tabIndex={-1}
        className={cn(
          'shrink-0 text-text-tertiary hover:text-text-primary transition-opacity',
        )}
      >
        <ChevronRight size={14} />
      </IconButton>)}

      {/* New tab button */}
      <Tooltip content="New Query Tab" side="bottom">
        <IconButton
          label="New Query Tab"
          size="xs"
          variant="ghost"
          onClick={() => addQueryTab(activeConnectionId, null, { autoCommit: initialAutoCommit(activeProfile) })}
          className="shrink-0 text-text-tertiary hover:text-text-primary"
        >
          <Plus size={14} />
        </IconButton>
      </Tooltip>
    </Flex>
  )
}
