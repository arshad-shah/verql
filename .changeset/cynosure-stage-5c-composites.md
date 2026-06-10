---
"verql": minor
---

Cynosure migration Stage 5c: form composites replaced.

Verql's `FormField` wrapper is gone — call sites use Cynosure's form
composition (`FormField`/`FormLabel`/`FormControl`), which also wires
label-to-control ids and aria-describedby properly (the old wrapper's
cloneElement approach didn't reach Cynosure controls). `ColorInput` and the
hand-rolled `ColorPicker` (plus `color-utils`) are deleted: Cynosure 3.5's
`ColorPicker` popover variant is the same swatch-trigger form factor, with
`swatches` replacing `presets` and hex strings read via `color.toString('hex')`.
The forms primitives directory is now down to `FileContentInput` and
`FilePathInput` — both kept only for their native-dialog/drag-drop behaviour.
