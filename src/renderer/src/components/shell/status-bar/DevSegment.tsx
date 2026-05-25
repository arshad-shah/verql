import { StatusBarSegment } from './StatusBarSegment'

const isDev = import.meta.env.DEV

export function DevSegment() {
  if (!isDev) return null
  return (
    <StatusBarSegment tone="dev" side="right" aria-label="Development build">
      DEV
    </StatusBarSegment>
  )
}
