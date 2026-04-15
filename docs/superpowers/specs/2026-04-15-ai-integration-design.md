# AI Integration & MCP Server Design

## Overview

Three-part enhancement to dbstudio's AI capabilities:

1. **Bug fixes** — get the existing AI chat working end-to-end
2. **MCP server** — expose active database connection to external AI clients (Claude Code, Cursor, etc.)
3. **AI experience enhancements** — NL-to-SQL, inline completions, result explanations, schema-aware chat

## Architecture

```
External Clients (Claude Code, Cursor)
    |
    | SSE/HTTP
    v
+--------------------------------------------------+
| Electron Main Process                            |
|                                                  |
|  +----------------+  +------------------------+ |
|  | MCP Server     |  | AI Module (existing)   | |
|  | (new)          |  | Providers, Tools,      | |
|  | SSE transport  |  | Conversations,         | |
|  | Tool handlers  |  | Permissions, Context   | |
|  | Auth token     |  +------------------------+ |
|  +----------------+                              |
|         |              +------------------------+ |
|         |              | AI Enhancement Layer   | |
|         |              | (new)                  | |
|         |              | NL-to-SQL, Completions | |
|         v              | Explain Results        | |
|  +----------------------------------------------+|
|  | DB Layer (existing)                           ||
|  | DbAdapter, Schema Cache, Connection Manager   ||
|  +----------------------------------------------+|
+--------------------------------------------------+
    |
    | IPC
    v
+--------------------------------------------------+
| Renderer (React)                                 |
|  - Chat Panel (existing, fixed)                  |
|  - Monaco Editor (enhanced: inline suggestions,  |
|    NL input bar)                                 |
|  - Results Grid (enhanced: Explain button)       |
|  - MCP Status indicator (new)                    |
|  - Settings: AI + MCP sections                   |
+--------------------------------------------------+
```

The MCP server and AI module both sit in the main process and access the DB layer directly. MCP tools and AI tools share the same underlying schema/query logic — different transports (HTTP vs IPC).

---

## Area 1: Bug Fixes

### 1.1 IPC Channel Mismatch

**Problem:** AI store calls `ai:approval:respond` but main process expects `ai:chat:approval-response`.

**Fix:** Align the store to use `ai:chat:approval-response` as defined in `shared/ipc.ts`.

**Files:** `src/renderer/src/stores/ai.ts`

### 1.2 Provider/Model Not Persisted

**Problem:** `setActiveProvider()` and `setActiveModel()` only update local Zustand state, never invoke IPC to persist the selection.

**Fix:** Call `ai:providers:set-active` and `ai:models:set-active` IPC channels on selection change.

**Files:** `src/renderer/src/stores/ai.ts`

### 1.3 Model Loading Parameter Ignored

**Problem:** `loadModels(providerId)` sends `providerId` to main process but the `ai:models:list` handler ignores the argument.

**Fix:** Filter models by active provider in the handler.

**Files:** `src/main/ai/index.ts`, `src/main/ai/provider-registry.ts`

### 1.4 Settings Not Wired to Providers

**Problem:** AI settings (API keys, Ollama endpoint) are saved to the config store but providers don't read them at chat time.

**Fix:** Providers read keys from settings store on each request. Settings changes trigger provider reinitialization.

**Files:** `src/main/ai/providers/openai.ts`, `src/main/ai/providers/anthropic.ts`, `src/main/ai/providers/ollama.ts`

### 1.5 AISettings Not Registered

**Problem:** `AISettings.tsx` exists but isn't registered in the settings layout.

**Fix:** Add AI category to `SettingsLayout.tsx`.

**Files:** `src/renderer/src/components/settings/SettingsLayout.tsx`

---

## Area 2: MCP Server

### 2.1 Module Structure

New directory `src/main/mcp/` with:

- `server.ts` — MCP server setup, SSE transport, lifecycle (start/stop)
- `tools.ts` — Tool handler implementations
- `auth.ts` — Bearer token generation and validation middleware

### 2.2 Tools Exposed

