import dagre from '@dagrejs/dagre'
import type { Node, Edge } from '@xyflow/react'

const NODE_WIDTH = 220
const NODE_HEIGHT_BASE = 40
const NODE_HEIGHT_PER_COLUMN = 22

export interface TableNodeData {
  tableName: string
  columns: { name: string; dataType: string; isPrimaryKey: boolean; isForeignKey: boolean }[]
  color: string
}

export function layoutErDiagram(
  nodes: Node<TableNodeData>[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'LR'
): { nodes: Node<TableNodeData>[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 80 })

  nodes.forEach((node) => {
    const height = NODE_HEIGHT_BASE + (node.data.columns.length * NODE_HEIGHT_PER_COLUMN)
    g.setNode(node.id, { width: NODE_WIDTH, height })
  })

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  const isHorizontal = direction === 'LR'
  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id)
    const height = NODE_HEIGHT_BASE + (node.data.columns.length * NODE_HEIGHT_PER_COLUMN)
    return {
      ...node,
      targetPosition: isHorizontal ? ('left' as const) : ('top' as const),
      sourcePosition: isHorizontal ? ('right' as const) : ('bottom' as const),
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - height / 2
      }
    }
  })

  return { nodes: layoutedNodes, edges }
}

const TABLE_COLORS = [
  '#7c6ff7', '#28c840', '#e5c07b', '#61afef', '#ff5f57', '#c678dd',
  '#56b6c2', '#d19a66', '#98c379', '#e06c75'
]

export function buildErElements(
  tables: { name: string; columns: { name: string; dataType: string; isPrimaryKey: boolean; isForeignKey: boolean; references?: { table: string; column: string } }[] }[]
): { nodes: Node<TableNodeData>[]; edges: Edge[] } {
  const tableSet = new Set(tables.map(t => t.name))

  const nodes: Node<TableNodeData>[] = tables.map((table, i) => ({
    id: table.name,
    type: 'tableNode',
    position: { x: 0, y: 0 },
    data: {
      tableName: table.name,
      columns: table.columns.map(c => ({
        name: c.name,
        dataType: c.dataType,
        isPrimaryKey: c.isPrimaryKey,
        isForeignKey: c.isForeignKey
      })),
      color: TABLE_COLORS[i % TABLE_COLORS.length]
    }
  }))

  const edges: Edge[] = []
  for (const table of tables) {
    for (const col of table.columns) {
      if (col.isForeignKey && col.references && tableSet.has(col.references.table)) {
        edges.push({
          id: `${table.name}.${col.name}->${col.references.table}.${col.references.column}`,
          source: table.name,
          target: col.references.table,
          label: `${col.name} → ${col.references.column}`,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#7c6ff7', strokeWidth: 1.5 },
          labelStyle: { fontSize: 9, fill: '#888' }
        })
      }
    }
  }

  return { nodes, edges }
}
