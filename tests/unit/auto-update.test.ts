import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// `auto-update.ts` imports `electron` and `electron-updater`, neither of which
// exists in the unit (node/jsdom) environment — mock both so the pure
// detection logic can be exercised in isolation.
const { mockApp } = vi.hoisted(() => ({ mockApp: { isPackaged: true } }))
vi.mock('electron', () => ({ app: mockApp }))
vi.mock('electron-updater', () => ({
  autoUpdater: {
    on: vi.fn(),
    checkForUpdatesAndNotify: vi.fn(() => Promise.resolve(null)),
    logger: null,
  },
}))

import { isElectronUpdaterEnabled } from '../../src/main/updater/auto-update'

const realPlatform = process.platform

function setPlatform(value: NodeJS.Platform): void {
  Object.defineProperty(process, 'platform', { value, configurable: true })
}

function setWindowsStore(value: boolean | undefined): void {
  if (value === undefined) {
    delete (process as { windowsStore?: boolean }).windowsStore
  } else {
    ;(process as { windowsStore?: boolean }).windowsStore = value
  }
}

describe('isElectronUpdaterEnabled', () => {
  beforeEach(() => {
    mockApp.isPackaged = true
    setPlatform('linux')
    delete process.env.APPIMAGE
    delete process.env.SNAP
    delete process.env.APP_UPDATER_ENABLED
    setWindowsStore(undefined)
  })

  afterEach(() => {
    setPlatform(realPlatform)
    delete process.env.APPIMAGE
    delete process.env.SNAP
    delete process.env.APP_UPDATER_ENABLED
    setWindowsStore(undefined)
  })

  it('is enabled for a packaged Linux AppImage', () => {
    process.env.APPIMAGE = '/tmp/Verql-1.1.0.AppImage'
    expect(isElectronUpdaterEnabled()).toBe(true)
  })

  it('is disabled for a Snap install (APPIMAGE unset, SNAP set)', () => {
    process.env.SNAP = '/snap/verql/x1'
    expect(isElectronUpdaterEnabled()).toBe(false)
  })

  it('is enabled for a packaged Windows NSIS build (not the Store)', () => {
    setPlatform('win32')
    setWindowsStore(false)
    expect(isElectronUpdaterEnabled()).toBe(true)
  })

  it('is disabled for the Windows Store (MSIX) build', () => {
    setPlatform('win32')
    setWindowsStore(true)
    expect(isElectronUpdaterEnabled()).toBe(false)
  })

  it('is disabled on macOS (handled by Homebrew)', () => {
    setPlatform('darwin')
    expect(isElectronUpdaterEnabled()).toBe(false)
  })

  it('is disabled in dev (not packaged) even with APPIMAGE set', () => {
    process.env.APPIMAGE = '/tmp/Verql.AppImage'
    mockApp.isPackaged = false
    expect(isElectronUpdaterEnabled()).toBe(false)
  })

  it('APP_UPDATER_ENABLED=1 forces it on regardless of channel', () => {
    setPlatform('darwin')
    mockApp.isPackaged = false
    process.env.APP_UPDATER_ENABLED = '1'
    expect(isElectronUpdaterEnabled()).toBe(true)
  })

  it('APP_UPDATER_ENABLED=0 forces it off even inside an AppImage', () => {
    process.env.APPIMAGE = '/tmp/Verql.AppImage'
    process.env.APP_UPDATER_ENABLED = '0'
    expect(isElectronUpdaterEnabled()).toBe(false)
  })
})
