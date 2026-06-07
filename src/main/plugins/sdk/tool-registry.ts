import type { Disposable, Tool, ToolContext, ToolDefinition, ToolRegistry, ToolResult } from './types'
import { errorMessage } from '@shared/errors'
import { toJsonSchema } from './tool-schema'

/** Optional sink for tool-call activity. Set by the host so executions show up
 *  in the app activity log / Activity panel. Kept generic so the registry
 *  doesn't depend on the activity module. */
export type ToolActivityRecorder = (info: {
  toolId: string
  params: Record<string, unknown>
  success: boolean
  durationMs: number
  error?: string
}) => void

export class ToolRegistryImpl implements ToolRegistry {
  private tools = new Map<string, Tool>()
  private changeListeners = new Set<() => void>()
  private activityRecorder?: ToolActivityRecorder

  /** Install a recorder invoked after every execute() (success or failure). */
  setActivityRecorder(recorder: ToolActivityRecorder | undefined): void {
    this.activityRecorder = recorder
  }

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
    if (!this.activityRecorder) return tool.execute(params, ctx)

    const start = Date.now()
    try {
      const result = await tool.execute(params, ctx)
      this.activityRecorder({ toolId: id, params, success: result.success, durationMs: Date.now() - start })
      return result
    } catch (err) {
      this.activityRecorder({
        toolId: id, params, success: false, durationMs: Date.now() - start,
        error: errorMessage(err),
      })
      throw err
    }
  }

  onChange(cb: () => void): Disposable {
    this.changeListeners.add(cb)
    return { dispose: () => { this.changeListeners.delete(cb) } }
  }

  private emitChange(): void {
    for (const cb of this.changeListeners) cb()
  }
}
