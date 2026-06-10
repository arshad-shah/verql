---
"verql": patch
---

Continue the incremental Cynosure migration: rebuild the `NumberInput`
primitive on Cynosure's `NumberInput` (React Aria `NumberField` under the hood)
and drop its hand-rolled stepper + Tailwind. The props-based API
(`value` / `onChange` / `min` / `max` / `step` / `precision` / `size` / `error`
/ `disabled`) is preserved, so every call site works unchanged; internally it
maps `min`/`max` → `minValue`/`maxValue`, `error` → `invalid`, `disabled` →
`isDisabled`, and `precision` → fixed `formatOptions`, and swallows React Aria's
empty-field `NaN` so callers only ever receive real numbers. Gains locale-aware
parsing/formatting, press-and-hold stepping, and richer keyboard support for
free. No visual or behavioural change at the call sites.
