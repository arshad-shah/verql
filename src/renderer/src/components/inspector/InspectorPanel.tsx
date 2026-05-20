import { useEffect } from 'react'
import { useSelectionStore } from '@/stores/selection'
import { useTabsStore } from '@/stores/tabs'
import { useSchemaStore } from '@/stores/schema'
import { Box, Flex, Stack, Text } from '@/primitives'
import type { QueryTab } from '@shared/types'

export function InspectorPanel() {
  const selection = useSelectionStore(s => s.selection)
  const activeTab = useTabsStore(s => s.tabs.find(t => t.id === s.activeTabId))

  if (selection?.kind === 'row') {
    return (
      <Stack direction="vertical" gap="none" className="p-3">
        {Object.entries(selection.row).map(([key, value]) => {
          const col = selection.columns.find(c => c.name === key)
          return (
            <Box key={key} className="py-2 border-b border-border last:border-b-0">
              <Flex align="baseline" gap="sm">
                <Text size="xs" className="font-mono font-semibold">{key}</Text>
                {col?.dataType && <Text size="xs" color="muted">{col.dataType}</Text>}
              </Flex>
              <Text size="sm" className="font-mono break-words whitespace-pre-wrap">
                {value === null
                  ? 'NULL'
                  : typeof value === 'object'
                    ? JSON.stringify(value)
                    : String(value)}
              </Text>
            </Box>
          )
        })}
      </Stack>
    )
  }

  if (selection?.kind === 'erNode' || selection?.kind === 'table') {
    return <TableSummary connectionId={selection.connectionId} schema={selection.schema} table={selection.table} />
  }

  if (activeTab?.type === 'query') {
    const t = activeTab as QueryTab
    return (
      <Stack direction="vertical" gap="sm" className="p-3">
        {t.results ? (
          <>
            <Stat label="Rows" value={String(t.results.rowCount ?? t.results.rows.length)} />
            <Stat label="Duration" value={`${t.results.duration} ms`} />
            <Stat label="Status" value="OK" />
          </>
        ) : t.error ? (
          <Box>
            <Text size="xs" color="muted">Error</Text>
            <Text size="sm" className="font-mono whitespace-pre-wrap">{t.error}</Text>
          </Box>
        ) : (
          <Text size="sm" color="muted">Run a query to see stats. Click a row to inspect it.</Text>
        )}
      </Stack>
    )
  }

  return (
    <Flex align="center" justify="center" className="h-full p-4">
      <Text color="muted" size="sm">Nothing to inspect for this tab.</Text>
    </Flex>
  )
}

function TableSummary({ connectionId, schema, table }: { connectionId: string; schema?: string; table: string }) {
  const schemaName = schema ?? ''
  const columnsKey = `${connectionId}:${schemaName}:${table}`
  const columns = useSchemaStore(s => s.columns.get(columnsKey) ?? [])
  const fetchColumns = useSchemaStore(s => s.fetchColumns)

  useEffect(() => {
    if (columns.length === 0) {
      void fetchColumns(connectionId, table, schemaName)
    }
  }, [connectionId, table, schemaName, columns.length, fetchColumns])

  return (
    <Stack direction="vertical" gap="sm" className="p-3">
      <Text size="sm" className="font-mono font-semibold">{table}</Text>
      <Box>
        <Text size="xs" color="muted" className="mb-1">Columns</Text>
        {columns.length === 0 ? (
          <Text size="xs" color="muted">Loading…</Text>
        ) : (
          columns.map(c => (
            <Flex key={c.name} align="baseline" gap="sm" className="py-1 border-b border-border last:border-b-0">
              <Text size="xs" className="font-mono font-semibold">{c.name}</Text>
              <Text size="xs" color="muted">{c.dataType}</Text>
              {c.isPrimaryKey && <Text size="xs" color="accent">PK</Text>}
              {c.isForeignKey && <Text size="xs" color="accent">FK</Text>}
            </Flex>
          ))
        )}
      </Box>
    </Stack>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Flex justify="between" align="baseline">
      <Text size="xs" color="muted">{label}</Text>
      <Text size="sm" className="font-mono">{value}</Text>
    </Flex>
  )
}
