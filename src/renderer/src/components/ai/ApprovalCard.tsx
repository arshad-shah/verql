import { useAIStore } from '@/stores/ai'
import { Card } from '@/primitives/surfaces/Card'
import { Text } from '@/primitives/typography/Text'
import { Badge } from '@/primitives/data-display/Badge'
import { Button } from '@/primitives/forms/Button'
import type { AIApprovalRequest } from '@shared/ai-types'

interface ApprovalCardContentProps {
  approval: AIApprovalRequest
  onRespond: (requestId: string, approved: boolean) => void
}

export function ApprovalCardContent({ approval, onRespond }: ApprovalCardContentProps) {
  return (
    <Card padding="md" className="mx-2 mb-3 border-warning/30 bg-warning/5">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="warning" size="sm">Action Required</Badge>
        <Text size="xs" weight="medium">{approval.toolName}</Text>
      </div>
      <Text size="xs" color="secondary" as="p" className="mb-3">
        {approval.display}
      </Text>
      <div className="flex gap-2">
        <Button
          variant="solid"
          size="xs"
          onClick={() => onRespond(approval.requestId, true)}
        >
          Approve
        </Button>
        <Button
          variant="danger"
          size="xs"
          onClick={() => onRespond(approval.requestId, false)}
        >
          Reject
        </Button>
      </div>
    </Card>
  )
}

export function ApprovalCard() {
  const pendingApproval = useAIStore(s => s.pendingApproval)
  const respondToApproval = useAIStore(s => s.respondToApproval)

  if (!pendingApproval) return null

  return (
    <ApprovalCardContent
      approval={pendingApproval}
      onRespond={respondToApproval}
    />
  )
}
