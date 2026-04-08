import { useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { useSchemaStore } from '@/stores/schema'
import { useConnectionsStore } from '@/stores/connections'
import { IconButton } from '@/primitives'

export function SearchFilter() {
  const filterText = useSchemaStore((s) => s.filterText)
  const setFilterText = useSchemaStore((s) => s.setFilterText)
  const activeConnectionId = useConnectionsStore((s) => s.activeConnectionId)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  // Clear filter when connection changes
  useEffect(() => {
    setFilterText('')
  }, [activeConnectionId, setFilterText])

  const handleChange = (value: string) => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setFilterText(value), 150)
  }

  const handleClear = () => {
    setFilterText('')
    if (inputRef.current) inputRef.current.value = ''
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') handleClear()
  }

  return (
    <div className="px-2 py-1.5 border-b border-border">
      <div className="flex items-center gap-1.5 bg-bg-tertiary border border-border rounded-md px-2 py-1">
        <Search size={12} className="text-text-muted shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Filter tables, views..."
          defaultValue={filterText}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-xs text-text-primary placeholder-text-muted outline-none"
        />
        {filterText && (
          <IconButton
            label="Clear filter"
            size="xs"
            variant="ghost"
            onClick={handleClear}
            className="shrink-0 h-4 w-4 text-text-muted hover:text-text-primary"
          >
            <X size={12} />
          </IconButton>
        )}
      </div>
    </div>
  )
}
