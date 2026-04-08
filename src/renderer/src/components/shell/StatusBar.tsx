import { useConnectionsStore } from '@/stores/connections'

export function StatusBar() {
  const { activeConnectionId, connections } = useConnectionsStore()
  const active = connections.find(c => c.id === activeConnectionId)

  return (
    <div className="h-6 bg-accent flex items-center px-3 text-xs text-white shrink-0 justify-between">
      <div className="flex items-center gap-3">
        {active ? (
          <>
            <span>{active.type === 'postgresql' ? 'PostgreSQL' : active.type === 'mysql' ? 'MySQL' : 'SQLite'}</span>
            <span>·</span>
            <span>{active.name}</span>
            <span>·</span>
            <span>{active.database}</span>
          </>
        ) : (
          <span>Disconnected</span>
        )}
      </div>
      <span>UTF-8</span>
    </div>
  )
}
