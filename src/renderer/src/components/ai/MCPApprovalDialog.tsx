import { useAIStore } from '@/stores/ai'
import { AlertTriangle } from 'lucide-react'

export function MCPApprovalDialog() {
  const mcpPendingApproval = useAIStore(s => s.mcpPendingApproval)
  const respondToMCPApproval = useAIStore(s => s.respondToMCPApproval)

  if (!mcpPendingApproval) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-bg-primary border border-border rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-yellow-500/10">
          <AlertTriangle size={18} className="text-yellow-500 shrink-0" />
          <span className="text-sm font-medium text-text-primary">MCP Query Approval</span>
        </div>
        <div className="p-4">
          <p className="text-xs text-text-secondary mb-2">
            An external MCP client wants to execute the following query:
          </p>
          <pre className="bg-bg-secondary border border-border rounded-md p-3 text-xs font-mono text-text-primary overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap">
            {mcpPendingApproval.sql}
          </pre>
        </div>
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-border">
          <button
            onClick={() => respondToMCPApproval(mcpPendingApproval.requestId, false)}
            className="px-4 py-1.5 text-sm rounded-md border border-border text-text-secondary hover:bg-hover transition-colors"
          >
            Reject
          </button>
          <button
            onClick={() => respondToMCPApproval(mcpPendingApproval.requestId, true)}
            className="px-4 py-1.5 text-sm rounded-md bg-accent text-white hover:opacity-90 transition-colors"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  )
}
