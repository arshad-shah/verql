# Chat Panel Redesign

**Date:** 2026-05-28
**Status:** Draft — pending user review
**Scope:** Renderer redesign of the AI chat panel (`src/renderer/src/components/ai/`) plus a small main-side addition for permission profiles and auto-compact. Locks in V1 of the visual exploration: persistent action zone above the composer, segmented permission-mode row, immediate loading skeleton, banner-style auto-compact at 80% context use, status-bar popover for at-a-glance AI status.

## Motivation

The chat panel today works but several rough edges undermine confidence:

- **Approval card scrolls away.** `ApprovalCard` is rendered inside `MessageThread`'s scrollable area. When the thread overflows, the approval falls below the viewport — users miss it or have to scroll to act. The action must always be visible.
- **No permission profiles.** `PermissionManager` only supports per-tool overrides. There's no high-level switch ("Read-only / Ask write / Auto") that bundles those overrides — every consequential action shows the same approval card regardless of user intent.
- **Double loading state.** `MessageThread` shows both a "Thinking..." spinner row AND a streaming card with a blinking cursor. They render in the same conversation slot, double-rendering for the same moment.
- **Visible delay between send and feedback.** Send a message and nothing happens visually until the AI starts streaming. The empty pause feels like a bug.
- **AI status-bar popover doesn't open.** The Popover primitive is broken (fixed in a separate commit, but the segment never had a working detail surface).
- **Context-window dread.** Users hit the wall at 100% with no warning ramp. We have the data; we should provide an automatic compaction at ~80%.
- **Compaction UX is minimal.** Today it's a button + a spinner. No clarity on what just happened, no preview, no undo, no way to know it was useful.

## Non-goals

- No new providers or model logic.
- No move of AI logic from the plugin into the renderer (or vice versa); the plugin owns chat/streaming/summarize/permissions; the renderer owns presentation.
- No change to message persistence format (still `Conversation[]` in localStorage, mirrored to the plugin via `ai:messages:set`).
- No change to the editor surfaces shipped in this branch.

## Architecture boundary

Per `CLAUDE.md`: main app provides UI + glue; plugins own domain logic. This redesign preserves that split:

- **AI plugin** (`src/main/plugins/bundled/ai/`) owns provider calls, the conversation manager, permission manager, summarization, and IPC.
- **Renderer chat panel** lives at `src/renderer/src/components/ai/` — plugin-owned by colocation, not by host. The host renderer mounts it through the existing `HOST_COMPONENTS['ai-chat-panel']` slot.
- New permission-profile state lives on the plugin (it owns the `PermissionManager`); the renderer reads/writes it through IPC.

## Design

### Section 1 — Panel layout: persistent action zone

The panel becomes a vertical stack with **three regions**: scrollable thread (flexes), persistent action zone (sticky to bottom), composer (sticky to bottom). The action zone is the new pattern — anything that needs user attention (approval, mode change, banner) renders above the composer so it can never scroll away.

```
┌────────────────────────────────────┐
│ ChatPanelHeader                    │ ← unchanged from current
│ (conversation switcher,            │
│  model, context-window strip)      │
├────────────────────────────────────┤
│ AutoCompactBanner (conditional)    │ ← appears when ≥80% used
├────────────────────────────────────┤
│ MessageThread (scrolls)            │
│   ...                              │
│   - typing/streaming card          │
└────────────────────────────────────┤
│ Action zone (always visible):      │
│   - ApprovalCard (when pending)    │
│   - PermissionModeRow (always)     │
│   - Composer                       │
└────────────────────────────────────┘
```

`ApprovalCard` moves out of `MessageThread` into the action zone. It conditionally renders when `useAIStore.pendingApproval` is non-null. No layout shift when it appears because the action zone is already a block container.

### Section 2 — Permission profiles

The plugin exposes three named profiles that map to existing `PermissionManager` behavior:

| Profile | Reads | Writes | Approval card |
|---|---|---|---|
| `read-only` | allowed | blocked outright (the tool refuses before invoking) | only for blocked-write attempts |
| `ask-write` (default) | allowed | require user approval | every write |
| `auto` | allowed | allowed without prompt | never |

**Plugin changes (`src/main/plugins/bundled/ai/internal/`):**

- `PermissionManager` gains a `profile: 'read-only' | 'ask-write' | 'auto'` field with `getProfile()` / `setProfile(p)`.
- `needsApproval(tool)` returns:
  - `read-only` + write tool → throw a blocked-write error from the call site instead of waiting on approval.
  - `ask-write` + write tool → return true.
  - `auto` → always false.
- Settings persistence: the AI plugin stores the profile in the existing settings store as `ai.permissionProfile` so it's remembered across sessions.

**IPC additions to `shared/ipc.ts`:**

