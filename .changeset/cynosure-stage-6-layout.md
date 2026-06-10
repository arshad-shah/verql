---
"verql": minor
---

Cynosure migration Stage 6: layout primitives replaced.

`Flex`, `Stack`, `Box`, `Grid`, `Divider`, `Spacer`, `ScrollArea`, and
`Container` across ~90 component files now come from
`@arshad-shah/cynosure-react` (the `AspectRatio` primitive was unused and is
deleted with the rest of `primitives/layout/`). The prop unions matched
almost everywhere; the real changes are the spacing tokens —
`xs/sm/md/lg/xl` become the Tailwind-compatible scale `"1"/"2"/"3"/"4"/"6"`
(`none` → `"0"`) — plus `wrap` boolean → `wrap="wrap"`, ScrollArea
`direction` → `scrollbars`, and Stack dropping its redundant
`direction="vertical"`. Box stays polymorphic (`as="button"` theme tiles
keep working). Existing Tailwind `className`s on call sites are untouched
until the stage-11 long tail. Contracts pinned in
`tests/unit/cynosure-layout-migration.test.tsx`.
