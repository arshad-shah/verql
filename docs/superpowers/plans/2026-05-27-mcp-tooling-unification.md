# MCP Tooling Unification & Control — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three duplicate MCP/AI tool catalogs with one SDK-provided `ToolRegistry` consumed by both the MCP server and the AI plugin, move tool logic into a bundled `db-tools` plugin, add MCP control + activity surfaces, port-conflict resolution, and syntax-highlighted SQL/config.

**Architecture:** The SDK gains a host-owned `ToolRegistry` (`ctx.tools`) plus a `Tool` contract (Zod input schema is the single source of truth) and helpers. A new always-on `db-tools` bundled plugin registers the canonical tools. The core MCP server and the AI plugin both *consume* the registry; neither owns tool logic. New renderer surfaces add per-tool toggles, read-only mode, a row-limit, an activity feed, and a reusable `CodeView` highlighter.

**Tech Stack:** Electron + React 19, TypeScript, Zod, `@modelcontextprotocol/sdk`, `zod-to-json-schema`, Vitest (jsdom + Storybook/Playwright projects), shiki, Zustand, CVA primitives.

**Reference spec:** `docs/superpowers/specs/2026-05-27-mcp-tooling-unification-design.md`

**Conventions for every task:**
- Run a single test file with `pnpm test -- --run tests/unit/<path>`.
- After each task's tests pass, also run `pnpm exec tsc -b --noEmit` before committing (esbuild-based `pnpm test` does **not** typecheck — type errors otherwise reach CI).
- Commit messages use Conventional Commits and end with the `Co-Authored-By` trailer used on this branch.
- Work happens on branch `feat/mcp-tooling-unification`.

---

## File Structure

**SDK (capability — no tool logic)**
- `src/main/plugins/sdk/tool-schema.ts` (new) — `isWriteQuery`, `toJsonSchema`.
- `src/main/plugins/sdk/tool-registry.ts` (new) — `ToolRegistryImpl`.
- `src/main/plugins/sdk/types.ts` (modify) — `Tool`, `ToolContext`, `ToolResult`, `ToolRegistry`; add `tools` to `PluginContext`.
- `src/main/plugins/sdk/ai-access.ts` (modify) — remove `registerTool`.
- `src/main/plugins/sdk/index.ts` (modify) — export new SDK symbols.

**Plugin host (wiring)**
- `src/main/plugins/plugin-host.ts` (modify) — own a shared `ToolRegistry`, inject into context + expose to deps.
- `src/main/plugins/define-plugin.ts` / `createPluginContext` (modify) — accept + expose `tools`.

**Bundled plugins (logic + consumer)**
- `src/main/plugins/bundled/db-tools/index.ts` (new) — manifest + register tools.
- `src/main/plugins/bundled/db-tools/tools.ts` (new) — the six tool definitions.
- `src/main/plugins/bundled/ai/index.ts` (modify) — stop registering tools.
- `src/main/plugins/bundled/ai/internal/index.ts` (modify) — consume shared registry; drop `registerTool` from service.
- `src/main/plugins/bundled/ai/internal/conversation-manager.ts` (modify) — import shared types/registry.
- `src/main/plugins/bundled/ai/internal/tool-registry.ts` (delete).
- `src/main/plugins/bundled/ai/internal/types.ts` (modify) — drop `AITool`/`AIToolContext`/`AIToolExecutionResult` (use SDK `Tool`).
- `src/main/plugins/bundled/ai/tools/` (delete directory).

**Core MCP**
- `src/main/mcp/server.ts` (rewrite) — registry consumer, control gates, activity log, port resolution.
- `src/main/mcp/tools.ts` (delete).
- `src/main/mcp/auth.ts` (unchanged).
- `src/main/ipc/mcp.ts` (modify) — new handlers + wiring.
- `src/main/ipc-handlers.ts` (modify) — pass `toolRegistry` to `registerMcpHandlers`.

**Shared**
- `shared/mcp.ts` (new) — `MCPServerStatus`, `MCPToolInfo`, `MCPActivityEntry`, `MCPApprovalRequest`, `buildMcpClientConfig`.
- `shared/settings.ts` (modify) — extend `MCPSettings` + defaults.
- `shared/ipc.ts` (modify) — channels/events + enriched approval payload.

**Renderer**
- `src/renderer/src/primitives/data-display/CodeView.tsx` (new) + `.stories.tsx`.
- `src/renderer/src/primitives/index.ts` (modify) — export `CodeView`.
- `src/renderer/src/components/ai/CodeBlock.tsx` (modify) — wrap `CodeView`.
- `src/renderer/src/components/ai/MCPApprovalDialog.tsx` (modify) — `CodeView` + badge.
- `src/renderer/src/components/settings/categories/MCPSettings.tsx` (rewrite) — controls + activity + port handling + `CodeView`.
- `src/renderer/src/components/shell/ActivityBar.tsx` (modify) — shared status type.
- `src/renderer/src/stores/ai.ts` (modify) — enriched MCP approval payload.

---

## Phase 1 — SDK foundation

### Task 1: SDK tool-schema helpers (`isWriteQuery`, `toJsonSchema`)

**Files:**
- Create: `src/main/plugins/sdk/tool-schema.ts`
- Test: `tests/unit/sdk/tool-schema.test.ts`

- [ ] **Step 1: Add the dependency**

Run: `pnpm add zod-to-json-schema`
Expected: `zod-to-json-schema` added to `dependencies` in `package.json`.

- [ ] **Step 2: Write the failing test**

```ts
// tests/unit/sdk/tool-schema.test.ts
import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { isWriteQuery, toJsonSchema } from '../../../src/main/plugins/sdk/tool-schema'

describe('isWriteQuery', () => {
  it('flags plain writes/DDL', () => {
    for (const sql of ['INSERT INTO t VALUES (1)', 'update t set a=1', 'DROP TABLE t', 'TRUNCATE t']) {
      expect(isWriteQuery(sql)).toBe(true)
    }
  })
  it('passes pure reads', () => {
    expect(isWriteQuery('SELECT * FROM users')).toBe(false)
    expect(isWriteQuery('select 1')).toBe(false)
  })
  it('catches writes smuggled past a leading read or comment', () => {
    expect(isWriteQuery('SELECT 1; DROP TABLE users')).toBe(true)
    expect(isWriteQuery('/* hi */ DELETE FROM t')).toBe(true)
    expect(isWriteQuery('-- note\nUPDATE t SET a=1')).toBe(true)
  })
})

describe('toJsonSchema', () => {
  it('derives a JSON Schema object from a Zod object', () => {
    const schema = toJsonSchema(z.object({ sql: z.string().describe('the query') }))
    expect(schema.type).toBe('object')
    expect((schema.properties as Record<string, unknown>).sql).toBeDefined()
    expect(schema.required).toContain('sql')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/sdk/tool-schema.test.ts`
Expected: FAIL — cannot resolve `../../../src/main/plugins/sdk/tool-schema`.

- [ ] **Step 4: Write the implementation**

```ts
// src/main/plugins/sdk/tool-schema.ts
import { zodToJsonSchema } from 'zod-to-json-schema'
import type { z } from 'zod'

const WRITE_KEYWORDS_RE = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|REPLACE|MERGE|GRANT|REVOKE)\b/i

/**
 * True if the SQL contains a write/DDL statement anywhere. Comments are
 * stripped first so writes can't hide behind `-- ...` or `/* ... *\/`, and a
 * leading `SELECT 1; DROP ...` is caught because we scan the whole string,
 * not just the first keyword. Intentionally conservative — a read that *names*
 * a table like `delete_log` trips an approval prompt, an acceptable cost.
 */
export function isWriteQuery(sql: string): boolean {
  const stripped = sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\n]*/g, ' ')
  return WRITE_KEYWORDS_RE.test(stripped)
}

interface JsonSchemaObject {
  type?: string
  properties?: Record<string, unknown>
  required?: string[]
  [k: string]: unknown
}

