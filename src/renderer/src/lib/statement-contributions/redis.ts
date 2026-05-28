import { Play } from 'lucide-react'
import { tabActions } from '@/stores/tab-actions'
import type { Statement, StatementContribution } from '@/lib/statement-registry'

export function splitRedisStatements(source: string): Statement[] {
  const out: Statement[] = []
  const lines = source.split('\n')
  for (let idx = 0; idx < lines.length; idx++) {
    const raw = lines[idx]
    const trimmed = raw.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const leading = raw.length - raw.trimStart().length
    const trailing = raw.length - raw.trimEnd().length
    out.push({
      startLine: idx + 1,
      startColumn: leading + 1,
      endLine: idx + 1,
      endColumn: raw.length - trailing + 1,
      text: trimmed,
    })
  }
  return out
}

export const redisStatementContribution: StatementContribution = {
  splitStatements: splitRedisStatements,
  lensActions: [
    { id: 'run', title: 'Run', icon: Play, handler: (ctx) => tabActions.runStatement(ctx.tabId, ctx.stmt.text) },
  ],
}
