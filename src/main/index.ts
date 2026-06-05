import { app, BrowserWindow, Menu, nativeImage, shell, type MenuItemConstructorOptions } from 'electron'
import path from 'path'
import fs from 'fs'
import { registerIpcHandlers } from './ipc-handlers'
import { IPC_EVENTS } from '@shared/ipc'

const isDev = !app.isPackaged
const APP_NAME = 'Verql'
/**
 * Identity used for on-disk storage (`app.getPath('userData')`) and the macOS
 * keychain service that backs `safeStorage`. From v0.1.0 onwards this MUST
 * stay constant — changing it points the app at a new userData dir and a new
 * keychain entry, which makes previously-encrypted ciphertexts (API keys,
 * connection passwords stored as ciphertext in config.json) undecryptable
 * for every existing installation. If a future rebrand is unavoidable, ship
 * a one-shot migration that copies the old `userData/<old-name>` directory
 * to the new path before any read.
 */
const STORAGE_NAME = 'verql'

app.setName(STORAGE_NAME)

// Help-menu destinations. The user guide is the consumer-facing entry point;
// the SDK docs are for developers building plugins.
const GUIDE_URL = 'https://github.com/arshad-shah/verql/tree/main/docs/guide'
const SDK_URL = 'https://github.com/arshad-shah/verql/tree/main/docs/sdk'
const ISSUES_URL = 'https://github.com/arshad-shah/verql/issues'

function buildAppMenu(): void {
  // Populates the native About panel (macOS / Linux). The macOS app menu's
  // `role: 'about'` reads from this; the Help menu links out to the docs.
  app.setAboutPanelOptions({
    applicationName: APP_NAME,
    applicationVersion: app.getVersion(),
    copyright: `© ${new Date().getFullYear()} Arshad Shah`,
  })

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
          click: (_, win) => (win as BrowserWindow | undefined)?.webContents.send(IPC_EVENTS.MENU_NEW_QUERY_TAB),
        },
        { type: 'separator' },
        {
          label: 'New Connection',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: (_, win) => (win as BrowserWindow | undefined)?.webContents.send(IPC_EVENTS.MENU_NEW_CONNECTION),
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
          click: (_, win) => (win as BrowserWindow | undefined)?.webContents.send(IPC_EVENTS.MENU_TOGGLE_COMMAND_PALETTE),
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
      role: 'help',
      submenu: [
        {
          label: `${APP_NAME} User Guide`,
          click: () => { void shell.openExternal(GUIDE_URL) },
        },
        {
          label: 'Build a Plugin (SDK)',
          click: () => { void shell.openExternal(SDK_URL) },
        },
        {
          label: 'Report an Issue',
          click: () => { void shell.openExternal(ISSUES_URL) },
        },
        { type: 'separator' },
        // Non-macOS has no app menu, so surface About here. On macOS the
        // native About lives in the app menu above.
        ...(process.platform !== 'darwin'
          ? [{ role: 'about' as const, label: `About ${APP_NAME}` }]
          : []),
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
 * Verql mark) explicitly so the Dock / taskbar / window match in dev too.
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
      // Renderer security baseline:
      //   contextIsolation defaults to true since Electron 12
      //   nodeIntegration defaults to false
      //   sandbox: true puts the renderer inside Chromium's OS-level sandbox.
      // The preload script only imports from 'electron' and uses
      // contextBridge.exposeInMainWorld, which is sandbox-compatible.
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  })

  // Defense-in-depth against rogue navigation. Even with contextIsolation
  // and sandbox: true, any link or script that calls window.open() will
  // ask Electron to spawn a new BrowserWindow. We deny those outright —
  // anything that needs to leave the app should open in the user's
  // default browser via shell.openExternal, which the renderer doesn't
  // have access to without an explicit IPC call. Same for in-window
  // navigations to external URLs: we keep the renderer pinned to the
  // bundled assets / dev server.
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('will-navigate', (event, url) => {
    const allowed = isDev && process.env['ELECTRON_RENDERER_URL']
      ? url.startsWith(process.env['ELECTRON_RENDERER_URL']!)
      : url.startsWith('file://')
    if (!allowed) event.preventDefault()
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  return win
}

app.whenReady().then(() => {
  // Set the Dock icon BEFORE creating any window. macOS shows the icon baked
  // into the .app bundle until something overrides it; in dev that's Electron's
  // default icon. Doing this first minimizes the visible swap on launch.
  if (process.platform === 'darwin' && app.dock) {
    const icon = resolveAppIcon()
    if (icon) app.dock.setIcon(icon)
  }

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
