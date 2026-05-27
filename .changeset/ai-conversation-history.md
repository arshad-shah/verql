---
"verql": minor
---

AI chat now keeps a history of conversations and runs leaner:

- **Conversations** — your chats are saved and listed in a switcher at the top of the AI panel. Start a new chat, rename or delete old ones, and pick up any conversation where you left off (they persist across restarts).
- **Branching** — fork a new conversation from any message to explore an alternative direction without losing the original thread.
- **More efficient context** — long conversations no longer send an ever-growing transcript to the model on every turn. The request is trimmed to a token budget (keeping the most recent context), which keeps responses fast and costs down.
