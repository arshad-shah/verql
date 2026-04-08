// src/main/plugins/sdk/safe-call.ts
import type { PluginErrorRecord } from './types'

export class PluginError extends Error {
  constructor(
    public readonly pluginName: string,
    public readonly cause: Error
  ) {
    super(`Plugin '${pluginName}': ${cause.message}`)
    this.name = 'PluginError'
  }
}

export async function safeCall<T>(
  pluginName: string,
  fn: () => T | Promise<T>,
  options?: { timeoutMs?: number }
): Promise<T> {
  const timeoutMs = options?.timeoutMs

  try {
    if (timeoutMs == null) {
      return await fn()
    }

    return await new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new PluginError(pluginName, new Error(
          `timed out during operation after ${timeoutMs}ms`
        )))
      }, timeoutMs)

      Promise.resolve(fn())
        .then(result => {
          clearTimeout(timer)
          resolve(result)
        })
        .catch(err => {
          clearTimeout(timer)
          reject(err instanceof PluginError ? err : new PluginError(pluginName, err instanceof Error ? err : new Error(String(err))))
        })
    })
  } catch (err) {
    if (err instanceof PluginError) throw err
    const cause = err instanceof Error ? err : new Error(String(err))
    throw new PluginError(pluginName, cause)
  }
}

export class ErrorBudget {
  private maxErrors: number
  private windowMs: number
  private errors = new Map<string, PluginErrorRecord[]>()

  constructor(options?: { maxErrors?: number; windowMs?: number }) {
    this.maxErrors = options?.maxErrors ?? 5
    this.windowMs = options?.windowMs ?? 60_000
  }

  record(pluginName: string, error: Error): boolean {
    const records = this.errors.get(pluginName) ?? []
    records.push({
      timestamp: Date.now(),
      error: error.message,
      stack: error.stack
    })
    this.errors.set(pluginName, records)
    return this.isExceeded(pluginName)
  }

  isExceeded(pluginName: string): boolean {
    const records = this.errors.get(pluginName) ?? []
    const now = Date.now()
    const recent = records.filter(r => now - r.timestamp < this.windowMs)
    return recent.length >= this.maxErrors
  }

  getErrors(pluginName: string): PluginErrorRecord[] {
    return [...(this.errors.get(pluginName) ?? [])]
  }

  reset(pluginName: string): void {
    this.errors.delete(pluginName)
  }
}
