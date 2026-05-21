# GitHub repository settings

A checklist for hardening `arshad-shah/nova` after making the repo
public. The CI / release workflow already takes care of the in-code
guards; the items below have to be toggled in the GitHub web UI
(or via `gh api`).

## 1. Rename the repository

The local directory is currently called `dbterm`. In GitHub:

1. https://github.com/arshad-shah/dbterm/settings
2. Repository name → `nova` → **Rename**

GitHub keeps the old `arshad-shah/dbterm` URL as a redirect for clones
and references, but everything authored after the rename uses
`arshad-shah/nova`. Update your local remote afterwards:

```bash
git remote set-url origin git@github.com:arshad-shah/nova.git
```

(Or `https://github.com/arshad-shah/nova.git` if you use HTTPS.)

## 2. General settings

`Settings → General`:

- **Default branch**: `main`
- **Features**:
  - ✅ Issues
  - ✅ Discussions
  - ❌ Wiki (use `docs/` in the repo instead — versioned with the code)
  - ❌ Projects (unless you're using them)
- **Pull Requests**:
  - ✅ Allow squash merging — set as default
  - ❌ Allow merge commits
  - ❌ Allow rebase merging
  - ✅ Always suggest updating PR branches
  - ✅ Automatically delete head branches
- **Archives**:
  - ✅ Include Git LFS objects in archives (if you ever add LFS;
    currently irrelevant)

## 3. Branch protection (rulesets)

`Settings → Rules → Rulesets → New branch ruleset`:

| Field | Value |
|-------|-------|
| Ruleset name | `Protect main` |
| Enforcement status | Active |
| Target branches | Include default branch (`main`) |

Then enable these rules:

- ✅ **Restrict deletions**
- ✅ **Require linear history** (matches squash-only merging)
- ✅ **Require a pull request before merging**
  - Required approvals: 1 (or however your team scales)
  - Dismiss stale approvals on new commits: ✅
  - Require review from Code Owners: ✅
  - Require approval of the most recent reviewable push: ✅
- ✅ **Require status checks to pass**
  - Require branches to be up to date: ✅
  - Required checks (add these — exact names appear after the first
    workflow run, then come back and lock them in):
    - `CI / unit-tests`
    - `CI / typecheck`
    - `CI / audit`
    - `CI / build`
- ✅ **Block force pushes**
- ✅ **Require signed commits** (if you adopt commit signing; see
  [GitHub docs on Vigilant Mode](https://docs.github.com/en/authentication/managing-commit-signature-verification/displaying-verification-statuses-for-all-of-your-commits))

## 4. Tag protection

`Settings → Rules → Rulesets → New tag ruleset`:

| Field | Value |
|-------|-------|
| Ruleset name | `Protect release tags` |
| Enforcement status | Active |
| Target tags | `v*` |

Rules:

- ✅ **Restrict creations** — only listed bypass actors can create
  tags that match `v*`. Add the maintainer's user as a bypass actor.
- ✅ **Restrict deletions**
- ✅ **Restrict updates**

Result: forks and other contributors cannot push a `v0.1.0` tag and
trigger an arshad-shah/nova release.

## 5. Actions permissions

`Settings → Actions → General`:

- **Actions permissions**:
  - Allow actions and reusable workflows: ✅
  - Allow actions created by GitHub: ✅
  - Allow actions by Marketplace verified creators: ✅
  - **Allow specified actions and reusable workflows** — paste the
    list from `.github/workflows/release.yml` and `ci.yml` once those
    are committed. Strict-pin actions to SHAs (already done in those
    files).
- **Artifact and log retention**: 30 days (default is fine)
- **Fork pull request workflows from outside collaborators**:
  - **Require approval for all outside collaborators** (default)
- **Workflow permissions**:
  - **Read repository contents and packages permissions** — minimal
    default. Workflow files request `contents: write` per-job where
    needed.
  - ✅ Allow GitHub Actions to create and approve pull requests
    (only if you adopt a release-PR bot; safe to leave off otherwise)

## 6. Secrets

`Settings → Secrets and variables → Actions`. Add the secrets
documented in [release.md](./release.md):

- `MAC_CERT_P12_BASE64`
- `MAC_CERT_PASSWORD`
- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`

(Windows signing secrets if/when you adopt it.)

`GITHUB_TOKEN` is provided automatically — do not add it manually.

## 7. Code security and analysis

`Settings → Code security and analysis`:

- **Private vulnerability reporting**: ✅ Enable
  ([SECURITY.md](../SECURITY.md) points here)
- **Dependency graph**: ✅ Enabled
- **Dependabot alerts**: ✅ Enabled
- **Dependabot security updates**: ✅ Enabled
- **Dependabot version updates**: ✅ Enabled (config lives in
  [.github/dependabot.yml](../.github/dependabot.yml))
- **Code scanning**: ✅ Set up — use the default CodeQL workflow.
  Cancel if you want fewer signals; recommended on.
- **Secret scanning**: ✅ Enabled (free on public repos)
  - ✅ Push protection — blocks commits that introduce credentials.

## 8. Pages (optional)

If you want a marketing / docs site at `arshad-shah.github.io/nova`:

`Settings → Pages → Build and deployment`:

- Source: GitHub Actions
- Add a `.github/workflows/pages.yml` that builds the Storybook
  (`pnpm build-storybook`) and uploads it as a Pages artifact.

Skipped for now — the README + `docs/` cover documentation needs.

## 9. Discussions

`Settings → Features → Discussions: Enable`. Then set up categories
under `Discussions → Categories`:

- 💬 Q&A
- 💡 Ideas
- 🙌 Show and tell (plugins, themes the community builds)
- 📣 Announcements (lock to maintainers)

## 10. After the rename — update README badges

Once renamed, the badge URL in `README.md` (`actions/workflows/ci.yml/badge.svg`)
will resolve. Verify by opening the rendered README on GitHub.

## Verification checklist

After applying everything:

- [ ] `git remote -v` points at `arshad-shah/nova`
- [ ] Pushing to `main` directly is rejected with a ruleset error
- [ ] Force-pushing to `main` is rejected
- [ ] Pushing a `v0.0.0-test` tag from a non-maintainer account fails
- [ ] A draft PR shows the required checks gating merge
- [ ] `Settings → Code security → Dependabot alerts` lists 0
      open advisories (matches `pnpm audit` from CI)
- [ ] Private vulnerability reporting form is reachable at
      `/security/advisories/new`
