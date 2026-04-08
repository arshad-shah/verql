import { BarChart3 } from 'lucide-react'
import { useTabsStore } from '@/stores/tabs'
import { useConnectionsStore } from '@/stores/connections'
import type { QueryTab } from '@shared/types'

export function ChartsDashboard() {
  const { tabs } = useTabsStore()
  const { activeConnectionId } = useConnectionsStore()

  // Show query tabs that have results (potential charts)
  const queryTabsWithResults = tabs.filter(
    (t): t is QueryTab => t.type === 'query' && t.connectionId === activeConnectionId && (t as QueryTab).results !== null
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-1 py-1">
        {queryTabsWithResults.length === 0 && (
          <div className="text-center py-8">
            <BarChart3 size={20} className="text-text-muted mx-auto mb-2" />
            <p className="text-text-muted text-xs">No chart data yet</p>
            <p className="text-text-muted text-[10px] mt-1">
              Run a query, then switch to the Chart tab in results
            </p>
          </div>
        )}

        {queryTabsWithResults.map(tab => (
          <div
            key={tab.id}
            className="px-2 py-2 rounded-md hover:bg-white/5 cursor-pointer transition-colors mb-0.5"
            onClick={() => useTabsStore.getState().setActiveTab(tab.id)}
          >
            <div className="flex items-center gap-2">
              <BarChart3 size={12} className="text-accent shrink-0" />
              <span className="text-xs text-text-primary truncate">{tab.title}</span>
              <span className="text-[10px] text-text-muted ml-auto">
                {tab.results?.rowCount} rows
              </span>
            </div>
            <p className="text-[10px] text-text-muted truncate mt-0.5 font-mono pl-5">
              {tab.sql.slice(0, 60)}{tab.sql.length > 60 ? '...' : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