/** Derive a JSON Schema (for LLM tool definitions) from a Zod object schema. */
export function toJsonSchema(schema: z.ZodTypeAny): JsonSchemaObject {
  return zodToJsonSchema(schema, { target: 'jsonSchema7', $refStrategy: 'none' }) as JsonSchemaObject
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/sdk/tool-schema.test.ts`
Expected: PASS (all cases).

- [ ] **Step 6: Typecheck + commit**

```bash
pnpm exec tsc -b --noEmit
git add package.json pnpm-lock.yaml src/main/plugins/sdk/tool-schema.ts tests/unit/sdk/tool-schema.test.ts
git commit -m "feat(sdk): add tool-schema helpers (isWriteQuery, toJsonSchema)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: SDK `Tool` types + `ToolRegistry`

**Files:**
- Modify: `src/main/plugins/sdk/types.ts` (add Tool types near the other registry interfaces; add `tools` to `PluginContext`)
- Create: `src/main/plugins/sdk/tool-registry.ts`
- Test: `tests/unit/sdk/tool-registry.test.ts`

- [ ] **Step 1: Add the contract types to `sdk/types.ts`**

Add these exports (place them just above the `// ─── Command Registry ─` section, and add `tools: ToolRegistry` to the `PluginContext` interface next to `commands`):

```ts
// ─── Tool Registry ───────────────────────────────────────────────────────────
import type { z } from 'zod'

export interface ToolContext {
  connectionId: string | null
  abortSignal: AbortSignal
}

export interface ToolResult {
  success: boolean
  data: unknown
  display?: string
}

export interface Tool {
  id: string
  name: string
  description: string
  inputSchema: z.ZodObject<z.ZodRawShape>
  permission: 'read' | 'write'
  execute(params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult>
}

/** JSON-Schema tool definition handed to LLM providers. */
export interface ToolDefinition {
  name: string
  description: string
  parameters: Record<string, unknown>
}

export interface ToolRegistry {
  register(tool: Tool): Disposable
  unregister(id: string): void
  get(id: string): Tool | undefined
  list(): Tool[]
  getToolDefinitions(): ToolDefinition[]
  execute(id: string, params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult>
  onChange(cb: () => void): Disposable
}
```

> If `z` is already imported in `types.ts`, do not duplicate the import — add `z` to the existing import instead.

- [ ] **Step 2: Write the failing test**

```ts
// tests/unit/sdk/tool-registry.test.ts
import { describe, it, expect, vi } from 'vitest'
import { z } from 'zod'
import { ToolRegistryImpl } from '../../../src/main/plugins/sdk/tool-registry'
import type { Tool } from '../../../src/main/plugins/sdk/types'

function makeTool(id: string): Tool {
  return {
    id, name: id, description: `desc ${id}`,
    inputSchema: z.object({ x: z.string() }),
    permission: 'read',
    async execute(params) { return { success: true, data: params } }
  }
}

describe('ToolRegistryImpl', () => {
  it('registers, gets, lists and disposes', () => {
    const r = new ToolRegistryImpl()
    const d = r.register(makeTool('a'))
    expect(r.get('a')?.id).toBe('a')
    expect(r.list()).toHaveLength(1)
    d.dispose()
    expect(r.get('a')).toBeUndefined()
    expect(r.list()).toHaveLength(0)
  })

  it('derives JSON-schema tool definitions keyed by id', () => {
    const r = new ToolRegistryImpl()
    r.register(makeTool('a'))
    const defs = r.getToolDefinitions()
    expect(defs[0].name).toBe('a')
    expect((defs[0].parameters as { properties: object }).properties).toHaveProperty('x')
  })

  it('executes a registered tool and throws for unknown ids', async () => {
    const r = new ToolRegistryImpl()
    r.register(makeTool('a'))
    const res = await r.execute('a', { x: '1' }, { connectionId: 'c', abortSignal: new AbortController().signal })
    expect(res).toEqual({ success: true, data: { x: '1' } })
    await expect(r.execute('nope', {}, { connectionId: null, abortSignal: new AbortController().signal }))
      .rejects.toThrow(/Unknown tool/)
  })

  it('notifies onChange on register and unregister', () => {
    const r = new ToolRegistryImpl()
    const cb = vi.fn()
    r.onChange(cb)
    const d = r.register(makeTool('a'))
    d.dispose()
    expect(cb).toHaveBeenCalledTimes(2)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/sdk/tool-registry.test.ts`
Expected: FAIL — `ToolRegistryImpl` not found.

- [ ] **Step 4: Write the implementation**

```ts
// src/main/plugins/sdk/tool-registry.ts
import type { Disposable, Tool, ToolContext, ToolDefinition, ToolRegistry, ToolResult } from './types'
import { toJsonSchema } from './tool-schema'

export class ToolRegistryImpl implements ToolRegistry {
  private tools = new Map<string, Tool>()
  private changeListeners = new Set<() => void>()

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
      parameters: toJsonSchema(t.inputSchema)
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/sdk/tool-registry.test.ts`
Expected: PASS.

- [ ] **Step 6: Export from SDK index**

In `src/main/plugins/sdk/index.ts`, add:
```ts
export { ToolRegistryImpl } from './tool-registry'
export { isWriteQuery, toJsonSchema } from './tool-schema'
export type { Tool, ToolContext, ToolResult, ToolRegistry, ToolDefinition } from './types'
```

- [ ] **Step 7: Typecheck + commit**

```bash
pnpm exec tsc -b --noEmit
git add src/main/plugins/sdk/types.ts src/main/plugins/sdk/tool-registry.ts src/main/plugins/sdk/index.ts tests/unit/sdk/tool-registry.test.ts
git commit -m "feat(sdk): add Tool contract and ToolRegistry

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 2 — Wire `ctx.tools` into the plugin host

### Task 3: Expose a shared `ToolRegistry` as `ctx.tools`

**Files:**
- Modify: `src/main/plugins/define-plugin.ts` (the `createPluginContext` factory + its params type)
- Modify: `src/main/plugins/plugin-host.ts` (own a shared registry; inject into context; expose on host deps)
- Test: `tests/unit/sdk/plugin-context-tools.test.ts`

- [ ] **Step 1: Locate the context factory**

Run: `grep -rn "createPluginContext\|disposePluginContext" src/main/plugins/define-plugin.ts`
Expected: find the `createPluginContext({...})` factory and the params interface. Confirm the property names (e.g. `commandRegistry`, `panelRegistry`) so the new `toolRegistry` param follows the same naming.

- [ ] **Step 2: Add `toolRegistry` to the factory**

In `define-plugin.ts`, add `toolRegistry: ToolRegistry` to the params interface (import the type from `./sdk/types`), and in the returned context object add:
```ts
tools: deps.toolRegistry,
```
(matching how `commands: deps.commandRegistry` is wired).

- [ ] **Step 3: Own + inject the shared registry in `plugin-host.ts`**

- Import: `import { ToolRegistryImpl } from './sdk/tool-registry'` and `import type { ToolRegistry } from './sdk/types'`.
- On `PluginHost` (or its `deps`), hold a single instance. If the host receives registries via `this.deps`, add `toolRegistry: ToolRegistry` to the host deps type and create the instance at the host's construction site (see Task 4). If the host creates registries itself, add `private toolRegistry = new ToolRegistryImpl()`.
- In `activatePlugin`'s `createPluginContext({...})` call (plugin-host.ts:338), add:
```ts
toolRegistry: this.deps.toolRegistry,
```

- [ ] **Step 4: Write the failing test**

```ts
// tests/unit/sdk/plugin-context-tools.test.ts
import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { ToolRegistryImpl } from '../../../src/main/plugins/sdk/tool-registry'

// A focused contract test: a plugin given a ToolRegistry can register a tool
// that a separate consumer (the MCP server) then sees in the same instance.
describe('shared ToolRegistry contract', () => {
  it('a tool registered by one holder is visible to another holder of the same instance', () => {
    const shared = new ToolRegistryImpl()
    const pluginSide = shared
    const mcpSide = shared
    pluginSide.register({
      id: 'query', name: 'Query', description: 'run sql',
      inputSchema: z.object({ sql: z.string() }), permission: 'write',
      async execute() { return { success: true, data: null } }
    })
    expect(mcpSide.get('query')?.permission).toBe('write')
    expect(mcpSide.getToolDefinitions().map(d => d.name)).toContain('query')
  })
})
```

- [ ] **Step 5: Run test + typecheck**

Run: `pnpm test -- --run tests/unit/sdk/plugin-context-tools.test.ts`
Expected: PASS.
Run: `pnpm exec tsc -b --noEmit`
Expected: no errors (the `tools` property now exists on `PluginContext` and is supplied by the factory). If `tsc` reports `createPluginContext` callers missing `toolRegistry`, fix the call site in Task 4 first if it surfaces here.

- [ ] **Step 6: Commit**

```bash
git add src/main/plugins/define-plugin.ts src/main/plugins/plugin-host.ts tests/unit/sdk/plugin-context-tools.test.ts
git commit -m "feat(plugins): expose shared ToolRegistry as ctx.tools

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Create the single `ToolRegistry` instance at boot and pass it to host + MCP

**Files:**
- Modify: the host construction site (find it in Step 1)
- Modify: `src/main/ipc-handlers.ts` (pass `toolRegistry` to `registerMcpHandlers`)

- [ ] **Step 1: Find where the plugin host + its registries are constructed**

Run: `grep -rn "new PluginHost\|driverRegistry:\|new DriverRegistry\|new CommandRegistry" src/main`
Expected: the file (likely `src/main/index.ts` or a boot module) that builds the registry set and the `PluginHost` deps. Note the local variable holding these registries.

- [ ] **Step 2: Create and thread the instance**

At that construction site:
```ts
import { ToolRegistryImpl } from './plugins/sdk/tool-registry'
// ...
const toolRegistry = new ToolRegistryImpl()
```
Add `toolRegistry` to the `PluginHost` deps object (alongside `driverRegistry`, `commandRegistry`, …). Export/hand `toolRegistry` to wherever `registerMcpHandlers` is called (it is called from `ipc-handlers.ts:114`). If `ipc-handlers.ts` builds the host deps, reuse the same instance; otherwise pass `toolRegistry` into `registerIpcHandlers` so it reaches `registerMcpHandlers`.

- [ ] **Step 3: Update the `registerMcpHandlers` call**

In `src/main/ipc-handlers.ts:114`, change to:
```ts
registerMcpHandlers(ctx, handle, connectionAccess, settingsStore, toolRegistry)
```
(The 5th param is added in Task 12; until then `tsc` will flag the arity — that is expected and resolved in Phase 6/7. To keep this task green, complete Task 12's signature change together with this if executing inline, or accept a known transient `tsc` error noted here.)

> **Sequencing note:** Tasks 4 and 12 form one compile unit (the `registerMcpHandlers` signature). When executing with subagents, run Task 12 immediately after Task 4 and typecheck once at the end of Task 12.

- [ ] **Step 4: Commit**

```bash
git add src/main/index.ts src/main/ipc-handlers.ts
git commit -m "feat(boot): construct shared ToolRegistry and thread to host + MCP

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 3 — `db-tools` bundled plugin (the only home for tool logic)

### Task 5: Define the six tools

**Files:**
- Create: `src/main/plugins/bundled/db-tools/tools.ts`
- Test: `tests/unit/plugins/db-tools.test.ts`

These tools close over `SchemaAccess` + `ConnectionAccess` (both keyed by `connectionId`), exactly like the old AI tools. The row limit is read via a getter so MCP/AI can change it without re-creating tools.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/plugins/db-tools.test.ts
import { describe, it, expect } from 'vitest'
import { createDbTools } from '../../../src/main/plugins/bundled/db-tools/tools'
import type { SchemaAccess, ConnectionAccess } from '../../../src/main/plugins/sdk/types'

const ctx = { connectionId: 'c1', abortSignal: new AbortController().signal }

function fakes() {
  const schema = {
    getTables: async () => [{ name: 't', type: 'table', rowCount: 1 }],
    getColumns: async () => [{ name: 'id', dataType: 'int', isPrimaryKey: true }],
    getIndexes: async () => [{ name: 'pk', columns: ['id'] }],
    getSchemas: async () => ['public'],
    getDatabases: async () => ['app'],
  } as unknown as SchemaAccess
  const connections = {
    query: async (_id: string, sql: string) => ({
      rows: sql.includes('EXPLAIN') ? [{ plan: 'Seq Scan' }] : [{ id: 1 }, { id: 2 }],
      fields: [{ name: 'id', dataType: 'int' }],
      rowCount: 2, duration: 3,
    }),
    getProfile: () => ({ type: 'postgres', host: 'h', port: 5432, database: 'app', name: 'P' }),
  } as unknown as ConnectionAccess
  return { schema, connections }
}

describe('createDbTools', () => {
  it('exposes the six canonical tools with correct permissions', () => {
    const { schema, connections } = fakes()
    const tools = createDbTools(schema, connections, () => 500)
    const byId = Object.fromEntries(tools.map(t => [t.id, t]))
    expect(Object.keys(byId).sort()).toEqual(
      ['connection_info', 'describe_table', 'explain_query', 'get_schemas', 'list_tables', 'query'].sort()
    )
    expect(byId.query.permission).toBe('write')
    expect(byId.explain_query.permission).toBe('read')
  })

  it('query returns rows + meta and truncates to the row limit', async () => {
    const { schema, connections } = fakes()
    const tools = createDbTools(schema, connections, () => 1)
    const query = tools.find(t => t.id === 'query')!
    const res = await query.execute({ sql: 'SELECT * FROM t' }, ctx)
    expect(res.success).toBe(true)
    expect((res.data as { rows: unknown[] }).rows).toHaveLength(1) // truncated
    expect((res.data as { rowCount: number }).rowCount).toBe(2)
  })

  it('list_tables / describe_table / connection_info read through access objects', async () => {
    const { schema, connections } = fakes()
    const tools = createDbTools(schema, connections, () => 500)
    const list = await tools.find(t => t.id === 'list_tables')!.execute({}, ctx)
    expect((list.data as unknown[]).length).toBe(1)
    const desc = await tools.find(t => t.id === 'describe_table')!.execute({ table: 't' }, ctx)
    expect((desc.data as { columns: unknown[] }).columns).toHaveLength(1)
    const info = await tools.find(t => t.id === 'connection_info')!.execute({}, ctx)
    expect((info.data as { type: string }).type).toBe('postgres')
  })

  it('fails clearly with no active connection', async () => {
    const { schema, connections } = fakes()
    const tools = createDbTools(schema, connections, () => 500)
    const res = await tools.find(t => t.id === 'list_tables')!
      .execute({}, { connectionId: null, abortSignal: new AbortController().signal })
    expect(res.success).toBe(false)
    expect(res.display).toMatch(/no active/i)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/plugins/db-tools.test.ts`
Expected: FAIL — `createDbTools` not found.

- [ ] **Step 3: Write the implementation**

```ts
// src/main/plugins/bundled/db-tools/tools.ts
import { z } from 'zod'
import type { Tool, ToolContext, ToolResult } from '../../sdk/types'
import type { SchemaAccess, ConnectionAccess } from '../../sdk/types'

function noConn(): ToolResult {
  return { success: false, data: null, display: 'No active database connection in Verql' }
}

/**
 * The canonical database tools. `getMaxRows` is read per-call so the row cap
 * tracks the live MCP setting without re-creating the tools.
 */
export function createDbTools(
  schema: SchemaAccess,
  connections: ConnectionAccess,
  getMaxRows: () => number
): Tool[] {
  return [
    {
      id: 'query',
      name: 'Run Query',
      description: 'Execute a SQL query against the active database connection. Use this to read data, insert, update, or delete records.',
      inputSchema: z.object({ sql: z.string().describe('The SQL query to execute') }),
      permission: 'write',
      async execute(params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
        if (!ctx.connectionId) return noConn()
        const result = await connections.query(ctx.connectionId, params.sql as string)
        const max = getMaxRows()
        return {
          success: true,
          data: {
            rows: result.rows.slice(0, max),
            rowCount: result.rowCount,
            fields: result.fields.map(f => ({ name: f.name, dataType: f.dataType })),
            duration: result.duration,
            affectedRows: result.affectedRows,
          },
          display: `Query returned ${result.rowCount} row(s)`
        }
      }
    },
    {
      id: 'explain_query',
      name: 'Explain Query',
      description: 'Run EXPLAIN on a SQL query to show its execution plan. Read-only.',
      inputSchema: z.object({ sql: z.string().describe('The SQL query to explain') }),
      permission: 'read',
      async execute(params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
        if (!ctx.connectionId) return noConn()
        const result = await connections.query(ctx.connectionId, `EXPLAIN ${params.sql as string}`)
        return { success: true, data: result.rows, display: `Execution plan (${result.rows.length} step(s))` }
      }
    },
    {
      id: 'list_tables',
      name: 'List Tables',
      description: 'List all tables in the current database schema.',
      inputSchema: z.object({ schema: z.string().optional().describe('Schema name (optional)') }),
      permission: 'read',
      async execute(params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
        if (!ctx.connectionId) return noConn()
        const tables = await schema.getTables(ctx.connectionId, params.schema as string | undefined)
        return {
          success: true,
          data: tables.map(t => ({ name: t.name, type: t.type, rowCount: t.rowCount })),
          display: `Found ${tables.length} table(s)`
        }
      }
    },
    {
      id: 'describe_table',
      name: 'Describe Table',
      description: 'Get detailed information about a table including columns, types, indexes, and foreign key relationships.',
      inputSchema: z.object({
        table: z.string().describe('Table name to describe'),
        schema: z.string().optional().describe('Schema name (optional)')
      }),
      permission: 'read',
      async execute(params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
        if (!ctx.connectionId) return noConn()
        const table = params.table as string
        const schemaName = params.schema as string | undefined
        const [columns, indexes] = await Promise.all([
          schema.getColumns(ctx.connectionId, table, schemaName),
          schema.getIndexes(ctx.connectionId, table, schemaName)
        ])
        return { success: true, data: { columns, indexes }, display: `${table}: ${columns.length} column(s), ${indexes.length} index(es)` }
      }
    },
    {
      id: 'get_schemas',
      name: 'Get Schemas',
      description: 'List all available schemas or databases on the current connection.',
      inputSchema: z.object({}),
      permission: 'read',
      async execute(_params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
        if (!ctx.connectionId) return noConn()
        const [schemas, databases] = await Promise.all([
          schema.getSchemas(ctx.connectionId).catch(() => [] as string[]),
          schema.getDatabases(ctx.connectionId).catch(() => [] as string[])
        ])
        return { success: true, data: { schemas, databases }, display: `${schemas.length} schema(s), ${databases.length} database(s)` }
      }
    },
    {
      id: 'connection_info',
      name: 'Connection Info',
      description: 'Get information about the currently active database connection including type, host, and database name.',
      inputSchema: z.object({}),
      permission: 'read',
      async execute(_params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
        if (!ctx.connectionId) return noConn()
        const profile = connections.getProfile(ctx.connectionId)
        if (!profile) return noConn()
        return {
          success: true,
          data: { type: profile.type, host: profile.host, port: profile.port, database: profile.database, name: profile.name },
          display: profile.name
        }
      }
    }
  ]
}
```

> Confirm `SchemaAccess`/`ConnectionAccess` are exported from `sdk/types`. They are referenced there already; if they live in another SDK file, import from that path instead.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/plugins/db-tools.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck + commit**

```bash
pnpm exec tsc -b --noEmit
git add src/main/plugins/bundled/db-tools/tools.ts tests/unit/plugins/db-tools.test.ts
git commit -m "feat(db-tools): canonical database tools

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: `db-tools` plugin entry (manifest + activate)

**Files:**
- Create: `src/main/plugins/bundled/db-tools/index.ts`
- Modify: the bundled-plugin registry (find it in Step 1)

- [ ] **Step 1: Find where bundled plugins are listed**

Run: `grep -rn "bundled/ai\|bundled/ssh-tunnel\|bundled/mongodb" src/main/plugins`
Expected: the module that imports/lists bundled plugins (the bundled-plugin manifest list). Note the shape (how `ai` is registered) to mirror it.

- [ ] **Step 2: Write the plugin entry**

```ts
// src/main/plugins/bundled/db-tools/index.ts
import type { PluginContext } from '../../sdk/types'
import type { PluginManifest } from '../../types'
import { createDbTools } from './tools'

export const manifest: PluginManifest = {
  name: 'verql-plugin-db-tools',
  version: '1.0.0',
  displayName: 'Database Tools',
  description: 'Core database tools (query, schema inspection) shared by the AI assistant and the MCP server.',
  main: 'index.js',
  contributes: {}
}

export function activate(ctx: PluginContext): void {
  // maxRows is read live from settings so the MCP row cap applies here too.
  const getMaxRows = () => {
    const v = ctx.settings.get('mcp.maxRows') as number | undefined
    return typeof v === 'number' && v > 0 ? v : 500
  }
  for (const tool of createDbTools(ctx.schema, ctx.connections, getMaxRows)) {
    ctx.subscriptions.push(ctx.tools.register(tool))
  }
}

export function deactivate(): void { /* registrations disposed via subscriptions */ }
```

> Confirm the settings accessor name on `PluginContext`. The AI plugin uses `ctx.rootSettings` for the global store and `ctx.settings` for plugin-scoped settings — `mcp.maxRows` is a **root** setting, so use `ctx.rootSettings.get('mcp.maxRows')` if `ctx.settings` is plugin-namespaced. Verify against `define-plugin.ts` and adjust the accessor accordingly.

- [ ] **Step 3: Register the bundled plugin**

Add `db-tools` to the bundled-plugin list found in Step 1, mirroring the `ai` entry.

- [ ] **Step 4: Keep `db-tools` always active**

Run: `grep -rn "disabledPlugins\|markDisabled\|canDisable\|isDisablable" src/main/plugins`
Expected: find the disable flow. Add `verql-plugin-db-tools` to a non-disablable set (or guard `markDisabled` to refuse it) so MCP always has tools. If a renderer plugin list shows a disable toggle, hide it for this plugin name.

- [ ] **Step 5: Typecheck + commit**

```bash
pnpm exec tsc -b --noEmit
git add src/main/plugins/bundled/db-tools/index.ts src/main/plugins/<bundled-list-file>.ts
git commit -m "feat(db-tools): always-on bundled plugin registering core tools

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 4 — AI plugin becomes a consumer (clean break)

### Task 7: AI conversation manager reads the shared registry; delete `AIToolRegistry`

**Files:**
- Modify: `src/main/plugins/bundled/ai/internal/types.ts` (remove `AITool`, `AIToolContext`, `AIToolExecutionResult`; keep provider/context types)
- Modify: `src/main/plugins/bundled/ai/internal/conversation-manager.ts`
- Modify: `src/main/plugins/bundled/ai/internal/permission-manager.ts` (type import only)
- Modify: `src/main/plugins/bundled/ai/internal/index.ts`
- Delete: `src/main/plugins/bundled/ai/internal/tool-registry.ts`

- [ ] **Step 1: Repoint types in `internal/types.ts`**

Remove the `AITool`, `AIToolContext`, `AIToolExecutionResult` interfaces. Keep `AIProvider*`, `AIToolDefinition`, `AIContextProvider`. Where other files imported `AITool`/`AIToolContext`/`AIToolExecutionResult` from here, they will switch to SDK `Tool`/`ToolContext`/`ToolResult` and `ToolDefinition` (next steps).

- [ ] **Step 2: Update `conversation-manager.ts`**

- Change imports:
```ts
import type { ToolRegistry } from '../../../sdk/types'
import type { PermissionManager } from './permission-manager'
```
(remove the `./tool-registry` import; remove `./types` `AITool*` imports if any).
- Change `ConversationManagerDeps.toolRegistry` type to `ToolRegistry`.
- The existing calls already match the SDK `ToolRegistry` API: `getToolDefinitions()`, `get(id)`, `execute(id, params, { connectionId, abortSignal })`. No body changes needed beyond types. Verify `tool.id`, `tool.name`, `tool.description`, `tool.permission` are all present on SDK `Tool` (they are).

- [ ] **Step 3: Update `permission-manager.ts`**

Change `import type { AITool } from './types'` → `import type { Tool } from '../../../sdk/types'` and `needsApproval(tool: AITool)` → `needsApproval(tool: Tool)`. `tool.id` and `tool.permission` already exist on `Tool`.

- [ ] **Step 4: Update `internal/index.ts`**

- Remove `import { AIToolRegistry } from './tool-registry'` and the `const toolRegistry = new AIToolRegistry()`.
- Add `toolRegistry: ToolRegistry` to `AIDeps` (import from `../../../sdk/types`).
- Use `deps.toolRegistry` where `toolRegistry` was used (passed into `ConversationManager`).
- In `AIService`, **remove** `registerTool`. Keep `registerProvider`, `registerContextProvider`.
- In `AIModule`, change `toolRegistry: AIToolRegistry` → `toolRegistry: ToolRegistry`.
- Keep the `ai:tools:list` handler — it now lists the shared registry:
```ts
h('ai:tools:list', async () => deps.toolRegistry.list().map(t => ({
  id: t.id, name: t.name, description: t.description, permission: t.permission
})))
```
- In the returned `service` object, remove the `registerTool` line.

- [ ] **Step 5: Delete the dead registry**

Run: `git rm src/main/plugins/bundled/ai/internal/tool-registry.ts`

- [ ] **Step 6: Typecheck**

Run: `pnpm exec tsc -b --noEmit`
Expected: errors only in files updated in Task 8 (the AI plugin `index.ts` and `ai-access.ts`). Proceed to Task 8 before committing.

---

### Task 8: AI plugin stops registering tools; remove `registerTool` from `AIAccess`

**Files:**
- Modify: `src/main/plugins/bundled/ai/index.ts`
- Modify: `src/main/plugins/sdk/ai-access.ts`
- Delete: `src/main/plugins/bundled/ai/tools/` (directory)

- [ ] **Step 1: Update the AI plugin entry**

In `src/main/plugins/bundled/ai/index.ts`:
- Remove imports of `createSchemaTools` and `createQueryTools`.
- Remove the loop in step 3 that calls `ctx.ai.registerTool(...)`.
- Pass the shared registry into `startAIModule`:
```ts
ai = startAIModule({
  keyring: ctx.keyring,
  schemaAccess: ctx.schema,
  connectionAccess: ctx.connections,
  settingsStore: ctx.rootSettings,
  ipc: ctx.ipc,
  broadcast: ctx.broadcast,
  toolRegistry: ctx.tools,
})
```

- [ ] **Step 2: Delete the AI tool directory**

Run: `git rm -r src/main/plugins/bundled/ai/tools`

- [ ] **Step 3: Remove `registerTool` from `AIAccess`**

In `src/main/plugins/sdk/ai-access.ts`:
- Remove `registerTool(tool: AITool): Disposable` from the `AIService` interface.
- Remove the `registerTool` implementation block in `createAIAccess`'s returned object.
- Remove the now-unused `AITool` from the re-export/import line (keep `AIContextProvider`, `AIProvider`). If `AITool` is no longer exported anywhere, drop it; the AI provider types remain in `internal/types.ts`.

- [ ] **Step 4: Find and fix any remaining `registerTool` callers**

Run: `grep -rn "\.ai\.registerTool\|registerTool" src/main`
Expected: no remaining callers (db-tools uses `ctx.tools.register`). If any other bundled plugin used `ctx.ai.registerTool`, migrate it to `ctx.tools.register` with an SDK `Tool`.

- [ ] **Step 5: Typecheck + run AI-adjacent tests**

Run: `pnpm exec tsc -b --noEmit`
Expected: clean.
Run: `pnpm test -- --run tests/unit/plugins/db-tools.test.ts`
Expected: PASS (sanity).

- [ ] **Step 6: Commit Phase 4**

```bash
git add -A src/main/plugins/bundled/ai src/main/plugins/sdk/ai-access.ts
git commit -m "refactor(ai): consume shared ToolRegistry; remove ctx.ai.registerTool

Clean break — tool logic now lives only in the db-tools plugin. The AI
conversation manager reads tools from ctx.tools; AIAccess no longer
exposes registerTool.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 5 — Shared types, settings, IPC

### Task 9: `shared/mcp.ts` types + config builder

**Files:**
- Create: `shared/mcp.ts`
- Test: `tests/unit/shared/mcp.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/shared/mcp.test.ts
import { describe, it, expect } from 'vitest'
import { buildMcpClientConfig } from '../../../shared/mcp'

describe('buildMcpClientConfig', () => {
  it('builds the Claude SSE client config for a port + token', () => {
    const cfg = buildMcpClientConfig({ port: 3101, token: 'abc' })
    expect(cfg).toEqual({
      mcpServers: {
        verql: {
          type: 'sse',
          url: 'http://localhost:3101/sse',
          headers: { Authorization: 'Bearer abc' }
        }
      }
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/shared/mcp.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
// shared/mcp.ts
export interface MCPServerStatus {
  running: boolean
  port: number
  clients: number
  token: string
  autoSelectedPort: boolean
}

export interface MCPToolInfo {
  id: string
  name: string
  description: string
  permission: 'read' | 'write'
  enabled: boolean
}

export interface MCPActivityEntry {
  id: string
  timestamp: number
  toolId: string
  paramsSummary: string
  status: 'ok' | 'error' | 'rejected'
  durationMs: number
}

export interface MCPApprovalRequest {
  requestId: string
  toolId: string
  toolName: string
  sql: string
  permission: 'read' | 'write'
}

export interface MCPStartResult {
  port: number
  token: string
  autoSelectedPort: boolean
}

export function buildMcpClientConfig(opts: { port: number; token: string }): {
  mcpServers: { verql: { type: 'sse'; url: string; headers: { Authorization: string } } }
} {
  return {
    mcpServers: {
      verql: {
        type: 'sse',
        url: `http://localhost:${opts.port}/sse`,
        headers: { Authorization: `Bearer ${opts.token}` }
      }
    }
  }
}
```

- [ ] **Step 4: Run test + typecheck + commit**

```bash
pnpm test -- --run tests/unit/shared/mcp.test.ts
pnpm exec tsc -b --noEmit
git add shared/mcp.ts tests/unit/shared/mcp.test.ts
git commit -m "feat(shared): MCP status/tool/activity types + client config builder

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Extend `MCPSettings` schema + defaults

**Files:**
- Modify: `shared/settings.ts:106-110` (interface) and `:191-195` (defaults)

- [ ] **Step 1: Extend the interface**

Replace the `MCPSettings` interface with:
```ts
export interface MCPSettings {
  enabled: boolean
  port: number
  token: string
  autoPort: boolean
  readOnly: boolean
  maxRows: number
  disabledTools: string[]
}
```

- [ ] **Step 2: Extend the defaults**

Replace the `mcp` block in `defaultSettings`:
```ts
  mcp: {
    enabled: false,
    port: 3100,
    token: '',
    autoPort: true,
    readOnly: false,
    maxRows: 500,
    disabledTools: [],
  },
```

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc -b --noEmit`
Expected: errors only where `mcp` settings are consumed with the old shape (renderer `MCPSettings.tsx`, fixed in Phase 9). Note them; do not fix yet.

- [ ] **Step 4: Commit**

```bash
git add shared/settings.ts
git commit -m "feat(settings): add MCP autoPort, readOnly, maxRows, disabledTools

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: IPC channels + events

**Files:**
- Modify: `shared/ipc.ts` — the MCP block (`:413-429`), the `IPC_CHANNELS` map (`:564-568`), the events block (`:590-591`), and `IPC_EVENTS` (`:623`)

- [ ] **Step 1: Update the channel map**

Replace the MCP block at `shared/ipc.ts:413-429` with:
```ts
  // ─── MCP Server ─────────────────────────────────────────────────────────────
  'mcp:start': {
    args: []
    return: import('./mcp').MCPStartResult
  }
  'mcp:stop': {
    args: []
    return: void
  }
  'mcp:status': {
    args: []
    return: import('./mcp').MCPServerStatus
  }
  'mcp:tools': {
    args: []
    return: import('./mcp').MCPToolInfo[]
  }
  'mcp:set-tool-enabled': {
    args: [toolId: string, enabled: boolean]
    return: void
  }
  'mcp:activity': {
    args: []
    return: import('./mcp').MCPActivityEntry[]
  }
  'mcp:regenerate-token': {
    args: []
    return: import('./mcp').MCPServerStatus
  }
  'mcp:approval-response': {
    args: [requestId: string, approved: boolean]
    return: void
  }
```

- [ ] **Step 2: Update `IPC_CHANNELS` constants**

In the `IPC_CHANNELS` object (around `:564`), the MCP section becomes:
```ts
  MCP_START: 'mcp:start',
  MCP_STOP: 'mcp:stop',
  MCP_STATUS: 'mcp:status',
  MCP_TOOLS: 'mcp:tools',
  MCP_SET_TOOL_ENABLED: 'mcp:set-tool-enabled',
  MCP_ACTIVITY: 'mcp:activity',
  MCP_REGENERATE_TOKEN: 'mcp:regenerate-token',
  MCP_APPROVAL_RESPONSE: 'mcp:approval-response',
```

- [ ] **Step 3: Update events**

In the events interface (around `:590`), replace the approval-request line and add activity:
```ts
  /** MCP server requested user approval for a sensitive action. */
  'mcp:approval-request': [request: import('./mcp').MCPApprovalRequest]
  /** MCP server recorded a tool call. */
  'mcp:activity-event': [entry: import('./mcp').MCPActivityEntry]
```
In `IPC_EVENTS` (around `:623`):
```ts
  MCP_APPROVAL_REQUEST: 'mcp:approval-request',
  MCP_ACTIVITY_EVENT: 'mcp:activity-event',
```

> The existing approval-request type was `AIApprovalRequest`; it is now `MCPApprovalRequest` from `shared/mcp`. The renderer store (Task 18) is updated to match.

- [ ] **Step 4: Typecheck + commit**

Run: `pnpm exec tsc -b --noEmit`
Expected: errors only in the not-yet-updated MCP server/handlers/renderer (Phases 6, 7, 9). Commit anyway — this task defines the contract.
```bash
git add shared/ipc.ts
git commit -m "feat(ipc): MCP tools/activity/regenerate channels + enriched approval event

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 6 — MCP server rebuild

### Task 12: Port-resolution helper

**Files:**
- Create: `src/main/mcp/find-port.ts`
- Test: `tests/unit/mcp/find-port.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/mcp/find-port.test.ts
import { describe, it, expect } from 'vitest'
import { createServer } from 'http'
import { findFreePort } from '../../../src/main/mcp/find-port'

function occupy(port: number) {
  const s = createServer()
  return new Promise<() => void>((resolve) => {
    s.listen(port, '127.0.0.1', () => resolve(() => s.close()))
  })
}

describe('findFreePort', () => {
  it('returns the requested port when free', async () => {
    const got = await findFreePort(34567, 5)
    expect(got).toBe(34567)
  })

  it('skips an occupied port and finds the next free one', async () => {
    const release = await occupy(34570)
    try {
      const got = await findFreePort(34570, 5)
      expect(got).toBe(34571)
    } finally {
      release()
    }
  })

  it('throws when no port is free in range', async () => {
    const release = await occupy(34580)
    try {
      await expect(findFreePort(34580, 1)).rejects.toThrow(/no free port/i)
    } finally {
      release()
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/mcp/find-port.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
// src/main/mcp/find-port.ts
import { createServer } from 'http'

function isFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const srv = createServer()
    srv.once('error', () => resolve(false))
    srv.listen(port, '127.0.0.1', () => srv.close(() => resolve(true)))
  })
}

/** Probe `start … start+span-1` for the first free port on 127.0.0.1. */
export async function findFreePort(start: number, span: number): Promise<number> {
  for (let port = start; port < start + span; port++) {
    if (await isFree(port)) return port
  }
  throw new Error(`No free port in range ${start}-${start + span - 1}`)
}
```

- [ ] **Step 4: Run test + typecheck + commit**

```bash
pnpm test -- --run tests/unit/mcp/find-port.test.ts
pnpm exec tsc -b --noEmit
git add src/main/mcp/find-port.ts tests/unit/mcp/find-port.test.ts
git commit -m "feat(mcp): free-port probe for conflict resolution

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 13: Rewrite the MCP server as a registry consumer

**Files:**
- Rewrite: `src/main/mcp/server.ts`
- Delete: `src/main/mcp/tools.ts`
- Test: `tests/unit/mcp/server-gating.test.ts`

The server adapts each registry `Tool` into an `mcpServer.tool(...)` registration, filtered by `disabledTools` + `readOnly`, gates writes through approval, records activity, and resolves ports.

- [ ] **Step 1: Write the failing test (pure logic: the gating/adaptation helpers)**

To keep this testable without a live HTTP server, extract the decision logic into exported pure functions and test those.

```ts
// tests/unit/mcp/server-gating.test.ts
import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { selectExposedTools, needsApprovalForCall, summarizeParams } from '../../../src/main/mcp/server'
import type { Tool } from '../../../src/main/plugins/sdk/types'

function tool(id: string, permission: 'read' | 'write'): Tool {
  return { id, name: id, description: id, inputSchema: z.object({ sql: z.string().optional() }), permission, async execute() { return { success: true, data: null } } }
}

describe('selectExposedTools', () => {
  const all = [tool('query', 'write'), tool('list_tables', 'read')]
  it('hides disabled tools', () => {
    expect(selectExposedTools(all, { disabledTools: ['query'], readOnly: false }).map(t => t.id)).toEqual(['list_tables'])
  })
  it('hides write tools in read-only mode', () => {
    expect(selectExposedTools(all, { disabledTools: [], readOnly: true }).map(t => t.id)).toEqual(['list_tables'])
  })
})

describe('needsApprovalForCall', () => {
  it('requires approval for write-permission tools', () => {
    expect(needsApprovalForCall(tool('query', 'write'), {})).toBe(true)
  })
  it('requires approval when a read tool is handed write SQL', () => {
    expect(needsApprovalForCall(tool('explain_query', 'read'), { sql: 'SELECT 1; DROP TABLE t' })).toBe(true)
  })
  it('does not require approval for a pure read', () => {
    expect(needsApprovalForCall(tool('list_tables', 'read'), {})).toBe(false)
  })
})

describe('summarizeParams', () => {
  it('truncates long params for the activity log', () => {
    const s = summarizeParams({ sql: 'x'.repeat(200) })
    expect(s.length).toBeLessThanOrEqual(120)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/mcp/server-gating.test.ts`
Expected: FAIL — helpers not exported.

- [ ] **Step 3: Rewrite `server.ts`**

```ts
// src/main/mcp/server.ts
import { createServer, type Server as HttpServer, type IncomingMessage, type ServerResponse } from 'http'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { BrowserWindow } from 'electron'
import { generateToken, validateAuth } from './auth'
import { findFreePort } from './find-port'
import { isWriteQuery } from '../plugins/sdk/tool-schema'
import type { Tool, ToolRegistry } from '../plugins/sdk/types'
import type { MCPServerStatus, MCPStartResult, MCPActivityEntry, MCPApprovalRequest } from '@shared/mcp'

interface MCPGate { disabledTools: string[]; readOnly: boolean }

interface MCPServerDeps {
  toolRegistry: ToolRegistry
  getActiveConnectionId: () => string | null
  settingsStore: { get(key: string): unknown; set(key: string, value: unknown): void }
}

export interface MCPServerInstance {
  start: () => Promise<MCPStartResult>
  stop: () => Promise<void>
  getStatus: () => MCPServerStatus
  resolveApproval: (requestId: string, approved: boolean) => void
  getActivity: () => MCPActivityEntry[]
}

// ─── Pure decision helpers (unit-tested) ─────────────────────────────────────

export function selectExposedTools(tools: Tool[], gate: MCPGate): Tool[] {
  return tools.filter(t =>
    !gate.disabledTools.includes(t.id) &&
    !(gate.readOnly && t.permission === 'write')
  )
}

export function needsApprovalForCall(tool: Tool, params: Record<string, unknown>): boolean {
  if (tool.permission === 'write') return true
  const sql = typeof params.sql === 'string' ? params.sql : ''
  return sql ? isWriteQuery(sql) : false
}

export function summarizeParams(params: Record<string, unknown>): string {
  const s = JSON.stringify(params)
  return s.length > 120 ? s.slice(0, 117) + '…' : s
}

// ─── Server ──────────────────────────────────────────────────────────────────

export function createMCPServer(deps: MCPServerDeps): MCPServerInstance {
  let httpServer: HttpServer | null = null
  let mcpServer: McpServer | null = null
  let token = ''
  let boundPort = 0
  let autoSelectedPort = false
  let transport: SSEServerTransport | null = null
  let clientCount = 0
  const activity: MCPActivityEntry[] = []
  const pendingApprovals = new Map<string, (approved: boolean) => void>()

  function gate(): MCPGate {
    return {
      disabledTools: (deps.settingsStore.get('mcp.disabledTools') as string[]) ?? [],
      readOnly: (deps.settingsStore.get('mcp.readOnly') as boolean) ?? false,
    }
  }

  function record(entry: MCPActivityEntry): void {
    activity.push(entry)
    if (activity.length > 100) activity.shift()
    BrowserWindow.getAllWindows()[0]?.webContents.send('mcp:activity-event', entry)
  }

  function requestApproval(tool: Tool, params: Record<string, unknown>): Promise<boolean> {
    return new Promise((resolve) => {
      const requestId = crypto.randomUUID()
      pendingApprovals.set(requestId, resolve)
      const win = BrowserWindow.getAllWindows()[0]
      if (!win) { pendingApprovals.delete(requestId); resolve(false); return }
      const req: MCPApprovalRequest = {
        requestId, toolId: tool.id, toolName: tool.name,
        sql: typeof params.sql === 'string' ? params.sql : JSON.stringify(params, null, 2),
        permission: tool.permission,
      }
      win.webContents.send('mcp:approval-request', req)
      setTimeout(() => {
        if (pendingApprovals.delete(requestId)) resolve(false)
      }, 5 * 60 * 1000)
    })
  }

  function resolveApproval(requestId: string, approved: boolean): void {
    const resolver = pendingApprovals.get(requestId)
    if (resolver) { resolver(approved); pendingApprovals.delete(requestId) }
  }

  function buildMcpServer(): McpServer {
    const server = new McpServer({ name: 'verql', version: '0.1.0' }, { capabilities: { tools: {} } })
    const exposed = selectExposedTools(deps.toolRegistry.list(), gate())
    for (const tool of exposed) {
      server.tool(tool.id, tool.description, tool.inputSchema.shape, async (args: Record<string, unknown>) => {
        const startedAt = Date.now()
        const connectionId = deps.getActiveConnectionId()
        if (!connectionId) {
          record({ id: crypto.randomUUID(), timestamp: startedAt, toolId: tool.id, paramsSummary: summarizeParams(args), status: 'error', durationMs: 0 })
          return { content: [{ type: 'text', text: 'Error: No active database connection in Verql' }], isError: true }
        }
        if (needsApprovalForCall(tool, args)) {
          const approved = await requestApproval(tool, args)
          if (!approved) {
            record({ id: crypto.randomUUID(), timestamp: startedAt, toolId: tool.id, paramsSummary: summarizeParams(args), status: 'rejected', durationMs: Date.now() - startedAt })
            return { content: [{ type: 'text', text: 'Query rejected by user in Verql' }], isError: true }
          }
        }
        try {
          const result = await tool.execute(args, { connectionId, abortSignal: new AbortController().signal })
          record({ id: crypto.randomUUID(), timestamp: startedAt, toolId: tool.id, paramsSummary: summarizeParams(args), status: result.success ? 'ok' : 'error', durationMs: Date.now() - startedAt })
          return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }], isError: !result.success }
        } catch (err) {
          record({ id: crypto.randomUUID(), timestamp: startedAt, toolId: tool.id, paramsSummary: summarizeParams(args), status: 'error', durationMs: Date.now() - startedAt })
          return { content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }], isError: true }
        }
      })
    }
    return server
  }

  async function start(): Promise<MCPStartResult> {
    if (httpServer) await stop()

    const saved = deps.settingsStore.get('mcp.token') as string
    token = saved || generateToken()
    if (!saved) deps.settingsStore.set('mcp.token', token)

    const requestedPort = (deps.settingsStore.get('mcp.port') as number) || 3100
    const autoPort = (deps.settingsStore.get('mcp.autoPort') as boolean) ?? true
    let portToBind = requestedPort
    autoSelectedPort = false
    if (autoPort) {
      portToBind = await findFreePort(requestedPort, 20)
      autoSelectedPort = portToBind !== requestedPort
    }

    mcpServer = buildMcpServer()

    httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
      res.setHeader('Vary', 'Origin')
      if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }
      if (!validateAuth(req, token, res)) return
      const url = new URL(req.url ?? '/', `http://localhost:${boundPort}`)
      if (url.pathname === '/sse' && req.method === 'GET') {
        transport = new SSEServerTransport('/messages', res)
        clientCount++
        transport.onclose = () => { clientCount = Math.max(0, clientCount - 1); transport = null }
        mcpServer!.connect(transport).catch((err) => console.error('[mcp] SSE connection error:', err))
        return
      }
      if (url.pathname === '/messages' && req.method === 'POST') {
        if (!transport) { res.writeHead(503, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'No active SSE connection' })); return }
        let body = ''
        req.on('data', (chunk: Buffer) => { body += chunk.toString() })
        req.on('end', () => {
          try { transport!.handlePostMessage(req, res, JSON.parse(body)) }
          catch { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Invalid JSON' })) }
        })
        return
      }
      if (url.pathname === '/health') { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ status: 'ok', name: 'verql-mcp' })); return }
      res.writeHead(404); res.end('Not found')
    })

    return new Promise<MCPStartResult>((resolve, reject) => {
      httpServer!.once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') reject(Object.assign(new Error(`Port ${portToBind} is already in use`), { code: 'EADDRINUSE', port: portToBind }))
        else reject(err)
      })
      httpServer!.listen(portToBind, '127.0.0.1', () => {
        boundPort = portToBind
        console.log(`[mcp] Server started on http://127.0.0.1:${boundPort}`)
        resolve({ port: boundPort, token, autoSelectedPort })
      })
    })
  }

  async function stop(): Promise<void> {
    if (transport) { try { await transport.close() } catch { /* */ } transport = null }
    if (mcpServer) { try { await mcpServer.close() } catch { /* */ } mcpServer = null }
    if (httpServer) { await new Promise<void>((r) => httpServer!.close(() => r())); httpServer = null }
    clientCount = 0
    console.log('[mcp] Server stopped')
  }

  function getStatus(): MCPServerStatus {
    return { running: httpServer !== null, port: boundPort, clients: clientCount, token, autoSelectedPort }
  }

  return { start, stop, getStatus, resolveApproval, getActivity: () => [...activity] }
}
```

- [ ] **Step 4: Delete the dead catalog**

Run: `git rm src/main/mcp/tools.ts`

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/mcp/server-gating.test.ts`
Expected: PASS.

