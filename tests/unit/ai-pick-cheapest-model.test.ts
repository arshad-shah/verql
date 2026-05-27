import { describe, it, expect } from 'vitest'
import { pickCheapestModel } from '../../src/main/plugins/bundled/ai/internal/pick-cheapest-model'
import type { AIProviderModel } from '../../src/main/plugins/bundled/ai/internal/types'

const m = (id: string, costTier?: number): AIProviderModel => ({
  id, name: id, contextWindow: 4096, capabilities: ['chat'], ...(costTier !== undefined ? { costTier } : {})
})

describe('pickCheapestModel', () => {
  it('returns undefined for an empty list', () => {
    expect(pickCheapestModel([])).toBeUndefined()
  })

  it('picks the model with the lowest cost tier', () => {
    const models = [m('opus', 2), m('haiku', 0), m('sonnet', 1)]
    expect(pickCheapestModel(models)?.id).toBe('haiku')
  })

  it('breaks ties by original order (stable)', () => {
    const models = [m('a', 0), m('b', 0)]
    expect(pickCheapestModel(models)?.id).toBe('a')
  })

  it('treats models without a cost tier as most expensive', () => {
    const models = [m('unknown'), m('cheap', 0)]
    expect(pickCheapestModel(models)?.id).toBe('cheap')
  })

  it('falls back to the first model when no tiers are known', () => {
    const models = [m('first'), m('second')]
    expect(pickCheapestModel(models)?.id).toBe('first')
  })
})
