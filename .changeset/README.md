# Changesets

Every PR that changes user-visible behaviour should add a changeset.

```bash
pnpm changeset
```

The CLI prompts for the bump type (`patch` / `minor` / `major`) and a
short summary. Writing it from a user's perspective — "Postgres
connections can now use the IPv6 host syntax" — makes the eventual
changelog readable.

Commit the generated `.changeset/<name>.md` along with your code change.

## How a release happens

1. Pending changeset markdown files accumulate on `main` over time.
2. A maintainer runs `pnpm changeset version`. The CLI:
   - bumps `package.json` based on the largest pending bump
   - rewrites `CHANGELOG.md` with the entries
   - deletes the consumed markdown files
3. Maintainer reviews the diff, commits it (`chore(release): vX.Y.Z`),
   and pushes.
4. Tagging `vX.Y.Z` triggers `.github/workflows/release.yml` which
   builds, signs, and uploads to GitHub Releases as a **draft**.
5. Maintainer reviews the draft and clicks "Publish".

See [.github/maintainers/release.md](../.github/maintainers/release.md) for the full pipeline + the
secrets it needs.
