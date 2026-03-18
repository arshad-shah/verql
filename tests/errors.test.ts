import { describe, it, expect } from 'vitest'
import {
  DbConnectionError,
  DbQueryError,
  DbTimeoutError,
  ValidationError,
  UserAbortError,
} from '../src/utils/errors.js'

describe('Error classes', () => {
  it('DbConnectionError has correct name and properties', () => {
    const err = new DbConnectionError('Connection refused', 'localhost', 5432)
    expect(err.name).toBe('DbConnectionError')
    expect(err.message).toBe('Connection refused')
    expect(err.host).toBe('localhost')
    expect(err.port).toBe(5432)
    expect(err instanceof Error).toBe(true)
  })

  it('DbQueryError has correct name and properties', () => {
    const err = new DbQueryError('syntax error', 'SELECT * FORM users', '42601')
    expect(err.name).toBe('DbQueryError')
    expect(err.message).toBe('syntax error')
    expect(err.query).toBe('SELECT * FORM users')
    expect(err.code).toBe('42601')
    expect(err instanceof Error).toBe(true)
  })

  it('DbTimeoutError has correct name and properties', () => {
    const err = new DbTimeoutError('timed out', 30000)
    expect(err.name).toBe('DbTimeoutError')
    expect(err.timeoutMs).toBe(30000)
    expect(err instanceof Error).toBe(true)
  })

  it('ValidationError has correct name and properties', () => {
    const err = new ValidationError("'hello' is not a valid INTEGER", 'integer', 'hello')
    expect(err.name).toBe('ValidationError')
    expect(err.field).toBe('integer')
    expect(err.value).toBe('hello')
    expect(err instanceof Error).toBe(true)
  })

  it('UserAbortError has correct name and default message', () => {
    const err = new UserAbortError()
    expect(err.name).toBe('UserAbortError')
    expect(err.message).toBe('Operation cancelled by user')
    expect(err instanceof Error).toBe(true)
  })

  it('UserAbortError accepts custom message', () => {
    const err = new UserAbortError('Cancelled by Ctrl+C')
    expect(err.message).toBe('Cancelled by Ctrl+C')
  })
})
