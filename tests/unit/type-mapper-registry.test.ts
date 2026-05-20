import { describe, it, expect } from 'vitest'
import { TypeMapperRegistryImpl } from '../../src/main/plugins/sdk/type-mapper-registry'

describe('TypeMapperRegistryImpl', () => {
  it('registers and resolves a type mapping from→to', () => {
    const reg = new TypeMapperRegistryImpl()
    reg.register('postgresql', 'mysql', {
      'integer': { target: 'INT', lossy: false }
    })
    const mapping = reg.resolve('postgresql', 'mysql', 'integer')
    expect(mapping).toEqual({ source: 'integer', target: 'INT', lossy: false })
  })

  it('returns an identity mapping when from === to', () => {
    const reg = new TypeMapperRegistryImpl()
    expect(reg.resolve('postgresql', 'postgresql', 'integer'))
      .toEqual({ source: 'integer', target: 'integer', lossy: false })
  })

  it('normalises source type casing/whitespace when looking up', () => {
    const reg = new TypeMapperRegistryImpl()
    reg.register('postgresql', 'mysql', { 'integer': { target: 'INT', lossy: false } })
    expect(reg.resolve('postgresql', 'mysql', '  INTEGER  ')!.target).toBe('INT')
  })

  it('preserves the original source string in the result', () => {
    const reg = new TypeMapperRegistryImpl()
    reg.register('postgresql', 'mysql', { 'integer': { target: 'INT', lossy: false } })
    const m = reg.resolve('postgresql', 'mysql', '  INTEGER  ')!
    expect(m.source).toBe('  INTEGER  ')
  })

  it('returns undefined when no mapper / no entry is registered', () => {
    const reg = new TypeMapperRegistryImpl()
    expect(reg.resolve('postgresql', 'mysql', 'integer')).toBeUndefined()
  })

  it('supports a registered fallback resolver for sparse maps', () => {
    const reg = new TypeMapperRegistryImpl()
    reg.register('sqlite', 'postgresql', {}, (source) => {
      if (/int/i.test(source)) return { target: 'integer', lossy: false }
      return { target: 'text', lossy: false }
    })
    expect(reg.resolve('sqlite', 'postgresql', 'INT')!.target).toBe('integer')
    expect(reg.resolve('sqlite', 'postgresql', 'blob')!.target).toBe('text')
  })

  it('explicit entry beats the fallback', () => {
    const reg = new TypeMapperRegistryImpl()
    reg.register('sqlite', 'postgresql', {
      'blob': { target: 'bytea', lossy: false }
    }, (_source) => ({ target: 'text', lossy: false }))
    expect(reg.resolve('sqlite', 'postgresql', 'BLOB')!.target).toBe('bytea')
  })

  it('disposing a registration removes both the table and the fallback', () => {
    const reg = new TypeMapperRegistryImpl()
    const d = reg.register('postgresql', 'mysql', { 'integer': { target: 'INT', lossy: false } })
    d.dispose()
    expect(reg.resolve('postgresql', 'mysql', 'integer')).toBeUndefined()
  })

  it('does not silently overwrite an existing direction', () => {
    const reg = new TypeMapperRegistryImpl()
    reg.register('postgresql', 'mysql', { 'integer': { target: 'INT', lossy: false } })
    expect(() => reg.register('postgresql', 'mysql', { 'integer': { target: 'BIGINT', lossy: false } }))
      .toThrow(/already registered/)
  })
})
