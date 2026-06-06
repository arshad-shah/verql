/**
 * Host-platform detection for the renderer.
 *
 * The main process exposes `process.platform` through the preload bridge
 * (`window.electronAPI.platform`). Reading it here — rather than via an IPC
 * round-trip — lets layout decisions (title bar insets, where window controls
 * live) be made synchronously at first paint. Falls back to `'web'` outside
 * Electron (Storybook, unit tests) so components stay renderable there.
 */
type HostPlatform = NodeJS.Platform | 'web'

const detected: HostPlatform =
  (typeof window !== 'undefined' && window.electronAPI?.platform) || 'web'

export const platform = detected
export const isMac = detected === 'darwin'
export const isWindows = detected === 'win32'
export const isLinux = detected === 'linux'
