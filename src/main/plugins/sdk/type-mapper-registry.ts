import type { Disposable } from './types'

export interface TypeMappingEntry {
  target: string
  lossy: boolean
  note?: string
}

export interface TypeMapping {
  source: string
  target: string
  lossy: boolean
  note?: string
}

export type TypeMappingFallback = (normalizedSource: string) => TypeMappingEntry | undefined

interface DirectionEntry {
  table: Record<string, TypeMappingEntry>
  fallback?: TypeMappingFallback
}

export interface TypeMapperRegistry {
  register(
    from: string,
    to: string,
    table: Record<string, TypeMappingEntry>,
    fallback?: TypeMappingFallback
  ): Disposable
  resolve(from: string, to: string, source: string): TypeMapping | undefined
}

/**
 * Driver plugins register type translation tables here. The orchestrator then
 * looks up a mapping by (from, to) without ever needing to know that "MySQL
 * uses BIGINT for bigint" or that "SQLite has no DATE". Adding a new driver
 * means registering its own mapping tables — no edits to core code.
 */
export class TypeMapperRegistryImpl implements TypeMapperRegistry {
  // Outer key: 'from'. Inner key: 'to'.
  private mappers = new Map<string, Map<string, DirectionEntry>>()

  register(
    from: string,
    to: string,
    table: Record<string, TypeMappingEntry>,
    fallback?: TypeMappingFallback
  ): Disposable {
    let inner = this.mappers.get(from)
    if (!inner) {
      inner = new Map()
      this.mappers.set(from, inner)
    }
    if (inner.has(to)) {
      throw new Error(`Type mapper '${from}'→'${to}' is already registered`)
    }
    inner.set(to, { table: { ...table }, fallback })
    return {
      dispose: () => {
        const m = this.mappers.get(from)
        if (m) {
          m.delete(to)
          if (m.size === 0) this.mappers.delete(from)
        }
      }
    }
  }

  resolve(from: string, to: string, source: string): TypeMapping | undefined {
    if (from === to) {
      return { source, target: source, lossy: false }
    }
    const direction = this.mappers.get(from)?.get(to)
    if (!direction) return undefined
    const normalized = source.toLowerCase().trim()
    const entry = direction.table[normalized] ?? direction.fallback?.(normalized)
    if (!entry) return undefined
    return { source, target: entry.target, lossy: entry.lossy, note: entry.note }
  }
}
