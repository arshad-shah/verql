# MCP Tooling Unification & Control — Design

**Date:** 2026-05-27
**Status:** Approved (shape) — pending written-spec review
**Scope:** Verql MCP server integration: dedup, an SDK-provided tool capability, a control panel + activity log, port-conflict handling, and proper code highlighting.

## Goals

1. **Zero duplication** of tool definitions across the MCP server, the in-app AI agent, and dead code.
2. **SDK provides capability, plugins provide logic.** The shared tool abstraction lives in the plugin SDK so any current or future AI/automation plugin can reference it. No tool *logic* lives in core app code.
3. **MCP independent of the AI chat plugin.** MCP tooling works even when the AI plugin is disabled.
4. **More control:** per-tool enable/disable, a global read-only mode, a configurable row limit, and a live activity log of MCP tool calls.
5. **Robust startup:** auto-resolve port conflicts with a user-controllable fixed-port escape hatch and clear error reporting.
6. **Proper highlighting:** SQL and config JSON shown to the user are syntax-highlighted, not rendered as generic monospace text.

## Current state (problems)

- `src/main/mcp/tools.ts` `registerMCPTools()` is **dead code** — never imported. The six tools (`query`, `explain_query`, `list_tables`, `describe_table`, `get_schemas`, `connection_info`) are defined here with JSON-Schema + handlers, and **again inline with Zod** in `server.ts`. Only `isWriteQuery` is actually used from `tools.ts`.
- A **third** parallel catalog lives in the AI plugin: `bundled/ai/tools/schema-tools.ts` + `query-tools.ts`. Same capabilities, different access layer (`SchemaAccess`/`ConnectionAccess`), different shape (`AITool`).
- `MCPToolContext.requestApproval` is passed as `async () => true` and never consumed (server has its own approval closure).
- The Claude client config object is built **twice** in `MCPSettings.tsx` (copy handler + inline `<pre>`), free to drift.
- The status shape `{ running, port, clients, token }` is re-typed inline in three places (`MCPSettings` ×2, `ActivityBar`).
- `MCPApprovalDialog` renders the SQL a client wants to run in a plain `<pre>` — no highlighting, on the most security-sensitive surface. `MCPSettings` renders config JSON in a plain `<pre>`.
- No control beyond a binary write-approval; row limit is hardcoded `slice(0, 500)`; no visibility into client activity.
- Port conflict (`EADDRINUSE`) surfaces only as an unhandled `console.error`; the UI shows nothing useful.

## Architecture

### Roles

| Concern | Owner | Notes |
|---|---|---|
| `Tool` contract, `ToolContext`, `ToolResult`, `ToolRegistry`, helpers | **SDK** (`src/main/plugins/sdk/`) | The reusable capability. |
| DB tool *logic* (query, schema, etc.) | **New bundled `db-tools` plugin** | Always-on; the only place tool logic lives. |
| Exposing tools over MCP (SSE transport, auth, approval, activity) | **Core MCP server** | Consumer of the registry. Independent of AI plugin. |
| Feeding tools to the LLM | **AI plugin** | Consumer of the registry. Stops owning tool definitions. |

This honors "SDK provides what plugins need; plugins provide the logic." Core (the MCP server) consumes a registry that a plugin populates — the same declarative pattern already used for drivers, commands, and panels.

### SDK: the `Tool` capability

New `src/main/plugins/sdk/tool-registry.ts` and additions to `sdk/types.ts`:

```ts
export interface Tool {
  id: string                       // 'query', 'list_tables', …
  name: string                     // human label
  description: string              // shown to LLM / MCP client
  inputSchema: z.ZodObject<z.ZodRawShape>   // single source of truth
  permission: 'read' | 'write'
  execute(params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult>
}

export interface ToolContext {
  connectionId: string | null
  abortSignal: AbortSignal
}

export interface ToolResult {
  success: boolean
  data: unknown
  display?: string                 // short human summary
}

export interface ToolRegistry {
  register(tool: Tool): Disposable
  unregister(id: string): void
  get(id: string): Tool | undefined
  list(): Tool[]
  onChange(cb: () => void): Disposable          // for consumers to re-sync
}
```

- **Zod is the single source of truth** for parameters. Consumers that need JSON Schema derive it via a helper `toJsonSchema(tool.inputSchema)` (backed by `zod-to-json-schema`, already a transitive dep of the MCP SDK).
- Tools close over their access objects (`SchemaAccess`/`ConnectionAccess`) at creation time, exactly as the AI tools do today, so `ToolContext` stays minimal (`connectionId` + `abortSignal`).
- The registry is a **host-owned shared instance** created by the plugin host / `BootCoordinator`, passed into every `PluginContext` as `ctx.tools` and into the MCP server's deps. Disabling a contributing plugin disposes its registrations (standard `Disposable` flow), and `onChange` lets consumers re-sync.

