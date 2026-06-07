# Installing Verql

Verql ships pre-built binaries for macOS, Linux, and Windows. Pick your platform
below.

All downloads are published on the
[GitHub Releases page](https://github.com/arshad-shah/verql/releases).

| Platform | Format | Notes |
|----------|--------|-------|
| macOS | Homebrew cask **or** `.dmg` (Intel + Apple Silicon) | Signed and notarised. |
| Linux | `.AppImage` | Portable, no installer needed. |
| Windows | `.exe` (NSIS installer) | **Unsigned** — SmartScreen will warn the first time. |

[← Back to the User Guide](./README.md)

## macOS

### Option A: Homebrew (recommended)

If you use [Homebrew](https://brew.sh/), this is the easiest path and keeps Verql
up to date alongside your other tools:

```bash
brew install --cask verql
```

The cask `verql` lives in the tap `arshad-shah/homebrew-verql`; Homebrew resolves
the tap automatically. To update later:

```bash
brew upgrade --cask verql
```

### Option B: Download the `.dmg`

1. Download the `.dmg` for your chip (Intel or Apple Silicon) from the
   [Releases page](https://github.com/arshad-shah/verql/releases).
2. Open the `.dmg` and drag **Verql** into your Applications folder.
3. Launch it from Applications.

The macOS build is signed and notarised, so Gatekeeper should let it open
normally. If you do see a warning, see
[Troubleshooting → macOS Gatekeeper](./troubleshooting.md#macos-gatekeeper).

## Linux

1. Download the `.AppImage` from the
   [Releases page](https://github.com/arshad-shah/verql/releases).
2. Make it executable and run it:

   ```bash
   chmod +x verql-*.AppImage
   ./verql-*.AppImage
   ```

An AppImage is self-contained — there's nothing to install and nothing to
uninstall beyond deleting the file. To get a launcher entry and desktop
integration, tools like [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher)
can register it for you.

## Windows

1. Download the `.exe` (NSIS installer) from the
   [Releases page](https://github.com/arshad-shah/verql/releases).
2. Run it and follow the installer.

> **Heads up: the Windows build is unsigned.** The first time you run the
> installer, Microsoft Defender SmartScreen will likely show a blue
> "Windows protected your PC" warning. This is expected for an unsigned app — it
> does not mean the file is malicious. To proceed, click **More info**, then
> **Run anyway**. To be sure you have a genuine download, verify the checksum as
> described below. See also
> [Troubleshooting → Windows SmartScreen](./troubleshooting.md#windows-smartscreen).

## Verifying your download

Each release publishes a `sha256sums.txt` listing the checksum of every asset,
plus a detached GPG signature `sha256sums.txt.sig`. Verifying is a two-step check:
first confirm the checksum file is genuinely signed, then confirm your download
matches its listed checksum.

```bash
# Download your asset, sha256sums.txt, and sha256sums.txt.sig from the release page,
# then from the folder containing all three:

# 1. Verify the checksum file's GPG signature
gpg --verify sha256sums.txt.sig sha256sums.txt

# 2. Verify your downloaded asset against the checksum list
sha256sum -c sha256sums.txt --ignore-missing
```

The `--ignore-missing` flag tells `sha256sum` to check only the files you
actually downloaded and skip the rest of the list. You should see `OK` next to
your asset's filename.

> On macOS, `sha256sum` may not be installed by default — use `shasum -a 256 -c`
> in step 2 instead, or install GNU coreutils via Homebrew.

## Keeping Verql updated

How you update depends on how you installed:

- **Homebrew (macOS):** run `brew upgrade --cask verql`. Verql can also detect
  when it's running from a Homebrew-managed install and offer to update from
  inside the app — when you accept, it triggers the `brew upgrade` for you and
  then restarts to apply.
- **`.dmg` / `.AppImage` / `.exe`:** download the newer version from the
  [Releases page](https://github.com/arshad-shah/verql/releases) and reinstall
  over the top.

See [Keeping Verql updated](./updating.md) for the full picture.

---

Next: [Connecting to a database →](./connecting.md)
