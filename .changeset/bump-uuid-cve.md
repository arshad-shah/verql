---
"verql": patch
---

Bump the `uuid` transitive (via snowflake-sdk) to `>=11.1.1` to resolve
GHSA-w5hq-g745-h8pq (missing buffer bounds check in v3/v5/v6). Our usage path
through snowflake-sdk only touches v4, but the audit gate flagged it; the
override moves us to a maintained line.
