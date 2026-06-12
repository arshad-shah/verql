# Clean release & distribution pipeline — design

**Date:** 2026-06-12
**Status:** approved, implementing

## Goal

Rebuild Verql's release/distribution pipeline so it is **seamless, secure, and
maintainer-controlled**, with no in-place file surgery, no dead artifacts, and
no unused scaffolding. Three canonical channels, three trust gates, three
phases.

## Channel matrix (canonical)

| OS | Channel | Release artifact (download source) | Self-update |
|---|---|---|---|
| macOS | Homebrew **cask** | `Verql-X.Y.Z-x64.dmg`, `Verql-X.Y.Z-arm64.dmg` (signed + notarized) | `brew upgrade` via `HomebrewUpdater` |
| Linux | Homebrew **formula** | `Verql-X.Y.Z.AppImage` | `brew upgrade` via `HomebrewUpdater` |
| Windows | Microsoft **Store** | MSIX (Store only — **not** attached to the GitHub release) | Store |

**Dropped entirely:** the NSIS `.exe` (and its SmartScreen problem), the mac
`zip` target, every `latest*.yml` electron-updater feed, and the
`--win appx nsis` workaround. Windows self-updates via the Store; macOS/Linux
self-update via the already-implemented `HomebrewUpdater`. The GitHub release
exists to **host the DMG + AppImage that Homebrew points at**, plus provenance.

> Homebrew Cask is macOS-only; on Linux `brew` uses **Formulae**. "Homebrew on
> Linux" therefore means a `Formula/verql.rb` (installs the AppImage + a launcher
> shim) alongside the macOS `Casks/verql.rb` in the same `arshad-shah/homebrew-verql`
> tap. Same `brew install` UX, two file types.

## Architecture — three phases, three gates

| Phase | Workflow (file kept for stable OIDC identity + CODEOWNERS) | Trigger | Gate | Output |
|---|---|---|---|---|
| **Version** | `release-version.yml` | `push:main` | CODEOWNERS review — you merge the Version PR | bumped `package.json` + `vX.Y.Z` tag |
| **Release** | `release.yml` (reusable call + manual tag escape hatch) | reusable call from Version phase | `release` environment reviewer **and** draft release | signed GitHub release (DMG, AppImage, sums, sig, SBOM) + MSIX → Store |
| **Distribute** | `homebrew-bump.yml` | `release:published` | none — the release above is already gated | tap cask + formula updated |

The SDK (`@verql/plugin-sdk`) rides the same Version phase and publishes via the
unchanged `publish-sdk.yml` (OIDC trusted publishing, `npm-publish`
environment). Out of scope for this change.

**Why filenames are preserved.** Renaming `release.yml` would change the cosign
keyless certificate identity
(`…/workflows/release.yml@refs/tags/vX.Y.Z`) that users verify against, and
churn CODEOWNERS + environment wiring. "From scratch" is achieved by rewriting
*contents*, not by renaming files. Net new file: `scripts/render-homebrew.mjs`
+ `packaging/homebrew/` templates.

## The Homebrew generator (replaces the awk surgery)

Single source of truth lives in the **main repo**, not the tap:

- `packaging/homebrew/verql.cask.rb.tmpl` — macOS cask, placeholders
  `{{VERSION}} {{SHA_ARM64}} {{SHA_X64}} {{URL_ARM64}} {{URL_X64}}`.
- `packaging/homebrew/verql.formula.rb.tmpl` — Linux formula, placeholders
  `{{VERSION}} {{SHA_APPIMAGE}} {{URL_APPIMAGE}}`.
- `scripts/render-homebrew.mjs` — pure function `render(template, vars)` that
  rejects any unresolved `{{…}}` placeholder (fail-closed) and writes the
  **whole** file. No regex against the live tap file — the tap file is a pure
  build artifact, regenerated each release.
- `tests/unit/render-homebrew.test.ts` — covers substitution, the
  fail-closed unresolved-placeholder guard, and idempotent output.

