# Releasing Verql

This document covers cutting a new release end-to-end:

1. [The flow](#the-flow)
2. [Required secrets & accounts](#required-secrets--accounts)
3. [What the user gets](#what-the-user-gets)
4. [Verifying a release as a user](#verifying-a-release-as-a-user)
5. [Upgrading the pipeline](#upgrading-the-pipeline)

## The flow

Releasing is **tag-free** — you never run `git tag` / `git push --tags`. A
changeset per PR drives an automated "Version Packages" PR; merging it (your
review is the gate) auto-tags and builds.

```
   Contributor ▶  pnpm changeset            (per feature PR; describes the change)
                          │  push to main
                          ▼
              ┌────────────────────────────────────┐
              │ release-version.yml (on push:main) │
              │  pending changesets → open/update  │
              │  the "Version Packages" PR          │
              └────────────────────────────────────┘
                          │
            Maintainer ▶  review + MERGE the Version PR   ◀── approval gate (CODEOWNERS)
                          │  merge lands the version bump
                          ▼
              ┌────────────────────────────────────┐
              │ release-version.yml (same workflow)│
              │  version changed → auto-create +   │
              │  push the `vX.Y.Z` tag             │
              │  (scripts/release-tag.mjs)          │
              └────────────────────────────────────┘
                          │  tag triggers ▼
              ┌────────────────────────┐
              │   release.yml          │
              └────────────────────────┘
                  │       │       │
        ┌─────────┘       │       └─────────┐
        ▼                 ▼                 ▼
   ┌─────────┐       ┌──────────┐      ┌─────────┐
   │ macOS   │       │  Linux   │      │ Windows │
   │ build   │       │  build   │      │  build  │
   │ + sign  │       │ (+sums)  │      │ (no     │
   │ + notar │       │          │      │  sign)  │
   └─────────┘       └──────────┘      └─────────┘
        └──────────────┬───────────────────┘
                       ▼
              ┌──────────────────────┐
              │ Publish release      │  ◀── `release` environment:
              │ (environment:release)│      required reviewer = you
              │ - sha256sums.txt     │
              │ - cosign signature   │
              │ - CycloneDX SBOM     │
              │ - DRAFT GitHub rel.  │
              └──────────────────────┘
                       │
                       ▼
                Maintainer approves the run,
                then clicks Publish on the draft.
```

Workflows: [`release-version.yml`](../workflows/release-version.yml) (versioning
+ auto-tag) and [`release.yml`](../workflows/release.yml) (build + gated
publish). Both refuse to run for any repo other than `arshad-shah/verql`, so a
fork can't trigger a release.

## Approval gates & required GitHub settings

Three gates put a release entirely in your hands; the first two are **repo
settings you must configure once** (they can't live in a committed file):

1. **Merge gate (your approval to land anything on `main`).** Branch protection
   on `main` → *Require a pull request before merging* + *Require review from
   Code Owners*. [`CODEOWNERS`](../CODEOWNERS) makes `@arshad-shah` the owner of
   everything, so no PR — including the auto-generated Version PR — merges
   without your review.
   Configure at `…/settings/branches`.

2. **Release-run gate (your approval to publish).** A GitHub **Environment**
   named `release` with **Required reviewers = `@arshad-shah`**. The
   `publish` job in `release.yml` declares `environment: release`, so the run
   pauses until you approve it in the Actions UI — exactly like the existing
   `npm-publish` environment used by `publish-sdk.yml`. The GitHub release is
   also created as a **draft**, so you still click *Publish* on it.
   Configure at `…/settings/environments`.

3. **Auto-tag trigger.** Add a fine-grained **PAT** with `contents: write` on
   this repo as the `RELEASE_PAT` repository secret. `release-version.yml`
   checks out with it so the auto-created tag can trigger `release.yml` (the
   default `GITHUB_TOKEN` deliberately cannot trigger other workflows). Without
   it the tag is still created, but you'd start `release.yml` manually once.

Optional hardening: in `…/settings/actions`, set *Fork pull request workflows* →
*Require approval for all outside collaborators* so CI on contributor PRs only
runs after you approve it.

### Cutting a release (what you actually do)

1. Ensure the PRs you want shipped each merged with a changeset.
2. The bot opens/updates a **Version Packages** PR — review the version bump +
   `CHANGELOG.md`, then **merge it**.
3. Approve the `release` environment run when prompted, then **Publish** the
   draft GitHub release. That's it — no tags, ever.

## Required secrets & accounts

Set each as a **Repository Secret** at
`https://github.com/arshad-shah/verql/settings/secrets/actions`.
Several are optional — leave them empty and the workflow produces
unsigned binaries for that platform instead of failing.

### macOS — signed + notarised

You need a paid **Apple Developer Program** membership
([apple.com/developer](https://developer.apple.com/programs/), $99/year).
With that you can mint:

1. **Developer ID Application certificate** — used to sign the
   `.app`/`.dmg`.
   - Generate it from Xcode → Settings → Accounts → Manage Certificates,
     or from
     [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/certificates/list).
   - Choose "Developer ID Application".
   - Export from Keychain Access as a `.p12` with a password.
2. **App-specific password** for `notarytool` — generated at
   [appleid.apple.com](https://appleid.apple.com/) → Sign-In and Security
   → App-Specific Passwords → "+".

Then set these GitHub secrets:

| Secret | What it is | How to compute |
|--------|------------|----------------|
| `MAC_CERT_P12_BASE64` | The exported `.p12`, base64-encoded so it can live in a secret | `base64 -i Developer-ID.p12 \| pbcopy` |
| `MAC_CERT_PASSWORD` | The password you used when exporting the `.p12` | (whatever you typed) |
| `APPLE_ID` | The Apple ID email associated with the developer account | e.g. `you@example.com` |
| `APPLE_APP_SPECIFIC_PASSWORD` | The app-specific password from above | `abcd-efgh-ijkl-mnop` |
| `APPLE_TEAM_ID` | 10-character team ID | Visible at [Membership Details](https://developer.apple.com/account#MembershipDetailsCard) |

Without these, the macOS build still produces a `.dmg`, but unsigned —
Gatekeeper will block the first launch unless the user right-clicks →
Open. Notarisation also fails (silently in CI for now), which would
trigger a "developer cannot be verified" prompt.

### Linux — GPG-signed checksums

The AppImage itself isn't signed at the binary level, but the release
publishes a `sha256sums.txt` and signs it with a detached GPG
signature. The cosign keyless flow does this for free — see
[Sigstore keyless](#sigstore-keyless-signing) below. Nothing extra to
configure.

If you'd rather use a traditional GPG key:

1. `gpg --full-generate-key` → RSA 4096, no expiration (or short
   expiry if you want to rotate annually).
2. `gpg --armor --export-secret-keys YOUR_KEY_ID | base64 | pbcopy`.
3. Set:
   - `GPG_PRIVATE_KEY` — the base64 armoured private key
   - `GPG_PASSPHRASE` — passphrase for that key
4. Replace the `cosign sign-blob` step in `release.yml` with a
   `gpg --detach-sign --armor sha256sums.txt` step.

The current pipeline uses sigstore by default because it requires no
key material at all.

### Windows — **unsigned per your decision**

The pipeline ships the NSIS installer without signing. Users will see a
SmartScreen "Unrecognized App" warning on first run and can click
"More info" → "Run anyway". This is fine for the first public release
but should be revisited if you want a smoother install experience.

When you're ready to sign, the recommended path is **Azure Trusted
Signing** (~$10/month, no hardware token, signs in CI). Add these
secrets and replace the `Build (Windows)` step with a sign action
([Azure/trusted-signing-action](https://github.com/Azure/trusted-signing-action)):

- `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` — for
  a Service Principal with the Code Signing role on your Trusted
  Signing account.

Alternatives: [SignPath.io](https://signpath.io/) is free for OSS and
provides a signing portal you trigger manually. Traditional EV / OV
certs from DigiCert / Sectigo / SSL.com work too but cost more and
(for EV) require a hardware token, which doesn't translate cleanly
into CI.

### Sigstore keyless signing

The release workflow signs the `sha256sums.txt` with
[cosign](https://docs.sigstore.dev/) using a short-lived OIDC token
provisioned by GitHub itself (`permissions: id-token: write`). No
secrets, no key material to rotate. The resulting `.sig` + `.pem`
files are published alongside the binaries.

Users verify with:

```bash
cosign verify-blob \
  --certificate sha256sums.txt.pem \
  --signature   sha256sums.txt.sig \
  --certificate-identity 'https://github.com/arshad-shah/verql/.github/workflows/release.yml@refs/tags/vX.Y.Z' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  sha256sums.txt
```

(See [Verifying a release](#verifying-a-release-as-a-user) for the
full command without the CI gobbledygook.)

### `GITHUB_TOKEN`

Provided automatically by GitHub Actions. The workflow's job-level
`permissions:` block scopes it to `contents: write` only in the
`publish` job. No action needed.

## What the user gets

A published release on
`https://github.com/arshad-shah/verql/releases/tag/vX.Y.Z` includes:

| Asset | Platform | What it is |
|-------|----------|------------|
| `Verql-X.Y.Z.dmg` | macOS Intel | Disk image, signed & notarised |
| `Verql-X.Y.Z-arm64.dmg` | macOS Apple Silicon | Same as above |
| `Verql-X.Y.Z-mac.zip` | macOS (both arches) | For auto-updater |
| `Verql-X.Y.Z.AppImage` | Linux x64 | Portable, no install needed |
| `Verql Setup X.Y.Z.exe` | Windows x64 | NSIS installer (currently unsigned) |
| `latest-mac.yml` / `latest-linux.yml` / `latest.yml` | All | Auto-updater feeds |
| `sha256sums.txt` | All | Hashes of every binary |
| `sha256sums.txt.sig` + `.pem` | All | Sigstore signature + cert |
| `verql-vX.Y.Z-sbom.cdx.json` | All | Software Bill of Materials (CycloneDX) |

## Verifying a release as a user

```bash
# 1. Download the binary plus sha256sums.txt(.sig|.pem) from the release page.
# 2. Install cosign once: brew install cosign  /  apt install cosign

cosign verify-blob \
  --certificate       sha256sums.txt.pem \
  --signature         sha256sums.txt.sig \
  --certificate-identity-regexp 'https://github.com/arshad-shah/verql/' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  sha256sums.txt

# 3. Verify your downloaded binary matches the recorded hash:
sha256sum -c sha256sums.txt --ignore-missing   # Linux
shasum -a 256 -c sha256sums.txt --ignore-missing # macOS
```

If both succeed, you have a binary that was produced by the
`release.yml` workflow running in `arshad-shah/verql`, and nothing
mutated it after the build.

## Upgrading the pipeline

### Add Windows signing later

1. Sign up for Azure Trusted Signing.
2. Add the three Azure secrets above.
3. Replace the `Build (Windows)` step in `release.yml` with the
   trusted-signing action (or wire `electron-builder` to call
   `signtool.exe` via the SignPath toolset).

### Add `latest*.yml` upload for auto-updates

Already produced by `electron-builder` per platform. They're uploaded
alongside the binaries. `electron-updater` in the app can be wired
later by:

1. `pnpm add electron-updater`
2. In `src/main/index.ts`, call `autoUpdater.checkForUpdatesAndNotify()`
   on app startup.
3. The renderer can subscribe to lifecycle events via a new IPC
   channel.

### Promote a draft release

The pipeline creates **drafts** so the maintainer can sanity-check
before users see them. Once you're happy:

1. Go to https://github.com/arshad-shah/verql/releases
2. Find the draft, click Edit
3. Click "Publish release"
4. Users with the app installed will get notified by the
   auto-updater (once that's wired).
