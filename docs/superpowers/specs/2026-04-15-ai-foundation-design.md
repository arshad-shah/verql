# AI Foundation & Extension Design

**Date**: 2026-04-15
**Status**: Approved

## Overview

Add an AI extension layer to dbstudio that enables natural language interaction with databases, contextual AI actions throughout the app, and an extensible provider/tool system. The design follows a hybrid approach: a thin AI foundation in core provides infrastructure (providers, tools, permissions, streaming), while a bundled AI plugin delivers the user-facing features (chat panel, context menus, completions).

### Goals

- Natural language to SQL and back
- Conversational AI assistant with full schema awareness
- Contextual AI actions embedded throughout the app (context menus, completions, toolbar)
- Tiered permission model: read actions auto-execute, write actions require approval
- Provider-agnostic with built-in adapters (OpenAI, Anthropic, Ollama)
- Extensible by other plugins (custom tools, providers, context)

### Non-Goals

- Autonomous agents that act without user initiation
- Data sent to providers beyond the current conversation
- Background AI processing
- Cross-connection access (AI scoped to active connection only)

---

## Architecture

Two layers:

```
┌─────────────────────────────────────────────────┐
│  AI Plugin (src/main/plugins/bundled/ai/)        │
│  Chat panel, context menus, completions,         │
│  built-in tools, settings                        │
├─────────────────────────────────────────────────┤
│  AI Foundation (src/main/ai/)                    │
│  Provider registry, tool registry, permissions,  │
│  conversation manager, streaming IPC             │
├─────────────────────────────────────────────────┤
│  Existing Plugin SDK + Extensions                │
│  React panels, ctx.ai.*, context providers       │
└─────────────────────────────────────────────────┘
```

---

## AI Foundation Layer (`src/main/ai/`)

### Provider Interface & Registry

```typescript
interface AIProvider {
  id: string;
  name: string;
  models(): Promise<AIModel[]>;
  chat(request: AIChatRequest): AsyncIterable<AIChatChunk>;
  supportsToolCalling: boolean;
}

interface AIModel {
  id: string;
  name: string;
  contextWindow: number;
  capabilities: ('chat' | 'tool-calling')[];
}

interface AIChatRequest {
  model: string;
  messages: AIChatMessage[];
  tools?: AIToolDefinition[];
  signal?: AbortSignal;
}

interface AIChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: { id: string; name: string; arguments: unknown }[];
  toolCallId?: string;   // For role: 'tool' — which call this responds to
  timestamp: number;
}

interface AIChatChunk {
  type: 'text' | 'tool-call' | 'done' | 'error';
  content?: string;          // For text chunks
  toolCall?: {               // For tool-call chunks
    id: string;
    name: string;
    arguments: unknown;
  };
  error?: string;            // For error chunks
}
```

`AIProviderRegistry`:
- `register(provider: AIProvider)` / `unregister(id: string)`
- `getProvider(id: string)` / `listProviders()`
- `getActiveProvider()` / `setActiveProvider(id: string)`
- Built-in adapters: `OpenAIProvider`, `AnthropicProvider`, `OllamaProvider`
- API keys stored via `KeyringAccess`, never exposed to renderer

### Tool System

```typescript
interface AITool {
  id: string;
  name: string;
  description: string;
  parameters: JSONSchema;
  permission: 'read' | 'write';
  execute(params: unknown, context: AIToolContext): Promise<AIToolResult>;
}

interface AIToolContext {
  connectionId: string;
  abortSignal: AbortSignal;
}

interface AIToolResult {
  success: boolean;
  data: unknown;
  display?: string;  // Human-readable summary for chat UI
}
```

`AIToolRegistry`:
- `register(tool: AITool)` / `unregister(id: string)`
- `getTool(id: string)` / `listTools()`
- `execute(toolId, params, context)` — checks permission tier before executing

### Permission System

Tiered model enforced in main process:

