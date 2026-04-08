import { describe, it, expect } from 'vitest'
import type { ConnectionProfile, DatabaseType, QueryResult, QueryTab, Tab } from '../../shared/types'
import type { IpcChannelMap } from '../../shared/ipc'

describe('Shared types', () => {
  it('ConnectionProfile has required fields', () => {
    const profile: ConnectionProfile = {
      id: 'test-1',
      name: 'Local Dev',
      type: 'postgresql',
      host: 'localhost',
      port: 5432,
      database: 'mydb',
      username: 'user',
      password: 'pass',
      color: '#7c6ff7',
      ssl: false,
      group: 'Development'
    }
    expect(profile.id).toBe('test-1')
    expect(profile.type).toBe('postgresql')
  })

  it('ConnectionProfile works for SQLite (file-based)', () => {
    const profile: ConnectionProfile = {
      id: 'sqlite-1',
      name: 'Local SQLite',
      type: 'sqlite',
      database: '/path/to/db.sqlite',
      color: '#28c840'
    }
    expect(profile.host).toBeUndefined()
    expect(profile.database).toBe('/path/to/db.sqlite')
  })

  it('QueryResult has rows, fields, and timing', () => {
    const result: QueryResult = {
      rows: [{ id: 1, name: 'Alice' }],
      fields: [
        { name: 'id', dataType: 'int4', nullable: false },
        { name: 'name', dataType: 'varchar', nullable: true }
      ],
      rowCount: 1,
      duration: 23,
      affectedRows: 0
    }
    expect(result.rows).toHaveLength(1)
    expect(result.fields[0].name).toBe('id')
  })

  it('IpcChannelMap defines required channels', () => {
    type AssertChannel<K extends keyof IpcChannelMap> = K
    type _a = AssertChannel<'db:connect'>
    type _b = AssertChannel<'db:disconnect'>
    type _c = AssertChannel<'db:query'>
    type _d = AssertChannel<'db:test-connection'>
    type _e = AssertChannel<'connections:list'>
    type _f = AssertChannel<'connections:save'>
    type _g = AssertChannel<'connections:delete'>
    expect(true).toBe(true)
  })

  it('IpcChannelMap defines set-schema channel', () => {
    type AssertChannel<K extends keyof IpcChannelMap> = K
    type _j = AssertChannel<'db:set-schema'>
    expect(true).toBe(true)
  })

  it('QueryTab has required fields', () => {
    const tab: QueryTab = {
      id: 'tab-1',
      type: 'query',
      title: 'Query 1',
      connectionId: 'conn-1',
      schema: 'public',
      sql: 'SELECT 1',
      results: null,
      isExecuting: false,
      error: null
    }
    expect(tab.type).toBe('query')
    expect(tab.sql).toBe('SELECT 1')
  })

  it('IpcChannelMap defines query channels', () => {
    type AssertChannel<K extends keyof IpcChannelMap> = K
    type _h = AssertChannel<'db:cancel-query'>
    type _i = AssertChannel<'db:get-table-names'>
    expect(true).toBe(true)
  })
})
