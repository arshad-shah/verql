/**
 * Per-DB statement contributions. Each plugin (or bundled DB module) registers
 * a splitter + an ordered list of lens actions keyed by dbType. The
 * StatementGutter overlay is the only consumer.
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

export function registerStatementContribution(dbType: string, c: StatementContribution): void {
  contributions.set(dbType, c)
}

export function getStatementContribution(dbType: string): StatementContribution | undefined {
  return contributions.get(dbType)
}

export function invokeLensAction(dbType: string, actionId: string, ctx: LensActionContext): void {
  const c = contributions.get(dbType)
  if (!c) return
  const action = c.lensActions.find((a) => a.id === actionId)
  if (!action) return
  action.handler(ctx)
}

/** Test-only: clear the registry between test cases. */
export function _resetForTests(): void {
  contributions.clear()
}
