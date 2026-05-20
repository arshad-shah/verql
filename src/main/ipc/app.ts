import { app } from 'electron'
import type { Handle } from './context'

export function registerAppHandlers(handle: Handle): void {
  handle('app:restart', async () => {
    app.relaunch()
    app.exit(0)
  })
}
