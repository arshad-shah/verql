import { useMemo } from 'react'
import { parsePlanFromResult, findMaxCost } from '@/lib/plan-parser'
import { PlanNodeView } from './PlanNode'
import type { QueryResult } from '@shared/types'

interface Props {
  results: QueryResult
}

export function QueryPlanView({ results }: Props) {
  const nodes = useMemo(() => parsePlanFromResult(results.rows), [results])
  const maxCost = useMemo(() => findMaxCost(nodes), [nodes])

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted text-sm">
        Run EXPLAIN ANALYZE to see the query plan
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-auto p-3">
      <div className="text-xs text-text-muted mb-3">
        Query Execution Plan · Max cost: {maxCost.toFixed(1)}
      </div>
      {nodes.map((node, i) => (
        <PlanNodeView key={i} node={node} maxCost={maxCost} />
      ))}
    </div>
  )
}
