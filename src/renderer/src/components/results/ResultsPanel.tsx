import { ResultsGrid } from './ResultsGrid'
import { ResultsStatusBar } from './ResultsStatusBar'
import { ExplainPanel } from '@/components/ai/ExplainPanel'
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
      <ResultsGrid results={results} />
      {sql && tabId && (
        <ExplainPanel tabId={tabId} sql={sql} results={results} explanation={aiExplanation ?? null} />
      )}
      <ResultsStatusBar results={results} />
    </Flex>
  )
}
