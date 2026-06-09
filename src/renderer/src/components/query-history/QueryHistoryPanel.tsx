import { useState } from 'react'
import { Search, Play, Trash2, History, CheckCircle2, XCircle } from 'lucide-react'
import type { QueryHistoryEntry } from '@shared/appdata'
import { useQueryHistoryStore } from '@/stores/query-history'
import { useTabsStore } from '@/stores/tabs'
import { useConnectionsStore } from '@/stores/connections'
import { initialAutoCommit } from '@/lib/initial-autocommit'
import {
  Stack, ScrollArea, EmptyState, Box, Flex, Input, Tooltip,
  SearchInput,
} from '@/primitives'
import { Text } from '@arshad-shah/cynosure-react/text'
import { IconButton } from '@arshad-shah/cynosure-react/icon-button'
import { useTranslation } from '@/i18n/I18nProvider'

/** Compact relative time ("3m", "2h", "5d"); falls back to a date for old rows. */
function relativeTime(ms: number): string {
  const diff = Date.now() - ms
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return new Date(ms).toLocaleDateString()
}

/** Open a history entry's SQL in a new query tab, pre-filled but not executed. */
function openHistoryEntry(entry: QueryHistoryEntry): void {
  const { activeConnectionId, connections } = useConnectionsStore.getState()
  // Prefer the connection the query originally ran against if it still exists.
  const targetId =
    (entry.connectionId && connections.some((c) => c.id === entry.connectionId)
      ? entry.connectionId
      : activeConnectionId) ?? null
  const targetProfile = connections.find((c) => c.id === targetId) ?? null
  const tabId = useTabsStore.getState().addQueryTab(targetId, null, {
    autoCommit: initialAutoCommit(targetProfile),
  })
  useTabsStore.setState((s) => ({
    tabs: s.tabs.map((t) => (t.id === tabId ? { ...t, sql: entry.sql } : t)),
  }))
}

export function QueryHistoryPanel() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const entries = useQueryHistoryStore((s) => s.entries)
  const remove = useQueryHistoryStore((s) => s.remove)
  const clear = useQueryHistoryStore((s) => s.clear)

  const filtered = search.trim()
    ? entries.filter((e) => e.sql.toLowerCase().includes(search.toLowerCase()))
    : entries

  return (
    <Stack className="h-full">
      <Box className="px-2 py-1.5">
        <SearchInput size="lg" onClear={() => setSearch('')} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('query.history.searchPlaceholder')} />
      </Box>

      <ScrollArea direction="vertical" className="flex-1 px-1">
        {filtered.length === 0 && (
          <EmptyState
            icon={<History size={20} className="text-text-muted" />}
            title={entries.length === 0 ? t('query.history.emptyTitle') : t('query.history.noMatches')}
            description={entries.length === 0 ? t('query.history.emptyDescription') : undefined}
            className="py-8"
          />
        )}

        {filtered.map((entry) => (
          <Box
            key={entry.id}
            className="group px-2 py-1.5 rounded-md hover:bg-white/5 cursor-pointer transition-colors"
            onClick={() => openHistoryEntry(entry)}
          >
            <Flex align="center" justify="between" gap="xs">
              <Flex align="center" gap="xs" className="min-w-0 flex-1">
                {entry.status === 'ok' ? (
                  <CheckCircle2 size={11} className="text-success shrink-0" />
                ) : (
                  <XCircle size={11} className="text-error shrink-0" />
                )}
                <Text size="xs" color="fg.subtle" className="shrink-0 text-[10px]">
                  {relativeTime(entry.executedAt)}
                </Text>
                {entry.connectionType && (
                  <Text size="xs" color="fg.subtle" className="shrink-0 text-[10px] uppercase tracking-wide">
                    {entry.connectionType}
                  </Text>
                )}
                {entry.status === 'ok' && entry.rowCount != null && (
                  <Text size="xs" color="fg.subtle" className="shrink-0 text-[10px]">
                    {t('query.history.rows', { count: entry.rowCount })}
                  </Text>
                )}
                {entry.durationMs != null && (
                  <Text size="xs" color="fg.subtle" className="shrink-0 text-[10px]">
                    {t('query.history.duration', { ms: entry.durationMs })}
                  </Text>
                )}
              </Flex>
              <Flex className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                <IconButton
                  label={t('query.history.openInNewTab')}
                  size="xs"
                  variant="ghost"
                  colorScheme="success"
                  onClick={(e) => { e.stopPropagation(); openHistoryEntry(entry) }}
                  icon={<Play size={10} />}
                />
                <IconButton
                  label={t('query.history.remove')}
                  size="xs"
                  variant="ghost"
                  colorScheme="danger"
                  onClick={(e) => { e.stopPropagation(); remove(entry.id) }}
                  icon={<Trash2 size={10} />}
                />
              </Flex>
            </Flex>
            <Text size="xs" color="fg.subtle" truncate className="text-[10px] mt-0.5 font-mono block">
              {entry.sql}
            </Text>
          </Box>
        ))}
      </ScrollArea>
    </Stack>
  )
}
