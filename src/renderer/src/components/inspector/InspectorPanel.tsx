import { useCallback, useEffect, type ReactNode } from 'react'
import { Copy, Eye, GitBranch } from 'lucide-react'
import { useSelectionStore } from '@/stores/selection'
import { useTabsStore } from '@/stores/tabs'
import { useSchemaStore } from '@/stores/schema'
import { useConnectionsStore } from '@/stores/connections'
import { useToastStore } from '@/stores/toast'
import { initialAutoCommit } from '@/lib/initial-autocommit'
import { Box, Flex, Stack, Text, Divider, Badge, Button, IconButton } from '@/primitives'
import { Tooltip } from '@/primitives/surfaces/Tooltip'
import type { QueryTab, FieldInfo, SchemaColumn } from '@shared/types'
import { IPC_CHANNELS } from '@shared/ipc'
import { useTranslation } from '@/i18n/I18nProvider'

// ─── Value formatting helpers ────────────────────────────────────────────────

/** A display string for a cell value plus whether it represents SQL NULL. */
function formatValue(value: unknown): { display: string; isNull: boolean } {
  if (value === null || value === undefined) return { display: '', isNull: true }
  if (typeof value === 'object') return { display: JSON.stringify(value, null, 2), isNull: false }
  return { display: String(value), isNull: false }
}

/** Render a value as a SQL literal for a generated INSERT statement. */
function toSqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value)
  return `'${text.replace(/'/g, "''")}'`
}

/** Build an `INSERT INTO … VALUES …` statement for a single row. The source
 *  table of an arbitrary result set is unknown, so a placeholder name is used. */
function buildInsert(row: Record<string, unknown>, table = 'table_name'): string {
  const cols = Object.keys(row)
  const values = cols.map((c) => toSqlLiteral(row[c]))
  return `INSERT INTO ${table} (${cols.join(', ')})\nVALUES (${values.join(', ')});`
}

/** Copy text to the clipboard and surface a success/failure toast. */
function useCopyToClipboard() {
  const { t } = useTranslation()
  const addToast = useToastStore((s) => s.addToast)
  return useCallback(
    (text: string, successTitle: string) => {
      navigator.clipboard.writeText(text).then(
        () => addToast({ type: 'success', title: successTitle }),
        () => addToast({ type: 'error', title: t('shell.inspector.copyFailed') })
      )
    },
    [addToast, t]
  )
}

// ─── InspectorPanel ──────────────────────────────────────────────────────────

export function InspectorPanel() {
  const { t } = useTranslation()
  const selection = useSelectionStore((s) => s.selection)
  const activeTab = useTabsStore((s) => s.tabs.find((item) => item.id === s.activeTabId))

  if (selection?.kind === 'row') {
    return <RowInspector row={selection.row} columns={selection.columns} />
  }

  if (selection?.kind === 'erNode' || selection?.kind === 'table') {
    return <TableSummary connectionId={selection.connectionId} schema={selection.schema} table={selection.table} />
  }

  if (activeTab?.type === 'query') {
    return <QueryInspector tab={activeTab as QueryTab} />
  }

  return (
    <Flex align="center" justify="center" className="h-full p-4">
      <Text color="muted" size="sm">{t('shell.inspector.nothingToInspect')}</Text>
    </Flex>
  )
}

// ─── RowInspector ────────────────────────────────────────────────────────────

