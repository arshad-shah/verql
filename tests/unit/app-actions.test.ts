import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseActionHref } from '../../src/renderer/src/lib/app-actions/parse'
import { AppActionRegistry } from '../../src/renderer/src/lib/app-actions/registry'
import type { AppAction } from '../../src/renderer/src/lib/app-actions/types'

describe('parseActionHref', () => {
  it('parses an action href with params', () => {
    expect(parseActionHref('verql://action/open-settings?category=ai')).toEqual({
      id: 'open-settings',
      params: { category: 'ai' }
    })
  })

  it('parses an action href with no params', () => {
    expect(parseActionHref('verql://action/open-connections-panel')).toEqual({
      id: 'open-connections-panel',
      params: {}
    })
  })

  it('decodes encoded param values', () => {
    const parsed = parseActionHref('verql://action/new-query-tab?sql=SELECT%20*%20FROM%20users')
    expect(parsed?.params.sql).toBe('SELECT * FROM users')
  })

  it('returns null for non-verql hrefs', () => {
    expect(parseActionHref('https://example.com')).toBeNull()
    expect(parseActionHref('verql://something-else/foo')).toBeNull()
    expect(parseActionHref('')).toBeNull()
  })
})

describe('AppActionRegistry', () => {
  let registry: AppActionRegistry

  const navAction: AppAction = {
    id: 'open-settings', title: 'Open Settings', description: 'Open settings',
    kind: 'navigation', run: vi.fn()
  }

  beforeEach(() => {
    registry = new AppActionRegistry()
    vi.clearAllMocks()
  })

  it('registers and retrieves an action', () => {
    registry.register(navAction)
    expect(registry.get('open-settings')).toBe(navAction)
    expect(registry.list()).toContain(navAction)
  })

  it('unregisters via the returned disposer', () => {
    const dispose = registry.register(navAction)
    dispose()
    expect(registry.get('open-settings')).toBeUndefined()
  })

  it('runs an action with params', async () => {
    registry.register(navAction)
    await registry.run('open-settings', { category: 'ai' })
    expect(navAction.run).toHaveBeenCalledWith({ category: 'ai' })
  })

  it('throws when running an unknown action', async () => {
    await expect(registry.run('nope')).rejects.toThrow(/unknown/i)
  })

  it('describes the catalog for the system prompt', () => {
    registry.register(navAction)
    const text = registry.describeForPrompt()
    expect(text).toContain('open-settings')
    expect(text).toContain('Open settings')
  })
})
