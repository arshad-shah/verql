# AI Foundation & Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the AI foundation layer and bundled AI plugin that enables natural language database interaction with provider-agnostic LLM support and tiered permissions.

**Architecture:** A core AI module (`src/main/ai/`) provides provider registry, tool registry, permission management, and conversation orchestration. A bundled plugin (`src/main/plugins/bundled/ai/`) registers tools, commands, and context menus. The renderer gets a Zustand store and chat panel components. All communication flows through typed IPC channels.

**Tech Stack:** TypeScript, Electron IPC, Zustand, React 19, OpenAI SDK, Anthropic SDK, existing plugin SDK

---

## File Structure

```
# New files
shared/ai-types.ts                              # Shared AI types for IPC
src/main/ai/types.ts                            # Main-process AI types (provider, tool, etc.)
src/main/ai/provider-registry.ts                # AIProviderRegistry
src/main/ai/tool-registry.ts                    # AIToolRegistry  
src/main/ai/permission-manager.ts               # Tiered permission enforcement
src/main/ai/conversation-manager.ts             # Context assembly + streaming orchestration
src/main/ai/providers/openai.ts                 # OpenAI adapter
src/main/ai/providers/anthropic.ts              # Anthropic adapter
src/main/ai/providers/ollama.ts                 # Ollama adapter
src/main/ai/index.ts                            # AI module entry, wires everything
src/main/plugins/sdk/ai-access.ts               # ctx.ai namespace for plugins
src/main/plugins/bundled/ai/index.ts            # AI plugin activate()
src/main/plugins/bundled/ai/tools/schema-tools.ts  # Schema read tools
src/main/plugins/bundled/ai/tools/query-tools.ts   # Query tools
src/renderer/src/stores/ai.ts                   # Zustand AI store
src/renderer/src/components/ai/ChatPanel.tsx     # Main chat panel
src/renderer/src/components/ai/MessageThread.tsx # Message list
src/renderer/src/components/ai/MessageBubble.tsx # Single message
src/renderer/src/components/ai/ToolCallCard.tsx  # Tool call display
src/renderer/src/components/ai/ApprovalCard.tsx  # Write action approval
src/renderer/src/components/ai/ChatInput.tsx     # Input bar

# Modified files
shared/ipc.ts                                   # Add AI IPC channels
src/main/ipc-handlers.ts                        # Register AI IPC handlers, wire AI module
src/main/plugins/sdk/types.ts                   # Add AIAccess to PluginContext
src/main/plugins/sdk/index.ts                   # Wire ctx.ai in createPluginContext
src/main/plugins/plugin-host.ts                 # Pass AI registries to context deps
```

---

### Task 1: Shared AI Types

**Files:**
- Create: `shared/ai-types.ts`
- Test: `tests/unit/ai-types.test.ts`

- [ ] **Step 1: Write the shared AI types file**

```typescript
// shared/ai-types.ts

export interface AIChatMessage {
  id: string
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  toolCalls?: AIToolCallRequest[]
  toolCallId?: string
  timestamp: number
}

export interface AIToolCallRequest {
  id: string
  name: string
  arguments: string // JSON string
}

export interface AIChatChunk {
  type: 'text' | 'tool-call' | 'done' | 'error'
  content?: string
  toolCall?: AIToolCallRequest
  error?: string
}

export interface AIApprovalRequest {
  requestId: string
  toolName: string
  toolDescription: string
  parameters: Record<string, unknown>
  display: string // Human-readable preview
}

export interface AIToolCallResult {
  toolCallId: string
  toolName: string
  success: boolean
  data: unknown
  display?: string
}

export type AIStreamEvent =
  | { type: 'chunk'; content: string }
  | { type: 'tool-call'; toolCall: AIToolCallRequest }
  | { type: 'tool-result'; result: AIToolCallResult }
  | { type: 'approval-request'; request: AIApprovalRequest }
  | { type: 'done' }
  | { type: 'error'; error: string }

export interface AIModelInfo {
  id: string
  name: string
  contextWindow: number
  capabilities: ('chat' | 'tool-calling')[]
}

export interface AIProviderInfo {
  id: string
  name: string
}

export interface AIChatStartRequest {
  message: string
  connectionId?: string
}
```

- [ ] **Step 2: Write a type-check test**

```typescript
// tests/unit/ai-types.test.ts
import { describe, it, expect } from 'vitest'
import type {
  AIChatMessage,
  AIChatChunk,
  AIApprovalRequest,
  AIStreamEvent,
  AIModelInfo,
  AIProviderInfo,
  AIChatStartRequest,
  AIToolCallResult
} from '@shared/ai-types'

describe('AI types', () => {
  it('constructs a valid AIChatMessage', () => {
    const msg: AIChatMessage = {
      id: '1',
      role: 'user',
      content: 'Hello',
      timestamp: Date.now()
    }
    expect(msg.role).toBe('user')
    expect(msg.content).toBe('Hello')
  })

  it('constructs a valid AIChatChunk', () => {
    const chunk: AIChatChunk = { type: 'text', content: 'Hello' }
    expect(chunk.type).toBe('text')
  })

  it('constructs a valid AIStreamEvent', () => {
    const events: AIStreamEvent[] = [
      { type: 'chunk', content: 'hi' },
      { type: 'tool-call', toolCall: { id: '1', name: 'test', arguments: '{}' } },
      { type: 'tool-result', result: { toolCallId: '1', toolName: 'test', success: true, data: null } },
      { type: 'approval-request', request: { requestId: '1', toolName: 'test', toolDescription: '', parameters: {}, display: '' } },
      { type: 'done' },
      { type: 'error', error: 'fail' }
    ]
    expect(events).toHaveLength(6)
  })

  it('constructs valid AIModelInfo and AIProviderInfo', () => {
    const model: AIModelInfo = { id: 'gpt-4', name: 'GPT-4', contextWindow: 128000, capabilities: ['chat', 'tool-calling'] }
    const provider: AIProviderInfo = { id: 'openai', name: 'OpenAI' }
    expect(model.capabilities).toContain('chat')
    expect(provider.id).toBe('openai')
  })
})
```

- [ ] **Step 3: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/ai-types.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add shared/ai-types.ts tests/unit/ai-types.test.ts
git commit -m "feat(ai): add shared AI types for IPC communication"
```

---

### Task 2: AI IPC Channel Definitions

**Files:**
- Modify: `shared/ipc.ts`

- [ ] **Step 1: Add AI channels to IpcChannelMap**

Add the following entries to the `IpcChannelMap` interface in `shared/ipc.ts`:

```typescript
// At the top, add the import:
import type { AIChatStartRequest, AIStreamEvent, AIProviderInfo, AIModelInfo } from './ai-types'

// Inside IpcChannelMap, add:

  // ─── AI ─────────────────────────────────────────────────────────────────────
  'ai:chat:start': {
    args: [request: AIChatStartRequest]
    return: { streamId: string }
  }
  'ai:chat:abort': {
    args: [streamId: string]
    return: void
  }
  'ai:chat:approval-response': {
    args: [requestId: string, approved: boolean]
    return: void
  }
  'ai:providers:list': {
    args: []
    return: AIProviderInfo[]
  }
  'ai:providers:set-active': {
    args: [providerId: string]
    return: void
  }
  'ai:providers:get-active': {
    args: []
    return: AIProviderInfo | null
  }
  'ai:models:list': {
    args: []
    return: AIModelInfo[]
  }
  'ai:models:set-active': {
    args: [modelId: string]
    return: void
  }
  'ai:models:get-active': {
    args: []
    return: string | null
  }
  'ai:messages:list': {
    args: []
    return: import('./ai-types').AIChatMessage[]
  }
  'ai:messages:clear': {
    args: []
    return: void
  }
  'ai:tools:list': {
    args: []
    return: { id: string; name: string; description: string; permission: 'read' | 'write' }[]
  }
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to `shared/ipc.ts`

- [ ] **Step 3: Commit**

```bash
git add shared/ipc.ts
git commit -m "feat(ai): add AI IPC channel definitions"
```

---

### Task 3: Main-Process AI Types

**Files:**
- Create: `src/main/ai/types.ts`
- Test: `tests/unit/ai-main-types.test.ts`

- [ ] **Step 1: Write the main-process AI types**

```typescript
// src/main/ai/types.ts
import type { AIChatMessage, AIToolCallRequest } from '@shared/ai-types'

// ─── Provider ────────────────────────────────────────────────────────────────

export interface AIProvider {
  id: string
  name: string
  models(): Promise<AIProviderModel[]>
  chat(request: AIProviderChatRequest): AsyncIterable<AIProviderChunk>
  supportsToolCalling: boolean
}

export interface AIProviderModel {
  id: string
  name: string
  contextWindow: number
  capabilities: ('chat' | 'tool-calling')[]
}

export interface AIProviderChatRequest {
  model: string
  messages: AIChatMessage[]
  tools?: AIToolDefinition[]
  signal?: AbortSignal
}

export interface AIToolDefinition {
  name: string
  description: string
  parameters: Record<string, unknown> // JSON Schema
}

export interface AIProviderChunk {
  type: 'text' | 'tool-call' | 'done' | 'error'
  content?: string
  toolCall?: AIToolCallRequest
  error?: string
}

// ─── Tool ────────────────────────────────────────────────────────────────────

export interface AITool {
  id: string
  name: string
  description: string
  parameters: Record<string, unknown> // JSON Schema
  permission: 'read' | 'write'
  execute(params: Record<string, unknown>, context: AIToolContext): Promise<AIToolExecutionResult>
}

export interface AIToolContext {
  connectionId: string | null
  abortSignal: AbortSignal
}

export interface AIToolExecutionResult {
  success: boolean
  data: unknown
  display?: string
}

// ─── Context Provider ────────────────────────────────────────────────────────

export interface AIContextProvider {
  id: string
  appliesTo(connectionId: string): boolean
  getContext(connectionId: string): Promise<string>
}
```

- [ ] **Step 2: Write a type-check test**

```typescript
// tests/unit/ai-main-types.test.ts
import { describe, it, expect } from 'vitest'
import type { AIProvider, AITool, AIContextProvider } from '../../src/main/ai/types'

describe('AI main-process types', () => {
  it('AITool has required fields', () => {
    const tool: AITool = {
      id: 'schema.listTables',
      name: 'List Tables',
      description: 'List all tables',
      parameters: { type: 'object', properties: {} },
      permission: 'read',
      execute: async () => ({ success: true, data: [] })
    }
    expect(tool.permission).toBe('read')
  })

  it('AIContextProvider has correct shape', () => {
    const provider: AIContextProvider = {
      id: 'test',
      appliesTo: () => true,
      getContext: async () => 'test context'
    }
    expect(provider.appliesTo('any')).toBe(true)
  })
})
```

