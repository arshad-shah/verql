import { useState, useEffect, useRef } from 'react'
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react'
import { ConnectionTestButton } from './ConnectionTestButton'
import type { ConnectionProfile, DatabaseType } from '@shared/types'
import { Modal, Button, Input, Text, Flex, Stack, Checkbox, Label, ScrollArea, Box } from '@/primitives'

interface Props {
  initial?: ConnectionProfile
  onSave: (profile: ConnectionProfile) => void
  onClose: () => void
}

interface PluginDriver {
  driverId: string
  driverName: string
  connectionFields: { key: string; label: string; type: string; required?: boolean; default?: string | number | boolean; group?: string }[]
}

interface MiddlewareField {
  key: string; label: string; type: string; required?: boolean; default?: string | number | boolean; group?: string
}

const BUILTIN_TYPES: { value: DatabaseType; label: string; defaultPort: number }[] = [
  { value: 'postgresql', label: 'PostgreSQL', defaultPort: 5432 },
  { value: 'mysql', label: 'MySQL', defaultPort: 3306 },
  { value: 'sqlite', label: 'SQLite', defaultPort: 0 }
]

const COLORS = ['#7c6ff7', '#28c840', '#e5c07b', '#61afef', '#ff5f57', '#c678dd']

export function ConnectionForm({ initial, onSave, onClose }: Props) {
  const [pluginDrivers, setPluginDrivers] = useState<PluginDriver[]>([])
  const [middlewareFields, setMiddlewareFields] = useState<MiddlewareField[]>([])
  const [sshExpanded, setSshExpanded] = useState(false)
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false)
  const [typeSearch, setTypeSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [profile, setProfile] = useState<Record<string, unknown>>({
    id: crypto.randomUUID(),
    name: '',
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: '',
    username: '',
    password: '',
    color: '#7c6ff7',
    ...(initial ?? {})
  })

  useEffect(() => {
    window.electronAPI.invoke('plugins:connection-fields').then(setPluginDrivers).catch(() => {})
    window.electronAPI.invoke('plugins:middleware-fields').then(setMiddlewareFields).catch(() => {})
  }, [])

  const allTypes = [
    ...BUILTIN_TYPES.map(t => ({ value: t.value, label: t.label })),
    ...pluginDrivers.map(d => ({ value: d.driverId as DatabaseType, label: d.driverName.charAt(0).toUpperCase() + d.driverName.slice(1) }))
  ]

  const selectedType = allTypes.find(t => t.value === profile.type)
  const filteredTypes = typeSearch
    ? allTypes.filter(t => t.label.toLowerCase().includes(typeSearch.toLowerCase()))
    : allTypes

  // Close dropdown on click outside
  useEffect(() => {
    if (!typeDropdownOpen) return
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setTypeDropdownOpen(false)
        setTypeSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [typeDropdownOpen])

  const isBuiltin = BUILTIN_TYPES.some(t => t.value === profile.type)
  const activePluginDriver = pluginDrivers.find(d => d.driverId === profile.type)
  const isSqlite = profile.type === 'sqlite'
  const sshFields = middlewareFields.filter(f => f.group === 'ssh')

  const update = (patch: Record<string, unknown>) => setProfile(p => ({ ...p, ...patch }))

  const handleTypeChange = (type: DatabaseType) => {
    const builtinPort = BUILTIN_TYPES.find(t => t.value === type)?.defaultPort
    if (builtinPort !== undefined) {
      update({ type, port: builtinPort })
    } else {
      const driver = pluginDrivers.find(d => d.driverId === type)
      const defaults: Record<string, unknown> = { type }
      if (driver) {
        for (const field of driver.connectionFields) {
          if (field.default !== undefined && profile[field.key] === undefined) {
            defaults[field.key] = field.default
          }
        }
      }
      update(defaults)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(profile as ConnectionProfile)
  }

  const renderField = (field: { key: string; label: string; type: string; required?: boolean; default?: string | number | boolean }) => {
    const value = profile[field.key] ?? field.default ?? ''

    if (field.type === 'boolean') {
      return (
        <Flex key={field.key} direction="row" align="center" gap="sm" className="cursor-pointer" onClick={() => update({ [field.key]: !profile[field.key] })}>
          <Checkbox checked={!!profile[field.key]} onChange={(e) => update({ [field.key]: e.target.checked })} />
          <Text size="sm" color="secondary">{field.label}</Text>
        </Flex>
      )
    }

    return (
      <Box key={field.key}>
        <Label className="block mb-1"><Text size="xs" color="muted">{field.label}</Text></Label>
        <Input
          type={field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : 'text'}
          required={field.required}
          value={String(value)}
          onChange={(e) => update({ [field.key]: field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value })}
          size="sm"
        />
      </Box>
    )
  }

  return (
    <Modal open={true} onClose={onClose} className="w-[480px] max-w-[95vw]">
      <form onSubmit={handleSubmit}>
        <Flex direction="row" align="center" justify="between" className="px-4 py-3 border-b border-border">
          <Text size="sm" weight="semibold">{initial ? 'Edit Connection' : 'New Connection'}</Text>
          <Button type="button" variant="ghost" size="xs" onClick={onClose} aria-label="Close"><X size={14} /></Button>
        </Flex>

        <ScrollArea direction="vertical" className="max-h-[70vh]">
          <Stack gap="md" className="p-4">
            {/* Database type selector */}
            <Box ref={dropdownRef} className="relative">
              <Label className="block mb-1"><Text size="xs" color="muted">Database Type</Text></Label>
              <Button type="button" variant="ghost" onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
                className="w-full flex items-center justify-between bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary hover:border-accent/50 transition-colors h-auto">
                <Text size="sm">{selectedType?.label ?? String(profile.type)}</Text>
                <ChevronDown size={14} className={`text-text-muted transition-transform ${typeDropdownOpen ? 'rotate-180' : ''}`} />
              </Button>
              {typeDropdownOpen && (
                <Box className="absolute z-10 mt-1 w-full bg-bg-secondary border border-border rounded-lg shadow-xl overflow-hidden">
                  {allTypes.length > 5 && (
                    <Box className="p-2 border-b border-border">
                      <Flex align="center" gap="sm" className="bg-bg-tertiary rounded-md px-2 py-1.5">
                        <Search size={12} className="text-text-muted shrink-0" />
                        <Input
                          autoFocus
                          value={typeSearch}
                          onChange={(e) => setTypeSearch(e.target.value)}
                          placeholder="Search databases..."
                          size="sm"
                          className="w-full bg-transparent border-0 focus:ring-0 px-0"
                        />
                      </Flex>
                    </Box>
                  )}
                  <ScrollArea direction="vertical" className="max-h-48 py-1">
                    {filteredTypes.length === 0 && (
                      <Text size="xs" color="muted" as="p" className="px-3 py-2">No matches</Text>
                    )}
                    {filteredTypes.map(({ value, label }) => (
                      <Button key={value} type="button" variant="ghost"
                        onClick={() => { handleTypeChange(value); setTypeDropdownOpen(false); setTypeSearch('') }}
                        className={`w-full text-left px-3 py-1.5 text-sm transition-colors rounded-none border-0 h-auto ${
                          profile.type === value
                            ? 'bg-accent/10 text-accent'
                            : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                        }`}>
                        {label}
                      </Button>
                    ))}
                  </ScrollArea>
                </Box>
              )}
            </Box>

            <Box>
              <Label className="block mb-1"><Text size="xs" color="muted">Connection Name</Text></Label>
              <Input required value={String(profile.name ?? '')} onChange={(e) => update({ name: e.target.value })} placeholder="My Database" size="sm" />
            </Box>

            <Box>
              <Label className="block mb-1"><Text size="xs" color="muted">Color</Text></Label>
              <Flex direction="row" gap="sm">
                {COLORS.map(c => (
                  <Button key={c} type="button" variant="ghost" onClick={() => update({ color: c })}
                    className={`w-6 h-6 rounded-full border-2 transition-transform p-0 min-w-0 ${profile.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </Flex>
            </Box>

            {isBuiltin ? (
              <>
                {isSqlite ? (
                  <Box>
                    <Label className="block mb-1"><Text size="xs" color="muted">Database File</Text></Label>
                    <Input required value={String(profile.database ?? '')} onChange={(e) => update({ database: e.target.value })} placeholder="/path/to/database.sqlite" size="sm" />
                  </Box>
                ) : (
                  <>
                    <Flex direction="row" gap="md">
                      <Box className="flex-1">
                        <Label className="block mb-1"><Text size="xs" color="muted">Host</Text></Label>
                        <Input required value={String(profile.host ?? '')} onChange={(e) => update({ host: e.target.value })} placeholder="localhost" size="sm" />
                      </Box>
                      <Box className="w-24">
                        <Label className="block mb-1"><Text size="xs" color="muted">Port</Text></Label>
                        <Input required type="number" value={String(profile.port ?? '')} onChange={(e) => update({ port: parseInt(e.target.value) || 0 })} size="sm" />
                      </Box>
                    </Flex>
                    <Box>
                      <Label className="block mb-1"><Text size="xs" color="muted">Database</Text></Label>
                      <Input required value={String(profile.database ?? '')} onChange={(e) => update({ database: e.target.value })} placeholder="mydb" size="sm" />
                    </Box>
                    <Flex direction="row" gap="md">
                      <Box className="flex-1">
                        <Label className="block mb-1"><Text size="xs" color="muted">Username</Text></Label>
                        <Input value={String(profile.username ?? '')} onChange={(e) => update({ username: e.target.value })} placeholder="postgres" size="sm" />
                      </Box>
                      <Box className="flex-1">
                        <Label className="block mb-1"><Text size="xs" color="muted">Password</Text></Label>
                        <Input type="password" value={String(profile.password ?? '')} onChange={(e) => update({ password: e.target.value })} size="sm" />
                      </Box>
                    </Flex>
                    <Flex direction="row" align="center" gap="sm" className="cursor-pointer" onClick={() => update({ ssl: !profile.ssl })}>
                      <Checkbox checked={!!profile.ssl} onChange={(e) => update({ ssl: e.target.checked })} />
                      <Text size="sm" color="secondary">Use SSL</Text>
                    </Flex>
                  </>
                )}
              </>
            ) : activePluginDriver ? (
              <Stack gap="md">
                {activePluginDriver.connectionFields.filter(f => !f.group).map(renderField)}
              </Stack>
            ) : null}

            {sshFields.length > 0 && !isSqlite && (
              <Box className="border border-border rounded-lg">
                <Button type="button" variant="ghost" onClick={() => setSshExpanded(!sshExpanded)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary rounded-none h-auto border-0">
                  {sshExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  SSH Tunnel
                </Button>
                {sshExpanded && (
                  <Stack gap="md" className="px-3 pb-3">
                    {sshFields.map(renderField)}
                  </Stack>
                )}
              </Box>
            )}

            <ConnectionTestButton profile={profile as ConnectionProfile} />
          </Stack>
        </ScrollArea>

        <Flex direction="row" justify="end" gap="sm" className="px-4 py-3 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="solid" size="sm">
            {initial ? 'Save Changes' : 'Add Connection'}
          </Button>
        </Flex>
      </form>
    </Modal>
  )
}
