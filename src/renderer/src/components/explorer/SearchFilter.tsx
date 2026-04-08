import { useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { useSchemaStore } from '@/stores/schema'
import { useConnectionsStore } from '@/stores/connections'
import { IconButton, Input, Flex, Box } from '@/primitives'

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
    <Box className="px-2 py-1.5 border-b border-border">
      <Flex align="center" gap="xs" className="bg-bg-tertiary border border-border rounded-md px-2 py-1">
        <Search size={12} className="text-text-muted shrink-0" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Filter tables, views..."
          defaultValue={filterText}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          size="sm"
          className="flex-1 bg-transparent border-0 focus:ring-0 px-0"
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
      </Flex>
    </Box>
  )
}
