/**
 * Registers the built-in statement contributions, keyed by **statement-syntax
 * id** (not db type). Each driver declares which syntax it uses via its
 * `statementSyntax` capability (`'sql'` for the SQL family, `'redis'`,
 * `'mongodb'`), so there is no hardcoded db-type enumeration here — a new SQL
 * driver gets the SQL gutter for free by declaring `statementSyntax: 'sql'`.
 * Called once at renderer boot; plugins can register more syntaxes directly.
 */
import { registerStatementContribution } from '@/lib/statement-registry'
import { sqlStatementContribution } from './sql'
import { redisStatementContribution } from './redis'
import { mongoStatementContribution } from './mongodb'

export function registerBuiltinStatementContributions(): void {
  registerStatementContribution('sql', sqlStatementContribution)
  registerStatementContribution('redis', redisStatementContribution)
  registerStatementContribution('mongodb', mongoStatementContribution)
}
