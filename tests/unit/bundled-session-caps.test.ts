import { describe, it, expect } from 'vitest'
import { DriverRegistryImpl } from '../../src/main/plugins/sdk/driver-registry'
import { activate as activatePg } from '../../src/main/plugins/bundled/postgresql/index'
import { activate as activateSqlite } from '../../src/main/plugins/bundled/sqlite/index'

function ctxWith(registry: DriverRegistryImpl) {
  const noop = () => ({ dispose() {} })
  return {
    drivers: registry, completions: { register: noop }, exporters: { register: noop },
    importers: { register: noop }, typeMappers: { register: noop },
  } as never
}

describe('bundled driver session capabilities', () => {
  it('postgresql declares manual transactions with isolation levels and readonly', () => {
    const r = new DriverRegistryImpl()
    activatePg(ctxWith(r))
    const s = r.get('postgresql')!.session!
    expect(s.manualTransactions).toBe(true)
    expect(s.isolationLevels).toContain('SERIALIZABLE')
    expect(s.readOnly).toBe(true)
  })

  it('sqlite declares manual transactions without isolation picker', () => {
    const r = new DriverRegistryImpl()
    activateSqlite(ctxWith(r))
    const s = r.get('sqlite')!.session!
    expect(s.manualTransactions).toBe(true)
    expect(s.isolationLevels).toBeUndefined()
  })
})
