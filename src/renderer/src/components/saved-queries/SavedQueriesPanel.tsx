import { useState } from 'react'
import { Search, Play, Trash2, Clock } from 'lucide-react'
import { useTabsStore } from '@/stores/tabs'
import { useConnectionsStore } from '@/stores/connections'

interface SavedQuery {
  id: string
  name: string
  sql: string
  createdAt: string
  connectionType?: string
}

// In-memory store for now — will be persisted to config in a future iteration
let savedQueries: SavedQuery[] = []

export function SavedQueriesPanel() {
  const [search, setSearch] = useState('')
  const [queries, setQueries] = useState<SavedQuery[]>(savedQueries)
  const { addQueryTab } = useTabsStore()
  const { activeConnectionId } = useConnectionsStore()

  const filtered = search.trim()
    ? queries.filter(q => q.name.toLowerCase().includes(search.toLowerCase()) || q.sql.toLowerCase().includes(search.toLowerCase()))
    : queries

  const handleOpenQuery = (query: SavedQuery) => {
    const tabId = addQueryTab(activeConnectionId)
    // Set the SQL in the new tab
    useTabsStore.setState((s) => ({
      tabs: s.tabs.map(t => t.id === tabId ? { ...t, sql: query.sql, title: query.name } : t)
    }))
  }

  const handleDelete = (id: string) => {
    savedQueries = savedQueries.filter(q => q.id !== id)
    setQueries([...savedQueries])
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-2 py-1.5">
        <div className="flex items-center gap-1.5 bg-bg-tertiary border border-border rounded-md px-2 py-1">
          <Search size={12} className="text-text-muted shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search queries..."
            className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
          />
        </div>
      </div>

      {/* Query list */}
      <div className="flex-1 overflow-y-auto px-1">
        {filtered.length === 0 && (
          <div className="text-center py-8">
            <Clock size={20} className="text-text-muted mx-auto mb-2" />
            <p className="text-text-muted text-xs">
              {queries.length === 0 ? 'No saved queries yet' : 'No matches'}
            </p>
            <p className="text-text-muted text-[10px] mt-1">
              Save queries from the editor with Cmd+S
            </p>
          </div>
        )}

        {filtered.map(query => (
          <div
            key={query.id}
            className="group px-2 py-1.5 rounded-md hover:bg-white/5 cursor-pointer transition-colors"
            onClick={() => handleOpenQuery(query)}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-primary truncate">{query.name}</span>
              <div className="hidden group-hover:flex items-center gap-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); handleOpenQuery(query) }}
                  className="p-0.5 text-text-muted hover:text-success rounded"
                  title="Open in new tab"
                >
                  <Play size={10} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(query.id) }}
                  className="p-0.5 text-text-muted hover:text-error rounded"
                  title="Delete"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-text-muted truncate mt-0.5 font-mono">{query.sql}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// Public API to save a query from the editor
export function saveQuery(name: string, sql: string, connectionType?: string): void {
  savedQueries.push({
    id: `sq-${Date.now()}`,
    name,
    sql,
    createdAt: new Date().toISOString(),
    connectionType
  })
}
