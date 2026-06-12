---
"verql": minor
---

Export/import dialogs now show the formats the connection actually supports.

The Export and Import dialogs no longer hardcode `sql | csv | json`. They fetch
the formats registered for the active connection (`export:formats-list` /
`import:formats-list`, driver-filtered through the exporter/importer registries),
so the list is always correct — a MongoDB or Redis connection is no longer
offered a SQL export it can't produce.

- `RegisteredExporter` gains an optional `supportsSchema` flag (the SQL exporters
  set it); the "include schema definition" toggle now shows for any format that
  declares it, instead of being hardcoded to `sql`.
- The Import dialog branches on the importer's `driverExecutes` flag (SQL scripts
  run their own statements; data files parse into a target object) rather than on
  the literal format name.
- `export:table`'s `format` is now a registry id (`string`), not a fixed enum, so
  plugin-contributed formats work end to end.
