import { useState, useMemo } from 'react'
import { Stack, Heading, Text, Divider } from '@/primitives'
import { SearchInput } from '@/primitives'
import { Table, Kbd } from '@/primitives'
import { useSettingsStore } from '@/stores/settings'

export function KeybindingsSettings() {
  const keybindings = useSettingsStore((s) => s.settings.keybindings)
  const [search, setSearch] = useState('')

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
      <div>
        <Heading level={4}>Keybindings</Heading>
        <Text size="xs" color="muted" className="mt-1">Keyboard shortcuts for common actions</Text>
      </div>

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
                        <Kbd key={i}>{k}</Kbd>
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
