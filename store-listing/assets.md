# Visual assets

The mark's source of truth is **`build/icon.svg`** (repo root `build/`). Run
`pnpm build:icons` to regenerate the rasterised PNG/ICO/ICNS. Everything below is
derived from that source.

## Generated icons in the repo

| File | Size | Used for |
|------|------|----------|
| `build/icon.svg` | vector | Source of truth — edit this |
| `build/icon.png` | 1024×1024 | macOS/Linux app icon; downscale for store logos |
| `build/icon.ico` | multi | Windows app icon (baked into the MSIX) |
| `build/icon.icns` | multi | macOS app icon |

## Microsoft Store assets (Partner Center)

| Asset | Spec | Source |
|-------|------|--------|
| Store logo | 300×300 PNG | Downscale `build/icon.png` |
| App screenshots | ≥ 1, 1366×768 or larger PNG (up to 10) | Capture from the running app |
| Promotional images (optional) | per Partner Center sizes | Designed if desired |

The MSIX itself already carries the tile/logo assets electron-builder generates
from `build/icon.ico` + the `backgroundColor` (`#1e1e2e`) in `package.json`
`build.appx`.

### Suggested screenshots (tell a story in order)

1. Query editor with a result grid (the core loop)
2. An entity-relationship (ER) diagram of a schema
3. The AI assistant writing/explaining a query
4. A chart built from query results
5. Browsing a non-SQL store (Redis keys or Mongo documents)

Capture on a clean profile with the dark theme, a seeded demo database (see
`scripts/test-dbs.sh`), and no personal connection details visible.

## To do

- [ ] Export a 300×300 store logo PNG
- [ ] Capture the screenshot set above
- [ ] (Optional) design promotional/hero images
