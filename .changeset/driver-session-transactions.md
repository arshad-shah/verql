---
"verql": minor
---

Added transaction controls for PostgreSQL and SQLite connections. Each query tab can now turn off auto-commit and run statements inside a transaction, with Commit/Rollback, isolation level, and read-only mode in a new transaction toolbar. A connection can default to manual-commit via a per-connection "Auto-commit by default" setting, and closing a tab with an open transaction prompts you to commit or roll back first.

Under the hood, drivers declare these capabilities through a new plugin-SDK session/transaction surface, so the UI stays database-agnostic — future drivers (MySQL, Snowflake, MongoDB, Redis) light up the same controls just by declaring support.