SDK helpers (promoted out of core/AI internals, no logic duplication):
- `toJsonSchema(schema)` — Zod → JSON Schema for LLM tool definitions.
- `isWriteQuery(sql)` — moved verbatim from `mcp/tools.ts` (with its tests) into `sdk/sql-statements.ts` (co-located with existing SQL helpers). It remains the **content-level** write guard, complementary to a tool's `permission` flag.

### Bundled `db-tools` plugin

`src/main/plugins/bundled/db-tools/` — a minimal always-on plugin that registers the canonical tools into `ctx.tools`:

- `query` (write) — execute SQL; truncate rows to the configured `maxRows`.
- `explain_query` (read) — `EXPLAIN <sql>`; still subject to `isWriteQuery` content check.
- `list_tables` (read), `describe_table` (read), `get_schemas` (read), `connection_info` (read).

Logic is migrated from the AI plugin's `schema-tools.ts`/`query-tools.ts` and `server.ts`'s inline tools, reconciled into one definition each. The AI plugin's `tools/` directory and its `AIToolRegistry`/tool ownership are removed; the AI conversation manager reads tools and their JSON-Schema definitions from `ctx.tools` instead.

> The db-tools plugin cannot be deactivated via the normal disable flow (or is hidden from the disable list), so MCP always has tools. This is enforced in the plugin host's disable handling.

### Core MCP server (consumer)

`src/main/mcp/server.ts` is rebuilt to:

1. Receive the shared `ToolRegistry`, the `mcp` settings facade, and an active-connection resolver in its deps.
2. Build the `McpServer` tool set from the registry, **filtered** by: not in `disabledTools`, and (if `readOnly`) `permission === 'read'`. Each `Tool` is adapted to `mcpServer.tool(id, description, inputSchema.shape, handler)`.
3. Handler flow per call: resolve active `connectionId` (error if none) → if tool is `write` **or** `isWriteQuery(params.sql)` is true, route through the **approval** gate → execute with a fresh `AbortController` → map `ToolResult`/throw → `{ content: [{ type:'text', text }] }` → **record an activity entry**.
4. On `mcp` settings change or registry `onChange`, rebuild the tool set and emit MCP `listChanged`.

`mcp/tools.ts` is deleted. `MCPToolContext` and its dead `requestApproval` are removed.

### Control surfaces

Extend `MCPSettings` in `shared/settings.ts`:

```ts
export interface MCPSettings {
  enabled: boolean
  port: number
  token: string
  autoPort: boolean          // default true — auto-resolve conflicts
  readOnly: boolean          // default false
  maxRows: number            // default 500 — replaces hardcoded slice
  disabledTools: string[]    // default [] — tool ids the user turned off
}
```

New shared types in `shared/mcp.ts`:

```ts
export interface MCPServerStatus {
  running: boolean
  port: number
  clients: number
  token: string
  autoSelectedPort: boolean   // true when the bound port differs from requested
}

export interface MCPToolInfo {
  id: string; name: string; description: string
  permission: 'read' | 'write'; enabled: boolean
}

export interface MCPActivityEntry {
  id: string; timestamp: number; toolId: string
  paramsSummary: string
  status: 'ok' | 'error' | 'rejected'
  durationMs: number
}
```

`MCPServerStatus` replaces the three inline re-types (`MCPSettings` ×2, `ActivityBar`).

### Activity log

The MCP server keeps an in-memory ring buffer (last 100) of `MCPActivityEntry`. Each tool call appends an entry and broadcasts `mcp:activity-event`. Memory-only; not persisted.

### Port-conflict resolution

`start(requestedPort)`:
- If `autoPort`: attempt to bind; on `EADDRINUSE`, probe `requestedPort+1 … requestedPort+20` for a free port, bind the first available, set `autoSelectedPort = true`.
- If `!autoPort`: on `EADDRINUSE`, reject with a structured error `{ code: 'EADDRINUSE', port }`.
- Returns `{ port, token, autoSelectedPort }`.

Renderer: `MCPSettings` shows the **actual** running port, a banner when `autoSelectedPort` is true ("requested 3100, using 3101"), and an inline error + retry when a fixed-port bind fails. The displayed/copied client config always reflects the real bound port.

### IPC changes (`shared/ipc.ts`)

- `mcp:start` → returns `MCPServerStatus`-ish `{ port, token, autoSelectedPort }`; may reject with the structured port error.
- `mcp:status` → `MCPServerStatus`.
- `mcp:tools` (new) → `MCPToolInfo[]` for the toggle UI.
- `mcp:set-tool-enabled` (new) → `(toolId, enabled)`; persists to `disabledTools`, rebuilds tool set.
- `mcp:activity` (new) → `MCPActivityEntry[]`.
- `mcp:regenerate-token` (new) → generates + persists a new token, restarts if running. Replaces the brittle "set token to `''` then restart".
- `mcp:approval-response` → unchanged.
- Event `mcp:approval-request` → enriched payload `{ requestId, toolId, toolName, sql, permission }`.
- Event `mcp:activity-event` (new) → `MCPActivityEntry`.

