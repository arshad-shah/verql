---
'verql': patch
---

Light themes (Light, Lab, Ink & Paper) now render correctly:

- The Light theme's selected-state and status colors (accent emphasis, success, warning, error, info) no longer fall back to the Nightshift baseline's mint/amber palette that washed out on white surfaces.
- The Color Mode toggle (Light / Dark / System) on Lab and Ink & Paper themes had dark text on a dark accent-muted background; the accent-muted token is now a translucent tint suitable for selected-state backgrounds on light surfaces.
- The Lab and Ink & Paper themes are now declared as `color-scheme: light` so native form controls render with the correct UA palette.

Removed the duplicate `<Heading>` element from every Settings category — the settings layout already shows the category name in its header, so each page no longer renders two headings stacked on top of each other.

Removed nine orphaned theme CSS files from `src/renderer/src/primitives/theme/themes/` that hadn't been imported since themes migrated to the plugin registry. The directory is gone; baseline Nightshift in `baseline.css` is the only renderer-bundled theme stylesheet.
