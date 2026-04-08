import { useMemo } from 'react'
import { parsePlanFromResult, findMaxCost } from '@/lib/plan-parser'
import { PlanNodeView } from './PlanNode'
import type { QueryResult } from '@shared/types'
import { Flex, Stack, Text } from '@/primitives'

interface Props {
  results: QueryResult
}

export function QueryPlanView({ results }: Props) {
  const nodes = useMemo(() => parsePlanFromResult(results.rows), [results])
  const maxCost = useMemo(() => findMaxCost(nodes), [nodes])

  if (nodes.length === 0) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <Text size="sm" color="muted">Run EXPLAIN ANALYZE to see the query plan</Text>
      </Flex>
    )
  }

  return (
    <Stack direction="vertical" className="h-full overflow-auto p-3">
      <Text size="xs" color="muted" className="mb-3">
        Query Execution Plan · Max cost: {maxCost.toFixed(1)}
      </Text>
      {nodes.map((node, i) => (
        <PlanNodeView key={i} node={node} maxCost={maxCost} />
      ))}
    </Stack>
  )
}
