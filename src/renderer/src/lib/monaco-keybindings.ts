import type { Monaco } from '@monaco-editor/react'

/**
 * Parse a "Ctrl+Shift+P" / "Cmd+Enter" style binding into a Monaco keybinding
 * bitmask. Returns 0 if any part of the binding is unrecognised so the caller
 * can drop it instead of producing a broken accelerator.
 */
export function parseKeybinding(key: string, monaco: Monaco): number {
  const parts = key.split('+').map((p) => p.trim().toLowerCase())
  let mods = 0
  let keyCode = 0
  const KC = monaco.KeyCode as unknown as Record<string, number>

  for (const part of parts) {
    if (part === 'ctrl' || part === 'cmd' || part === 'meta') { mods |= monaco.KeyMod.CtrlCmd; continue }
    if (part === 'shift') { mods |= monaco.KeyMod.Shift; continue }
    if (part === 'alt' || part === 'option') { mods |= monaco.KeyMod.Alt; continue }
    if (part === 'winctrl') { mods |= monaco.KeyMod.WinCtrl; continue }

    // The key portion. Drop the binding if we can't resolve it cleanly.
    let code = 0
    if (part.length === 1 && /[a-z]/.test(part)) code = KC[`Key${part.toUpperCase()}`]
    else if (part.length === 1 && /[0-9]/.test(part)) code = KC[`Digit${part}`]
    else if (/^f([1-9]|1[0-9]|2[0-4])$/.test(part)) code = KC[`F${part.slice(1)}`]
    else {
      const named: Record<string, string> = {
        enter: 'Enter', tab: 'Tab', escape: 'Escape', esc: 'Escape',
        space: 'Space', backspace: 'Backspace', delete: 'Delete',
        home: 'Home', end: 'End', pageup: 'PageUp', pagedown: 'PageDown',
        up: 'UpArrow', down: 'DownArrow', left: 'LeftArrow', right: 'RightArrow',
        ',': 'Comma', '.': 'Period', '/': 'Slash', '\\': 'Backslash',
        ';': 'Semicolon', "'": 'Quote', '[': 'BracketLeft', ']': 'BracketRight',
        '-': 'Minus', '=': 'Equal', '`': 'Backquote'
      }
      const mapped = named[part]
      if (mapped) code = KC[mapped]
    }
    if (!code) return 0
    keyCode = code
  }
  return keyCode ? mods | keyCode : 0
}
