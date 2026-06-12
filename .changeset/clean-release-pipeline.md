---
"verql": patch
---

Modernize the release pipeline. The "Version Packages" step now uses the
canonical `changesets/action` (SHA-pinned) instead of a hand-rolled script —
fixing the `GITHUB_TOKEN`/changelog-github failure that broke versioning &
tagging — while the gated, PAT-free auto-tag → reusable-publish flow is
unchanged. Adds Microsoft Store (MSIX) publishing: an `appx` target in
`electron-builder.yml` and a `publish-msstore` job in `release.yml`, gated
behind the `release` environment and skipped until `MICROSOFT_STORE_PRODUCT_ID`
is set. The `setup-release-gates.sh` script now also provisions the
`npm-publish` environment and the "Actions can create PRs" permission.