- [ ] **Step 3: Run test**

Run: `pnpm test -- --run tests/unit/ai-main-types.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/main/ai/types.ts tests/unit/ai-main-types.test.ts
git commit -m "feat(ai): add main-process AI types (provider, tool, context)"
```

---

### Task 4: Provider Registry

**Files:**
- Create: `src/main/ai/provider-registry.ts`
- Test: `tests/unit/ai-provider-registry.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/ai-provider-registry.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { AIProviderRegistry } from '../../src/main/ai/provider-registry'
import type { AIProvider } from '../../src/main/ai/types'

function createMockProvider(id: string, name: string): AIProvider {
  return {
    id,
    name,
    supportsToolCalling: true,
    models: async () => [{ id: 'model-1', name: 'Model 1', contextWindow: 4096, capabilities: ['chat'] as const }],
    async *chat() { yield { type: 'done' as const } }
  }
}

describe('AIProviderRegistry', () => {
  let registry: AIProviderRegistry

  beforeEach(() => {
    registry = new AIProviderRegistry()
  })

  it('registers and retrieves a provider', () => {
    const provider = createMockProvider('openai', 'OpenAI')
    registry.register(provider)
    expect(registry.get('openai')).toBe(provider)
  })

  it('lists all providers', () => {
    registry.register(createMockProvider('openai', 'OpenAI'))
    registry.register(createMockProvider('anthropic', 'Anthropic'))
    expect(registry.list()).toHaveLength(2)
  })

  it('unregisters a provider', () => {
    registry.register(createMockProvider('openai', 'OpenAI'))
    registry.unregister('openai')
    expect(registry.get('openai')).toBeUndefined()
  })

  it('sets and gets active provider', () => {
    const provider = createMockProvider('openai', 'OpenAI')
    registry.register(provider)
    registry.setActive('openai')
    expect(registry.getActive()).toBe(provider)
  })

  it('returns null for active when none set', () => {
    expect(registry.getActive()).toBeNull()
  })

  it('throws when setting active to unknown provider', () => {
    expect(() => registry.setActive('unknown')).toThrow('Unknown AI provider: unknown')
  })

  it('sets and gets active model', () => {
    registry.setActiveModel('gpt-4o')
    expect(registry.getActiveModel()).toBe('gpt-4o')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/ai-provider-registry.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/main/ai/provider-registry.ts
import type { AIProvider } from './types'

export class AIProviderRegistry {
  private providers = new Map<string, AIProvider>()
  private activeId: string | null = null
  private activeModelId: string | null = null

  register(provider: AIProvider): void {
    this.providers.set(provider.id, provider)
  }

  unregister(id: string): void {
    this.providers.delete(id)
    if (this.activeId === id) this.activeId = null
  }

  get(id: string): AIProvider | undefined {
    return this.providers.get(id)
  }

  list(): AIProvider[] {
    return [...this.providers.values()]
  }

  setActive(id: string): void {
    if (!this.providers.has(id)) throw new Error(`Unknown AI provider: ${id}`)
    this.activeId = id
  }

  getActive(): AIProvider | null {
    if (!this.activeId) return null
    return this.providers.get(this.activeId) ?? null
  }

  setActiveModel(modelId: string): void {
    this.activeModelId = modelId
  }

  getActiveModel(): string | null {
    return this.activeModelId
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/ai-provider-registry.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/ai/provider-registry.ts tests/unit/ai-provider-registry.test.ts
git commit -m "feat(ai): implement AIProviderRegistry"
```

---

### Task 5: Tool Registry

**Files:**
- Create: `src/main/ai/tool-registry.ts`
- Test: `tests/unit/ai-tool-registry.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/ai-tool-registry.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AIToolRegistry } from '../../src/main/ai/tool-registry'
import type { AITool } from '../../src/main/ai/types'

function createMockTool(id: string, permission: 'read' | 'write' = 'read'): AITool {
  return {
    id,
    name: id,
    description: `Tool ${id}`,
    parameters: { type: 'object', properties: {} },
    permission,
    execute: vi.fn(async () => ({ success: true, data: `result-${id}` }))
  }
}

describe('AIToolRegistry', () => {
  let registry: AIToolRegistry

  beforeEach(() => {
    registry = new AIToolRegistry()
  })

  it('registers and retrieves a tool', () => {
    const tool = createMockTool('schema.listTables')
    registry.register(tool)
    expect(registry.get('schema.listTables')).toBe(tool)
  })

  it('lists all tools', () => {
    registry.register(createMockTool('tool-a'))
    registry.register(createMockTool('tool-b'))
    expect(registry.list()).toHaveLength(2)
  })

  it('unregisters a tool', () => {
    registry.register(createMockTool('tool-a'))
    registry.unregister('tool-a')
    expect(registry.get('tool-a')).toBeUndefined()
  })

  it('returns tool definitions for LLM', () => {
    registry.register(createMockTool('schema.listTables'))
    const defs = registry.getToolDefinitions()
    expect(defs).toEqual([{
      name: 'schema.listTables',
      description: 'Tool schema.listTables',
      parameters: { type: 'object', properties: {} }
    }])
  })

  it('executes a tool', async () => {
    const tool = createMockTool('schema.listTables')
    registry.register(tool)
    const result = await registry.execute('schema.listTables', {}, {
      connectionId: 'conn-1',
      abortSignal: new AbortController().signal
    })
    expect(result.success).toBe(true)
    expect(result.data).toBe('result-schema.listTables')
  })

  it('throws when executing unknown tool', async () => {
    await expect(
      registry.execute('unknown', {}, { connectionId: null, abortSignal: new AbortController().signal })
    ).rejects.toThrow('Unknown AI tool: unknown')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/ai-tool-registry.test.ts`
Expected: FAIL

- [ ] **Step 3: Write the implementation**

```typescript
// src/main/ai/tool-registry.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/ai-tool-registry.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/ai/tool-registry.ts tests/unit/ai-tool-registry.test.ts
git commit -m "feat(ai): implement AIToolRegistry"
```

---

### Task 6: Permission Manager

**Files:**
- Create: `src/main/ai/permission-manager.ts`
- Test: `tests/unit/ai-permission-manager.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/ai-permission-manager.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PermissionManager } from '../../src/main/ai/permission-manager'
import type { AITool } from '../../src/main/ai/types'

function makeTool(id: string, permission: 'read' | 'write'): AITool {
  return {
    id, name: id, description: '', parameters: {},
    permission,
    execute: vi.fn(async () => ({ success: true, data: null }))
  }
}

describe('PermissionManager', () => {
  let pm: PermissionManager

  beforeEach(() => {
    pm = new PermissionManager()
  })

  it('auto-approves read tools', () => {
    expect(pm.needsApproval(makeTool('schema.list', 'read'))).toBe(false)
  })

  it('requires approval for write tools', () => {
    expect(pm.needsApproval(makeTool('query.execute', 'write'))).toBe(true)
  })

  it('allows per-tool overrides to promote write to auto-approve', () => {
    pm.setOverride('query.execute', 'read')
    expect(pm.needsApproval(makeTool('query.execute', 'write'))).toBe(false)
  })

  it('allows per-tool overrides to demote read to require approval', () => {
    pm.setOverride('schema.list', 'write')
    expect(pm.needsApproval(makeTool('schema.list', 'read'))).toBe(true)
  })

  it('removes override', () => {
    pm.setOverride('query.execute', 'read')
    pm.removeOverride('query.execute')
    expect(pm.needsApproval(makeTool('query.execute', 'write'))).toBe(true)
  })

  it('tracks pending approvals', () => {
    const requestId = pm.createApprovalRequest('query.execute', { sql: 'DROP TABLE x' }, 'Run: DROP TABLE x')
    expect(pm.hasPendingApproval(requestId)).toBe(true)
  })

  it('resolves approval', async () => {
    const requestId = pm.createApprovalRequest('query.execute', {}, '')
    const promise = pm.waitForApproval(requestId)
    pm.resolveApproval(requestId, true)
    expect(await promise).toBe(true)
  })

  it('resolves rejection', async () => {
    const requestId = pm.createApprovalRequest('query.execute', {}, '')
    const promise = pm.waitForApproval(requestId)
    pm.resolveApproval(requestId, false)
    expect(await promise).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/ai-permission-manager.test.ts`
Expected: FAIL

- [ ] **Step 3: Write the implementation**

```typescript
// src/main/ai/permission-manager.ts
import type { AITool } from './types'
import { randomUUID } from 'crypto'

interface PendingApproval {
  requestId: string
  toolId: string
  params: Record<string, unknown>
  display: string
  resolve: (approved: boolean) => void
}

export class PermissionManager {
  private overrides = new Map<string, 'read' | 'write'>()
  private pending = new Map<string, PendingApproval>()

  needsApproval(tool: AITool): boolean {
    const effective = this.overrides.get(tool.id) ?? tool.permission
    return effective === 'write'
  }

  setOverride(toolId: string, permission: 'read' | 'write'): void {
    this.overrides.set(toolId, permission)
  }

  removeOverride(toolId: string): void {
    this.overrides.delete(toolId)
  }

  createApprovalRequest(
    toolId: string,
    params: Record<string, unknown>,
    display: string
  ): string {
    const requestId = randomUUID()
    // Store without resolve — it gets set when waitForApproval is called
    this.pending.set(requestId, { requestId, toolId, params, display, resolve: () => {} })
    return requestId
  }

  hasPendingApproval(requestId: string): boolean {
    return this.pending.has(requestId)
  }

  waitForApproval(requestId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const entry = this.pending.get(requestId)
      if (!entry) {
        resolve(false)
        return
      }
      entry.resolve = resolve
    })
  }

  resolveApproval(requestId: string, approved: boolean): void {
    const entry = this.pending.get(requestId)
    if (entry) {
      entry.resolve(approved)
      this.pending.delete(requestId)
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/ai-permission-manager.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/ai/permission-manager.ts tests/unit/ai-permission-manager.test.ts
git commit -m "feat(ai): implement PermissionManager with tiered approval"
```

---

### Task 7: Conversation Manager

