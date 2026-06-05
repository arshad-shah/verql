---
"verql": minor
---

Add native OS notifications for approval prompts. A new bundled
`os-notifications` plugin surfaces "your response is needed" moments — AI
write-tool approvals and MCP query authorizations — as desktop notifications
when Verql is in the background, with user toggles (master enable, only when
unfocused, approvals). The host gains a delivery-agnostic `attention` seam
(`src/main/attention/`) that approval flows publish to, and the plugin exposes
an `os-notifications` service so other plugins can raise desktop notifications.