function RowInspector({
  row,
  columns,
}: {
  row: Record<string, unknown>
  columns: { name: string; dataType: string }[]
}) {
  const { t } = useTranslation()
  const copy = useCopyToClipboard()
  const entries = Object.entries(row)

  return (
    <Stack direction="vertical" gap="none">
      <Flex align="center" justify="between" gap="sm" className="px-3 py-2 border-b border-border sticky top-0 bg-bg-secondary z-10">
        <Text size="xs" color="muted">{t('shell.inspector.fieldsCount', { count: entries.length })}</Text>
        <Flex align="center" gap="xs">
          <Button size="xs" variant="outline" onClick={() => copy(JSON.stringify(row, null, 2), t('shell.inspector.copiedRowJson'))}>
            {t('shell.inspector.copyRowJson')}
          </Button>
          <Button size="xs" variant="outline" onClick={() => copy(buildInsert(row), t('shell.inspector.copiedRowInsert'))}>
            {t('shell.inspector.copyRowInsert')}
          </Button>
        </Flex>
      </Flex>

      <Stack direction="vertical" gap="none" className="p-3">
        {entries.map(([key, value]) => {
          const col = columns.find((c) => c.name === key)
          const { display, isNull } = formatValue(value)
          return (
            <Box key={key} className="group py-2 border-b border-border last:border-b-0">
              <Flex align="center" justify="between" gap="sm">
                <Flex align="baseline" gap="sm" className="min-w-0">
                  <Text size="xs" className="font-mono font-semibold truncate">{key}</Text>
                  {col?.dataType && <Text size="xs" color="muted" className="shrink-0">{col.dataType}</Text>}
                </Flex>
                <Tooltip content={t('shell.inspector.copyValue')} side="left">
                  <IconButton
                    label={t('shell.inspector.copyValue')}
                    size="xs"
                    variant="ghost"
                    className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copy(isNull ? t('shell.inspector.nullValue') : display, t('shell.inspector.copiedValue'))}
                  >
                    <Copy size={11} />
                  </IconButton>
                </Tooltip>
              </Flex>
              {isNull ? (
                <Text size="sm" color="muted" className="italic">{t('shell.inspector.nullValue')}</Text>
              ) : (
                <Text size="sm" className="font-mono break-words whitespace-pre-wrap">{display}</Text>
              )}
            </Box>
          )
        })}
      </Stack>
    </Stack>
  )
}

// ─── QueryInspector ──────────────────────────────────────────────────────────

function QueryInspector({ tab }: { tab: QueryTab }) {
  const { t } = useTranslation()
  const connection = useConnectionsStore((s) =>
    tab.connectionId ? s.connections.find((c) => c.id === tab.connectionId) : undefined
  )

  const status: { label: string; tone: 'accent' | 'muted' | 'error' } = tab.isExecuting
    ? { label: t('shell.inspector.statusExecuting'), tone: 'accent' }
    : tab.error
      ? { label: t('shell.inspector.statusError'), tone: 'error' }
      : tab.results
        ? { label: t('shell.inspector.statusOk'), tone: 'accent' }
        : { label: t('shell.inspector.statusIdle'), tone: 'muted' }

  return (
    <Stack direction="vertical" gap="sm" className="p-3">
      <Section title={t('shell.inspector.sectionStatus')}>
        <Stat label={t('shell.inspector.state')} value={status.label} valueTone={status.tone} />
        {tab.results && (
          <>
            <Stat label={t('shell.inspector.rows')} value={String(tab.results.rowCount ?? tab.results.rows.length)} />
            <Stat label={t('shell.inspector.duration')} value={t('shell.inspector.durationValue', { ms: tab.results.duration })} />
            {tab.results.affectedRows > 0 && (
              <Stat label={t('shell.inspector.affected')} value={String(tab.results.affectedRows)} />
            )}
            <Stat label={t('shell.inspector.columns')} value={String(tab.results.fields.length)} />
          </>
        )}
        {tab.isDirty && <Stat label={t('shell.inspector.unsaved')} value={t('shell.inspector.yes')} valueTone="accent" />}
      </Section>

      <Divider />

      <Section title={t('shell.inspector.sectionConnection')}>
        <Stat label={t('shell.inspector.profile')} value={connection?.name ?? '—'} />
        {connection?.type && <Stat label={t('shell.inspector.driver')} value={connection.type} />}
        {tab.database && <Stat label={t('shell.inspector.database')} value={tab.database} />}
        {tab.schema && <Stat label={t('shell.inspector.schema')} value={tab.schema} />}
      </Section>

      {tab.error && (
        <>
          <Divider />
          <Section title={t('shell.inspector.sectionError')}>
            <Text size="xs" className="font-mono whitespace-pre-wrap break-words">{tab.error}</Text>
          </Section>
        </>
      )}

      {tab.results && tab.results.fields.length > 0 && (
        <>
          <Divider />
          <Section title={t('shell.inspector.sectionColumns', { count: tab.results.fields.length })}>
            <FieldList fields={tab.results.fields} />
          </Section>
        </>
      )}

      {tab.sql.trim() && (
        <>
          <Divider />
          <Section title={t('shell.inspector.sectionSql')}>
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
          {t('shell.inspector.clickRowToInspect')}
        </Text>
      )}
    </Stack>
  )
}

