# AI Chat Enhancements — Design

**Date:** 2026-05-27
**Status:** Approved design, pending implementation plan

## Overview

Enhance the Verql AI chat panel along three threads, in this order:

1. **Connection wiring fix** (foundational) — the AI cannot use the currently active database.
2. **Chat UI/UX** — "refined bubbles" with an adaptive assistant message, avatars, message actions, and a home for action chips.
3. **Deep app integration** — an extensible App-Action registry so the AI can link users to (and act on) parts of the app: inline deep-link chips for guidance plus a curated set of agentic action tools.

A non-built deliverable — a "what else we could allow the AI to do" roadmap — is captured at the end of this doc.

### Constraints (project conventions)

- **No emoji anywhere.** ASCII + lucide icon components only.
- **Build from primitives.** Use `Avatar` (`primitives/data-display/Avatar.tsx`), `CodeView`/the AI `CodeBlock`, `Card`, `Text`, etc. Verify component props via the Storybook MCP before use (per CLAUDE.md).
- **Declarative & plugin-extensible.** The integration layer must let future plugins register their own actions/destinations — no per-capability hardcoding.
- Run `pnpm exec tsc -b --noEmit` before "done"; add a Changeset per PR.

---

## Thread 1 — Connection wiring fix

### Root cause

There are two independent `ConnectionAccessImpl` instances:

- `src/main/ipc-handlers.ts:96` — shared by the DB handlers and the MCP server. `db:connect` (`src/main/ipc/db.ts:28,48`) calls `setActiveConnectionId(profileId)` on **this** instance, which is why MCP works.
- `src/main/plugins/plugin-host.ts:351` — `createPluginContext` builds a **fresh** `ConnectionAccessImpl` per plugin. The AI plugin receives this one via `deps.connectionAccess`, and **nothing ever calls `setActiveConnectionId` on it**. So `ConversationManager.getConnectionId()` (`src/main/plugins/bundled/ai/internal/index.ts:117`) always returns `null`, and the AI's `query`/schema tools run with no connection.

A secondary defect: the renderer already sends the correct `connectionId` to `ai:chat:start` (`src/renderer/src/stores/ai.ts:95`), but the handler (`src/main/plugins/bundled/ai/internal/index.ts:136`) ignores it. And switching among multiple open connections in the UI (`setActiveConnection`, `connections.ts:33`) never re-syncs main at all — it only sets local renderer state.

### Approach

Make the renderer the source of truth for "which connection is active in the chat," since it already knows and already transmits it.

1. **Thread `connectionId` through the chat request.** `ai:chat:start` accepts `request.connectionId` and passes it into `ConversationManager.chat()` / the per-chat tool context, overriding the ambient `getConnectionId()` for that conversation. This fixes both the instance-isolation bug and the multi-connection staleness in one move, because the renderer sends the UI's active connection on every send.
2. **Keep `getConnectionId()` as the fallback** when no per-request id is supplied (e.g. enhancements paths).
3. **Optionally** (decide in planning) share the single `connectionAccess` instance with plugin contexts so ambient active-connection state is globally correct too. This is a larger blast radius; the per-request thread in (1) is the minimal, robust fix and is required regardless.

### Boundaries / data flow

`ChatInput` → `useAIStore.sendMessage(message, connectionId, meta)` → `ai:chat:start` IPC → `ConversationManager.chat({ connectionId, connectionMeta })` → tool context `{ connectionId }` → `ToolRegistry.execute`. The connection id flows as an explicit parameter the whole way; no reliance on ambient per-plugin state.

### Testing

- Unit: `ConversationManager.chat()` given an explicit `connectionId` passes it to `toolRegistry.execute` context (mock registry).
- Unit: with no explicit id, falls back to `getConnectionId()`.
- Regression: connect to A and B, set B active in the UI, send a chat → tool context carries B.

---

## Thread 2 — Chat UI/UX ("refined bubbles")

Chosen direction: **A · Refined bubbles** (keeps bubbles, adds identity + actions), with an **intelligent/adaptive assistant bubble**.

### Components & changes

