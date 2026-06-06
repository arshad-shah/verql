---
"verql": patch
---

Internal modularization & slimming (behavior-preserving, no user-facing change):

- Extract pure plugin-manifest validation + the symlink walker out of the
  1047-line `plugin-host.ts` into `plugins/manifest-validation.ts` (re-exported
  for compatibility; covered by the existing manifest/audit tests).
- Collapse the 14 near-identical `tabs.ts` query-tab setters behind
  `patchQueryTab`/`patchTabTxn` helpers.
- Extract SQL classification (`isSchemaMutatingSql`, `destructiveKind`,
  `stripSqlNoise`) into a tested `lib/sql-classify.ts`, decoupled from i18n.
- Split the inline `PluginDetailView` tab components and the repeated
  `SchemaNode` object-group blocks into their own modules.
- Use `IPC_CHANNELS.DB_CONNECTION_OPTIONS` in the connection form instead of a
  hardcoded channel string.
