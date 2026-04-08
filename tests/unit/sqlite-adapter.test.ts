import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { createAdapter } from '../../src/main/db/factory'
import type { DbAdapter } from '../../src/main/db/adapter'
import type { ConnectionProfile } from '../../shared/types'
import Database from 'better-sqlite3'
import { SqliteAdapter } from '../../src/main/db/sqlite'
import fs from 'fs'
import path from 'path'
import os from 'os'

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

describe('SqliteAdapter.getRowCount', () => {
  let adapter: SqliteAdapter
  let dbPath: string

  beforeEach(async () => {
    dbPath = path.join(os.tmpdir(), `test-rowcount-${Date.now()}.db`)
    const db = new Database(dbPath)
    db.exec('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)')
    db.exec("INSERT INTO users VALUES (1, 'Alice'), (2, 'Bob'), (3, 'Charlie')")
    db.exec('CREATE VIEW active_users AS SELECT * FROM users WHERE id > 1')
    db.close()

    adapter = new SqliteAdapter(dbPath)
    await adapter.connect()
  })

  afterEach(async () => {
    await adapter.disconnect()
    fs.unlinkSync(dbPath)
  })

  it('returns exact row count for a table', async () => {
    const count = await adapter.getRowCount('users')
    expect(count).toBe(3)
  })

  it('returns row count for a view', async () => {
    const count = await adapter.getRowCount('active_users')
    expect(count).toBe(2)
  })
})
