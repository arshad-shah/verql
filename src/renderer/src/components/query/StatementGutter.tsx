import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { editor } from 'monaco-editor'
import { Check, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/primitives/forms/Button'
import { Text } from '@/primitives/typography/Text'
import {
  getStatementContribution,
  type LensAction,
  type Statement,
  type LensActionContext,
} from '@/lib/statement-registry'
import { useStatementStatus, hashStatement, type StatementStatus } from '@/stores/statement-status'

interface Props {
  editor: editor.IStandaloneCodeEditor
  tabId: string
  connectionId: string | null
  dbType: string | undefined
}

interface ZoneEntry {
  zoneId: string
  widgetId: string
  containerEl: HTMLDivElement
  stmt: Statement
}

export function StatementGutter({ editor, tabId, connectionId, dbType }: Props) {
  const entriesRef = useRef<ZoneEntry[]>([])
  const [, setTick] = useState(0)
  const bump = () => setTick((n) => n + 1)

  useEffect(() => {
    if (!dbType) return
    const contribution = getStatementContribution(dbType)
    if (!contribution) return

    const reconcile = () => {
      const model = editor.getModel()
      if (!model) return
      let stmts: Statement[] = []
      try {
        stmts = contribution.splitStatements(model.getValue())
      } catch (err) {
        console.warn('[statement-gutter] splitter threw:', err)
      }

      editor.changeViewZones((accessor) => {
        for (const e of entriesRef.current) {
          accessor.removeZone(e.zoneId)
          editor.removeContentWidget({
            getId: () => e.widgetId,
            getDomNode: () => e.containerEl,
            getPosition: () => null,
          })
        }
        entriesRef.current = []

        for (const stmt of stmts) {
          const containerEl = document.createElement('div')
          containerEl.className = 'verql-stmt-gutter flex items-center gap-1 px-2 h-[24px] text-xs'
          const widgetId = `verql.stmt-widget.${stmt.startLine}.${stmt.startColumn}`
          const domNode = document.createElement('div')
          domNode.style.width = '100%'
          domNode.appendChild(containerEl)

          const zoneId = accessor.addZone({
            afterLineNumber: Math.max(0, stmt.startLine - 1),
            heightInLines: 1,
            domNode,
          })

          editor.addContentWidget({
            getId: () => widgetId,
            getDomNode: () => containerEl,
            getPosition: () => null,
          })

          entriesRef.current.push({ zoneId, widgetId, containerEl, stmt })
        }
      })

      bump()
    }

    reconcile()
    let timer: number | undefined
    const sub = editor.onDidChangeModelContent(() => {
      window.clearTimeout(timer)
      timer = window.setTimeout(reconcile, 100) as unknown as number
    })

    return () => {
      window.clearTimeout(timer)
      sub.dispose()
      editor.changeViewZones((accessor) => {
        for (const e of entriesRef.current) {
          accessor.removeZone(e.zoneId)
          editor.removeContentWidget({
            getId: () => e.widgetId,
            getDomNode: () => e.containerEl,
            getPosition: () => null,
          })
        }
        entriesRef.current = []
      })
    }
  }, [editor, dbType])

  if (!dbType) return null
  const contribution = getStatementContribution(dbType)
  if (!contribution) return null

  return (
    <>
      {entriesRef.current.map((entry) =>
        createPortal(
          <GutterRow
            key={entry.widgetId}
            stmt={entry.stmt}
            actions={contribution.lensActions}
            tabId={tabId}
            connectionId={connectionId}
            dbType={dbType}
          />,
          entry.containerEl
        )
      )}
    </>
  )
}

function GutterRow({
  stmt,
  actions,
  tabId,
  connectionId,
  dbType,
}: {
  stmt: Statement
  actions: LensAction[]
  tabId: string
  connectionId: string | null
  dbType: string
}) {
  const status = useStatementStatus((s) => s.get(tabId, hashStatement(stmt.text)))
  const ctx: LensActionContext = { stmt, tabId, connectionId, dbType }

  return (
    <>
      {actions
        .filter((a) => !a.when || a.when(stmt))
        .map((a) => (
          <Button
            key={a.id}
            variant="ghost"
            size="xs"
            onClick={() => a.handler(ctx)}
            className="!h-6 !px-1.5 gap-1 text-text-secondary hover:text-text-primary"
          >
            {a.icon ? <a.icon size={12} /> : null}
            {a.title}
          </Button>
        ))}
      {status ? <StatusChip status={status} /> : null}
    </>
  )
}

function StatusChip({ status }: { status: StatementStatus }) {
  if (status.kind === 'running') {
    return (
      <Text as="span" size="xs" color="muted" className="ml-2 inline-flex items-center gap-1">
        <Loader2 size={10} className="animate-spin" />
        running
      </Text>
    )
  }
  if (status.kind === 'error') {
    return (
      <Text as="span" size="xs" color="error" className="ml-2 inline-flex items-center gap-1">
        <AlertCircle size={10} />
        failed
        {status.durationMs != null ? ` · ${formatMs(status.durationMs)}` : null}
      </Text>
    )
  }
  return (
    <Text as="span" size="xs" color="success" className="ml-2 inline-flex items-center gap-1">
      <Check size={10} />
      {status.durationMs != null ? formatMs(status.durationMs) : 'ok'}
      {status.rowCount != null
        ? ` · ${status.rowCount} row${status.rowCount === 1 ? '' : 's'}`
        : null}
    </Text>
  )
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}
