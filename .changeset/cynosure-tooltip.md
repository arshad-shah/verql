---
"verql": minor
---

Migrate the Tooltip to Cynosure. Every in-house `<Tooltip>` call site (the
activity bars, sidebar, tab bar, explorer actions, AI header/toggle, keybindings
settings, notification bell, and connections panel) now uses Cynosure's
`Tooltip` (`delay` → `delayMs`). The in-house `Tooltip` primitive, its story, and
its tests are removed. Cynosure's Tooltip uses Radix `asChild`, so the one
trigger that did not forward a ref (the notification bell's `BadgeIndicator`) is
wrapped in a `span`. No `className` is passed to any tooltip, so it is styled
entirely through Cynosure + the theme bridge.
