---
"verql": minor
---

Cynosure migration Stage 3: feedback primitives replaced.

`Spinner` and `Alert` call sites now use `@arshad-shah/cynosure-react/spinner`
and `/alert` (Verql `variant="error"` → `status="danger"`; the `title` prop
becomes the `AlertTitle` slot, body copy the `AlertDescription` slot). The
dead `Toast`, `Banner`, `Skeleton`, and `Progress` primitives — unused outside
their own stories — are deleted with the rest of `primitives/feedback/`;
toasts continue to flow through the hand-rolled `ToastContainer` until the
notifications stage adopts Cynosure's Toast. Migration contracts pinned in
`tests/unit/cynosure-feedback-migration.test.tsx`.
