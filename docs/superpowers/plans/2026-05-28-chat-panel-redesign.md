# Chat Panel Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land V1 of the chat-panel redesign: persistent action zone above the composer, three-mode permission profile, immediate streaming card on send, auto-compact banner at 80% context use with undo, and a restructured status-bar popover.

**Architecture:** AI plugin owns provider/permission/summarize logic and persists the permission profile in the existing settings store; renderer owns presentation. New action-zone container sits between the scrollable thread and the composer so approval and mode-change UI never scroll out of view. Streaming card mounts on the send action itself (not on first token) to eliminate the visible feedback gap. Auto-compact is renderer-scheduled and respects suppression per conversation.

**Tech Stack:** React 19 + Zustand + lucide-react + design-system primitives (Button, Text, Flex, Popover); main-process AI plugin in TS; Vitest + Storybook.

**Spec:** `docs/superpowers/specs/2026-05-28-chat-panel-redesign-design.md`.

**Implementation order** (each section is independently shippable, but later sections depend on the renderer scaffolding from earlier ones):

- Permission profiles (Tasks 1–3) — backend + IPC + renderer plumbing.
- Action zone + ApprovalCard relocation (Tasks 4–5).
- Permission mode row (Task 6).
- Immediate streaming card (Tasks 7–8).
- Auto-compact lifecycle (Tasks 9–11).
- Status-bar popover restructure (Task 12).
- Bubble + tool-call polish (Task 13).
- Storybook + final audit (Task 14).

---

## File map

**New (renderer):**
- `src/renderer/src/components/ai/PermissionModeRow.tsx`
- `src/renderer/src/components/ai/ActionZone.tsx`
- `src/renderer/src/components/ai/StreamingResponse.tsx`
- `src/renderer/src/components/ai/AutoCompactBanner.tsx`
- `src/renderer/src/components/ai/PermissionModeRow.stories.tsx`
- `src/renderer/src/components/ai/AutoCompactBanner.stories.tsx`
- `src/renderer/src/components/ai/StreamingResponse.stories.tsx`
- `tests/unit/stores/ai-permission-profile.test.ts`
- `tests/unit/stores/ai-auto-compact.test.ts`

**New (main):**
- `tests/unit/permission-manager-profile.test.ts`

**Modified (renderer):**
- `src/renderer/src/components/ai/ChatPanel.tsx` — three-region layout, mounts ActionZone + AutoCompactBanner.
- `src/renderer/src/components/ai/MessageThread.tsx` — drop the spinner row, drop the streaming card, drop ApprovalCard, mount StreamingResponse once.
- `src/renderer/src/components/ai/ApprovalCard.tsx` — keep `ApprovalCardContent`; remove the default `ApprovalCard` export (it moves into `ActionZone`).
- `src/renderer/src/components/ai/AIStatusSegment.tsx` — popover content restructure.
- `src/renderer/src/components/ai/MessageBubble.tsx` — drop "Assistant" caption + spacing tweak.
- `src/renderer/src/components/ai/ToolCallCard.tsx` — accent border + status label.
- `src/renderer/src/stores/ai.ts` — adds permissionProfile / awaiting / compact undo / suppression state and actions.

**Modified (shared + main):**
- `shared/ipc.ts` — adds `ai:permission:get-profile`, `ai:permission:set-profile`.
- `src/main/plugins/bundled/ai/internal/permission-manager.ts` — profile field + getters/setters + profile-aware `needsApproval`.
- `src/main/plugins/bundled/ai/internal/index.ts` — register the two profile channels; load persisted profile on activate.

---

## Section 1 — Permission profiles

### Task 1: PermissionManager profile + tests

**Files:**
- Modify: `src/main/plugins/bundled/ai/internal/permission-manager.ts`
- Create: `tests/unit/permission-manager-profile.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/permission-manager-profile.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { PermissionManager } from '@/main/plugins/bundled/ai/internal/permission-manager'

const writeTool = { id: 'run_query', name: 'run_query', description: '', permission: 'write' as const, run: async () => undefined }
const readTool = { id: 'describe_table', name: 'describe_table', description: '', permission: 'read' as const, run: async () => undefined }

describe('PermissionManager profile', () => {
  it('defaults to ask-write', () => {
    const pm = new PermissionManager()
    expect(pm.getProfile()).toBe('ask-write')
  })

  it('ask-write requires approval for write tools and not for read tools', () => {
    const pm = new PermissionManager()
    expect(pm.needsApproval(writeTool)).toBe(true)
    expect(pm.needsApproval(readTool)).toBe(false)
  })

  it('auto never requires approval', () => {
    const pm = new PermissionManager()
    pm.setProfile('auto')
    expect(pm.needsApproval(writeTool)).toBe(false)
    expect(pm.needsApproval(readTool)).toBe(false)
  })

  it('read-only refuses write tools via isWriteBlocked', () => {
    const pm = new PermissionManager()
    pm.setProfile('read-only')
    expect(pm.isWriteBlocked(writeTool)).toBe(true)
    expect(pm.isWriteBlocked(readTool)).toBe(false)
    // read-only never needs approval — writes never even reach the prompt path.
    expect(pm.needsApproval(writeTool)).toBe(false)
  })
})
```

The vitest config aliases `@/main/...` → `src/main/...`. If your local config doesn't, change the import to a relative path: `../../src/main/plugins/bundled/ai/internal/permission-manager`.

- [ ] **Step 2: Run the test to confirm it fails**

Run: `pnpm test -- --run tests/unit/permission-manager-profile.test.ts`
Expected: FAIL — `getProfile`/`setProfile`/`isWriteBlocked` not defined.

- [ ] **Step 3: Add the profile to `PermissionManager`**

Replace the file contents at `src/main/plugins/bundled/ai/internal/permission-manager.ts`:

