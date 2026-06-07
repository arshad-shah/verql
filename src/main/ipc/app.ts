import { app } from 'electron'
import type { Handle } from './context'

export function registerAppHandlers(handle: Handle): void {
  handle('app:restart', async () => {
    app.relaunch()
    app.exit(0)
  })

  // Powers the in-app About modal: app version + the runtime versions baked into
  // this build, so users can report exactly what they're running.
  handle('app:about-info', async () => ({
    name: app.getName(),
    version: app.getVersion(),
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
    v8: process.versions.v8,
    os: process.platform,
    arch: process.arch,
  }))
}
