import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { ConfigStore } from '../../src/main/config/store'
import type { ConnectionProfile } from '../../shared/types'
import fs from 'fs'
import path from 'path'

const TEST_CONFIG = path.join(__dirname, 'test-config.json')

describe('ConfigStore', () => {
  let store: ConfigStore

  beforeEach(() => {
    if (fs.existsSync(TEST_CONFIG)) fs.unlinkSync(TEST_CONFIG)
    store = new ConfigStore(TEST_CONFIG)
  })

  afterAll(() => {
    if (fs.existsSync(TEST_CONFIG)) fs.unlinkSync(TEST_CONFIG)
  })

  it('starts with empty connections', () => {
    expect(store.listConnections()).toEqual([])
  })

  it('saves and retrieves a connection', () => {
    const profile: ConnectionProfile = { id: 'test-1', name: 'Local Dev', type: 'postgresql', host: 'localhost', port: 5432, database: 'mydb', username: 'user', password: 'pass' }
    store.saveConnection(profile)
    const list = store.listConnections()
    expect(list).toHaveLength(1)
    expect(list[0].name).toBe('Local Dev')
  })

  it('updates an existing connection', () => {
    const profile: ConnectionProfile = { id: 'test-1', name: 'Original', type: 'sqlite', database: '/tmp/a.db' }
    store.saveConnection(profile)
    store.saveConnection({ ...profile, name: 'Updated' })
    const list = store.listConnections()
    expect(list).toHaveLength(1)
    expect(list[0].name).toBe('Updated')
  })

  it('deletes a connection', async () => {
    store.saveConnection({ id: 'a', name: 'A', type: 'sqlite', database: '/a.db' })
    store.saveConnection({ id: 'b', name: 'B', type: 'sqlite', database: '/b.db' })
    await store.deleteConnection('a')
    const list = store.listConnections()
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe('b')
  })

  it('gets a connection by id', () => {
    store.saveConnection({ id: 'x', name: 'X', type: 'sqlite', database: '/x.db' })
    expect(store.getConnection('x')!.name).toBe('X')
  })

  it('returns undefined for non-existent connection', () => {
    expect(store.getConnection('nonexistent')).toBeUndefined()
  })

  it('persists across instances', () => {
    store.saveConnection({ id: 'p', name: 'Persistent', type: 'sqlite', database: '/p.db' })
    const store2 = new ConfigStore(TEST_CONFIG)
    expect(store2.listConnections()).toHaveLength(1)
    expect(store2.listConnections()[0].name).toBe('Persistent')
  })
})
