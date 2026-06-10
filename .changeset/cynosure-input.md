---
"verql": patch
---

Continue the incremental Cynosure migration: rebuild the `Input` primitive on
Cynosure's `Input` and drop its Tailwind/CVA. The wrapper keeps the in-house
`error` and `xs`/`xl` ergonomics (mapping `error` → `invalid` and folding the
sizes onto Cynosure's `sm`/`lg`) and coerces a numeric `value` to a string, but
`onChange` is now **value-based** — it receives the next string rather than a
change event.

All call sites updated to value-based `onChange`. Fixed-width Tailwind classes
(`w-28`, `w-64`, `w-72`, …) are dropped so inputs size naturally; the two inline
search fields (command palette, connection switcher) now use Cynosure's
`variant="ghost"` instead of Tailwind surface-resets. The wrapper now defaults to
`size="sm"` (Cynosure's `md` runs larger than the old default) for a compact,
consistent look across the dense settings UI; the connection form keeps its
deliberate `lg` sizing.

`PasswordInput` is likewise rebuilt as a thin `Input type="password"` wrapper —
Cynosure's password input carries the built-in show/hide toggle. The old
standalone strength meter (`showStrength`) was unused in the app and is dropped.
