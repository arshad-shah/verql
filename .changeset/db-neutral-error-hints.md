---
"verql": patch
---

Make the shared error hints driver-neutral.

The error-classification system already keeps messages renderer-owned and i18n'd
(drivers contribute only regex→code patterns via `errorRules`, which carry no
text), and a `DbErrorCode` is a cross-driver taxonomy. Several fallback **hints**
still baked in SQL syntax, so a MongoDB/Redis user hitting a shared code (timeout,
permission denied, type mismatch, …) saw SQL-only advice. Those hints are now
phrased generically:

- timeout — "return less data (filter the results or fetch fewer records)"
  instead of "add a WHERE / LIMIT"
- permission denied — "grant them to this user" instead of "GRANT SELECT, ..."
- type mismatch — "cast or convert the value explicitly" instead of "value::int"
- division by zero — "guard the denominator so it can never be zero" instead of
  "NULLIF(x, 0)"
- transaction aborted — "roll back the transaction" instead of "Run \`ROLLBACK\`"
- duplicate object — "a create-if-not-exists form, or remove the existing
  {object} first" instead of "CREATE TABLE IF NOT EXISTS"

The driver-specific destructive-run warnings (DELETE/DROP/TRUNCATE) are unchanged
— they now surface only for SQL connections via the driver-aware classifier.
