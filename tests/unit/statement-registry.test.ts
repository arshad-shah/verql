import { describe, it, expect, beforeEach } from 'vitest'
import {
  registerStatementContribution,
  getStatementContribution,
  invokeLensAction,
  _resetForTests,
  type Statement,
  type StatementContribution,
} from '@/lib/statement-registry'

const stmt: Statement = { startLine: 1, startColumn: 1, endLine: 1, endColumn: 5, text: 'SHOW' }

function make(handler: (sql: string) => void): StatementContribution {
  return {
    splitStatements: () => [stmt],
    lensActions: [
      { id: 'run', title: '▶ Run', handler: (ctx) => handler(ctx.stmt.text) },
    ],
  }
}

describe('statement-registry', () => {
  beforeEach(() => _resetForTests())

  it('registers and retrieves a contribution', () => {
    const c = make(() => {})
    registerStatementContribution('postgresql', c)
    expect(getStatementContribution('postgresql')).toBe(c)
  })

  it('re-registering replaces the previous contribution', () => {
    const a = make(() => {})
    const b = make(() => {})
    registerStatementContribution('postgresql', a)
    registerStatementContribution('postgresql', b)
    expect(getStatementContribution('postgresql')).toBe(b)
  })

  it('invokeLensAction calls the matching action handler', () => {
    let received = ''
    registerStatementContribution('postgresql', make((s) => { received = s }))
    invokeLensAction('postgresql', 'run', {
      stmt, tabId: 't1', connectionId: 'c1', dbType: 'postgresql',
    })
    expect(received).toBe('SHOW')
  })

  it('invokeLensAction is a no-op for unknown dbType', () => {
    expect(() => invokeLensAction('nope', 'run', {
      stmt, tabId: 't1', connectionId: null, dbType: 'nope',
    })).not.toThrow()
  })

  it('invokeLensAction is a no-op for unknown actionId', () => {
    registerStatementContribution('postgresql', make(() => {}))
    expect(() => invokeLensAction('postgresql', 'nope', {
      stmt, tabId: 't1', connectionId: 'c1', dbType: 'postgresql',
    })).not.toThrow()
  })
})
