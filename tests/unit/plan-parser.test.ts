import { describe, it, expect } from 'vitest'
import { parsePostgresPlan } from '../../src/main/plugins/bundled/postgresql/plan-parse'
import type { QueryResult } from '../../shared/types'

// Helper: build an EXPLAIN-style QueryResult from plan text lines (PG returns
// one row per plan line under a single "QUERY PLAN" column).
function explainResult(lines: string[]): QueryResult {
  return {
    rows: lines.map((l) => ({ 'QUERY PLAN': l })),
    fields: [{ name: 'QUERY PLAN', dataType: 'text' }],
    rowCount: lines.length,
    duration: 0,
    affectedRows: 0,
  }
}

describe('parsePostgresPlan — text format', () => {
  it('parses a simple EXPLAIN row', () => {
    const nodes = parsePostgresPlan(explainResult(['Seq Scan on users  (cost=0.00..1.50 rows=50 width=100)']))
    expect(nodes).toHaveLength(1)
    expect(nodes[0].type).toBe('Seq Scan')
    expect(nodes[0].table).toBe('users')
    expect(nodes[0].cost).toBe(1.5)
    expect(nodes[0].rows).toBe(50)
  })

  it('parses nested plan nodes', () => {
    const nodes = parsePostgresPlan(explainResult([
      'Hash Join  (cost=1.50..3.00 rows=100 width=200)',
      '  ->  Seq Scan on users  (cost=0.00..1.50 rows=50 width=100)',
      '  ->  Hash  (cost=0.50..0.50 rows=10 width=50)',
      '        ->  Seq Scan on orders  (cost=0.00..0.50 rows=10 width=50)',
    ]))
    expect(nodes).toHaveLength(1)
    expect(nodes[0].type).toBe('Hash Join')
    expect(nodes[0].children).toHaveLength(2)
    expect(nodes[0].children[0].table).toBe('users')
    expect(nodes[0].children[1].type).toBe('Hash')
    expect(nodes[0].children[1].children).toHaveLength(1)
  })

  it('returns [] for empty results', () => {
    expect(parsePostgresPlan(explainResult([]))).toEqual([])
  })
})

describe('parsePostgresPlan — JSON format', () => {
  it('parses EXPLAIN (FORMAT JSON) output', () => {
    const json = JSON.stringify([
      { Plan: { 'Node Type': 'Seq Scan', 'Relation Name': 'users', 'Total Cost': 12.5, 'Plan Rows': 42, 'Actual Total Time': 0.9 } },
    ])
    const nodes = parsePostgresPlan(explainResult([json]))
    expect(nodes).toHaveLength(1)
    expect(nodes[0].type).toBe('Seq Scan')
    expect(nodes[0].table).toBe('users')
    expect(nodes[0].cost).toBe(12.5)
    expect(nodes[0].rows).toBe(42)
    expect(nodes[0].actualTime).toBe(0.9)
  })
})
