import fs from 'fs'
import path from 'path'

/**
 * Write `contents` to `filePath` atomically: write to a sibling temp file, then
 * rename it onto the final path. The rename is atomic on POSIX (and
 * `MoveFileEx`-style on Windows), so a crash mid-write leaves either the old
 * file or the new file fully intact — never a half-written file that fails to
 * parse on next launch (which, for the config and keyring stores, would silently
 * drop every saved profile / credential).
 *
 * Pass `mode` to set the file permissions (e.g. `0o600` for owner-only secret
 * blobs). The parent directory is created if missing.
 */
export function writeFileAtomic(
  filePath: string,
  contents: string,
  opts?: { mode?: number },
): void {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const tmpPath = path.join(dir, `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`)
  try {
    fs.writeFileSync(
      tmpPath,
      contents,
      opts?.mode !== undefined ? { encoding: 'utf-8', mode: opts.mode } : 'utf-8',
    )
    fs.renameSync(tmpPath, filePath)
  } catch (err) {
    try { fs.unlinkSync(tmpPath) } catch { /* ignore — temp file may not exist */ }
    throw err
  }
}
