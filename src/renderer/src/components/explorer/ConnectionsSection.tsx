import { useEffect, useState } from 'react'
import { Plus, PlugZap, Unplug, Pencil, Trash2, Copy } from 'lucide-react'
import { useConnectionsStore } from '@/stores/connections'
import { useToastStore } from '@/stores/toast'
import { ConnectionForm } from '@/components/connections/ConnectionForm'
import { AccordionSection } from './AccordionSection'
import { OverflowMenu, type MenuItem } from './OverflowMenu'
import type { ConnectionProfile } from '@shared/types'
import { IconButton, Text } from '@/primitives'

export function ConnectionsSection() {
  const { connections, connectedIds, activeConnectionId, loadConnections, saveConnection, deleteConnection, connect, disconnect, setActiveConnection } = useConnectionsStore()
  const addToast = useToastStore((s) => s.addToast)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ConnectionProfile | undefined>()

  useEffect(() => { loadConnections() }, [loadConnections])

  const handleSave = async (profile: ConnectionProfile) => {
    await saveConnection(profile)
    setShowForm(false)
    setEditing(undefined)
  }

  const handleConnect = async (id: string) => {
    if (connectedIds.has(id)) {
      setActiveConnection(id)
    } else {
      const result = await connect(id)
      if (!result.success) addToast({ type: 'error', title: 'Connection failed', message: result.error })
    }
  }

  const handleDuplicate = async (conn: ConnectionProfile) => {
    const duplicate: ConnectionProfile = {
      ...conn,
      id: crypto.randomUUID(),
      name: `${conn.name} (copy)`
    }
    setEditing(duplicate)
    setShowForm(true)
  }

  const getOverflowItems = (conn: ConnectionProfile): MenuItem[] => {
    const items: MenuItem[] = []
    const isConnected = connectedIds.has(conn.id)
    if (isConnected) {
      items.push({
        label: 'Disconnect',
        icon: <Unplug size={12} />,
        onClick: () => disconnect(conn.id)
      })
    }
    items.push({
      label: 'Duplicate',
      icon: <Copy size={12} />,
      onClick: () => handleDuplicate(conn)
    })
    items.push({
      label: 'Delete',
      icon: <Trash2 size={12} />,
      variant: 'danger',
      onClick: () => { if (confirm(`Delete "${conn.name}"?`)) deleteConnection(conn.id) }
    })
    return items
  }

  return (
    <>
      <AccordionSection
        title="CONNECTIONS"
        count={connections.length}
        actions={
          <IconButton
            label="New Connection"
            size="xs"
            variant="ghost"
            onClick={() => { setEditing(undefined); setShowForm(true) }}
            className="text-text-muted hover:text-text-primary"
          >
            <Plus size={12} />
          </IconButton>
        }
      >
        <div className="px-1">
          {connections.length === 0 && (
            <Text size="xs" color="muted" as="p" className="px-2 py-4 text-center">No connections yet</Text>
          )}
          {connections.map((conn) => {
            const isConnected = connectedIds.has(conn.id)
            const isActive = activeConnectionId === conn.id
            return (
              <div
                key={conn.id}
                onClick={() => handleConnect(conn.id)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                  isActive ? 'bg-accent/10 text-accent' : 'hover:bg-white/5 text-text-secondary'
                }`}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: isConnected ? (conn.color ?? '#7c6ff7') : '#444' }}
                />
                <Text size="xs" truncate className="flex-1">{conn.name}</Text>
                <IconButton
                  label={isConnected ? 'Disconnect' : 'Connect'}
                  size="xs"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    isConnected ? disconnect(conn.id) : handleConnect(conn.id)
                  }}
                  className={`shrink-0 ${isConnected ? 'text-success hover:text-error' : 'text-text-muted hover:text-success'}`}
                >
                  {isConnected ? <Unplug size={12} /> : <PlugZap size={12} />}
                </IconButton>
                <IconButton
                  label="Edit"
                  size="xs"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); setEditing(conn); setShowForm(true) }}
                  className="text-text-muted hover:text-text-primary shrink-0"
                >
                  <Pencil size={12} />
                </IconButton>
                <OverflowMenu items={getOverflowItems(conn)} />
              </div>
            )
          })}
        </div>
      </AccordionSection>
      {showForm && (
        <ConnectionForm initial={editing} onSave={handleSave} onClose={() => { setShowForm(false); setEditing(undefined) }} />
      )}
    </>
  )
}
