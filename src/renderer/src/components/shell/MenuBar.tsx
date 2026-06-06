import { useEffect, useState } from 'react'
import { IPC_CHANNELS } from '@shared/ipc'

export interface MenuBarItem {
  id: number
  label: string
  enabled: boolean
}

/**
 * The application menu bar (File / Edit / View / …) for the custom title bar on
 * Windows and Linux, where hiding the native frame also hides the native menu
 * bar. Each button pops the *real* native submenu via IPC, so the menu template
 * in the main process stays the single source of truth — we only own the
 * trigger buttons' styling, not the menu contents.
 *
 * Pass `items` to preview in Storybook; otherwise they're fetched over IPC.
 */
export function MenuBar({ items: itemsProp }: { items?: MenuBarItem[] } = {}) {
  const [fetched, setFetched] = useState<MenuBarItem[]>([])
  const items = itemsProp ?? fetched

  useEffect(() => {
    if (itemsProp) return
    window.electronAPI
      ?.invoke(IPC_CHANNELS.WINDOW_MENU_LIST)
      .then((list) => setFetched(list as MenuBarItem[]))
      .catch(() => {})
  }, [itemsProp])

  const openMenu = (id: number, e: React.MouseEvent<HTMLButtonElement>): void => {
    const rect = e.currentTarget.getBoundingClientRect()
    // Pop the native submenu flush under the button's bottom-left corner.
    window.electronAPI?.invoke(IPC_CHANNELS.WINDOW_MENU_POPUP, {
      id,
      x: rect.left,
      y: rect.bottom,
    })
  }

  if (items.length === 0) return null

  return (
    <div className="no-drag flex items-stretch h-full" role="menubar">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          disabled={!item.enabled}
          onClick={(e) => openMenu(item.id, e)}
          className="flex items-center px-2.5 text-xs text-text-secondary transition-colors hover:bg-white/10 hover:text-text-primary disabled:opacity-40 focus-visible:outline-none focus-visible:bg-white/10"
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
