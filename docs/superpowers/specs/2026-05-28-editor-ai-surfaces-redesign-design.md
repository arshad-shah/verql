# Editor AI Surfaces Redesign

**Date:** 2026-05-28
**Status:** Draft — pending user review
**Scope:** Renderer UI for the three AI-in-editor touchpoints — inline ghost-text, per-statement Run/Explain actions, and the Explain-results card. Visual language: anchored toolbar (IntelliJ DataGrip reference).

## Motivation

The three editor AI surfaces today are functional but visually inconsistent and underbuilt:

- **Inline ghost-text** (`lib/monaco-ai-completion.ts`) has no status indicator, no manual trigger, no Accept/Reject affordance beyond Monaco's invisible default. Users don't know AI is running, and can't ask for a suggestion on demand.
- **Run / Explain CodeLens** (`lib/monaco-codelens.ts` + `lib/statement-contributions/sql.ts`) renders the literal string `▶ Run` — a Unicode glyph used as an icon. This violates the project's "no ASCII glyphs as icons" rule (memory `feedback_ui_no_emoji_primitives`, reaffirmed 2026-05-28). Monaco CodeLens accepts only plain text for titles, so the surface cannot host real lucide icons.
- **Explain-results panel** (`components/ai/ExplainPanel.tsx`) renders the explanation as a single `<p>` with `whitespace-pre-wrap` — no markdown, no code-block highlighting, no Copy/Regenerate/Follow-up actions, no streaming. Inconsistent with the chat bubbles in the AI panel.

Goal: bring all three surfaces under one visual language — anchored toolbars, lucide icons only, primitives-based composition, consistent with the existing AI chat. Add the missing affordances (Accept/Reject toolbar, statement status, markdown + actions + streaming).

## Non-goals

- No new AI providers or model changes.
- No prompt changes for completion or explain.
- No changes to the MCP server or AI tool registry.
- No changes outside `src/renderer/src/` and a one-line return-type extension in `src/main/plugins/bundled/ai/`.
- Glyphs that are real punctuation (`…`, `·`) stay; only icon-impostors are removed.

## Architecture boundary

Verql's split (per `CLAUDE.md`):

- **Renderer** owns UI surfaces, Monaco widgets, and stores.
- **AI plugin** (`src/main/plugins/bundled/ai/`) owns provider/model logic and IPC handlers for completion and explain.
- **Plugin SDK** owns the statement-contribution registry — drivers declare `splitStatements` + `lensActions`; the renderer renders them.

This spec adds renderer-side UI and one optional field (`icon: LucideIcon`) to the `LensAction` type. It does not move logic across the boundary.

## Design

### Section 1 — Inline AI ghost-text

**Keep**: the existing `monaco.languages.registerInlineCompletionsProvider` in `lib/monaco-ai-completion.ts` and the `AI_COMPLETE_SQL` IPC channel.

**Add**: three Monaco overlay widgets owned by a new `useAIInlineSuggest(editor)` hook mounted alongside the editor (in `components/query/QueryEditor.tsx`):

1. **AI status pill** — `IContentWidget` anchored to the bottom-right of the editor viewport. States:
   - *idle* — widget hidden.
   - *thinking* — lucide `Sparkles` (animated `animate-pulse`), model name from `useAIStore`, `Esc` `Kbd` to cancel.
   - *ready* — lucide `Sparkles`, model name, `Tab` `Kbd` to accept.
2. **Accept/Reject toolbar** — `IContentWidget` anchored to the cursor line whenever the inline-completion provider has a pending suggestion. Contents:
   - `Button` variant=`ghost` size=`xs` with lucide `Check` — "Accept" + `Kbd` "Tab".
   - `Button` variant=`ghost` size=`xs` with lucide `X` — "Reject" + `Kbd` "Esc".
   - `Menu` model picker (label = current model name, lucide `ChevronDown`), populated from `useAIStore.providers`.
