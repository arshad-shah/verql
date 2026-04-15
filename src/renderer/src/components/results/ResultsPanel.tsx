import { ResultsGrid } from './ResultsGrid'
import { ResultsStatusBar } from './ResultsStatusBar'
import type { QueryResult } from '@shared/types'
import { Flex } from '@/primitives'

interface Props {
  results: QueryResult
}

export function ResultsPanel({ results }: Props) {
  return (
    <Flex direction="column" className="flex-1 min-h-0">
      <ResultsGrid results={results} />
      <ResultsStatusBar results={results} />
    </Flex>
  )
}
