---
'verql': patch
---

Fix automatic publication being silently blocked by a tag ruleset. After a
"Version Packages" PR merged, `scripts/release-tag.mjs` pushed the `vX.Y.Z` /
`sdk-vX.Y.Z` tag with the default `GITHUB_TOKEN`, but a repository ruleset that
*restricts tag creations* rejected it (`GH013: Cannot create ref due to
creations being restricted`) — and since `github-actions[bot]` is a system bot
that can't be added to a ruleset bypass list, nothing downstream
(`release.yml` / `publish-sdk.yml`) ever ran. Release tags are no longer a
trigger (the publish workflows are reusable calls), so blocking their creation
only blocked automation. `scripts/setup-release-gates.sh` now strips any
"restrict tag creations" rule and replaces it with the protection that matters
— release tags are immutable (no deletion / no force-move) — the auto-tagger
emits an actionable error if a ruleset still blocks it, and the maintainer docs
document the requirement.
