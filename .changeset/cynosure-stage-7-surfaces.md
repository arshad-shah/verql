---
"verql": minor
---

Cynosure migration Stage 7: surfaces and overlays replaced.

- `Tooltip` → Cynosure tooltip (`delay` → `delayMs`; content/side/align 1:1).
- `Modal` → the `Dialog` composition (`open`/`onOpenChange`,
  `DialogContent`/`Header`/`Title`/`Description`/`Footer`); hand-rolled title
  rows and close ×'s became the built-in parts, gaining proper
  `aria-labelledby`/`aria-describedby` wiring.
- `ContextMenu`/`DropdownMenu` items-array APIs became the Cynosure
  trigger/content/item composition at every call site (explorer tree, tab
  strip, connection kebab, FileContentInput's mode menu).
- `Popover` trigger/content props → `PopoverTrigger asChild` + `PopoverContent`.
- `Card padding` → Cynosure `Card size` + `CardBody` (the root is unpadded by
  design; `size` feeds the parts), pixel-identical at 12px.
- One-off `Panel` folded into its single call site as a styled Box; unused
  `Sheet`/`Accordion` deleted. `GradientSurface` stays — brand visual with no
  Cynosure counterpart.

Contracts pinned in `tests/unit/cynosure-surfaces-migration.test.tsx`.
