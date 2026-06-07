import { useEffect } from 'react'
import { useActivityStore } from '@/stores/activity'
import { ActivityList } from './ActivityList'

// Re-export the presentational list so it can be imported from the panel module
// (used by Storybook/tests) as well as directly.
export { ActivityList } from './ActivityList'

/** Container: wires the live activity store. */
export function ActivityPanel() {
  const entries = useActivityStore((s) => s.entries)
  const init = useActivityStore((s) => s.init)
  const clear = useActivityStore((s) => s.clear)

  useEffect(() => { void init() }, [init])

  return <ActivityList entries={entries} onClear={() => void clear()} />
}