**Files:**
- Create: `src/main/ai/conversation-manager.ts`
- Test: `tests/unit/ai-conversation-manager.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/ai-conversation-manager.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ConversationManager } from '../../src/main/ai/conversation-manager'
import type { AIProvider } from '../../src/main/ai/types'
import { AIProviderRegistry } from '../../src/main/ai/provider-registry'
import { AIToolRegistry } from '../../src/main/ai/tool-registry'
import { PermissionManager } from '../../src/main/ai/permission-manager'
import type { AIChatMessage, AIStreamEvent } from '@shared/ai-types'

function createMockProvider(chunks: Array<{ type: string; content?: string }>): AIProvider {
  return {
    id: 'mock',
    name: 'Mock',
    supportsToolCalling: false,
    models: async () => [{ id: 'mock-1', name: 'Mock', contextWindow: 4096, capabilities: ['chat'] as const }],
    async *chat() {
      for (const chunk of chunks) {
        yield chunk as any
      }
    }
  }
}

describe('ConversationManager', () => {
  let providerRegistry: AIProviderRegistry
  let toolRegistry: AIToolRegistry
  let permissionManager: PermissionManager
  let manager: ConversationManager

  beforeEach(() => {
    providerRegistry = new AIProviderRegistry()
    toolRegistry = new AIToolRegistry()
    permissionManager = new PermissionManager()
    manager = new ConversationManager({
      providerRegistry,
      toolRegistry,
      permissionManager,
      getSchemaContext: async () => 'Tables: users, orders',
      getConnectionId: () => 'conn-1'
    })
  })

  it('starts with empty messages', () => {
    expect(manager.getMessages()).toEqual([])
  })

  it('adds user message and returns it', () => {
    manager.addUserMessage('Hello')
    const msgs = manager.getMessages()
    expect(msgs).toHaveLength(1)
    expect(msgs[0].role).toBe('user')
    expect(msgs[0].content).toBe('Hello')
  })

  it('clears messages', () => {
    manager.addUserMessage('Hello')
    manager.clearMessages()
    expect(manager.getMessages()).toEqual([])
  })

  it('assembles context with schema info', async () => {
    const context = await manager.assembleSystemMessage()
    expect(context).toContain('Tables: users, orders')
  })

  it('streams a simple text response', async () => {
    const provider = createMockProvider([
      { type: 'text', content: 'Hello' },
      { type: 'text', content: ' world' },
      { type: 'done' }
    ])
    providerRegistry.register(provider)
    providerRegistry.setActive('mock')
    providerRegistry.setActiveModel('mock-1')

    manager.addUserMessage('Hi')

    const events: AIStreamEvent[] = []
    for await (const event of manager.chat()) {
      events.push(event)
    }

    expect(events).toEqual([
      { type: 'chunk', content: 'Hello' },
      { type: 'chunk', content: ' world' },
      { type: 'done' }
    ])

    // Assistant message should be added to history
    const msgs = manager.getMessages()
    expect(msgs).toHaveLength(2) // user + assistant
    expect(msgs[1].role).toBe('assistant')
    expect(msgs[1].content).toBe('Hello world')
  })

  it('throws when no active provider', async () => {
    manager.addUserMessage('Hi')
    await expect(async () => {
      for await (const _ of manager.chat()) { /* consume */ }
    }).rejects.toThrow('No active AI provider')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/ai-conversation-manager.test.ts`
Expected: FAIL

- [ ] **Step 3: Write the implementation**

```typescript
// src/main/ai/conversation-manager.ts
import { randomUUID } from 'crypto'
import type { AIChatMessage, AIStreamEvent } from '@shared/ai-types'
import type { AIProvider, AIToolDefinition, AIContextProvider } from './types'
import type { AIProviderRegistry } from './provider-registry'
import type { AIToolRegistry } from './tool-registry'
import type { PermissionManager } from './permission-manager'

interface ConversationManagerDeps {
  providerRegistry: AIProviderRegistry
  toolRegistry: AIToolRegistry
  permissionManager: PermissionManager
  getSchemaContext: (connectionId: string) => Promise<string>
  getConnectionId: () => string | null
}

export class ConversationManager {
  private messages: AIChatMessage[] = []
  private contextProviders: AIContextProvider[] = []
  private abortController: AbortController | null = null
  private deps: ConversationManagerDeps

  constructor(deps: ConversationManagerDeps) {
    this.deps = deps
  }

  getMessages(): AIChatMessage[] {
    return [...this.messages]
  }

  addUserMessage(content: string): AIChatMessage {
    const msg: AIChatMessage = {
      id: randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now()
    }
    this.messages.push(msg)
    return msg
  }

  clearMessages(): void {
    this.messages = []
  }

  registerContextProvider(provider: AIContextProvider): void {
    this.contextProviders.push(provider)
  }

  unregisterContextProvider(id: string): void {
    this.contextProviders = this.contextProviders.filter(p => p.id !== id)
  }

  async assembleSystemMessage(): Promise<string> {
    const parts: string[] = [
      'You are a helpful database assistant. You can query and inspect the connected database using the tools available to you.',
      'Always explain what you are doing and why. When generating SQL, prefer safe read operations unless the user explicitly asks for modifications.'
    ]

    const connectionId = this.deps.getConnectionId()
    if (connectionId) {
      try {
        const schemaContext = await this.deps.getSchemaContext(connectionId)
        if (schemaContext) {
          parts.push(`\nCurrent database schema:\n${schemaContext}`)
        }
      } catch {
        // Schema unavailable
      }

      for (const cp of this.contextProviders) {
        if (cp.appliesTo(connectionId)) {
          try {
            const ctx = await cp.getContext(connectionId)
            if (ctx) parts.push(ctx)
          } catch {
            // Context provider failed
          }
        }
      }
    }

    return parts.join('\n\n')
  }

  async *chat(): AsyncIterable<AIStreamEvent> {
    const provider = this.deps.providerRegistry.getActive()
    if (!provider) throw new Error('No active AI provider')

    const modelId = this.deps.providerRegistry.getActiveModel()
    if (!modelId) throw new Error('No active AI model')

    this.abortController = new AbortController()
    const systemMessage = await this.assembleSystemMessage()

    const allMessages: AIChatMessage[] = [
      { id: 'system', role: 'system', content: systemMessage, timestamp: 0 },
      ...this.messages
    ]

    const tools = provider.supportsToolCalling
      ? this.deps.toolRegistry.getToolDefinitions()
      : undefined

    const stream = provider.chat({
      model: modelId,
      messages: allMessages,
      tools: tools?.length ? tools : undefined,
      signal: this.abortController.signal
    })

    let assistantContent = ''

    for await (const chunk of stream) {
      if (this.abortController.signal.aborted) break

      if (chunk.type === 'text' && chunk.content) {
        assistantContent += chunk.content
        yield { type: 'chunk', content: chunk.content }
      } else if (chunk.type === 'tool-call' && chunk.toolCall) {
        yield { type: 'tool-call', toolCall: chunk.toolCall }

        const tool = this.deps.toolRegistry.get(chunk.toolCall.name)
        if (!tool) {
          yield { type: 'tool-result', result: {
            toolCallId: chunk.toolCall.id,
            toolName: chunk.toolCall.name,
            success: false,
            data: null,
            display: `Unknown tool: ${chunk.toolCall.name}`
          }}
          continue
        }

        const params = JSON.parse(chunk.toolCall.arguments) as Record<string, unknown>

        if (this.deps.permissionManager.needsApproval(tool)) {
          const display = tool.description + ': ' + JSON.stringify(params)
          const requestId = this.deps.permissionManager.createApprovalRequest(
            tool.id, params, display
          )
          yield { type: 'approval-request', request: {
            requestId,
            toolName: tool.name,
            toolDescription: tool.description,
            parameters: params,
            display
          }}

          const approved = await this.deps.permissionManager.waitForApproval(requestId)
          if (!approved) {
            yield { type: 'tool-result', result: {
              toolCallId: chunk.toolCall.id,
              toolName: chunk.toolCall.name,
              success: false,
              data: null,
              display: 'User rejected this action'
            }}
            continue
          }
        }

        try {
          const result = await this.deps.toolRegistry.execute(
            tool.id,
            params,
            { connectionId: this.deps.getConnectionId(), abortSignal: this.abortController.signal }
          )
          yield { type: 'tool-result', result: {
            toolCallId: chunk.toolCall.id,
            toolName: tool.name,
            success: result.success,
            data: result.data,
            display: result.display
          }}
        } catch (err) {
          yield { type: 'tool-result', result: {
            toolCallId: chunk.toolCall.id,
            toolName: tool.name,
            success: false,
            data: null,
            display: err instanceof Error ? err.message : String(err)
          }}
        }
      } else if (chunk.type === 'error') {
        yield { type: 'error', error: chunk.error ?? 'Unknown error' }
      } else if (chunk.type === 'done') {
        break
      }
    }

    // Append assistant message to history
    if (assistantContent) {
      this.messages.push({
        id: randomUUID(),
        role: 'assistant',
        content: assistantContent,
        timestamp: Date.now()
      })
    }

    yield { type: 'done' }
  }

  abort(): void {
    this.abortController?.abort()
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/ai-conversation-manager.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/ai/conversation-manager.ts tests/unit/ai-conversation-manager.test.ts
git commit -m "feat(ai): implement ConversationManager with streaming and tool orchestration"
```

---

### Task 8: OpenAI Provider Adapter

**Files:**
- Create: `src/main/ai/providers/openai.ts`
- Test: `tests/unit/ai-provider-openai.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/ai-provider-openai.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OpenAIProvider } from '../../src/main/ai/providers/openai'

describe('OpenAIProvider', () => {
  it('has correct metadata', () => {
    const provider = new OpenAIProvider(() => 'test-key')
    expect(provider.id).toBe('openai')
    expect(provider.name).toBe('OpenAI')
    expect(provider.supportsToolCalling).toBe(true)
  })

  it('returns models list', async () => {
    const provider = new OpenAIProvider(() => 'test-key')
    const models = await provider.models()
    expect(models.length).toBeGreaterThan(0)
    expect(models.some(m => m.id === 'gpt-4o')).toBe(true)
  })

  it('throws when no API key', async () => {
    const provider = new OpenAIProvider(() => null)
    await expect(async () => {
      for await (const _ of provider.chat({
        model: 'gpt-4o',
        messages: [{ id: '1', role: 'user', content: 'hi', timestamp: 0 }]
      })) { /* consume */ }
    }).rejects.toThrow('OpenAI API key not configured')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/ai-provider-openai.test.ts`
Expected: FAIL

- [ ] **Step 3: Write the implementation**