function FieldList({ fields }: { fields: FieldInfo[] }) {
  const { t } = useTranslation()
  return (
    <Stack direction="vertical" gap="none">
      {fields.map((f) => (
        <Flex key={f.name} align="baseline" gap="sm" className="py-1 border-b border-border last:border-b-0">
          <Text size="xs" className="font-mono font-semibold truncate">{f.name}</Text>
          <Text size="xs" color="muted" className="ml-auto">{f.dataType}</Text>
          {f.nullable === false && <Text size="xs" color="accent">{t('shell.inspector.notNull')}</Text>}
        </Flex>
      ))}
    </Stack>
  )
}

// ─── TableSummary ────────────────────────────────────────────────────────────

function formatRowCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`
  return String(count)
}

function TableSummary({ connectionId, schema, table }: { connectionId: string; schema?: string; table: string }) {
  const { t } = useTranslation()
  const copy = useCopyToClipboard()
  const schemaName = schema ?? ''
  const cacheKey = `${connectionId}:${schemaName}:${table}`

  const columns = useSchemaStore((s) => s.columns.get(cacheKey) ?? [])
  const indexes = useSchemaStore((s) => s.indexes.get(cacheKey) ?? [])
  const rowCount = useSchemaStore((s) => s.rowCounts.get(cacheKey))
  const fetchColumns = useSchemaStore((s) => s.fetchColumns)
  const fetchIndexes = useSchemaStore((s) => s.fetchIndexes)
  const fetchRowCount = useSchemaStore((s) => s.fetchRowCount)

  const profile = useConnectionsStore((s) => s.connections.find((c) => c.id === connectionId) ?? null)
  const addQueryTab = useTabsStore((s) => s.addQueryTab)
  const updateTabSql = useTabsStore((s) => s.updateTabSql)
  const openErDiagram = useTabsStore((s) => s.openErDiagram)

  useEffect(() => {
    void fetchColumns(connectionId, table, schemaName)
    void fetchIndexes(connectionId, table, schemaName).catch(() => {})
    void fetchRowCount(connectionId, table, schemaName)
  }, [connectionId, table, schemaName, fetchColumns, fetchIndexes, fetchRowCount])

  const foreignKeys = columns.filter((c) => c.references)
  const loaded = columns.length > 0

  async function viewData() {
    let query: string
    try {
      query = (await window.electronAPI.invoke(IPC_CHANNELS.DB_SAMPLE_QUERY, connectionId, table, schemaName)) as string
    } catch {
      query = `SELECT * FROM ${table} LIMIT 100;`
    }
    const tabId = addQueryTab(connectionId, schemaName, { autoCommit: initialAutoCommit(profile) })
    updateTabSql(tabId, query)
  }

  return (
    <Stack direction="vertical" gap="sm" className="p-3">
      {/* Header */}
      <Flex align="center" justify="between" gap="sm" className="min-w-0">
        <Text size="sm" className="font-mono font-semibold truncate" title={table}>{table}</Text>
        <Tooltip content={t('shell.inspector.copyTableName')} side="left">
          <IconButton
            label={t('shell.inspector.copyTableName')}
            size="xs"
            variant="ghost"
            className="h-5 w-5 shrink-0"
            onClick={() => copy(table, t('shell.inspector.copiedTableName'))}
          >
            <Copy size={11} />
          </IconButton>
        </Tooltip>
      </Flex>

      {/* Quick actions */}
      <Flex align="center" gap="xs">
        <Button size="xs" variant="outline" onClick={viewData} className="gap-1">
          <Eye size={12} /> {t('shell.inspector.viewData')}
        </Button>
        <Button size="xs" variant="outline" onClick={() => openErDiagram(connectionId, schemaName)} className="gap-1">
          <GitBranch size={12} /> {t('shell.inspector.openErDiagram')}
        </Button>
      </Flex>

      {/* Stats */}
      <Section title={t('shell.inspector.sectionStatus')}>
        {rowCount !== undefined && (
          <Stat label={t('shell.inspector.rowCount')} value={formatRowCount(rowCount)} />
        )}
        {loaded && <Stat label={t('shell.inspector.columns')} value={String(columns.length)} />}
      </Section>

      <Divider />

      {/* Columns */}
      <Section title={t('shell.inspector.columnsCount', { count: columns.length })}>
        {!loaded ? (
          <Text size="xs" color="muted">{t('shell.inspector.loading')}</Text>
        ) : (
          <Stack direction="vertical" gap="none">
            {columns.map((c) => (
              <ColumnLine key={c.name} column={c} />
            ))}
          </Stack>
        )}
      </Section>

      {/* Foreign keys */}
      {foreignKeys.length > 0 && (
        <>
          <Divider />
          <Section title={t('shell.inspector.sectionForeignKeys', { count: foreignKeys.length })}>
            <Stack direction="vertical" gap="none">
              {foreignKeys.map((c) => (
                <Flex key={c.name} align="baseline" gap="sm" className="py-1 border-b border-border last:border-b-0 min-w-0">
                  <Text size="xs" className="font-mono font-semibold truncate">{c.name}</Text>
                  <Text size="xs" color="muted" className="shrink-0">→</Text>
                  <Text size="xs" color="accent" className="font-mono truncate">
                    {c.references!.table}.{c.references!.column}
                  </Text>
                </Flex>
              ))}
            </Stack>
          </Section>
        </>
      )}

      {/* Indexes */}
      {loaded && (
        <>
          <Divider />
          <Section title={t('shell.inspector.sectionIndexes', { count: indexes.length })}>
            {indexes.length === 0 ? (
              <Text size="xs" color="muted">{t('shell.inspector.noIndexes')}</Text>
            ) : (
              <Stack direction="vertical" gap="none">
                {indexes.map((idx) => (
                  <Box key={idx.name} className="py-1 border-b border-border last:border-b-0">
                    <Flex align="center" gap="sm" className="min-w-0">
                      <Text size="xs" className="font-mono font-semibold truncate" title={idx.name}>{idx.name}</Text>
                      {idx.unique && <Badge variant="accent" size="sm" className="shrink-0">{t('shell.inspector.unique')}</Badge>}
                    </Flex>
                    <Text size="xs" color="muted" className="font-mono break-words">({idx.columns.join(', ')})</Text>
                  </Box>
                ))}
              </Stack>
            )}
          </Section>
        </>
      )}
    </Stack>
  )
}

function ColumnLine({ column }: { column: SchemaColumn }) {
  const { t } = useTranslation()
  return (
    <Box className="py-1 border-b border-border last:border-b-0">
      <Flex align="baseline" gap="sm" className="min-w-0">
        <Text size="xs" className="font-mono font-semibold truncate" title={column.name}>{column.name}</Text>
        <Text size="xs" color="muted" className="ml-auto shrink-0">{column.dataType}</Text>
        {column.isPrimaryKey && <Badge variant="warning" size="sm" className="shrink-0">{t('shell.inspector.primaryKey')}</Badge>}
        {column.isForeignKey && <Badge variant="info" size="sm" className="shrink-0">{t('shell.inspector.foreignKey')}</Badge>}
      </Flex>
      <Flex align="baseline" gap="sm" className="min-w-0">
        {!column.nullable && <Text size="xs" color="accent">{t('shell.inspector.notNull')}</Text>}
        {column.defaultValue != null && (
          <Text size="xs" color="muted" className="font-mono truncate" title={column.defaultValue}>
            {t('shell.inspector.defaultLabel')}: {column.defaultValue}
          </Text>
        )}
      </Flex>
    </Box>
  )
}

// ─── Shared layout helpers ───────────────────────────────────────────────────

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
