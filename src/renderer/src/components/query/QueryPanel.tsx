import { useCallback } from 'react'
import { QueryEditor } from './QueryEditor'
import { QueryToolbar } from './QueryToolbar'
import { ConnectionSelector } from './ConnectionSelector'
import { ResultsPanel } from '@/components/results/ResultsPanel'
import { NLInputBar } from '@/components/ai/NLInputBar'
import { useTabsStore } from '@/stores/tabs'
import { useConnectionsStore } from '@/stores/connections'
import { useNotificationsStore } from '@/stores/notifications'
import { useSettingsStore } from '@/stores/settings'
import { useSchemaStore } from '@/stores/schema'
import type { QueryTab } from '@shared/types'
import { Flex, Divider, Text, Box, Alert } from '@/primitives'

interface Props {
  tab: QueryTab
}

const DDL_PATTERN = /(^|;)\s*(CREATE|ALTER|DROP|TRUNCATE|RENAME|COMMENT|GRANT|REVOKE)\b/i
const DESTRUCTIVE_PATTERN = /(^|;)\s*(DELETE|DROP|TRUNCATE)\b/i
const UPDATE_NO_WHERE_PATTERN = /(^|;)\s*UPDATE\b(?![\s\S]*\bWHERE\b)/i

function stripSqlNoise(sql: string): string {
  return sql
    .replace(/--[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
}

function isSchemaMutatingSql(sql: string): boolean {
  return DDL_PATTERN.test(stripSqlNoise(sql))
}

function destructiveReason(sql: string): string | null {
  const clean = stripSqlNoise(sql)
  if (DESTRUCTIVE_PATTERN.test(clean)) return 'This query contains DELETE, DROP, or TRUNCATE.'
  if (UPDATE_NO_WHERE_PATTERN.test(clean)) return 'This UPDATE has no WHERE clause — every row will be affected.'
  return null
}

export function QueryPanel({ tab }: Props) {
  const { updateTabSql, setTabDirty, setTabExecuting, setTabResults, setTabError } = useTabsStore()
  const connections = useConnectionsStore(s => s.connections)
  const addNotification = useNotificationsStore(s => s.addNotification)
  const queryTimeout = useSettingsStore(s => s.settings.general.queryTimeout)
  const confirmDestructive = useSettingsStore(s => s.settings.general.confirmDestructiveQueries)
  const dbType = tab.connectionId ? connections.find(c => c.id === tab.connectionId)?.type : undefined

  const executeWithSchema = useCallback(async (sql: string) => {
    if (!tab.connectionId) return
    // Set database context before executing if selected
    if (tab.database) {
      try {
        await window.electronAPI.invoke('db:switch-database', tab.connectionId, tab.database)
      } catch {
        // ignore — some adapters don't support switchDatabase
      }
    }
    // Set search_path/USE before executing if schema is selected
    if (tab.schema) {
      try {
        await window.electronAPI.invoke('db:set-schema', tab.connectionId, tab.schema)
      } catch {
        // ignore — some adapters don't support setSchema
      }
    }
    return window.electronAPI.invoke('db:query', tab.connectionId, sql)
  }, [tab.connectionId, tab.database, tab.schema])

  const handleExecute = useCallback(async () => {
    if (!tab.connectionId || !tab.sql.trim()) return
    if (confirmDestructive) {
      const reason = destructiveReason(tab.sql)
      if (reason && !window.confirm(`${reason}\n\nRun anyway?`)) return
    }
    setTabExecuting(tab.id, true)
    try {
      const timeoutMs = queryTimeout * 1000
      const queryPromise = executeWithSchema(tab.sql)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Query timed out after ${queryTimeout}s`)), timeoutMs)
      )
      const result = await Promise.race([queryPromise, timeoutPromise])
      if (result) setTabResults(tab.id, result)
      if (isSchemaMutatingSql(tab.sql) && tab.connectionId) {
        useSchemaStore.getState().clearCache(tab.connectionId)
      }
    } catch (err) {
      const message = (err as Error).message
      setTabError(tab.id, message)
      addNotification({
        type: 'error',
        title: 'Query failed',
        message,
        source: { type: 'tab', id: tab.id, label: tab.title },
      })
      // Cancel the running query on timeout
      if (message.includes('timed out') && tab.connectionId) {
        window.electronAPI.invoke('db:cancel-query', tab.connectionId).catch(() => {})
      }
    }
  }, [tab.id, tab.connectionId, tab.sql, tab.schema, tab.title, queryTimeout, confirmDestructive, executeWithSchema, setTabExecuting, setTabResults, setTabError, addNotification])

  const handleCancel = useCallback(async () => {
    if (!tab.connectionId) return
    try {
      await window.electronAPI.invoke('db:cancel-query', tab.connectionId)
    } catch {
      // ignore cancel errors
    }
    setTabExecuting(tab.id, false)
  }, [tab.id, tab.connectionId, setTabExecuting])

  const handleExplain = useCallback(async () => {
    if (!tab.connectionId || !tab.sql.trim()) return
    setTabExecuting(tab.id, true)
    try {
      const result = await executeWithSchema(`EXPLAIN ANALYZE ${tab.sql}`)
      if (result) setTabResults(tab.id, result)
    } catch (err) {
      setTabError(tab.id, (err as Error).message)
    }
  }, [tab.id, tab.connectionId, tab.sql, tab.schema, executeWithSchema, setTabExecuting, setTabResults, setTabError])

  return (
    <Flex direction="column" className="h-full">
      {/* Connection + schema selector + toolbar */}
      <Flex direction="row" align="center" gap="sm" className="px-3 py-1.5 border-b border-border bg-bg-secondary shrink-0">
        <ConnectionSelector tabId={tab.id} connectionId={tab.connectionId} database={tab.database} schema={tab.schema} />
        <Divider orientation="vertical" className="h-4" />
        <QueryToolbar
          onExecute={handleExecute}
          onCancel={handleCancel}
          onExplain={handleExplain}
          isExecuting={tab.isExecuting}
          connectionType={dbType}
        />
      </Flex>

      {/* NL-to-SQL input bar */}
      <NLInputBar
        connectionId={tab.connectionId}
        schema={tab.schema}
        onSqlGenerated={(sql) => { updateTabSql(tab.id, sql); setTabDirty(tab.id, true) }}
      />

      {/* Editor — top half */}
      <Box className="flex-1 min-h-30 border-b border-border">
        <QueryEditor
          value={tab.sql}
          onChange={(sql) => { updateTabSql(tab.id, sql); setTabDirty(tab.id, true) }}
          onExecute={handleExecute}
          connectionId={tab.connectionId}
          schema={tab.schema}
          databaseType={dbType}
        />
      </Box>

      {/* Results — bottom half */}
      <Flex direction="column" className="flex-1 min-h-25">
        {tab.results ? (
          <ResultsPanel results={tab.results} sql={tab.sql} tabId={tab.id} aiExplanation={tab.aiExplanation} />
        ) : tab.error ? (
          <Flex align="center" justify="center" className="flex-1 p-4">
            <Alert variant="error" title="Query Error" className="max-w-lg">
              <Text size="xs" color="secondary" as="p" className="font-mono whitespace-pre-wrap">{tab.error}</Text>
            </Alert>
          </Flex>
        ) : (
          <Flex align="center" justify="center" className="flex-1">
            <Text size="sm" color="muted">
              {!tab.connectionId
                ? 'Select a connection above to start querying'
                : 'Run a query to see results (Cmd+Enter)'}
            </Text>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
