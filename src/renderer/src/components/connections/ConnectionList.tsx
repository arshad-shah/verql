import { useEffect, useState } from 'react'
import { Plus, PlugZap, Unplug, Pencil, Trash2 } from 'lucide-react'
import { useConnectionsStore } from '@/stores/connections'
import { useToastStore } from '@/stores/toast'
import { ConnectionForm } from './ConnectionForm'
import type { ConnectionProfile } from '@shared/types'

export function ConnectionList() {
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

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="px-2 py-1">
          <button onClick={() => { setEditing(undefined); setShowForm(true) }}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-md transition-colors">
            <Plus size={14} /> New Connection
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-1">
          {connections.length === 0 && (
            <p className="text-text-muted text-xs px-3 py-6 text-center">No connections yet</p>
          )}
          {connections.map((conn) => {
            const isConnected = connectedIds.has(conn.id)
            const isActive = activeConnectionId === conn.id
            return (
              <div key={conn.id} onClick={() => handleConnect(conn.id)}
                className={`group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${isActive ? 'bg-accent/10 text-accent' : 'hover:bg-white/5 text-text-secondary'}`}>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: isConnected ? (conn.color ?? '#7c6ff7') : '#444' }} />
                <span className="text-sm truncate flex-1">{conn.name}</span>
                <div className="hidden group-hover:flex items-center gap-0.5">
                  {isConnected ? (
                    <button onClick={(e) => { e.stopPropagation(); disconnect(conn.id) }} className="p-1 text-text-muted hover:text-error rounded" title="Disconnect"><Unplug size={12} /></button>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); handleConnect(conn.id) }} className="p-1 text-text-muted hover:text-success rounded" title="Connect"><PlugZap size={12} /></button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); setEditing(conn); setShowForm(true) }} className="p-1 text-text-muted hover:text-text-primary rounded" title="Edit"><Pencil size={12} /></button>
                  <button onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${conn.name}"?`)) deleteConnection(conn.id) }} className="p-1 text-text-muted hover:text-error rounded" title="Delete"><Trash2 size={12} /></button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {showForm && (
        <ConnectionForm initial={editing} onSave={handleSave} onClose={() => { setShowForm(false); setEditing(undefined) }} />
      )}
    </>
  )
}
