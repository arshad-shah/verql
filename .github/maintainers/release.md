# Releasing Verql

This document covers cutting a new release end-to-end:

1. [The flow](#the-flow)
2. [Required secrets & accounts](#required-secrets--accounts)
3. [What the user gets](#what-the-user-gets)
4. [Verifying a release as a user](#verifying-a-release-as-a-user)
5. [Upgrading the pipeline](#upgrading-the-pipeline)

## The flow

```
                ┌──────────────────────────────────┐
   Maintainer ▶ │  pnpm changeset                  │  (per PR)
                │  pnpm changeset version          │  (when cutting a release)
                │  commit + push to main           │
                │  git tag vX.Y.Z && git push tag  │
                └──────────────────────────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ .github/workflows/     │  triggered by `v*.*.*` tag
              │   release.yml          │
              └────────────────────────┘
                  │       │       │
        ┌─────────┘       │       └─────────┐
        ▼                 ▼                       ▼
   ┌─────────┐   ┌────────────────────┐   ┌──────────────┐
   │ macOS   │   │  Linux             │   │ Windows      │
   │ build   │   │  AppImage ─▶ GH    │   │ MSIX ─▶      │
   │ + sign  │   │   Release (draft,  │   │  Microsoft   │
   │ + notar │   │   electron-updater)│   │  Store       │
   │         │   │  Snap ─▶ Snap Store│   │ (msstore CLI)│
   └─────────┘   └────────────────────┘   └──────────────┘
        │                 │
        └────────┬────────┘
                 ▼
        ┌──────────────────────┐
        │ Aggregate (macOS) +  │
        │ attach to the draft  │
        │ - sha256sums.txt     │
        │ - cosign signature   │
        │ - CycloneDX SBOM     │
        └──────────────────────┘
                 │
                 ▼
          Maintainer reviews
          and clicks Publish ──▶ AppImage auto-update goes live;
                                  homebrew-bump.yml fires.
```

The **Linux AppImage** is the only channel wired to electron-updater (the
in-app updater is hard-guarded to AppImage installs in
[`src/main/updater/auto-update.ts`](../../src/main/updater/auto-update.ts)).
**Snap** (via `snapd`) and the **Microsoft Store** manage their own updates and
publish to their respective stores immediately on tag, independent of the draft
GitHub Release.

The release workflow is in [`.github/workflows/release.yml`](../.github/workflows/release.yml).

A guard job runs first and refuses to publish from any repo other than
`arshad-shah/verql`, so a fork that pushes a tag cannot trigger an
arshad-shah/verql release.

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

### Windows — **Microsoft Store (MSIX)**

Windows ships as an **MSIX** distributed through the Microsoft Store, which
code-signs the package and handles updates. No code-signing certificate is
needed (that's why the old NSIS/SmartScreen problem is gone).

**One-time setup — do this before the first tag:**

1. **Reserve the app** in [Partner Center](https://partner.microsoft.com/dashboard)
   (Apps and games → New product → MSIX or PWA app). Pick the name.
2. Open the reserved app → **Product management → Product identity** and copy
   the three identity values into the `appx:` block of `electron-builder.yml`
   (they are `PLACEHOLDER`s today):
   - **Package/Identity/Name** → `appx.identityName`
   - **Package/Identity/Publisher** (the `CN=…` GUID) → `appx.publisher`
   - **Package/Properties/PublisherDisplayName** → `appx.publisherDisplayName`
   These must match exactly or the Store rejects the upload.
3. **Seed the listing with a manual submission.** `msstore publish` only
   *updates* an app that is already live, so build an MSIX locally
   (`pnpm build && pnpm exec electron-builder --win appx`) and submit it once
   through Partner Center by hand. CI takes over from the next tag.
4. Note the app's **Store product ID** (Product identity page) and set it as a
   repository **variable** `MICROSOFT_STORE_PRODUCT_ID` (not a secret — it's
   not sensitive; `msstore publish -id` reads it).

**Create the publishing credentials (Azure Entra app registration):**

1. Azure portal → **Microsoft Entra ID → App registrations → New registration**.
   Note the **Application (client) ID** and the **Directory (tenant) ID**.
2. In that registration → **Certificates & secrets → New client secret** and
   copy the secret *value* immediately.
3. **Link the app registration in Partner Center**: Account settings → User
   management → **Azure AD applications → Add Azure AD application**, pick the
   registration, and grant it the **Manager** role.
4. Find your **Seller ID** under Partner Center → Account settings →
   Identifiers (or Legal info).

Then set these GitHub **secrets**:

| Secret | What it is |
|--------|------------|
| `PARTNER_CENTER_TENANT_ID` | Entra **Directory (tenant) ID** |
| `PARTNER_CENTER_CLIENT_ID` | Entra **Application (client) ID** of the registration |
| `PARTNER_CENTER_CLIENT_SECRET` | The client secret **value** from step 2 |
| `PARTNER_CENTER_SELLER_ID` | Partner Center **Seller ID** |

…and the repository **variable** `MICROSOFT_STORE_PRODUCT_ID` from above.

Reference: [Publish app updates to Microsoft Store with GitHub Actions](https://learn.microsoft.com/windows/apps/publish/msstore-dev-cli/github-actions).

### Linux Snap — **Snap Store**

The Linux build also produces a `snap` that CI uploads to the Snap Store with
`snapcraft upload --release=stable`. `snapd` auto-refreshes installed snaps, so
this channel is not wired to electron-updater.

**One-time setup:**

1. Register the name once: `snapcraft register verql` (or on
   [snapcraft.io](https://snapcraft.io/)).
2. Export an upload token and store it as the `SNAPCRAFT_STORE_CREDENTIALS`
   secret:

   ```bash
   snapcraft export-login \
     --snaps verql \
     --channels stable \
     --acls package_upload \
     -                       # writes the token to stdout; paste it into the secret
   ```

| Secret | What it is |
|--------|------------|
| `SNAPCRAFT_STORE_CREDENTIALS` | Exported `snapcraft` login token (`package_upload` ACL) |

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

A published GitHub Release contains the macOS + Linux **direct-download** assets:

| Asset | Platform | What it is |
|-------|----------|------------|
| `verql-X.Y.Z-x64.dmg` | macOS Intel | Disk image, signed & notarised |
| `verql-X.Y.Z-arm64.dmg` | macOS Apple Silicon | Same as above |
| `verql-X.Y.Z-*-mac.zip` | macOS (both arches) | For the macOS auto-updater feed |
| `verql-X.Y.Z-x64.AppImage` | Linux x64 | Portable, **electron-updater** target |
| `latest-mac.yml` / `latest-linux.yml` | macOS / Linux | Auto-updater feeds |
| `sha256sums.txt` (+`.sig`/`.pem`) | macOS | Hashes + sigstore signature/cert |
| `sha256sums-linux.txt` (+`.sig`/`.pem`) | Linux | Hashes + sigstore signature/cert |
| `verql-vX.Y.Z-sbom.cdx.json` | All | Software Bill of Materials (CycloneDX) |

The **MSIX (Windows)** and **Snap (Linux)** builds are *not* attached to the
GitHub Release — they're submitted to the Microsoft Store and Snap Store
respectively. Users install/update those from the stores.

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

### `latest*.yml` auto-updates — **wired (AppImage)**

This is now live for the Linux AppImage:

- `electron-updater` is a dependency; `latest-linux.yml` is published to the
  GitHub Release by `electron-builder --publish always` in the `build-linux`
  job.
- `src/main/index.ts` calls `initAutoUpdater()` on app ready, which runs
  `autoUpdater.checkForUpdatesAndNotify()` — but only inside a packaged Linux
  AppImage (`src/main/updater/auto-update.ts` gates on `process.env.APPIMAGE`,
  with an `APP_UPDATER_ENABLED=1|0` override). The Store/Snap/Homebrew channels
  are deliberately excluded because they self-update.

Because the GitHub Release is created as a **draft**, AppImage clients only
pick up the new version once a maintainer publishes it.

### Promote a draft release

The pipeline creates **drafts** so the maintainer can sanity-check
before users see them. Once you're happy:

1. Go to https://github.com/arshad-shah/verql/releases
2. Find the draft, click Edit
3. Click "Publish release"
4. Linux AppImage users get notified by the in-app auto-updater, and
   `homebrew-bump.yml` fires to update the macOS cask. (Microsoft Store
   and Snap users already received their update when CI submitted to those
   stores on tag.)
