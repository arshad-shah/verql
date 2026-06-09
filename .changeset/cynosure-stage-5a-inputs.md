---
"verql": minor
---

Cynosure migration Stage 5a: the text-input family is now Cynosure's.

`Input`, `Textarea`, `SearchInput`, `NumberInput`, and `Label` come from
`@arshad-shah/cynosure-react`; the Verql primitives (and `PasswordInput`)
are deleted. The load-bearing contract change: Cynosure form controls call
`onChange` with the **value**, not the React change event — every call site
was rewired (`onChange={(e) => set(e.target.value)}` → `onChange={set}`).
Verql `error` → `invalid`; sizes collapse to `sm|md|lg` (`xs`→`sm`,
`xl`→`lg`); NumberInput adopts react-aria naming (`min`→`minValue`,
`max`→`maxValue`, `disabled`→`isDisabled`) and passes
`formatOptions={{ useGrouping: false }}` so ports/limits don't render
locale grouping. `PasswordInput` was dropped entirely — Cynosure's
`Input type="password"` ships its own reveal toggle. SearchInput's built-in
clear button replaces the `onClear` prop, and manual ghost-styling hacks
(command palette, connection switcher) became `variant="ghost"`. The two
`Input type="number"` + parseInt sites became proper NumberInputs.
Contracts pinned in `tests/unit/cynosure-forms-migration.test.tsx`.