```typescript
// src/main/ai/providers/openai.ts
import type { AIProvider, AIProviderModel, AIProviderChatRequest, AIProviderChunk, AIToolDefinition } from '../types'
import type { AIChatMessage } from '@shared/ai-types'

const MODELS: AIProviderModel[] = [
  { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000, capabilities: ['chat', 'tool-calling'] },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000, capabilities: ['chat', 'tool-calling'] },
  { id: 'gpt-4.1', name: 'GPT-4.1', contextWindow: 1000000, capabilities: ['chat', 'tool-calling'] },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', contextWindow: 1000000, capabilities: ['chat', 'tool-calling'] },
  { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', contextWindow: 1000000, capabilities: ['chat', 'tool-calling'] },
]

function toOpenAIMessages(messages: AIChatMessage[]): Array<{ role: string; content: string; tool_call_id?: string }> {
  return messages.map(m => ({
    role: m.role,
    content: m.content,
    ...(m.toolCallId ? { tool_call_id: m.toolCallId } : {})
  }))
}

function toOpenAITools(tools: AIToolDefinition[]): Array<{ type: 'function'; function: { name: string; description: string; parameters: Record<string, unknown> } }> {
  return tools.map(t => ({
    type: 'function' as const,
    function: { name: t.name, description: t.description, parameters: t.parameters }
  }))
}

export class OpenAIProvider implements AIProvider {
  readonly id = 'openai'
  readonly name = 'OpenAI'
  readonly supportsToolCalling = true

  constructor(private getApiKey: () => string | null) {}

  async models(): Promise<AIProviderModel[]> {
    return MODELS
  }

  async *chat(request: AIProviderChatRequest): AsyncIterable<AIProviderChunk> {
    const apiKey = this.getApiKey()
    if (!apiKey) throw new Error('OpenAI API key not configured')

    const body: Record<string, unknown> = {
      model: request.model,
      messages: toOpenAIMessages(request.messages),
      stream: true
    }
    if (request.tools?.length) {
      body.tools = toOpenAITools(request.tools)
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body),
      signal: request.signal
    })

    if (!response.ok) {
      const errorBody = await response.text()
      yield { type: 'error', error: `OpenAI API error (${response.status}): ${errorBody}` }
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      yield { type: 'error', error: 'No response body' }
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let currentToolCall: { id: string; name: string; arguments: string } | null = null

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue
          const data = trimmed.slice(6)
          if (data === '[DONE]') {
            if (currentToolCall) {
              yield { type: 'tool-call', toolCall: currentToolCall }
              currentToolCall = null
            }
            yield { type: 'done' }
            return
          }

          try {
            const parsed = JSON.parse(data) as {
              choices: Array<{
                delta: {
                  content?: string
                  tool_calls?: Array<{
                    index: number
                    id?: string
                    function?: { name?: string; arguments?: string }
                  }>
                }
              }>
            }
            const delta = parsed.choices?.[0]?.delta
            if (!delta) continue

            if (delta.content) {
              yield { type: 'text', content: delta.content }
            }

            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                if (tc.id) {
                  if (currentToolCall) {
                    yield { type: 'tool-call', toolCall: currentToolCall }
                  }
                  currentToolCall = { id: tc.id, name: tc.function?.name ?? '', arguments: '' }
                }
                if (tc.function?.arguments && currentToolCall) {
                  currentToolCall.arguments += tc.function.arguments
                }
              }
            }
          } catch {
            // Skip unparseable SSE lines
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    if (currentToolCall) {
      yield { type: 'tool-call', toolCall: currentToolCall }
    }
    yield { type: 'done' }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/ai-provider-openai.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/ai/providers/openai.ts tests/unit/ai-provider-openai.test.ts
git commit -m "feat(ai): implement OpenAI provider adapter"
```

---

### Task 9: Anthropic Provider Adapter

**Files:**
- Create: `src/main/ai/providers/anthropic.ts`
- Test: `tests/unit/ai-provider-anthropic.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/ai-provider-anthropic.test.ts
import { describe, it, expect } from 'vitest'
import { AnthropicProvider } from '../../src/main/ai/providers/anthropic'

describe('AnthropicProvider', () => {
  it('has correct metadata', () => {
    const provider = new AnthropicProvider(() => 'test-key')
    expect(provider.id).toBe('anthropic')
    expect(provider.name).toBe('Anthropic')
    expect(provider.supportsToolCalling).toBe(true)
  })

  it('returns models list', async () => {
    const provider = new AnthropicProvider(() => 'test-key')
    const models = await provider.models()
    expect(models.length).toBeGreaterThan(0)
    expect(models.some(m => m.id.includes('claude'))).toBe(true)
  })

  it('throws when no API key', async () => {
    const provider = new AnthropicProvider(() => null)
    await expect(async () => {
      for await (const _ of provider.chat({
        model: 'claude-sonnet-4-6',
        messages: [{ id: '1', role: 'user', content: 'hi', timestamp: 0 }]
      })) { /* consume */ }
    }).rejects.toThrow('Anthropic API key not configured')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/ai-provider-anthropic.test.ts`
Expected: FAIL

- [ ] **Step 3: Write the implementation**

```typescript
// src/main/ai/providers/anthropic.ts
import type { AIProvider, AIProviderModel, AIProviderChatRequest, AIProviderChunk, AIToolDefinition } from '../types'
import type { AIChatMessage } from '@shared/ai-types'

const MODELS: AIProviderModel[] = [
  { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', contextWindow: 200000, capabilities: ['chat', 'tool-calling'] },
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', contextWindow: 200000, capabilities: ['chat', 'tool-calling'] },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', contextWindow: 200000, capabilities: ['chat', 'tool-calling'] },
]

function toAnthropicMessages(messages: AIChatMessage[]): Array<{ role: string; content: string }> {
  // Filter out system messages — Anthropic takes system separately
  return messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role === 'tool' ? 'user' : m.role, content: m.content }))
}

function toAnthropicTools(tools: AIToolDefinition[]): Array<{ name: string; description: string; input_schema: Record<string, unknown> }> {
  return tools.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters
  }))
}

export class AnthropicProvider implements AIProvider {
  readonly id = 'anthropic'
  readonly name = 'Anthropic'
  readonly supportsToolCalling = true

  constructor(private getApiKey: () => string | null) {}

  async models(): Promise<AIProviderModel[]> {
    return MODELS
  }

  async *chat(request: AIProviderChatRequest): AsyncIterable<AIProviderChunk> {
    const apiKey = this.getApiKey()
    if (!apiKey) throw new Error('Anthropic API key not configured')

    const systemMessage = request.messages.find(m => m.role === 'system')?.content

    const body: Record<string, unknown> = {
      model: request.model,
      messages: toAnthropicMessages(request.messages),
      max_tokens: 4096,
      stream: true
    }
    if (systemMessage) body.system = systemMessage
    if (request.tools?.length) body.tools = toAnthropicTools(request.tools)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body),
      signal: request.signal
    })

    if (!response.ok) {
      const errorBody = await response.text()
      yield { type: 'error', error: `Anthropic API error (${response.status}): ${errorBody}` }
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      yield { type: 'error', error: 'No response body' }
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let currentToolCall: { id: string; name: string; arguments: string } | null = null

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue
          const data = trimmed.slice(6)

          try {
            const parsed = JSON.parse(data) as {
              type: string
              delta?: { type: string; text?: string; partial_json?: string }
              content_block?: { type: string; id?: string; name?: string }
            }

            if (parsed.type === 'content_block_start') {
              if (parsed.content_block?.type === 'tool_use') {
                currentToolCall = {
                  id: parsed.content_block.id ?? '',
                  name: parsed.content_block.name ?? '',
                  arguments: ''
                }
              }
            } else if (parsed.type === 'content_block_delta') {
              if (parsed.delta?.type === 'text_delta' && parsed.delta.text) {
                yield { type: 'text', content: parsed.delta.text }
              } else if (parsed.delta?.type === 'input_json_delta' && parsed.delta.partial_json && currentToolCall) {
                currentToolCall.arguments += parsed.delta.partial_json
              }
            } else if (parsed.type === 'content_block_stop') {
              if (currentToolCall) {
                yield { type: 'tool-call', toolCall: currentToolCall }
                currentToolCall = null
              }
            } else if (parsed.type === 'message_stop') {
              yield { type: 'done' }
              return
            }
          } catch {
            // Skip unparseable SSE lines
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    yield { type: 'done' }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/ai-provider-anthropic.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/ai/providers/anthropic.ts tests/unit/ai-provider-anthropic.test.ts
git commit -m "feat(ai): implement Anthropic provider adapter"
```

---

### Task 10: Ollama Provider Adapter

**Files:**
- Create: `src/main/ai/providers/ollama.ts`
- Test: `tests/unit/ai-provider-ollama.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/ai-provider-ollama.test.ts
import { describe, it, expect } from 'vitest'
import { OllamaProvider } from '../../src/main/ai/providers/ollama'

describe('OllamaProvider', () => {
  it('has correct metadata', () => {
    const provider = new OllamaProvider()
    expect(provider.id).toBe('ollama')
    expect(provider.name).toBe('Ollama')
    expect(provider.supportsToolCalling).toBe(true)
  })

  it('uses custom endpoint', () => {
    const provider = new OllamaProvider('http://custom:1234')
    expect(provider.endpoint).toBe('http://custom:1234')
  })

  it('defaults to localhost:11434', () => {
    const provider = new OllamaProvider()
    expect(provider.endpoint).toBe('http://localhost:11434')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/ai-provider-ollama.test.ts`
Expected: FAIL

- [ ] **Step 3: Write the implementation**

