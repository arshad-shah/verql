// tests/unit/safe-call.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { safeCall, ErrorBudget, PluginError } from '../../src/main/plugins/sdk/safe-call'

describe('safeCall', () => {
  it('returns the result of a successful sync function', async () => {
    const result = await safeCall('test-plugin', () => 42)
    expect(result).toBe(42)
  })

  it('returns the result of a successful async function', async () => {
    const result = await safeCall('test-plugin', async () => 'hello')
    expect(result).toBe('hello')
  })

  it('wraps thrown errors in PluginError', async () => {
    await expect(
      safeCall('test-plugin', () => { throw new Error('boom') })
    ).rejects.toThrow(PluginError)
  })

  it('includes plugin name in PluginError', async () => {
    try {
      await safeCall('my-plugin', () => { throw new Error('boom') })
    } catch (err) {
      expect(err).toBeInstanceOf(PluginError)
      expect((err as PluginError).pluginName).toBe('my-plugin')
      expect((err as PluginError).message).toContain('boom')
    }
  })

  it('rejects with timeout error when function exceeds timeoutMs', async () => {
    await expect(
      safeCall('slow-plugin', () => new Promise(r => setTimeout(r, 5000)), { timeoutMs: 50 })
    ).rejects.toThrow(/timed out/)
  }, 10_000)

  it('does not timeout when function completes in time', async () => {
    const result = await safeCall('fast-plugin', async () => {
      await new Promise(r => setTimeout(r, 10))
      return 'done'
    }, { timeoutMs: 5000 })
    expect(result).toBe('done')
  })
})

describe('ErrorBudget', () => {
  let budget: ErrorBudget

  beforeEach(() => {
    budget = new ErrorBudget({ maxErrors: 3, windowMs: 1000 })
  })

  it('starts with no errors', () => {
    expect(budget.isExceeded('test')).toBe(false)
    expect(budget.getErrors('test')).toEqual([])
  })

  it('records errors and returns false when under budget', () => {
    const exceeded = budget.record('test', new Error('err1'))
    expect(exceeded).toBe(false)
    expect(budget.getErrors('test')).toHaveLength(1)
  })

  it('returns true when error budget is exceeded', () => {
    budget.record('test', new Error('err1'))
    budget.record('test', new Error('err2'))
    const exceeded = budget.record('test', new Error('err3'))
    expect(exceeded).toBe(true)
    expect(budget.isExceeded('test')).toBe(true)
  })

  it('tracks errors per plugin independently', () => {
    budget.record('plugin-a', new Error('err'))
    budget.record('plugin-a', new Error('err'))
    budget.record('plugin-b', new Error('err'))
    expect(budget.isExceeded('plugin-a')).toBe(false)
    expect(budget.isExceeded('plugin-b')).toBe(false)
  })

  it('resets errors for a plugin', () => {
    budget.record('test', new Error('err1'))
    budget.record('test', new Error('err2'))
    budget.reset('test')
    expect(budget.getErrors('test')).toEqual([])
    expect(budget.isExceeded('test')).toBe(false)
  })

  it('expires old errors outside the window', async () => {
    const shortBudget = new ErrorBudget({ maxErrors: 2, windowMs: 50 })
    shortBudget.record('test', new Error('old'))
    shortBudget.record('test', new Error('old'))
    // Wait for window to expire
    await new Promise(r => setTimeout(r, 100))
    const exceeded = shortBudget.record('test', new Error('new'))
    expect(exceeded).toBe(false)
    // Only the new error remains within the window
    expect(shortBudget.getErrors('test').length).toBeGreaterThanOrEqual(1)
  })

  it('stores error details with timestamp and stack', () => {
    const err = new Error('test error')
    budget.record('test', err)
    const errors = budget.getErrors('test')
    expect(errors[0].error).toBe('test error')
    expect(errors[0].timestamp).toBeTypeOf('number')
    expect(errors[0].stack).toBeTypeOf('string')
  })
})
