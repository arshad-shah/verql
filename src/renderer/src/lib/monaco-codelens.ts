/**
 * Monaco CodeLens shell. Owns the Monaco command + the provider; all language
 * smarts (how to split statements, which actions to offer) live in the
 * statement-registry. This file knows nothing about SQL.
 */
import type { Monaco } from '@monaco-editor/react'
import type { editor, languages } from 'monaco-editor'
import { useTabsStore } from '@/stores/tabs'
import { useConnectionsStore } from '@/stores/connections'
import { editorRegistry } from '@/stores/editor'
import {
  getStatementContribution,
  invokeLensAction,
  type Statement,
} from '@/lib/statement-registry'

const INVOKE_COMMAND_ID = 'verql.invokeLensAction'
const registeredLangs = new Set<string>()

interface LensArgs {
  dbType: string
  actionId: string
  tabId: string
  connectionId: string | null
  stmt: Statement
}

/**
 * Registers the single dispatch command. Monaco's command registry accepts
 * re-registration silently, so safe to call on every editor mount (HMR-safe).
 */
export function installCodeLensCommand(monaco: Monaco): void {
  const reg = (monaco as unknown as {
    editor: { registerCommand?: (id: string, handler: (...args: unknown[]) => void) => void }
  }).editor.registerCommand
  if (typeof reg !== 'function') return
  reg(INVOKE_COMMAND_ID, (..._args: unknown[]) => {
    // Monaco passes (accessor, ...lensArgs). We only need the trailing payload.
    const payload = _args[1] as LensArgs | undefined
    if (!payload) return
    invokeLensAction(payload.dbType, payload.actionId, {
      stmt: payload.stmt,
      tabId: payload.tabId,
      connectionId: payload.connectionId,
      dbType: payload.dbType,
    })
  })
}

/** Registers the provider against the given Monaco language id. Idempotent. */
export function registerCodeLensProviderForLanguage(monaco: Monaco, language: string): void {
  if (registeredLangs.has(language)) return
  registeredLangs.add(language)

  monaco.languages.registerCodeLensProvider(language, {
    provideCodeLenses(model: editor.ITextModel): languages.ProviderResult<languages.CodeLensList> {
      const empty = { lenses: [], dispose: () => {} }
      const reg = editorRegistry.getByModelUri(model.uri.toString())
      if (!reg) return empty
      const tab = useTabsStore.getState().tabs.find((t) => t.id === reg.tabId)
      if (!tab || tab.type !== 'query') return empty
      const connectionId = tab.connectionId
      if (!connectionId) return empty
      const dbType = useConnectionsStore.getState().connections.find((c) => c.id === connectionId)?.type
      if (!dbType) return empty
      const contribution = getStatementContribution(dbType)
      if (!contribution) return empty

      let stmts: Statement[]
      try {
        stmts = contribution.splitStatements(model.getValue())
      } catch (err) {
        console.warn('[codelens] splitter threw:', err)
        return empty
      }

      const lenses: languages.CodeLens[] = []
      for (const stmt of stmts) {
        for (const action of contribution.lensActions) {
          if (action.when && !action.when(stmt)) continue
          const payload: LensArgs = { dbType, actionId: action.id, tabId: reg.tabId, connectionId, stmt }
          lenses.push({
            range: {
              startLineNumber: stmt.startLine,
              startColumn: stmt.startColumn,
              endLineNumber: stmt.endLine,
              endColumn: stmt.endColumn,
            },
            id: `${action.id}-${stmt.startLine}-${stmt.startColumn}`,
            command: { id: INVOKE_COMMAND_ID, title: action.title, arguments: [payload] },
          })
        }
      }
      return { lenses, dispose: () => {} }
    },
    resolveCodeLens(_model: editor.ITextModel, lens: languages.CodeLens) { return lens },
  })
}