```typescript
// src/main/ai/providers/ollama.ts
import type { AIProvider, AIProviderModel, AIProviderChatRequest, AIProviderChunk, AIToolDefinition } from '../types'
import type { AIChatMessage } from '@shared/ai-types'

function toOllamaMessages(messages: AIChatMessage[]): Array<{ role: string; content: string }> {
  return messages.map(m => ({ role: m.role, content: m.content }))
}

function toOllamaTools(tools: AIToolDefinition[]): Array<{ type: 'function'; function: { name: string; description: string; parameters: Record<string, unknown> } }> {
  return tools.map(t => ({
    type: 'function' as const,
    function: { name: t.name, description: t.description, parameters: t.parameters }
  }))
}

export class OllamaProvider implements AIProvider {
  readonly id = 'ollama'
  readonly name = 'Ollama'
  readonly supportsToolCalling = true
  readonly endpoint: string

  constructor(endpoint?: string) {
    this.endpoint = endpoint ?? 'http://localhost:11434'
  }

  async models(): Promise<AIProviderModel[]> {
    try {
      const response = await fetch(`${this.endpoint}/api/tags`)
      if (!response.ok) return []
      const data = (await response.json()) as { models: Array<{ name: string; details?: { parameter_size?: string } }> }
      return (data.models ?? []).map(m => ({
        id: m.name,
        name: m.name,
        contextWindow: 8192,
        capabilities: ['chat', 'tool-calling'] as const
      }))
    } catch {
      return []
    }
  }

  async *chat(request: AIProviderChatRequest): AsyncIterable<AIProviderChunk> {
    const body: Record<string, unknown> = {
      model: request.model,
      messages: toOllamaMessages(request.messages),
      stream: true
    }
    if (request.tools?.length) {
      body.tools = toOllamaTools(request.tools)
    }

    const response = await fetch(`${this.endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: request.signal
    })

    if (!response.ok) {
      const errorBody = await response.text()
      yield { type: 'error', error: `Ollama error (${response.status}): ${errorBody}` }
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      yield { type: 'error', error: 'No response body' }
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const parsed = JSON.parse(line) as {
              done: boolean
              message?: {
                content?: string
                tool_calls?: Array<{ function: { name: string; arguments: Record<string, unknown> } }>
              }
            }

            if (parsed.message?.content) {
              yield { type: 'text', content: parsed.message.content }
            }

            if (parsed.message?.tool_calls) {
              for (const tc of parsed.message.tool_calls) {
                yield {
                  type: 'tool-call',
                  toolCall: {
                    id: `ollama-${Date.now()}`,
                    name: tc.function.name,
                    arguments: JSON.stringify(tc.function.arguments)
                  }
                }
              }
            }

            if (parsed.done) {
              yield { type: 'done' }
              return
            }
          } catch {
            // Skip unparseable lines
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    yield { type: 'done' }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/ai-provider-ollama.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/ai/providers/ollama.ts tests/unit/ai-provider-ollama.test.ts
git commit -m "feat(ai): implement Ollama provider adapter"
```

---

### Task 11: AI Module Entry Point

**Files:**
- Create: `src/main/ai/index.ts`

- [ ] **Step 1: Write the AI module entry point**

This file creates and exports the AI module instances and wires IPC handlers.

```typescript
// src/main/ai/index.ts
import { BrowserWindow } from 'electron'
import type { IpcChannelMap } from '@shared/ipc'
import type { AIStreamEvent } from '@shared/ai-types'
import { AIProviderRegistry } from './provider-registry'
import { AIToolRegistry } from './tool-registry'
import { PermissionManager } from './permission-manager'
import { ConversationManager } from './conversation-manager'
import { OpenAIProvider } from './providers/openai'
import { AnthropicProvider } from './providers/anthropic'
import { OllamaProvider } from './providers/ollama'
import type { KeyringAccess, SchemaAccess, ConnectionAccess } from '../plugins/sdk/types'

export interface AIModuleDeps {
  keyring: KeyringAccess
  schemaAccess: SchemaAccess
  connectionAccess: ConnectionAccess
  handle: <K extends keyof IpcChannelMap>(
    channel: K,
    handler: (...args: IpcChannelMap[K]['args']) => IpcChannelMap[K]['return'] | Promise<IpcChannelMap[K]['return']>
  ) => void
  settingsStore: { get(key: string): unknown; set(key: string, value: unknown): void }
}

export interface AIModule {
  providerRegistry: AIProviderRegistry
  toolRegistry: AIToolRegistry
  permissionManager: PermissionManager
  conversationManager: ConversationManager
}

export function createAIModule(deps: AIModuleDeps): AIModule {
  const providerRegistry = new AIProviderRegistry()
  const toolRegistry = new AIToolRegistry()
  const permissionManager = new PermissionManager()

  // Register built-in providers
  const openai = new OpenAIProvider(async () => {
    return await deps.keyring.retrieve('ai', 'openai-api-key')
  })
  const anthropic = new AnthropicProvider(async () => {
    return await deps.keyring.retrieve('ai', 'anthropic-api-key')
  })

  const ollamaEndpoint = (deps.settingsStore.get('ai.ollamaEndpoint') as string) || undefined
  const ollama = new OllamaProvider(ollamaEndpoint)

  providerRegistry.register(openai)
  providerRegistry.register(anthropic)
  providerRegistry.register(ollama)

  // Restore active provider/model from settings
  const savedProvider = deps.settingsStore.get('ai.activeProvider') as string | undefined
  const savedModel = deps.settingsStore.get('ai.activeModel') as string | undefined
  if (savedProvider && providerRegistry.get(savedProvider)) {
    providerRegistry.setActive(savedProvider)
  }
  if (savedModel) {
    providerRegistry.setActiveModel(savedModel)
  }

  const conversationManager = new ConversationManager({
    providerRegistry,
    toolRegistry,
    permissionManager,
    getSchemaContext: async (connectionId) => {
      try {
        const summary = await deps.schemaAccess.getSchemaSummary(connectionId)
        return summary.tables.map(t => {
          const cols = t.columns.map(c => {
            let desc = `${c.name} ${c.dataType}`
            if (c.isPrimaryKey) desc += ' PK'
            if (c.isForeignKey && c.references) desc += ` FK→${c.references.table}.${c.references.column}`
            return desc
          }).join(', ')
          return `${t.name}(${cols})`
        }).join('\n')
      } catch {
        return ''
      }
    },
    getConnectionId: () => deps.connectionAccess.getActiveConnectionId()
  })

  // ─── Register IPC handlers ─────────────────────────────────────────────────

  const activeStreams = new Map<string, AbortController>()

  deps.handle('ai:chat:start', async (request) => {
    const streamId = crypto.randomUUID()
    const controller = new AbortController()
    activeStreams.set(streamId, controller)

    conversationManager.addUserMessage(request.message)

    // Run streaming in background, broadcast events to renderer
    ;(async () => {
      try {
        for await (const event of conversationManager.chat()) {
          const win = BrowserWindow.getAllWindows()[0]
          if (win) win.webContents.send('ai:chat:event', streamId, event)
        }
      } catch (err) {
        const win = BrowserWindow.getAllWindows()[0]
        if (win) win.webContents.send('ai:chat:event', streamId, {
          type: 'error',
          error: err instanceof Error ? err.message : String(err)
        } satisfies AIStreamEvent)
      } finally {
        activeStreams.delete(streamId)
      }
    })()

    return { streamId }
  })

  deps.handle('ai:chat:abort', async (streamId) => {
    const controller = activeStreams.get(streamId)
    if (controller) {
      controller.abort()
      activeStreams.delete(streamId)
    }
    conversationManager.abort()
  })

  deps.handle('ai:chat:approval-response', async (requestId, approved) => {
    permissionManager.resolveApproval(requestId, approved)
  })

  deps.handle('ai:providers:list', async () => {
    return providerRegistry.list().map(p => ({ id: p.id, name: p.name }))
  })

  deps.handle('ai:providers:set-active', async (providerId) => {
    providerRegistry.setActive(providerId)
    deps.settingsStore.set('ai.activeProvider', providerId)
  })

  deps.handle('ai:providers:get-active', async () => {
    const active = providerRegistry.getActive()
    return active ? { id: active.id, name: active.name } : null
  })

  deps.handle('ai:models:list', async () => {
    const active = providerRegistry.getActive()
    if (!active) return []
    return active.models()
  })

  deps.handle('ai:models:set-active', async (modelId) => {
    providerRegistry.setActiveModel(modelId)
    deps.settingsStore.set('ai.activeModel', modelId)
  })

  deps.handle('ai:models:get-active', async () => {
    return providerRegistry.getActiveModel()
  })

  deps.handle('ai:messages:list', async () => {
    return conversationManager.getMessages()
  })

  deps.handle('ai:messages:clear', async () => {
    conversationManager.clearMessages()
  })

  deps.handle('ai:tools:list', async () => {
    return toolRegistry.list().map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      permission: t.permission
    }))
  })

  return { providerRegistry, toolRegistry, permissionManager, conversationManager }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors in `src/main/ai/`

- [ ] **Step 3: Commit**

```bash
git add src/main/ai/index.ts
git commit -m "feat(ai): implement AI module entry point with IPC handlers"
```

---

### Task 12: SDK Extension — ctx.ai

**Files:**
- Create: `src/main/plugins/sdk/ai-access.ts`
- Modify: `src/main/plugins/sdk/types.ts`
- Modify: `src/main/plugins/sdk/index.ts`

- [ ] **Step 1: Create AIAccess type and implementation**

```typescript
// src/main/plugins/sdk/ai-access.ts
import type { Disposable } from './types'
import type { AITool, AIContextProvider } from '../../ai/types'
import type { AIProvider } from '../../ai/types'
import type { AIToolRegistry } from '../../ai/tool-registry'
import type { AIProviderRegistry } from '../../ai/provider-registry'
import type { ConversationManager } from '../../ai/conversation-manager'

export interface AIAccess {
  registerTool(tool: AITool): Disposable
  registerProvider(provider: AIProvider): Disposable
  registerContextProvider(provider: AIContextProvider): Disposable
}

export class AIAccessImpl implements AIAccess {
  constructor(
    private toolRegistry: AIToolRegistry,
    private providerRegistry: AIProviderRegistry,
    private conversationManager: ConversationManager
  ) {}

  registerTool(tool: AITool): Disposable {
    this.toolRegistry.register(tool)
    return { dispose: () => this.toolRegistry.unregister(tool.id) }
  }

  registerProvider(provider: AIProvider): Disposable {
    this.providerRegistry.register(provider)
    return { dispose: () => this.providerRegistry.unregister(provider.id) }
  }

  registerContextProvider(provider: AIContextProvider): Disposable {
    this.conversationManager.registerContextProvider(provider)
    return { dispose: () => this.conversationManager.unregisterContextProvider(provider.id) }
  }
}
```

- [ ] **Step 2: Add AIAccess to PluginContext type**

In `src/main/plugins/sdk/types.ts`, add the import and update the interface:

```typescript
// Add import at top:
import type { AIAccess } from './ai-access'

// Update PluginContext interface — add ai field:
export interface PluginContext {
  drivers: DriverRegistry
  commands: CommandRegistry
  panels: PanelRegistry
  ui: UIRegistry
  completions: CompletionRegistry
  schema: SchemaAccess
  connections: ConnectionAccess
  settings: PluginSettings
  keyring: KeyringAccess
  ai: AIAccess
  subscriptions: Disposable[]
}
```

- [ ] **Step 3: Update createPluginContext to wire ctx.ai**

In `src/main/plugins/sdk/index.ts`:

Add to imports:
```typescript
import { AIAccessImpl } from './ai-access'
```

Add to `ContextDeps` interface:
```typescript
interface ContextDeps {
  // ... existing fields ...
  aiToolRegistry: import('../../ai/tool-registry').AIToolRegistry
  aiProviderRegistry: import('../../ai/provider-registry').AIProviderRegistry
  aiConversationManager: import('../../ai/conversation-manager').ConversationManager
}
```

Add to `createPluginContext` body, before the return:
```typescript
  const aiAccess = new AIAccessImpl(
    deps.aiToolRegistry,
    deps.aiProviderRegistry,
    deps.aiConversationManager
  )

  const ai = {
    registerTool(tool: Parameters<AIAccessImpl['registerTool']>[0]) {
      const disposable = aiAccess.registerTool(tool)
      subscriptions.push(disposable)
      return disposable
    },
    registerProvider(provider: Parameters<AIAccessImpl['registerProvider']>[0]) {
      const disposable = aiAccess.registerProvider(provider)
      subscriptions.push(disposable)
      return disposable
    },
    registerContextProvider(provider: Parameters<AIAccessImpl['registerContextProvider']>[0]) {
      const disposable = aiAccess.registerContextProvider(provider)
      subscriptions.push(disposable)
      return disposable
    }
  }
```

