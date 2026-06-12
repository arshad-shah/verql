# Store listing & branding

The single home for everything needed to publish Verql to an app store: the
**shared brand** (one source of truth for name, copy, colours, and assets) and a
**per-store folder** that adapts that brand to each store's exact fields and
limits.

```
store-listing/
├── README.md          ← you are here
├── brand.md           ← SHARED source of truth — edit copy here first
├── assets.md          ← logo/icon/screenshot specs + where each comes from
└── microsoft/
    └── listing.md     ← Microsoft Store fields, filled from brand.md
```

## How to use it

1. **Change copy in [`brand.md`](./brand.md) first.** It holds the canonical
   name, taglines, descriptions, feature list, keywords, and URLs. Every store
   listing is derived from it, so the messaging stays consistent everywhere.
2. **Then update each store file** (e.g. [`microsoft/listing.md`](./microsoft/listing.md))
   to fit that store's field names and character limits. Each store file is
   paste-ready and notes its own limits.
3. **Assets** (logos, screenshots) are specified once in [`assets.md`](./assets.md);
   the source of truth for the mark is `build/icon.svg` (see the repo `CLAUDE.md`).

## Store status

| Store | Status | Notes |
|-------|--------|-------|
| **Microsoft Store** (Windows, MSIX) | ✅ Listing copy ready | Product ID `9N97ZSVPSBZ3`. Pipeline live (gated `publish-msstore`). Needs the one-time manual seed + screenshots + privacy URL before first publish. See [`microsoft/listing.md`](./microsoft/listing.md). |
| Mac App Store (Apple) | ⛔ Not planned | macOS ships via Homebrew cask. |
| Snap Store / Flathub (Linux) | ⛔ Not planned | Linux ships via Homebrew formula. |

> Distribution policy: macOS + Linux ship through **Homebrew**, Windows through
> the **Microsoft Store**. Add a new store folder here only if that policy
> changes. See `.github/maintainers/release.md`.

## Required URLs (used by every store)

- Website / homepage: <https://verql.arshadshah.com>
- Privacy policy: <https://verql.arshadshah.com/privacy>
- Terms & conditions: <https://verql.arshadshah.com/terms>
- Support: <https://github.com/arshad-shah/verql/issues>
