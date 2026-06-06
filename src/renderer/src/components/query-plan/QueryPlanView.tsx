import { useMemo } from 'react'
import { PlanNodeView } from './PlanNode'
import type { PlanNode } from '@shared/types'
import { Flex, Stack, Text } from '@/primitives'
import { useTranslation } from '@/i18n/I18nProvider'

interface Props {
  /** Driver-parsed plan tree (from db:parse-plan); empty = nothing to show. */
  plan: PlanNode[]
}

/** Generic, dialect-agnostic plan renderer. The driver does the parsing; this
 *  component only lays out the normalized PlanNode tree. */
function findMaxCost(nodes: PlanNode[]): number {
  let max = 0
  for (const n of nodes) {
    if (n.cost > max) max = n.cost
    const childMax = findMaxCost(n.children)
    if (childMax > max) max = childMax
  }
  return max
}

export function QueryPlanView({ plan }: Props) {
  const { t } = useTranslation()
  const maxCost = useMemo(() => findMaxCost(plan), [plan])

  if (plan.length === 0) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <Text size="sm" color="muted">{t('shell.queryPlan.empty')}</Text>
      </Flex>
    )
  }

  return (
    <Stack direction="vertical" className="h-full overflow-auto p-3">
      <Text size="xs" color="muted" className="mb-3">
        {t('shell.queryPlan.header', { cost: maxCost.toFixed(1) })}
      </Text>
      {plan.map((node, i) => (
        <PlanNodeView key={i} node={node} maxCost={maxCost} />
      ))}
    </Stack>
  )
}
