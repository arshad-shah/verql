import { describe, it, expect } from 'vitest'
import { generateInsertStatements, generateCreateTable } from '../../src/main/plugins/sdk/sql-format'
import type { SchemaColumn } from '../../shared/types'

const columns: SchemaColumn[] = [
  { name: 'id', dataType: 'integer', nullable: false, defaultValue: null, isPrimaryKey: true, isForeignKey: false },
  { name: 'name', dataType: 'varchar', nullable: false, defaultValue: null, isPrimaryKey: false, isForeignKey: false },
  { name: 'email', dataType: 'varchar', nullable: true, defaultValue: null, isPrimaryKey: false, isForeignKey: false }
]

describe('SDK SQL format helpers — generic over quoteChar', () => {
  it('generates INSERT statements using the supplied quote character', () => {
    const rows = [
      { id: 1, name: 'Alice', email: 'alice@test.com' },
      { id: 2, name: "Bob's", email: null }
    ]
    const sql = generateInsertStatements('users', columns, rows, '"')
    expect(sql).toContain('INSERT INTO "users"')
    expect(sql).toContain("'Alice'")
    expect(sql).toContain("'Bob''s'") // escaped single quote
    expect(sql).toContain('NULL')
  })

  it('generates CREATE TABLE with the supplied quote character', () => {
    const ddl = generateCreateTable('users', columns, '"')
    expect(ddl).toContain('CREATE TABLE "users"')
    expect(ddl).toContain('"id" integer PRIMARY KEY')
    expect(ddl).toContain('"name" varchar NOT NULL')
    expect(ddl).toContain('"email" varchar')
    expect(ddl).not.toContain('"email" varchar NOT NULL')
  })

  it('uses backticks when MySQL drivers pass `', () => {
    const ddl = generateCreateTable('users', columns, '`')
    expect(ddl).toContain('CREATE TABLE `users`')
    expect(ddl).toContain('`id` integer PRIMARY KEY')
  })

  it('handles empty rows', () => {
    const sql = generateInsertStatements('users', columns, [], '"')
    expect(sql).toContain('No data')
  })
})
