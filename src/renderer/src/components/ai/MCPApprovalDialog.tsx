import { useAIStore } from '@/stores/ai'
import { AlertTriangle } from 'lucide-react'
import { CodeView } from '@/primitives'

export function MCPApprovalDialog() {
  const req = useAIStore(s => s.mcpPendingApproval)
  const respond = useAIStore(s => s.respondToMCPApproval)
  if (!req) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-bg-primary border border-border rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-yellow-500/10">
          <AlertTriangle size={18} className="text-yellow-500 shrink-0" />
          <span className="text-sm font-medium text-text-primary">MCP Query Approval</span>
          <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${req.permission === 'write' ? 'bg-yellow-500/20 text-yellow-600' : 'bg-bg-secondary text-text-secondary'}`}>
            {req.permission === 'write' ? 'WRITE' : 'READ'}
          </span>
        </div>
        <div className="p-4">
          <p className="text-xs text-text-secondary mb-2">
            An external MCP client wants to run <span className="font-medium text-text-primary">{req.toolName}</span>:
          </p>
          <div className="max-h-48 overflow-y-auto">
            <CodeView code={req.sql} language="sql" />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-border">
          <button onClick={() => respond(req.requestId, false)} className="px-4 py-1.5 text-sm rounded-md border border-border text-text-secondary hover:bg-hover transition-colors">Reject</button>
          <button onClick={() => respond(req.requestId, true)} className="px-4 py-1.5 text-sm rounded-md bg-accent text-white hover:opacity-90 transition-colors">Approve</button>
        </div>
      </div>
    </div>
  )
}
