---
"verql": minor
---

Cynosure migration Stage 2: `Button` and `IconButton` are now Cynosure's.

The hand-rolled `Button`/`IconButton` primitives (CVA + Tailwind) are deleted;
every call site imports `@arshad-shah/cynosure-react/button` /
`/icon-button` and uses the Cynosure props API (clean break):

- Verql `variant="error"` → `colorScheme="danger"`; `outline`/`ghost` map to
  the same variants with `colorScheme="neutral"` (Verql's were neutral-toned);
  default stays solid accent.
- Call-site Tailwind that expressed colour intent (e.g. the query toolbar's
  `bg-success/10 text-success` Run button) now uses the proper recipe
  (`variant="soft" colorScheme="success"`); icon children moved to
  `leftIcon`/`rightIcon`; `w-full` → `fullWidth`; busy states use `loading`
  where the control should be inert.
- IconButton's icon moves from children to the `icon` prop; the tab-strip
  close button and window controls use `variant="bare"` (parent chrome owns
  the dense sizing).
- Cynosure buttons render `type="button"` by default — the two form-submit
  sites already passed `type="submit"` explicitly.

Purely positional utility classes at call sites remain until their parent
components migrate to Cynosure layout primitives in later stages.
`tests/unit/cynosure-button-migration.test.tsx` pins the behaviours the
mapping relies on.
