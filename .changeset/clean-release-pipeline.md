---
'verql': patch
---

Rebuild the release & distribution pipeline around three clean channels —
Homebrew cask (macOS), Homebrew formula (Linux), and the Microsoft Store
(Windows MSIX). Dropped the unsigned NSIS installer, the macOS update zip, and
the unused `latest*.yml` electron-updater feeds from the release. The Homebrew
tap is now regenerated from versioned templates (`packaging/homebrew/*.tmpl` via
`scripts/render-homebrew.mjs`) instead of in-place `awk` surgery — the cask
template preserves the existing working cask verbatim (including the
quarantine-strip `postflight`), with only the version and sha256s injected, and
a new Linux formula installs the AppImage. The release now publishes a single
cosign-signed `sha256sums.txt` covering every platform's binaries (previously
each runner's checksum file clobbered the others under `cp -n`, leaving only the
Windows entries).
