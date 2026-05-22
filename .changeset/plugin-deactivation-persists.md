---
"verql": patch
---

Plugin deactivations now survive an app restart. Previously the choice was kept only in memory, so every boot re-activated every installed plugin and the disable toggle appeared to do nothing across sessions.