```ts
import { randomUUID } from 'crypto'
import type { Tool } from '../../../sdk/types'

export type PermissionProfile = 'read-only' | 'ask-write' | 'auto'

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
  private profile: PermissionProfile = 'ask-write'

  getProfile(): PermissionProfile {
    return this.profile
  }

  setProfile(p: PermissionProfile): void {
    this.profile = p
  }

  /**
   * True only when the active profile refuses write tools outright (read-only).
   * Callers should short-circuit before opening an approval prompt and return
   * a blocked-write error to the model so it surfaces in the transcript.
   */
  isWriteBlocked(tool: Tool): boolean {
    const effective = this.overrides.get(tool.id) ?? tool.permission
    return this.profile === 'read-only' && effective === 'write'
  }

  needsApproval(tool: Tool): boolean {
    const effective = this.overrides.get(tool.id) ?? tool.permission
    if (this.profile === 'auto') return false
    if (this.profile === 'read-only') return false
    return effective === 'write'
  }

  setOverride(toolId: string, permission: 'read' | 'write'): void {
    this.overrides.set(toolId, permission)
  }

  removeOverride(toolId: string): void {
    this.overrides.delete(toolId)
  }

  createApprovalRequest(toolId: string, params: Record<string, unknown>, display: string): string {
    const requestId = randomUUID()
    this.pending.set(requestId, { requestId, toolId, params, display, resolve: () => {} })
    return requestId
  }

  hasPendingApproval(requestId: string): boolean {
    return this.pending.has(requestId)
  }

  waitForApproval(requestId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const entry = this.pending.get(requestId)
      if (!entry) { resolve(false); return }
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

- [ ] **Step 4: Run the test to confirm it passes**

Run: `pnpm test -- --run tests/unit/permission-manager-profile.test.ts`
Expected: PASS — 4/4.

- [ ] **Step 5: Wire blocked-write into the conversation manager**

Open `src/main/plugins/bundled/ai/internal/conversation-manager.ts` and find the tool-call execution path (search for `permissionManager.needsApproval` or the tool-call loop). Before the existing `needsApproval` branch, add:

```ts
if (permissionManager.isWriteBlocked(tool)) {
  // Surface as a tool result the model can read on the next turn.
  const blockedResult: AIToolCallResult = {
    toolCallId: call.id,
    toolName: tool.name,
    success: false,
    data: null,
    display: 'Blocked: this tool requires write access and the current permission profile is read-only.',
  }
  yield { type: 'tool-result', result: blockedResult }
  continue
}
```

The exact local variable names (`call`, `tool`, etc.) may differ — adapt to what's there. The intent: yield the same `tool-result` shape the existing code yields after a normal tool call, with `success: false` and a clear display string.

- [ ] **Step 6: Typecheck + commit**

Run: `pnpm exec tsc -b --noEmit` → PASS.

```bash
git add src/main/plugins/bundled/ai/internal/permission-manager.ts src/main/plugins/bundled/ai/internal/conversation-manager.ts tests/unit/permission-manager-profile.test.ts
git commit -m "feat(ai): permission profile (read-only / ask-write / auto)"
```

---

### Task 2: Profile IPC channels + persistence

**Files:**
- Modify: `shared/ipc.ts`
- Modify: `src/main/plugins/bundled/ai/internal/index.ts`

- [ ] **Step 1: Add the channels in `shared/ipc.ts`**

Find the AI block (around `ai:explain:abort`) and add:

```ts
  'ai:permission:get-profile': {
    args: []
    return: 'read-only' | 'ask-write' | 'auto'
  }
  'ai:permission:set-profile': {
    args: [profile: 'read-only' | 'ask-write' | 'auto']
    return: void
  }
```

In the `IPC_CHANNELS` constant block, add:

```ts
  AI_PERMISSION_GET_PROFILE: 'ai:permission:get-profile',
  AI_PERMISSION_SET_PROFILE: 'ai:permission:set-profile',
```

- [ ] **Step 2: Load persisted profile on plugin activate**

In `src/main/plugins/bundled/ai/internal/index.ts`, find where `permissionManager` is constructed (early in the activate function). Right after, add:

```ts
  const savedProfile = deps.settingsStore.get('ai.permissionProfile') as
    | 'read-only' | 'ask-write' | 'auto'
    | undefined
  if (savedProfile === 'read-only' || savedProfile === 'ask-write' || savedProfile === 'auto') {
    permissionManager.setProfile(savedProfile)
  }
```

- [ ] **Step 3: Register the two channels**

Still in `src/main/plugins/bundled/ai/internal/index.ts`, alongside the existing AI handlers (`h('ai:explain-results', ...)`, etc.), add:

```ts
  h('ai:permission:get-profile', async () => permissionManager.getProfile())
  h('ai:permission:set-profile', async (profile: 'read-only' | 'ask-write' | 'auto') => {
    permissionManager.setProfile(profile)
    deps.settingsStore.set('ai.permissionProfile', profile)
  })
```

- [ ] **Step 4: Typecheck + commit**

Run: `pnpm exec tsc -b --noEmit` → PASS.

```bash
git add shared/ipc.ts src/main/plugins/bundled/ai/internal/index.ts
git commit -m "feat(ai): IPC channels for permission profile + persistence"
```

---

### Task 3: Renderer ai store — permission profile

**Files:**
- Modify: `src/renderer/src/stores/ai.ts`
- Create: `tests/unit/stores/ai-permission-profile.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/stores/ai-permission-profile.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAIStore } from '@/stores/ai'

describe('useAIStore.permissionProfile', () => {
  const invokeMock = vi.fn()
  beforeEach(() => {
    invokeMock.mockReset()
    ;(window as unknown as { electronAPI: { invoke: typeof invokeMock; on: () => () => void } }).electronAPI = {
      invoke: invokeMock,
      on: () => () => {},
    }
    useAIStore.setState({ permissionProfile: 'ask-write' })
  })

  it('defaults to ask-write', () => {
    expect(useAIStore.getState().permissionProfile).toBe('ask-write')
  })

  it('loadPermissionProfile fetches from the plugin and stores it', async () => {
    invokeMock.mockResolvedValueOnce('auto')
    await useAIStore.getState().loadPermissionProfile()
    expect(invokeMock).toHaveBeenCalledWith('ai:permission:get-profile')
    expect(useAIStore.getState().permissionProfile).toBe('auto')
  })

  it('setPermissionProfile writes through the plugin then updates local state', async () => {
    invokeMock.mockResolvedValueOnce(undefined)
    await useAIStore.getState().setPermissionProfile('read-only')
    expect(invokeMock).toHaveBeenCalledWith('ai:permission:set-profile', 'read-only')
    expect(useAIStore.getState().permissionProfile).toBe('read-only')
  })
})
```

- [ ] **Step 2: Run the test, confirm it fails**

Run: `pnpm test -- --run tests/unit/stores/ai-permission-profile.test.ts`
Expected: FAIL — `permissionProfile` / `loadPermissionProfile` / `setPermissionProfile` not defined.

- [ ] **Step 3: Extend the store**

In `src/renderer/src/stores/ai.ts`, add to the `AIState` interface (next to `composerSeed`):

```ts
  permissionProfile: 'read-only' | 'ask-write' | 'auto'
  loadPermissionProfile: () => Promise<void>
  setPermissionProfile: (p: 'read-only' | 'ask-write' | 'auto') => Promise<void>
