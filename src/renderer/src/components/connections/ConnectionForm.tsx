import { useState, useEffect } from 'react'
import { X, ChevronDown, ChevronRight } from 'lucide-react'
import { ConnectionTestButton } from './ConnectionTestButton'
import type { ConnectionProfile, DatabaseType } from '@shared/types'

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
        <label key={field.key} className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
          <input type="checkbox" checked={!!profile[field.key]} onChange={(e) => update({ [field.key]: e.target.checked })} className="accent-accent" />
          {field.label}
        </label>
      )
    }

    return (
      <div key={field.key}>
        <label className="block text-xs text-text-muted mb-1">{field.label}</label>
        <input
          type={field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : 'text'}
          required={field.required}
          value={String(value)}
          onChange={(e) => update({ [field.key]: field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value })}
          className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
        />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-bg-secondary border border-border rounded-xl w-[480px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">{initial ? 'Edit Connection' : 'New Connection'}</h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-primary"><X size={16} /></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex gap-2 flex-wrap">
            {allTypes.map(({ value, label }) => (
              <button key={value} type="button" onClick={() => handleTypeChange(value)}
                className={`flex-1 min-w-20 py-2 text-sm rounded-lg border transition-colors ${profile.type === value ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-muted hover:text-text-primary'}`}>
                {label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1">Connection Name</label>
            <input required value={String(profile.name ?? '')} onChange={(e) => update({ name: e.target.value })} placeholder="My Database"
              className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => update({ color: c })}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${profile.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {isBuiltin ? (
            <>
              {isSqlite ? (
                <div>
                  <label className="block text-xs text-text-muted mb-1">Database File</label>
                  <input required value={String(profile.database ?? '')} onChange={(e) => update({ database: e.target.value })} placeholder="/path/to/database.sqlite"
                    className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                </div>
              ) : (
                <>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs text-text-muted mb-1">Host</label>
                      <input required value={String(profile.host ?? '')} onChange={(e) => update({ host: e.target.value })} placeholder="localhost"
                        className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                    </div>
                    <div className="w-24">
                      <label className="block text-xs text-text-muted mb-1">Port</label>
                      <input required type="number" value={String(profile.port ?? '')} onChange={(e) => update({ port: parseInt(e.target.value) || 0 })}
                        className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Database</label>
                    <input required value={String(profile.database ?? '')} onChange={(e) => update({ database: e.target.value })} placeholder="mydb"
                      className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs text-text-muted mb-1">Username</label>
                      <input value={String(profile.username ?? '')} onChange={(e) => update({ username: e.target.value })} placeholder="postgres"
                        className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-text-muted mb-1">Password</label>
                      <input type="password" value={String(profile.password ?? '')} onChange={(e) => update({ password: e.target.value })}
                        className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                    <input type="checkbox" checked={!!profile.ssl} onChange={(e) => update({ ssl: e.target.checked })} className="accent-accent" />
                    Use SSL
                  </label>
                </>
              )}
            </>
          ) : activePluginDriver ? (
            <div className="space-y-4">
              {activePluginDriver.connectionFields.filter(f => !f.group).map(renderField)}
            </div>
          ) : null}

          {sshFields.length > 0 && !isSqlite && (
            <div className="border border-border rounded-lg">
              <button type="button" onClick={() => setSshExpanded(!sshExpanded)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary">
                {sshExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                SSH Tunnel
              </button>
              {sshExpanded && (
                <div className="px-3 pb-3 space-y-3">
                  {sshFields.map(renderField)}
                </div>
              )}
            </div>
          )}

          <ConnectionTestButton profile={profile as ConnectionProfile} />
        </div>
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-border">
          <button type="button" onClick={onClose} className="px-4 py-1.5 text-sm rounded-lg border border-border hover:bg-white/5">Cancel</button>
          <button type="submit" className="px-4 py-1.5 text-sm rounded-lg bg-accent text-white hover:bg-accent-hover">
            {initial ? 'Save Changes' : 'Add Connection'}
          </button>
        </div>
      </form>
    </div>
  )
}