- [ ] **Step 6: Typecheck**

Run: `pnpm exec tsc -b --noEmit`
Expected: errors only in `ipc/mcp.ts` (the handler wiring, fixed in Task 14). Proceed.

- [ ] **Step 7: Commit**

```bash
git add src/main/mcp/server.ts tests/unit/mcp/server-gating.test.ts
git rm src/main/mcp/tools.ts
git commit -m "feat(mcp): rebuild server as ToolRegistry consumer with gates, activity, port resolution

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 7 — IPC handler wiring

### Task 14: Rewrite `ipc/mcp.ts` handlers

**Files:**
- Modify: `src/main/ipc/mcp.ts`

- [ ] **Step 1: Rewrite the handler module**

```ts
// src/main/ipc/mcp.ts
import { createMCPServer } from '../mcp/server'
import type { ConnectionAccessImpl } from '../plugins/sdk/connection-access'
import type { ToolRegistry } from '../plugins/sdk/types'
import type { MCPToolInfo } from '@shared/mcp'
import type { IpcContext, Handle } from './context'

export interface SettingsStoreFacade {
  get(key: string): unknown
  set(key: string, value: unknown): void
}

export function registerMcpHandlers(
  ctx: IpcContext,
  handle: Handle,
  connectionAccess: ConnectionAccessImpl,
  settingsStore: SettingsStoreFacade,
  toolRegistry: ToolRegistry
) {
  const mcpServer = createMCPServer({
    toolRegistry,
    getActiveConnectionId: () => connectionAccess.getActiveConnectionId(),
    settingsStore,
  })

  handle('mcp:start', async () => {
    const result = await mcpServer.start()
    ctx.configStore.setSetting('mcp.enabled', true)
    return result
  })

  handle('mcp:stop', async () => {
    await mcpServer.stop()
    ctx.configStore.setSetting('mcp.enabled', false)
  })

  handle('mcp:status', async () => mcpServer.getStatus())

  handle('mcp:tools', async (): Promise<MCPToolInfo[]> => {
    const disabled = (ctx.configStore.getSetting('mcp.disabledTools') as string[]) ?? []
    return toolRegistry.list().map(t => ({
      id: t.id, name: t.name, description: t.description, permission: t.permission,
      enabled: !disabled.includes(t.id),
    }))
  })

  handle('mcp:set-tool-enabled', async (toolId, enabled) => {
    const disabled = new Set((ctx.configStore.getSetting('mcp.disabledTools') as string[]) ?? [])
    if (enabled) disabled.delete(toolId)
    else disabled.add(toolId)
    ctx.configStore.setSetting('mcp.disabledTools', [...disabled])
    // Rebuild the exposed tool set if running.
    if (mcpServer.getStatus().running) { await mcpServer.stop(); await mcpServer.start() }
  })

  handle('mcp:activity', async () => mcpServer.getActivity())

  handle('mcp:regenerate-token', async () => {
    ctx.configStore.setSetting('mcp.token', '')
    if (mcpServer.getStatus().running) await mcpServer.stop()
    return mcpServer.start().then(() => mcpServer.getStatus())
      .catch(() => mcpServer.getStatus())
  })

  handle('mcp:approval-response', async (requestId, approved) => {
    mcpServer.resolveApproval(requestId, approved)
  })

  if (ctx.configStore.getSetting('mcp.enabled') as boolean) {
    mcpServer.start().catch(err => console.error('[mcp] Auto-start failed:', err))
  }

  return mcpServer
}
```

> `mcp:regenerate-token` writes an empty token then restarts; `server.start()` regenerates and persists a fresh one (see server `start()`). When not running, it does a transient start to mint the token, then returns status — adjust to `mint-only` if you prefer not to leave the server running; the simplest correct behavior is: clear token → if running, restart; if stopped, generate+persist via a small `generateToken()` call. Keep the restart-if-running path as the primary case.

- [ ] **Step 2: Confirm Task 4's call site passes `toolRegistry`**

Re-check `src/main/ipc-handlers.ts:114`:
```ts
registerMcpHandlers(ctx, handle, connectionAccess, settingsStore, toolRegistry)
```

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc -b --noEmit`
Expected: main-process clean. Remaining errors only in renderer (Phase 9).

