---
"verql": minor
---

Enhance the AI chat and surrounding workflow:

- **Active connection fix** — the assistant now uses the connection you have active in the UI (previously it had no connection and its query/schema tools silently failed).
- **Refined message bubbles** — avatar-anchored, adaptive width so tables and code never truncate, copy/retry actions, and a suggestion empty state.
- **Deeper app integration** — the assistant can link you to the right place (e.g. "Add a Connection", "Open ER Diagram") via clickable action chips, and can navigate the app directly through an extensible App-Action registry that plugins can contribute to. The assistant knows your saved connections, so it sends you to the connections list for an existing one and the form only for a new one. Agentic actions report real success/failure back to the chat.
- **Cheapest model by default** — when a provider is active or you switch vendors, the cheapest model for that vendor is selected by default (you can still pick another).
- **Connections panel** — row actions moved into an overflow menu, with a new Delete action (confirmed via a dialog).
