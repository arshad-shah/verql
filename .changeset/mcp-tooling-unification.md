---
"verql": minor
---

Unify MCP and AI tooling behind a single SDK `ToolRegistry`. Database tool logic now lives in a dedicated always-on `db-tools` bundled plugin consumed by both the MCP server and the AI assistant (clean break: `ctx.ai.registerTool` is removed in favour of `ctx.tools`). The MCP settings panel gains per-tool enable toggles, a read-only mode, a configurable row limit, automatic port-conflict resolution, and a live activity log. SQL in the MCP approval dialog and the Claude client config are now syntax-highlighted via a new reusable `CodeView` primitive.
