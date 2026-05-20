// src/main/plugins/sdk/ai-access.ts
//
// AIAccess is now a thin proxy backed by the generic ServiceRegistry. The AI
// plugin's activate() provides the 'ai' service; any other plugin's tool /
// provider / context-provider registrations are forwarded to it, or buffered
// via services.onAvailable until the AI plugin activates. This means plugin
// activation order doesn't matter and the AI plugin can be disabled at runtime
// without leaving zombie registrations behind.
import type { Disposable } from './types'
import type { ServiceRegistry } from './service-registry'

// Re-export the AI types under stable SDK paths so plugins don't reach into
// another plugin's internals directly.
export type { AITool, AIContextProvider, AIProvider } from '../bundled/ai/internal/types'
import type { AITool, AIContextProvider, AIProvider } from '../bundled/ai/internal/types'

export const AI_SERVICE_ID = 'ai'

export interface AIService {
  registerTool(tool: AITool): Disposable
  registerProvider(provider: AIProvider): Disposable
  registerContextProvider(provider: AIContextProvider): Disposable
}

export interface AIAccess extends AIService {}

/** A noop Disposable used while a registration is buffered. Replaced once the
 *  AI service shows up and the real registration returns its own Disposable. */
function pendingDisposable(): { dispose: () => void; replace: (d: Disposable) => void } {
  let real: Disposable | null = null
  let disposed = false
  return {
    dispose: () => {
      disposed = true
      if (real) real.dispose()
    },
    replace: (d) => {
      if (disposed) d.dispose()
      else real = d
    }
  }
}

export function createAIAccess(services: ServiceRegistry): AIAccess {
  const forward = (
    apply: (svc: AIService) => Disposable,
    immediate: AIService | null
  ): Disposable => {
    if (immediate) return apply(immediate)
    const pending = pendingDisposable()
    services.onAvailable<AIService>(AI_SERVICE_ID, (svc) => {
      pending.replace(apply(svc))
    })
    return { dispose: pending.dispose }
  }

  return {
    registerTool(tool) {
      return forward(
        (svc) => svc.registerTool(tool),
        services.consume<AIService>(AI_SERVICE_ID)
      )
    },
    registerProvider(provider) {
      return forward(
        (svc) => svc.registerProvider(provider),
        services.consume<AIService>(AI_SERVICE_ID)
      )
    },
    registerContextProvider(provider) {
      return forward(
        (svc) => svc.registerContextProvider(provider),
        services.consume<AIService>(AI_SERVICE_ID)
      )
    }
  }
}