| Tool | Description | Parameters | Permission |
|------|-------------|------------|------------|
| `query` | Execute SQL against active connection | `{ sql: string }` | Requires approval |
| `explain_query` | Run EXPLAIN on SQL | `{ sql: string }` | Auto-approve |
| `list_tables` | List tables in schema | `{ schema?: string }` | Auto-approve |
| `describe_table` | Get columns, indexes, FKs | `{ table: string, schema?: string }` | Auto-approve |
| `get_schemas` | List available schemas/databases | `{}` | Auto-approve |
| `connection_info` | Get active connection details | `{}` | Auto-approve |

### 2.3 Security

- **Authentication:** Random bearer token generated on server start. Displayed in Settings > MCP panel. User copies token into their MCP client config. All requests validated against token.
- **No open port by default:** MCP server is opt-in, toggled from settings.
- **Write query approval:** Write/mutating queries trigger a notification in dbstudio's renderer. User approves or rejects in the UI. The MCP request blocks until resolved.

### 2.4 Approval Flow (Write Queries)

1. Claude Code sends `query` tool call with SQL
2. MCP server detects write query (INSERT/UPDATE/DELETE/DROP/ALTER/CREATE/TRUNCATE)
3. MCP server sends approval request to renderer via IPC (`mcp:approval-request`)
4. Renderer shows approval card with SQL preview, Approve/Reject buttons
5. User responds in dbstudio UI
6. Renderer sends response via IPC (`mcp:approval-response`)
7. MCP server executes or rejects the query, returns result to Claude Code

### 2.5 Settings

- **Enable MCP Server** — toggle (default: off)
- **Port** — number input (default: 3100)
- **Auth Token** — auto-generated, read-only field with copy button
- **Regenerate Token** — button to generate a new token (invalidates existing clients)

### 2.6 Status Indicator

Activity bar shows MCP server status when enabled:
- Icon in activity bar (e.g., radio/broadcast icon)
- Tooltip shows: running/stopped, port, connected client count

### 2.7 Client Configuration

Users add this to their Claude Code config (`~/.claude.json`):

```json
{
  "mcpServers": {
    "dbstudio": {
      "type": "sse",
      "url": "http://localhost:3100/mcp",
      "headers": {
        "Authorization": "Bearer <token-from-settings>"
      }
    }
  }
}
```

### 2.8 Dependencies

- `@modelcontextprotocol/sdk` — official MCP SDK for server implementation

---

## Area 3: AI Experience Enhancements

### 3.1 Natural Language to SQL

**UI:** Input bar above Monaco editor in query tabs. Sparkle icon, text input, "Generate" button.

**Flow:**
1. User types natural language description
2. "Generate" sends prompt + active connection's schema context to AI provider
3. AI returns SQL
4. SQL is inserted into the Monaco editor
5. User reviews, edits, then runs normally via existing Run button

**IPC Channel:** `ai:generate-sql`
- Args: `{ prompt: string, connectionId: string, schema?: string }`
- Returns: `{ sql: string }`

**Backend:** New handler in `src/main/ai/enhancements.ts`. Builds a system prompt with schema context (tables, columns, types, relationships), sends user prompt to active AI provider, extracts SQL from response.

**Files:**
- `src/main/ai/enhancements.ts` (handler)
- `src/renderer/src/components/ai/NLInputBar.tsx` (UI component)
- Query tab component (mount NLInputBar above editor)

### 3.2 Inline SQL Suggestions

**UI:** Ghost text completions in Monaco editor as user types SQL. Tab to accept, Esc to dismiss, continue typing to refine.

**Flow:**
1. User pauses typing for 300ms (debounce)
2. InlineCompletionProvider sends current SQL + cursor position + schema context to AI
3. AI returns completion text
4. Monaco renders as ghost text at cursor position

**IPC Channel:** `ai:complete-sql`
- Args: `{ sql: string, cursorOffset: number, connectionId: string, schema?: string }`
- Returns: `{ completion: string }`

**Backend:** Handler in `src/main/ai/enhancements.ts`. Uses a lightweight prompt optimized for fast completions (shorter context, instruction to return only the completion text).

**Files:**
- `src/main/ai/enhancements.ts` (handler)
- `src/renderer/src/lib/monaco-ai-completion.ts` (InlineCompletionProvider)
- Monaco editor setup (register provider)

### 3.3 Explain Query Results

**UI:** "Explain" button in results toolbar (next to Export). Clicking opens a collapsible panel below the results grid showing the AI explanation.