Add `ai` to the return object.

- [ ] **Step 4: Update plugin-host.ts to pass AI deps**

In `src/main/plugins/plugin-host.ts`, update the `BootCoordinatorDeps` (or equivalent) to accept AI registries, and pass them through to `createPluginContext`.

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/main/plugins/sdk/ai-access.ts src/main/plugins/sdk/types.ts src/main/plugins/sdk/index.ts src/main/plugins/plugin-host.ts
git commit -m "feat(ai): add ctx.ai to plugin SDK for tool/provider/context registration"
```

---

### Task 13: Wire AI Module into ipc-handlers.ts

**Files:**
- Modify: `src/main/ipc-handlers.ts`

- [ ] **Step 1: Import and create AI module**

Add to imports in `src/main/ipc-handlers.ts`:
```typescript
import { createAIModule } from './ai'
```

Inside `registerIpcHandlers()`, after the plugin coordinator creation and bundled plugin registration block, add:

```typescript
  // ─── AI Module ──────────────────────────────────────────────────────────────

  const schemaAccess = new SchemaAccessImpl(
    (id) => activeAdapters.get(id)
  )
  const connectionAccess = new ConnectionAccessImpl(
    () => null, // Active connection ID managed by renderer
    (id) => configStore.getConnection(id),
    (id, sql, params) => {
      const adapter = activeAdapters.get(id)
      if (!adapter) throw new Error('Not connected')
      return adapter.query(sql, params)
    }
  )

  const aiModule = createAIModule({
    keyring,
    schemaAccess,
    connectionAccess,
    handle,
    settingsStore: {
      get: (key) => {
        const settings = configStore.getSettingsCategory('ai' as any)
        return settings?.[key.replace('ai.', '')]
      },
      set: (key, value) => configStore.setSetting(key, value)
    }
  })
```

Then update the `pluginCoordinator` creation to pass the AI registries:

```typescript
  const pluginCoordinator = new PluginBootCoordinator({
    // ... existing deps ...
    aiToolRegistry: aiModule.toolRegistry,
    aiProviderRegistry: aiModule.providerRegistry,
    aiConversationManager: aiModule.conversationManager
  })
```

- [ ] **Step 2: Add ai:chat:event to IPC broadcast channels**

In `shared/ipc.ts`, note that `ai:chat:event` is a broadcast (main→renderer) channel. It doesn't go through `handle()` — it uses `webContents.send()`. Ensure the preload `on()` method can listen to it (it already can since `on()` accepts any channel string).

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/main/ipc-handlers.ts shared/ipc.ts
git commit -m "feat(ai): wire AI module into main process IPC handlers"
```

---

### Task 14: AI Plugin — Schema & Query Tools

**Files:**
- Create: `src/main/plugins/bundled/ai/tools/schema-tools.ts`
- Create: `src/main/plugins/bundled/ai/tools/query-tools.ts`
- Test: `tests/unit/ai-schema-tools.test.ts`

- [ ] **Step 1: Write the failing test for schema tools**

```typescript
// tests/unit/ai-schema-tools.test.ts
import { describe, it, expect, vi } from 'vitest'
import { createSchemaTools } from '../../src/main/plugins/bundled/ai/tools/schema-tools'
import type { SchemaAccess } from '../../src/main/plugins/sdk/types'

const mockSchema: SchemaAccess = {
  getTables: vi.fn(async () => [{ name: 'users', type: 'table' as const, schema: 'public' }]),
  getColumns: vi.fn(async () => [
    { name: 'id', dataType: 'integer', nullable: false, isPrimaryKey: true, isForeignKey: false, defaultValue: null, ordinalPosition: 1 },
    { name: 'email', dataType: 'varchar', nullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: null, ordinalPosition: 2 }
  ]),
  getIndexes: vi.fn(async () => []),
  getSchemas: vi.fn(async () => ['public']),
  getDatabases: vi.fn(async () => ['mydb']),
  getSchemaSummary: vi.fn(async () => ({ tables: [] }))
}

describe('Schema tools', () => {
  it('creates listTables tool', () => {
    const tools = createSchemaTools(mockSchema)
    const listTables = tools.find(t => t.id === 'schema.listTables')
    expect(listTables).toBeDefined()
    expect(listTables!.permission).toBe('read')
  })

  it('listTables returns table names', async () => {
    const tools = createSchemaTools(mockSchema)
    const listTables = tools.find(t => t.id === 'schema.listTables')!
    const result = await listTables.execute(
      {},
      { connectionId: 'conn-1', abortSignal: new AbortController().signal }
    )
    expect(result.success).toBe(true)
    expect(result.data).toEqual([{ name: 'users', type: 'table', schema: 'public' }])
  })

  it('describeTable returns columns', async () => {
    const tools = createSchemaTools(mockSchema)
    const describe = tools.find(t => t.id === 'schema.describeTable')!
    const result = await describe.execute(
      { table: 'users' },
      { connectionId: 'conn-1', abortSignal: new AbortController().signal }
    )
    expect(result.success).toBe(true)
    expect((result.data as any).columns).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/ai-schema-tools.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement schema tools**

```typescript
// src/main/plugins/bundled/ai/tools/schema-tools.ts
import type { AITool, AIToolContext, AIToolExecutionResult } from '../../../../ai/types'
import type { SchemaAccess } from '../../../sdk/types'

export function createSchemaTools(schema: SchemaAccess): AITool[] {
  return [
    {
      id: 'schema.listTables',
      name: 'List Tables',
      description: 'List all tables in the current database schema. Returns table names and types.',
      parameters: {
        type: 'object',
        properties: {
          schema: { type: 'string', description: 'Schema name (optional, defaults to current schema)' }
        }
      },
      permission: 'read',
      async execute(params: Record<string, unknown>, ctx: AIToolContext): Promise<AIToolExecutionResult> {
        if (!ctx.connectionId) return { success: false, data: null, display: 'No active connection' }
        const tables = await schema.getTables(ctx.connectionId, params.schema as string | undefined)
        return {
          success: true,
          data: tables,
          display: `Found ${tables.length} table(s)`
        }
      }
    },
    {
      id: 'schema.describeTable',
      name: 'Describe Table',
      description: 'Get column definitions, types, primary keys, and foreign keys for a specific table.',
      parameters: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          schema: { type: 'string', description: 'Schema name (optional)' }
        },
        required: ['table']
      },
      permission: 'read',
      async execute(params: Record<string, unknown>, ctx: AIToolContext): Promise<AIToolExecutionResult> {
        if (!ctx.connectionId) return { success: false, data: null, display: 'No active connection' }
        const table = params.table as string
        const schemaName = params.schema as string | undefined
        const [columns, indexes] = await Promise.all([
          schema.getColumns(ctx.connectionId, table, schemaName),
          schema.getIndexes(ctx.connectionId, table, schemaName)
        ])
        return {
          success: true,
          data: { columns, indexes },
          display: `${table}: ${columns.length} column(s), ${indexes.length} index(es)`
        }
      }
    },
    {
      id: 'schema.getRelationships',
      name: 'Get Relationships',
      description: 'Get foreign key relationships for a table, showing which columns reference other tables.',
      parameters: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Table name' },
          schema: { type: 'string', description: 'Schema name (optional)' }
        },
        required: ['table']
      },
      permission: 'read',
      async execute(params: Record<string, unknown>, ctx: AIToolContext): Promise<AIToolExecutionResult> {
        if (!ctx.connectionId) return { success: false, data: null, display: 'No active connection' }
        const columns = await schema.getColumns(ctx.connectionId, params.table as string, params.schema as string | undefined)
        const fks = columns.filter(c => c.isForeignKey)
        return {
          success: true,
          data: fks,
          display: `${fks.length} foreign key(s)`
        }
      }
    },
    {
      id: 'connection.info',
      name: 'Connection Info',
      description: 'Get information about available schemas and databases for the current connection.',
      parameters: { type: 'object', properties: {} },
      permission: 'read',
      async execute(_params: Record<string, unknown>, ctx: AIToolContext): Promise<AIToolExecutionResult> {
        if (!ctx.connectionId) return { success: false, data: null, display: 'No active connection' }
        const [schemas, databases] = await Promise.all([
          schema.getSchemas(ctx.connectionId).catch(() => [] as string[]),
          schema.getDatabases(ctx.connectionId).catch(() => [] as string[])
        ])
        return {
          success: true,
          data: { schemas, databases, connectionId: ctx.connectionId },
          display: `${schemas.length} schema(s), ${databases.length} database(s)`
        }
      }
    }
  ]
}
```

- [ ] **Step 4: Implement query tools**

```typescript
// src/main/plugins/bundled/ai/tools/query-tools.ts
import type { AITool, AIToolContext, AIToolExecutionResult } from '../../../../ai/types'
import type { ConnectionAccess } from '../../../sdk/types'

