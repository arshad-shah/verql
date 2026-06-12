---
"verql": patch
---

Fix the automated release tagging: `scripts/release-tag.mjs` ran `git tag -a`
on a CI runner with no committer identity, so the first auto-tag of a merged
Version PR died with "empty ident name" and no `vX.Y.Z` / `sdk-vX.Y.Z` tag was
created. The script now configures a bot git identity (only when none is set)
before tagging, so the canonical Changesets merge → auto-tag → gated publish
flow completes without a manual tag push.
