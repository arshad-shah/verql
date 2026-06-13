---
"verql": minor
---

Refine the form-field primitives and rebuild the multi-line text editor. Every
field — text input, number input, password, file path/content pickers, date
picker, and the text area — now scales with the **UI density** setting
(Settings → Appearance → compact / comfortable / spacious), changing height,
text size, corner radius, and padding together. Field glyphs are now crisp
icons (show/hide password, file, calendar, clear, …) instead of text symbols.

The password field shows a four-segment strength meter; the file pickers tint
when a file is selected and highlight on drag-and-drop. The text area is rebuilt
as a card you can resize with a corner grip (vertical, horizontal, or both),
with optional auto-grow, a character counter that warns near a limit, a clear
button, and a footer toolbar. Existing usages are unchanged — the new
capabilities are opt-in.
