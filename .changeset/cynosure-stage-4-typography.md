---
"verql": minor
---

Cynosure migration Stage 4: typography primitives replaced.

`Text` (232 call sites), `Heading`, `Code`, and `Kbd` now come from
`@arshad-shah/cynosure-react`. The mapping: Verql's implicit `size="sm"`
default becomes explicit (Cynosure defaults to `md`), `size="base"` → `md`,
and the old color names become token paths — `secondary` → `fg.muted`,
`muted` → `fg.subtle`, `disabled` → `fg.disabled`, `accent` → `accent.solid`,
status colors → `feedback.*.foreground`, and `primary` is simply removed
(inherits). `weight="normal"` drops (default), `italic`/`truncate` classes
became props, Verql `Code block` → `variant="block"`.

`KbdGroup` stays a Verql component — its Electron accelerator parsing,
platform-aware `mod` resolution, and lucide glyph set have no Cynosure
counterpart — but now renders Cynosure `Kbd` keycaps (and drops its unused
`variant` prop). Contracts pinned in
`tests/unit/cynosure-typography-migration.test.tsx`.
