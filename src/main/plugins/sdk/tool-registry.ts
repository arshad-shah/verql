import type { Disposable, Tool, ToolContext, ToolDefinition, ToolRegistry, ToolResult } from './types'
import { toJsonSchema } from './tool-schema'

export class ToolRegistryImpl implements ToolRegistry {
  private tools = new Map<string, Tool>()
  private changeListeners = new Set<() => void>()

  /**
   * Registers a tool. Tool ids are a flat, un-namespaced space (the id is the
   * literal name an MCP client / LLM calls, e.g. `query`), so registering an id
   * that already exists is last-wins: the newer tool replaces the older one
   * rather than throwing. Callers that need uniqueness must coordinate ids.
   */
  register(tool: Tool): Disposable {
    this.tools.set(tool.id, tool)
    this.emitChange()
    return { dispose: () => this.unregister(tool.id) }
  }

  unregister(id: string): void {
    if (this.tools.delete(id)) this.emitChange()
  }

  get(id: string): Tool | undefined {
    return this.tools.get(id)
  }

  list(): Tool[] {
    return [...this.tools.values()]
  }

  getToolDefinitions(): ToolDefinition[] {
    return this.list().map(t => ({
      name: t.id,
      description: t.description,
      parameters: t.inputSchema
    }))
  }

  async execute(id: string, params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
    const tool = this.tools.get(id)
    if (!tool) throw new Error(`Unknown tool: ${id}`)
    return tool.execute(params, ctx)
  }

  onChange(cb: () => void): Disposable {
    this.changeListeners.add(cb)
    return { dispose: () => { this.changeListeners.delete(cb) } }
  }

  private emitChange(): void {
    for (const cb of this.changeListeners) cb()
  }
}
