import { Database, Plus } from 'lucide-react'
import { Box, Flex, IconButton, Stack, Text, Tooltip, EmptyState } from '@/primitives'
import { useConnectionsStore } from '@/stores/connections'
import { useTabsStore } from '@/stores/tabs'
import { notifyError } from '@/lib/notify-error'
import { initialAutoCommit } from '@/lib/initial-autocommit'
import { ConnectionListItem } from './ConnectionListItem'

/**
 * IntelliJ-style active-connections pane.
 *
 * The connections store already tracks `connectedIds` as a Set, so multi-
 * connect is supported at the data layer; this panel makes that state
 * visible and actionable. Row rendering lives in `ConnectionListItem` so
 * the visual states can be developed in Storybook without spinning up a
 * connections store. This file is just data binding.
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

  // Connected first, then alphabetical — live state reads at a glance.
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

  // Pre-bucket so we can render a "Live" section header above connected rows.
  // The headers are subtle (uppercase muted text) — same visual weight as the
  // "Categories" / "Matches" headers in Settings, so the panel reads as one
  // family with the rest of the secondary-sidebar surfaces.
  const live = sorted.filter(c => connectedIds.has(c.id))
  const saved = sorted.filter(c => !connectedIds.has(c.id))

  return (
    <Stack className="py-1">
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

      {live.length > 0 && (
        <>
          <Text size="xs" color="muted" className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider">
            Live · {live.length}
          </Text>
          {live.map(c => (
            <ConnectionListItem
              key={c.id}
              connection={c}
              connected
              active={activeConnectionId === c.id}
              onActivate={() => setActiveConnection(c.id)}
              onEdit={() => openConnectionForm(c.id)}
              onConnect={() => handleConnect(c.id)}
              onDisconnect={() => void disconnect(c.id)}
              onOpenQueryTab={() => {
                setActiveConnection(c.id)
                addQueryTab(c.id, null, { autoCommit: initialAutoCommit(c) })
              }}
            />
          ))}
        </>
      )}

      {saved.length > 0 && (
        <>
          <Text size="xs" color="muted" className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider">
            Saved · {saved.length}
          </Text>
          {saved.map(c => (
            <ConnectionListItem
              key={c.id}
              connection={c}
              connected={false}
              active={activeConnectionId === c.id}
              onActivate={() => setActiveConnection(c.id)}
              onEdit={() => openConnectionForm(c.id)}
              onConnect={() => handleConnect(c.id)}
              onDisconnect={() => void disconnect(c.id)}
              onOpenQueryTab={() => {
                setActiveConnection(c.id)
                addQueryTab(c.id, null, { autoCommit: initialAutoCommit(c) })
              }}
            />
          ))}
        </>
      )}
    </Stack>
  )
}
