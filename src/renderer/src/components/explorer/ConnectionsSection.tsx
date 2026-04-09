import { useEffect, useState } from 'react'
import { Plus, PlugZap, Unplug, Pencil, MoreHorizontal } from 'lucide-react'
import { useConnectionsStore } from '@/stores/connections'
import { useUiStore } from '@/stores/ui'
import { useToastStore } from '@/stores/toast'
import { useTabsStore } from '@/stores/tabs'
import { ConfirmDialog } from '@/components/shell/ConfirmDialog'
import type { ConnectionProfile } from '@shared/types'
import { Accordion, TreeItem, DropdownMenu, ContextMenu, IconButton, Text, Box, Badge } from '@/primitives'

export function ConnectionsSection() {
  const { connections, connectedIds, activeConnectionId, loadConnections, saveConnection, deleteConnection, connect, disconnect, setActiveConnection } = useConnectionsStore()
  const expanded = useUiStore((s) => s.expandedSections['CONNECTIONS'] ?? true)
  const toggleSection = useUiStore((s) => s.toggleSection)
  const addToast = useToastStore((s) => s.addToast)
  const openConnectionForm = useTabsStore(s => s.openConnectionForm)
  const [deleteTarget, setDeleteTarget] = useState<ConnectionProfile | null>(null)

  useEffect(() => { loadConnections() }, [loadConnections])

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
      name: `${conn.name} (copy)`,
    }
    await saveConnection(duplicate)
    openConnectionForm(duplicate.id)
  }

  const getMenuItems = (conn: ConnectionProfile) => {
    const isConnected = connectedIds.has(conn.id)
    const items = []
    if (isConnected) {
      items.push({ label: 'Disconnect', onSelect: () => disconnect(conn.id) })
    }
    items.push({ label: 'Duplicate', onSelect: () => handleDuplicate(conn) })
    items.push({ label: 'Delete', onSelect: () => setDeleteTarget(conn) })
    return items
  }

  return (
    <>
      <Accordion>
        <Accordion.Item open={expanded} onOpenChange={() => toggleSection('CONNECTIONS')}>
          <Accordion.Trigger>
            <Text size="xs" color="muted" className="uppercase tracking-wider flex-1 text-left">CONNECTIONS</Text>
            <Badge size="sm">{connections.length}</Badge>
            <Accordion.Actions>
              <IconButton
                label="New Connection"
                size="xs"
                variant="ghost"
                onClick={() => openConnectionForm()}
                className="text-text-muted hover:text-text-primary"
              >
                <Plus size={12} />
              </IconButton>
            </Accordion.Actions>
          </Accordion.Trigger>
          <Accordion.Content>
            <Box className="px-1">
              {connections.length === 0 && (
                <Text size="xs" color="muted" as="p" className="px-2 py-4 text-center">No connections yet</Text>
              )}
              {connections.map((conn) => {
                const isConnected = connectedIds.has(conn.id)
                const isActive = activeConnectionId === conn.id

                return (
                  <ContextMenu key={conn.id} items={getMenuItems(conn)}>
                    <TreeItem
                      label={conn.name}
                      icon={
                        <Box
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: isConnected ? (conn.color ?? 'var(--color-accent)') : 'var(--color-text-disabled)' }}
                        />
                      }
                      selected={isActive}
                      onToggle={() => handleConnect(conn.id)}
                      actions={
                        <>
                          <IconButton
                            label={isConnected ? 'Disconnect' : 'Connect'}
                            size="xs"
                            variant="ghost"
                            onClick={() => isConnected ? disconnect(conn.id) : handleConnect(conn.id)}
                            className={isConnected ? 'text-success hover:text-error' : 'text-text-muted hover:text-success'}
                          >
                            {isConnected ? <Unplug size={12} /> : <PlugZap size={12} />}
                          </IconButton>
                          <IconButton
                            label="Edit"
                            size="xs"
                            variant="ghost"
                            onClick={() => openConnectionForm(conn.id)}
                            className="text-text-muted hover:text-text-primary"
                          >
                            <Pencil size={12} />
                          </IconButton>
                          <DropdownMenu
                            trigger={
                              <IconButton
                                label="More actions"
                                size="xs"
                                variant="ghost"
                                className="text-text-muted hover:text-text-primary"
                              >
                                <MoreHorizontal size={12} />
                              </IconButton>
                            }
                            items={getMenuItems(conn)}
                          />
                        </>
                      }
                    />
                  </ContextMenu>
                )
              })}
            </Box>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion>
      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete "${deleteTarget?.name}"?`}
        message="This connection profile will be permanently removed."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (deleteTarget) deleteConnection(deleteTarget.id)
          setDeleteTarget(null)
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