`homebrew-bump.yml` (on `release:published`, non-prerelease): downloads the DMGs
+ AppImage from the release, computes sha256s, runs the generator, writes
`Casks/verql.rb` + `Formula/verql.rb` in the cloned tap, and pushes via the
existing scoped `HOMEBREW_VERQL_DEPLOY_KEY` (write-only deploy key bound to the
one tap repo — minimal privilege, kept).

## Deterministic artifact names (hard requirement)

`electron-builder.yml` currently sets **no** `artifactName`, so defaults
(`Verql-1.3.0-x64.dmg`) silently disagree with what `homebrew-bump.yml`
downloads (`verql-1.3.0-x64.dmg`) — a latent break. Pin them so the build, the
release assets, the generator, and the cask/formula URLs all share one naming
convention:

- dmg: `Verql-${version}-${arch}.dmg`
- AppImage: `Verql-${version}.AppImage`
- appx: `Verql-${version}.appx`

The generator and templates derive URLs from these names + the release tag, so
there is exactly one place naming is defined.

## electron-builder.yml changes

- `win.target`: `appx` only (drop `nsis`); drop `verifyUpdateCodeSignature`
  (was only for the NSIS electron-updater).
- `mac.target`: `dmg` only (drop `zip` — it existed only for electron-updater).
- Remove the `publish:` GitHub provider block so electron-builder stops emitting
  `latest*.yml` feeds (we publish assets explicitly in `release.yml`; nothing
  consumes the feeds).
- Add the pinned `artifactName` values above.
- `appx:` identity block unchanged (real Partner Center values).

## release.yml changes

- Build matrix unchanged in shape; Windows step becomes
  `electron-builder --win appx --publish=never` (no more named-target
  workaround). macOS builds `--mac` (dmg only now), Linux `--linux` (AppImage).
- sha256 + cosign keyless signing: keep; drop `latest*.yml`, `*.zip`, `*.exe`
  from the hashed/uploaded sets.
- `publish` job: draft GitHub release with `*.dmg`, `*.AppImage`,
  `sha256sums.txt(.sig|.pem)`, SBOM. `environment: release`. Keep the fork guard.
- `publish-msstore` job: unchanged in behavior — gated by `release`, skipped
  until `vars.MICROSOFT_STORE_PRODUCT_ID` is set. **Delivered clean & ready,
  activated later** (the one-time Partner Center seed + `PARTNER_CENTER_*`
  secrets are interactive account work, done when the maintainer chooses).

## Security & provenance posture (unchanged-good, kept)

- **Provenance:** cosign keyless (OIDC, no key material) over `sha256sums.txt`.
- **SBOM:** CycloneDX per release.
- **Least privilege:** per-job `permissions`, pinned action SHAs, fork guard,
  scoped deploy key for the tap, OIDC trusted publishing for npm.
- **Control gates:** CODEOWNERS merge gate + `release`/`npm-publish` environment
  reviewers + draft release. No PAT anywhere (reusable-workflow call crosses the
  trigger boundary the default token can't).

## Docs & metadata to update in the same change

- `.github/maintainers/release.md` — channel matrix, "What the user gets" table
  (remove NSIS/zip/feeds), Homebrew generator section.
- `.github/CODEOWNERS` — add `homebrew-bump.yml`, `scripts/render-homebrew.mjs`,
  `packaging/`.
- A changeset (`.changeset/*.md`) — patch bump for the app (repo convention:
  every PR ships a changeset).

## Verifying / exercising the flow

Safe-to-run locally (this session):
- `tests/unit/render-homebrew.test.ts` (the generator).
- `node scripts/release-tag.mjs` dry smoke (version unchanged → no-op).
- YAML parse of every workflow; `pnpm exec tsc -b --noEmit`; `pnpm test`.

CI-only (runs on a real tag; requires maintainer action, not done here):
- The full `release.yml` build matrix + signing + draft release.
- `homebrew-bump.yml` push to the tap (needs the published release).
- `publish-msstore` (needs the Store secrets + one-time seed).

The PR itself does not trigger `release.yml` (it only runs on tags / reusable
call), so opening the PR is safe; the real release is exercised by merging the
Version PR, which stays fully gated.
