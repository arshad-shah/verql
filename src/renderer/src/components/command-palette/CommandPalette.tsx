import { useState, useEffect, useRef, useMemo, type KeyboardEvent } from 'react'
import { Search } from 'lucide-react'
import { useConnectionsStore } from '@/stores/connections'
import { useTabsStore } from '@/stores/tabs'
import { useUiStore } from '@/stores/ui'
import { useSchemaStore } from '@/stores/schema'
import { useDriverCapabilitiesStore } from '@/stores/driver-capabilities'
import { editorRegistry } from '@/stores/editor'
import { tabActions } from '@/stores/tab-actions'
import { pickDefaultSchema } from '@/lib/pick-default-schema'
import { Input, ScrollArea, Text, Kbd, Box, Flex, Button } from '@/primitives'
import { usePluginUIStore, selectContributions } from '@/stores/plugin-ui'
import { IPC_CHANNELS, IPC_EVENTS } from '@shared/ipc'

interface Command {
  id: string
  title: string
  category?: string
  keybinding?: string
  action: () => void
}

interface PluginCommand {
  pluginId: string
  pluginDisplayName: string
  commandId: string
  title: string
  keybinding?: string
}

interface Props {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [pluginCommands, setPluginCommands] = useState<PluginCommand[]>([])
  // Snapshot of Monaco editor actions exposed at the moment the palette opens.
  // Recomputed each open so a plugin-registered action shows up without a
  // page reload, but stable while the user types so filtering doesn't churn.
  const [editorActions, setEditorActions] = useState<{ id: string; label: string }[]>([])

  const { activeConnectionId, connections, connectedIds } = useConnectionsStore()
  const { addQueryTab, openErDiagram } = useTabsStore()
  const { setActivePanel } = useUiStore()
  const toggleSecondary = useUiStore(s => s.toggleSecondarySidebar)
  const toggleBottom = useUiStore(s => s.toggleBottomDock)
  const setSecondaryActive = useUiStore(s => s.setSecondaryActivePanel)
  const panelContribs = usePluginUIStore(selectContributions('panels'))

  const conn = connections.find(c => c.id === activeConnectionId)
  const isConnected = activeConnectionId && connectedIds.has(activeConnectionId)

  useEffect(() => {
    let cancelled = false
    const load = () => {
      window.electronAPI.invoke(IPC_CHANNELS.PLUGINS_GET_COMMANDS).then((list) => {
        if (!cancelled) setPluginCommands(list)
      }).catch(() => { if (!cancelled) setPluginCommands([]) })
    }
    load()
    const offLifecycle = window.electronAPI.on(IPC_EVENTS.PLUGINS_LIFECYCLE, load)
    return () => { cancelled = true; offLifecycle?.() }
  }, [])