- **Avatars.** Each turn is anchored by an avatar on the left (assistant) / the message right-aligned (user). Assistant avatar uses a lucide icon (e.g. `Sparkles` or `Bot`) — **not** an emoji. The `Avatar` primitive currently renders initials/`src` only, so either (a) extend `Avatar` to accept an `icon`/`children` slot, or (b) compose an avatar-styled container around a lucide icon. Decide in planning; prefer extending the primitive so plugins/future UI reuse it. User avatar uses initials via `Avatar`.
- **Bubble emanates from the avatar.** The assistant bubble's top-left corner is square (`rounded-tl-sm`) and sits flush against the avatar so it reads as "coming out of" it (tail toward the avatar). User bubble mirrors this on the right.
- **Adaptive assistant width ("no weird truncation").** Default: bubble hugs content up to ~82% width (`inline-block`, `max-w-[82%]`). When the rendered message contains wide content — a table, a fenced code block, or `EXPLAIN`-style output — the bubble switches to full width (`block`, `max-w-full`) so nothing clips or wraps awkwardly. Detection: `MarkdownContent` reports whether it rendered a `table`/`pre` (e.g. a callback or a parsed-AST check), and `MessageBubble` chooses snug vs wide from that signal. Short prose stays snug.
- **Message actions on hover.** Copy (always), Retry (last assistant turn) — lucide `Copy` / `RotateCcw` `IconButton`s, revealed on hover, low-emphasis.
- **Code & tables.** Reuse the existing `CodeBlock`/`CodeView` and `MarkdownContent` table styling; ensure wide variants get horizontal scroll, never truncation.
- **Empty state.** Replace the bare "Ask me anything" with a few suggestion chips seeded from current context (e.g. "Explain this schema", "Find slow queries") — reuses the chip component below.
- **Error bubble.** Fix the brittle `content.startsWith('Error:')` check in `MessageBubble.tsx:12` (errors are now prefixed differently); drive off message metadata instead of string sniffing.

### Files

`src/renderer/src/components/ai/MessageBubble.tsx`, `MarkdownContent.tsx`, `MessageThread.tsx`, `ToolCallCard.tsx` (visual alignment with new bubbles), plus a new `ActionChip` and (if extended) `Avatar`. Add/refresh stories: `MessageBubble.stories.tsx`.

### Testing

- Storybook stories: short reply (snug), table reply (wide), code reply (wide), error, user, with-action-chip. Story tests validate accessibility.
- Unit: the snug-vs-wide decision given content with/without table/code.

---

## Thread 3 — Deep app integration

Chosen mechanism: **blend** — one App-Action registry as the single source of truth, surfaced two ways: inline **deep-link chips** (user-click) and a curated subset of **agentic action tools**. Approval: **mutating actions only**.

### 3a. App-Action registry (renderer, plugin-extensible)

A new renderer-side registry (`src/renderer/src/stores/app-actions.ts` or `lib/app-actions/`) holding `AppAction` descriptors:

```ts
interface AppAction {
  id: string                 // e.g. 'open-settings', 'new-query-tab', 'focus-table'
  title: string              // human label for chips / catalog
  description: string        // shown to the AI in the system prompt
  params?: JSONSchema        // typed parameters
  kind: 'navigation' | 'mutating'   // gates agentic approval
  run: (params) => void | Promise<void>   // executes in the renderer
}
```

Built-in actions (map onto existing store calls): `open-settings(category)`, `open-connections-panel`, `open-secondary-panel(id)`, `new-query-tab(sql?)`, `run-sql(sql)` (mutating), `open-er-diagram`, `focus-table(schema,table)`, `show-explorer`. These wrap the same Zustand actions the `CommandPalette` already uses (`setActivePanel`, `setActiveSettingsCategory`, `setSecondaryActivePanel`, `addQueryTab`, `openErDiagram`).

**Plugin extensibility (key requirement):** the registry exposes a registration API so plugins can contribute actions/destinations, the same way they contribute commands and panels today. Two layers:

- Renderer plugins register `AppAction`s directly.
- The existing **plugin manifest `contributes`** model gains an `appActions` (or reuse/extend `commands`) contribution so main-process plugins can declare navigable destinations; these are relayed to the renderer registry on plugin lifecycle (reusing the `PLUGINS_LIFECYCLE` event the `CommandPalette` already listens to). This keeps the design declarative and consistent with `feedback_plugin_architecture`.

The AI learns the catalog because the system prompt is assembled from `registry.list()` (id + title + description + params + kind) — so any plugin-registered action automatically becomes referenceable by the AI with zero AI-side changes.

