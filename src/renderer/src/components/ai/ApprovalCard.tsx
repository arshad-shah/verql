import { useAIStore } from '@/stores/ai'

export function ApprovalCard() {
  const pendingApproval = useAIStore(s => s.pendingApproval)
  const respondToApproval = useAIStore(s => s.respondToApproval)

  if (!pendingApproval) return null

  return (
    <div className="mx-2 mb-3 rounded-lg border border-yellow-700 bg-yellow-900/20 p-3">
      <div className="text-sm font-medium text-yellow-300 mb-1">
        Action requires approval
      </div>
      <div className="text-xs text-[var(--color-text-secondary)] mb-2">
        {pendingApproval.toolName}: {pendingApproval.display}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => respondToApproval(pendingApproval.requestId, true)}
          className="rounded px-3 py-1 text-xs bg-green-700 text-white hover:bg-green-600"
        >
          Approve
        </button>
        <button
          onClick={() => respondToApproval(pendingApproval.requestId, false)}
          className="rounded px-3 py-1 text-xs bg-red-700 text-white hover:bg-red-600"
        >
          Reject
        </button>
      </div>
    </div>
  )
}
