import { BarChart3 } from 'lucide-react'
import { useTabsStore } from '@/stores/tabs'
import { useConnectionsStore } from '@/stores/connections'
import { useUiStore, BOTTOM_PANEL } from '@/stores/ui'
import type { QueryTab } from '@shared/types'
import { Stack, ScrollArea, Flex, Text, EmptyState, Box } from '@/primitives'

export function ChartsDashboard() {
  const { tabs } = useTabsStore()
  const { activeConnectionId } = useConnectionsStore()

  // Show query tabs that have results (potential charts)
  const queryTabsWithResults = tabs.filter(
    (t): t is QueryTab => t.type === 'query' && t.connectionId === activeConnectionId && (t as QueryTab).results !== null
  )

  return (
    <Stack className="h-full">
      <ScrollArea direction="vertical" className="flex-1 px-1 py-1">
        {queryTabsWithResults.length === 0 && (
          <EmptyState
            icon={<BarChart3 size={20} className="text-text-muted" />}
            title="No chart data yet"
            description="Run a query that returns at least two columns — the Chart tab appears in the results dock."
            className="py-8"
          />
        )}

        {queryTabsWithResults.map(tab => (
          <Box
            key={tab.id}
            className="px-2 py-2 rounded-md hover:bg-white/5 cursor-pointer transition-colors mb-0.5"
            onClick={() => {
              // Bring the query tab forward AND switch the bottom dock to the
              // Chart tab in one click — the dashboard becomes a real
              // "jump to chart" surface instead of just a tab-switcher.
              useTabsStore.getState().setActiveTab(tab.id)
              useUiStore.getState().setBottomDockActivePanel(BOTTOM_PANEL.CHART)
            }}
          >
            <Flex direction="row" align="center" gap="sm">
              <BarChart3 size={12} className="text-accent shrink-0" />
              <Text size="xs" color="primary" truncate className="flex-1">{tab.title}</Text>
              <Text size="xs" color="muted" className="text-[10px] ml-auto">
                {tab.results?.rowCount} rows
              </Text>
            </Flex>
            <Text size="xs" color="muted" truncate className="text-[10px] mt-0.5 font-mono pl-5 block">
              {tab.sql.slice(0, 60)}{tab.sql.length > 60 ? '...' : ''}
            </Text>
          </Box>
        ))}
      </ScrollArea>
    </Stack>
  )
}
