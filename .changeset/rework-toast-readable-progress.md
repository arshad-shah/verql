---
"verql": minor
---

Make toast notifications easier to read and optionally self-dismissing. The
message now renders in normal high-contrast text instead of being tinted the
status colour; the status colour moves to the icon and a slim colored rail down
the left edge, over a faint tonal background. Toasts can now take a `duration`
to auto-dismiss with a progress bar that pauses while you hover, so you have
time to read them. Padding and corners follow the UI density setting.
