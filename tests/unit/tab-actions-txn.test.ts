import { describe, it, expect, beforeEach, vi } from 'vitest'
import { tabActions } from '../../src/renderer/src/stores/tab-actions'

describe('tabActions transaction guard', () => {
  beforeEach(() => tabActions.unregister('t1'))

  it('hasOpenTransaction reflects the registered txnStatus', () => {
    tabActions.register('t1', { txnStatus: () => 'active' })
    expect(tabActions.hasOpenTransaction('t1')).toBe(true)
  })

  it('hasOpenTransaction is false when no handler registered', () => {
    expect(tabActions.hasOpenTransaction('t1')).toBe(false)
  })

  it('commitTransaction delegates to the registered handler', async () => {
    const commit = vi.fn()
    tabActions.register('t1', { commitTransaction: commit })
    await tabActions.commitTransaction('t1')
    expect(commit).toHaveBeenCalled()
  })

  it('rollbackTransaction delegates to the registered handler', async () => {
    const rollback = vi.fn()
    tabActions.register('t1', { rollbackTransaction: rollback })
    await tabActions.rollbackTransaction('t1')
    expect(rollback).toHaveBeenCalled()
  })
})