3. **Manual trigger** — Monaco command bound to `Cmd/Ctrl+\`, dispatches `editor.action.inlineSuggest.trigger`. Registered via the existing editor mount path in `QueryEditor.tsx`.

**State plumbing**:

- The hook subscribes to `editor.onDidChangeModelContent`, `editor.onDidChangeCursorPosition`, and tracks the in-flight IPC promise from the completion provider (lifted from a module-level variable in `monaco-ai-completion.ts` into a per-editor signal — see Open Question 1).
- Widget visibility is driven by the resulting state machine: `idle → thinking → ready → idle`.

### Section 2 — Statement actions (Run / Explain)

**Replace**: `registerCodeLensProvider` (in `lib/monaco-codelens.ts`) with custom Monaco overlay widgets. Reason: CodeLens accepts `title: string` only — incompatible with the lucide-icons-only rule.

**Keep**: the statement-contribution contract — drivers still declare `splitStatements(source): Statement[]` and `lensActions: LensAction[]`. The renderer-side renderer changes; the plugin-facing API does not.

**Statement registry change** — add one optional field:

```ts
// src/renderer/src/lib/statement-registry.ts
interface LensAction {
  id: string
  title: string
  icon?: LucideIcon        // NEW — plugins opt into icons
  when?: (stmt: Statement) => boolean
  handler: (ctx: LensActionContext) => void
}
```

**Contribution change** — `lib/statement-contributions/sql.ts` updates titles + adds icons:

```ts
{ id: 'run',     title: 'Run',     icon: Play,     handler: ... },
{ id: 'explain', title: 'Explain', icon: Sparkles, handler: ... },
```

**New component** — `src/renderer/src/components/query/StatementGutter.tsx`:

- Mounted from `QueryEditor.tsx`, given the Monaco `editor` and the resolved `dbType`.
- On `editor.onDidChangeModelContent` (debounced 100ms), calls `contribution.splitStatements(model.getValue())` and reconciles a Map of `Statement.startLine -> IViewZone + IContentWidget` pair.
- Each statement gets one **view zone** above its first line (reserves vertical space; height ≈ 26px), and one **content widget** anchored into that zone containing a flex row of:
  - For each action: `<Button variant="ghost" size="xs"><Icon size={12}/>{title}</Button>` → invokes `action.handler(ctx)`.
  - One **status chip** sourced from `useStatementStatus(tabId, stmtHash)` — see new store below. Shape: `<StatusChip kind="ok|error|running"/>` with lucide `Check`/`AlertCircle`/`Loader2`, duration text, row-count text.

**New store** — `src/renderer/src/stores/statement-status.ts`:

- Keyed by `tabId + stmtHash` where `stmtHash = sha1(stmt.text.trim().toLowerCase())` (FNV-1a is sufficient; no crypto dependency — implement as a 4-line hash function).
- Records `{ kind: 'ok' | 'error', durationMs: number, rowCount: number | null, ranAt: number }`.
- Populated by `tabActions.runStatement` (in `stores/tab-actions.ts`) after a successful or failed run.
- Editing a statement changes the hash → status falls off → chip disappears. Intentional.

**Delete**: `src/renderer/src/lib/monaco-codelens.ts` once `StatementGutter` ships. Remove its mount call from `QueryEditor.tsx`.

### Section 3 — Explain-results card

**Replace** the body of `ExplainResult` in `components/ai/ExplainPanel.tsx`. Keep `ExplainPanel` (the trigger button), but swap its hand-rolled `<button>` for `Button` variant=`ghost` size=`xs` with the `Sparkles` icon.

**Card composition**:

```
┌─────────────────────────────────────────────┐
│ <Sparkles/> Explanation     gpt-4o · 1.2s   │  ← header
├─────────────────────────────────────────────┤
│ <MarkdownContent>{explanation}</…>          │  ← body, streams
│                                             │
├─────────────────────────────────────────────┤
│ [Copy] [Regenerate] [Ask follow-up]         │  ← action bar
└─────────────────────────────────────────────┘
```

- Header: lucide `Sparkles`, "Explanation" `Text`, then `model` and `durationMs` from the IPC response, right-aligned.
- Body: `MarkdownContent` from `components/ai/MarkdownContent.tsx` (already exists, handles SQL code blocks via `CodeBlock`).
- Streaming: while a stream is in flight, append tokens to `explainStore.streamingText[tabId]`. When done, copy to the persisted explanation. Show a `Square` "Stop" button in the header in place of the duration during streaming.
- Actions (all `Button` variant=`ghost` size=`xs`):
  - **Copy** — lucide `Copy`, writes markdown source to clipboard via `navigator.clipboard.writeText`.
  - **Regenerate** — lucide `RefreshCcw`, re-invokes the explain IPC.
  - **Ask follow-up** — lucide `MessageSquarePlus`, opens the AI chat panel (`useUIStore.setSecondaryPanel('ai')`) and pre-fills the input with the original SQL and the explanation as quoted context. Uses the existing chat panel — preserves history and branching.
- Loading skeleton: three `Skeleton`-style pulsing rows where the markdown body will be, so the card height is stable when content arrives.

**Streaming plumbing**:

- The AI plugin already streams chat responses via an event-style IPC pattern (`AI_CHAT_STREAM_*`). Reuse that pattern for explain: extend `AI_EXPLAIN_RESULTS` to a stream — emit `ai:explain:token`, `ai:explain:done`, `ai:explain:error` against a request id.
- `useExplainStore` gains `streamingText: Record<tabId, string>` and `streamRequestId: Record<tabId, string | null>`.
- The "Stop" button calls a new `AI_EXPLAIN_CANCEL` IPC with the request id; the plugin aborts the provider call.

**IPC return-type extension** — non-breaking:

```ts
// shared/ipc.ts — AI_EXPLAIN_RESULTS final response
{ explanation: string, model: string, durationMs: number }
```

## Files touched

**New**:

- `src/renderer/src/components/query/StatementGutter.tsx`
- `src/renderer/src/stores/statement-status.ts`
- `src/renderer/src/hooks/useAIInlineSuggest.ts` (or co-located inside `QueryEditor.tsx` if small)

**Edited**:

- `src/renderer/src/lib/monaco-ai-completion.ts` — expose pending-state signal.
- `src/renderer/src/lib/statement-registry.ts` — add optional `icon` to `LensAction`.
- `src/renderer/src/lib/statement-contributions/sql.ts` — drop `▶`, add lucide icons via the new field.
- `src/renderer/src/components/query/QueryEditor.tsx` — mount `StatementGutter` and `useAIInlineSuggest`; register `Cmd+\` keybinding; remove the old CodeLens mount.
- `src/renderer/src/components/ai/ExplainPanel.tsx` — new card + streaming.
- `src/renderer/src/stores/explain.ts` — extend with `model`, `durationMs`, `streamingText`, `streamRequestId`.
- `src/renderer/src/stores/tab-actions.ts` — call `statement-status` setters around `runStatement`.
- `shared/ipc.ts` — extend `AI_EXPLAIN_RESULTS` response; add `AI_EXPLAIN_STREAM_*` events and `AI_EXPLAIN_CANCEL`.
- `src/main/plugins/bundled/ai/` — implement streaming explain + cancel; include `model` and `durationMs` in the final response.

**Deleted**:

- `src/renderer/src/lib/monaco-codelens.ts` (after `StatementGutter` ships)

**Docs updated in the same PR**:

- `docs/architecture.md` — note the swap from CodeLens to overlay widgets in the editor section.
- `docs/ai.md` — note the streaming explain channel.
- `CLAUDE.md` — no change.

## Testing

- **Unit (Vitest, `tests/unit/`)**:
  - `statement-status.test.ts` — hash stability, get/set, eviction on hash change.
  - `useAIInlineSuggest.test.ts` (jsdom) — state machine transitions across mocked IPC outcomes.
- **Storybook stories**:
  - `StatementGutter.stories.tsx` — empty editor, single statement, multi-statement, running, error, success-with-row-count.
  - `ExplainCard.stories.tsx` — loading skeleton, streaming, complete, error, with code blocks.
- **Manual checks**:
  - Run the dev app, open a SQL tab against a real connection, exercise all three surfaces.
  - Confirm no `▶`, `●`, `→`-as-icon, or other icon glyphs reach the DOM in the touched files (`grep -nE "[▶▶►●→]" src/renderer/src/{components,lib,stores}` after the change should match nothing in user-facing strings).

## Open questions

1. **Pending-suggestion signal** — Monaco's inline-completion API doesn't expose a "currently showing" event publicly. The cleanest renderer-side path is to track our own "in-flight + last result" inside the provider closure and expose it via a tiny pub-sub. Acceptable, or do we want a different mechanism?
2. **Hash collisions** — FNV-1a on the trimmed statement text. Collisions are theoretical (a 32-bit hash, scoped to one tab) but possible; the worst case is a stale status chip on an unrelated statement. Acceptable, or use 64-bit FNV?

## Risks and mitigations

- **View-zone disposal** — leaked zones on model swap will cause stale UI. Mitigation: track all zones in a `Map<line, zoneId>` and dispose in `useEffect` cleanup and on `onDidChangeModel`.
- **Streaming cancel** — provider may not honor abort signals uniformly across OpenAI/Anthropic/Ollama. Mitigation: best-effort cancel; the renderer always clears its own state regardless of whether the upstream call actually stopped.
- **Build-effort overrun** — three sections in one spec is wider than the recent specs in this folder. Mitigation: the implementation plan (next step) will sequence the work so each section ships independently behind no flag — Section 2 (statement gutter) first since it's the most-visible glyph fix, then Section 1, then Section 3.
