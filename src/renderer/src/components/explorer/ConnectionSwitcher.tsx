import { useEffect } from 'react'
import { Settings } from 'lucide-react'
import { useConnectionsStore } from '@/stores/connections'
import { useTabsStore } from '@/stores/tabs'
import { Select } from '@/primitives/forms/Select'
import { IconButton } from '@/primitives/forms/Button'
import { Tooltip } from '@/primitives/surfaces/Tooltip'
import { Flex } from '@/primitives/layout/Flex'

export function ConnectionSwitcher() {
  const connections = useConnectionsStore((s) => s.connections)
  const activeConnectionId = useConnectionsStore((s) => s.activeConnectionId)
  const connectedIds = useConnectionsStore((s) => s.connectedIds)
  const connect = useConnectionsStore((s) => s.connect)
  const setActiveConnection = useConnectionsStore((s) => s.setActiveConnection)
  const loadConnections = useConnectionsStore((s) => s.loadConnections)
  const openConnectionForm = useTabsStore((s) => s.openConnectionForm)

  useEffect(() => {
    loadConnections()
  }, [loadConnections])

  const options = connections.map((c) => ({
    value: c.id,
    label: c.name,
  }))

  const handleChange = async (id: string) => {
    if (connectedIds.has(id)) {
      setActiveConnection(id)
    } else {
      await connect(id)
    }
  }

  return (
    <Flex gap="xs" align="center" className="px-2 py-1.5">
      <div className="flex-1 min-w-0">
        <Select
          size="sm"
          value={activeConnectionId ?? ''}
          onChange={handleChange}
          options={options}
          placeholder="Select connection…"
          renderValue={(option) =>
            option ? (
              <Flex gap="xs" align="center">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: connectedIds.has(option.value)
                      ? 'var(--color-success)'
                      : 'var(--color-text-disabled)',
                  }}
                />
                <span className="truncate">{option.label}</span>
              </Flex>
            ) : null
          }
          renderOption={(option, { selected }) => (
            <Flex gap="xs" align="center">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: connectedIds.has(option.value)
                    ? 'var(--color-success)'
                    : 'var(--color-text-disabled)',
                }}
              />
              <span className="truncate">{option.label}</span>
            </Flex>
          )}
        />
      </div>
      <Tooltip content="Manage connections">
        <IconButton
          size="sm"
          variant="ghost"
          label="Manage connections"
          onClick={() => openConnectionForm()}
        >
          <Settings size={14} />
        </IconButton>
      </Tooltip>
    </Flex>
  )
}
