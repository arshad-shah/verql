---
"verql": minor
---

Cynosure migration Stage 5b: choice controls replaced.

`Switch`, `Select`, and `Checkbox` now come from `@arshad-shah/cynosure-react`;
the unused `Radio`, `Slider`, `TagsInput`, and `DatePicker` primitives are
deleted outright. Boolean controls use `onCheckedChange(checked)`; Select
moves to `items` + `onValueChange` (Verql option groups flatten to `section`);
the two `searchable` selects became `Combobox`. Switch labels are passed as
`VisuallyHidden` children — Cynosure's Switch does not forward `aria-label`,
and the silent drop is pinned by a contract test so an upgrade that changes
this fails loudly. The database-type select gained an explicit `aria-label`
(the FormField label wasn't reaching the trigger).