```ts
'ai:permission:get-profile': { args: []; return: 'read-only' | 'ask-write' | 'auto' }
'ai:permission:set-profile': { args: [profile: 'read-only' | 'ask-write' | 'auto']; return: void }
```

**Renderer changes:**

- `useAIStore` gains `permissionProfile`, `setPermissionProfile(p)`, `loadPermissionProfile()`. Loaded on chat-panel open.
- New `PermissionModeRow` component in the action zone: segmented control with three options (icon + label), tied to `useAIStore.permissionProfile`. Lucide icons: `Eye` (read-only), `Shield` (ask-write), `Zap` (auto). Selected variant uses tone-coded color (success, accent, error).
- When the AI plugin returns a blocked-write error in `read-only` mode, surface it as an assistant message with the `isError` flag and a one-line hint to switch modes.

### Section 3 — Loading state unification

Today `MessageThread` renders:

```tsx
{isStreaming && !streamingContent && <Spinner row "Thinking..." />}
{streamingContent && <Card with markdown + cursor />}
```

These two slots render the same conversational moment differently — the spinner before the first token, the card after. Combine into a single component: a `StreamingResponse` card that:

1. Mounts the instant `sendMessage` is called (not when the first stream event arrives). Use a new `isAwaitingResponse: boolean` in the AI store, set true on send, cleared when the assistant message is appended.
2. While awaiting: shows a header with `Sparkles` + "Working…" + a skeleton (three shimmer bars). No "Thinking..." text — just the skeleton.
3. When streaming text starts: replaces the skeleton with the markdown content, keeps the same card chrome (no visual jump).
4. While streaming: a thin pulsing caret at the cursor tip.

The double-render bug disappears because there's only one slot now. The "no feedback after send" pain disappears because the card mounts on the send action, not after the IPC roundtrip starts emitting events.

### Section 4 — Auto-compact at 80%

When `(totalInputTokens + totalOutputTokens) / contextWindow >= 0.80` and the conversation isn't currently streaming or compacting, a soft auto-compact runs:

1. **Warning banner** appears between the header and the thread: amber background, `AlertTriangle` icon, message `"82% used. Auto-compact in 5s — keeps the recent exchange, summarises the rest."`. Two buttons: **Now** (run immediately), **Skip** (suppress for this conversation).
2. After 5s (countdown not displayed; just elapses), `compactConversation()` runs with `keepLast=2`.
3. Banner morphs into the in-progress card (re-uses the StreamingResponse skeleton chrome) labeled "Compacting…".
4. On completion, the banner becomes a one-line success line: `"Compacted X earlier turns into a summary."` with an **Undo** button. Undo restores the pre-compact message list (we snapshot it before swapping). Auto-dismiss after 8s.
5. Skipping suppresses the banner for the current conversation until the user explicitly triggers compact, or until usage hits 95% (then we show a final, non-dismissable warning — no auto-run).

**Store changes:**

- `compactConversation` records a snapshot to `lastPreCompactMessages: AIChatMessage[] | null` before mutation. New action `undoLastCompact()` restores it. The snapshot is per active conversation and discarded when the conversation is switched or after the next compaction.
- New `autoCompactSuppressed: Record<conversationId, boolean>` map; `suppressAutoCompactForActive()` flips it.
- Auto-trigger logic is a `useEffect` in the panel: when conditions met and not suppressed, schedule a 5s timeout that calls `compactConversation()`. Cancelled on unmount, banner-skip, or user manually compacting first.

### Section 5 — Status-bar AI popover

The popover primitive is now working (fixed in `ebb3163`). The `AIStatusSegment` content gets restructured to match the mockup:

- **Header:** Sparkles icon + "AI" + small status pill on the right (`idle` / `thinking` / `streaming` color-coded).
- **Rows:** Provider, Model, Mode (the current permission profile rendered as a small chip).
- **Context block:** title row (`CONTEXT WINDOW` + `X / Y` mono numbers), progress bar (color ramps the same as the chat header), `"X tokens remaining"` line right-aligned.
- **Rows:** Messages, Tool calls, Inline completion state.
- **Action buttons:** three equal-width quick actions — Compact, Open chat, Settings. Each is a `Button variant="ghost" size="xs"` with a lucide icon + label.

Click "Open chat" toggles the secondary sidebar to the AI panel. "Compact" calls the same `compactConversation()` the chat header does. "Settings" calls `setActivePanel('settings')` and selects the AI category.

### Section 6 — Bubble + thread polish

Smaller, scoped tweaks:

- Remove the "Assistant" mini-label text above each assistant message — the avatar already identifies role and the label feels redundant.
- User bubble: keep the right-aligned colored bubble.
- Assistant bubble: drop the white "Assistant" caption; tighten the gap between avatar and bubble; reduce vertical margins from `mb-3` to `mb-2.5` so denser threads breathe more naturally in a narrow sidebar.
- Tool calls (`ToolCallCard`) get a clearer left-border accent (warning color) and an inline `run_query · planned/running/ok/failed` status label so reading the transcript tells you what happened without expanding.

