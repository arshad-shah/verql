// Regression test for the silent-swallow bug in CSV-import's "update" conflict
// mode. The original code only branched on 'skip' and 'error' inside the
// catch block, so when the user picked 'update' every conflict was dropped
// on the floor — inserted/skipped/errors all stayed zero and the user
// thought the import succeeded.
//
// We pin the wire behaviour: conflicts in 'update' mode are surfaced
// through the `errors` array (until/unless real upsert logic is wired in
// per-dialect). That's the minimum to stop silent data loss.
import { describe, it, expect } from 'vitest'
import type { DbAdapter } from '../../../src/main/db/adapter'
import { importCsvToTable } from '../../../src/main/plugins/sdk/csv-into-table'

class StubAdapter implements DbAdapter {
  async connect() {}
  async disconnect() {}
  isConnected() { return true }
  async testConnection() { return { version: 'stub' } }
  async query() {
    throw new Error('duplicate key value violates unique constraint')
  }
  async getTables() { return [] }
  async getColumns() { return [] }
  async getIndexes() { return [] }
  async getSchemas() { return [] }
  async getDatabases() { return [] }
  async getRowCount() { return 0 }
  async switchDatabase() {}
}

describe('importCsvToTable — onConflict="update"', () => {
  it('does not silently swallow per-row failures', async () => {
    const result = await importCsvToTable(
      new StubAdapter(),
      [{ id: '1', name: 'a' }],
      {
        tableName: 't',
        columnMapping: { id: 'id', name: 'name' },
        onConflict: 'update',
        quoteChar: '"',
        placeholderStyle: 'numbered',
      },
    )

    // The handler must do one of two visible things on each conflict in
    // update mode: succeed (inserted > 0) or surface the failure via
    // errors[]. The old code did neither.
    const observed = result.inserted + result.errors.length
    expect(observed).toBeGreaterThan(0)
  })
})
