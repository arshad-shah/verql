---
"verql": minor
---

Migrate the left and right activity-bar buttons to Cynosure's `IconButton`. The
`ActivityBar` (left) and `SecondaryActivityBar` (right) panel buttons now express
their states through Cynosure `variant`/`colorScheme` props instead of Tailwind
classes: active = `soft`/`accent`, inactive = `ghost`/`neutral`, and the MCP
indicator = `ghost`/`success`. The icon moves to Cynosure's `icon` prop. No
`className` remains on any of these buttons, so they are styled entirely through
Cynosure + the theme bridge.
