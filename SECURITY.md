# Security policy

## Supported versions

Security fixes are applied to the latest release on `main`. Older
releases are not maintained.

| Version | Supported |
|---------|-----------|
| Latest release | ✅ |
| Any earlier release | ❌ |

## Reporting a vulnerability

**Please do not file a public GitHub issue for security bugs.**

Report privately via GitHub's
[private vulnerability reporting](https://github.com/arshad-shah/verql/security/advisories/new)
form. You'll get an acknowledgement within 72 hours.

If you cannot use the GitHub form, email the maintainer at
`shaharshad57@gmail.com` with the subject line `Verql security`. Include:

- A short description of the issue.
- Steps to reproduce.
- The affected version (release tag or commit SHA).
- Your assessment of impact.

## What we'll do

1. Acknowledge receipt within 72 hours.
2. Confirm or dispute the issue within 7 days.
3. Develop a fix, coordinate disclosure timing with you, and credit you
   in the release notes (unless you ask not to be credited).
4. Publish a GitHub Security Advisory once the fix is available.

## Out of scope

- Issues that require physical access to a user's unlocked machine.
- Issues in third-party dependencies that haven't been disclosed by
  the upstream project yet — those go to the upstream maintainer.
- Issues in user-installed external plugins. Each plugin is responsible
  for its own security. (The bundled plugins under
  `src/main/plugins/bundled/` are in scope.)

## Hardening already in place

- Renderer runs with `sandbox: true`, `contextIsolation: true`,
  `nodeIntegration: false`, `webSecurity: true`.
- SQL identifiers go through `quoteIdentifier()` which rejects NUL /
  CR / LF / tab and caps length at 255.
- Secrets are encrypted at rest via Electron's `safeStorage`
  (OS keyring-backed where available).
- `pnpm audit` runs in CI and fails on any high / critical advisory.
- Production releases are built from `main` only, by tag-triggered
  workflow with `permissions: read-all` plus a narrow `contents: write`
  on the release job; signing happens via short-lived OIDC tokens.
