# Plan 5: Import/Export & Cross-Database Migration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add export (SQL, CSV, JSON), import (CSV, SQL), and cross-database type mapping for migration — all via IPC handlers in the main process with wizard UIs in the renderer.

**Architecture:** Export/import logic runs in the main process (file I/O + DB access). New IPC channels handle `export:table`, `export:query`, `import:csv`, `import:sql`. The renderer provides wizard modals. Cross-database migration uses a type-mapping utility that translates column types between PostgreSQL, MySQL, and SQLite.

**Tech Stack:** Built-in Node.js fs, Electron dialog API, csv-parse/csv-stringify (for CSV)

---

## File Structure

```
dbstudio/
├── shared/
│   └── ipc.ts                                 # MODIFY — add export/import channels
├── src/main/
│   ├── export/
│   │   ├── sql-export.ts                      # CREATE — generate INSERT/DDL SQL
│   │   ├── csv-export.ts                      # CREATE — generate CSV from rows
│   │   └── json-export.ts                     # CREATE — generate JSON from rows
│   ├── import/
│   │   ├── csv-import.ts                      # CREATE — parse CSV, map columns, insert
│   │   └── sql-import.ts                      # CREATE — execute SQL file
│   ├── migration/
│   │   └── type-map.ts                        # CREATE — cross-database type mapping
│   └── ipc-handlers.ts                        # MODIFY — add export/import handlers
├── src/renderer/src/components/
│   ├── export/
│   │   └── ExportModal.tsx                    # CREATE — export wizard UI
│   └── import/
│       └── ImportModal.tsx                    # CREATE — import wizard UI
└── tests/unit/
    ├── sql-export.test.ts                     # CREATE
    ├── csv-export.test.ts                     # CREATE
    └── type-map.test.ts                       # CREATE
```
