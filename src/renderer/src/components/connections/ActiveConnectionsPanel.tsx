import { Database, Pencil, Plug, PlugZap, Plus } from 'lucide-react'
import { Box, Flex, IconButton, Stack, Text, Tooltip, EmptyState } from '@/primitives'
import { useConnectionsStore } from '@/stores/connections'
import { useTabsStore } from '@/stores/tabs'
import { notifyError } from '@/lib/notify-error'

/**
 * IntelliJ-style "active connections" pane.
 *
 * The connections store already tracks `connectedIds` as a Set, so we have
 * always-supported multi-connect at the data layer; this panel just makes
 * that state visible and manageable. From here a user can:
 *   - see every live database session at a glance
 *   - pick which is the "active" one (the one new query tabs default to)
 *   - open a fresh query tab against any connected DB
 *   - disconnect without going through the explorer
 *   - jump to the connection editor to spin up another connection
 *
 * Lives in the secondary sidebar so the primary sidebar (explorer/schema)
 * stays focused on the currently-active connection's objects — same split
 * IntelliJ uses for "Database" tool window vs. data sources.
 */
export function ActiveConnectionsPanel() {
  const connections = useConnectionsStore(s => s.connections)
  const connectedIds = useConnectionsStore(s => s.connectedIds)
  const activeConnectionId = useConnectionsStore(s => s.activeConnectionId)
  const setActiveConnection = useConnectionsStore(s => s.setActiveConnection)
  const disconnect = useConnectionsStore(s => s.disconnect)
  const connect = useConnectionsStore(s => s.connect)
  const addQueryTab = useTabsStore(s => s.addQueryTab)
  const openConnectionForm = useTabsStore(s => s.openConnectionForm)

  // We surface both connected and disconnected profiles so the user can
  // re-establish a session from the same surface. Connected profiles sort
  // first so the live state reads at a glance.
  const sorted = [...connections].sort((a, b) => {
    const aConn = connectedIds.has(a.id) ? 0 : 1
    const bConn = connectedIds.has(b.id) ? 0 : 1
    if (aConn !== bConn) return aConn - bConn
    return a.name.localeCompare(b.name)
  })

  const handleConnect = async (id: string) => {
    const result = await connect(id)
    if (!result.success) notifyError(result.error ?? 'Connection failed', { titlePrefix: 'Connect' })
  }

  if (connections.length === 0) {
    return (
      <Box className="p-4">
        <EmptyState
          icon={<Database size={20} className="text-text-muted" />}
          title="No connections yet"
          description="Add a database connection to get started."
          action={
            <button
              onClick={() => openConnectionForm()}
              className="text-xs text-accent hover:underline"
            >
              New connection
            </button>
          }
        />
      </Box>
    )
  }

  return (
    <Stack className="py-1">
      {/* Panel toolbar — the "+ New connection" lives here so it's always
          one click away regardless of whether any connection is selected.
          Per-row edit lives on each row so the action is unambiguously
          scoped to that connection. */}
      <Flex align="center" justify="between" className="px-3 py-1">
        <Text size="xs" color="muted" className="text-[10px] uppercase tracking-wider">
          {connections.length} connection{connections.length === 1 ? '' : 's'}
        </Text>
        <Tooltip content="New connection">
          <IconButton
            label="New connection"
            size="xs"
            variant="ghost"
            onClick={() => openConnectionForm()}
          >
            <Plus size={12} />
          </IconButton>
        </Tooltip>
      </Flex>

      {sorted.map(c => {
        const isConnected = connectedIds.has(c.id)
        const isActive = activeConnectionId === c.id
        return (
          <Flex
            key={c.id}
            align="center"
            gap="sm"
            className={`group px-3 py-1.5 cursor-pointer transition-colors ${
              isActive ? 'bg-accent/10' : 'hover:bg-white/5'
            }`}
            onClick={() => setActiveConnection(c.id)}
          >
            {/* Live-state dot: green when connected, muted ring otherwise.
                We use a literal SVG rather than a generic icon so the colour
                tracks the state instead of a static text colour slot. */}
            <span
              className={`shrink-0 inline-block w-2 h-2 rounded-full ${
                isConnected ? 'bg-success shadow-[0_0_6px_var(--color-success)]' : 'border border-border-default'
              }`}
              aria-label={isConnected ? 'Connected' : 'Disconnected'}
            />
            <Flex direction="column" className="flex-1 min-w-0">
              <Flex align="center" gap="xs">
                <Text size="xs" weight={isActive ? 'medium' : 'normal'} truncate className="flex-1">
                  {c.name}
                </Text>
                {isActive && (
                  <Text size="xs" color="accent" className="text-[9px] uppercase tracking-wider shrink-0">
                    active
                  </Text>
                )}
              </Flex>
              <Text size="xs" color="muted" truncate className="text-[10px]">
                {c.type}{c.host ? ` · ${c.host}` : ''}
              </Text>
            </Flex>

            {/* Per-row controls. Hidden until hover so the row stays calm.
                Edit is always available (you might need to fix credentials
                even on a live session); connect/disconnect/open swap based
                on the live state. */}
            <Flex className="opacity-0 group-hover:opacity-100 transition-opacity items-center gap-0.5 shrink-0">
              <Tooltip content="Edit connection">
                <IconButton
                  label="Edit connection"
                  size="xs"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); openConnectionForm(c.id) }}
                >
                  <Pencil size={11} />
                </IconButton>
              </Tooltip>
              {isConnected ? (
                <>
                  <Tooltip content="Open query tab">
                    <IconButton
                      label="Open query tab"
                      size="xs"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveConnection(c.id)
                        addQueryTab(c.id)
                      }}
                    >
                      <Plus size={11} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip content="Disconnect">
                    <IconButton
                      label="Disconnect"
                      size="xs"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); void disconnect(c.id) }}
                      className="hover:text-error"
                    >
                      <Plug size={11} />
                    </IconButton>
                  </Tooltip>
                </>
              ) : (
                <Tooltip content="Connect">
                  <IconButton
                    label="Connect"
                    size="xs"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); void handleConnect(c.id) }}
                    className="hover:text-success"
                  >
                    <PlugZap size={11} />
                  </IconButton>
                </Tooltip>
              )}
            </Flex>
          </Flex>
        )
      })}
    </Stack>
  )
}
