import { useAIStore } from '@/stores/ai'
import { ApprovalCardContent } from './ApprovalCard'
import { PermissionModeRow } from './PermissionModeRow'
import { ChatInput } from './ChatInput'

/**
 * Sticky container above the composer that hosts anything requiring user
 * attention: pending approvals, the permission-mode picker, and the input
 * itself. Lives outside the scrollable MessageThread so nothing here can
 * scroll away mid-conversation.
 */
export function ActionZone() {
  const pending = useAIStore((s) => s.pendingApproval)
  const respond = useAIStore((s) => s.respondToApproval)

  return (
    <div className="border-t border-border-default bg-bg-secondary">
      {pending ? <ApprovalCardContent approval={pending} onRespond={respond} /> : null}
      <PermissionModeRow />
      <ChatInput />
    </div>
  )
}
