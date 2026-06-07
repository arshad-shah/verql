---
title: Keeping Verql updated
description: Update channels for each install method and how in-app Homebrew upgrades work.
sidebar:
  order: 8
---

Verql is under active development, so new releases land regularly with fixes
and features. Keeping up to date is the best way to get improvements and
security fixes.

[← Back to the User Guide](/guide/)

## How updates work

How you update depends on how you installed Verql:

| Install method | How to update |
|----------------|---------------|
| Microsoft Store (Windows) | Automatic — the Store updates Verql for you |
| Snap (Linux) | Automatic — `snapd` refreshes Verql in the background |
| `.AppImage` (Linux) | **Automatic in-app** — Verql checks on launch, downloads, and installs on quit |
| `.exe` / NSIS (Windows) | **Automatic in-app** — same as the AppImage |
| Homebrew (macOS) | `brew upgrade --cask verql` (Verql notifies you on launch when a new version exists) |
| `.dmg` (macOS) | Download the newer `.dmg` and reinstall |

Direct downloads are published on the
[GitHub Releases page](https://github.com/arshad-shah/verql/releases). Always
[verify your download](/guide/installation/#verifying-your-download), especially on
Windows where the `.exe` is unsigned.

## In-app auto-update (Linux AppImage & Windows `.exe`)

If you installed the **AppImage** (Linux) or the **NSIS `.exe`** (Windows) from
GitHub Releases, Verql updates itself: on launch it checks for a newer release,
downloads it in the background, and applies it the next time you quit. You don't
have to do anything.

## Store updates (Microsoft Store & Snap)

If you installed from the **Microsoft Store** or the **Snap Store**, those
platforms keep Verql up to date automatically on their own schedule — there's
nothing to do, and Verql's in-app updater stays out of the way.

## Homebrew updates (macOS)

If you installed via Homebrew, update with:

```bash
brew upgrade --cask verql
```

Verql helps from inside the app: on launch, a Homebrew-managed install checks for
a newer cask and — if one exists — shows a toast, a notification, a desktop
notification, and a banner in **Settings → Updates**. It doesn't run `brew` for
you automatically; use the command above (or the in-app "update for me" button in
Settings → Updates, which runs it and prompts you to restart).

## Staying informed

- Watch the [Releases page](https://github.com/arshad-shah/verql/releases) for
  new versions.
- Read the
  [changelog](https://github.com/arshad-shah/verql/blob/main/CHANGELOG.md) to
  see what changed.

> Minor versions can include breaking changes. Skim the changelog before
> upgrading if you depend on specific behaviour.

---

Next: [Troubleshooting →](/guide/troubleshooting/)
