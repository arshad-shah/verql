import { useEffect } from 'react'
import { Flex, Box, Text } from '@/primitives'
import { useUiStore, type BottomPanelId } from '@/stores/ui'
import { useTabsStore } from '@/stores/tabs'
import { usePluginUIStore, selectContributions } from '@/stores/plugin-ui'
import { ResultsPanel } from '@/components/results/ResultsPanel'
import { QueryErrorView } from '@/components/results/QueryErrorView'
import { QueryPlanView } from '@/components/query-plan/QueryPlanView'
import { ChartPanel } from '@/components/charts/ChartPanel'
import { parsePlanFromResult } from '@/lib/plan-parser'
import { PluginPanelMount } from '@/components/plugins/PluginPanelMount'
import { BottomDockTabs, type BottomTab } from './BottomDockTabs'
import type { QueryTab } from '@shared/types'

export function useHasBottomPanels(): boolean {
  const activeTab = useTabsStore(s => s.tabs.find(t => t.id === s.activeTabId))
  const panelContributions = usePluginUIStore(selectContributions('panels'))
  const fetchContributions = usePluginUIStore(s => s.fetchContributions)
  useEffect(() => { fetchContributions('panels') }, [fetchContributions])
  const showResults = activeTab?.type === 'query'
  const hasBottomPlugins = panelContributions.some(c => c.meta.location === 'bottom')
  return showResults || hasBottomPlugins
}

export function BottomDock() {
  const activeTab = useTabsStore(s => s.tabs.find(t => t.id === s.activeTabId))
  const bottomActivePanel = useUiStore(s => s.bottomDockActivePanel)
  const setBottomActivePanel = useUiStore(s => s.setBottomDockActivePanel)
  const toggleBottomDock = useUiStore(s => s.toggleBottomDock)
  const panelContributions = usePluginUIStore(selectContributions('panels'))
  const fetchContributions = usePluginUIStore(s => s.fetchContributions)

  useEffect(() => { fetchContributions('panels') }, [fetchContributions])

  const showResults = activeTab?.type === 'query'

  // Detect whether the current results parse as an execution plan. We only
  // surface the "Query Plan" tab when there's something to show — otherwise
  // every query run would leave a permanent dead tab next to Results. The
  // parser already handles both Postgres JSON plans and plain-text plans
  // and returns [] for non-plan rows, so this also doubles as the "do we
  // even have a plan to render" check inside the tab body below.
  const planNodes = showResults && (activeTab as QueryTab).results
    ? parsePlanFromResult((activeTab as QueryTab).results!.rows)
    : []
  const hasPlan = planNodes.length > 0

  // The Chart tab is meaningful any time results have at least two columns —
  // ChartPanel needs an X and a Y axis. Single-column scalar results (e.g.
  // `SELECT COUNT(*)`) can't be charted, so we hide the tab rather than
  // surface a permanent empty-state.
  const resultsForChart = showResults ? (activeTab as QueryTab).results : null
  const hasChart = Boolean(resultsForChart && resultsForChart.fields.length >= 2 && resultsForChart.rows.length > 0)

  const bottomPluginPanels: BottomTab[] = panelContributions
    .filter(c => c.meta.location === 'bottom')
    .map(c => ({ id: `plugin:${c.contributionId}`, title: (c.meta.title as string) ?? c.contributionId }))

  const tabs: BottomTab[] = [
    ...(showResults ? [{ id: 'results', title: 'Results' }] : []),
    ...(hasChart ? [{ id: 'chart', title: 'Chart' }] : []),
    ...(hasPlan ? [{ id: 'query-plan', title: 'Query Plan' }] : []),
    ...bottomPluginPanels,
  ]

  useEffect(() => {
    if (tabs.length === 0) return
    if (!tabs.find(t => t.id === bottomActivePanel)) {
      setBottomActivePanel(tabs[0].id as BottomPanelId)
    }
  }, [tabs, bottomActivePanel, setBottomActivePanel])

  if (tabs.length === 0) {
    return null
  }

  const renderBody = () => {
    if (bottomActivePanel === 'results' && showResults && activeTab) {
      const t = activeTab as QueryTab
      if (t.results) {
        return <ResultsPanel results={t.results} sql={t.sql} tabId={t.id} aiExplanation={t.aiExplanation} />
      }
      if (t.error) {
        return <QueryErrorView error={t.error} />
      }
      return (
        <Flex align="center" justify="center" className="h-full">
          <Text color="muted" size="sm">Run a query to see results</Text>
        </Flex>
      )
    }
    if (bottomActivePanel === 'query-plan' && hasPlan && activeTab) {
      return <QueryPlanView results={(activeTab as QueryTab).results!} />
    }
    if (bottomActivePanel === 'chart' && hasChart && resultsForChart) {
      return <ChartPanel results={resultsForChart} />
    }
    if (bottomActivePanel.startsWith('plugin:')) {
      const contributionId = bottomActivePanel.slice('plugin:'.length)
      const contribution = panelContributions.find(c => c.contributionId === contributionId)
      const hostWidget = contribution?.widgets.find(w => w.type === 'host-component') as { type: 'host-component'; componentId: string } | undefined
      const componentId = hostWidget?.componentId ?? contributionId
      return <PluginPanelMount surface="panels" componentId={componentId} />
    }
    return null
  }

  return (
    <Flex direction="column" className="h-full bg-bg-primary overflow-hidden">
      <BottomDockTabs
        tabs={tabs}
        activeId={bottomActivePanel}
        onSelect={(id) => setBottomActivePanel(id as BottomPanelId)}
        onClose={toggleBottomDock}
      />
      <Box className="flex-1 overflow-hidden">
        {renderBody()}
      </Box>
    </Flex>
  )
}