- [ ] **Step 4: Commit**

```bash
git add src/main/ipc/mcp.ts src/main/ipc-handlers.ts
git commit -m "feat(ipc): wire MCP tools/activity/regenerate handlers to ToolRegistry

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 8 — `CodeView` primitive + `CodeBlock` refactor

### Task 15: Extract `CodeView` primitive

**Files:**
- Create: `src/renderer/src/primitives/data-display/CodeView.tsx`
- Create: `src/renderer/src/primitives/data-display/CodeView.stories.tsx`
- Modify: `src/renderer/src/primitives/index.ts` (export `CodeView`)

`CodeView` is the presentational shiki highlighter + copy button, **no** editor/store coupling. It is lifted from `components/ai/CodeBlock.tsx` (highlighter setup, langs, sanitize, header bar, copy) minus the Insert button and store imports.

- [ ] **Step 1: Write `CodeView.tsx`**

```tsx
// src/renderer/src/primitives/data-display/CodeView.tsx
import { useState, useEffect, useCallback } from 'react'
import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createOnigurumaEngine } from 'shiki/engine/oniguruma'
import DOMPurify from 'dompurify'

const SUPPORTED_LANGS = ['sql', 'json', 'javascript'] as const
type SupportedLang = typeof SUPPORTED_LANGS[number]

