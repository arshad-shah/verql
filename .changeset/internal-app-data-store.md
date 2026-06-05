---
"verql": minor
---

Persist AI conversations and saved queries in an internal SQLite app-data store
instead of renderer `localStorage`. A new main-process `AppDataStore`
(`${userData}/app.db`, WAL mode) reached over typed `appdata:*` IPC channels
removes the ~5–10MB `localStorage` quota cap that could silently drop chat
history, and replaces full-blob rewrites with incremental, transactional writes
(one write per settled message / saved query). Existing `localStorage` data is
migrated into the store automatically on first launch.
