import { describe, it, expect } from 'vitest'

interface PlanNode {
  type: string
  table?: string
  cost: number
  rows: number
  actualTime?: number
  children: PlanNode[]
  details: string
}

function parsePlanText(text: string): PlanNode[] {
  const lines = text.split('\n').filter(l => l.trim())
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
          details: line.trim()
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
      details: line.trim()
    }

    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) stack.pop()
    if (stack.length > 0) stack[stack.length - 1].node.children.push(node)
    else nodes.push(node)
    stack.push({ node, indent })
  }

  return nodes
}

describe('Plan parser', () => {
  it('parses a simple PostgreSQL EXPLAIN output', () => {
    const text = `Seq Scan on users  (cost=0.00..1.50 rows=50 width=100)`
    const nodes = parsePlanText(text)
    expect(nodes).toHaveLength(1)
    expect(nodes[0].type).toBe('Seq Scan')
    expect(nodes[0].table).toBe('users')
    expect(nodes[0].cost).toBe(1.50)
    expect(nodes[0].rows).toBe(50)
  })

  it('parses nested plan nodes', () => {
    const text = [
      'Hash Join  (cost=1.50..3.00 rows=100 width=200)',
      '  ->  Seq Scan on users  (cost=0.00..1.50 rows=50 width=100)',
      '  ->  Hash  (cost=0.50..0.50 rows=10 width=50)',
      '        ->  Seq Scan on orders  (cost=0.00..0.50 rows=10 width=50)'
    ].join('\n')
    const nodes = parsePlanText(text)
    expect(nodes).toHaveLength(1)
    expect(nodes[0].type).toBe('Hash Join')
    expect(nodes[0].children).toHaveLength(2)
    expect(nodes[0].children[0].table).toBe('users')
    expect(nodes[0].children[1].type).toBe('Hash')
    expect(nodes[0].children[1].children).toHaveLength(1)
  })

  it('returns empty array for empty input', () => {
    expect(parsePlanText('')).toEqual([])
  })
})
