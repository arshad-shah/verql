import { useState } from 'react'

/**
 * Collapsible expanded-state hook used by every schema sub-category. Persists its
 * expanded state in localStorage so it survives reloads — keyed by
 * connection+schema+group so different schemas don't share state.
 */
export function useGroupExpanded(storageKey: string, defaultExpanded: boolean) {
  const fullKey = `schema-group:${storageKey}`
  const [expanded, setExpandedState] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(fullKey)
      return raw === null ? defaultExpanded : raw === '1'
    } catch {
      return defaultExpanded
    }
  })
  const setExpanded = (next: boolean) => {
    setExpandedState(next)
    try { localStorage.setItem(fullKey, next ? '1' : '0') } catch { /* quota */ }
  }
  return [expanded, setExpanded] as const
}
