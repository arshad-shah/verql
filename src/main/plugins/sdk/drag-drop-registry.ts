// src/main/plugins/sdk/drag-drop-registry.ts
import type { Disposable } from './types'

export interface DragDropContext {
  filePath: string
  fileName: string
  /** Lowercased extension without dot (e.g. 'sqlite'). */
  extension: string
}

export interface DragDropProvider {
  id: string
  /** Lowercased extensions (without dot) this provider claims. */
  extensions: string[]
  /** Optional MIME types this provider claims. */
  mimeTypes?: string[]
  /** Called when a matching file is dropped onto the app. */
  onDrop(ctx: DragDropContext): void | Promise<void>
  /** Plugin name — set by SDK when registering. */
  source?: string
}

export interface DragDropRegistry {
  register(provider: DragDropProvider): Disposable
  resolveByExtension(ext: string): DragDropProvider | undefined
  getAll(): DragDropProvider[]
}

export class DragDropRegistryImpl implements DragDropRegistry {
  private providers = new Map<string, DragDropProvider>()

  register(provider: DragDropProvider): Disposable {
    if (!provider.id) throw new Error('DragDropProvider requires id')
    this.providers.set(provider.id, provider)
    return { dispose: () => { this.providers.delete(provider.id) } }
  }

  resolveByExtension(ext: string): DragDropProvider | undefined {
    const lower = ext.toLowerCase().replace(/^\./, '')
    for (const p of this.providers.values()) {
      if (p.extensions.map(e => e.toLowerCase()).includes(lower)) return p
    }
    return undefined
  }

  getAll(): DragDropProvider[] {
    return [...this.providers.values()]
  }
}