### Code highlighting

Extract a presentational primitive `src/renderer/src/primitives/data-display/CodeView.tsx`: shiki highlight (SQL/JSON/JS) + sanitized HTML + copy button. **No** editor/store coupling. The existing AI `CodeBlock` is refactored to render `CodeView` plus its "Insert into editor" button (keeps tabs/connections coupling localized to the AI surface).

- `MCPApprovalDialog` renders the pending SQL via `CodeView` (highlighted) and shows the requesting tool name + a read/write badge from the enriched approval payload.
- `MCPSettings` renders the Claude client config JSON via `CodeView`, built from a single `buildMcpClientConfig({ port, token })` helper (in `shared/mcp.ts`) used by both the copy action and the display — killing the duplicated config object.

## Data flow (MCP query call)

```
MCP client → POST /messages (Bearer token)
  → server validates auth
  → adapts to Tool via ToolRegistry.get(id)
  → gate: disabledTools? readOnly+write? → reject
  → permission==='write' or isWriteQuery(sql)? → requestApproval()
       → broadcast mcp:approval-request → MCPApprovalDialog (CodeView) → mcp:approval-response
  → tool.execute({…}, { connectionId, abortSignal })
  → map ToolResult → { content:[{type:'text', text}] }
  → append MCPActivityEntry + broadcast mcp:activity-event
  → respond to client
```

## Error handling

- No active connection → tool returns `isError` content ("No active database connection in Verql").
- Disabled tool / read-only violation → `isError` content explaining the gate.
- Approval timeout (5 min) or rejection → `isError` content; activity status `rejected`.
- `EADDRINUSE` → auto-resolve or structured error per `autoPort`; surfaced in settings.
- Tool execution throw → caught, mapped to `isError` content; activity status `error`.

## Testing

- **Unit:** `isWriteQuery` (moved, existing cases retained); `toJsonSchema` derivation; `ToolRegistry` register/unregister/onChange; MCP tool adapter (result mapping, approval gating, read-only + disabled gating); port auto-find on simulated `EADDRINUSE`; `buildMcpClientConfig`.
- **Storybook:** `CodeView` stories (SQL + JSON) with the a11y check; `MCPApprovalDialog` story.
- Run `pnpm test` and `pnpm exec tsc -b --noEmit` before completion.

## Out of scope

- Replacing the SSE transport (keep as-is).
- Multi-connection MCP (stays scoped to the active connection).
- AI provider/model changes beyond consuming JSON Schema from the shared registry.
- Persisting the activity log across restarts.

## File-level change summary

**SDK**
- `sdk/tool-registry.ts` (new) — `ToolRegistry` impl.
- `sdk/types.ts` — `Tool`, `ToolContext`, `ToolResult`, `ToolRegistry`; add `tools` to `PluginContext`.
- `sdk/sql-statements.ts` — host `isWriteQuery` + `toJsonSchema` helper (or a small `sdk/tool-schema.ts`).
- `sdk/ai-access.ts` — **remove `registerTool` outright** (clean break, no deprecated shim — tools are registered only via `ctx.tools.register`); keep `registerProvider`/`registerContextProvider`. The `AIService` interface and any callers are updated to match.

**Plugins**
- `bundled/db-tools/` (new) — manifest + tool registrations (migrated logic).
- `bundled/ai/` — remove `tools/`, `internal/tool-registry.ts`; conversation manager + permission manager read from `ctx.tools`; `index.ts` no longer registers tools.
- `plugin-host.ts` / `BootCoordinator` — create + share `ToolRegistry`; keep db-tools always active.

**Core MCP**
- `mcp/server.ts` — rebuilt as registry consumer with control gates, activity log, port resolution.
- `mcp/tools.ts` — deleted.
- `ipc/mcp.ts` — new handlers (`mcp:tools`, `mcp:set-tool-enabled`, `mcp:activity`, `mcp:regenerate-token`); wire registry + active-connection resolver.

**Shared**
- `shared/settings.ts` — extended `MCPSettings` + defaults.
- `shared/mcp.ts` (new) — `MCPServerStatus`, `MCPToolInfo`, `MCPActivityEntry`, `buildMcpClientConfig`.
- `shared/ipc.ts` — new channels/events + enriched approval payload.

**Renderer**
- `primitives/data-display/CodeView.tsx` (new) + stories.
- `components/ai/CodeBlock.tsx` — wraps `CodeView`.
- `components/settings/categories/MCPSettings.tsx` — tool toggles, read-only switch, row-limit, activity feed, port banner/error, `CodeView` config, `regenerate-token` via real handler.
- `components/ai/MCPApprovalDialog.tsx` — `CodeView` SQL + tool/permission badge.
- `components/shell/ActivityBar.tsx` — use shared `MCPServerStatus`.
- `stores/ai.ts` — enriched MCP approval payload type.
