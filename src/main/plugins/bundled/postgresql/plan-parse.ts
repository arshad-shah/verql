// Postgres EXPLAIN plan parsing — owned by the postgresql driver plugin (moved
// out of the renderer to keep dialect knowledge in the driver). Handles both
// `EXPLAIN (FORMAT JSON)` output and the default indented text format.
import type { QueryResult, PlanNode } from '@shared/types'

function parsePlanText(text: string): PlanNode[] {
  const lines = text.split('\n').filter((l) => l.trim())
  if (lines.length === 0) return []

  const nodes: PlanNode[] = []
  const stack: { node: PlanNode; indent: number }[] = []

  for (const line of lines) {
    const indent = line.search(/\S/)
    const match = line.trim().match(/^(?:->)?\s*(.+?)(?:\s+on\s+(\S+))?\s+\(cost=[\d.]+\.\.([\d.]+)\s+rows=(\d+)/)

    if (!match) {
      const simpleMatch = line.trim().match(/^(\w[\w\s]+\w)(?:\s+on\s+(\S+))?(?:\s*\(cost=[\d.]+\.\.([\d.]+)\s+rows=(\d+))?/)
      if (simpleMatch) {
        const node: PlanNode = {
          type: simpleMatch[1].trim(),
          table: simpleMatch[2],
          cost: parseFloat(simpleMatch[3] ?? '0'),
          rows: parseInt(simpleMatch[4] ?? '0'),
          children: [],
          details: line.trim(),
        }
        while (stack.length > 0 && stack[stack.length - 1].indent >= indent) stack.pop()
        if (stack.length > 0) stack[stack.length - 1].node.children.push(node)
        else nodes.push(node)
        stack.push({ node, indent })
      }
      continue
    }

    const node: PlanNode = {
      type: match[1].trim(),
      table: match[2],
      cost: parseFloat(match[3]),
      rows: parseInt(match[4]),
      children: [],
      details: line.trim(),
    }

    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) stack.pop()
    if (stack.length > 0) stack[stack.length - 1].node.children.push(node)
    else nodes.push(node)
    stack.push({ node, indent })
  }

  return nodes
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertPgJsonPlan(plan: any): PlanNode {
  return {
    type: plan['Node Type'] ?? 'Unknown',
    table: plan['Relation Name'],
    cost: plan['Total Cost'] ?? 0,
    rows: plan['Plan Rows'] ?? 0,
    actualTime: plan['Actual Total Time'],
    children: (plan.Plans ?? []).map(convertPgJsonPlan),
    details: Object.entries(plan)
      .filter(([k]) => !['Plans', 'Node Type', 'Relation Name', 'Total Cost', 'Plan Rows'].includes(k))
      .map(([k, v]) => `${k}: ${v}`)
      .join(', '),
  }
}

/** Parse a Postgres EXPLAIN result (`EXPLAIN` text rows or `FORMAT JSON`) into a
 *  normalized plan tree. Returns [] when the rows aren't a plan. */
export function parsePostgresPlan(result: QueryResult): PlanNode[] {
  const rows = result.rows
  if (rows.length === 0) return []

  const firstVal = Object.values(rows[0])[0]
  if (typeof firstVal === 'string' && firstVal.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(firstVal)
      if (Array.isArray(parsed) && parsed[0]?.Plan) {
        return [convertPgJsonPlan(parsed[0].Plan)]
      }
    } catch {
      /* not JSON — fall through to text parsing */
    }
  }

  const text = rows.map((r) => String(Object.values(r)[0] ?? '')).join('\n')
  return parsePlanText(text)
}
