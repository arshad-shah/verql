import { BarChart3 } from 'lucide-react'
import { useTabsStore } from '@/stores/tabs'
import { useConnectionsStore } from '@/stores/connections'
import { useUiStore, BOTTOM_PANEL } from '@/stores/ui'
import type { QueryTab } from '@shared/types'
import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateTitle,
  EmptyStateDescription,
} from '@arshad-shah/cynosure-react/empty-state'
import { Stack } from '@arshad-shah/cynosure-react/stack'
import { ScrollArea } from '@arshad-shah/cynosure-react/scroll-area'
import { Flex } from '@arshad-shah/cynosure-react/flex'
import { Box } from '@arshad-shah/cynosure-react/box'
import { Text } from '@arshad-shah/cynosure-react/text'
import { useTranslation } from '@/i18n/I18nProvider'

export function ChartsDashboard() {
  const { t } = useTranslation()
  const { tabs } = useTabsStore()
  const { activeConnectionId } = useConnectionsStore()

  // Show query tabs that have results (potential charts)
  const queryTabsWithResults = tabs.filter(
    (tab): tab is QueryTab => tab.type === 'query' && tab.connectionId === activeConnectionId && (tab as QueryTab).results !== null
  )

  return (
    <Stack className="h-full">
      <ScrollArea scrollbars="vertical" className="flex-1 px-1 py-1">
        {queryTabsWithResults.length === 0 && (
          <EmptyState variant="subtle" className="py-8">
            <EmptyStateIcon>
              <BarChart3 size={20} className="text-text-muted" />
            </EmptyStateIcon>
            <EmptyStateTitle>{t('shell.charts.emptyTitle')}</EmptyStateTitle>
            <EmptyStateDescription>{t('shell.charts.emptyDescription')}</EmptyStateDescription>
          </EmptyState>
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
            <Flex direction="row" align="center" gap="2">
              <BarChart3 size={12} className="text-accent shrink-0" />
              <Text size="xs" truncate className="flex-1">{tab.title}</Text>
              <Text size="xs" color="fg.subtle" className="text-[10px] ml-auto">
                {t('shell.charts.rowsCount', { count: tab.results?.rowCount ?? 0 })}
              </Text>
            </Flex>
            <Text size="xs" color="fg.subtle" truncate className="text-[10px] mt-0.5 font-mono pl-5 block">
              {tab.sql.slice(0, 60)}{tab.sql.length > 60 ? '...' : ''}
            </Text>
          </Box>
        ))}
      </ScrollArea>
    </Stack>
  )
}