let highlighterPromise: Promise<HighlighterCore> | null = null
function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [import('shiki/themes/github-dark-default.mjs')],
      langs: [
        import('shiki/langs/sql.mjs'),
        import('shiki/langs/json.mjs'),
        import('shiki/langs/javascript.mjs'),
      ],
      engine: createOnigurumaEngine(import('shiki/wasm')),
    })
  }
  return highlighterPromise
}

const LANG_LABELS: Record<string, string> = { sql: 'SQL', json: 'JSON', javascript: 'JavaScript', js: 'JavaScript' }

export interface CodeViewProps {
  code: string
  language?: string
  /** Optional extra action rendered in the header (e.g. an Insert button). */
  actions?: React.ReactNode
  /** When false, hides the copy button (default true). */
  showCopy?: boolean
}

export function CodeView({ code, language, actions, showCopy = true }: CodeViewProps) {
  const [html, setHtml] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    const lang: SupportedLang = (SUPPORTED_LANGS as readonly string[]).includes(language || '')
      ? (language as SupportedLang) : 'sql'
    getHighlighter().then((hl) => {
      if (cancelled) return
      setHtml(DOMPurify.sanitize(hl.codeToHtml(code, { lang, theme: 'github-dark-default' })))
    }).catch(() => {})
    return () => { cancelled = true }
  }, [code, language])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [code])

  const langLabel = LANG_LABELS[language || ''] || language || 'SQL'

  return (
    <div className="my-2 rounded-lg border border-[var(--color-border)] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border)]">
        <span className="text-[11px] text-[var(--color-text-secondary)]">{langLabel}</span>
        <div className="flex items-center gap-1">
          {showCopy && (
            <button
              type="button"
              onClick={handleCopy}
              className="px-1.5 py-0.5 rounded text-[10px] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
          {actions}
        </div>
      </div>
      {html ? (
        <div
          className="text-xs [&_pre]:!p-3 [&_pre]:!m-0 [&_pre]:!rounded-none [&_pre]:!text-xs [&_code]:!text-xs [&_code]:!whitespace-pre-wrap [&_code]:!break-words"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="bg-[var(--color-bg-inset)] p-3 text-xs whitespace-pre-wrap break-words">
          <code>{code}</code>
        </pre>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write a story (validated by the Storybook test project)**

```tsx
// src/renderer/src/primitives/data-display/CodeView.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { CodeView } from './CodeView'

const meta: Meta<typeof CodeView> = { title: 'Data Display/CodeView', component: CodeView }
export default meta
type Story = StoryObj<typeof CodeView>

export const Sql: Story = { args: { code: 'SELECT id, name FROM users WHERE active = true;', language: 'sql' } }
export const Json: Story = { args: { code: '{\n  "mcpServers": {\n    "verql": { "type": "sse" }\n  }\n}', language: 'json' } }
```

> Before writing the story, run the MCP tool `get-storybook-story-instructions` (per CLAUDE.md) to match current story conventions, and `list-all-documentation`/`get-documentation` if you reference any primitive props.

- [ ] **Step 3: Export from primitives index**

Add to `src/renderer/src/primitives/index.ts`:
```ts
export { CodeView } from './data-display/CodeView'
export type { CodeViewProps } from './data-display/CodeView'
```

- [ ] **Step 4: Run story tests + typecheck + commit**

```bash
pnpm test -- --run src/renderer/src/primitives/data-display/CodeView.stories.tsx
pnpm exec tsc -b --noEmit
git add src/renderer/src/primitives/data-display/CodeView.tsx src/renderer/src/primitives/data-display/CodeView.stories.tsx src/renderer/src/primitives/index.ts
git commit -m "feat(primitives): add CodeView highlighter (shiki, copy, no editor coupling)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 16: Refactor AI `CodeBlock` to wrap `CodeView`

**Files:**
- Modify: `src/renderer/src/components/ai/CodeBlock.tsx`

- [ ] **Step 1: Rewrite `CodeBlock` to compose `CodeView` + Insert**

```tsx
// src/renderer/src/components/ai/CodeBlock.tsx
import { useCallback } from 'react'
import { CodeView } from '@/primitives'
import { useTabsStore } from '@/stores/tabs'
import { useConnectionsStore } from '@/stores/connections'

interface CodeBlockProps {
  code: string
  language?: string
  showInsert?: boolean
  alwaysShowInsert?: boolean
}

export function CodeBlock({ code, language, showInsert = true }: CodeBlockProps) {
  const updateTabSql = useTabsStore(s => s.updateTabSql)
  const addQueryTab = useTabsStore(s => s.addQueryTab)
  const tabs = useTabsStore(s => s.tabs)
  const activeTabId = useTabsStore(s => s.activeTabId)
  const connectionId = useConnectionsStore(s => s.activeConnectionId)

  const insertIntoEditor = useCallback(() => {
    const activeTab = tabs.find(t => t.id === activeTabId && t.type === 'query')
    if (activeTab) updateTabSql(activeTab.id, code)
    else { const newId = addQueryTab(connectionId); updateTabSql(newId, code) }
  }, [code, tabs, activeTabId, connectionId, updateTabSql, addQueryTab])

  return (
    <CodeView
      code={code}
      language={language}
      actions={showInsert ? (
        <button
          type="button"
          onClick={insertIntoEditor}
          className="px-1.5 py-0.5 rounded text-[10px] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-hover)]"
        >
          Insert
        </button>
      ) : undefined}
    />
  )
}
```

> Note: the old `alwaysShowInsert` controlled hover-reveal of the action buttons. `CodeView` always shows its header actions, so `alwaysShowInsert` becomes a no-op (kept in the prop type for call-site compatibility — `ToolCallCard` passes it). The hover-reveal behavior is dropped intentionally for consistency; if hover-reveal is required, add an opt-in prop to `CodeView` instead.

- [ ] **Step 2: Run the AI component story tests + typecheck**

Run: `pnpm test -- --run src/renderer/src/components/ai`
Expected: PASS (ToolCallCard/MarkdownContent still render). 
Run: `pnpm exec tsc -b --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/ai/CodeBlock.tsx
git commit -m "refactor(ai): CodeBlock composes CodeView primitive

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 9 — Renderer surfaces

### Task 17: MCP approval dialog — highlight SQL + tool/permission badge

**Files:**
- Modify: `src/renderer/src/components/ai/MCPApprovalDialog.tsx`
- Modify: `src/renderer/src/stores/ai.ts` (approval payload type)

- [ ] **Step 1: Update the store's MCP approval shape**

In `src/renderer/src/stores/ai.ts`:
- Import: `import type { MCPApprovalRequest } from '@shared/mcp'`.
- Change `mcpPendingApproval: { requestId: string; sql: string } | null` → `mcpPendingApproval: MCPApprovalRequest | null`.
- In the IPC listener (`window.electronAPI.on(IPC_EVENTS.MCP_APPROVAL_REQUEST, ...)`), set state from the typed request:
```ts
window.electronAPI.on(IPC_EVENTS.MCP_APPROVAL_REQUEST, (request: unknown) => {
  useAIStore.setState({ mcpPendingApproval: request as MCPApprovalRequest })
})
```

- [ ] **Step 2: Rewrite the dialog**

```tsx
// src/renderer/src/components/ai/MCPApprovalDialog.tsx
import { useAIStore } from '@/stores/ai'
import { AlertTriangle } from 'lucide-react'
import { CodeView } from '@/primitives'

export function MCPApprovalDialog() {
  const req = useAIStore(s => s.mcpPendingApproval)
  const respond = useAIStore(s => s.respondToMCPApproval)
  if (!req) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-bg-primary border border-border rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-yellow-500/10">
          <AlertTriangle size={18} className="text-yellow-500 shrink-0" />
          <span className="text-sm font-medium text-text-primary">MCP Query Approval</span>
          <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${req.permission === 'write' ? 'bg-yellow-500/20 text-yellow-600' : 'bg-bg-secondary text-text-secondary'}`}>
            {req.permission === 'write' ? 'WRITE' : 'READ'}
          </span>
        </div>
        <div className="p-4">
          <p className="text-xs text-text-secondary mb-2">
            An external MCP client wants to run <span className="font-medium text-text-primary">{req.toolName}</span>:
          </p>
          <div className="max-h-48 overflow-y-auto">
            <CodeView code={req.sql} language="sql" />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-border">
          <button onClick={() => respond(req.requestId, false)} className="px-4 py-1.5 text-sm rounded-md border border-border text-text-secondary hover:bg-hover transition-colors">Reject</button>
          <button onClick={() => respond(req.requestId, true)} className="px-4 py-1.5 text-sm rounded-md bg-accent text-white hover:opacity-90 transition-colors">Approve</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Typecheck + commit**

```bash
pnpm exec tsc -b --noEmit
git add src/renderer/src/components/ai/MCPApprovalDialog.tsx src/renderer/src/stores/ai.ts
git commit -m "feat(mcp): highlight approval SQL + show tool name and read/write badge

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 18: MCP settings — controls, activity feed, port handling, CodeView config

**Files:**
- Rewrite: `src/renderer/src/components/settings/categories/MCPSettings.tsx`

- [ ] **Step 1: Rewrite the settings panel**

```tsx
// src/renderer/src/components/settings/categories/MCPSettings.tsx
import { useState, useEffect, useCallback } from 'react'
import { Stack, Divider, Flex, Button, Text, Input, CodeView } from '@/primitives'
import { useSettingsStore } from '@/stores/settings'
import { SettingRow } from '../SettingRow'
import { PluginContributedSettings } from '../PluginContributedSettings'
import { Copy, Check, RefreshCw } from 'lucide-react'
import { IPC_CHANNELS, IPC_EVENTS } from '@shared/ipc'
import { buildMcpClientConfig, type MCPServerStatus, type MCPToolInfo, type MCPActivityEntry } from '@shared/mcp'

const DEFAULT_STATUS: MCPServerStatus = { running: false, port: 3100, clients: 0, token: '', autoSelectedPort: false }

export function MCPSettings() {
  const mcp = useSettingsStore((s) => s.settings.mcp)
  const setSetting = useSettingsStore((s) => s.set)
  const [status, setStatus] = useState<MCPServerStatus>(DEFAULT_STATUS)
  const [tools, setTools] = useState<MCPToolInfo[]>([])
  const [activity, setActivity] = useState<MCPActivityEntry[]>([])
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setStatus(await window.electronAPI.invoke(IPC_CHANNELS.MCP_STATUS) as MCPServerStatus)
      setTools(await window.electronAPI.invoke(IPC_CHANNELS.MCP_TOOLS) as MCPToolInfo[])
      setActivity(await window.electronAPI.invoke(IPC_CHANNELS.MCP_ACTIVITY) as MCPActivityEntry[])
    } catch { /* */ }
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 5000)
    const off = window.electronAPI.on(IPC_EVENTS.MCP_ACTIVITY_EVENT, (entry: unknown) => {
      setActivity(prev => [...prev.slice(-99), entry as MCPActivityEntry])
    })
    return () => { clearInterval(interval); off?.() }
  }, [refresh])

  const toggleServer = async () => {
    setLoading(true); setError(null)
    try {
      if (status.running) await window.electronAPI.invoke(IPC_CHANNELS.MCP_STOP)
      else await window.electronAPI.invoke(IPC_CHANNELS.MCP_START)
      await refresh()
    } catch (err) {
      const e = err as { code?: string; port?: number; message?: string }
      setError(e.code === 'EADDRINUSE' ? `Port ${e.port ?? mcp.port} is already in use. Enable auto-port or pick another.` : (e.message ?? 'Failed to start MCP server'))
    } finally { setLoading(false) }
  }

  const token = status.token || mcp.token
  const port = status.running ? status.port : mcp.port
  const configJson = JSON.stringify(buildMcpClientConfig({ port, token: token || '<start server to generate>' }), null, 2)

  const copyConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(buildMcpClientConfig({ port, token }), null, 2))
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const regenerate = async () => {
    setStatus(await window.electronAPI.invoke(IPC_CHANNELS.MCP_REGENERATE_TOKEN) as MCPServerStatus)
    await refresh()
  }

  const setToolEnabled = async (id: string, enabled: boolean) => {
    setTools(prev => prev.map(t => t.id === id ? { ...t, enabled } : t))
    await window.electronAPI.invoke(IPC_CHANNELS.MCP_SET_TOOL_ENABLED, id, enabled)
  }

  return (
    <Stack gap="md">
      <Text size="xs" color="muted">Expose your active database connection to external AI tools like Claude Code</Text>

      <SettingRow label="Server Status" description={
        status.running
          ? `Running on port ${status.port} · ${status.clients} client${status.clients !== 1 ? 's' : ''} connected`
          : 'Server is stopped'
      }>
        <Button variant={status.running ? 'outline' : 'solid'} size="sm" onClick={toggleServer} disabled={loading}>
          {loading ? 'Working...' : status.running ? 'Stop Server' : 'Start Server'}
        </Button>
      </SettingRow>

      {status.running && status.autoSelectedPort && (
        <Text size="xs" color="muted">Requested port {mcp.port} was busy — using {status.port}.</Text>
      )}
      {error && <Text size="xs" color="error">{error}</Text>}

      <SettingRow label="Port" description="Preferred HTTP port for the MCP server">
        <Input type="number" value={mcp.port} onChange={(e) => setSetting('mcp.port', parseInt(e.target.value) || 3100)}
          size="sm" className="w-28" min={1024} max={65535} disabled={status.running} aria-label="MCP server port" />
      </SettingRow>

      <SettingRow label="Auto-resolve port" description="If the preferred port is busy, bind the next free port">
        <input type="checkbox" checked={mcp.autoPort} onChange={(e) => setSetting('mcp.autoPort', e.target.checked)} disabled={status.running} aria-label="Auto-resolve port" />
      </SettingRow>

      <SettingRow label="Read-only mode" description="Hide write tools from MCP clients entirely">
        <input type="checkbox" checked={mcp.readOnly} onChange={(e) => setSetting('mcp.readOnly', e.target.checked)} aria-label="Read-only mode" />
      </SettingRow>

      <SettingRow label="Max rows" description="Row cap returned by the query tool">
        <Input type="number" value={mcp.maxRows} onChange={(e) => setSetting('mcp.maxRows', parseInt(e.target.value) || 500)}
          size="sm" className="w-28" min={1} max={100000} aria-label="Max rows" />
      </SettingRow>

      <Divider />

      <Text size="xs" color="muted">Tools exposed to MCP clients</Text>
      <Stack gap="xs">
        {tools.map(t => (
          <Flex key={t.id} direction="row" align="center" justify="between" className="px-2 py-1 rounded hover:bg-hover">
            <Stack gap="none">
              <Text size="xs">{t.name} <span className="text-text-tertiary">({t.permission})</span></Text>
              <Text size="xs" color="muted">{t.description}</Text>
            </Stack>
            <input type="checkbox" checked={t.enabled} onChange={(e) => setToolEnabled(t.id, e.target.checked)} aria-label={`Enable ${t.name}`} />
          </Flex>
        ))}
      </Stack>

      <Divider />

      <SettingRow label="Auth Token" description="Bearer token for authenticating MCP clients">
        <Flex direction="row" align="center" gap="sm">
          <Input type="password" value={token || 'Start server to generate'} readOnly size="sm" className="w-56 font-mono" aria-label="MCP auth token" />
          <Button variant="ghost" size="sm" onClick={regenerate} title="Regenerate token"><RefreshCw size={14} /></Button>
        </Flex>
      </SettingRow>

      <SettingRow label="Claude Code Config" description="Copy this to ~/.claude.json to connect Claude Code">
        <Button variant="outline" size="sm" onClick={copyConfig}>
          {copied ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />} Copy Config
        </Button>
      </SettingRow>
      <CodeView code={configJson} language="json" />

      <Divider />

      <Text size="xs" color="muted">Recent activity</Text>
      <Stack gap="none">
        {activity.length === 0 && <Text size="xs" color="muted">No MCP tool calls yet.</Text>}
        {[...activity].reverse().map(a => (
          <Flex key={a.id} direction="row" align="center" gap="sm" className="text-xs py-0.5">
            <span className={a.status === 'ok' ? 'text-[var(--color-success)]' : a.status === 'rejected' ? 'text-warning' : 'text-[var(--color-error)]'}>●</span>
            <span className="font-mono">{a.toolId}</span>
            <span className="text-text-tertiary truncate flex-1">{a.paramsSummary}</span>
            <span className="text-text-tertiary">{a.durationMs}ms</span>
          </Flex>
        ))}
      </Stack>

      <PluginContributedSettings category="mcp" />
    </Stack>
  )
}
```

> Verify against the design-system MCP docs (per CLAUDE.md): confirm `Stack` supports `gap="none"`/`gap="xs"`, `Flex` supports `justify="between"`, and `Text` supports `color="error"`/`color="muted"`. If a prop isn't documented, use the documented equivalent (e.g. wrap a checkbox in the project's `Switch`/`Checkbox` primitive if one exists — run `list-all-documentation` to check before using raw `<input type="checkbox">`).

- [ ] **Step 2: Typecheck + run renderer tests**

Run: `pnpm exec tsc -b --noEmit`
Expected: clean.
Run: `pnpm test -- --run tests/unit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/settings/categories/MCPSettings.tsx
git commit -m "feat(mcp): control panel (tool toggles, read-only, row limit), activity feed, port handling, highlighted config

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 19: ActivityBar uses the shared status type

