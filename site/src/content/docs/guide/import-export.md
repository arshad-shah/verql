---
title: Importing & exporting
description: Moving data in and out of your databases as CSV, JSON, SQL, and JSON-Lines.
sidebar:
  order: 5
---

Verql can move data in and out of your databases in several common formats.
These formats are **plugin contributions** — they're added by bundled plugins
rather than baked into the core — which is why the available formats can grow as
you add plugins.

[← Back to the User Guide](/guide/)

## Supported formats

| Format | Export | Import | Notes |
|--------|:------:|:------:|-------|
| **CSV** | ✔ | ✔ | Comma-separated values, for spreadsheets and tooling. |
| **JSON** | ✔ | ✔ | Structured data. |
| **SQL** | ✔ | ✔ | `INSERT` statements (and DDL where applicable) using dialect-aware identifier quoting. |
| **JSON-Lines** | ✔ | | One JSON object per line — convenient for document data such as MongoDB. |

> The exact set of formats offered depends on the active connection and which
> plugins are enabled. Relational databases get SQL export/import; document and
> key-value stores get the formats that fit them.

## Exporting data

1. Produce the data you want to export — run a query, or open a table preview.
2. Choose to export, then pick the format (CSV, JSON, SQL, or JSON-Lines).
3. Save the file.

Because SQL export uses the active driver's own identifier-quoting rules, the
output is valid for that database's dialect.

## Importing data

1. Start an import and pick the source file.
2. Choose the target (for example, the table to load into).
3. Confirm and run the import.

When importing CSV into a table, Verql adapts to the active driver's quoting and
placeholder style, so the same import path works across relational databases. If
some rows can't be written (for example, conflicts during an "update on
conflict" import), those per-row failures are reported back to you rather than
silently dropped — so a partial import is never mistaken for a complete one.

---

Next: [The AI assistant →](/guide/ai-assistant/)