```

In the initial `create<AIState>((set, get) => ({ ... }))` body, add the initial value next to `composerSeed: null,`:

```ts
  permissionProfile: 'ask-write',
```

And the two actions alongside the others:

```ts
  loadPermissionProfile: async () => {
    const profile = await window.electronAPI.invoke(IPC_CHANNELS.AI_PERMISSION_GET_PROFILE) as 'read-only' | 'ask-write' | 'auto'
    set({ permissionProfile: profile })
  },
  setPermissionProfile: async (p) => {
    await window.electronAPI.invoke(IPC_CHANNELS.AI_PERMISSION_SET_PROFILE, p)
    set({ permissionProfile: p })
  },
```

- [ ] **Step 4: Run the test, confirm it passes**

Run: `pnpm test -- --run tests/unit/stores/ai-permission-profile.test.ts`
Expected: PASS — 3/3.

- [ ] **Step 5: Wire loadPermissionProfile into the chat panel mount**

In `src/renderer/src/components/ai/ChatPanel.tsx`, extend the existing `useEffect` that loads providers/models:

```tsx
useEffect(() => {
  if (panelOpen) {
    loadConfiguredProviders().then(() => loadModels())
    loadPermissionProfile()
  }
}, [panelOpen, loadConfiguredProviders, loadModels, loadPermissionProfile])
```

Add `const loadPermissionProfile = useAIStore(s => s.loadPermissionProfile)` to the hooks at the top of the component.

- [ ] **Step 6: Typecheck + commit**

```bash
git add src/renderer/src/stores/ai.ts src/renderer/src/components/ai/ChatPanel.tsx tests/unit/stores/ai-permission-profile.test.ts
git commit -m "feat(ai): renderer store permissionProfile + load on panel open"
```

---

## Section 2 — Action zone

### Task 4: Move `ApprovalCard` out of MessageThread

**Files:**
- Modify: `src/renderer/src/components/ai/MessageThread.tsx`
- Modify: `src/renderer/src/components/ai/ApprovalCard.tsx`

- [ ] **Step 1: Strip the ApprovalCard render from MessageThread**

In `src/renderer/src/components/ai/MessageThread.tsx`, remove these two lines:

```tsx
import { ApprovalCard } from './ApprovalCard'
// ...
<ApprovalCard />
```

(Keep `<div ref={bottomRef} />`.)

- [ ] **Step 2: Drop the default `ApprovalCard` export**

In `src/renderer/src/components/ai/ApprovalCard.tsx`, delete the `ApprovalCard` function at the bottom (lines starting with `export function ApprovalCard`). Keep `ApprovalCardContent`.

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc -b --noEmit` — there should be no NEW errors.

(If grep shows another consumer of `ApprovalCard`, point them at `ActionZone` once it exists in Task 5 — for now, the only consumer was `MessageThread`.)

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/ai/MessageThread.tsx src/renderer/src/components/ai/ApprovalCard.tsx
git commit -m "refactor(ai): relocate ApprovalCard out of MessageThread"
```

---

### Task 5: New ActionZone container

**Files:**
- Create: `src/renderer/src/components/ai/ActionZone.tsx`
- Modify: `src/renderer/src/components/ai/ChatPanel.tsx`

- [ ] **Step 1: Implement ActionZone**

Create `src/renderer/src/components/ai/ActionZone.tsx`:

```tsx
import { useAIStore } from '@/stores/ai'
import { ApprovalCardContent } from './ApprovalCard'
import { PermissionModeRow } from './PermissionModeRow'
import { ChatInput } from './ChatInput'

/**
 * Sticky container above the composer that hosts anything requiring user
 * attention: pending approvals, the permission-mode picker, and the input
 * itself. Lives outside the scrollable MessageThread so nothing here can
 * scroll away mid-conversation.
 */
export function ActionZone() {
  const pending = useAIStore((s) => s.pendingApproval)
  const respond = useAIStore((s) => s.respondToApproval)

  return (
    <div className="border-t border-border-default bg-bg-secondary">
      {pending ? <ApprovalCardContent approval={pending} onRespond={respond} /> : null}
      <PermissionModeRow />
      <ChatInput />
    </div>
  )
}
```

`PermissionModeRow` lands in Task 6 — TS will complain until then. That's fine; we commit ActionZone and the row together below.

- [ ] **Step 2: Mount ActionZone in ChatPanel**

Replace the `<ChatInput />` line in `src/renderer/src/components/ai/ChatPanel.tsx` with `<ActionZone />` and update imports:

```tsx
import { ActionZone } from './ActionZone'
// remove: import { ChatInput } from './ChatInput'
// ...
return (
  <div className="flex flex-col h-full bg-bg-primary">
    <ChatPanelHeader />
    <MessageThread />
    <ActionZone />
  </div>
)
```

(Commit happens in Task 6 once PermissionModeRow exists.)

---

### Task 6: PermissionModeRow component

**Files:**
- Create: `src/renderer/src/components/ai/PermissionModeRow.tsx`

- [ ] **Step 1: Implement the row**

Create `src/renderer/src/components/ai/PermissionModeRow.tsx`:

```tsx
import { Eye, Shield, Zap } from 'lucide-react'
import { Flex } from '@/primitives/layout/Flex'
import { Text } from '@/primitives/typography/Text'
import { useAIStore } from '@/stores/ai'

type Profile = 'read-only' | 'ask-write' | 'auto'

const MODES: { id: Profile; label: string; icon: typeof Eye; activeClass: string }[] = [
  { id: 'read-only', label: 'Read-only', icon: Eye,    activeClass: 'bg-bg-tertiary text-success' },
  { id: 'ask-write', label: 'Ask write', icon: Shield, activeClass: 'bg-bg-tertiary text-accent' },
  { id: 'auto',      label: 'Auto',      icon: Zap,    activeClass: 'bg-bg-tertiary text-error' },
]

