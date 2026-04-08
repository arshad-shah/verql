import { useState } from 'react'

interface Settings {
  fontSize: number
  tabSize: number
  wordWrap: boolean
  minimap: boolean
  queryTimeout: number
  maxHistoryItems: number
  defaultPageSize: number
}

const defaultSettings: Settings = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  queryTimeout: 30,
  maxHistoryItems: 200,
  defaultPageSize: 100
}

export function SettingsPanel() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(s => ({ ...s, [key]: value }))
  }

  return (
    <div className="p-4 space-y-6 max-w-lg">
      <h2 className="text-sm font-semibold text-text-primary">Settings</h2>

      {/* Editor */}
      <section>
        <h3 className="text-xs text-text-muted uppercase tracking-wider mb-3">Editor</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs text-text-secondary">Font Size</label>
            <input type="number" value={settings.fontSize} onChange={e => update('fontSize', parseInt(e.target.value) || 14)} min={10} max={24}
              className="w-16 bg-bg-tertiary border border-border rounded px-2 py-1 text-xs text-text-primary text-right" />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-text-secondary">Tab Size</label>
            <select value={settings.tabSize} onChange={e => update('tabSize', parseInt(e.target.value))}
              className="bg-bg-tertiary border border-border rounded px-2 py-1 text-xs text-text-primary">
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-text-secondary">Word Wrap</label>
            <input type="checkbox" checked={settings.wordWrap} onChange={e => update('wordWrap', e.target.checked)} className="accent-accent" />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-text-secondary">Minimap</label>
            <input type="checkbox" checked={settings.minimap} onChange={e => update('minimap', e.target.checked)} className="accent-accent" />
          </div>
        </div>
      </section>

      {/* Query */}
      <section>
        <h3 className="text-xs text-text-muted uppercase tracking-wider mb-3">Query Execution</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs text-text-secondary">Timeout (seconds)</label>
            <input type="number" value={settings.queryTimeout} onChange={e => update('queryTimeout', parseInt(e.target.value) || 30)} min={5} max={300}
              className="w-16 bg-bg-tertiary border border-border rounded px-2 py-1 text-xs text-text-primary text-right" />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-text-secondary">Default Page Size</label>
            <select value={settings.defaultPageSize} onChange={e => update('defaultPageSize', parseInt(e.target.value))}
              className="bg-bg-tertiary border border-border rounded px-2 py-1 text-xs text-text-primary">
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={500}>500</option>
              <option value={1000}>1000</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-text-secondary">Max History Items</label>
            <input type="number" value={settings.maxHistoryItems} onChange={e => update('maxHistoryItems', parseInt(e.target.value) || 200)} min={50} max={1000}
              className="w-16 bg-bg-tertiary border border-border rounded px-2 py-1 text-xs text-text-primary text-right" />
          </div>
        </div>
      </section>

      <p className="text-[10px] text-text-muted">Settings are saved automatically.</p>
    </div>
  )
}
