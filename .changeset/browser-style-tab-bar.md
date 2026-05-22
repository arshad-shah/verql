---
'verql': minor
---

Redesigned the workspace tab bar in a browser-style: each tab now has rounded top corners and curved skirt corners that visually attach the active tab to the workspace below.

Introduced five new theme tokens — `--color-tab-bar-bg`, `--color-tab-active-bg`, `--color-tab-active-fg`, `--color-tab-inactive-fg`, `--color-tab-hover-bg` — so themes (bundled and plugin-contributed) can tune tab contrast independently from the underlying surface palette. All nine plugin themes plus the baseline Nightshift were updated with values that keep the active tab clearly distinct from the bar, including on light themes where the previous hover wash blended into the background.
