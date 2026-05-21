import { useState, useSyncExternalStore } from 'react'
import { Search, Play, Trash2, Clock } from 'lucide-react'
import { useTabsStore } from '@/stores/tabs'
import { useConnectionsStore } from '@/stores/connections'
import { Stack, ScrollArea, Text, EmptyState, IconButton, Box, Flex, Input } from '@/primitives'

interface SavedQuery {
  id: string
  name: string
  sql: string
  createdAt: string
  updatedAt: string
  connectionType?: string
}

const STORAGE_KEY = 'nova:saved-queries'
const listeners = new Set<() => void>()

function load(): SavedQuery[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedQuery[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

let savedQueries: SavedQuery[] = load()

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(savedQueries)) } catch { /* quota */ }
  for (const l of listeners) l()
}

function subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn) } }
function snapshot() { return savedQueries }

export function useSavedQueries(): SavedQuery[] {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}

export function SavedQueriesPanel() {
  const [search, setSearch] = useState('')
  const queries = useSavedQueries()
  const { addQueryTab } = useTabsStore()
  const { activeConnectionId } = useConnectionsStore()

  const filtered = search.trim()
    ? queries.filter(q => q.name.toLowerCase().includes(search.toLowerCase()) || q.sql.toLowerCase().includes(search.toLowerCase()))
    : queries

  const handleOpenQuery = (query: SavedQuery) => {
    const tabId = addQueryTab(activeConnectionId)
    useTabsStore.setState((s) => ({
      tabs: s.tabs.map(t => t.id === tabId ? { ...t, sql: query.sql, title: query.name } : t)
    }))
  }

  const handleDelete = (id: string) => {
    savedQueries = savedQueries.filter(q => q.id !== id)
    persist()
  }

  return (
    <Stack className="h-full">
      <Box className="px-2 py-1.5">
        <Flex align="center" gap="xs" className="bg-bg-tertiary border border-border rounded-md px-2 py-1">
          <Search size={12} className="text-text-muted shrink-0" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search queries..."
            size="sm"
            className="flex-1 bg-transparent border-0 focus:ring-0 px-0"
          />
        </Flex>
      </Box>

      <ScrollArea direction="vertical" className="flex-1 px-1">
        {filtered.length === 0 && (
          <EmptyState
            icon={<Clock size={20} className="text-text-muted" />}
            title={queries.length === 0 ? 'No saved queries yet' : 'No matches'}
            description={queries.length === 0 ? 'Save queries from the editor with Cmd+S' : undefined}
            className="py-8"
          />
        )}

        {filtered.map(query => (
          <Box
            key={query.id}
            className="group px-2 py-1.5 rounded-md hover:bg-white/5 cursor-pointer transition-colors"
            onClick={() => handleOpenQuery(query)}
          >
            <Flex align="center" justify="between">
              <Text size="xs" color="primary" truncate className="flex-1">{query.name}</Text>
              <Flex className="hidden group-hover:flex items-center gap-0.5">
                <IconButton
                  label="Open in new tab"
                  size="xs"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); handleOpenQuery(query) }}
                  className="text-text-muted hover:text-success"
                >
                  <Play size={10} />
                </IconButton>
                <IconButton
                  label="Delete"
                  size="xs"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); handleDelete(query.id) }}
                  className="text-text-muted hover:text-error"
                >
                  <Trash2 size={10} />
                </IconButton>
              </Flex>
            </Flex>
            <Text size="xs" color="muted" truncate className="text-[10px] mt-0.5 font-mono block">{query.sql}</Text>
          </Box>
        ))}
      </ScrollArea>
    </Stack>
  )
}

/**
 * Upsert a saved query. If `id` matches an existing record we overwrite it
 * (IDE-style save). Otherwise a new record is created. Returns the saved id.
 */
export function saveQuery(opts: {
  id?: string
  name: string
  sql: string
  connectionType?: string
}): string {
  const now = new Date().toISOString()
  const existingIdx = opts.id ? savedQueries.findIndex(q => q.id === opts.id) : -1
  if (existingIdx >= 0) {
    const prev = savedQueries[existingIdx]
    savedQueries = [
      ...savedQueries.slice(0, existingIdx),
      { ...prev, name: opts.name, sql: opts.sql, connectionType: opts.connectionType ?? prev.connectionType, updatedAt: now },
      ...savedQueries.slice(existingIdx + 1)
    ]
    persist()
    return prev.id
  }
  const id = `sq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  savedQueries = [...savedQueries, { id, name: opts.name, sql: opts.sql, createdAt: now, updatedAt: now, connectionType: opts.connectionType }]
  persist()
  return id
}

export function findSavedQueryByName(name: string): SavedQuery | undefined {
  return savedQueries.find(q => q.name === name)
}

