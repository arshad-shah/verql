import { useState, useMemo, useEffect } from 'react'
import { Stack, Text, Divider } from '@/primitives'
import { SearchInput } from '@/primitives'
import { Table, KbdGroup } from '@/primitives'
import { useSettingsStore } from '@/stores/settings'
import { usePluginCommands } from '@/stores/plugin-commands'

export function KeybindingsSettings() {
  const builtinKeybindings = useSettingsStore((s) => s.settings.keybindings)
  const pluginCommands = usePluginCommands((s) => s.commands)
  const fetchPluginCommands = usePluginCommands((s) => s.fetch)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchPluginCommands()
  }, [fetchPluginCommands])

  // Merge built-in and plugin keybindings into one display list. Plugin
  // entries appear under "<Plugin name>" categories so they group together
  // and don't collide with the built-in categories.
  const keybindings = useMemo(() => {
    const all: { id: string; label: string; keys: string[]; category: string; source?: string }[] = [
      ...builtinKeybindings.map((kb) => ({ ...kb })),
    ]
    for (const pc of pluginCommands) {
      if (!pc.keybinding) continue
      all.push({
        id: `${pc.pluginId}:${pc.commandId}`,
        label: pc.title,
        keys: [pc.keybinding],
        category: pc.pluginDisplayName,
        source: pc.pluginId
      })
    }
    return all
  }, [builtinKeybindings, pluginCommands])

  const filtered = useMemo(() => {
    if (!search) return keybindings
    const q = search.toLowerCase()
    return keybindings.filter(
      (kb) => kb.label.toLowerCase().includes(q) || kb.category.toLowerCase().includes(q)
    )
  }, [keybindings, search])

  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {}
    for (const kb of filtered) {
      if (!groups[kb.category]) groups[kb.category] = []
      groups[kb.category].push(kb)
    }
    return groups
  }, [filtered])

  const isMac = navigator.platform.includes('Mac')

  return (
    <Stack gap="md">
      <Text size="xs" color="muted">Keyboard shortcuts for common actions</Text>

      <SearchInput
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onClear={() => setSearch('')}
        placeholder="Search keybindings..."
        size="sm"
      />

      {Object.entries(grouped).map(([category, bindings]) => (
        <div key={category}>
          <Text size="xs" color="muted" className="uppercase tracking-wider font-semibold mb-2">
            {category}
          </Text>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Action</Table.Head>
                <Table.Head>Shortcut</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {bindings.map((kb) => (
                <Table.Row key={kb.id}>
                  <Table.Cell>
                    <Text size="sm">{kb.label}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    {kb.keys
                      .filter((k) => isMac ? k.startsWith('Cmd') : k.startsWith('Ctrl'))
                      .map((k, i) => (
                        <KbdGroup key={i} accelerator={k} size="sm" />
                      ))}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
          <Divider className="my-2" />
        </div>
      ))}
    </Stack>
  )
}
