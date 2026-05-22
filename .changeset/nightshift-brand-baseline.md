---
'verql': minor
---

Nightshift is now owned by the app shell rather than the core-themes plugin. Its CSS variables already lived in the always-loaded baseline; this release moves the Monaco editor definition into the renderer alongside, so the brand syntax highlighting works even with every plugin disabled. The renderer always prepends Nightshift to the theme list and ignores any plugin attempting to register the same id, keeping the brand surface authoritative. The core-themes plugin now ships nine themes (Lab, Ink & Paper, Dark, Light, Midnight, Dracula, Nord, Solarized, Catppuccin).

The pre-React boot splash now uses the real Verql brand mark (frost-and-mint V-bars) instead of the placeholder chevron, matching the React-side splash so the loading-to-app handoff doesn't swap symbols.
