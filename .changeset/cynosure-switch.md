---
"verql": minor
---

Migrate the Switch to Cynosure. Every in-house `<Switch>` call site (Editor,
General, Appearance, MCP, Plugin and plugin-detail settings, the transaction
toolbar, the AI status segment, and the connection form) now uses Cynosure's
`Switch`: `onChange` → `onCheckedChange`, and the in-house `label` (which was
accessibility-only) is rendered as a `VisuallyHidden` child. Switches now use
the larger `lg` size. The in-house `Switch` primitive, its story, and its unit
tests are removed. No `className` is passed to any switch, so it is styled
entirely through Cynosure + the theme bridge.
