import { useState, useEffect, useRef, useMemo } from 'react'
import { Search } from 'lucide-react'
import { useConnectionsStore } from '@/stores/connections'
import { useTabsStore } from '@/stores/tabs'
import { useUiStore } from '@/stores/ui'

interface Command {
  id: string
  title: string
  category?: string
  keybinding?: string
  action: () => void
}

interface Props {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const { activeConnectionId, connections, connectedIds } = useConnectionsStore()
  const { addQueryTab, openErDiagram } = useTabsStore()
  const { setActivePanel } = useUiStore()

  const conn = connections.find(c => c.id === activeConnectionId)
  const isConnected = activeConnectionId && connectedIds.has(activeConnectionId)

  const commands = useMemo<Command[]>(() => {
    const cmds: Command[] = [
      { id: 'new-query', title: 'New Query Tab', category: 'Query', keybinding: 'Cmd+N', action: () => addQueryTab(activeConnectionId) },
      { id: 'explorer', title: 'Show Explorer', category: 'View', action: () => setActivePanel('explorer') },
      { id: 'show-schema', title: 'Show Schema', category: 'View', action: () => setActivePanel('schema') },
      { id: 'show-extensions', title: 'Show Extensions', category: 'View', action: () => setActivePanel('extensions') },
    ]
    if (isConnected && conn) {
      const schema = conn.type === 'sqlite' ? 'main' : conn.type === 'mysql' ? conn.database : 'public'
      cmds.push({ id: 'er-diagram', title: 'Open ER Diagram', category: 'Schema', action: () => openErDiagram(activeConnectionId!, schema) })
    }
    return cmds
  }, [activeConnectionId, isConnected, conn])

  const filtered = useMemo(() => {
    if (!query.trim()) return commands
    const q = query.toLowerCase()
    return commands.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q)
    )
  }, [query, commands])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action()
        onClose()
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 z-50 w-[520px] bg-bg-secondary border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Search size={16} className="text-text-muted shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <p className="text-text-muted text-xs px-4 py-3 text-center">No matching commands</p>
          )}
          {filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              onClick={() => { cmd.action(); onClose() }}
              className={`w-full flex items-center justify-between px-4 py-2 text-left transition-colors ${
                i === selectedIndex ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                {cmd.category && <span className="text-[10px] text-text-muted uppercase">{cmd.category}</span>}
                <span className="text-xs">{cmd.title}</span>
              </div>
              {cmd.keybinding && (
                <span className="text-[10px] text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded">{cmd.keybinding}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