## Files touched

**New (renderer):**
- `src/renderer/src/components/ai/PermissionModeRow.tsx` — segmented control for the profile.
- `src/renderer/src/components/ai/StreamingResponse.tsx` — unified loading + streaming card.
- `src/renderer/src/components/ai/AutoCompactBanner.tsx` — banner + countdown + undo lifecycle.
- `src/renderer/src/components/ai/ActionZone.tsx` — sticky container hosting ApprovalCard + PermissionModeRow + ChatInput.

**Modified (renderer):**
- `src/renderer/src/components/ai/ChatPanel.tsx` — three-region layout, mounts ActionZone, mounts AutoCompactBanner.
- `src/renderer/src/components/ai/MessageThread.tsx` — drops `ApprovalCard`, drops the Spinner row and the streaming card, mounts `StreamingResponse` exactly once when awaiting/streaming.
- `src/renderer/src/components/ai/MessageBubble.tsx` — caption removal + spacing tweaks.
- `src/renderer/src/components/ai/ToolCallCard.tsx` — accent + inline status label.
- `src/renderer/src/components/ai/AIStatusSegment.tsx` — popover layout restructure (sections + action buttons).
- `src/renderer/src/stores/ai.ts` — adds `permissionProfile`, `setPermissionProfile`, `loadPermissionProfile`, `isAwaitingResponse`, `lastPreCompactMessages`, `undoLastCompact`, `autoCompactSuppressed`, `suppressAutoCompactForActive`. Touches `sendMessage` (set awaiting) and the stream handler (clear awaiting).

**Modified (plugin / shared):**
- `shared/ipc.ts` — adds `ai:permission:get-profile`, `ai:permission:set-profile`.
- `src/main/plugins/bundled/ai/internal/permission-manager.ts` — adds `profile`, `getProfile`, `setProfile`, profile-aware `needsApproval`, blocked-write throw path.
- `src/main/plugins/bundled/ai/internal/index.ts` — registers the two IPC channels, plumbs the persisted profile through the settings store on activate.

**Removed (renderer):**
- `src/renderer/src/components/ai/ApprovalCard.tsx` — content moves into `ActionZone`. (The named export `ApprovalCardContent` keeps its current shape, just relocated.)

## Testing

- **Vitest unit:**
  - `ai-store-permission-profile.test.ts` — `setPermissionProfile`/`loadPermissionProfile` round-trip through a mocked IPC.
  - `ai-store-auto-compact.test.ts` — at 79% no scheduling, at 80% schedules a 5s tick, fires `compactConversation`, snapshots prior messages, `undoLastCompact()` restores them, suppression flag blocks future autos until 95%.
  - `permission-manager-profile.test.ts` (main) — profile defaults to `ask-write`, write tools blocked in `read-only`, no approval in `auto`.
- **Storybook:**
  - `ActionZone.stories.tsx` — no-pending / pending approval / read-only mode / auto mode.
  - `AutoCompactBanner.stories.tsx` — warning / countdown elapsed / compacting / success-with-undo / suppressed-95%.
  - `StreamingResponse.stories.tsx` — awaiting / streaming-with-text / done-then-nothing.
- **Manual:** open chat, send a write-tool query in each profile; verify approval row stays visible when thread overflows; force conversation to 80% with synthetic stats and watch the banner; click Undo on a fresh compact.

## Open questions

1. **Where does the permission profile live UI-side?** The mockup puts it in the action zone (above composer). Confirmed by V1 selection.
2. **Suppression scope.** Suppression is per-conversation, not global. If the user prefers global, swap `Record<conversationId, boolean>` for a single `autoCompactDisabled: boolean`.
3. **Read-only blocked-write feedback.** This spec surfaces it as an assistant message. Alternative: a transient toast. Assistant message keeps it in the transcript, which seems more useful — but flag if you'd rather a toast.

## Risks and mitigations

- **Snapshot drift.** `lastPreCompactMessages` could become large and stale. Mitigation: capped at one snapshot, discarded on conversation switch.
- **Auto-compact firing mid-stream.** The 80% threshold could be crossed while the assistant is still streaming. Mitigation: scheduling guard checks `!isStreaming && !isAwaitingResponse` at trigger time; otherwise reschedules after stream end.
- **Profile drift between plugin and renderer.** If the renderer's stored profile diverges from the plugin's, write actions could behave unexpectedly. Mitigation: every send round-trip reads the active profile from the plugin first (`ai:permission:get-profile`) and caches; renderer-side picker writes through the plugin and re-reads.