### 3b. Deep-link chips (guidance / "I can't, but…")

- The AI emits links using a scheme, e.g. `[Open AI settings](verql://action/open-settings?category=ai)`.
- `MarkdownContent`'s `a` renderer intercepts `verql://action/...` hrefs (instead of `target="_blank"`) and renders an inline **`ActionChip`** — a lucide-icon + label pill (no emoji) styled per the approved mockup. Click → look up the action in the registry → `run(params)`. Unknown/over-permission actions render disabled with a tooltip.
- This powers the guided flow: the AI explains it can't do X itself, then drops a chip that navigates the user to where they can (e.g. create a connection), exactly as in the mockup.
- Safety: chips are always user-initiated clicks; navigation actions run immediately, `mutating` chips ask for an in-renderer confirm before running.

### 3c. Agentic action tools (curated subset)

- Register a small set of the registry's actions as **tools** in the shared `ToolRegistry` (the unified MCP+AI registry) so the AI can act without a click — e.g. `open_query_tab(sql)`, `run_sql(sql)`, `focus_table(...)`.
- Because tools execute in **main** but actions run in the **renderer**, these tools' `execute()` broadcast a `app:action:perform` event (correlated id) to the renderer; the renderer runs the matching `AppAction` and reports completion back. A thin main↔renderer bridge.
- **Approval:** `kind: 'navigation'` tools run freely; `kind: 'mutating'` (anything that runs SQL or changes data) routes through the **existing** `PermissionManager` / `ApprovalCard` flow already used by DB tools — no new approval UI.
- Result surfaces in the existing `ToolCallCard`.

### System prompt

Extend `ConversationManager.assembleSystemMessage()` to append the action catalog and usage rules: "When you cannot perform an action yourself, link the user to the relevant place using `verql://action/<id>` and briefly say what to do there, then how to come back." Keep it concise (the prompt is already terse by design).

### Files

New: `app-actions` registry + `ActionChip` (renderer); `app:action:perform` IPC channel in `shared/ipc.ts`; action-tool registrations (main). Edited: `MarkdownContent.tsx`, `conversation-manager.ts` (system prompt), `shared/ipc.ts`, plugin manifest types (`src/main/plugins/types.ts`) for the `appActions` contribution.

### Testing

- Unit: deep-link parsing (`verql://action/...` → id + params), unknown/over-permission handling.
- Unit: registry registration + plugin-contributed action relay.
- Unit: agentic tool → broadcast → renderer run, with mutating gated by approval.
- Storybook: `ActionChip` (navigation, mutating, disabled) + a message containing chips.

---

## What else we could allow the AI to do (now built on the registry)

These were originally a roadmap; they are now implemented as built-in `AppAction`s in
`src/renderer/src/lib/app-actions/builtins.ts`. Each is automatically a system-prompt
catalog entry, an agentic `perform_app_action` target, and a user-clickable deep-link chip.
All are `navigation` kind (no data mutation), so they run agentically.

- **Connection lifecycle:** `connect-database`, `disconnect-database`, `switch-connection`
  (resolve a saved connection by name or id via `app-actions/resolve.ts`).
- **Schema authoring:** `new-query-tab` scaffolds `CREATE TABLE`/migration DDL into a tab;
  nothing auto-runs.
- **Result actions:** `export-results` (CSV/JSON via the existing `export:query-result`
  exporter), `open-chart` (chart panel for the active result set).
- **Navigation deep links:** `focus-table` (reveal a table/column in the explorer),
  `open-saved-query`, and `open-er-diagram` (now takes an optional `table` to select it).
- **Editor assist (beyond inline completion):** `insert-into-editor` inserts at the cursor /
  replaces the current selection in the active Monaco editor. (A "format buffer" action is
  still pending — no SQL document-formatting provider is registered yet.)
- **Settings & plugins:** `open-settings` (category, incl. `plugins` to enable/configure),
  `open-install-plugin`.
- **Diagnostics:** a `notificationsSummary` of recent errors/warnings is threaded into the
  chat request and system prompt, and `open-notifications` links the user to the panel.

---

## Out of scope (YAGNI)

- A dedicated "capability discovery" UI surface (user opted for guidance via chips + empty-state suggestions instead).
- Auto-executing mutating actions without approval.
- Multi-conversation history/persistence, conversation branching.
- Reworking provider/model management.