**Flow:**
1. User runs a query, sees results in grid
2. Clicks "Explain" button
3. Sends SQL + column names + row count + sample rows (first 5) to AI
4. AI returns natural language explanation
5. Explanation shown in collapsible panel below grid with streaming text

**IPC Channel:** `ai:explain-results`
- Args: `{ sql: string, columns: string[], rowCount: number, sampleRows: Record<string, unknown>[] }`
- Returns: `{ explanation: string }`

**Backend:** Handler in `src/main/ai/enhancements.ts`. Prompt instructs AI to summarize what the query does, highlight notable patterns in the data, and flag potential issues.

**Files:**
- `src/main/ai/enhancements.ts` (handler)
- `src/renderer/src/components/ai/ExplainPanel.tsx` (UI component)
- Results grid component (add Explain button + mount ExplainPanel)

### 3.4 Schema-Aware Chat Autocomplete

**UI:** Type `@` in chat input to trigger a dropdown of tables and columns from the schema cache. Filter as you type. Enter to insert. Shows table/column name and data type.

**Flow:**
1. User types `@` in chat input
2. Dropdown opens, populated from schema Zustand store (already loaded)
3. User filters by typing (e.g., `@ord` shows `orders`, `orders.status`, etc.)
4. Enter inserts `@table.column` reference into chat text
5. On send, `@` references are resolved to explicit schema context appended to the AI prompt

**Implementation:** Entirely client-side — reads from existing schema store. No new IPC channel needed.

**Files:**
- `src/renderer/src/components/ai/SchemaAutocomplete.tsx` (dropdown component)
- `src/renderer/src/components/ai/ChatInput.tsx` (integrate trigger + dropdown)
- `src/renderer/src/stores/ai.ts` (resolve `@` references before sending message)

---

## New IPC Channels Summary

```typescript
// MCP Server
'mcp:start': { args: []; return: { port: number; token: string } }
'mcp:stop': { args: []; return: void }
'mcp:status': { args: []; return: { running: boolean; port: number; clients: number } }
'mcp:approval-request': { args: [request: MCPApprovalRequest]; return: void }  // main → renderer
'mcp:approval-response': { args: [requestId: string, approved: boolean]; return: void }

// AI Enhancements
'ai:generate-sql': { args: [request: { prompt: string; connectionId: string; schema?: string }]; return: { sql: string } }
'ai:complete-sql': { args: [request: { sql: string; cursorOffset: number; connectionId: string; schema?: string }]; return: { completion: string } }
'ai:explain-results': { args: [request: { sql: string; columns: string[]; rowCount: number; sampleRows: Record<string, unknown>[] }]; return: { explanation: string } }
```

## New Files

```
src/main/mcp/server.ts          — MCP server setup + SSE transport
src/main/mcp/tools.ts           — Tool handler implementations
src/main/mcp/auth.ts            — Token generation + validation
src/main/ai/enhancements.ts     — NL-to-SQL, completions, explain handlers
src/renderer/src/components/ai/NLInputBar.tsx        — Natural language input bar
src/renderer/src/components/ai/ExplainPanel.tsx      — Results explanation panel
src/renderer/src/components/ai/SchemaAutocomplete.tsx — @ mention dropdown
src/renderer/src/components/settings/categories/MCPSettings.tsx — MCP server settings
src/renderer/src/lib/monaco-ai-completion.ts         — Inline completion provider
```

## Modified Files

```
shared/ipc.ts                   — Add new IPC channel definitions
shared/settings.ts              — Add MCP settings type
src/main/ipc-handlers.ts        — Register new IPC handlers, fix existing ones
src/main/ai/index.ts            — Fix model loading, expose enhancements
src/main/ai/provider-registry.ts — Filter models by provider
src/main/ai/providers/openai.ts  — Read API key from settings
src/main/ai/providers/anthropic.ts — Read API key from settings
src/main/ai/providers/ollama.ts   — Read endpoint from settings
src/renderer/src/stores/ai.ts    — Fix IPC channels, persist selections, @ resolution
src/renderer/src/components/ai/ChatInput.tsx — Integrate SchemaAutocomplete
src/renderer/src/components/settings/SettingsLayout.tsx — Add AI + MCP categories
src/renderer/src/lib/monaco-sql.ts — Register AI inline completion provider
```

## Dependencies

- `@modelcontextprotocol/sdk` — MCP server SDK (new)