  const commands = useMemo<Command[]>(() => {
    const cmds: Command[] = [
      { id: 'new-query', title: 'New Query Tab', category: 'Query', keybinding: 'Cmd+N', action: () => addQueryTab(activeConnectionId) },
      { id: 'explorer', title: 'Show Explorer', category: 'View', action: () => setActivePanel('explorer') },
      { id: 'show-schema', title: 'Show Schema', category: 'View', action: () => setActivePanel('schema') },
      { id: 'show-plugins', title: 'Show Plugins', category: 'View', action: () => setActivePanel('plugins') },
    ]
    // Editor-aware run commands. Only meaningful when there's a live editor
    // (i.e. the active tab is a query). The palette is the authoritative place
    // to drive the editor, including from plugins that haven't bothered to
    // contribute their own UI.
    if (editorRegistry.get()) {
      cmds.push({
        id: 'editor.runSelection',
        title: 'Run Selected Query',
        category: 'Editor',
        keybinding: 'Cmd+Enter',
        action: () => {
          const reg = editorRegistry.get()
          const sql = editorRegistry.getSelectedSql()
          if (reg && sql) tabActions.runStatement(reg.tabId, sql)
        }
      })
      cmds.push({
        id: 'editor.runAll',
        title: 'Run Entire Buffer',
        category: 'Editor',
        action: () => editorRegistry.runAction('execute-query')
      })
      // Pull Monaco's full action list verbatim. Anything Monaco itself or a
      // future plugin registers (format, fold, find, multi-cursor, …) appears
      // here for free — no per-action wiring.
      for (const a of editorActions) {
        // Skip the few we already surface above to avoid duplicates.
        if (a.id === 'execute-query' || a.id === 'save-query') continue
        cmds.push({
          id: `editor:${a.id}`,
          title: a.label,
          category: 'Editor',
          action: () => editorRegistry.runAction(a.id)
        })
      }
    }
    cmds.push(
      { id: 'toggle-secondary-sidebar', title: 'View: Toggle Secondary Sidebar', category: 'View', keybinding: 'Cmd+Alt+B', action: toggleSecondary },
      { id: 'toggle-bottom-dock', title: 'View: Toggle Bottom Dock', category: 'View', keybinding: 'Cmd+J', action: toggleBottom },
      { id: 'show-inspector', title: 'View: Show Inspector', category: 'View', action: () => setSecondaryActive('inspector') },
      { id: 'show-notifications', title: 'View: Show Notifications', category: 'View', action: () => setSecondaryActive('notifications') },
    )
    for (const c of panelContribs) {
      if (c.meta.location === 'secondary') {
        cmds.push({
          id: `show-secondary-${c.contributionId}`,
          title: `View: Show ${c.meta.title ?? c.contributionId}`,
          category: 'View',
          action: () => setSecondaryActive(`plugin:${c.contributionId}`),
        })
      }
    }
    if (isConnected && conn) {
      cmds.push({
        id: 'er-diagram',
        title: 'Open ER Diagram',
        category: 'Schema',
        action: async () => {
          // Resolve the default schema generically: fetch the live schema
          // list, ask the driver's capability spec which name to prefer, fall
          // back to the first schema if nothing matches. Zero hardcoded
          // db-type branches in this code path.
          const schemas = await useSchemaStore.getState()
            .fetchSchemas(conn.id, conn.database)
          const caps = await useDriverCapabilitiesStore.getState().fetch(conn.type)
          const schema = pickDefaultSchema(caps ?? {}, schemas, conn.database) ?? ''
          openErDiagram(conn.id, schema)
        }
      })
    }
    for (const pc of pluginCommands) {
      cmds.push({
        id: `${pc.pluginId}:${pc.commandId}`,
        title: pc.title,
        category: pc.pluginDisplayName,
        keybinding: pc.keybinding,
        action: () => {
          window.electronAPI.invoke(IPC_CHANNELS.PLUGINS_UI_ACTION, pc.pluginId, pc.commandId, {}).catch(() => {})
        }
      })
    }
    return cmds
  }, [activeConnectionId, isConnected, conn, pluginCommands, editorActions, panelContribs, toggleSecondary, toggleBottom, setSecondaryActive])

  const filtered = useMemo(() => {
    if (!query.trim()) return commands
    const q = query.toLowerCase()
    return commands.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q)
    )
  }, [query, commands])

  useEffect(() => {
    if (open) {
      setEditorActions(editorRegistry.listActions())
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action()
        onClose()
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!open) return null

  return (
    <>
      <Box className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
      <Box className="fixed top-[15%] left-1/2 -translate-x-1/2 z-50 w-[520px] bg-bg-secondary border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <Flex align="center" gap="sm" className="px-4 py-3 border-b border-border">
          <Search size={16} className="text-text-muted shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            size="sm"
            className="flex-1 bg-transparent border-0 focus:ring-0 px-0"
          />
        </Flex>

        {/* Results */}
        <ScrollArea direction="vertical" className="max-h-72 py-1">
          {filtered.length === 0 && (
            <Text size="xs" color="muted" as="p" className="px-4 py-3 text-center">No matching commands</Text>
          )}
          {filtered.map((cmd, i) => (
            <Button
              key={cmd.id}
              variant="ghost"
              onClick={() => { cmd.action(); onClose() }}
              className={`w-full flex items-center justify-between px-4 py-2 text-left transition-colors rounded-none border-0 h-auto ${
                i === selectedIndex ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:bg-white/5'
              }`}
            >
              <Flex align="center" gap="sm">
                {cmd.category && <Text size="xs" color="muted" className="text-[10px] uppercase">{cmd.category}</Text>}
                <Text size="xs">{cmd.title}</Text>
              </Flex>
              {cmd.keybinding && <Kbd>{cmd.keybinding}</Kbd>}
            </Button>
          ))}
        </ScrollArea>
      </Box>
    </>
  )
}