- **read** tools: auto-execute, result returned to AI immediately
- **write** tools: pause AI stream, send approval request to renderer, wait for user response
  - Approve: execute tool, return result to AI, resume streaming
  - Reject: return rejection context to AI, AI acknowledges and continues
- Per-tool overrides configurable in settings (e.g., promote SELECT-only `query.execute` to read)
- Approval enforced in main process — renderer cannot bypass

### Conversation Manager

Manages chat lifecycle in main process:

- Message history: user, assistant, tool calls, tool results, approval requests
- Context assembly: system prompt + active connection info + schema summary + plugin context contributions + message history
- Streaming orchestration: provider stream → tool call interception → approval flow → IPC broadcast
- Token-aware truncation: drops oldest messages when approaching model context window
- Abort support via `AbortController`

---

## SDK Extensions

### React Panel Support

- New `contributes.views[]` manifest field: `{ id, title, icon, location }`
- Renderer maps view IDs to built-in React components for bundled plugins
- Third-party React panels deferred to future work

### Streaming IPC Channels

| Channel | Direction | Purpose |
|---|---|---|
| `ai:chat:start` | renderer→main | Start a chat with message text |
| `ai:chat:chunk` | main→renderer | Stream text delta |
| `ai:chat:tool-call` | main→renderer | AI invoked a tool (for UI display) |
| `ai:chat:tool-result` | main→renderer | Tool execution result |
| `ai:chat:approval-request` | main→renderer | Write tool needs user approval |
| `ai:chat:approval-response` | renderer→main | User approved/rejected |
| `ai:chat:end` | main→renderer | Stream complete |
| `ai:chat:abort` | renderer→main | User cancelled |

### Plugin SDK AI Access

New optional `ai` namespace on `PluginContext`:

```typescript
ctx.ai.registerTool(tool: AITool)
ctx.ai.registerProvider(provider: AIProvider)
ctx.ai.registerContextProvider({
  id: string,
  appliesTo: (connectionId: string) => boolean,
  getContext: (connectionId: string) => Promise<string>
})
```

Plugins that don't use AI simply ignore `ctx.ai`. Context providers let driver plugins contribute driver-specific guidance to the AI system prompt (e.g., MongoDB plugin tells the AI to use MongoDB query syntax).

---

## AI Plugin (`src/main/plugins/bundled/ai/`)

### Chat Panel

React sidebar panel providing:

- Message thread with markdown rendering, syntax-highlighted SQL blocks
- "Copy" and "Run in new tab" buttons on SQL code blocks
- Tool call visualization as collapsible cards
- Approval cards for write actions with action preview + approve/reject buttons
- Streaming token display
- Context indicator showing active connection/schema
- Input bar with send, model selector, abort button

### Contextual Actions

Commands registered via existing command + context menu system:

| Context | Action | Behavior |
|---|---|---|
| Table context menu | "Explain table" | Opens chat, sends prompt with table schema |
| Table context menu | "Generate sample queries" | Opens chat, generates SELECT/JOIN examples |
| Table context menu | "Suggest indexes" | Opens chat, analyzes query patterns |
| Column context menu | "Explain column" | Opens chat, describes column usage/relationships |
| Query editor context menu | "Explain query" | Opens chat, explains selected SQL |
| Query editor context menu | "Optimize query" | Opens chat, suggests improvements |
| Query editor context menu | "Fix errors" | Opens chat, diagnoses SQL errors |
| Query results toolbar | "Summarize results" | Opens chat, provides data summary |

### AI Completions

Registers a completion provider alongside existing static completions:

- Triggers for complex suggestions (WHERE clauses, JOINs based on FKs)
- Debounced to avoid excessive API calls
- Local cache for repeated patterns
- Falls back gracefully when AI provider is unavailable

### Built-in Tools

