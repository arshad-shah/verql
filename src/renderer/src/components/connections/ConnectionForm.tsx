import { useState } from 'react'
import { X } from 'lucide-react'
import { ConnectionTestButton } from './ConnectionTestButton'
import type { ConnectionProfile, DatabaseType } from '@shared/types'

interface Props {
  initial?: ConnectionProfile
  onSave: (profile: ConnectionProfile) => void
  onClose: () => void
}

const DB_TYPES: { value: DatabaseType; label: string; defaultPort: number }[] = [
  { value: 'postgresql', label: 'PostgreSQL', defaultPort: 5432 },
  { value: 'mysql', label: 'MySQL', defaultPort: 3306 },
  { value: 'sqlite', label: 'SQLite', defaultPort: 0 }
]

const COLORS = ['#7c6ff7', '#28c840', '#e5c07b', '#61afef', '#ff5f57', '#c678dd']

export function ConnectionForm({ initial, onSave, onClose }: Props) {
  const [profile, setProfile] = useState<ConnectionProfile>(
    initial ?? {
      id: crypto.randomUUID(),
      name: '',
      type: 'postgresql',
      host: 'localhost',
      port: 5432,
      database: '',
      username: '',
      password: '',
      color: '#7c6ff7'
    }
  )

  const update = (patch: Partial<ConnectionProfile>) => setProfile((p) => ({ ...p, ...patch }))
  const isSqlite = profile.type === 'sqlite'

  const handleTypeChange = (type: DatabaseType) => {
    const defaultPort = DB_TYPES.find(t => t.value === type)?.defaultPort ?? 5432
    update({ type, port: defaultPort })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(profile)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-bg-secondary border border-border rounded-xl w-[480px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">{initial ? 'Edit Connection' : 'New Connection'}</h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-primary"><X size={16} /></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            {DB_TYPES.map(({ value, label }) => (
              <button key={value} type="button" onClick={() => handleTypeChange(value)}
                className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${profile.type === value ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-muted hover:text-text-primary'}`}>
                {label}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Connection Name</label>
            <input required value={profile.name} onChange={(e) => update({ name: e.target.value })} placeholder="My Database"
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
          {isSqlite ? (
            <div>
              <label className="block text-xs text-text-muted mb-1">Database File</label>
              <input required value={profile.database} onChange={(e) => update({ database: e.target.value })} placeholder="/path/to/database.sqlite"
                className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
            </div>
          ) : (
            <>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-text-muted mb-1">Host</label>
                  <input required value={profile.host ?? ''} onChange={(e) => update({ host: e.target.value })} placeholder="localhost"
                    className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                </div>
                <div className="w-24">
                  <label className="block text-xs text-text-muted mb-1">Port</label>
                  <input required type="number" value={profile.port ?? ''} onChange={(e) => update({ port: parseInt(e.target.value) || 0 })}
                    className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Database</label>
                <input required value={profile.database} onChange={(e) => update({ database: e.target.value })} placeholder="mydb"
                  className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-text-muted mb-1">Username</label>
                  <input value={profile.username ?? ''} onChange={(e) => update({ username: e.target.value })} placeholder="postgres"
                    className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-text-muted mb-1">Password</label>
                  <input type="password" value={profile.password ?? ''} onChange={(e) => update({ password: e.target.value })}
                    className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input type="checkbox" checked={profile.ssl ?? false} onChange={(e) => update({ ssl: e.target.checked })} className="accent-accent" />
                Use SSL
              </label>
            </>
          )}
          <ConnectionTestButton profile={profile} />
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
