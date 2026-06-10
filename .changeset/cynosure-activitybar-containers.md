---
"verql": patch
---

Migrate the activity-bar containers to Cynosure's `Stack`. The left `ActivityBar`
and right `SecondaryActivityBar` wrappers now use Cynosure's `Stack` with
`width`/`background`/`paddingTop`/`flexShrink` props — the single-side divider is
an inline `style` using the theme border variable — instead of Tailwind classes.
With the buttons already on Cynosure, both activity bars are now fully Cynosure
with no Tailwind remaining.
