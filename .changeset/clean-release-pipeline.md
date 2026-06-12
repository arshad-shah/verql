---
'verql': patch
---

Rebuild the release & distribution pipeline around three clean channels —
Homebrew cask (macOS), Homebrew formula (Linux), and the Microsoft Store
(Windows MSIX). Dropped the unsigned NSIS installer, the macOS update zip, and
every unused `latest*.yml` electron-updater feed. The Homebrew tap is now
regenerated from versioned templates (`packaging/homebrew/*.tmpl` via
`scripts/render-homebrew.mjs`) instead of in-place `awk` surgery, and the
release now publishes a single cosign-signed `sha256sums.txt` covering every
platform's binaries (previously each runner's checksum file clobbered the
others). Artifact names are pinned in `electron-builder.yml` so the build,
release assets, and tap URLs always agree.
