import { ArrowLeftRight } from 'lucide-react'
import { useConnectionsStore } from '@/stores/connections'
import { StatusBarSegment } from './StatusBarSegment'

interface Props {
  onClick: () => void
}

export function MultiConnectionSegment({ onClick }: Props) {
  const count = useConnectionsStore((s) => s.connectedIds.size)
  if (count <= 1) return null
  return (
    <StatusBarSegment
      as="button"
      tone="accent-soft"
      side="left"
      interactive
      onClick={onClick}
      aria-label={`${count} active connections`}
    >
      <ArrowLeftRight size={11} aria-hidden />
      <span>{count}</span>
    </StatusBarSegment>
  )
}
