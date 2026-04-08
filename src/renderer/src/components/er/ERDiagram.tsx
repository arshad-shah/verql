import { useEffect, useState, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { TableNode } from './TableNode'
import { buildErElements, layoutErDiagram, type TableNodeData } from './er-layout'
import { useSchemaStore } from '@/stores/schema'
import { useConnectionsStore } from '@/stores/connections'
import { Loader2 } from 'lucide-react'

const nodeTypes = { tableNode: TableNode }

interface Props {
  connectionId: string
  schema: string
}

export function ERDiagram({ connectionId, schema }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<TableNodeData>>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [loading, setLoading] = useState(true)
  const [direction, setDirection] = useState<'LR' | 'TB'>('LR')
  const { fetchTables, fetchColumns } = useSchemaStore()

  useEffect(() => {
    let cancelled = false

    async function loadSchema() {
      setLoading(true)
      const tables = await fetchTables(connectionId, schema)

      const tablesWithColumns = await Promise.all(
        tables.filter(t => t.type === 'table').map(async (table) => {
          const columns = await fetchColumns(connectionId, table.name, schema)
          return { name: table.name, columns }
        })
      )

      if (cancelled) return

      const { nodes: rawNodes, edges: rawEdges } = buildErElements(tablesWithColumns)
      const { nodes: layoutedNodes, edges: layoutedEdges } = layoutErDiagram(rawNodes, rawEdges, direction)
      setNodes(layoutedNodes)
      setEdges(layoutedEdges)
      setLoading(false)
    }

    loadSchema()
    return () => { cancelled = true }
  }, [connectionId, schema])

  const handleRelayout = useCallback((dir: 'LR' | 'TB') => {
    setDirection(dir)
    const { nodes: layoutedNodes, edges: layoutedEdges } = layoutErDiagram(nodes, edges, dir)
    setNodes([...layoutedNodes])
    setEdges([...layoutedEdges])
  }, [nodes, edges, setNodes, setEdges])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-tertiary h-full">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-tertiary text-text-muted text-sm h-full">
        No tables found in schema "{schema}"
      </div>
    )
  }

  return (
    <div className="h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#2a2a3e" gap={20} size={1} />
        <Controls
          position="bottom-right"
          className="!bg-bg-secondary !border-border !shadow-lg [&>button]:!bg-bg-secondary [&>button]:!border-border [&>button]:!text-text-secondary [&>button:hover]:!bg-white/5"
        />
        <MiniMap
          position="bottom-left"
          nodeColor={(n) => (n.data as TableNodeData)?.color ?? '#7c6ff7'}
          maskColor="rgba(0,0,0,0.7)"
          className="!bg-bg-secondary !border-border"
        />
        <div className="absolute top-3 right-3 flex gap-1 z-10">
          <button
            onClick={() => handleRelayout('LR')}
            className={`px-2 py-1 text-xs rounded border transition-colors ${direction === 'LR' ? 'border-accent text-accent bg-accent/10' : 'border-border text-text-muted hover:text-text-primary'}`}
          >
            Horizontal
          </button>
          <button
            onClick={() => handleRelayout('TB')}
            className={`px-2 py-1 text-xs rounded border transition-colors ${direction === 'TB' ? 'border-accent text-accent bg-accent/10' : 'border-border text-text-muted hover:text-text-primary'}`}
          >
            Vertical
          </button>
        </div>
      </ReactFlow>
    </div>
  )
}
