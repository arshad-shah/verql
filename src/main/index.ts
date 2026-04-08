import { app, BrowserWindow, Menu, nativeImage, type MenuItemConstructorOptions } from 'electron'
import path from 'path'
import { registerIpcHandlers } from './ipc-handlers'

const isDev = !app.isPackaged
const APP_NAME = 'dbstudio'

// Set the app name so macOS menu bar / dock shows "dbstudio" instead of "Electron"
app.setName(APP_NAME)

// Resolve the icon path — works for both dev and packaged builds
const iconPath = isDev
  ? path.join(process.cwd(), 'build', 'icon.png')
  : path.join(__dirname, '../../build', 'icon.png')

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

function createWindow(): BrowserWindow {
  const title = isDev ? `${APP_NAME} — Dev` : APP_NAME
  const appIcon = nativeImage.createFromPath(iconPath)

  const win = new BrowserWindow({
    title,
    icon: appIcon,
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 10 },
    backgroundColor: '#0d0d1a',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  return win
}

app.whenReady().then(() => {
  // Set macOS dock icon
  if (process.platform === 'darwin') {
    const dockIcon = nativeImage.createFromPath(iconPath)
    if (!dockIcon.isEmpty()) {
      app.dock.setIcon(dockIcon)
    }
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
