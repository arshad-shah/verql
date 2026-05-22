/**
 * Accelerator-string matcher.
 *
 * Parses Electron-style keybinding strings ("Cmd+Shift+P", "Ctrl+K", …) and
 * checks them against a browser KeyboardEvent. The same string format is used
 * by:
 *   - plugin manifests (`contributes.commands[].keybinding`)
 *   - the in-app settings store (`AppSettings.keybindings`)
 *   - Electron's accelerator parser for native menus
 *
 * One canonical form means the user can rebind a plugin command the same way
 * they rebind a built-in command.
 */

const MAC = typeof navigator !== 'undefined' && navigator.platform.includes('Mac')

export function matchesAccelerator(e: KeyboardEvent, accelerator: string): boolean {
  if (!accelerator) return false
  const parts = accelerator.split('+').map((p) => p.trim().toLowerCase())
  let wantMeta = false
  let wantCtrl = false
  let wantShift = false
  let wantAlt = false
  let key = ''
  for (const part of parts) {
    switch (part) {
      case 'cmd':
      case 'command':
      case 'meta':
        wantMeta = true
        break
      case 'ctrl':
      case 'control':
        wantCtrl = true
        break
      case 'cmdorctrl':
      case 'commandorcontrol':
        if (MAC) wantMeta = true
        else wantCtrl = true
        break
      case 'shift':
        wantShift = true
        break
      case 'alt':
      case 'option':
        wantAlt = true
        break
      default:
        key = part
    }
  }
  if (!key) return false
  if (e.metaKey !== wantMeta) return false
  if (e.ctrlKey !== wantCtrl) return false
  if (e.shiftKey !== wantShift) return false
  if (e.altKey !== wantAlt) return false
  return e.key.toLowerCase() === key
}
