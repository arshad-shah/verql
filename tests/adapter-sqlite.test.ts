import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createAdapter, type DbAdapter } from '../src/db/adapter.js'
import type { Connection } from '../src/config/store.js'
import { mkdtempSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

describe('SQLite adapter', () => {
  let adapter: DbAdapter
  let tmpDir: string
  let dbPath: string

  beforeAll(async () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'dbterm-test-'))
    dbPath = join(tmpDir, 'test.db')
    const conn: Connection = {
      id: 'test-sqlite',
      name: 'Test SQLite',
      type: 'sqlite',
      database: dbPath,
      file: dbPath,
    }
    adapter = await createAdapter(conn)
    await adapter.connect()

    // Seed test data
    await adapter.query(`CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      age INTEGER
    )`)
    await adapter.query(`CREATE TABLE posts (
      id INTEGER PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      title TEXT NOT NULL,
      body TEXT
    )`)
    await adapter.query(`INSERT INTO users (name, email, age) VALUES ('Alice', 'alice@test.com', 30)`)
    await adapter.query(`INSERT INTO users (name, email, age) VALUES ('Bob', 'bob@test.com', 25)`)
    await adapter.query(`INSERT INTO users (name, email, age) VALUES ('Charlie', 'charlie@test.com', 35)`)
  })

  afterAll(async () => {
    await adapter.disconnect()
    try { rmSync(tmpDir, { recursive: true }) } catch {}
  })

  it('connects successfully', () => {
    expect(adapter.isConnected()).toBe(true)
  })

  it('getTables returns seeded tables', async () => {
    const tables = await adapter.getTables()
    const names = tables.map(t => t.name)
    expect(names).toContain('users')
    expect(names).toContain('posts')
  })

  it('getColumns returns correct schema', async () => {
    const cols = await adapter.getColumns('users')
    expect(cols.length).toBe(4)
    const idCol = cols.find(c => c.name === 'id')
    expect(idCol?.isPrimaryKey).toBe(true)
    expect(idCol?.type).toBe('INTEGER')
    const nameCol = cols.find(c => c.name === 'name')
    expect(nameCol?.nullable).toBe(false)
  })

  it('query SELECT returns rows', async () => {
    const result = await adapter.query('SELECT * FROM users ORDER BY name')
    expect(result.rows.length).toBe(3)
    expect(result.columns).toContain('name')
    expect(result.rows[0].name).toBe('Alice')
  })

  it('query INSERT returns affectedRows', async () => {
    const result = await adapter.query(
      `INSERT INTO users (name, email, age) VALUES ('Dave', 'dave@test.com', 40)`
    )
    expect(result.affectedRows).toBe(1)
  })

  it('query with bad SQL returns error not throw', async () => {
    const result = await adapter.query('SELECT * FROM nonexistent_table')
    expect(result.error).toBeDefined()
    expect(result.error).toContain('no such table')
  })

  it('beginTransaction / rollbackTransaction correctly undoes inserts', async () => {
    await adapter.beginTransaction()
    await adapter.query(`INSERT INTO users (name, email, age) VALUES ('TxnUser', 'txn@test.com', 50)`)

    const mid = await adapter.query('SELECT COUNT(*) as n FROM users')
    const countDuring = mid.rows[0].n

    await adapter.rollbackTransaction()

    const after = await adapter.query('SELECT COUNT(*) as n FROM users')
    expect(after.rows[0].n).toBe(countDuring - 1)
  })

  it('getTableDDL returns valid SQL', async () => {
    const ddl = await adapter.getTableDDL('users')
    expect(ddl).toContain('CREATE TABLE')
    expect(ddl).toContain('users')
  })

  it('getTableRowCount returns correct count', async () => {
    const count = await adapter.getTableRowCount('users')
    expect(typeof count).toBe('number')
    expect(count).toBeGreaterThan(0)
  })

  it('isInTransaction reflects state', async () => {
    expect(adapter.isInTransaction()).toBe(false)
    await adapter.beginTransaction()
    expect(adapter.isInTransaction()).toBe(true)
    await adapter.rollbackTransaction()
    expect(adapter.isInTransaction()).toBe(false)
  })

  it('getSchemas returns main', async () => {
    const schemas = await adapter.getSchemas()
    expect(schemas).toContain('main')
  })

  it('query with params works', async () => {
    // better-sqlite3 uses ? for positional params
    const result = await adapter.query('SELECT * FROM users WHERE age > ?', [28])
    expect(result.rows.length).toBeGreaterThan(0)
    for (const row of result.rows) {
      expect(row.age).toBeGreaterThan(28)
    }
  })

  it('getDbType returns sqlite', () => {
    expect(adapter.getDbType()).toBe('sqlite')
  })

  it('getAllForeignKeys returns FK relationships', async () => {
    const fks = await adapter.getAllForeignKeys()
    expect(fks.length).toBeGreaterThan(0)
    const postsFk = fks.find(fk => fk.fromTable === 'posts' && fk.fromColumn === 'user_id')
    expect(postsFk).toBeDefined()
    expect(postsFk!.toTable).toBe('users')
    expect(postsFk!.toColumn).toBe('id')
  })
})
