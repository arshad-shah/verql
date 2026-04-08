import { describe, it, expect } from 'vitest'
import { createAdapter } from '../../src/main/db/factory'
import { SqliteAdapter } from '../../src/main/db/sqlite'
import { PostgresAdapter } from '../../src/main/db/postgres'
import { MysqlAdapter } from '../../src/main/db/mysql'
import type { ConnectionProfile } from '../../shared/types'

describe('createAdapter factory', () => {
  it('creates SQLite adapter', () => {
    const profile: ConnectionProfile = { id: '1', name: 'test', type: 'sqlite', database: ':memory:' }
    expect(createAdapter(profile)).toBeInstanceOf(SqliteAdapter)
  })

  it('creates PostgreSQL adapter', () => {
    const profile: ConnectionProfile = { id: '2', name: 'test', type: 'postgresql', host: 'localhost', port: 5432, database: 'testdb', username: 'user', password: 'pass' }
    expect(createAdapter(profile)).toBeInstanceOf(PostgresAdapter)
  })

  it('creates MySQL adapter', () => {
    const profile: ConnectionProfile = { id: '3', name: 'test', type: 'mysql', host: 'localhost', port: 3306, database: 'testdb', username: 'root', password: 'pass' }
    expect(createAdapter(profile)).toBeInstanceOf(MysqlAdapter)
  })

  it('throws on unsupported type', () => {
    const profile = { id: '4', name: 'test', type: 'oracle' as any, database: 'test' }
    expect(() => createAdapter(profile)).toThrow('Unsupported database type')
  })
})
