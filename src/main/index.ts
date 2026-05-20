import { app, BrowserWindow, Menu, nativeImage, type MenuItemConstructorOptions } from 'electron'
import path from 'path'
import fs from 'fs'
import { registerIpcHandlers } from './ipc-handlers'

const isDev = !app.isPackaged
const APP_NAME = 'Nova'
/**
 * Identity used for on-disk storage (`app.getPath('userData')`) and the macOS
 * keychain service that backs `safeStorage`. This MUST stay stable across
 * rebrands — changing it points the app at a new userData dir AND a new
 * keychain entry, which makes previously-encrypted ciphertexts (API keys)
 * undecryptable. Connection passwords stored plainly in config.json survive a
 * rename, but encrypted credentials do not. Keep this constant forever.
 */
const STORAGE_NAME = 'dbstudio'

app.setName(STORAGE_NAME)

/**
 * One-time migration: if a previous build was started under a different
 * `setName` value (e.g. 'Nova' or 'nova'), Electron created a sibling
 * userData directory. Copy any state that landed there back into the
 * canonical STORAGE_NAME directory so the user doesn't lose connections /
 * settings written during the misconfigured window. We skip `credentials.enc`
 * because it was encrypted with the sibling's keychain key and can't be
 * decrypted under STORAGE_NAME — better to fall back to "API key missing"
 * than to overwrite the working ciphertext.
 */
function migrateSiblingUserData(): void {
  try {
    const userDataDir = app.getPath('userData')
    const parent = path.dirname(userDataDir)
    const candidates = ['Nova', 'nova']
    const SKIP = new Set(['credentials.enc'])
    for (const name of candidates) {
      if (name === path.basename(userDataDir)) continue
      const sibling = path.join(parent, name)
      if (!fs.existsSync(sibling)) continue
      for (const entry of fs.readdirSync(sibling)) {
        if (SKIP.has(entry)) continue
        const src = path.join(sibling, entry)
        const dst = path.join(userDataDir, entry)
        // Prefer the newer copy. If both exist and the sibling is newer,
        // keep the canonical one as a `.bak` so nothing is silently lost.
        try {
          const srcStat = fs.statSync(src)
          if (!srcStat.isFile()) continue
          if (fs.existsSync(dst)) {
            const dstStat = fs.statSync(dst)
            if (srcStat.mtimeMs <= dstStat.mtimeMs) continue
            fs.copyFileSync(dst, `${dst}.preMigrate.bak`)
          }
          fs.copyFileSync(src, dst)
        } catch { /* per-file failures are non-fatal */ }
      }
    }
  } catch { /* migration is best-effort */ }
}
migrateSiblingUserData()

function buildAppMenu(): void {
  const template: MenuItemConstructorOptions[] = [
    ...(process.platform === 'darwin'
      ? [
          {
            label: isDev ? `${APP_NAME} (Dev)` : APP_NAME,
            submenu: [
              { role: 'about' as const, label: `About ${APP_NAME}` },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const },
            ],
          },
        ]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Query Tab',
          accelerator: 'CmdOrCtrl+N',
          click: (_, win) => win?.webContents.send('menu:new-query-tab'),
        },
        { type: 'separator' },
        {
          label: 'New Connection',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: (_, win) => win?.webContents.send('menu:new-connection'),
        },
        { type: 'separator' },
        process.platform === 'darwin'
          ? { role: 'close' }
          : { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Command Palette',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: (_, win) => win?.webContents.send('menu:toggle-command-palette'),
        },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(isDev
          ? [
              { type: 'separator' as const },
              { role: 'reload' as const },
              { role: 'forceReload' as const },
              { role: 'toggleDevTools' as const },
            ]
          : []),
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(process.platform === 'darwin'
          ? [
              { type: 'separator' as const },
              { role: 'front' as const },
            ]
          : [{ role: 'close' as const }]),
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: `${APP_NAME} v${app.getVersion()}`,
          enabled: false,
        },
      ],
    },
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

/**
 * Resolves the app icon at runtime.
 *
 * In production the icon is baked in by electron-builder from electron-builder.yml,
 * but in `pnpm dev` we hit Electron's default icon because nothing tells the
 * window where to find ours. We point at `build/icon.png` (the rasterized
 * Nova mark) explicitly so the Dock / taskbar / window match in dev too.
 *
 * Falls back gracefully when the file is missing so a fresh checkout that
 * hasn't run `pnpm build:icons` still launches.
 */
function resolveAppIcon(): Electron.NativeImage | undefined {
  const candidates = [
    path.join(app.getAppPath(), 'build', 'icon.png'),
    path.join(__dirname, '../../build/icon.png'),
    path.join(process.cwd(), 'build', 'icon.png'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return nativeImage.createFromPath(p)
  }
  return undefined
}

function createWindow(): BrowserWindow {
  const title = isDev ? `${APP_NAME} — Dev` : APP_NAME
  const icon = resolveAppIcon()

  const win = new BrowserWindow({
    title,
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 10 },
    backgroundColor: '#0d0d1a',
    icon,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // macOS uses the Dock-level icon, not the per-window icon. Set it once at
  // app boot so the Dock shows the Nova mark during dev too.
  if (process.platform === 'darwin' && icon && app.dock) {
    app.dock.setIcon(icon)
  }

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  return win
}

app.whenReady().then(() => {
  registerIpcHandlers()
  buildAppMenu()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
