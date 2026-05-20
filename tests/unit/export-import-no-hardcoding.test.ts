import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const IPC_FILE = path.join(__dirname, '../../src/main/ipc/export-import.ts')
const DB_FILE = path.join(__dirname, '../../src/main/ipc/db.ts')
const CMD_PALETTE = path.join(__dirname, '../../src/renderer/src/components/command-palette/CommandPalette.tsx')
const CONN_SELECTOR = path.join(__dirname, '../../src/renderer/src/components/query/ConnectionSelector.tsx')
const QUERY_EDITOR = path.join(__dirname, '../../src/renderer/src/components/query/QueryEditor.tsx')

/**
 * Architectural guard: the orchestrator (IPC layer) must NOT contain a
 * hardcoded `connection-type → SQL dialect` map. All dialect/format knowledge
 * lives in driver plugins. If a regression reintroduces a map like
 * `DIALECT_BY_TYPE`, this test fails immediately rather than waiting for a
 * production incident.
 */
describe('Orchestrator has no hardcoded relational table', () => {
  it('export-import IPC has no DIALECT_BY_TYPE map', () => {
    const src = fs.readFileSync(IPC_FILE, 'utf-8')
    expect(src).not.toMatch(/DIALECT_BY_TYPE/)
    // It also must not check for known DB types via equality. A string literal
    // like `'postgresql'` paired with `===` or `case` would mean the orchestrator
    // is making a database-specific decision.
    expect(src).not.toMatch(/connectionType\s*===\s*['"]postgresql['"]/)
    expect(src).not.toMatch(/connectionType\s*===\s*['"]mysql['"]/)
    expect(src).not.toMatch(/connectionType\s*===\s*['"]mongodb['"]/)
  })

  it('db:sample-query handler delegates to driver.sqlDialect, not a hardcoded list', () => {
    const src = fs.readFileSync(DB_FILE, 'utf-8')
    expect(src).not.toMatch(/FALLBACK_DIALECT_BY_TYPE/)
    expect(src).not.toMatch(/connectionType\s*===\s*['"]postgresql['"]/)
    // Sanity: it must consult the driver.
    expect(src).toMatch(/driver\?\.sqlDialect/)
  })

  for (const file of [CMD_PALETTE, CONN_SELECTOR, QUERY_EDITOR]) {
    it(`renderer ${path.basename(file)} has no hardcoded db-type branch`, () => {
      const src = fs.readFileSync(file, 'utf-8')
      // The renderer must NOT make decisions based on connection type
      // string equality. Driver-specific behaviour goes through the
      // driver-capabilities store + pickDefaultSchema helper.
      for (const t of ['sqlite', 'mysql', 'postgresql', 'postgres', 'mongodb', 'redis', 'snowflake']) {
        expect(src, `${path.basename(file)} branches on '${t}'`)
          .not.toMatch(new RegExp(`\\b\\w+\\.type\\s*===\\s*['"]${t}['"]`))
        expect(src, `${path.basename(file)} branches on databaseType === '${t}'`)
          .not.toMatch(new RegExp(`databaseType\\s*===\\s*['"]${t}['"]`))
        expect(src, `${path.basename(file)} branches on dbType === '${t}'`)
          .not.toMatch(new RegExp(`dbType\\s*===\\s*['"]${t}['"]`))
      }
    })
  }
})