/**
 * Segmented control bound to useAIStore.permissionProfile. Writes through
 * setPermissionProfile so the plugin persists the choice; the local state
 * updates after the round-trip.
 */
export function PermissionModeRow() {
  const profile = useAIStore((s) => s.permissionProfile)
  const setProfile = useAIStore((s) => s.setPermissionProfile)

  return (
    <Flex align="center" gap="sm" className="px-3 py-1.5 border-b border-border-default/40 text-[10px]">
      <Shield size={11} className="text-text-tertiary" />
      <Text size="xs" color="muted">Mode</Text>
      <div className="ml-auto inline-flex gap-0.5 bg-bg-primary border border-border-default rounded p-0.5">
        {MODES.map((m) => {
          const Icon = m.icon
          const active = profile === m.id
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => { if (!active) void setProfile(m.id) }}
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] transition-colors ${active ? m.activeClass : 'text-text-tertiary hover:text-text-secondary'}`}
              aria-pressed={active}
            >
              <Icon size={10} />
              {m.label}
            </button>
          )
        })}
      </div>
    </Flex>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc -b --noEmit`
Expected: PASS — Task 5's ActionZone now resolves.

- [ ] **Step 3: Smoke-test**

Run: `pnpm dev`. Open the chat panel: the mode row sits above the composer; switching profiles updates the segmented selection and persists across panel close/open (verify by closing and reopening — selection should restore from the plugin).

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/ai/ActionZone.tsx src/renderer/src/components/ai/PermissionModeRow.tsx src/renderer/src/components/ai/ChatPanel.tsx
git commit -m "feat(ai): persistent ActionZone with permission mode picker"
```

---

## Section 3 — Immediate streaming card

### Task 7: Store gains `isAwaitingResponse`

**Files:**
- Modify: `src/renderer/src/stores/ai.ts`

- [ ] **Step 1: Extend state shape**

Add to the `AIState` interface (next to `isStreaming`):

```ts
  isAwaitingResponse: boolean
```

Initial value in the `create<AIState>` body:

```ts
  isAwaitingResponse: false,
```

- [ ] **Step 2: Set/clear at the right boundaries**

In `sendMessage` (around line 180), set the flag the moment the user message is appended — before the IPC call:

```ts
sendMessage: async (message, connectionId, connectionMeta) => {
  const userMsg: AIChatMessage = {
    id: crypto.randomUUID(),
    role: 'user',
    content: message,
    timestamp: Date.now()
  }
  set((s) => ({ messages: [...s.messages, userMsg], isAwaitingResponse: true }))
  // ...rest unchanged
```

In `handleStreamEvent`, clear it whenever the assistant produces output or terminates. In the `'chunk'` case (first text), add `isAwaitingResponse: false` to the set call. In `'done'` and `'error'` cases, also add `isAwaitingResponse: false` to whichever `set({...})` runs there. In `abort()` (around line 380), include `isAwaitingResponse: false` in the set call.

Search for every `set({...})` that resets `isStreaming: false` and add `isAwaitingResponse: false` alongside it. The principle: anywhere the conversation moves out of "waiting for AI" — whether by data arriving, stream ending, or abort — the flag clears.

- [ ] **Step 3: Typecheck + commit**

```bash
git add src/renderer/src/stores/ai.ts
git commit -m "feat(ai): isAwaitingResponse flag — set on send, cleared on first chunk/done/error/abort"
```

---

### Task 8: StreamingResponse component replaces the two slots

**Files:**
- Create: `src/renderer/src/components/ai/StreamingResponse.tsx`
- Modify: `src/renderer/src/components/ai/MessageThread.tsx`

- [ ] **Step 1: Create StreamingResponse**

Create `src/renderer/src/components/ai/StreamingResponse.tsx`:

```tsx
import { Sparkles } from 'lucide-react'
import { useAIStore } from '@/stores/ai'
import { Text } from '@/primitives/typography/Text'
import { Avatar } from '@/primitives/data-display/Avatar'
import { MarkdownContent } from './MarkdownContent'

/**
 * Single slot for "the assistant is producing a response". Mounts as soon as
 * the user sends a message (driven by isAwaitingResponse), then morphs into
 * the streaming markdown card when text starts arriving. Same chrome before
 * and during, so the transition has no visual jump.
 */
export function StreamingResponse() {
  const isAwaiting = useAIStore((s) => s.isAwaitingResponse)
  const streaming = useAIStore((s) => s.streamingContent)

  if (!isAwaiting && !streaming) return null

  const hasText = streaming.length > 0

  return (
    <div className="group flex gap-2 mb-2.5">
      <Avatar
        name="Assistant"
        size="sm"
        icon={<Sparkles className="h-3.5 w-3.5" />}
        className="shrink-0 mt-0.5"
      />
      <div className="min-w-0 max-w-[88%] flex-1">
        <div className="rounded-xl rounded-tl-sm border border-border-default bg-bg-secondary px-3 py-2">
          {hasText ? (
            <>
              <MarkdownContent content={streaming} />
              <span className="inline-block w-0.5 h-4 bg-accent animate-[cursor-pulse_1s_ease-in-out_infinite] ml-0.5 align-text-bottom rounded-full" />
            </>
          ) : (
            <SkeletonLines />
          )}
        </div>
      </div>
    </div>
  )
}

function SkeletonLines() {
  return (
    <div className="space-y-1.5 py-1">
      <div className="h-2.5 rounded bg-bg-tertiary animate-pulse w-[90%]" />
      <div className="h-2.5 rounded bg-bg-tertiary animate-pulse w-[75%]" />
      <div className="h-2.5 rounded bg-bg-tertiary animate-pulse w-[60%]" />
      <Text size="xs" color="muted" className="pt-1 block">Working…</Text>
    </div>
  )
}
```

- [ ] **Step 2: Replace the two slots in MessageThread**

Open `src/renderer/src/components/ai/MessageThread.tsx`. Remove these two blocks:

```tsx
{isStreaming && !streamingContent && (
  <div className="flex justify-start mb-3">
    <div className="flex items-center gap-2 px-3 py-2">
      <Spinner size="xs" label="Thinking" />
      <Text size="xs" color="muted">Thinking...</Text>
    </div>
  </div>
)}
{streamingContent && (
  <div className="flex justify-start mb-3">
    <Card padding="none" className="max-w-[85%] px-3 py-2">
      <MarkdownContent content={streamingContent} />
      <span className="inline-block w-0.5 h-4 bg-accent animate-[cursor-pulse_1s_ease-in-out_infinite] ml-0.5 align-text-bottom rounded-full" />
    </Card>
  </div>
)}
```

Replace with a single `<StreamingResponse />` placed in the same position (before `<div ref={bottomRef} />`).

Add the import: `import { StreamingResponse } from './StreamingResponse'`. Remove unused imports (`Spinner`, `Card`, `MarkdownContent`, `Text` — keep `Text` only if other code still uses it; `MarkdownContent` is only used in the empty-state path now). Verify with TS.

The `isStreaming` and `streamingContent` selectors are no longer referenced by this file (they now live in `StreamingResponse`); remove the unused hooks.

- [ ] **Step 3: Smoke-test**

`pnpm dev`. Send a message: the skeleton card appears instantly under the user bubble. When tokens arrive, the same card morphs to markdown — no second slot, no jump.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/ai/StreamingResponse.tsx src/renderer/src/components/ai/MessageThread.tsx
git commit -m "feat(ai): unified StreamingResponse — instant skeleton, morphs to markdown"
```

---

## Section 4 — Auto-compact

### Task 9: Store gains undo + suppression

**Files:**
- Modify: `src/renderer/src/stores/ai.ts`
- Create: `tests/unit/stores/ai-auto-compact.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/stores/ai-auto-compact.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAIStore } from '@/stores/ai'
import type { AIChatMessage } from '@shared/ai-types'

const msg = (role: 'user' | 'assistant', content: string): AIChatMessage => ({
  id: crypto.randomUUID(), role, content, timestamp: Date.now(),
})

describe('useAIStore auto-compact lifecycle', () => {
  const invokeMock = vi.fn()
  beforeEach(() => {
    invokeMock.mockReset()
    ;(window as unknown as { electronAPI: { invoke: typeof invokeMock; on: () => () => void } }).electronAPI = {
      invoke: invokeMock,
      on: () => () => {},
    }
    useAIStore.setState({
      conversations: [{
        id: 'c1', title: 'T', messages: [], stats: { totalInputTokens: 0, totalOutputTokens: 0, toolCallCount: 0 },
        createdAt: 0, updatedAt: 0,
      }],
      activeConversationId: 'c1',
      messages: [],
      isStreaming: false,
      isAwaitingResponse: false,
      isCompacting: false,
      lastPreCompactMessages: null,
      autoCompactSuppressed: {},
    })
  })

  it('compactConversation snapshots prior messages then replaces them', async () => {
    const m = [msg('user','u1'), msg('assistant','a1'), msg('user','u2'), msg('assistant','a2'), msg('user','u3'), msg('assistant','a3')]
    useAIStore.setState({ messages: m })
    invokeMock.mockResolvedValueOnce({ summary: 'condensed' }).mockResolvedValueOnce(undefined)
    await useAIStore.getState().compactConversation()
    const after = useAIStore.getState()
    expect(after.lastPreCompactMessages).toEqual(m)
    expect(after.messages.length).toBe(3) // summary + 2 kept
    expect(after.messages[0].role).toBe('system')
    expect(after.messages[0].content).toContain('condensed')
  })

  it('undoLastCompact restores the pre-compact list', async () => {
    const before = [msg('user','u1'), msg('assistant','a1'), msg('user','u2')]
    useAIStore.setState({
      messages: [msg('system','summary'), msg('user','u3')],
      lastPreCompactMessages: before,
    })
    invokeMock.mockResolvedValueOnce(undefined)
    await useAIStore.getState().undoLastCompact()
    const after = useAIStore.getState()
    expect(after.messages).toEqual(before)
    expect(after.lastPreCompactMessages).toBeNull()
  })

  it('suppressAutoCompactForActive sets the flag for the active conversation', () => {
    useAIStore.getState().suppressAutoCompactForActive()
    expect(useAIStore.getState().autoCompactSuppressed['c1']).toBe(true)
  })
})
```

- [ ] **Step 2: Run, confirm failure**

Run: `pnpm test -- --run tests/unit/stores/ai-auto-compact.test.ts`
Expected: FAIL — undefined actions/fields.

- [ ] **Step 3: Add the fields and actions**

In `src/renderer/src/stores/ai.ts`, extend the `AIState` interface (near `compactConversation`):

```ts
  lastPreCompactMessages: AIChatMessage[] | null
  autoCompactSuppressed: Record<string, boolean>
  undoLastCompact: () => Promise<void>
  suppressAutoCompactForActive: () => void
```

Initial values in `create<AIState>`:

```ts
  lastPreCompactMessages: null,
  autoCompactSuppressed: {},
```

Modify the existing `compactConversation` (current body lives around line 285). Insert the snapshot right before `set({ isCompacting: true })`:

```ts
    const snapshot = messages
```

Then in the success path (inside the `try` block, after the new message list is built and before `set({...new messages})`), add `lastPreCompactMessages: snapshot` to the set payload. Example:

```ts
      set({
        messages: newMessages,
        conversations: nextConversations,
        sessionStats: { ...EMPTY_STATS },
        streamingContent: '',
        lastPreCompactMessages: snapshot,
      })
```

Add the two new actions alongside `compactConversation`:

```ts
  undoLastCompact: async () => {
    const { lastPreCompactMessages, conversations, activeConversationId } = get()
    if (!lastPreCompactMessages) return
    const nextConversations = conversations.map((c) =>
      c.id === activeConversationId ? { ...c, messages: lastPreCompactMessages, updatedAt: Date.now() } : c
    )
    set({
      messages: lastPreCompactMessages,
      conversations: nextConversations,
      lastPreCompactMessages: null,
    })
    await window.electronAPI.invoke(IPC_CHANNELS.AI_MESSAGES_SET, lastPreCompactMessages)
    persistConversations(nextConversations, activeConversationId)
  },

  suppressAutoCompactForActive: () => {
    const id = get().activeConversationId
    if (!id) return
    set((s) => ({ autoCompactSuppressed: { ...s.autoCompactSuppressed, [id]: true } }))
  },
```

Also: in `switchConversation`, clear the snapshot so undo is scoped per-conversation. Find the existing `set({...})` inside `switchConversation` and add `lastPreCompactMessages: null`.

- [ ] **Step 4: Run the tests, confirm they pass**

Run: `pnpm test -- --run tests/unit/stores/ai-auto-compact.test.ts`
Expected: PASS — 3/3.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/stores/ai.ts tests/unit/stores/ai-auto-compact.test.ts
git commit -m "feat(ai): compact undo + per-conversation suppression"
```

---

### Task 10: AutoCompactBanner component

**Files:**
- Create: `src/renderer/src/components/ai/AutoCompactBanner.tsx`

- [ ] **Step 1: Implement**

Create `src/renderer/src/components/ai/AutoCompactBanner.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Loader2, RotateCcw, X, Check } from 'lucide-react'
import { useAIStore } from '@/stores/ai'

const AUTO_TRIGGER_THRESHOLD = 0.80
const FORCED_WARNING_THRESHOLD = 0.95
const DELAY_MS = 5_000

type Phase =
  | { kind: 'idle' }
  | { kind: 'pending' }            // 80% reached, countdown active
  | { kind: 'compacting' }
  | { kind: 'success' }
  | { kind: 'forced' }             // ≥95%, suppression overridden, no auto-run

export function AutoCompactBanner() {
  const messages = useAIStore((s) => s.messages)
  const stats = useAIStore((s) => s.sessionStats)
  const isStreaming = useAIStore((s) => s.isStreaming)
  const isAwaiting = useAIStore((s) => s.isAwaitingResponse)
  const isCompacting = useAIStore((s) => s.isCompacting)
  const activeModel = useAIStore((s) => s.activeModel)
  const models = useAIStore((s) => s.models)
  const activeId = useAIStore((s) => s.activeConversationId)
  const suppressed = useAIStore((s) => (activeId ? s.autoCompactSuppressed[activeId] : false))
  const lastSnapshot = useAIStore((s) => s.lastPreCompactMessages)

  const compact = useAIStore((s) => s.compactConversation)
  const undo = useAIStore((s) => s.undoLastCompact)
  const suppress = useAIStore((s) => s.suppressAutoCompactForActive)

  const ctxWindow = models.find((m) => m.id === activeModel)?.contextWindow ?? null
  const used = stats.totalInputTokens + stats.totalOutputTokens
  const pct = ctxWindow && ctxWindow > 0 ? used / ctxWindow : 0

  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const timer = useRef<number | undefined>(undefined)
  const successTimer = useRef<number | undefined>(undefined)
  const justCompactedRef = useRef(false)

  // Drive the state machine.
  useEffect(() => {
    if (isCompacting) {
      window.clearTimeout(timer.current)
      setPhase({ kind: 'compacting' })
      return
    }
    if (justCompactedRef.current && !isCompacting) {
      justCompactedRef.current = false
      setPhase({ kind: 'success' })
      window.clearTimeout(successTimer.current)
      successTimer.current = window.setTimeout(() => setPhase({ kind: 'idle' }), 8_000)
      return
    }
    if (pct >= FORCED_WARNING_THRESHOLD) {
      window.clearTimeout(timer.current)
      setPhase({ kind: 'forced' })
      return
    }
    if (pct >= AUTO_TRIGGER_THRESHOLD && !suppressed && messages.length >= 6 && !isStreaming && !isAwaiting) {
      if (phase.kind !== 'pending') {
        window.clearTimeout(timer.current)
        setPhase({ kind: 'pending' })
        timer.current = window.setTimeout(() => {
          justCompactedRef.current = true
          void compact()
        }, DELAY_MS)
      }
      return
    }
    if (phase.kind === 'pending' || phase.kind === 'forced') {
      window.clearTimeout(timer.current)
      setPhase({ kind: 'idle' })
    }
  }, [pct, suppressed, messages.length, isStreaming, isAwaiting, isCompacting, compact, phase.kind])

  useEffect(() => () => {
    window.clearTimeout(timer.current)
    window.clearTimeout(successTimer.current)
  }, [])

  if (phase.kind === 'idle') return null

  if (phase.kind === 'pending') {
    return (
      <Wrapper tone="warn">
        <AlertTriangle size={12} className="shrink-0" />
        <span className="flex-1 text-[11px]"><strong>{Math.round(pct * 100)}% used.</strong> Auto-compact in 5s — keeps the recent exchange, summarises the rest.</span>
        <button className="rounded bg-warning text-[10px] font-medium px-2 py-0.5 text-bg-primary"
          onClick={() => { window.clearTimeout(timer.current); justCompactedRef.current = true; void compact() }}>
          Now
        </button>
        <button className="rounded border border-warning/50 text-warning text-[10px] px-2 py-0.5"
          onClick={() => { window.clearTimeout(timer.current); suppress(); setPhase({ kind: 'idle' }) }}>
          Skip
        </button>
      </Wrapper>
    )
  }

  if (phase.kind === 'compacting') {
    return (
      <Wrapper tone="info">
        <Loader2 size={12} className="shrink-0 animate-spin" />
        <span className="flex-1 text-[11px]">Compacting older messages… keeping the last exchange.</span>
      </Wrapper>
    )
  }

  if (phase.kind === 'success') {
    return (
      <Wrapper tone="ok">
        <Check size={12} className="shrink-0" />
        <span className="flex-1 text-[11px]">Compacted earlier turns into a summary.</span>
        {lastSnapshot ? (
          <button className="rounded border border-success/50 text-success text-[10px] px-2 py-0.5 inline-flex items-center gap-1"
            onClick={() => { void undo(); setPhase({ kind: 'idle' }) }}>
            <RotateCcw size={10} /> Undo
          </button>
        ) : null}
        <button className="text-success/70 hover:text-success" aria-label="Dismiss"
          onClick={() => setPhase({ kind: 'idle' })}>
          <X size={12} />
        </button>
      </Wrapper>
    )
  }

  // forced
  return (
    <Wrapper tone="error">
      <AlertTriangle size={12} className="shrink-0" />
      <span className="flex-1 text-[11px]"><strong>{Math.round(pct * 100)}% used.</strong> Context is nearly full — compact now to keep sending.</span>
      <button className="rounded bg-error text-[10px] font-medium px-2 py-0.5 text-bg-primary"
        onClick={() => { justCompactedRef.current = true; void compact() }}>
        Compact now
      </button>
    </Wrapper>
  )
}

function Wrapper({ tone, children }: { tone: 'warn' | 'info' | 'ok' | 'error'; children: React.ReactNode }) {
  const bg = tone === 'warn' ? 'bg-warning/10 border-warning/30 text-warning'
    : tone === 'info' ? 'bg-accent/10 border-accent/30 text-accent'
    : tone === 'ok' ? 'bg-success/10 border-success/30 text-success'
    : 'bg-error/10 border-error/30 text-error'
  return (
    <div className={`flex items-center gap-2 px-3 py-2 border-b ${bg}`}>
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Mount in ChatPanel**

In `src/renderer/src/components/ai/ChatPanel.tsx`:

```tsx
import { AutoCompactBanner } from './AutoCompactBanner'
// ...
return (
  <div className="flex flex-col h-full bg-bg-primary">
    <ChatPanelHeader />
    <AutoCompactBanner />
    <MessageThread />
    <ActionZone />
  </div>
)
```

- [ ] **Step 3: Typecheck + smoke**

Run: `pnpm exec tsc -b --noEmit` → PASS.

To smoke without 100k+ token conversations: temporarily set `AUTO_TRIGGER_THRESHOLD = 0.05` and the smallest model with a tiny contextWindow, then send 2-3 messages and watch the banner cycle through pending → compacting → success → idle. Revert the threshold before commit.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/ai/AutoCompactBanner.tsx src/renderer/src/components/ai/ChatPanel.tsx
git commit -m "feat(ai): AutoCompactBanner with countdown, compacting, success+undo, forced states"
```

---

### Task 11: Manual compact triggered from header still wipes old snapshot

**Files:**
- Modify: `src/renderer/src/stores/ai.ts`

Already addressed inside Task 9 (the manual `compactConversation` writes `lastPreCompactMessages: snapshot` on every run, so manual + auto share the same undo plumbing). Nothing extra needed — verify by triggering the header's Compact button: a "Compacted earlier turns" success banner should appear and Undo should restore.

- [ ] **Step 1: Verify manually**

Run: `pnpm dev`. Open a conversation with ≥6 messages. Click Compact in the header. The success banner with Undo appears. Click Undo. Messages restore.

- [ ] **Step 2: No-op commit boundary**

No code change in this task — confirms cross-section behavior. Skip the commit step. Move on.

---

## Section 5 — Status-bar popover

### Task 12: Restructure AIStatusSegment popover

**Files:**
- Modify: `src/renderer/src/components/ai/AIStatusSegment.tsx`

- [ ] **Step 1: Replace the popover content**

Open `src/renderer/src/components/ai/AIStatusSegment.tsx`. Keep the existing `trigger` (icon-only). Replace the `content` JSX with this richer layout:

```tsx
import { Settings, Maximize2, Minimize2, Eye, Shield, Zap } from 'lucide-react'
import { useUiStore } from '@/stores/ui'

// ...inside AIStatusSegment, after existing hook calls:
const profile = useAIStore((s) => s.permissionProfile)
const setSecondaryActivePanel = useUiStore((s) => s.setSecondaryActivePanel)
const setActivePanel = useUiStore((s) => s.setActivePanel)
const compact = useAIStore((s) => s.compactConversation)

const modeLabel = profile === 'read-only' ? 'Read-only' : profile === 'auto' ? 'Auto' : 'Ask write'
const ModeIcon = profile === 'read-only' ? Eye : profile === 'auto' ? Zap : Shield
const statusLabel = isStreaming ? 'streaming' : inlineState === 'thinking' ? 'thinking' : 'idle'
const statusTone = isStreaming ? 'bg-accent/15 text-accent' : inlineState === 'thinking' ? 'bg-accent/15 text-accent' : 'bg-success/15 text-success'

const popoverContent = (
  <div className="min-w-[260px] p-1 space-y-2">
    <div className="flex items-center gap-2 px-1">
      <Sparkles size={12} className="text-accent" />
      <Text size="xs" weight="medium">AI</Text>
      <span className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${statusTone}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {statusLabel}
      </span>
    </div>

    <Row label="Provider" value={activeProvider?.name ?? 'None'} />
    <Row label="Model"    value={activeModelId ?? 'None'} />
    <Row label="Mode" valueNode={
      <span className="inline-flex items-center gap-1 text-text-primary">
        <ModeIcon size={10} /> {modeLabel}
      </span>
    } />

    {contextWindow != null ? (
      <div className="rounded bg-bg-secondary p-2 space-y-1">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-accent">
          <span>Context window</span>
          <span className="font-mono text-text-primary text-[10.5px] normal-case tracking-normal">
            {formatTokens(totalTokens)} / {formatTokens(contextWindow)}
          </span>
        </div>
        <div className="h-1 rounded bg-bg-tertiary overflow-hidden">
          <div className={pct >= 90 ? 'h-full bg-error' : pct >= 70 ? 'h-full bg-warning' : 'h-full bg-accent'} style={{ width: `${pct}%` }} />
        </div>
        <Text size="xs" weight="medium" className={`block text-right ${pct >= 90 ? 'text-error' : pct >= 70 ? 'text-warning' : 'text-success'}`}>
          {formatTokens(Math.max(0, contextWindow - totalTokens))} tokens remaining
        </Text>
      </div>
    ) : null}

    <Row label="Messages"          value={`${stats.totalInputTokens > 0 ? 'see chat' : '0 sent'}`} />
    <Row label="Tool calls"        value={String(stats.toolCallCount)} />
    <Row label="Inline completion" value={inlineState} />

    <div className="flex gap-1 pt-1 border-t border-border-default">
      <ActionBtn icon={Minimize2} label="Compact" onClick={() => { void compact() }} />
      <ActionBtn icon={Maximize2} label="Open chat" onClick={() => setSecondaryActivePanel('plugin:ai-chat')} />
      <ActionBtn icon={Settings}  label="Settings" onClick={() => setActivePanel('settings')} />
    </div>
  </div>
)

return <Popover trigger={trigger} content={popoverContent} placement="top" />
```

Add the helpers below the main component:

```tsx
function Row({ label, value, valueNode }: { label: string; value?: string; valueNode?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-1 py-0.5 text-[10.5px]">
      <Text size="xs" color="muted">{label}</Text>
      {valueNode ? valueNode : <Text size="xs" className="truncate max-w-[160px]">{value}</Text>}
    </div>
  )
}

function ActionBtn({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ size?: number }>; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 inline-flex items-center justify-center gap-1 rounded border border-border-default bg-bg-primary px-1.5 py-1 text-[10px] text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
    >
      <Icon size={10} /> {label}
    </button>
  )
}
```

Drop the existing `popoverContent`-equivalent inline content from the file.

- [ ] **Step 2: Typecheck + smoke**

Run: `pnpm exec tsc -b --noEmit` → PASS.

`pnpm dev`. Click the status-bar AI icon. The popover now opens (fixed in `ebb3163`) and shows the structured layout. Compact / Open chat / Settings all work.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/ai/AIStatusSegment.tsx
git commit -m "feat(ai): restructured status-bar popover with mode chip + actions"
```

---

## Section 6 — Bubble + tool-call polish

### Task 13: Tighten bubble + tool-call card

**Files:**
- Modify: `src/renderer/src/components/ai/MessageBubble.tsx`
- Modify: `src/renderer/src/components/ai/ToolCallCard.tsx`

- [ ] **Step 1: MessageBubble — drop the Assistant caption, tighten spacing**

In `src/renderer/src/components/ai/MessageBubble.tsx`:

- Replace `mb-3` with `mb-2.5` on the two outer divs (the user and assistant branches).
- Inside the assistant branch, remove the `<Text size="xs" color="muted" className="block text-[10px] mb-0.5">Assistant</Text>` line.

- [ ] **Step 2: ToolCallCard — accent + status label**

Open `src/renderer/src/components/ai/ToolCallCard.tsx`. The component already takes `message` + `result`. Find the outer container and add a left-border accent + a status row at the top:

```tsx
const status = !result ? 'planned' : result.success ? 'ok' : 'failed'
const statusTone = status === 'ok' ? 'text-success' : status === 'failed' ? 'text-error' : 'text-warning'
const toolName = message.toolCalls?.[0]?.name ?? 'tool'
```

Inject a header row above the existing content:

```tsx
<div className="flex items-center gap-1 text-[10px] text-warning mb-1">
  <Wrench size={10} />
  <span className="font-medium">{toolName}</span>
  <span className={`ml-auto ${statusTone}`}>· {status}</span>
</div>
```

Replace the outer container className with the bordered/accented version:

```tsx
className="mb-2.5 rounded-md border border-border-default border-l-2 border-l-warning bg-bg-secondary px-3 py-2"
```

Add `import { Wrench } from 'lucide-react'` if not already there.

- [ ] **Step 3: Typecheck + commit**

```bash
git add src/renderer/src/components/ai/MessageBubble.tsx src/renderer/src/components/ai/ToolCallCard.tsx
git commit -m "polish(ai): tighten message spacing; tool-call accent + inline status"
```

---

## Polish

### Task 14: Storybook + final audit

**Files:**
- Create: `src/renderer/src/components/ai/PermissionModeRow.stories.tsx`
- Create: `src/renderer/src/components/ai/AutoCompactBanner.stories.tsx`
- Create: `src/renderer/src/components/ai/StreamingResponse.stories.tsx`

- [ ] **Step 1: Stories**

Each story file mirrors the pattern from `ExplainCard.stories.tsx`: a `StoreSeeder` component that runs `useAIStore.setState` in a useEffect before rendering the component.

`PermissionModeRow.stories.tsx`: three stories — `ReadOnly`, `AskWrite`, `Auto`. Each pre-seeds `permissionProfile`.

`AutoCompactBanner.stories.tsx`: five stories — `Idle` (no banner; seeded at 30% usage), `Pending` (seeded at 82%, ≥6 messages, not streaming, not suppressed), `Compacting` (`isCompacting: true`), `Success` (`isCompacting: false` after `lastPreCompactMessages` is set; useEffect inside `StoreSeeder` triggers the phase change), `Forced` (seeded at 96%).

`StreamingResponse.stories.tsx`: three stories — `Awaiting` (`isAwaitingResponse: true`, no `streamingContent`), `Streaming` (`streamingContent: 'Partial markdown response...'`), `Hidden` (neither flag set — component returns null).

For each, mock electronAPI like `ExplainCard.stories.tsx` does:

```tsx
window.electronAPI = { invoke: async () => null, on: () => () => {} }
```

- [ ] **Step 2: Run all tests**

Run: `pnpm test`
Expected: PASS — 1436 baseline + new tests + new stories.

- [ ] **Step 3: Final audit**

Run: `pnpm exec tsc -b --noEmit` → PASS.
Run: `pnpm build` → PASS.

Manual smoke pass:
- Open AI panel. Send a message — skeleton appears under user bubble within ~50ms.
- Wait for response — skeleton morphs to markdown card.
- Switch permission profile through the three modes. Reopen panel — selection persists.
- Trigger a write-tool call in `read-only` — a `success: false` tool result appears with a blocked-write message.
- Trigger a write-tool call in `ask-write` — approval row appears above the composer; click Run.
- Synthetic-test auto-compact by temporarily reducing the threshold (see Task 10 smoke note).
- Click status-bar AI icon — popover opens with the new layout; Compact / Open chat / Settings work.

- [ ] **Step 4: Commit + PR-ready**

```bash
git add src/renderer/src/components/ai/*.stories.tsx
git commit -m "test(storybook): permission mode + auto-compact + streaming stories"
```

---

## Self-review (controller-side, after writing)

- **Permission profiles (spec §2):** PermissionManager change Task 1, IPC Task 2, renderer plumbing Task 3, UI Task 6.
- **Persistent approval (spec §1):** Tasks 4–6 (relocation + ActionZone + mode row).
- **Loading unification (spec §3):** Tasks 7–8.
- **Auto-compact at 80% (spec §4):** Tasks 9–11 (store + banner + manual-path verification).
- **Status-bar popover (spec §5):** Task 12.
- **Bubble + tool-call polish (spec §6):** Task 13.
- **Storybook + audit:** Task 14.

**Open questions from spec:**
- `Q1: Profile UI location` — answered by V1 (mode row above composer). Implemented in Task 6.
- `Q2: Suppression scope` — per-conversation. Implemented in Task 9 (`autoCompactSuppressed: Record<conversationId, boolean>`).
- `Q3: Read-only blocked-write feedback` — surfaced as a `tool-result` with `success: false`. Implemented in Task 1 step 5.
