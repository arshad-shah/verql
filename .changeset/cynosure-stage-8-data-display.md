---
"verql": minor
---

Cynosure migration Stage 8: data-display primitives replaced.

`EmptyState` becomes the Cynosure composition (Icon/Title/Description/Actions
parts, `variant="subtle"` to keep Verql's transparent look); `Badge` maps to
soft `colorScheme`s (`error`→`danger`, `default`→`neutral`, `shape="pill"`);
`Avatar`, `Table` (compound → named parts), and `BadgeIndicator`→`Indicator`
swap straight over. `CodeView` is replaced by Cynosure's shiki-powered
`CodeBlock` (source as children; the AI insert action rides the `filename`
header slot), and the theme bridge gains a `[data-cynosure-scheme]` shiki
flip — Cynosure keys its dual highlight themes on `data-theme: light|dark`,
which never matches Verql theme ids. The one-off `KeyValue` row folded into
AboutModal; unused `Tag`/`List`/`TreeItem`/`Skeleton` are deleted with the
rest of `primitives/data-display/`.
