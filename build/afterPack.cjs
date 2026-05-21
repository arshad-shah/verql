// electron-builder afterPack hook.
//
// Why: with `mac.identity: null`, electron-builder skips signing entirely.
// The Electron prebuild's binaries still carry their original linker-signed
// ad-hoc signatures, but the bundle's resource hashes (Info.plist, app.asar,
// icons) no longer match the seal — macOS rejects the app at launch with
// "damaged and can't be opened" and `spctl` reports
// "code has no resources but signature indicates they must be present".
//
// This hook re-signs the bundle ad-hoc (`codesign -s -`) after electron-builder
// finishes assembling it but before the dmg is created. `--deep` signs every
// nested binary; `--force` overwrites the stale linker signatures so every
// piece ends up with consistent resource hashes and a null Team ID.
//
// Skipped on non-darwin packs.

const { execFileSync } = require("node:child_process");
const path = require("node:path");

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== "darwin") return;

  const appPath = path.join(
    context.appOutDir,
    `${context.packager.appInfo.productFilename}.app`,
  );

  console.log(`[afterPack] ad-hoc re-signing ${appPath}`);
  execFileSync(
    "codesign",
    ["--force", "--deep", "--sign", "-", appPath],
    { stdio: "inherit" },
  );

  console.log("[afterPack] verifying signature");
  execFileSync(
    "codesign",
    ["--verify", "--deep", "--strict", "--verbose=2", appPath],
    { stdio: "inherit" },
  );
};
