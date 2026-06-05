import { useCallback, useEffect, useRef, useState } from 'react'
import { QueryEditor } from './QueryEditor'
import { QueryToolbar } from './QueryToolbar'
import { TransactionToolbar } from './TransactionToolbar'
import { ConnectionSelector } from './ConnectionSelector'
import { PluginSlot } from '@/components/plugins/PluginSlot'
import { saveQuery } from '@/components/saved-queries/SavedQueriesPanel'
import { editorRegistry } from '@/stores/editor'
import { tabActions } from '@/stores/tab-actions'
import { parseDbError } from '@/lib/db-error'
import { notifyError } from '@/lib/notify-error'
import { useTabsStore } from '@/stores/tabs'
import { useUiStore } from '@/stores/ui'
import { useToastStore } from '@/stores/toast'
import { useConnectionsStore } from '@/stores/connections'
import { useSettingsStore } from '@/stores/settings'
import { useQueryHistoryStore } from '@/stores/query-history'
import { useSchemaStore } from '@/stores/schema'
import { useDriverCapabilitiesStore } from '@/stores/driver-capabilities'
import type { QueryTab } from '@shared/types'
import { Flex, Divider, Box, Modal, Input, Button } from '@/primitives'
import { IPC_CHANNELS } from '@shared/ipc'

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
  const { updateTabSql, setTabExecuting, setTabResults, setTabError, markTabSaved,
    setTabAutoCommit, setTabTxnStatus, setTabIsolation, setTabReadOnly } = useTabsStore()
  const connections = useConnectionsStore(s => s.connections)
  const queryTimeout = useSettingsStore(s => s.settings.general.queryTimeout)
  const confirmDestructive = useSettingsStore(s => s.settings.general.confirmDestructiveQueries)
  const dbType = tab.connectionId ? connections.find(c => c.id === tab.connectionId)?.type : undefined

  // Capabilities: resolve + ensure fetched for this driver type
  const fetchCaps = useDriverCapabilitiesStore(s => s.fetch)
  const caps = useDriverCapabilitiesStore(s =>
    dbType ? s.resolveCapabilities(tab.connectionId, dbType) : null
  )
  useEffect(() => {
    if (dbType) fetchCaps(dbType).catch(() => {})
  }, [dbType, fetchCaps])

  const executeWithSchema = useCallback(async (sql: string, txnOpts?: { sessionId?: string }) => {
    if (!tab.connectionId) return
    // Set database context before executing if selected
    if (tab.database) {
      try {
        await window.electronAPI.invoke(IPC_CHANNELS.DB_SWITCH_DATABASE, tab.connectionId, tab.database)
      } catch {
        // ignore — some adapters don't support switchDatabase
      }
    }
    // Set search_path/USE before executing if schema is selected
    if (tab.schema) {
      try {
        await window.electronAPI.invoke(IPC_CHANNELS.DB_SET_SCHEMA, tab.connectionId, tab.schema)
      } catch {
        // ignore — some adapters don't support setSchema
      }
    }
    return window.electronAPI.invoke(IPC_CHANNELS.DB_QUERY, tab.connectionId, sql, undefined, txnOpts)
  }, [tab.connectionId, tab.database, tab.schema])

  /**
   * Runs SQL. If `override` is provided we use it verbatim (CodeLens "▶ Run"
   * for a single statement, palette "Run Selection", etc.). Otherwise we
   * prefer the user's visual selection in the editor — IDE-style "run only
   * the highlighted text" — falling back to the whole buffer.
   */
  const runSql = useCallback(async (override?: string) => {
    if (!tab.connectionId) return
    const selected = override?.trim() || editorRegistry.getSelectedSql()
    const sql = (selected || tab.sql).trim()
    if (!sql) return
    if (confirmDestructive) {
      const reason = destructiveReason(sql)
      if (reason && !window.confirm(`${reason}\n\nRun anyway?`)) return
    }
    // Only single-statement runs (e.g. statement gutter) carry an override.
    // We record per-statement status only in that case — multi-statement runs
    // from Cmd+Enter don't have a single hash.
    const singleStmt = override?.trim() || null

    setTabExecuting(tab.id, true)
    const startedAt = performance.now()
    try {
      const timeoutMs = queryTimeout * 1000
      // Transactional queries are routed through a per-tab session so they
      // participate in an explicit transaction (with isolation level + read-only
      // applied via an explicit BEGIN). The session is opened lazily here on the
      // first query rather than on toggle, so tabs that START with auto-commit
      // off (connection profile default) still get a session before their first
      // statement — previously such tabs would send sessionId with no open
      // session, causing the adapter to throw "No open session".
      //
      // DEFERRED: switching a tab's connection while a transaction is open does
      // not release the old session. The next query will throw a legible "No
      // open session" from the old connection's adapter. Tracked as a follow-up.
      //
      // DEFERRED (I2): a tab whose remembered `database` differs from the freshly-
      // connected pool's default can throw "No open session" on its FIRST
      // transactional query because the per-query DB switch (DB_SWITCH_DATABASE)
      // rebuilds the pool and clears sessions; it self-corrects on retry.
      // Tracked as a follow-up.
      const useSession = !!(tab.txn && !tab.txn.autoCommit && tab.connectionId)
      if (useSession) {
        // db:session:open is idempotent (no-op if already open) — safe to call every time.
        await window.electronAPI.invoke(IPC_CHANNELS.DB_SESSION_OPEN, tab.connectionId!, tab.id, { autoCommit: false })
        if (tab.txn!.status !== 'active') {
          // Explicit BEGIN applies isolation level + read-only so those settings
          // actually reach the database. The implicit BEGIN used previously
          // silently ignored both. Status is set BEFORE the query so that a
          // query timeout/error leaves status as 'active' (the server txn IS
          // open), rather than leaving it as 'none' which is incorrect.
          await window.electronAPI.invoke(IPC_CHANNELS.DB_TXN_BEGIN, tab.connectionId!, tab.id, {
            isolationLevel: tab.txn!.isolationLevel,
            readOnly: tab.txn!.readOnly,
          })
          setTabTxnStatus(tab.id, 'active')
        }
      }
      const txnOpts = useSession ? { sessionId: tab.id } : undefined
      const queryPromise = executeWithSchema(sql, txnOpts)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Query timed out after ${queryTimeout}s`)), timeoutMs)
      )
      const result = await Promise.race([queryPromise, timeoutPromise])
      if (result) setTabResults(tab.id, result)
      useQueryHistoryStore.getState().record({
        sql,
        connectionId: tab.connectionId ?? undefined,
        connectionType: dbType,
        status: 'ok',
        durationMs: Math.round(performance.now() - startedAt),
        rowCount: result?.rowCount ?? undefined,
      })
      if (isSchemaMutatingSql(sql) && tab.connectionId) {
        useSchemaStore.getState().clearCache(tab.connectionId)
      }
      if (singleStmt) {
        tabActions.recordRunResult(tab.id, singleStmt, {
          kind: 'ok',
          durationMs: Math.round(performance.now() - startedAt),
          rowCount: result?.rowCount ?? null,
        })
      }
    } catch (err) {
      const durationMs = Math.round(performance.now() - startedAt)
      if (singleStmt) {
        tabActions.recordRunResult(tab.id, singleStmt, { kind: 'error', durationMs, rowCount: null })
      }
      const raw = (err as Error).message
      useQueryHistoryStore.getState().record({
        sql,
        connectionId: tab.connectionId ?? undefined,
        connectionType: dbType,
        status: 'error',
        durationMs,
        error: raw,
      })
      const parsed = parseDbError(raw)
      // Tab stores the raw text so the QueryErrorView can re-parse and show
      // both the friendly summary and the original driver message — keeps
      // classification logic in one place.
      setTabError(tab.id, raw)
      // Toast + persistent notification share the same parsed text. The bell
      // tray gets the tab as the source so the user can jump back to it.
      notifyError(raw, {
        source: { type: 'tab', id: tab.id, label: tab.title },
      })
      // Cancel the running query on timeout (use the parsed code, not the
      // raw text, so driver locale/wording changes don't break this).
      if (parsed.code === 'TIMEOUT' && tab.connectionId) {
        window.electronAPI.invoke(IPC_CHANNELS.DB_CANCEL_QUERY, tab.connectionId).catch(() => {})
      }
    }
  }, [tab.id, tab.connectionId, tab.sql, tab.schema, tab.title, tab.txn, dbType, queryTimeout, confirmDestructive, executeWithSchema, setTabExecuting, setTabResults, setTabError, setTabTxnStatus])

  const handleExecute = useCallback(() => runSql(), [runSql])

  const handleCancel = useCallback(async () => {
    if (!tab.connectionId) return
    try {
      await window.electronAPI.invoke(IPC_CHANNELS.DB_CANCEL_QUERY, tab.connectionId)
    } catch {
      // ignore cancel errors
    }
    setTabExecuting(tab.id, false)
  }, [tab.id, tab.connectionId, setTabExecuting])

  // Transaction handlers — open/close sessions and commit/rollback.
  // All three handlers are wrapped in try/catch so IPC failures surface as
  // toasts + bell notifications (via notifyError) rather than silently failing.
  const onToggleAutoCommit = useCallback(async (enabled: boolean) => {
    if (!tab.connectionId) return
    try {
      if (enabled) {
        // Turning auto-commit ON: commit any open txn to avoid leaving the server
        // in a dangling transaction, then release the session. Opening a new
        // session is deferred lazily to the next query (see runSql prelude).
        if (tab.txn?.status === 'active') {
          await window.electronAPI.invoke(IPC_CHANNELS.DB_TXN_COMMIT, tab.connectionId, tab.id)
        }
        // DB_SESSION_CLOSE is a tolerant no-op when no session is open, so this
        // is safe even if the user toggles OFF then immediately back ON without
        // ever running a query (i.e. no session was ever opened).
        await window.electronAPI.invoke(IPC_CHANNELS.DB_SESSION_CLOSE, tab.connectionId, tab.id)
        setTabTxnStatus(tab.id, 'none')
      }
      // Turning OFF is lazy — no IPC here; the session opens on the next query.
      setTabAutoCommit(tab.id, enabled)
    } catch (err) {
      notifyError(err, {
        source: { type: 'tab', id: tab.id, label: tab.title },
      })
    }
  }, [tab.connectionId, tab.id, tab.title, tab.txn?.status, setTabAutoCommit, setTabTxnStatus])

  // Raw: performs the IPC + status reset and PROPAGATES errors (re-throws).
  // Used by the close-guard (App.tsx) so a failed commit/rollback keeps the
  // dialog open and does NOT close the tab, preventing an orphaned server txn.
  const doCommit = useCallback(async () => {
    if (!tab.connectionId) return
    await window.electronAPI.invoke(IPC_CHANNELS.DB_TXN_COMMIT, tab.connectionId, tab.id)
    setTabTxnStatus(tab.id, 'none')
  }, [tab.connectionId, tab.id, setTabTxnStatus])

  const doRollback = useCallback(async () => {
    if (!tab.connectionId) return
    await window.electronAPI.invoke(IPC_CHANNELS.DB_TXN_ROLLBACK, tab.connectionId, tab.id)
    setTabTxnStatus(tab.id, 'none')
  }, [tab.connectionId, tab.id, setTabTxnStatus])

  // Toolbar handlers: wrap raw ops with the error notifier (swallow for inline use).
  const onCommit = useCallback(async () => {
    try { await doCommit() } catch (err) {
      notifyError(err, { source: { type: 'tab', id: tab.id, label: tab.title } })
    }
  }, [doCommit, tab.id, tab.title])

  const onRollback = useCallback(async () => {
    try { await doRollback() } catch (err) {
      notifyError(err, { source: { type: 'tab', id: tab.id, label: tab.title } })
    }
  }, [doRollback, tab.id, tab.title])

  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [saveDialogName, setSaveDialogName] = useState('')
  const pendingSqlRef = useRef<string>('')

  const handleSave = useCallback(() => {
    // Read the latest tab state directly — closures captured by event listeners
    // would otherwise see stale `tab.savedQueryId`/`tab.sql` and re-prompt or
    // save the wrong content if the user typed quickly between renders.
    const current = useTabsStore.getState().tabs.find(t => t.id === tab.id)
    if (!current || current.type !== 'query') return
    const sql = current.sql.trim()
    if (!sql) {
      useToastStore.getState().addToast({ type: 'info', title: 'Nothing to save', message: 'Editor is empty' })
      return
    }
    if (current.savedQueryId) {
      saveQuery({ id: current.savedQueryId, name: current.title, sql, connectionType: dbType })
      markTabSaved(current.id)
      useToastStore.getState().addToast({ type: 'success', title: 'Saved', message: current.title })
      return
    }
    // First-time save: open the in-app prompt (window.prompt is unsupported in
    // Electron's renderer and throws).
    pendingSqlRef.current = sql
    setSaveDialogName(current.title?.trim() || `Query ${new Date().toLocaleString()}`)
    setSaveDialogOpen(true)
  }, [tab.id, dbType, markTabSaved])

  const confirmSaveDialog = useCallback(() => {
    const name = saveDialogName.trim()
    const sql = pendingSqlRef.current
    if (!name || !sql) {
      setSaveDialogOpen(false)
      return
    }
    const id = saveQuery({ name, sql, connectionType: dbType })
    markTabSaved(tab.id, { title: name, savedQueryId: id })
    useToastStore.getState().addToast({ type: 'success', title: 'Query saved', message: name })
    setSaveDialogOpen(false)
  }, [saveDialogName, dbType, markTabSaved, tab.id])

  const explainSql = useCallback(async (sqlOverride?: string) => {
    if (!tab.connectionId) return
    const sql = (sqlOverride?.trim() || editorRegistry.getSelectedSql() || tab.sql).trim()
    if (!sql) return
    setTabExecuting(tab.id, true)
    try {
      const result = await executeWithSchema(`EXPLAIN ANALYZE ${sql}`)
      if (result) {
        setTabResults(tab.id, result)
        // The user asked for an EXPLAIN — route them to the plan view instead
        // of leaving them on the raw-rows Results tab. The BottomDock only
        // surfaces the "Query Plan" tab once the parser sees plan content,
        // which matches the output we just produced.
        useUiStore.getState().setBottomDockActivePanel('query-plan')
      }
    } catch (err) {
      setTabError(tab.id, (err as Error).message)
    }
  }, [tab.id, tab.connectionId, tab.sql, tab.schema, executeWithSchema, setTabExecuting, setTabResults, setTabError])

  const handleExplain = useCallback(() => explainSql(), [explainSql])

  // Publish this tab's save + dirty + lens + txn handlers to the registry. The global
  // Cmd/Ctrl+S handler in App.tsx pulls the active tab's handler from here,
  // and the CodeLens dispatcher routes run/explain through tabActions so the
  // editor library stays decoupled from React.
  // txnStatus reads from the store directly (not from the `tab` prop closure)
  // so it reflects the latest transaction state even if this effect doesn't re-run.
  useEffect(() => {
    tabActions.register(tab.id, {
      onSave: handleSave,
      isDirty: () => {
        const t = useTabsStore.getState().tabs.find((t) => t.id === tab.id)
        return t?.type === 'query' && t.isDirty
      },
      label: tab.title,
      runStatement: (sql) => { void runSql(sql) },
      explainStatement: (sql) => { void explainSql(sql) },
      txnStatus: () => {
        const t = useTabsStore.getState().tabs.find((t) => t.id === tab.id)
        return (t?.type === 'query' ? t.txn?.status : undefined) ?? 'none'
      },
      // Raw throwing variants: the close-guard in App.tsx uses these so a
      // failed commit/rollback propagates the error and keeps the dialog open.
      commitTransaction: doCommit,
      rollbackTransaction: doRollback,
    })
    return () => tabActions.unregister(tab.id)
  }, [tab.id, tab.title, handleSave, runSql, explainSql, doCommit, doRollback])

  return (
    <Flex direction="column" className="h-full">
      {/* Connection + schema selector + toolbar */}
      <Flex direction="column" className="border-b border-border bg-bg-secondary shrink-0">
        <Flex direction="row" align="center" gap="sm" className="px-3 py-1.5">
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
        {/* Transaction toolbar — only shown when driver reports session capabilities.
            TransactionToolbar self-hides when caps.autoCommit and caps.manualTransactions
            are both absent, but we skip the wrapper row entirely to avoid an empty strip. */}
        {caps?.session && (
          <Flex direction="row" align="center" gap="sm" className="px-3 pb-1.5 flex-wrap">
            <TransactionToolbar
              caps={caps.session}
              txn={tab.txn ?? { autoCommit: true, status: 'none', readOnly: false }}
              onToggleAutoCommit={onToggleAutoCommit}
              onCommit={onCommit}
              onRollback={onRollback}
              onIsolationChange={(lvl) => setTabIsolation(tab.id, lvl)}
              onReadOnlyChange={(ro) => setTabReadOnly(tab.id, ro)}
            />
          </Flex>
        )}
      </Flex>

      {/* Plugin-contributed surfaces (e.g. AI NL-to-SQL bar). Nothing renders
          when no plugin contributes here. */}
      <PluginSlot
        id="query.editor.top"
        context={{
          connectionId: tab.connectionId,
          schema: tab.schema,
          onSqlGenerated: (sql: string) => { updateTabSql(tab.id, sql) }
        }}
      />

      <Modal open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <form
          onSubmit={(e) => { e.preventDefault(); confirmSaveDialog() }}
          className="p-4 flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1">
            <div className="text-sm font-medium">Save query</div>
            <div className="text-xs text-text-tertiary">
              Give this query a name to find it again in the Saved panel.
            </div>
          </div>
          <Input
            autoFocus
            value={saveDialogName}
            onChange={(e) => setSaveDialogName(e.target.value)}
            placeholder="Query name"
            onKeyDown={(e) => {
              if (e.key === 'Escape') setSaveDialogOpen(false)
            }}
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="solid" size="sm" disabled={!saveDialogName.trim()}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      {/* Editor */}
      <Box className="flex-1 min-h-30">
        <QueryEditor
          tabId={tab.id}
          value={tab.sql}
          onChange={(sql) => updateTabSql(tab.id, sql)}
          onExecute={handleExecute}
          onSave={handleSave}
          connectionId={tab.connectionId}
          schema={tab.schema}
          databaseType={dbType}
        />
      </Box>
    </Flex>
  )
}
