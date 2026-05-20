import { describe, it, expect } from 'vitest'
import { pickDefaultSchema } from '../../src/renderer/src/lib/pick-default-schema'

describe('pickDefaultSchema', () => {
  it('returns undefined when there are no schemas', () => {
    expect(pickDefaultSchema({}, [], undefined)).toBeUndefined()
  })

  it('returns the connection database when defaultSchemaUseConnectionDatabase is set and the db exists in schemas', () => {
    const out = pickDefaultSchema(
      { defaultSchemaUseConnectionDatabase: true },
      ['app', 'mysql', 'sys'],
      'app'
    )
    expect(out).toBe('app')
  })

  it('falls back to the first schema when the connection database is not in the schema list', () => {
    const out = pickDefaultSchema(
      { defaultSchemaUseConnectionDatabase: true },
      ['public', 'analytics'],
      'app'
    )
    expect(out).toBe('public')
  })

  it('picks the first matching candidate from defaultSchemaCandidates', () => {
    const out = pickDefaultSchema(
      { defaultSchemaCandidates: ['main'] },
      ['main', 'temp'],
      undefined
    )
    expect(out).toBe('main')
  })

  it('respects candidate priority order', () => {
    const out = pickDefaultSchema(
      { defaultSchemaCandidates: ['PUBLIC', 'public'] },
      ['public', 'PUBLIC', 'INFORMATION_SCHEMA'],
      undefined
    )
    expect(out).toBe('PUBLIC')
  })

  it('falls back to the first schema when no candidate matches', () => {
    const out = pickDefaultSchema(
      { defaultSchemaCandidates: ['main'] },
      ['x', 'y'],
      undefined
    )
    expect(out).toBe('x')
  })

  it('treats useConnectionDatabase as higher priority than candidates', () => {
    const out = pickDefaultSchema(
      {
        defaultSchemaUseConnectionDatabase: true,
        defaultSchemaCandidates: ['public']
      },
      ['public', 'app'],
      'app'
    )
    expect(out).toBe('app')
  })
})
