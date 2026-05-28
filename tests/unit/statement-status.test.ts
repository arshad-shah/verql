import { describe, it, expect, beforeEach } from 'vitest'
import { useStatementStatus, hashStatement } from '@/stores/statement-status'

describe('statement-status store', () => {
  beforeEach(() => {
    useStatementStatus.setState({ byKey: {} })
  })

  it('records and retrieves a status', () => {
    const tabId = 't1'
    const hash = hashStatement('SELECT 1')
    useStatementStatus.getState().record(tabId, hash, {
      kind: 'ok', durationMs: 12, rowCount: 1, ranAt: 1000,
    })
    expect(useStatementStatus.getState().get(tabId, hash)).toEqual({
      kind: 'ok', durationMs: 12, rowCount: 1, ranAt: 1000,
    })
  })

  it('returns undefined for unseen statement', () => {
    expect(useStatementStatus.getState().get('t1', 'unknown')).toBeUndefined()
  })

  it('clears entries for a tab', () => {
    const tabId = 't1'
    const hash = hashStatement('SELECT 1')
    useStatementStatus.getState().record(tabId, hash, {
      kind: 'ok', durationMs: 12, rowCount: 1, ranAt: 1000,
    })
    useStatementStatus.getState().clearTab(tabId)
    expect(useStatementStatus.getState().get(tabId, hash)).toBeUndefined()
  })
})
