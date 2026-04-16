# AI Chat Panel Polish — Design Spec

## Overview

Polish the AI chat panel with: streaming indicator, smart provider auto-selection, dynamic model fetching from APIs, primitives-based UI, inline model picker, DB type context in messages, and Storybook stories for all new/modified components.

## 1. Chat Input Overhaul

Unified input container (ChatGPT/Claude.ai style):

- **Outer wrapper**: `Card` primitive styled as the input container with border
- **Textarea**: `Textarea` primitive — no visible border, transparent background, sits inside the card
- **Send button**: `IconButton` primitive — `ArrowUp` icon when text is present (`variant="solid"`), `Square` (stop) icon when streaming. Hidden or ghost-styled when textarea is empty.
- **Model picker**: `Text` primitive (`size="xs"`, `color="accent"`) + `ChevronDown` icon, positioned bottom-left of the container. Clickable — opens a grouped dropdown.
- **Model dropdown**: Uses `Popover` surface primitive. Models grouped under provider name headers (`Text` `size="xs"`, `color="muted"`). Only shows providers with keys configured.
- **Schema autocomplete**: `@`-triggered autocomplete continues working inside the textarea as-is.

Layout: textarea fills the top area. Bottom bar has model picker flush-left, send icon button flush-right.

## 2. Streaming Response Indicator

Enhance the existing pulse cursor — no separate indicator component:

- **Pre-stream phase** (after send, before first chunk arrives): `Spinner` primitive (`size="xs"`) + `Text` "Thinking..." shown inline in the message thread where the assistant message will appear.
- **Streaming phase** (once first chunk arrives): Spinner disappears. A polished inline cursor appears at the end of the streaming text — 2px wide, accent-colored bar, pulsing opacity (0.3 → 1.0) on a smooth 1s CSS animation cycle.
- Cursor is an inline `span` — flows with the text, not a block-level element.

## 3. Provider Auto-Selection & Dynamic Models

### Auto-selection

- On startup, determine which providers have keys configured (non-empty `openaiKey`, `anthropicKey`, or reachable Ollama endpoint).
- If only one provider is configured → auto-select it, no user action needed.
- If multiple → use saved `activeProvider` setting, fall back to first configured.
- Unconfigured providers are hidden from the model picker dropdown entirely.

### Dynamic model fetching

All three providers fetch models from their APIs — no hardcoded model lists:

- **Anthropic**: `GET https://api.anthropic.com/v1/models` with `x-api-key` and `anthropic-version: 2023-06-01` headers. Paginate using `has_more` / `last_id`. Map `id` → model ID, `display_name` → display name.
- **OpenAI**: `GET https://api.openai.com/v1/models` with `Authorization: Bearer {key}`. Filter to chat-capable models by ID prefix — keep models matching `gpt-4o`, `gpt-4.1`, `o1`, `o3` prefixes; exclude embeddings, TTS, DALL-E, whisper, etc.
- **Ollama**: Already dynamic via `GET {endpoint}/api/tags`. No change needed.

Cache model lists per session. Refetch when a provider key changes. If the API call fails (bad key, network error), return an empty list and surface an error message in the dropdown.

## 4. DB Type in Context

Database type must flow dynamically from the plugin/driver system — never hardcoded.

### System prompt enrichment

When assembling the system message in `conversation-manager.ts`, include the active connection's database type: "The user is connected to a **{driverName}** database. Generate queries and commands appropriate for this database system."

### Per-message metadata

- `AIChatStartRequest` gets a new field: `connectionMeta?: { type: string; driverName: string }`
- The renderer reads `activeConnection.type` and `activeConnection.driverName` from the connections store and sends it with each message.
- On the main process side, if `connectionMeta` is provided, it overrides the system prompt's DB context — so mid-conversation connection switches are reflected immediately.
- The conversation manager rebuilds the system message on each `chat()` call using the latest metadata.
- No hardcoded list of DB types. New plugins (CockroachDB, DynamoDB, etc.) work automatically because the driver name flows from the plugin manifest.

## 5. Primitives Usage

All chat panel components refactored to use the primitives design system:

### MessageBubble
- `Card` primitive for bubble container
- `Text` primitive for content and metadata
- Error state: `Text` with `color="error"`
- Markdown content stays as `MarkdownContent` component

### MessageThread
- `ScrollArea` primitive for scrollable container
- `Spinner` primitive for pre-stream "Thinking..." state
- `Text` primitive for empty state message
- Streaming cursor: custom inline `span` with CSS animation

### ChatPanel header
- `Text` primitive for "AI Assistant" title
- `IconButton` primitive (`variant="ghost"`) for clear/trash button
- Provider/model dropdowns removed from header (moved to input area)

### Approval Card
- `Card` primitive for container
- `Text` for tool name, description, parameter display
- `Button` primitive (`variant="solid"`) for Approve
- `Button` primitive (`variant="danger"`) for Deny
- `Badge` primitive for permission level indicator

### Model Picker Dropdown
- `Popover` surface primitive
- `Text` (`size="xs"`, `color="muted"`) for provider group headers
- `Text` for model names

## 6. Stories

All stories follow the existing project pattern: colocated `.stories.tsx`, `Meta` with `tags: ['autodocs']`, variant matrices, `play` functions for interaction testing.

### MessageBubble stories
- User message (default)
- Assistant message (markdown rendered)
- Assistant error message (red state)
- Long content (overflow behavior)
- Markdown content (code blocks, lists, etc.)

### Approval Card stories
- Default pending state
- Different tool names/descriptions
- Approved state
- Denied state

### ChatInput stories (unified container)
- Empty state (ghost send button)
- With text (solid send button)
- Streaming state (stop button)
- Model picker interaction
- Disabled state

### Streaming indicator stories
- Thinking spinner (pre-stream)
- Pulse cursor with text (mid-stream)
- Can be standalone or part of MessageThread stories

Each story uses `play` hooks to test interactions (clicking send, typing, approve/deny actions).
