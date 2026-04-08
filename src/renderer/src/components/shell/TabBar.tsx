import { Plus, X } from 'lucide-react'
import { useTabsStore } from '@/stores/tabs'
import { useConnectionsStore } from '@/stores/connections'

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, addQueryTab } = useTabsStore()
  const { activeConnectionId } = useConnectionsStore()

  return (
    <div className="h-9 bg-bg-primary border-b border-border flex items-center shrink-0 overflow-x-auto">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer border-r border-border shrink-0 ${
            activeTabId === tab.id
              ? 'text-text-primary border-b-2 border-b-accent bg-bg-tertiary'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <span className="truncate max-w-30">{tab.title}</span>
          <button
            onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10 transition-opacity"
          >
            <X size={10} />
          </button>
        </div>
      ))}
      <button
        onClick={() => addQueryTab(activeConnectionId)}
        className="flex items-center gap-1 px-3 py-1.5 text-xs text-text-muted hover:text-text-primary transition-colors shrink-0"
        title="New Query Tab"
      >
        <Plus size={12} />
      </button>
    </div>
  )
}
