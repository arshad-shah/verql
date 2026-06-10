---
"verql": patch
---

Continue the incremental Cynosure migration: rebuild the `EmptyState` primitive
on Cynosure's slotted empty-state and drop its Tailwind/CVA. The props-based API
(`title` / `description` / `icon` / `action` / `size` / `className`) is
unchanged, so every call site works as-is; internally it now composes Cynosure's
`EmptyStateIcon` / `EmptyStateTitle` / `EmptyStateDescription` /
`EmptyStateActions` slots. `variant="subtle"` keeps the existing borderless look.
No visual or behavioural change.