| Tool | Permission | Description |
|---|---|---|
| `schema.listTables` | read | List all tables in current schema |
| `schema.describeTable` | read | Columns, types, keys, indexes for a table |
| `schema.getRelationships` | read | Foreign key relationships |
| `query.explain` | read | Run EXPLAIN without executing |
| `query.execute` | write | Execute SQL query |
| `connection.info` | read | Current connection details |
| `data.export` | write | Export results to CSV/JSON |
| `tab.openQuery` | write | Open new query tab with SQL |

### Settings

| Setting | Type | Default |
|---|---|---|
| Provider | dropdown | (none — must configure) |
| Model | dynamic dropdown | (from provider) |
| API Key | password (keyring) | — |
| Ollama endpoint | text | `http://localhost:11434` |
| Auto-include schema context | toggle | on |
| Max context messages | number | 20 |

---

## Renderer Integration

### AI Store (`src/renderer/src/stores/ai.ts`)

Zustand store managing:

- `messages: AIChatMessage[]` — full chat history
- `isStreaming: boolean` — response in progress
- `activeProvider: string` / `activeModel: string`
- `panelOpen: boolean` — chat panel visibility
- Subscribes to streaming IPC channels and updates reactively

### Chat Panel Component (`src/renderer/src/components/ai/`)

- Uses existing primitives design system for all UI elements
- Markdown rendering with fenced code block enhancements (copy, run)
- Tool calls as collapsible cards
- Approval requests as action cards
- Auto-scroll with manual scroll override
- Responsive layout in sidebar

### Context Menu & Completions

- Context menu items work through existing `plugins:ui:action` IPC
- Completions work through existing `plugins:completions` IPC
- No new renderer infrastructure needed for these

---

## Data Flow

```
User message → renderer ai:chat:start
→ Main: ConversationManager.assembleContext()
  (system prompt + schema + context providers + history + message)
→ Main: AIProvider.chat(request) → AsyncIterable<AIChatChunk>
→ text chunks: broadcast ai:chat:chunk → renderer updates messages
→ tool call: check AIToolRegistry
  → read: execute immediately → send result to AI → continue
  → write: broadcast ai:chat:approval-request → wait
    → approved: execute → result to AI → continue
    → rejected: rejection context to AI → continue
→ stream done: broadcast ai:chat:end
```

## Security

- API keys stored in OS keyring, never sent to renderer
- Tool execution in main process only — renderer requests via IPC
- Schema context is metadata only (names, types) — no row data unless user explicitly queries
- Write tool approval enforced in main process — cannot be bypassed from renderer
- Tool results wrapped with delimiters, system prompt treats them as data

---

## File Structure

```
src/main/ai/
  index.ts                    # AI module entry, wires registries + IPC
  types.ts                    # AIProvider, AITool, AIChatMessage, etc.
  provider-registry.ts        # AIProviderRegistry
  tool-registry.ts            # AIToolRegistry
  permission-manager.ts       # Tiered permission enforcement
  conversation-manager.ts     # Context assembly, streaming orchestration
  providers/
    openai.ts                 # OpenAI adapter
    anthropic.ts              # Anthropic adapter
    ollama.ts                 # Ollama adapter

src/main/plugins/bundled/ai/
  plugin-manifest.json        # Declares commands, context menus, views, settings
  index.ts                    # activate() — registers tools, commands, context menus, completions
  tools/                      # Built-in tool implementations
    schema-tools.ts
    query-tools.ts
    connection-tools.ts

src/main/plugins/sdk/
  ai-access.ts                # ctx.ai namespace (registerTool, registerProvider, registerContextProvider)

shared/
  ai-types.ts                 # Shared types for IPC (messages, chunks, approval requests)

src/renderer/src/
  stores/ai.ts                # Zustand AI store
  components/ai/
    ChatPanel.tsx             # Main chat panel
    MessageThread.tsx         # Message list rendering
    MessageBubble.tsx         # Individual message (markdown, code blocks)
    ToolCallCard.tsx          # Collapsible tool call display
    ApprovalCard.tsx          # Write action approval UI
    ChatInput.tsx             # Input bar with send/abort/model selector
```
