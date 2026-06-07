---
"verql": minor
---

App-designed shell, custom About, and richer diagnostics

- **Menus & window controls**: replace the native OS application menu on
  Windows/Linux with an app-designed File / Edit / View / Query / Help menu bar
  (our own dropdowns + keyboard-shortcut hints, trimmed to what helps), and
  render the min/max/close window controls with the IconButton primitive.
- **About**: a custom in-app "About Verql" modal — branded hero panel, app +
  build versions with a copyable build block, MIT license, and resource links —
  replacing the old "open the website" behaviour.
- **Diagnostics**: a much more detailed in-app activity stream for debugging —
  new event kinds (IPC calls, plugin lifecycle, network/API calls, renderer
  state mutations, performance long-tasks), a structured detail drawer (metadata
  JSON, duration, error stack), a session error/warning summary, and a verbose
  capture toggle.
- **Design system**: add `size` variants across many primitives and a redesigned
  Switch (pixel-perfect circular thumb, consistent across every theme); normalize
  semantic variant names (Button `danger` → `error`, add `success` to Banner);
  the ColorInput picker now renders in a portal so it can't be clipped; context
  and dropdown menus hug their content.
- **Fixes**: the "show secondary sidebar" / "show bottom dock" settings now take
  effect live; fill in missing status/accent tokens in the dark, midnight and
  other themes; open external links via Windows interop under WSL; and don't
  crash when OS secret encryption is unavailable (headless / WSL).
