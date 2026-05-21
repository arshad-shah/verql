/**
 * Registers built-in statement contributions for the DB types that ship with
 * the app. Called once at renderer boot. Plugins can register additional
 * contributions later by importing registerStatementContribution directly.
 */
import { registerStatementContribution } from '@/lib/statement-registry'
import { sqlStatementContribution } from './sql'
import { redisStatementContribution } from './redis'
import { mongoStatementContribution } from './mongodb'

export function registerBuiltinStatementContributions(): void {
  for (const t of ['postgresql', 'mysql', 'sqlite', 'snowflake']) {
    registerStatementContribution(t, sqlStatementContribution)
  }
  registerStatementContribution('redis', redisStatementContribution)
  registerStatementContribution('mongodb', mongoStatementContribution)
}
