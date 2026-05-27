import type { AIProviderModel } from './types'

/**
 * Picks the cheapest model from a provider's list using each model's
 * `costTier` (0 = cheapest). Models without a tier are treated as most
 * expensive, and ties keep the provider's original ordering. Returns
 * undefined for an empty list.
 */
export function pickCheapestModel(models: AIProviderModel[]): AIProviderModel | undefined {
  let best: AIProviderModel | undefined
  let bestTier = Number.POSITIVE_INFINITY
  for (const model of models) {
    const tier = model.costTier ?? Number.MAX_SAFE_INTEGER
    if (tier < bestTier) {
      best = model
      bestTier = tier
    }
  }
  return best
}
