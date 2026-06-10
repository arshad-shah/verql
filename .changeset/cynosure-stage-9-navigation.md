---
"verql": minor
---

Cynosure migration Stage 9: navigation + utilities replaced.

The two `Tabs` strips (sidebar Saved/History toggle, plugin-detail tabs)
become the Cynosure `Tabs`/`TabsList`/`TabsTrigger` composition; the lone
`Link` swaps over; unused `Breadcrumb`/`Pagination` and the Verql
`VisuallyHidden`/`Portal` (call sites already use Cynosure's) are deleted.
`ResizeHandle` is the one survivor: App.tsx's shell layout drives it with
delta callbacks persisted to the settings store, and converting that to
Cynosure's `Resizable` panel groups is a structural shell refactor deferred
to its own pass (noted in the migration doc).
