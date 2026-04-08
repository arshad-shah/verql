import { useState } from 'react'
import { X, Download, Loader2 } from 'lucide-react'
import { useConnectionsStore } from '@/stores/connections'

interface Props {
  tableName?: string
  connectionId: string
  onClose: () => void
}

type ExportFormat = 'sql' | 'csv' | 'json'

export function ExportModal({ tableName, connectionId, onClose }: Props) {
  const [format, setFormat] = useState<ExportFormat>('sql')
  const [includeSchema, setIncludeSchema] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const { connections } = useConnectionsStore()
  const conn = connections.find(c => c.id === connectionId)

  const handleExport = async () => {
    if (!tableName) return
    setExporting(true)
    try {
      const res = await window.electronAPI.invoke('export:table', connectionId, tableName, format, { includeSchema })
      if ('filePath' in res) {
        setResult(`Exported to ${res.filePath}`)
        setTimeout(onClose, 1500)
      }
    } catch (err) {
      setResult(`Error: ${(err as Error).message}`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bg-secondary border border-border rounded-xl w-[400px]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">Export {tableName}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X size={16} /></button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs text-text-muted mb-2">Format</label>
            <div className="flex gap-2">
              {(['sql', 'csv', 'json'] as ExportFormat[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${format === f ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-muted hover:text-text-primary'}`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {format === 'sql' && (
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input type="checkbox" checked={includeSchema} onChange={e => setIncludeSchema(e.target.checked)} className="accent-accent" />
              Include CREATE TABLE
            </label>
          )}

          {result && (
            <p className={`text-xs ${result.startsWith('Error') ? 'text-error' : 'text-success'}`}>{result}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-border">
          <button onClick={onClose} className="px-4 py-1.5 text-sm rounded-lg border border-border hover:bg-white/5">Cancel</button>
          <button
            onClick={handleExport}
            disabled={exporting || !tableName}
            className="px-4 py-1.5 text-sm rounded-lg bg-accent text-white hover:bg-accent-hover disabled:opacity-50 flex items-center gap-1.5"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Export
          </button>
        </div>
      </div>
    </div>
  )
}
