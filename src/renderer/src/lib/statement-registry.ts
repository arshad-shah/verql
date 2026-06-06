/**
 * Statement contributions keyed by **statement-syntax id** (e.g. `'sql'`,
 * `'redis'`, `'mongodb'`), which each driver declares via its `statementSyntax`
 * capability. A splitter + ordered lens actions per syntax. The StatementGutter
 * overlay is the only consumer; it resolves a connection's syntax from the
 * driver capability (never from a hardcoded db-type list).
 */
import type { LucideIcon } from 'lucide-react'

export interface Statement {
  startLine: number
  startColumn: number
  endLine: number
  endColumn: number
  text: string
}

export interface LensActionContext {
  stmt: Statement
  tabId: string
  connectionId: string | null
  dbType: string
}

export interface LensAction {
  id: string
  title: string
  /** Optional lucide icon component rendered to the left of the title. */
  icon?: LucideIcon
  when?: (stmt: Statement) => boolean
  handler: (ctx: LensActionContext) => void
}

export interface StatementContribution {
  splitStatements(source: string): Statement[]
  lensActions: LensAction[]
}

const contributions = new Map<string, StatementContribution>()

export function registerStatementContribution(syntax: string, c: StatementContribution): void {
  contributions.set(syntax, c)
}

export function getStatementContribution(syntax: string): StatementContribution | undefined {
  return contributions.get(syntax)
}

export function invokeLensAction(syntax: string, actionId: string, ctx: LensActionContext): void {
  const c = contributions.get(syntax)
  if (!c) return
  const action = c.lensActions.find((a) => a.id === actionId)
  if (!action) return
  action.handler(ctx)
}

/** Test-only: clear the registry between test cases. */
export function _resetForTests(): void {
  contributions.clear()
}
