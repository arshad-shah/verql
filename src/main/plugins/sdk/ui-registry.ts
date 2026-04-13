import type { Widget, ResolverContext } from '@shared/plugin-ui-types'
import type { Disposable } from './types'

type ChangeListener = () => void
type ResolverFn = (context: ResolverContext) => Promise<{ value: string; label: string }[]>

interface OwnedEntry<T> {
  pluginName: string
  data: T
}

export interface UIRegistry {
  registerPanel(id: string, widgets: Widget[]): Disposable
  registerStatusBar(id: string, widgets: Widget[]): Disposable
  registerTab(id: string, widgets: Widget[]): Disposable
  registerResolver(id: string, resolver: ResolverFn): Disposable
  invalidate(resolverId: string): void
}

export class UIRegistryImpl implements UIRegistry {
  private panels = new Map<string, OwnedEntry<Widget[]>>()
  private statusBars = new Map<string, OwnedEntry<Widget[]>>()
  private tabs = new Map<string, OwnedEntry<Widget[]>>()
  private resolvers = new Map<string, OwnedEntry<ResolverFn>>()
  private listeners = new Set<ChangeListener>()

  // The plugin name is set before each activate() call by the coordinator
  currentPluginName = ''

  registerPanel(id: string, widgets: Widget[]): Disposable {
    this.panels.set(id, { pluginName: this.currentPluginName, data: widgets })
    this.emit()
    return { dispose: () => { this.panels.delete(id); this.emit() } }
  }

  registerStatusBar(id: string, widgets: Widget[]): Disposable {
    this.statusBars.set(id, { pluginName: this.currentPluginName, data: widgets })
    this.emit()
    return { dispose: () => { this.statusBars.delete(id); this.emit() } }
  }

  registerTab(id: string, widgets: Widget[]): Disposable {
    this.tabs.set(id, { pluginName: this.currentPluginName, data: widgets })
    this.emit()
    return { dispose: () => { this.tabs.delete(id); this.emit() } }
  }

  registerResolver(id: string, resolver: ResolverFn): Disposable {
    this.resolvers.set(id, { pluginName: this.currentPluginName, data: resolver })
    this.emit()
    return { dispose: () => { this.resolvers.delete(id); this.emit() } }
  }

  async resolve(resolverId: string, context: ResolverContext): Promise<{ value: string; label: string }[]> {
    const entry = this.resolvers.get(resolverId)
    if (!entry) throw new Error(`Resolver '${resolverId}' not found`)
    return entry.data(context)
  }

  invalidate(_resolverId: string): void {
    this.emit()
  }

  getPanel(id: string): Widget[] | undefined { return this.panels.get(id)?.data }
  getStatusBar(id: string): Widget[] | undefined { return this.statusBars.get(id)?.data }
  getTab(id: string): Widget[] | undefined { return this.tabs.get(id)?.data }

  getAllPanels(): { id: string; pluginName: string; widgets: Widget[] }[] {
    return [...this.panels.entries()].map(([id, entry]) => ({ id, pluginName: entry.pluginName, widgets: entry.data }))
  }
  getAllStatusBars(): { id: string; pluginName: string; widgets: Widget[] }[] {
    return [...this.statusBars.entries()].map(([id, entry]) => ({ id, pluginName: entry.pluginName, widgets: entry.data }))
  }
  getAllTabs(): { id: string; pluginName: string; widgets: Widget[] }[] {
    return [...this.tabs.entries()].map(([id, entry]) => ({ id, pluginName: entry.pluginName, widgets: entry.data }))
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
