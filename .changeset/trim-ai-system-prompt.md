---
"verql": patch
---

Trim the AI system prompt: drop verbose rule restatements, send only table
names (instead of full column schemas) with a hint to call describe_table on
demand, compact the App-Action catalog to `id "Title"` pairs, omit the active
connection from the "saved connections" list, and cap recent notifications at
three titles. Cuts per-turn prompt size by ~2-5k tokens on typical workspaces.
