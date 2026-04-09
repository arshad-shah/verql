import { useRef, useEffect, useState } from 'react'
import { useSchemaStore } from '@/stores/schema'
import { useConnectionsStore } from '@/stores/connections'
import { SearchInput, Box } from '@/primitives'

export function SearchFilter() {
  const filterText = useSchemaStore((s) => s.filterText)
  const setFilterText = useSchemaStore((s) => s.setFilterText)
  const activeConnectionId = useConnectionsStore((s) => s.activeConnectionId)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const [localValue, setLocalValue] = useState(filterText)

  useEffect(() => {
    setFilterText('')
    setLocalValue('')
  }, [activeConnectionId, setFilterText])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalValue(value)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setFilterText(value), 150)
  }

  const handleClear = () => {
    setFilterText('')
    setLocalValue('')
    inputRef.current?.focus()
  }

  return (
    <Box className="px-2 py-1.5 border-b border-border-default">
      <SearchInput
        ref={inputRef}
        size="sm"
        placeholder="Filter tables, views..."
        value={localValue}
        onChange={handleChange}
        onClear={handleClear}
      />
    </Box>
  )
}
