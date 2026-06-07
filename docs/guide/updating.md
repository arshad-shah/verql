# Keeping Verql updated

Verql is under active development, so new releases land regularly with fixes
and features. Keeping up to date is the best way to get improvements and
security fixes.

[← Back to the User Guide](./README.md)

## How updates work

How you update depends on how you installed Verql:

| Install method | How to update |
|----------------|---------------|
| Homebrew (macOS) | `brew upgrade --cask verql` |
| `.dmg` (macOS) | Download the newer `.dmg` and reinstall |
| `.AppImage` (Linux) | Download the newer `.AppImage` and replace the file |
| `.exe` (Windows) | Download the newer installer and run it over the top |

Releases are published on the
[GitHub Releases page](https://github.com/arshad-shah/verql/releases). Always
[verify your download](./installation.md#verifying-your-download), especially on
Windows where the installer is unsigned.

## Homebrew updates (macOS)

If you installed via Homebrew, updating is just:

```bash
brew upgrade --cask verql
```

Verql can also help from inside the app: when it detects that it's running from a
**Homebrew-managed install**, it can check for a newer version and offer to
update for you. Accepting runs the `brew upgrade --cask verql` for you, and then
you restart Verql to finish applying the update.

> The in-app update mechanism is channel-pluggable, so other distribution
> channels can be wired in over time. For now, the in-app "update for me" flow
> is for Homebrew-managed installs; on other platforms, update by downloading the
> latest release.

## Staying informed

- Watch the [Releases page](https://github.com/arshad-shah/verql/releases) for
  new versions.
- Read the
  [changelog](https://github.com/arshad-shah/verql/blob/main/CHANGELOG.md) to
  see what changed.

> Minor versions can include breaking changes. Skim the changelog before
> upgrading if you depend on specific behaviour.

---

Next: [Troubleshooting →](./troubleshooting.md)
