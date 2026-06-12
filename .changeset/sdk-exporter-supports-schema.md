---
"@verql/plugin-sdk": minor
---

Add an optional `supportsSchema` flag to `RegisteredExporter`.

Exporters that honour `options.includeSchema` (e.g. SQL exporters that can
prepend a schema definition) can now declare `supportsSchema: true`. The host's
Export dialog shows the "include schema" toggle only for formats that declare
it, instead of hardcoding it to `sql`. Backward-compatible — the field is
optional and defaults to off.
