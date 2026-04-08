import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import type { PlanNode as PlanNodeType } from '@/lib/plan-parser'

interface Props {
  node: PlanNodeType
  maxCost: number
  depth?: number
}

function costColor(ratio: number): string {
  if (ratio < 0.3) return '#28c840'
  if (ratio < 0.6) return '#e5c07b'
  return '#ff5f57'
}

export function PlanNodeView({ node, maxCost, depth = 0 }: Props) {
  const [expanded, setExpanded] = useState(true)
  const costRatio = maxCost > 0 ? node.cost / maxCost : 0
  const hasChildren = node.children.length > 0
  const color = costColor(costRatio)

  return (
    <div style={{ marginLeft: depth * 24 }}>
      <div
        className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-white/5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {hasChildren ? (
          expanded ? <ChevronDown size={14} className="text-text-muted shrink-0" /> : <ChevronRight size={14} className="text-text-muted shrink-0" />
        ) : (
          <span className="w-3.5 shrink-0" />
        )}

        <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: color, color: costRatio > 0.3 ? '#000' : '#fff' }}>
          {node.type}
        </span>

        {node.table && <span className="text-xs text-info">{node.table}</span>}

        <div className="flex-1 mx-2 h-2 bg-bg-tertiary rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(costRatio * 100, 2)}%`, backgroundColor: color }} />
        </div>

        <span className="text-xs text-text-muted shrink-0">cost: {node.cost.toFixed(1)}</span>
        <span className="text-xs text-text-muted shrink-0">rows: {node.rows}</span>
        {node.actualTime !== undefined && (
          <span className="text-xs text-warning shrink-0">{node.actualTime.toFixed(1)}ms</span>
        )}
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children.map((child, i) => (
            <PlanNodeView key={i} node={child} maxCost={maxCost} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
