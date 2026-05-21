import { useEffect, type ReactNode } from 'react'
import { useSelectionStore } from '@/stores/selection'
import { useTabsStore } from '@/stores/tabs'
import { useSchemaStore } from '@/stores/schema'
import { useConnectionsStore } from '@/stores/connections'
import { Box, Flex, Stack, Text, Divider } from '@/primitives'
import type { QueryTab, FieldInfo } from '@shared/types'

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
    return <QueryInspector tab={activeTab as QueryTab} />
  }

  return (
    <Flex align="center" justify="center" className="h-full p-4">
      <Text color="muted" size="sm">Nothing to inspect for this tab.</Text>
    </Flex>
  )
}

function QueryInspector({ tab }: { tab: QueryTab }) {
  const connection = useConnectionsStore(s =>
    tab.connectionId ? s.connections.find(c => c.id === tab.connectionId) : undefined
  )

  const status: { label: string; tone: 'accent' | 'muted' | 'error' } = tab.isExecuting
    ? { label: 'Executing…', tone: 'accent' }
    : tab.error
      ? { label: 'Error', tone: 'error' }
      : tab.results
        ? { label: 'OK', tone: 'accent' }
        : { label: 'Idle', tone: 'muted' }

  return (
    <Stack direction="vertical" gap="sm" className="p-3">
      <Section title="Status">
        <Stat label="State" value={status.label} valueTone={status.tone} />
        {tab.results && (
          <>
            <Stat label="Rows" value={String(tab.results.rowCount ?? tab.results.rows.length)} />
            <Stat label="Duration" value={`${tab.results.duration} ms`} />
            {tab.results.affectedRows > 0 && (
              <Stat label="Affected" value={String(tab.results.affectedRows)} />
            )}
            <Stat label="Columns" value={String(tab.results.fields.length)} />
          </>
        )}
        {tab.isDirty && <Stat label="Unsaved" value="Yes" valueTone="accent" />}
      </Section>

      <Divider />

      <Section title="Connection">
        <Stat label="Profile" value={connection?.name ?? '—'} />
        {connection?.type && <Stat label="Driver" value={connection.type} />}
        {tab.database && <Stat label="Database" value={tab.database} />}
        {tab.schema && <Stat label="Schema" value={tab.schema} />}
      </Section>

      {tab.error && (
        <>
          <Divider />
          <Section title="Error">
            <Text size="xs" className="font-mono whitespace-pre-wrap break-words">{tab.error}</Text>
          </Section>
        </>
      )}

      {tab.results && tab.results.fields.length > 0 && (
        <>
          <Divider />
          <Section title={`Columns (${tab.results.fields.length})`}>
            <FieldList fields={tab.results.fields} />
          </Section>
        </>
      )}

      {tab.sql.trim() && (
        <>
          <Divider />
          <Section title="SQL">
            <Box className="bg-bg-secondary rounded-sm p-2 max-h-40 overflow-auto">
              <Text size="xs" className="font-mono whitespace-pre-wrap break-words">
                {tab.sql.length > 800 ? tab.sql.slice(0, 800) + '…' : tab.sql}
              </Text>
            </Box>
          </Section>
        </>
      )}

      {tab.results && tab.results.rows.length > 0 && (
        <Text size="xs" color="muted" className="mt-1">
          Click a row in the results to inspect it.
        </Text>
      )}
    </Stack>
  )
}

function FieldList({ fields }: { fields: FieldInfo[] }) {
  return (
    <Stack direction="vertical" gap="none">
      {fields.map(f => (
        <Flex key={f.name} align="baseline" gap="sm" className="py-1 border-b border-border last:border-b-0">
          <Text size="xs" className="font-mono font-semibold truncate">{f.name}</Text>
          <Text size="xs" color="muted" className="ml-auto">{f.dataType}</Text>
          {f.nullable === false && <Text size="xs" color="accent">NOT NULL</Text>}
        </Flex>
      ))}
    </Stack>
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box>
      <Text size="xs" color="muted" className="mb-1 uppercase tracking-wider">{title}</Text>
      <Stack direction="vertical" gap="none">{children}</Stack>
    </Box>
  )
}

function Stat({ label, value, valueTone }: { label: string; value: string; valueTone?: 'accent' | 'muted' | 'error' }) {
  return (
    <Flex justify="between" align="baseline" className="py-0.5">
      <Text size="xs" color="muted">{label}</Text>
      <Text size="sm" className="font-mono truncate ml-2" color={valueTone}>{value}</Text>
    </Flex>
  )
}
