// Cross-platform `pnpm dev` launcher.
//
// On Windows, terminals frequently default to a legacy OEM code page (e.g. 437 /
// 850), so the UTF-8 bytes that electron-vite / vite print for glyphs like `✓`
// render as mojibake (`Ô£ô`). `chcp 65001` switches the *shared console* to
// UTF-8 before the dev server starts, fixing all subsequent output. On macOS /
// Linux there's nothing to do — we just spawn electron-vite straight through.
import { spawn, spawnSync } from 'node:child_process'

if (process.platform === 'win32') {
  // chcp.com sets the console output code page for the whole attached console,
  // which the electron-vite child below then inherits. Output is ignored so the
  // "Active code page: 65001" line doesn't clutter the dev log.
  spawnSync('chcp', ['65001'], { stdio: 'ignore', shell: true })
}

const child = spawn('electron-vite', ['dev'], { stdio: 'inherit', shell: true })
child.on('exit', (code) => process.exit(code ?? 0))
child.on('error', (err) => {
  console.error('Failed to start electron-vite:', err)
  process.exit(1)
})
