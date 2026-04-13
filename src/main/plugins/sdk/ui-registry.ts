import type { Widget, ResolverContext } from '@shared/plugin-ui-types'
import type { Disposable } from './types'

type ChangeListener = () => void
type ResolverFn = (context: ResolverContext) => Promise<{ value: string; label: string }[]>

export interface UIRegistry {
  registerPanel(id: string, widgets: Widget[]): Disposable
  registerStatusBar(id: string, widgets: Widget[]): Disposable
  registerTab(id: string, widgets: Widget[]): Disposable
  registerResolver(id: string, resolver: ResolverFn): Disposable
  invalidate(resolverId: string): void
}

export class UIRegistryImpl implements UIRegistry {
  private panels = new Map<string, Widget[]>()
  private statusBars = new Map<string, Widget[]>()
  private tabs = new Map<string, Widget[]>()
  private resolvers = new Map<string, ResolverFn>()
  private listeners = new Set<ChangeListener>()

  registerPanel(id: string, widgets: Widget[]): Disposable {
    this.panels.set(id, widgets)
    this.emit()
    return { dispose: () => { this.panels.delete(id); this.emit() } }
  }

  registerStatusBar(id: string, widgets: Widget[]): Disposable {
    this.statusBars.set(id, widgets)
    this.emit()
    return { dispose: () => { this.statusBars.delete(id); this.emit() } }
  }

  registerTab(id: string, widgets: Widget[]): Disposable {
    this.tabs.set(id, widgets)
    this.emit()
    return { dispose: () => { this.tabs.delete(id); this.emit() } }
  }

  registerResolver(id: string, resolver: ResolverFn): Disposable {
    this.resolvers.set(id, resolver)
    this.emit()
    return { dispose: () => { this.resolvers.delete(id); this.emit() } }
  }

  async resolve(resolverId: string, context: ResolverContext): Promise<{ value: string; label: string }[]> {
    const resolver = this.resolvers.get(resolverId)
    if (!resolver) throw new Error(`Resolver '${resolverId}' not found`)
    return resolver(context)
  }

  invalidate(_resolverId: string): void {
    this.emit()
  }

  getPanel(id: string): Widget[] | undefined { return this.panels.get(id) }
  getStatusBar(id: string): Widget[] | undefined { return this.statusBars.get(id) }
  getTab(id: string): Widget[] | undefined { return this.tabs.get(id) }
  getAllPanels(): { id: string; widgets: Widget[] }[] {
    return [...this.panels.entries()].map(([id, widgets]) => ({ id, widgets }))
  }
  getAllStatusBars(): { id: string; widgets: Widget[] }[] {
    return [...this.statusBars.entries()].map(([id, widgets]) => ({ id, widgets }))
  }
  getAllTabs(): { id: string; widgets: Widget[] }[] {
    return [...this.tabs.entries()].map(([id, widgets]) => ({ id, widgets }))
  }
  hasResolver(id: string): boolean { return this.resolvers.has(id) }

  onChange(listener: ChangeListener): Disposable {
    this.listeners.add(listener)
    return { dispose: () => { this.listeners.delete(listener) } }
  }

  clear(): void {
    this.panels.clear()
    this.statusBars.clear()
    this.tabs.clear()
    this.resolvers.clear()
    this.emit()
  }

  private emit(): void {
    for (const listener of this.listeners) listener()
  }
}
