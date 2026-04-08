import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Key, Link } from 'lucide-react'
import type { TableNodeData } from './er-layout'

function TableNodeComponent({ data }: NodeProps) {
  const { tableName, columns, color } = data as TableNodeData

  return (
    <div className="bg-bg-secondary border border-border rounded-lg overflow-hidden shadow-lg min-w-[200px]" style={{ borderColor: color }}>
      <Handle type="target" position={Position.Left} className="!bg-accent !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-accent !w-2 !h-2" />

      <div className="px-3 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: color }}>
        {tableName}
      </div>

      <div className="divide-y divide-border">
        {columns.map((col) => (
          <div key={col.name} className="flex items-center gap-1.5 px-2.5 py-1 text-[11px]">
            {col.isPrimaryKey ? (
              <Key size={10} className="text-warning shrink-0" />
            ) : col.isForeignKey ? (
              <Link size={10} className="text-info shrink-0" />
            ) : (
              <span className="w-2.5 shrink-0" />
            )}
            <span className="text-text-primary">{col.name}</span>
            <span className="text-text-muted ml-auto">{col.dataType}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export const TableNode = memo(TableNodeComponent)
