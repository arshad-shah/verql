import { useState, useEffect, useRef } from 'react'
import { useConnectionsStore } from '@/stores/connections'
import { Search, Plus, Check } from 'lucide-react'
import { cn } from '@/primitives/utils/cn'

const DB_ABBREVIATIONS: Record<string, string> = {
  postgresql: 'PG',
  mysql: 'MY',
  sqlite: 'SL',
  mongodb: 'MG',
  redis: 'RD',
}

const DB_TYPE_COLORS: Record<string, string> = {
  postgresql: 'text-accent',
  mysql: 'text-warning',
  sqlite: 'text-info',
  mongodb: 'text-[#ff8c6b]',
  redis: 'text-error',
}

interface ConnectionSwitcherProps {
  isOpen: boolean
  onClose: () => void
  onNewConnection: () => void
}

export function ConnectionSwitcher({ isOpen, onClose, onNewConnection }: ConnectionSwitcherProps) {
  const { connections, activeConnectionId, connectedIds, setActiveConnection, connect } =
    useConnectionsStore()
  const [filter, setFilter] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setFilter('')
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handleClick)
    }, 0)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('mousedown', handleClick)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const lowerFilter = filter.toLowerCase()
  const filtered = connections.filter(
    (c) =>
      c.name.toLowerCase().includes(lowerFilter) ||
      c.database.toLowerCase().includes(lowerFilter) ||
      (c.host ?? '').toLowerCase().includes(lowerFilter)
  )

  const activeConn = filtered.find((c) => c.id === activeConnectionId)
  const connectedConns = filtered.filter(
    (c) => c.id !== activeConnectionId && connectedIds.has(c.id)
  )
  const savedConns = filtered.filter((c) => !connectedIds.has(c.id))

  const handleSelect = async (id: string) => {
    if (connectedIds.has(id)) {
      setActiveConnection(id)
    } else {
      await connect(id)
    }
    onClose()
  }

  const renderConnection = (c: typeof connections[0], isActive: boolean) => {
    const abbr = DB_ABBREVIATIONS[c.type] ?? c.type.slice(0, 2).toUpperCase()
    const color = DB_TYPE_COLORS[c.type] ?? 'text-text-primary'
    const isLive = connectedIds.has(c.id)

    return (
      <div
        key={c.id}
        role="button"
        tabIndex={0}
        onClick={() => handleSelect(c.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSelect(c.id)
        }}
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer',
          isActive ? 'bg-accent/10 border border-accent/20' : 'hover:bg-hover',
          !isLive && 'opacity-50'
        )}
      >
        <div
          className={cn(
            'h-[7px] w-[7px] shrink-0 rounded-full',
            isLive ? 'bg-success shadow-[0_0_4px_rgba(40,200,64,0.4)]' : 'bg-text-tertiary'
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className={cn('text-[10px] font-semibold', color)}>{abbr}</span>
            <span className="text-[10px] text-text-primary truncate">{c.name}</span>
          </div>
          <div className="text-[9px] text-text-tertiary truncate">
            {c.host ? `${c.host}${c.port ? `:${c.port}` : ''}` : c.database}
          </div>
        </div>
        {isActive && <Check size={10} className="text-accent shrink-0" />}
      </div>
    )
  }

  return (
    <div
      ref={panelRef}
      className={cn(
        'absolute bottom-full left-0 mb-1 w-[260px]',
        'bg-bg-secondary border border-border-default',
        'rounded-t-lg shadow-[0_-4px_20px_rgba(0,0,0,0.5)]',
        'animate-in slide-in-from-bottom-2 duration-150'
      )}
    >
      <div className="p-2 border-b border-border-default">
        <div className="flex items-center gap-1.5 rounded-[5px] border border-border-default bg-bg-tertiary px-2 py-1">
          <Search size={11} className="text-text-tertiary shrink-0" />
          <input
            ref={inputRef}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter connections..."
            className="flex-1 bg-transparent text-[10px] text-text-primary placeholder:text-text-tertiary outline-none"
          />
        </div>
      </div>

      {activeConn && (
        <div className="px-1.5 pt-1">
          <div className="px-1.5 py-1 text-[8px] uppercase tracking-wider text-text-tertiary font-semibold">
            Active
          </div>
          {renderConnection(activeConn, true)}
        </div>
      )}

      {connectedConns.length > 0 && (
        <div className="px-1.5 pt-0.5">
          <div className="px-1.5 py-1 text-[8px] uppercase tracking-wider text-text-tertiary font-semibold">
            Connected
          </div>
          {connectedConns.map((c) => renderConnection(c, false))}
        </div>
      )}

      {savedConns.length > 0 && (
        <div className="px-1.5 pt-0.5 border-t border-white/[0.03]">
          <div className="px-1.5 py-1 text-[8px] uppercase tracking-wider text-text-tertiary font-semibold">
            Saved
          </div>
          {savedConns.map((c) => renderConnection(c, false))}
        </div>
      )}

      <div className="border-t border-border-default p-1.5">
        <button
          onClick={() => {
            onNewConnection()
            onClose()
          }}
          className="flex w-full items-center justify-center gap-1 rounded-md py-1 text-[10px] text-accent hover:bg-hover"
        >
          <Plus size={10} />
          New connection
        </button>
      </div>
    </div>
  )
}
