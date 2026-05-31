# Signed plugins + trusted registry with provenance

> **Status: PROPOSAL / future work — not implemented.** This document is a
> design specification for [`plugin-security.md`](../plugin-security.md) roadmap
> item 4 ("Signed plugins + a trusted registry"). It is detailed enough to
> implement from, but no code in this repository implements it yet.

**Summary.** Today Verql verifies *nothing* about a third-party plugin at
install time — "only install plugins you trust" is a social control (see
[`plugin-security.md` → Known limitations](../plugin-security.md#known-limitations-read-this)).
This proposal adds (1) a **signed plugin artifact** (`.vqlplugin`) with a
checksum manifest, an author signature, and a build-provenance block, reusing
the Sigstore/cosign keyless flow the app already uses for its own releases; and
(2) a **trusted registry** — a signed static index, hosted in a Git repo / GitHub
Releases like the existing Homebrew tap — that records each plugin's publisher
identity, dist URLs, hashes, signatures, provenance, and yank/revocation status.
At install time the host verifies checksum → signature → provenance → registry
status, attaches a `verification` record to the loaded plugin, and surfaces it in
the UI. Crucially, **verification does not change the capability model**: a
"verified" plugin is still untrusted code subject to the same permission gating
and process isolation. Signing buys *provenance and tamper-evidence*, not a
sandbox.

This is a large, multi-quarter effort and is explicitly deferred. It depends on
nothing in the existing security work and can be sequenced after the higher-value
isolation items (roadmap 1–3).

---

## 1. Goals & non-goals

### Goals

| # | Goal | What it buys |
|---|------|--------------|
| G1 | **Tamper-evidence** | A package modified after the author signed it fails verification. The bytes the user runs are the bytes the author published. |
| G2 | **Provenance** | Each plugin is bound to a publisher identity (an OIDC subject / a public key) and, ideally, to a source repo + commit + CI build. The UI can show "published by `github.com/acme` from commit `abc123`". |
| G3 | **Trust-on-install consent** | The install dialog can show *who* signed a plugin and *where it came from* before the user commits, instead of an anonymous folder/zip. |
| G4 | **Revocation / yanking** | A compromised or malicious version can be marked revoked in the registry; clients refuse to install it and warn if it is already installed. |
| G5 | **Curated discovery (registry)** | A known index of plugins with stable identity, so typosquatting and "compromised download link" attacks have a trusted reference to check against. |
| G6 | **Consistency with the app's own supply chain** | Reuse cosign keyless + OIDC provenance + SBOM, already used in [`release.yml`](../../.github/workflows/release.yml) and [`publish-sdk.yml`](../../.github/workflows/publish-sdk.yml), so there is one signing story to maintain. |

### Non-goals (explicitly out of scope)

- **N1 — It is not a sandbox.** A verified, signed plugin is still untrusted
  code. The trust boundary (`plugin.path === '<bundled>'`), the
  enforced/advisory capability gates, and process isolation in
  [`src/main/plugins/isolation/`](../../src/main/plugins/isolation/) are
  **unchanged**. Signing tells you *who* shipped the code and that it *wasn't
  modified*; it tells you nothing about whether the code is safe. A signed
  plugin that asks for `keyring` must still be granted `keyring` by the user.
- **N2 — No auto-grant of sensitive capabilities.** Being "verified" must never
  silently grant `keyring`/`connections`/`ipc`. It informs the consent UI; the
  user still grants.
- **N3 — Not a malware scanner.** No static analysis, no behavioural detection.
- **N4 — Not a license/quality gate.** The registry curates *identity*, not code
  quality.
- **N5 — Bundled plugins are unaffected.** They ship inside the app bundle and
  are already trusted (and themselves covered by the app's release signing).
  They are never fetched from the registry and never carry a `.vqlplugin`
  signature of their own.
- **N6 — Does not replace the OS code-signing of the Verql app itself.** That is
  `release.yml`'s job.

---

## 2. Threat model

The attacker's goal is to get hostile or modified code running inside Verql's
main process (with Node + app privileges) on a victim's machine.

| Attack | Defended by | Residual risk |
|--------|-------------|---------------|
| **Tampered package** — attacker modifies a legitimately-published plugin (adds a backdoor) and offers the modified file. | Checksum manifest + author signature over a canonical digest (G1). Verification fails. | Author's signing identity is itself compromised → see "malicious update". |
| **Typosquatting** — `verql-plugin-postgres` vs `verql-plugin-postgresql`; or a near-name impersonating a known publisher. | Registry is the authority on `name → publisher identity`. The install UI shows the publisher; a registry-listed name is bound to one publisher. Name-shadowing of *bundled* names is already refused in `plugin-host.ts`. | A user side-loads an off-registry package that mimics a real one. Mitigated by the "unverified" UI treatment, not prevented. |
| **Compromised distribution channel** — attacker MITMs the download or swaps the file on a mirror/CDN. | Registry pins `sha256` + signature; the client verifies the downloaded bytes against the *signed registry entry*, not against whatever the server claims. | Registry index itself is served from a compromised host → the index is *also* signed (§6); client verifies the index signature offline against a pinned trust root. |
| **Malicious update** — a previously-good plugin ships a hostile new version, or the author's signing key/OIDC identity is stolen. | Revocation/yanking (G4): registry marks the bad version revoked; clients refuse install and warn on already-installed. Provenance binds the build to a source repo+commit, so a build that didn't come from the expected repo is detectable. | Window between compromise and revocation. Users who installed in that window must be warned (handled: revocation check runs on startup, not only install). |
| **Registry operator compromise / insider** — whoever controls the index injects a bad entry. | The index is append-mostly and signed; entries carry the *publisher's* signature, not just the registry's, so the operator cannot forge a publisher signature. Provenance (repo+commit) is independently checkable. | A determined operator + a stolen publisher key. This is the classic "who signs the index" problem; see Open Questions (TUF, §12). |
| **Downgrade / rollback** — serving an old, vulnerable, but validly-signed version. | Registry records the current best version and yank status per version; client prefers the registry's advertised version and warns on installing a yanked/older one. | Offline clients with a stale cached index (bounded by cache TTL + explicit "index is N days old" warning). |
| **Offline / air-gapped install** — no registry reachable. | Signature + provenance still verify offline against the bundled trust root / Rekor checkpoint (§4). Registry-only checks (yank status) degrade to "could not confirm; proceed with explicit override". | An offline user cannot see a revocation issued after their last sync. |

**Out of model:** a malicious *author* who signs and publishes genuinely hostile
code under their real identity. Signing makes them *accountable and revocable*,
not harmless — the capability model and isolation are what contain them at
runtime.

---

## 3. Trust model integration

Verql's trust model has exactly two classes (see
[`plugin-security.md` → Trust model](../plugin-security.md#trust-model)):
**bundled = trusted**, **third-party = untrusted**, decided in one place
(`plugin.path === '<bundled>'`). This proposal **does not add a runtime trust
tier** — it adds a **verification status** that is orthogonal to trust.

```
                 trusted?  (drives capability gating + isolation)
                 ┌──────────────────────────────┐
   bundled       │ trusted   (all caps, in-proc) │  ← unchanged
   third-party   │ untrusted (deny-by-default)   │  ← unchanged
                 └──────────────────────────────┘

                 verification status  (drives UI + consent defaults ONLY)
                 ┌──────────────────────────────────────────────┐
                 │ verified    signature ✓ + registry-listed     │
                 │ signed      signature ✓ but not registry-listed│
                 │ unverified  no signature (legacy / side-load)  │
                 │ revoked     registry says this version is bad  │
                 │ tampered    signature/checksum FAILED          │
                 └──────────────────────────────────────────────┘
```

The two axes are independent. Every third-party plugin — verified or not —
remains `untrusted` and goes through the identical
`buildPluginContext` → `effectiveGrants` → guard / isolation path. **There is no
"verified ⇒ trusted" promotion.**

What verification status *does* change:

| Status | Capability grants | UI treatment | Install default |
|--------|-------------------|--------------|-----------------|
| `verified` | No change. Still deny-by-default; user grants. | Green "Verified" badge + publisher + provenance. | Install allowed; consent dialog pre-fills publisher info. **No capability pre-granted.** |
| `signed` | No change. | Neutral "Signed by `<identity>`" badge; "not in the Verql registry" note. | Install allowed with a slightly stronger consent prompt. |
| `unverified` | No change. | Amber "Unverified" badge. | Allowed **only** behind the existing install + an explicit "I understand" acknowledgement (and/or dev mode, §7). |
| `revoked` | n/a (install blocked) | Red "Revoked" banner with the registry's reason. | Install **blocked** by default; already-installed plugins are flagged and recommended for removal. |
| `tampered` | n/a (install blocked) | Red "Verification failed" error. | Install **blocked**, hard fail. No override (a failed signature is never "probably fine"). |

This keeps the design honest: the recommendation (per the task brief and the
doc's tone) is that **verified status informs the human, never the gate**.

---

## 4. Signing scheme

### 4.1 Choice & rationale

**Primary: Sigstore / cosign keyless with OIDC, identical to the app's release
flow.** [`release.yml`](../../.github/workflows/release.yml) already does
`cosign sign-blob --yes` keyless (short-lived OIDC cert, Fulcio + Rekor, no
long-lived key), and [`publish-sdk.yml`](../../.github/workflows/publish-sdk.yml)
emits npm provenance via OIDC. Reusing this means:

- Plugin authors who build in GitHub Actions get keyless signing for free — no
  key to store or rotate; the signer identity is their workflow's OIDC subject
  (e.g. `https://github.com/acme/verql-plugin-foo/.github/workflows/release.yml@refs/tags/v1.2.3`).
- Verification is *transparency-log-backed*: the signature is recorded in Rekor,
  giving an independent, tamper-evident timestamp.
- One toolchain (`cosign`, `sigstore-js`) across app + SDK + plugins.

**Alternative for authors who can't/won't use OIDC CI: minisign / ed25519
detached signatures.** A simple keypair the author generates once
(`minisign -G` / `cosign generate-key-pair`). The author's public key is
recorded in the registry entry (and optionally pinned by the user). This covers
solo authors building locally and air-gapped scenarios. The package format
(§5) carries a `scheme` discriminator so both coexist.

| Property | cosign keyless (primary) | minisign / ed25519 (alternative) |
|----------|--------------------------|-----------------------------------|
| Key management | None (ephemeral OIDC) | Author holds a private key |
| Identity | OIDC subject (CI workflow / email) | Bare public key (TOFU or registry-pinned) |
| Transparency log | Yes (Rekor) | No (just the detached sig) |
| Offline verify | Yes (with bundled Rekor checkpoint) | Yes |
| Best for | CI-published plugins | Solo / local / air-gapped authors |

### 4.2 What exactly is signed

Not the raw tarball bytes directly (which makes per-file inspection and reproducible
diffs hard). Instead:

1. Build a **canonical checksum manifest** `verql-plugin.sum` — a sorted,
   newline-delimited list of `sha256  <relative-path>` for **every file in the
   package except the signature/manifest files themselves**, using normalized
   (forward-slash, no leading `./`) paths and a stable sort. This is the same
   shape as the app's `sha256sums.txt`.
2. Compute the **package digest** = `sha256(verql-plugin.sum)`. This single
   digest transitively covers every file.
3. **Sign the package digest** (cosign `sign-blob` over `verql-plugin.sum`, or
   an ed25519 detached signature of it).

Signing the *manifest of hashes* (rather than a tarball) means verification can
(a) confirm each extracted file matches, catching partial tampering precisely,
and (b) be independent of tar/zip nondeterminism. The registry additionally
pins `sha256(the distributed archive)` so the *transport* is also integrity-checked
before extraction.

### 4.3 File layout inside the package

A `.vqlplugin` is a gzipped tar (`.tar.gz`) with a single top-level plugin
directory (matching what `installFromZip` already tolerates):

```
acme-foo-1.2.3.vqlplugin   (tar.gz)
└── verql-plugin-foo/
    ├── plugin-manifest.json      # existing manifest (unchanged shape)
    ├── index.js                  # main, etc.
    ├── ...plugin files...
    └── .verql/                   # signing sidecar (NEW, normative)
        ├── verql-plugin.sum      # canonical checksum manifest (§4.2)
        ├── signature.json        # the signature + provenance block (§5)
        ├── verql-plugin.sum.sig  # cosign/ed25519 signature of .sum
        └── verql-plugin.sum.pem  # cosign cert (keyless only)
```

The `.verql/` directory is **excluded** from `verql-plugin.sum` (a manifest
cannot hash its own signature). Everything else under the plugin root is
included. The path-traversal, symlink, and name guards in `plugin-host.ts`
continue to apply to the extracted tree unchanged.

### 4.4 Key management for authors

- **Keyless (recommended):** nothing to manage. The GitHub Action (§10) does
  `cosign sign-blob` with the workflow's OIDC token. The verifiable identity is
  the workflow ref; authors publish that identity in their registry entry once.
- **Key-based:** author runs `verql-plugin keygen`, stores the private key in CI
  secrets (or locally), and registers the public key. Rotation = publish a new
  public key in the registry entry and re-sign future versions; old versions stay
  verifiable against the old key recorded for those versions.

### 4.5 Offline vs online verification

- **Signature (offline-capable).** cosign keyless can verify offline if the
  package ships its Rekor inclusion proof / a bundled trusted-root + the cert,
  using `cosign verify-blob --offline` semantics; ed25519 verifies offline
  trivially. Verql ships a pinned Sigstore trusted root (refreshed with app
  updates) so signature verification never *requires* network.
- **Provenance (offline-capable).** The `provenance` block is inside the signed
  payload, so it's verified as part of the signature.
- **Registry status (online; degrades gracefully).** "Is this name/version
  listed?" and "is it revoked?" need the index. With a cached index, answer from
  cache and show its age. With no index at all, mark status `signed` (not
  `verified`) and require explicit override (§7).

---

## 5. Package format (`.vqlplugin`)

A `.vqlplugin` is a `.tar.gz` whose normative contents are §4.3. The two new
files are `verql-plugin.sum` and `signature.json`.

**`verql-plugin.sum`** (canonical, signed):

```
3b1f...e9  index.js
a07c...11  lib/driver.js
9f22...0d  plugin-manifest.json
```

**`signature.json`** (the signature + provenance envelope):

```json
{
  "schemaVersion": 1,
  "package": {
    "name": "verql-plugin-foo",
    "version": "1.2.3",
    "sumDigest": "sha256:7d9f0c2e...b4",
    "sumAlgorithm": "sha256"
  },
  "signature": {
    "scheme": "cosign-keyless",
    "blob": "verql-plugin.sum",
    "sig": "MEUCIQ...==",
    "certificate": "-----BEGIN CERTIFICATE-----\n...",
    "rekor": {
      "logIndex": 123456789,
      "inclusionProof": true
    },
    "identity": {
      "issuer": "https://token.actions.githubusercontent.com",
      "subject": "https://github.com/acme/verql-plugin-foo/.github/workflows/release.yml@refs/tags/v1.2.3"
    }
  },
  "provenance": {
    "builder": "github-actions",
    "sourceRepo": "https://github.com/acme/verql-plugin-foo",
    "sourceRef": "refs/tags/v1.2.3",
    "commit": "abc123def4567890abc123def4567890abc123de",
    "buildInvocationUrl": "https://github.com/acme/verql-plugin-foo/actions/runs/987654321",
    "builtAt": "2026-05-30T12:34:56Z"
  }
}
```

For the **key-based** alternative, `signature.scheme` is `"ed25519"`,
`certificate`/`rekor` are omitted, and `identity` carries the author's public
key fingerprint:

```json
{
  "signature": {
    "scheme": "ed25519",
    "blob": "verql-plugin.sum",
    "sig": "base64-ed25519-sig",
    "identity": { "publicKey": "RWQ...minisign-or-raw-ed25519-pubkey" }
  }
}
```

The on-disk `.verql/verql-plugin.sum.sig` / `.pem` are the raw cosign outputs;
`signature.json` is the structured, schema-versioned envelope the host reads.
(They are redundant by design — `signature.json` is canonical for the host;
`.sig`/`.pem` let `cosign verify-blob` be run by hand.)

---

## 6. Registry design

A **trusted index of known plugins**, hosted as a **signed static index in a Git
repo / GitHub Releases**, consistent with the existing
[`homebrew-bump.yml`](../../.github/workflows/homebrew-bump.yml) tap pattern
(`arshad-shah/homebrew-verql`). Proposed repo: `arshad-shah/verql-registry`.

### 6.1 Layout

```
verql-registry/
├── index.json            # top-level: schemaVersion, generatedAt, plugins[]
├── index.json.sig        # cosign signature of index.json (registry key)
├── index.json.pem        # cosign cert
└── plugins/
    └── verql-plugin-foo.json   # per-plugin detail (versions, provenance, yanks)
```

`index.json` is a compact discovery list; per-plugin files hold the full version
history so the top index stays small.

### 6.2 Index schema

**`index.json`** (one row per plugin):

| Field | Type | Notes |
|-------|------|-------|
| `schemaVersion` | int | Index format version. |
| `generatedAt` | ISO-8601 | For staleness display. |
| `plugins[].name` | string | `^[a-z0-9-]+$`, authoritative. |
| `plugins[].displayName` | string | |
| `plugins[].description` | string | |
| `plugins[].publisher` | object | `{ id, issuer?, publicKey?, displayName }` — the identity bound to this name. |
| `plugins[].latest` | semver | Recommended version. |
| `plugins[].detail` | string | Path to `plugins/<name>.json`. |
| `plugins[].deprecated` | bool? | Whole-plugin deprecation. |

**`plugins/<name>.json`** (per-version):

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | |
| `publisher` | object | Same identity as the index; verified against the package signature's identity. |
| `versions[].version` | semver | |
| `versions[].dist.url` | url | Where the `.vqlplugin` lives (e.g. a GitHub Release asset). |
| `versions[].dist.sha256` | hex | Hash of the **archive** (transport integrity). |
| `versions[].sumDigest` | `sha256:...` | The signed `verql-plugin.sum` digest (matches `signature.json`). |
| `versions[].signature` | object | Copy of `signature.json.signature` (so the client can verify before download is even unpacked). |
| `versions[].provenance` | object | Copy of `signature.json.provenance`. |
| `versions[].permissions` | string[] | Declared manifest permissions, surfaced pre-install. |
| `versions[].minVerqlVersion` | semver? | Compatibility floor. |
| `versions[].yanked` | object? | `{ at, reason, severity: "low"|"high"|"critical" }` if revoked. |
| `versions[].publishedAt` | ISO-8601 | |

### 6.3 Hosting, fetch, caching, offline

- **Hosting:** static files in the registry repo's `main` (raw GitHub content)
  and/or mirrored to a GitHub Pages / release asset. No server to run, mirroring
  the tap model. The repo is the source of truth; CI keeps it updated (§10).
- **Trust root:** Verql ships the registry's signing identity (the cosign
  workflow subject for `verql-registry`) pinned in the app. The client verifies
  `index.json.sig` against this pinned root, so a swapped/MITM'd index is
  rejected. The registry signer is *distinct* from any plugin author's key.
- **Fetch + cache:** client GETs `index.json` (+ `.sig`/`.pem`), verifies, and
  caches under `userData/registry-cache/` with an ETag and a TTL (e.g. 6h).
  Per-plugin detail files are fetched lazily and cached.
- **Offline behavior:** if the index can't be refreshed, use the cache and show
  its age; if there is no cache at all, registry-dependent status downgrades from
  `verified` to `signed` and revocation checks are reported as "could not
  confirm". Signature/provenance verification is unaffected (offline-capable,
  §4.5).

### 6.4 Revocation / yanking

- A maintainer adds `yanked: { at, reason, severity }` to the offending
  version(s) in `plugins/<name>.json` and republishes the signed index. (For a
  compromised *publisher key*, yank the whole publisher or all affected
  versions.)
- **At install:** a yanked version is `revoked` → blocked by default (§7).
- **On startup / periodic check:** the client re-reads the index and, if an
  **already-installed** version is now yanked, raises a notification (via the
  existing `notificationBus`) and flags the plugin in the UI with the yank
  reason + severity, recommending disable/uninstall. `critical` severity may
  auto-disable the plugin pending user action (configurable).
- Yanking is reversible (remove the field) for false positives.

---

## 7. Verification flow at install

The verifier is a new module, `src/main/plugins/verify/` (e.g.
`verify-package.ts`), invoked from `installFromPath` / `installFromZip` in
[`plugin-host.ts`](../../src/main/plugins/plugin-host.ts) **after** the bytes are
extracted to the temp dir and **before** they are copied into the plugin dir.

### 7.1 Where it hooks in

Today `installFromZip` extracts to a temp dir and calls `installFromPath`, which
runs the symlink scan + name validation, then `fs.cpSync` into
`pluginDir/<name>`. The new step slots in right before the copy:

```
installFromZip(zip)
  └─ extract to tmp  (future: in-process extraction, roadmap item 3)
       └─ installFromPath(tmp)
            ├─ name validation                      (existing)
            ├─ bundled-name-shadowing guard         (existing)
            ├─ findSymlink() rejection              (existing)
            ├─► verifyPackage(tmp, opts)            (NEW)   ← §7.2
            │      → { status, publisher, provenance, reason? }
            ├─ enforcePolicy(status, opts)          (NEW)   ← §7.3
            ├─ fs.cpSync → pluginDir/<name>         (existing)
            └─ persist verification record          (NEW)   ← §8
```

`installFromPath` gains an `opts: { allowUnsigned?: boolean; source?: 'registry'
| 'file' | 'dev' }` parameter. Registry-driven installs (a future
`plugins:install-from-registry`) pass the registry entry so the verifier can
cross-check the archive `sha256` and the signed `sumDigest`.

### 7.2 Order of checks (fail-closed)

1. **Archive checksum** (registry installs only) — `sha256(archive)` must equal
   `dist.sha256` from the signed registry entry. Mismatch → `tampered`, abort.
2. **Checksum manifest** — recompute `sha256` of every extracted file and
   compare to `.verql/verql-plugin.sum`; recompute `sha256(verql-plugin.sum)`
   and compare to `signature.json.package.sumDigest`. Any mismatch / missing
   file / extra unlisted file → `tampered`, abort.
3. **Signature** — verify `signature.sig` over `verql-plugin.sum` per
   `scheme` (cosign keyless against the pinned Sigstore root, or ed25519 against
   the recorded public key). Failure → `tampered`, abort.
4. **Provenance** — confirm the signed `provenance` block is present and, for
   registry installs, matches the registry entry's `provenance` (repo/commit).
   Mismatch → `signed` but **not** `verified`; warn.
5. **Registry status** — look up `name@version` in the (cached) index:
   - listed + identity matches signature + not yanked → `verified`.
   - listed but yanked → `revoked`.
   - identity mismatch (the signer is not the registered publisher) → treat as
     **typosquat/impersonation** → block with a clear error.
   - not listed / index unavailable → `signed`.

### 7.3 Failure handling & policy

| Result | Default policy | Override |
|--------|----------------|----------|
| `tampered` | **Hard block.** No override. | None — a broken signature is never "probably fine". |
| `revoked` | Block. | Allowed only via dev mode (§ below) with a prominent warning; never the default. |
| identity mismatch | Block. | Same as revoked. |
| `signed` (no registry / not listed) | Allowed with a stronger consent acknowledgement. | `allowUnsigned` not needed (it *is* signed). |
| `unverified` (no `.verql/` at all) | Allowed **only** with explicit acknowledgement and/or dev mode. | `allowUnsigned: true`. |

### 7.4 Unsigned / locally-developed plugins (dev mode)

Plugin authors iterate on an unsigned folder; we must not break that.

- A new setting **`plugins.requireSignature`** (default for the rollout phase,
  §11). When `false`, unsigned plugins install as `unverified` after an
  acknowledgement. When `true`, unsigned installs require an explicit per-install
  override.
- A **`plugins.devMode`** setting (off by default) treats a configured
  development directory (or any `install-from-path` of a folder) as `unverified`
  + allowed without ceremony — the same affordance as today's drag-a-folder flow,
  but clearly labelled "development install, not verified". Dev mode never
  auto-grants capabilities and is visually distinct in the UI.
- Discovery of *already-installed* unsigned plugins (legacy) keeps working; they
  load as `unverified` and are badged accordingly (backwards compat, §11).

---

## 8. IPC + data-model changes

### 8.1 Manifest / loaded-plugin fields

No change to `plugin-manifest.json` (signing data lives in `.verql/`, not the
manifest). The in-memory `LoadedPlugin` (`src/main/plugins/types.ts`) gains:

```ts
interface PluginVerification {
  status: 'verified' | 'signed' | 'unverified' | 'revoked' | 'tampered'
  scheme?: 'cosign-keyless' | 'ed25519'
  publisher?: { id: string; displayName?: string; issuer?: string; publicKey?: string }
  provenance?: {
    sourceRepo?: string; sourceRef?: string; commit?: string;
    buildInvocationUrl?: string; builtAt?: string
  }
  registry?: { listed: boolean; indexAge?: number; yanked?: { reason: string; severity: string } }
  verifiedAt: string          // when the host last verified
  reason?: string             // human-readable detail for failures
}

interface LoadedPlugin {
  // ...existing...
  verification?: PluginVerification
}
```

The verification record is computed at install and **persisted** (e.g. in config
under `pluginVerification[name]`) so it survives restart without re-running
crypto on every boot; it is **re-checked against the registry** for revocation on
startup (cheap; just a status lookup), and re-computed fully if the package files
change on disk.

### 8.2 IPC channels (`shared/ipc.ts` / `src/main/ipc/plugins.ts`)

Changed:

| Channel | Change |
|---------|--------|
| `plugins:list` | Each entry gains `verification: PluginVerification \| undefined`. Renderer types in [`PluginDetailView.tsx`](../../src/renderer/src/components/plugins/PluginDetailView.tsx) and `PluginsPanel` extend to read it. |
| `plugins:install-from-path` / `plugins:install-from-zip` | Accept an `opts` arg (`{ allowUnsigned?, acknowledgeUnverified? }`) and return the computed `verification` in the result so the install UI can render the consent dialog. |

New:

| Channel | Purpose |
|---------|---------|
| `plugins:registry:list` | Return the cached/fetched registry index for discovery/search. |
| `plugins:registry:refresh` | Force-refresh + re-verify the signed index; returns age + signer. |
| `plugins:install-from-registry` | Install `name@version` from the registry: download → verify archive `sha256` → verify signature/provenance → install. |
| `plugins:verify` | Re-run verification for an installed plugin on demand (UI "re-check" button). |
| `plugins:registry:check-revocations` | Cross-check installed plugins against the index; returns any newly-yanked ones (also run on startup). |

Naming follows the existing `domain:action` convention. Permission gating for
these handlers follows the existing `ipc.ts` pattern; none of them grant a plugin
anything.

---

## 9. UI / UX

All additive to existing components.

### 9.1 Install-time consent dialog

`InstallPluginTab.tsx`
([path](../../src/renderer/src/components/plugins/InstallPluginTab.tsx)) currently
installs immediately on drop/browse. Add a **verification + consent step**
between selecting the file and committing the install:

- Run install in "verify-only / dry-run" mode (extract + verify to temp, no
  copy), then show a dialog summarizing:
  - **Status badge** (Verified / Signed / Unverified / Revoked / Tampered).
  - **Publisher** (display name + identity / OIDC subject or key fingerprint).
  - **Provenance** (source repo + commit + build link), when present.
  - **Declared permissions** (reuse the `PERMISSION_INFO` rendering from the
    Permissions tab) so capability asks are visible *before* install.
  - For `unverified`/`signed`: an explicit acknowledgement checkbox.
  - For `revoked`/`tampered`: a blocking error state (no "install anyway" on
    `tampered`).
- The existing error box already handles failure text; extend it for the
  blocked-by-verification cases.

### 9.2 Verification badge in `PluginDetailView`

In the header of
[`PluginDetailView.tsx`](../../src/renderer/src/components/plugins/PluginDetailView.tsx),
next to the existing status `Badge` and "Built-in" badge, add a **verification
badge** driven by `plugin.verification.status`:

| Status | Badge variant | Label |
|--------|---------------|-------|
| `verified` | `success` | "Verified" |
| `signed` | `info` | "Signed" |
| `unverified` | `warning` | "Unverified" |
| `revoked` | `error` | "Revoked" |
| `tampered` | `error` | "Verification failed" |

Add a **"Provenance"** section/card to the Overview tab (or a new sub-tab)
showing publisher, source repo + commit (linkified), build URL, transparency-log
index (Rekor), and "last verified" time, plus a **Re-verify** button calling
`plugins:verify`. For `revoked`, show an `Alert variant="error"` with the yank
reason + severity and an uninstall CTA. This mirrors the existing
`STATE_CONFIG`/`Badge` patterns already in the file.

### 9.3 What users see for unsigned / unverified / revoked

- **Unverified:** amber badge, an Overview note "This plugin is not signed; Verql
  can't confirm who published it or that it wasn't modified," and the standard
  Permissions warning. Installed only after acknowledgement.
- **Signed-but-not-listed:** neutral "Signed by `<identity>`" with "Not in the
  Verql registry."
- **Revoked:** red banner on detail view + a notification on startup; the plugin
  list shows a red marker. Behaviour for already-installed revoked plugins is
  configurable (warn vs auto-disable on `critical`).
- **Registry browser (optional, later):** a new "Discover" surface listing
  `plugins:registry:list` results with verified badges and one-click
  `plugins:install-from-registry`.

---

## 10. Release / CI changes

### 10.1 Author tooling — `verql-plugin` CLI (in the SDK)

Extend the published `@verql/plugin-sdk` (`packages/plugin-sdk/`) with a thin CLI
(or a sibling `@verql/plugin-cli`) exposing:

```bash
# Produce the canonical checksum manifest + .vqlplugin archive
verql-plugin pack ./dist            # → acme-foo-1.2.3.vqlplugin + .verql/verql-plugin.sum

# Sign (keyless in CI, or with a local key)
verql-plugin sign acme-foo-1.2.3.vqlplugin --keyless           # cosign + OIDC
verql-plugin sign acme-foo-1.2.3.vqlplugin --key ./author.key  # ed25519

# Verify locally (same code path the host uses)
verql-plugin verify acme-foo-1.2.3.vqlplugin

# Generate a key for the key-based scheme
verql-plugin keygen
```

`pack`/`sign`/`verify` share the verifier implementation with the host (publish
the pure-JS pieces from `src/main/plugins/verify/` through the SDK barrel, kept
electron-free like the rest of the SDK; update the `sdk-public-surface` test).

### 10.2 Author publish workflow (analogous to `publish-sdk.yml`)

A reusable GitHub Action authors drop into their plugin repo:

```yaml
# .github/workflows/publish-plugin.yml (author's repo)
on: { push: { tags: ['v*.*.*'] } }
permissions: { contents: write, id-token: write }   # id-token for cosign keyless
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile && pnpm build
      - run: npx @verql/plugin-cli pack ./dist
      - uses: sigstore/cosign-installer@v3
      - run: npx @verql/plugin-cli sign *.vqlplugin --keyless   # writes .verql/* + signature.json
      - uses: softprops/action-gh-release@v2                    # attach .vqlplugin as a release asset
        with: { files: '*.vqlplugin' }
      # Optional: open a PR against verql-registry (§10.3)
      - run: npx @verql/plugin-cli registry-submit *.vqlplugin --repo arshad-shah/verql-registry
```

This mirrors `publish-sdk.yml` (OIDC `id-token: write`, tag-triggered, fork
guard) and `release.yml`'s cosign step exactly.

### 10.3 Registry index update (analogous to `homebrew-bump.yml`)

Two viable models:

1. **PR-based (recommended for trust):** `registry-submit` opens a PR against
   `verql-registry` adding the new version row + provenance. A maintainer (or an
   automated check verifying the signature + that the publisher identity matches
   the existing entry) merges it. Index regeneration + signing happens in the
   registry repo's own CI, exactly like the tap bump is a committed change.
2. **Bot-push (like `homebrew-bump.yml`):** a release-published trigger in the
   registry repo downloads the new asset, verifies it, regenerates `index.json`
   + `plugins/<name>.json`, **re-signs the index with cosign keyless**, and
   commits — the direct analogue of the awk-based cask bump, but with a
   verification gate and an index re-sign.

The registry repo's signing identity is what Verql pins as the index trust root
(§6.3). New publishers are onboarded by a maintainer-reviewed PR that records
their identity once; subsequent versions auto-verify against it.

---

## 11. Migration & rollout

Phased, so we never break the existing drag-a-folder flow or already-installed
plugins.

| Phase | `plugins.requireSignature` | Behaviour | Goal |
|-------|----------------------------|-----------|------|
| **0 — Plumbing (no user-visible gate)** | n/a | Land the verifier, package format, `.verql/` reader, `verification` field, and badges. Everything installs as today; unsigned = `unverified` badge only. Ship the CLI + author Action. | De-risk the crypto + UI without changing install policy. |
| **1 — Verify-but-warn** | `false` | Verify on install; show status + provenance + consent dialog. `tampered`/`revoked` blocked; `unverified`/`signed` allowed (with acknowledgement). Stand up the registry, seed it with the first signed plugins. | Build the ecosystem; teach users to read the badge. |
| **2 — Verify-by-default-with-override** | `true` (default) | Unsigned installs require explicit per-install override / dev mode. Registry installs are the happy path. Startup revocation checks active. | Make signed the norm; unsigned the conscious exception. |
| **3 — Required for registry installs** | `true` | The "Discover"/registry install path *only* serves verified plugins; side-loading unsigned is still possible via dev-mode override but loudly flagged. | Strong default for the path most users take. |

**Backwards compatibility:**

- Plugins installed before this feature have no `.verql/` dir → load as
  `unverified` (not blocked) in phases 0–2; in phase 3 they keep running (the gate
  is on *install*, not on already-installed code) but are badged unverified and
  recommended for re-install from a signed source.
- The bundled trust path (`path === '<bundled>'`) is never touched; bundled
  plugins never carry `.vqlplugin` signatures.
- `plugins.requireSignature` / `plugins.devMode` are user-overridable so power
  users and authors are never locked out.

---

## 12. Open questions & alternatives considered

- **Keyless vs key-based as the primary.** Keyless (cosign/OIDC) is chosen for
  consistency with the app's own pipeline and zero key management, but it
  *requires* CI and ties identity to an OIDC subject that can look opaque to
  users ("is `refs/tags/v1.2.3` the right thing to trust?"). Key-based is
  simpler to reason about for humans but pushes key custody onto authors. We ship
  both; the open question is which to *default* the tooling to and how to render
  an OIDC subject as a human-friendly publisher name (likely a registry-curated
  `displayName`).
- **Centralized vs decentralized registry.** A single `verql-registry` is simple
  and matches the Homebrew-tap precedent, but it's a trust and availability
  chokepoint. Alternatives: multiple user-configurable indexes (like apt
  sources), or no index at all (pure TOFU on author keys). We propose
  centralized-but-signed first, with the index format designed so additional
  indexes are a later config option.
- **TUF (The Update Framework).** TUF would address the "who signs the index /
  key compromise / rollback" problems more rigorously (role separation,
  threshold keys, snapshot/timestamp metadata) than a single cosign-signed
  index. It is heavier to operate. Open question: adopt TUF for the index from
  the start, or start with a single signed index and migrate if the threat
  warrants. The package-level signature (§4) is independent of this choice.
- **Reproducible builds.** Provenance binds to a commit, but without reproducible
  builds we can't *prove* the artifact came from that commit's source. Worth
  pursuing for high-trust plugins; out of scope for v1.
- **Where to store the verification record.** Config vs a sidecar file in the
  plugin dir. Config (proposed) avoids trusting on-disk plugin files for their
  own verdict; the tradeoff is keeping it consistent if files change underneath.
- **Auto-disable on `critical` revocation.** Strong protection vs surprising the
  user by disabling a plugin they're mid-task with. Proposed configurable,
  default warn-only except `critical`.
- **Windows extraction.** This proposal assumes roadmap item 3 (in-process,
  cross-platform extraction) lands first or alongside, so we own the temp-dir
  bytes before verifying. Verifying after a shell-out `unzip` is possible but
  weaker; sequence accordingly.

---

## 13. Testing strategy

Unit/integration tests, co-located with the existing audit suite under
`tests/unit/audit/` and a new `tests/unit/verify/`:

**Package verification (pure, no Electron):**
- `verify-valid-package` — a correctly packed + signed `.vqlplugin` verifies to
  `signed`/`verified`.
- `verify-tampered-file` — flip one byte in a listed file → `tampered`, install
  blocked.
- `verify-extra-unlisted-file` — a file not in `verql-plugin.sum` → `tampered`.
- `verify-missing-file` — a listed file removed → `tampered`.
- `verify-bad-signature` — corrupt `sig` → `tampered`, hard block, no override.
- `verify-sum-digest-mismatch` — `signature.json.sumDigest` ≠
  `sha256(verql-plugin.sum)` → `tampered`.
- both schemes: cosign-keyless (mocked Fulcio/Rekor + pinned root) and ed25519.

**Registry:**
- `index-signature-valid/invalid` — index verifies against the pinned root;
  a re-signed-by-wrong-key index is rejected.
- `identity-mismatch` — package signed by an identity ≠ the registered
  publisher → blocked (typosquat case).
- `yanked-version` — install blocked; already-installed → revocation notification
  on startup check.
- `offline-cache` — stale cache used with age reported; no-cache downgrades
  `verified`→`signed`.
- `archive-sha256-mismatch` — registry-install archive hash mismatch → blocked
  before extraction.

**Install integration (extends `plugin-host` install tests):**
- verification runs **after** symlink/name guards and **before** copy.
- `requireSignature=false` (phase 1): unsigned installs as `unverified` with
  acknowledgement; `requireSignature=true` (phase 2): unsigned blocked without
  override.
- dev-mode folder install bypasses signing but never auto-grants capabilities.
- **Trust invariant (key test):** a `verified` third-party plugin is still
  `untrusted` — `buildPluginContext` gives it the granted∩declared set, an
  ungranted enforced capability still throws `PermissionDeniedError`, and an
  isolatable verified plugin still runs in the worker. (Mirrors the existing
  `plugin-permissions` / `isolated-plugin` tests; this is the regression guard
  for non-goal N1/N2.)

**CLI:**
- `pack`→`sign`→`verify` round-trips; `verify` rejects a hand-modified archive;
  CLI verifier and host verifier agree on every fixture (shared implementation).

---

## See also

- [`../plugin-security.md`](../plugin-security.md) — the current trust boundary,
  capability model, install hardening, and process isolation (this is roadmap
  item 4 there).
- [`../plugins.md`](../plugins.md) — contribution surfaces and authoring.
- [`../architecture.md`](../architecture.md) — the plugin model in context.
- [`../sdk/README.md`](../sdk/README.md) — the published `@verql/plugin-sdk` that
  the proposed `verql-plugin` CLI would extend.
- Existing supply-chain precedent: [`release.yml`](../../.github/workflows/release.yml)
  (cosign keyless + SBOM), [`publish-sdk.yml`](../../.github/workflows/publish-sdk.yml)
  (OIDC provenance), [`homebrew-bump.yml`](../../.github/workflows/homebrew-bump.yml)
  (signed static index / bot-bump pattern).
