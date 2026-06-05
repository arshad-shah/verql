// The only file in this plugin that touches Electron. It adapts Electron's
// main-process `Notification` API to the electron-free `NativeNotifier` the
// dispatcher consumes, so all policy stays testable without Electron.

import { Notification, BrowserWindow } from 'electron'
import type { NativeNotifier, NativeNotificationHandle } from './dispatcher'

export function createElectronNativeNotifier(): NativeNotifier {
  return {
    isSupported() {
      // `Notification` is undefined under the test electron mock; guard for it.
      return typeof Notification !== 'undefined' && Notification.isSupported()
    },

    isAnyWindowFocused() {
      return BrowserWindow.getAllWindows().some((w) => !w.isDestroyed() && w.isFocused())
    },

    focusPrimaryWindow() {
      const win = BrowserWindow.getAllWindows().find((w) => !w.isDestroyed())
      if (!win) return
      if (win.isMinimized()) win.restore()
      win.show()
      win.focus()
    },

    present(opts): NativeNotificationHandle {
      const notification = new Notification({
        title: opts.title,
        body: opts.body ?? '',
        // `urgency` is honoured on Linux; harmless elsewhere.
        urgency: opts.urgency ?? 'normal',
      })
      if (opts.onClick) notification.on('click', opts.onClick)
      notification.show()
      return { close: () => notification.close() }
    },
  }
}
