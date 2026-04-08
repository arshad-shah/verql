import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createAdapter } from '../../src/main/db/factory'
import type { DbAdapter } from '../../src/main/db/adapter'
import type { ConnectionProfile } from '../../shared/types'
import fs from 'fs'
import path from 'path'

const TEST_DB = path.join(__dirname, 'test-sqlite.db')

describe('SQLite Adapter', () => {
  let adapter: DbAdapter

  beforeAll(async () => {
    const profile: ConnectionProfile = {
      id: 'test-sqlite',
      name: 'Test DB',
      type: 'sqlite',
      database: TEST_DB
    }
    adapter = createAdapter(profile)
    await adapter.connect()
  })

  afterAll(async () => {
    await adapter.disconnect()
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB)
  })

  it('connects and returns version', async () => {
    const result = await adapter.query('SELECT sqlite_version() as version')
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].version).toBeDefined()
    expect(result.fields[0].name).toBe('version')
    expect(result.duration).toBeGreaterThanOrEqual(0)
  })

  it('creates a table and inserts data', async () => {
    await adapter.query('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT)')
    const insert = await adapter.query("INSERT INTO users (name, email) VALUES ('Alice', 'alice@test.com')")
    expect(insert.affectedRows).toBe(1)
  })

  it('queries data with params', async () => {
    const result = await adapter.query('SELECT * FROM users WHERE name = ?', ['Alice'])
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].name).toBe('Alice')
    expect(result.rowCount).toBe(1)
  })

  it('lists tables', async () => {
    const tables = await adapter.getTables()
    const userTable = tables.find(t => t.name === 'users')
    expect(userTable).toBeDefined()
    expect(userTable!.type).toBe('table')
  })

  it('lists columns', async () => {
    const columns = await adapter.getColumns('users')
    expect(columns).toHaveLength(3)
    const idCol = columns.find(c => c.name === 'id')!
    expect(idCol.isPrimaryKey).toBe(true)
    expect(idCol.dataType).toMatch(/INTEGER/i)
  })

  it('lists schemas (SQLite returns main)', async () => {
    const schemas = await adapter.getSchemas()
    expect(schemas).toContain('main')
  })

  it('lists indexes', async () => {
    await adapter.query('CREATE INDEX idx_users_email ON users(email)')
    const indexes = await adapter.getIndexes('users')
    const emailIdx = indexes.find(i => i.name === 'idx_users_email')
    expect(emailIdx).toBeDefined()
    expect(emailIdx!.columns).toContain('email')
  })

  it('handles errors gracefully', async () => {
    await expect(adapter.query('SELECT * FROM nonexistent_table')).rejects.toThrow()
  })
})