export function createQueryTools(connections: ConnectionAccess): AITool[] {
  return [
    {
      id: 'query.explain',
      name: 'Explain Query',
      description: 'Run EXPLAIN on a SQL query to show the execution plan without actually executing the query.',
      parameters: {
        type: 'object',
        properties: {
          sql: { type: 'string', description: 'The SQL query to explain' }
        },
        required: ['sql']
      },
      permission: 'read',
      async execute(params: Record<string, unknown>, ctx: AIToolContext): Promise<AIToolExecutionResult> {
        if (!ctx.connectionId) return { success: false, data: null, display: 'No active connection' }
        const result = await connections.query(ctx.connectionId, `EXPLAIN ${params.sql as string}`)
        return {
          success: true,
          data: result.rows,
          display: `Execution plan (${result.rows.length} step(s))`
        }
      }
    },
    {
      id: 'query.execute',
      name: 'Execute Query',
      description: 'Execute a SQL query against the connected database. Use this for SELECT, INSERT, UPDATE, DELETE, or DDL statements.',
      parameters: {
        type: 'object',
        properties: {
          sql: { type: 'string', description: 'The SQL query to execute' }
        },
        required: ['sql']
      },
      permission: 'write',
      async execute(params: Record<string, unknown>, ctx: AIToolContext): Promise<AIToolExecutionResult> {
        if (!ctx.connectionId) return { success: false, data: null, display: 'No active connection' }
        const result = await connections.query(ctx.connectionId, params.sql as string)
        return {
          success: true,
          data: { rows: result.rows, fields: result.fields, rowCount: result.rowCount },
          display: `Query returned ${result.rowCount} row(s)`
        }
      }
    }
  ]
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/ai-schema-tools.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/main/plugins/bundled/ai/tools/schema-tools.ts src/main/plugins/bundled/ai/tools/query-tools.ts tests/unit/ai-schema-tools.test.ts
git commit -m "feat(ai): implement schema and query tools for AI plugin"
```

---

### Task 15: AI Plugin Entry Point

**Files:**
- Create: `src/main/plugins/bundled/ai/index.ts`
- Modify: `src/main/ipc-handlers.ts` (register bundled plugin)

- [ ] **Step 1: Write the AI plugin**

```typescript
// src/main/plugins/bundled/ai/index.ts
import type { PluginContext } from '../../sdk/types'
import type { PluginManifest } from '../../types'
import { createSchemaTools } from './tools/schema-tools'
import { createQueryTools } from './tools/query-tools'

export const manifest: PluginManifest = {
  name: 'dbstudio-plugin-ai',
  version: '1.0.0',
  displayName: 'AI Assistant',
  description: 'AI-powered database assistant with natural language queries, schema exploration, and contextual actions',
  main: 'index.js',
  contributes: {
    commands: [
      { id: 'explain-table', title: 'AI: Explain Table' },
      { id: 'suggest-queries', title: 'AI: Generate Sample Queries' },
      { id: 'explain-query', title: 'AI: Explain Query' },
      { id: 'optimize-query', title: 'AI: Optimize Query' }
    ],
    settings: [
      { key: 'provider', title: 'AI Provider', type: 'text', default: '' },
      { key: 'model', title: 'AI Model', type: 'text', default: '' },
      { key: 'autoIncludeSchema', title: 'Auto-include schema context', type: 'boolean', default: true },
      { key: 'maxContextMessages', title: 'Max context messages', type: 'number', default: 20 }
    ]
  }
}

export function activate(ctx: PluginContext): void {
  // Register schema tools
  const schemaTools = createSchemaTools(ctx.schema)
  for (const tool of schemaTools) {
    ctx.ai.registerTool(tool)
  }

  // Register query tools
  const queryTools = createQueryTools(ctx.connections)
  for (const tool of queryTools) {
    ctx.ai.registerTool(tool)
  }

  // Register commands that open the chat panel with context
  ctx.commands.register('explain-table', async (payload) => {
    // These commands will be consumed by the renderer to open chat with a pre-composed prompt
    // The payload is forwarded via the command system
  })

  ctx.commands.register('suggest-queries', async (payload) => {
    // Renderer handles opening chat panel
  })

  ctx.commands.register('explain-query', async (payload) => {
    // Renderer handles opening chat panel
  })

  ctx.commands.register('optimize-query', async (payload) => {
    // Renderer handles opening chat panel
  })
}
```

- [ ] **Step 2: Register AI plugin in ipc-handlers.ts**

In `src/main/ipc-handlers.ts`, add the import and registration:

```typescript
import * as aiPlugin from './plugins/bundled/ai'

// In registerIpcHandlers(), after other bundled plugin registrations:
pluginCoordinator.registerBundledPlugin(aiPlugin.manifest, aiPlugin)
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/main/plugins/bundled/ai/index.ts src/main/ipc-handlers.ts
git commit -m "feat(ai): add bundled AI plugin with schema/query tools and commands"
```

---

### Task 16: Renderer AI Store

**Files:**
- Create: `src/renderer/src/stores/ai.ts`
- Test: `tests/unit/ai-store.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/ai-store.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock electronAPI before importing store
const mockInvoke = vi.fn()
const mockOn = vi.fn(() => vi.fn()) // returns cleanup function
vi.stubGlobal('window', {
  electronAPI: {
    invoke: mockInvoke,
    on: mockOn
  }
})

import { useAIStore } from '../../src/renderer/src/stores/ai'

describe('AI Store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAIStore.setState({
      messages: [],
      isStreaming: false,
      activeProvider: null,
      activeModel: null,
      panelOpen: false,
      streamingContent: ''
    })
  })

  it('starts with empty state', () => {
    const state = useAIStore.getState()
    expect(state.messages).toEqual([])
    expect(state.isStreaming).toBe(false)
    expect(state.panelOpen).toBe(false)
  })

  it('toggles panel', () => {
    useAIStore.getState().togglePanel()
    expect(useAIStore.getState().panelOpen).toBe(true)
    useAIStore.getState().togglePanel()
    expect(useAIStore.getState().panelOpen).toBe(false)
  })

  it('sends a message', async () => {
    mockInvoke.mockResolvedValue({ streamId: 'stream-1' })
    await useAIStore.getState().sendMessage('Hello')
    expect(mockInvoke).toHaveBeenCalledWith('ai:chat:start', { message: 'Hello' })
    // User message should be added optimistically
    expect(useAIStore.getState().messages).toHaveLength(1)
    expect(useAIStore.getState().messages[0].role).toBe('user')
    expect(useAIStore.getState().isStreaming).toBe(true)
  })

  it('clears messages', async () => {
    mockInvoke.mockResolvedValue(undefined)
    useAIStore.setState({ messages: [{ id: '1', role: 'user', content: 'hi', timestamp: 0 }] })
    await useAIStore.getState().clearMessages()
    expect(mockInvoke).toHaveBeenCalledWith('ai:messages:clear')
    expect(useAIStore.getState().messages).toEqual([])
  })

  it('loads providers', async () => {
    mockInvoke.mockResolvedValue([{ id: 'openai', name: 'OpenAI' }])
    await useAIStore.getState().loadProviders()
    expect(useAIStore.getState().providers).toEqual([{ id: 'openai', name: 'OpenAI' }])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/ai-store.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement the store**

```typescript
// src/renderer/src/stores/ai.ts
import { create } from 'zustand'
import type { AIChatMessage, AIStreamEvent, AIProviderInfo, AIModelInfo, AIApprovalRequest } from '@shared/ai-types'

interface AIState {
  messages: AIChatMessage[]
  isStreaming: boolean
  streamingContent: string
  activeProvider: AIProviderInfo | null
  activeModel: string | null
  providers: AIProviderInfo[]
  models: AIModelInfo[]
  panelOpen: boolean
  pendingApproval: AIApprovalRequest | null
  currentStreamId: string | null

  togglePanel: () => void
  openPanel: () => void
  sendMessage: (content: string) => Promise<void>
  clearMessages: () => Promise<void>
  abort: () => void
  loadProviders: () => Promise<void>
  loadModels: () => Promise<void>
  setActiveProvider: (providerId: string) => Promise<void>
  setActiveModel: (modelId: string) => Promise<void>
  respondToApproval: (requestId: string, approved: boolean) => void
  handleStreamEvent: (event: AIStreamEvent) => void
}

export const useAIStore = create<AIState>((set, get) => ({
  messages: [],
  isStreaming: false,
  streamingContent: '',
  activeProvider: null,
  activeModel: null,
  providers: [],
  models: [],
  panelOpen: false,
  pendingApproval: null,
  currentStreamId: null,

  togglePanel: () => set(s => ({ panelOpen: !s.panelOpen })),
  openPanel: () => set({ panelOpen: true }),

  sendMessage: async (content) => {
    const userMessage: AIChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now()
    }
    set(s => ({
      messages: [...s.messages, userMessage],
      isStreaming: true,
      streamingContent: ''
    }))

    const { streamId } = await window.electronAPI.invoke('ai:chat:start', { message: content })
    set({ currentStreamId: streamId })
  },

  clearMessages: async () => {
    await window.electronAPI.invoke('ai:messages:clear')
    set({ messages: [], streamingContent: '' })
  },

  abort: () => {
    const { currentStreamId } = get()
    if (currentStreamId) {
      window.electronAPI.invoke('ai:chat:abort', currentStreamId)
      set({ isStreaming: false, currentStreamId: null })
    }
  },

  loadProviders: async () => {
    const providers = await window.electronAPI.invoke('ai:providers:list')
    const active = await window.electronAPI.invoke('ai:providers:get-active')
    set({ providers, activeProvider: active })
  },

  loadModels: async () => {
    const models = await window.electronAPI.invoke('ai:models:list')
    const activeModelId = await window.electronAPI.invoke('ai:models:get-active')
    set({ models, activeModel: activeModelId })
  },

  setActiveProvider: async (providerId) => {
    await window.electronAPI.invoke('ai:providers:set-active', providerId)
    const active = await window.electronAPI.invoke('ai:providers:get-active')
    set({ activeProvider: active })
    // Reload models for new provider
    await get().loadModels()
  },

  setActiveModel: async (modelId) => {
    await window.electronAPI.invoke('ai:models:set-active', modelId)
    set({ activeModel: modelId })
  },

  respondToApproval: (requestId, approved) => {
    window.electronAPI.invoke('ai:chat:approval-response', requestId, approved)
    set({ pendingApproval: null })
  },

  handleStreamEvent: (event) => {
    const state = get()
    switch (event.type) {
      case 'chunk':
        set({ streamingContent: state.streamingContent + event.content })
        break
      case 'tool-call':
        // Add tool call message to thread
        set(s => ({
          messages: [...s.messages, {
            id: crypto.randomUUID(),
            role: 'assistant' as const,
            content: `Calling tool: ${event.toolCall.name}`,
            toolCalls: [event.toolCall],
            timestamp: Date.now()
          }]
        }))
        break
      case 'tool-result':
        set(s => ({
          messages: [...s.messages, {
            id: crypto.randomUUID(),
            role: 'tool' as const,
            content: event.result.display ?? JSON.stringify(event.result.data),
            toolCallId: event.result.toolCallId,
            timestamp: Date.now()
          }]
        }))
        break
      case 'approval-request':
        set({ pendingApproval: event.request })
        break
      case 'done': {
        const content = state.streamingContent
        if (content) {
          set(s => ({
            messages: [...s.messages, {
              id: crypto.randomUUID(),
              role: 'assistant' as const,
              content,
              timestamp: Date.now()
            }],
            streamingContent: '',
            isStreaming: false,
            currentStreamId: null
          }))
        } else {
          set({ isStreaming: false, currentStreamId: null })
        }
        break
      }
      case 'error':
        set(s => ({
          messages: [...s.messages, {
            id: crypto.randomUUID(),
            role: 'assistant' as const,
            content: `Error: ${event.error}`,
            timestamp: Date.now()
          }],
          isStreaming: false,
          streamingContent: '',
          currentStreamId: null
        }))
        break
    }
  }
}))

// Listen for streaming events from main process
if (typeof window !== 'undefined' && window.electronAPI) {
  window.electronAPI.on('ai:chat:event', (streamId: unknown, event: unknown) => {
    const state = useAIStore.getState()
    if (streamId === state.currentStreamId) {
      state.handleStreamEvent(event as AIStreamEvent)
    }
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/ai-store.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/stores/ai.ts tests/unit/ai-store.test.ts
git commit -m "feat(ai): implement Zustand AI store with streaming event handling"
```

---

### Task 17: Chat Panel Components

**Files:**
- Create: `src/renderer/src/components/ai/ChatInput.tsx`
- Create: `src/renderer/src/components/ai/MessageBubble.tsx`
- Create: `src/renderer/src/components/ai/ToolCallCard.tsx`
- Create: `src/renderer/src/components/ai/ApprovalCard.tsx`
- Create: `src/renderer/src/components/ai/MessageThread.tsx`
- Create: `src/renderer/src/components/ai/ChatPanel.tsx`

This task creates the chat UI. All components use the existing primitives design system. Before implementing, check what primitives exist in `src/renderer/src/primitives/` to use the correct component names and props.

- [ ] **Step 1: Create ChatInput component**

```tsx
// src/renderer/src/components/ai/ChatInput.tsx
import { useState, useCallback, type KeyboardEvent } from 'react'
import { useAIStore } from '@/stores/ai'

export function ChatInput() {
  const [input, setInput] = useState('')
  const sendMessage = useAIStore(s => s.sendMessage)
  const isStreaming = useAIStore(s => s.isStreaming)
  const abort = useAIStore(s => s.abort)

  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return
    sendMessage(trimmed)
    setInput('')
  }, [input, isStreaming, sendMessage])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  return (
    <div className="flex gap-2 p-3 border-t border-[var(--color-border)]">
      <textarea
        className="flex-1 resize-none rounded-md border border-[var(--color-border)] bg-[var(--color-bg-input)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        placeholder="Ask about your database..."
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
        disabled={isStreaming}
      />
      {isStreaming ? (
        <button
          onClick={abort}
          className="self-end rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
        >
          Stop
        </button>
      ) : (
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="self-end rounded-md bg-[var(--color-accent)] px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
        >
          Send
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create MessageBubble component**

```tsx
// src/renderer/src/components/ai/MessageBubble.tsx
import type { AIChatMessage } from '@shared/ai-types'

interface MessageBubbleProps {
  message: AIChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isError = message.role === 'assistant' && message.content.startsWith('Error:')

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
          isUser
            ? 'bg-[var(--color-accent)] text-white'
            : isError
              ? 'bg-red-900/30 text-red-300 border border-red-800'
              : 'bg-[var(--color-bg-elevated)] text-[var(--color-text)]'
        }`}
      >
        {message.content}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create ToolCallCard component**

```tsx
// src/renderer/src/components/ai/ToolCallCard.tsx
import { useState } from 'react'
import type { AIChatMessage } from '@shared/ai-types'

interface ToolCallCardProps {
  message: AIChatMessage
}

export function ToolCallCard({ message }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false)
  const toolCall = message.toolCalls?.[0]
  if (!toolCall) return null

  return (
    <div className="mb-3 mx-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
      >
        <span className={`transition-transform ${expanded ? 'rotate-90' : ''}`}>&#9654;</span>
        <span>Tool: {toolCall.name}</span>
      </button>
      {expanded && (
        <pre className="mt-1 ml-4 p-2 rounded bg-[var(--color-bg-inset)] text-xs overflow-auto max-h-40">
          {toolCall.arguments}
        </pre>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create ApprovalCard component**

```tsx
// src/renderer/src/components/ai/ApprovalCard.tsx
import { useAIStore } from '@/stores/ai'

export function ApprovalCard() {
  const pendingApproval = useAIStore(s => s.pendingApproval)
  const respondToApproval = useAIStore(s => s.respondToApproval)

  if (!pendingApproval) return null

  return (
    <div className="mx-2 mb-3 rounded-lg border border-yellow-700 bg-yellow-900/20 p-3">
      <div className="text-sm font-medium text-yellow-300 mb-1">
        Action requires approval
      </div>
      <div className="text-xs text-[var(--color-text-secondary)] mb-2">
        {pendingApproval.toolName}: {pendingApproval.display}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => respondToApproval(pendingApproval.requestId, true)}
          className="rounded px-3 py-1 text-xs bg-green-700 text-white hover:bg-green-600"
        >
          Approve
        </button>
        <button
          onClick={() => respondToApproval(pendingApproval.requestId, false)}
          className="rounded px-3 py-1 text-xs bg-red-700 text-white hover:bg-red-600"
        >
          Reject
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create MessageThread component**

```tsx
// src/renderer/src/components/ai/MessageThread.tsx
import { useRef, useEffect } from 'react'
import { useAIStore } from '@/stores/ai'
import { MessageBubble } from './MessageBubble'
import { ToolCallCard } from './ToolCallCard'
import { ApprovalCard } from './ApprovalCard'

export function MessageThread() {
  const messages = useAIStore(s => s.messages)
  const streamingContent = useAIStore(s => s.streamingContent)
  const isStreaming = useAIStore(s => s.isStreaming)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  return (
    <div className="flex-1 overflow-y-auto p-3">
      {messages.length === 0 && !isStreaming && (
        <div className="flex items-center justify-center h-full text-[var(--color-text-secondary)] text-sm">
          Ask me anything about your database
        </div>
      )}
      {messages.map(msg =>
        msg.toolCalls?.length ? (
          <ToolCallCard key={msg.id} message={msg} />
        ) : msg.role === 'tool' ? (
          <div key={msg.id} className="mb-3 mx-2">
            <div className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg-inset)] rounded p-2">
              {msg.content}
            </div>
          </div>
        ) : (
          <MessageBubble key={msg.id} message={msg} />
        )
      )}
      {streamingContent && (
        <div className="flex justify-start mb-3">
          <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-[var(--color-bg-elevated)] text-[var(--color-text)] whitespace-pre-wrap">
            {streamingContent}
            <span className="inline-block w-1.5 h-4 bg-[var(--color-accent)] animate-pulse ml-0.5 align-text-bottom" />
          </div>
        </div>
      )}
      <ApprovalCard />
      <div ref={bottomRef} />
    </div>
  )
}
```

- [ ] **Step 6: Create ChatPanel component**

```tsx
// src/renderer/src/components/ai/ChatPanel.tsx
import { useEffect } from 'react'
import { useAIStore } from '@/stores/ai'
import { MessageThread } from './MessageThread'
import { ChatInput } from './ChatInput'

export function ChatPanel() {
  const panelOpen = useAIStore(s => s.panelOpen)
  const activeProvider = useAIStore(s => s.activeProvider)
  const activeModel = useAIStore(s => s.activeModel)
  const providers = useAIStore(s => s.providers)
  const models = useAIStore(s => s.models)
  const loadProviders = useAIStore(s => s.loadProviders)
  const loadModels = useAIStore(s => s.loadModels)
  const setActiveProvider = useAIStore(s => s.setActiveProvider)
  const setActiveModel = useAIStore(s => s.setActiveModel)
  const clearMessages = useAIStore(s => s.clearMessages)

  useEffect(() => {
    if (panelOpen) {
      loadProviders()
      loadModels()
    }
  }, [panelOpen, loadProviders, loadModels])

  if (!panelOpen) return null

  return (
    <div className="flex flex-col h-full border-l border-[var(--color-border)] bg-[var(--color-bg)]" style={{ width: 380 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]">
        <span className="text-sm font-medium text-[var(--color-text)]">AI Assistant</span>
        <button
          onClick={clearMessages}
          className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
        >
          Clear
        </button>
      </div>

      {/* Provider/Model selectors */}
      <div className="flex gap-2 px-3 py-2 border-b border-[var(--color-border)]">
        <select
          value={activeProvider?.id ?? ''}
          onChange={e => setActiveProvider(e.target.value)}
          className="flex-1 rounded border border-[var(--color-border)] bg-[var(--color-bg-input)] px-2 py-1 text-xs text-[var(--color-text)]"
        >
          <option value="">Select provider</option>
          {providers.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={activeModel ?? ''}
          onChange={e => setActiveModel(e.target.value)}
          className="flex-1 rounded border border-[var(--color-border)] bg-[var(--color-bg-input)] px-2 py-1 text-xs text-[var(--color-text)]"
        >
          <option value="">Select model</option>
          {models.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Messages */}
      <MessageThread />

      {/* Input */}
      <ChatInput />
    </div>
  )
}
```

- [ ] **Step 7: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add src/renderer/src/components/ai/
git commit -m "feat(ai): implement chat panel React components"
```

---

### Task 18: Integration — Mount Chat Panel in App Shell

**Files:**
- Modify: App shell component that renders the main layout (find the file that renders sidebar + main content area)

- [ ] **Step 1: Find the app shell component**

Search for the main layout component that renders sidebar panels. Look in `src/renderer/src/App.tsx` or `src/renderer/src/components/layout/`.

- [ ] **Step 2: Import and render ChatPanel**

Add the `ChatPanel` component to the right side of the main layout:

```tsx
import { ChatPanel } from '@/components/ai/ChatPanel'
```

Render it alongside the main content area:

```tsx
<div className="flex flex-1 overflow-hidden">
  {/* existing content */}
  <ChatPanel />
</div>
```

- [ ] **Step 3: Add a toggle button for the AI panel**

Add a button to the activity bar or toolbar that toggles the AI panel:

```tsx
import { useAIStore } from '@/stores/ai'

// Inside the component:
const toggleAIPanel = useAIStore(s => s.togglePanel)

// In the toolbar/activity bar:
<button onClick={toggleAIPanel} title="AI Assistant">
  {/* AI icon — use a sparkle or brain icon */}
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1l1.5 3.5L13 6l-3.5 1.5L8 11l-1.5-3.5L3 6l3.5-1.5z" />
  </svg>
</button>
```

- [ ] **Step 4: Test manually**

Run: `pnpm dev`
- Verify the AI toggle button appears
- Click it — the chat panel should slide open on the right
- The provider/model dropdowns should populate
- Type a message — it should appear in the thread (will fail to get AI response without API key, which is expected)

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/
git commit -m "feat(ai): mount chat panel in app shell with toggle button"
```

---

### Task 19: End-to-End Verification

- [ ] **Step 1: Run all tests**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Run the app in dev mode**

Run: `pnpm dev`

Verify:
- App starts without errors in console
- AI toggle button visible in UI
- Chat panel opens/closes
- Provider dropdown shows OpenAI, Anthropic, Ollama
- Model dropdown populates when provider is selected
- Typing a message and pressing Enter adds it to the thread
- With no API key configured, should show a clear error message
- Plugin list (`plugins:list`) includes "AI Assistant"

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix(ai): address integration issues from end-to-end testing"
```
