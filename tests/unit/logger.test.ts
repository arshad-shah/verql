import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLogger } from '../../src/main/logging/logger'
import { ActivityLog } from '../../src/main/activity/log'

describe('createLogger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'debug').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it('records each line into the activity log as a log entry with the scope as source', () => {
    const log = new ActivityLog()
    const logger = createLogger(log, 'app')
    logger.info('hello')
    logger.warn('careful')

    const list = log.list()
    expect(list.map((e) => ({ kind: e.kind, level: e.level, title: e.title, source: e.source }))).toEqual([
      { kind: 'log', level: 'warn', title: 'careful', source: 'app' },
      { kind: 'log', level: 'info', title: 'hello', source: 'app' },
    ])
  })

  it('mirrors to the matching console method', () => {
    const log = new ActivityLog()
    const logger = createLogger(log)
    logger.debug('d')
    logger.info('i')
    logger.warn('w')
    logger.error('e')
    expect(console.debug).toHaveBeenCalledTimes(1)
    expect(console.log).toHaveBeenCalledTimes(1)
    expect(console.warn).toHaveBeenCalledTimes(1)
    expect(console.error).toHaveBeenCalledTimes(1)
  })

  it('serializes an Error detail to its stack/message', () => {
    const log = new ActivityLog()
    const logger = createLogger(log, 'app')
    logger.error('boom', new Error('kaboom'))
    expect(log.list()[0].detail).toContain('kaboom')
  })

  it('serializes an object detail to JSON', () => {
    const log = new ActivityLog()
    const logger = createLogger(log)
    logger.info('cfg', { port: 7337 })
    expect(log.list()[0].detail).toBe(JSON.stringify({ port: 7337 }, null, 2))
  })

  it('child() prefixes the scope', () => {
    const log = new ActivityLog()
    const logger = createLogger(log, 'app')
    logger.child('plugins').error('Boot failed')
    expect(log.list()[0].source).toBe('app:plugins')
  })

  it('mark() records a log entry carrying the measured durationMs', () => {
    const log = new ActivityLog()
    const logger = createLogger(log, 'app')
    const end = logger.child('plugins').mark('boot')
    const ms = end({ plugins: 3 })

    const entry = log.list()[0]
    expect(entry.kind).toBe('log')
    expect(entry.title).toBe('boot')
    expect(entry.source).toBe('app:plugins')
    expect(typeof entry.durationMs).toBe('number')
    // end() returns the same duration it recorded, so callers can reuse it.
    expect(entry.durationMs).toBe(ms)
    // Extra context that isn't `detail`/`durationMs` is serialized into detail.
    expect(entry.detail).toBe(JSON.stringify({ plugins: 3 }, null, 2))
  })
})
