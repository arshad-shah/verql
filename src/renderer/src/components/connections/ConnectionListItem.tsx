import { Pencil, Plug, PlugZap, Plus } from 'lucide-react'
import { Badge, Flex, IconButton, Text, Tooltip } from '@/primitives'
import type { ConnectionProfile } from '@shared/types'

/**
 * Two-letter chips for the most common engines. Anything not listed falls
 * back to the first two letters of the type id (uppercased), so a future
 * plugin-contributed driver still renders sensibly without a code change.
 */
const TYPE_BADGE: Record<string, { label: string; tone: 'accent' | 'warning' | 'info' | 'error' | 'default' | 'success' }> = {
  postgresql: { label: 'PG', tone: 'accent'  },
  mysql:      { label: 'MY', tone: 'warning' },
  sqlite:     { label: 'SL', tone: 'info'    },
  mongodb:    { label: 'MG', tone: 'success' },
  redis:      { label: 'RD', tone: 'error'   },
  snowflake:  { label: 'SF', tone: 'info'    },
}
function typeChip(type: string) {
  return TYPE_BADGE[type] ?? { label: type.slice(0, 2).toUpperCase(), tone: 'default' as const }
}

/**
 * Builds the muted one-line summary under the connection name. Skips empty
 * pieces (file-backed sqlite has no host/user; cloud connections may omit
 * port). Joining only the present fields keeps the line readable instead
 * of "  · 5432 · " for half-configured profiles.
 */
function describe(c: { username?: string; host?: string; port?: number; database?: string }): string {
  const left = c.username ? `${c.username}@` : ''
  const hostPort = c.host ? `${c.host}${c.port ? `:${c.port}` : ''}` : ''
  const db = c.database ? `/${c.database}` : ''
  return [left + hostPort + db].filter(Boolean).join(' ').trim()
}

export interface ConnectionListItemProps {
  connection: ConnectionProfile
  /** Live session state — drives the status dot and the connect/disconnect action. */
  connected: boolean
  /** Whether this row is the "active" connection for new query tabs. */
  active: boolean

  // Action callbacks — kept as bare functions (not store actions) so the
  // component is pure presentation and trivially storyable.
  onActivate: () => void
  onEdit: () => void
  onConnect: () => void
  onDisconnect: () => void
  onOpenQueryTab: () => void
}

/**
 * A single connection row. Pure presentation: receives a `ConnectionProfile`
 * plus a few callbacks, owns no store. The `ActiveConnectionsPanel` wires the
 * callbacks to the connections + tabs stores; Storybook drives the same
 * component with fixtures to develop the visual states in isolation.
 *
 * Visual layers (top to bottom of the column):
 *   - Status dot tinted by the user's chosen connection colour
 *   - Title line: engine chip · name · Live/Active badge
 *   - Subtitle: user@host:port/db (mono, indented to align under the title)
 *   - Right-aligned hover actions: edit / connect / disconnect / open
 */
export function ConnectionListItem({
  connection,
  connected,
  active,
  onActivate,
  onEdit,
  onConnect,
  onDisconnect,
  onOpenQueryTab,
}: ConnectionListItemProps) {
  const chip = typeChip(connection.type)
  const summary = describe(connection)
  const dotColor = connection.color ?? (connected ? 'var(--color-success)' : 'var(--color-text-disabled)')

  return (
    <Flex
      align="center"
      gap="sm"
      className={`group px-3 py-1.5 cursor-pointer transition-colors border-l-2 ${
        active
          ? 'bg-accent/10 border-l-accent'
          : connected
            ? 'border-l-transparent hover:bg-white/5'
            : 'border-l-transparent hover:bg-white/5 opacity-80'
      }`}
      onClick={onActivate}
    >
      {/* Status dot — full colour + halo when connected, faded ring when not. */}
      <span
        className="shrink-0 inline-block w-2.5 h-2.5 rounded-full"
        style={{
          backgroundColor: dotColor,
          opacity: connected ? 1 : 0.45,
          boxShadow: connected
            ? `0 0 0 1.5px color-mix(in srgb, ${dotColor} 35%, transparent), 0 0 6px color-mix(in srgb, ${dotColor} 50%, transparent)`
            : 'inset 0 0 0 1px var(--color-border-strong)',
        }}
        aria-label={connected ? 'Connected' : 'Disconnected'}
      />

      <Flex direction="column" className="flex-1 min-w-0">
        <Flex align="center" gap="xs">
          <Badge variant={chip.tone} size="sm" className="font-mono text-[9px] leading-none px-1.5 py-0.5 shrink-0">
            {chip.label}
          </Badge>
          <Text size="xs" weight={active ? 'medium' : 'normal'} truncate className="flex-1">
            {connection.name}
          </Text>
          {connected && !active && (
            <Badge variant="success" size="sm" className="text-[9px] uppercase tracking-wider shrink-0">
              Live
            </Badge>
          )}
          {active && (
            <Badge variant="accent" size="sm" className="text-[9px] uppercase tracking-wider shrink-0">
              Active
            </Badge>
          )}
        </Flex>
        {summary && (
          <Text size="xs" color="muted" truncate className="text-[10px] font-mono">
            {summary}
          </Text>
        )}
      </Flex>

      <Flex className="opacity-0 group-hover:opacity-100 transition-opacity items-center gap-0.5 shrink-0">
        <Tooltip content="Edit connection">
          <IconButton label="Edit connection" size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); onEdit() }}>
            <Pencil size={11} />
          </IconButton>
        </Tooltip>
        {connected ? (
          <>
            <Tooltip content="Open query tab">
              <IconButton
                label="Open query tab"
                size="xs"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); onOpenQueryTab() }}
              >
                <Plus size={11} />
              </IconButton>
            </Tooltip>
            <Tooltip content="Disconnect">
              <IconButton
                label="Disconnect"
                size="xs"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); onDisconnect() }}
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
              onClick={(e) => { e.stopPropagation(); onConnect() }}
              className="hover:text-success"
            >
              <PlugZap size={11} />
            </IconButton>
          </Tooltip>
        )}
      </Flex>
    </Flex>
  )
}
