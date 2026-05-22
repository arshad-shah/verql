---
"verql": minor
---

Added in-app update controls under Settings → General. When the running install is managed by Homebrew, you can check for a new version and trigger `brew upgrade --cask verql` from inside the app, then restart to apply. The mechanism is channel-pluggable — Mac App Store, Windows Store, Snap and APT can drop in later without changes to the UI or IPC layer.
