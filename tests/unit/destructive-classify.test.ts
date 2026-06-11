import { describe, it, expect } from 'vitest'
import { sqlStatementContribution } from '../../src/renderer/src/lib/statement-contributions/sql'
import { classifyRedisDestructive } from '../../src/renderer/src/lib/statement-contributions/redis'
import { classifyMongoDestructive } from '../../src/renderer/src/lib/statement-contributions/mongodb'

describe('driver-aware destructive classification', () => {
  describe('SQL', () => {
    const classify = sqlStatementContribution.classifyDestructive!
    it('flags DELETE/DROP/TRUNCATE', () => {
      expect(classify('DELETE FROM users')?.messageKey).toBe('query.destructive.deleteDropTruncate')
      expect(classify('DROP TABLE t')?.messageKey).toBe('query.destructive.deleteDropTruncate')
      expect(classify('TRUNCATE t')?.messageKey).toBe('query.destructive.deleteDropTruncate')
    })
    it('flags an UPDATE with no WHERE', () => {
      expect(classify('UPDATE users SET active = 1')?.messageKey).toBe('query.destructive.updateNoWhere')
    })
    it('passes a guarded UPDATE and a SELECT', () => {
      expect(classify('UPDATE users SET active = 1 WHERE id = 5')).toBeNull()
      expect(classify('SELECT * FROM users')).toBeNull()
    })
  })

  describe('Redis', () => {
    it('flags FLUSHALL/FLUSHDB/DEL/UNLINK', () => {
      expect(classifyRedisDestructive('FLUSHALL')?.messageKey).toBe('query.destructive.generic')
      expect(classifyRedisDestructive('DEL user:1')?.messageKey).toBe('query.destructive.generic')
      expect(classifyRedisDestructive('GET a\nUNLINK b')?.messageKey).toBe('query.destructive.generic')
    })
    it('passes read commands', () => {
      expect(classifyRedisDestructive('GET user:1\nHGETALL user:2')).toBeNull()
      // SQL keywords must NOT trip the Redis classifier.
      expect(classifyRedisDestructive('DELETE FROM users')).toBeNull()
    })
  })

  describe('Mongo', () => {
    it('flags drop/deleteMany/deleteOne/remove', () => {
      expect(classifyMongoDestructive('db.users.deleteMany({})')?.messageKey).toBe('query.destructive.generic')
      expect(classifyMongoDestructive('db.users.drop()')?.messageKey).toBe('query.destructive.generic')
    })
    it('passes find/insert/aggregate', () => {
      expect(classifyMongoDestructive('db.users.find({ age: { $gt: 21 } })')).toBeNull()
      expect(classifyMongoDestructive('db.users.insertOne({ name: "a" })')).toBeNull()
      // SQL DROP must NOT trip the Mongo classifier (no method-call form).
      expect(classifyMongoDestructive('DROP TABLE t')).toBeNull()
    })
  })
})
