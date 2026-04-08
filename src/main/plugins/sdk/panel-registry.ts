// src/main/plugins/sdk/panel-registry.ts
import type { Disposable, PanelContribution, PanelRegistry } from './types'

interface PanelEntry {
  id: string
  panel: PanelContribution
}

export class PanelRegistryImpl implements PanelRegistry {
  private panels = new Map<string, PanelContribution>()

  register(id: string, panel: PanelContribution): Disposable {
    if (this.panels.has(id)) {
      throw new Error(`Panel '${id}' is already registered`)
    }
    this.panels.set(id, panel)
    return { dispose: () => { this.panels.delete(id) } }
  }

  get(id: string): PanelContribution | undefined {
    return this.panels.get(id)
  }

  has(id: string): boolean {
    return this.panels.has(id)
  }

  getAll(): PanelEntry[] {
    return [...this.panels.entries()].map(([id, panel]) => ({ id, panel }))
  }

  clear(): void {
    this.panels.clear()
  }
}
