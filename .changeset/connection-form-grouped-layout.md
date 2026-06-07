---
"verql": patch
---

Redesign the connection form layout into clear, grouped sections. Fields were
previously stacked full-width in a single column with duplicate labels and
inconsistent section headers. The form now uses titled cards:

- **General** — database type, name and color side by side, and an auto-commit
  toggle row.
- **Connection** — driver fields laid out in a responsive two-column grid (wide
  inputs like passwords, selects, and file pickers span the full width), with
  boolean options grouped into a clean toggle list under an "Options" subheading.
- **SSH Tunnel** — collapsible card with a description hint.
- A footer action bar pairs **Test Connection** with **Cancel / Save**.

Fields are still rendered generically from driver and middleware contributions,
so the new grid and toggle grouping applies to every database type and any
plugin-contributed connection fields.
