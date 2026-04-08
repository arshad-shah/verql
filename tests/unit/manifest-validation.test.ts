import { describe, it, expect } from 'vitest'
import { validateManifest } from '../../src/main/plugins/plugin-host'
import type { PluginManifest } from '../../src/main/plugins/types'

function validManifest(overrides?: Partial<PluginManifest>): PluginManifest {
  return {
    name: 'test-plugin',
    version: '1.0.0',
    displayName: 'Test Plugin',
    description: 'A test plugin',
    main: 'dist/index.js',
    contributes: {},
    ...overrides
  }
}

describe('validateManifest', () => {
  it('accepts a valid manifest', () => {
    const result = validateManifest(validManifest())
    expect(result.valid).toBe(true)
  })

  it('rejects missing name', () => {
    const result = validateManifest(validManifest({ name: '' }))
    expect(result.valid).toBe(false)
    expect(result.error).toContain('name')
  })

  it('rejects invalid name format', () => {
    const result = validateManifest(validManifest({ name: 'My Plugin!' }))
    expect(result.valid).toBe(false)
    expect(result.error).toContain('name')
  })

  it('accepts valid name with hyphens and numbers', () => {
    const result = validateManifest(validManifest({ name: 'my-plugin-2' }))
    expect(result.valid).toBe(true)
  })

  it('rejects invalid semver version', () => {
    const result = validateManifest(validManifest({ version: 'abc' }))
    expect(result.valid).toBe(false)
    expect(result.error).toContain('version')
  })

  it('accepts valid semver version', () => {
    const result = validateManifest(validManifest({ version: '2.1.3' }))
    expect(result.valid).toBe(true)
  })

  it('rejects missing displayName', () => {
    const result = validateManifest(validManifest({ displayName: '' }))
    expect(result.valid).toBe(false)
    expect(result.error).toContain('displayName')
  })

  it('rejects missing description', () => {
    const result = validateManifest(validManifest({ description: '' }))
    expect(result.valid).toBe(false)
    expect(result.error).toContain('description')
  })

  it('rejects missing main', () => {
    const result = validateManifest(validManifest({ main: '' }))
    expect(result.valid).toBe(false)
    expect(result.error).toContain('main')
  })

  it('rejects main not ending in .js', () => {
    const result = validateManifest(validManifest({ main: 'index.ts' }))
    expect(result.valid).toBe(false)
    expect(result.error).toContain('.js')
  })

  it('rejects command contributions missing required fields', () => {
    const result = validateManifest(validManifest({
      contributes: { commands: [{ id: '', title: 'Do Thing' }] }
    }))
    expect(result.valid).toBe(false)
    expect(result.error).toContain('id')
  })

  it('rejects driver contributions missing required fields', () => {
    const result = validateManifest(validManifest({
      contributes: { drivers: [{ id: 'mongo', name: '' }] }
    }))
    expect(result.valid).toBe(false)
    expect(result.error).toContain('name')
  })

  it('rejects panel contributions missing required fields', () => {
    const result = validateManifest(validManifest({
      contributes: { panels: [{ id: 'p', title: '', icon: 'x', location: 'sidebar' }] }
    }))
    expect(result.valid).toBe(false)
    expect(result.error).toContain('title')
  })

  it('accepts valid contributions', () => {
    const result = validateManifest(validManifest({
      contributes: {
        commands: [{ id: 'cmd', title: 'Do Thing' }],
        drivers: [{ id: 'mongo', name: 'MongoDB' }],
        panels: [{ id: 'p', title: 'Panel', icon: 'star', location: 'sidebar' }]
      }
    }))
    expect(result.valid).toBe(true)
  })
})
