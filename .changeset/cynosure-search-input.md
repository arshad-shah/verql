---
"verql": patch
---

Continue the incremental Cynosure migration: rebuild the `SearchInput`
primitive on Cynosure's `SearchInput` and drop its hand-rolled markup +
Tailwind. The wrapper now exposes Cynosure's value-based API — `onChange`
receives the query string directly and the built-in clear button fires
`onChange('')`, so the separate `onClear` handler is gone — plus optional
debounced `onSearch` / Enter `onSubmit`. The in-house `xs`/`xl` sizes fold onto
Cynosure's `sm`/`lg`.

Call sites updated to the value-based `onChange` (dropping `onClear`). The
rarely-needed `shortcut` (kbd hint) and `loading` props are removed — nothing in
the app used them. The rendered control is now a native `type="search"` field
(role `searchbox`).