**Files:**
- Modify: `src/renderer/src/components/shell/ActivityBar.tsx`

- [ ] **Step 1: Replace the inline status shape**

- Import: `import type { MCPServerStatus } from '@shared/mcp'`.
- Change the `invoke(IPC_CHANNELS.MCP_STATUS)` cast from the inline `{ running: boolean; clients: number }` to `as MCPServerStatus`.
- No behavior change; just the type.

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm exec tsc -b --noEmit
git add src/renderer/src/components/shell/ActivityBar.tsx
git commit -m "refactor(shell): ActivityBar uses shared MCPServerStatus type

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 10 — Finalize

### Task 20: Changeset + full verification

**Files:**
- Create: `.changeset/mcp-tooling-unification.md`

- [ ] **Step 1: Add a changeset** (per project convention — every feature PR needs one; minor pre-1.0)

```md
---
"verql": minor
---

Unify MCP and AI tooling behind a single SDK ToolRegistry, move tool logic into a bundled db-tools plugin, add MCP control (per-tool toggles, read-only mode, row limit) and a live activity log, resolve port conflicts automatically, and render SQL/config with syntax highlighting.
```

> Confirm the package name in `.changeset` matches existing changesets (`grep -h '"' .changeset/*.md | head`). Use that exact name.

- [ ] **Step 2: Full test suite**

