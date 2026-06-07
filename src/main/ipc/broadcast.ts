import { BrowserWindow } from 'electron'
import type { IpcEventMap } from '@shared/ipc'

/**
 * Send a typed broadcast event to every open (non-destroyed) renderer window —
 * the single home for the main → renderer push that IPC handlers and subsystems
 * used to hand-roll as a `BrowserWindow.getAllWindows().forEach(...send)` loop.
 *
 * Typed by `IpcEventMap`, so the payload must match the event's contract: a
 * wrong shape is now a compile error instead of an untyped `webContents.send`.
 */
export function broadcast<E extends keyof IpcEventMap>(event: E, ...payload: IpcEventMap[E]): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(event, ...payload)
  }
}
