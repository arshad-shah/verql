---
"verql": minor
---

AI: enable Anthropic prompt caching and externalise every prompt to its own
markdown file.

Caching: the system prompt and tool catalog now carry `cache_control:
{ type: 'ephemeral' }` breakpoints when targeting Anthropic models. Anthropic
keeps a 5-minute prefix cache keyed on these blocks, so cached input tokens
cost ~10% of the normal rate and skip re-processing on the server — the
single biggest TTFT win on multi-turn chats with a stable schema.

Externalised prompts: the five AI prompts (chat system, explain, generate
query, inline SQL completion, summarize) and the chat-system context
fragments now live as `.md` files in
`src/main/plugins/bundled/ai/prompts/`, imported via Vite's `?raw` and
rendered with a tiny `{{placeholder}}` helper. No prompt prose lives in the
AI layer code anymore. New `tests/unit/ai-prompts.test.ts` pins the
structural anchors that callers depend on (cursor token, section headers,
word limits) so prompt edits can't silently break the surrounding code.
