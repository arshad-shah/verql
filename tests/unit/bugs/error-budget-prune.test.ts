// Regression test for ErrorBudget memory growth.
//
// `record()` pushed every error onto a per-plugin array and never pruned
// entries that had already aged out of the rolling window. A plugin that
// errored every few seconds for the lifetime of the app accumulated an
// unbounded array; only `reset()` (which is rarely called) reclaimed it.
//
// The fix prunes entries outside the window on every `record()` so the
// in-memory footprint is bounded by activity-in-window, not lifetime.
import { describe, it, expect } from 'vitest'
import { ErrorBudget } from '../../../src/main/plugins/sdk/safe-call'

describe('ErrorBudget — bounded growth', () => {
  it('prunes entries outside the window so getErrors() does not grow unboundedly', async () => {
    const budget = new ErrorBudget({ maxErrors: 3, windowMs: 30 })
    for (let i = 0; i < 50; i++) {
      budget.record('p', new Error(`old-${i}`))
    }
    // Wait for the window to fully elapse.
    await new Promise(r => setTimeout(r, 60))
    // One more record after the window — old entries should have been
    // dropped, not kept.
    budget.record('p', new Error('fresh'))

    const remaining = budget.getErrors('p')
    expect(remaining.length).toBeLessThanOrEqual(3)
    expect(remaining.some(r => r.error === 'fresh')).toBe(true)
    expect(remaining.every(r => !r.error.startsWith('old-'))).toBe(true)
  })

  it('still reports isExceeded correctly under steady-state load', async () => {
    const budget = new ErrorBudget({ maxErrors: 2, windowMs: 30 })
    budget.record('p', new Error('a'))
    budget.record('p', new Error('b'))
    expect(budget.isExceeded('p')).toBe(true)
    await new Promise(r => setTimeout(r, 60))
    // Window expired — record one fresh error, should no longer be exceeded.
    budget.record('p', new Error('c'))
    expect(budget.isExceeded('p')).toBe(false)
  })
})
