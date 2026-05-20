import { ResultsGrid } from './ResultsGrid'
import { ResultsStatusBar } from './ResultsStatusBar'
import { PluginSlot } from '@/components/plugins/PluginSlot'
import type { QueryResult } from '@shared/types'
import { Flex } from '@/primitives'

interface Props {
  results: QueryResult
  sql?: string
  tabId?: string
  aiExplanation?: string | null
}

export function ResultsPanel({ results, sql, tabId, aiExplanation }: Props) {
  return (
    <Flex direction="column" className="flex-1 min-h-0">
      <ResultsGrid results={results} tabId={tabId} />
      {sql && tabId && (
        <PluginSlot
          id="results.actions"
          context={{ tabId, sql, results, explanation: aiExplanation ?? null }}
        />
      )}
      <ResultsStatusBar results={results} />
    </Flex>
  )
}
