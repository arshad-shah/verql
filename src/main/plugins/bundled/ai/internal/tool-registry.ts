import type { AITool, AIToolContext, AIToolExecutionResult, AIToolDefinition } from './types'

export class AIToolRegistry {
  private tools = new Map<string, AITool>()

  register(tool: AITool): void {
    this.tools.set(tool.id, tool)
  }

  unregister(id: string): void {
    this.tools.delete(id)
  }

  get(id: string): AITool | undefined {
    return this.tools.get(id)
  }

  list(): AITool[] {
    return [...this.tools.values()]
  }

  getToolDefinitions(): AIToolDefinition[] {
    return this.list().map(t => ({
      name: t.id,
      description: t.description,
      parameters: t.parameters
    }))
  }

  async execute(
    toolId: string,
    params: Record<string, unknown>,
    context: AIToolContext
  ): Promise<AIToolExecutionResult> {
    const tool = this.tools.get(toolId)
    if (!tool) throw new Error(`Unknown AI tool: ${toolId}`)
    return tool.execute(params, context)
  }
}
