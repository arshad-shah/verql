---
"verql": patch
---

Make the schema explorer DB-agnostic via a driver-supplied `nouns` capability.

Drivers can now declare what they call their data concepts —
`nouns: { object, field, record }` (each `{ one, many }`) — e.g. SQL drivers
table/column/row, MongoDB collection/field/document, Redis key/field/entry. The
renderer resolves them through `useDataNouns` (with generic fallbacks) so the
explorer's search placeholder, group headers, loading/empty states and row
counts read in the active driver's own terms instead of assuming SQL. Combined
with the earlier literal-"SQL" string cleanup, the shell no longer hardcodes SQL
terminology in generic surfaces.
