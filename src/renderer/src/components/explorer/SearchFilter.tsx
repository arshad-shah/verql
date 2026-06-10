import { useRef, useEffect, useState } from 'react'
import { useSchemaStore } from '@/stores/schema'
import { useConnectionsStore } from '@/stores/connections'
import { Box } from '@arshad-shah/cynosure-react/box'
import { SearchInput } from '@arshad-shah/cynosure-react/search-input'
import { useDataNouns } from '@/hooks/useDataNouns'
import { useTranslation } from '@/i18n/I18nProvider'

interface SearchFilterProps {
  resultCount?: number
}

export function SearchFilter({ resultCount }: SearchFilterProps) {
  const { t } = useTranslation()
  const filterText = useSchemaStore((s) => s.filterText)
  const setFilterText = useSchemaStore((s) => s.setFilterText)
  const activeConnectionId = useConnectionsStore((s) => s.activeConnectionId)
  const nouns = useDataNouns(activeConnectionId)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [localValue, setLocalValue] = useState(filterText)

  useEffect(() => {
    setFilterText('')
    setLocalValue('')
  }, [activeConnectionId, setFilterText])

  const handleChange = (value: string) => {
    setLocalValue(value)
    clearTimeout(timerRef.current)
    if (value === '') {
      // Built-in clear (and manual emptying) applies immediately and keeps focus.
      setFilterText('')
      inputRef.current?.focus()
      return
    }
    timerRef.current = setTimeout(() => setFilterText(value), 100)
  }

  return (
    <Box className="px-2 py-1.5 border-b border-border-default">
      <div className="relative">
        <SearchInput
          ref={inputRef}
          size="sm"
          placeholder={t('explorer.search.placeholder', { objects: nouns.object.many })}
          value={localValue}
          onChange={handleChange}
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
