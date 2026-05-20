import { useRef, useEffect, useState } from 'react'
import { useSchemaStore } from '@/stores/schema'
import { useConnectionsStore } from '@/stores/connections'
import { SearchInput, Box } from '@/primitives'

interface SearchFilterProps {
  resultCount?: number
}

export function SearchFilter({ resultCount }: SearchFilterProps) {
  const filterText = useSchemaStore((s) => s.filterText)
  const setFilterText = useSchemaStore((s) => s.setFilterText)
  const activeConnectionId = useConnectionsStore((s) => s.activeConnectionId)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [localValue, setLocalValue] = useState(filterText)

  useEffect(() => {
    setFilterText('')
    setLocalValue('')
  }, [activeConnectionId, setFilterText])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalValue(value)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setFilterText(value), 100)
  }

  const handleClear = () => {
    setFilterText('')
    setLocalValue('')
    inputRef.current?.focus()
  }

  return (
    <Box className="px-2 py-1.5 border-b border-border-default">
      <div className="relative">
        <SearchInput
          ref={inputRef}
          size="sm"
          placeholder="Fuzzy search tables, views…"
          value={localValue}
          onChange={handleChange}
          onClear={handleClear}
        />
        {filterText && resultCount !== undefined && (
          <span
            className="pointer-events-none absolute right-7 top-1/2 -translate-y-1/2 text-[10px] tabular-nums px-1.5 py-0.5 rounded"
            style={{
              background: 'var(--color-bg-elevated)',
              color: 'var(--color-text-tertiary)',
            }}
          >
            {resultCount}
          </span>
        )}
      </div>
    </Box>
  )
}
