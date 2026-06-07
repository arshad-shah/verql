---
"verql": patch
---

Apply the driver `nouns` capability to every relational label, completing the
DB-agnostic explorer. The context-menu / hover / export / copy labels and the
query-semantic error messages (not-found, duplicate, constraint, type-mismatch)
now read in the active driver's own terms (table/column/row, collection/field/
document, key/field/entry, …) with generic fallbacks. Noun resolution is
centralized in `lib/data-nouns.ts`.