Run: `pnpm test`
Expected: all unit + Storybook tests PASS.

- [ ] **Step 3: Full typecheck**

Run: `pnpm exec tsc -b --noEmit`
Expected: zero errors.

- [ ] **Step 4: Build smoke check**

Run: `pnpm build`
Expected: completes without errors.

- [ ] **Step 5: Manual verification (per spec testing section)**

Use the `verify`/`run` skill to launch the app and confirm: start MCP server (observe auto-port if 3100 busy), toggle a tool off and confirm it disappears from `mcp:tools`, run a write query from an MCP client and approve it (highlighted SQL + WRITE badge), and watch the activity feed update.

- [ ] **Step 6: Commit**

```bash
git add .changeset/mcp-tooling-unification.md
git commit -m "chore: changeset for MCP tooling unification

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- Zero duplication → Tasks 1–2 (SDK), 5–8 (db-tools + AI consumer), 13 (delete `mcp/tools.ts`). ✓
- SDK provides capability, plugins provide logic → Tasks 2–3 (`ctx.tools`), 5–6 (db-tools owns logic). ✓
- MCP independent of AI plugin → Task 6 (always-on db-tools), Task 13 (MCP reads registry, not AI). ✓
- Control: per-tool toggles, read-only, row limit, activity log → Tasks 10, 13, 14, 18. ✓
- Port-conflict resolution + clear errors → Tasks 12, 13, 14, 18. ✓
- Highlighting (CodeView; approval SQL; config JSON; one config builder) → Tasks 9, 15, 16, 17, 18. ✓
- Clean break on `ctx.ai.registerTool` → Task 8. ✓
- Shared `MCPServerStatus` replaces inline re-types → Tasks 9, 18, 19. ✓
- `mcp:regenerate-token` real handler → Task 14, used in Task 18. ✓

**Placeholder scan:** No "TBD/TODO/handle edge cases" steps; every code step shows full code. The few "verify against X" notes are explicit discovery instructions for project-specific names (settings accessor, bundled-plugin list, design-system props), not deferred work — each names the exact file/command to confirm against.

**Type consistency:** `Tool`/`ToolContext`/`ToolResult`/`ToolRegistry`/`ToolDefinition` (Task 2) are used unchanged in Tasks 3, 5, 7, 13. `MCPServerStatus`/`MCPToolInfo`/`MCPActivityEntry`/`MCPApprovalRequest`/`MCPStartResult`/`buildMcpClientConfig` (Task 9) are used consistently in Tasks 11, 13, 14, 17, 18, 19. `createDbTools(schema, connections, getMaxRows)` (Task 5) is called identically in Task 6. `registerMcpHandlers(..., toolRegistry)` arity matches between Tasks 4 and 14. `createMCPServer` now takes `{ toolRegistry, getActiveConnectionId, settingsStore }` and `start()` takes no args (Task 13) — matched in Task 14.

**Known sequencing coupling:** Tasks 4 ↔ 12/14 (the `registerMcpHandlers` signature and `createMCPServer` shape) and Tasks 7 ↔ 8 (AI types). Each is flagged inline with a "complete together / typecheck at the end" note. Intermediate `tsc` errors during those pairs are expected and called out.
