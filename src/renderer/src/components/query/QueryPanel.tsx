import { useCallback } from 'react'
import { QueryEditor } from './QueryEditor'
import { QueryToolbar } from './QueryToolbar'
import { ConnectionSelector } from './ConnectionSelector'
import { ResultsPanel } from '@/components/results/ResultsPanel'
import { useTabsStore } from '@/stores/tabs'
import { useConnectionsStore } from '@/stores/connections'
import type { QueryTab } from '@shared/types'

interface Props {
  tab: QueryTab
}

export function QueryPanel({ tab }: Props) {
  const { updateTabSql, setTabExecuting, setTabResults, setTabError } = useTabsStore()
  const connections = useConnectionsStore(s => s.connections)
  const dbType = tab.connectionId ? connections.find(c => c.id === tab.connectionId)?.type : undefined

  const executeWithSchema = useCallback(async (sql: string) => {
    if (!tab.connectionId) return
    // Set search_path/USE before executing if schema is selected
    if (tab.schema) {
      try {
        await window.electronAPI.invoke('db:set-schema', tab.connectionId, tab.schema)
      } catch {
        // ignore — some adapters don't support setSchema
      }
    }
    return window.electronAPI.invoke('db:query', tab.connectionId, sql)
  }, [tab.connectionId, tab.schema])

  const handleExecute = useCallback(async () => {
    if (!tab.connectionId || !tab.sql.trim()) return
    setTabExecuting(tab.id, true)
    try {
      const result = await executeWithSchema(tab.sql)
      if (result) setTabResults(tab.id, result)
    } catch (err) {
      setTabError(tab.id, (err as Error).message)
    }
  }, [tab.id, tab.connectionId, tab.sql, tab.schema, executeWithSchema, setTabExecuting, setTabResults, setTabError])

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
    <div className="flex flex-col h-full">
      {/* Connection + schema selector + toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-bg-secondary shrink-0">
        <ConnectionSelector tabId={tab.id} connectionId={tab.connectionId} schema={tab.schema} />
        <div className="w-px h-4 bg-border" />
        <QueryToolbar
          onExecute={handleExecute}
          onCancel={handleCancel}
          onExplain={handleExplain}
          isExecuting={tab.isExecuting}
          duration={tab.results?.duration ?? null}
          rowCount={tab.results?.rowCount ?? null}
          error={tab.error}
        />
      </div>

      {/* Editor — top half */}
      <div className="flex-1 min-h-30 border-b border-border">
        <QueryEditor
          value={tab.sql}
          onChange={(sql) => updateTabSql(tab.id, sql)}
          onExecute={handleExecute}
          connectionId={tab.connectionId}
          schema={tab.schema}
          databaseType={dbType}
        />
      </div>

      {/* Results — bottom half */}
      <div className="flex-1 min-h-25 flex flex-col">
        {tab.results ? (
          <ResultsPanel results={tab.results} />
        ) : tab.error ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="bg-error/5 border border-error/20 rounded-lg p-4 max-w-lg">
              <p className="text-error text-sm font-medium mb-1">Query Error</p>
              <p className="text-text-secondary text-xs font-mono whitespace-pre-wrap">{tab.error}</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
            {!tab.connectionId
              ? 'Select a connection above to start querying'
              : 'Run a query to see results (Cmd+Enter)'}
          </div>
        )}
      </div>
    </div>
  )
}
