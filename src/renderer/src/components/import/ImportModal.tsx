import { useState } from 'react'
import { X, Upload, Loader2 } from 'lucide-react'

interface Props {
  connectionId: string
  onClose: () => void
}

type ImportType = 'csv' | 'sql'

export function ImportModal({ connectionId, onClose }: Props) {
  const [importType, setImportType] = useState<ImportType>('sql')
  const [tableName, setTableName] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleImportSql = async () => {
    setImporting(true)
    try {
      const res = await window.electronAPI.invoke('import:sql', connectionId)
      if ('cancelled' in res) { setImporting(false); return }
      const msg = `Executed ${res.executed} statements` + (res.errors.length > 0 ? ` (${res.errors.length} errors)` : '')
      setResult(msg)
      if (res.errors.length === 0) setTimeout(onClose, 1500)
    } catch (err) {
      setResult(`Error: ${(err as Error).message}`)
    } finally {
      setImporting(false)
    }
  }

  const handleImportCsv = async () => {
    if (!tableName.trim()) return
    setImporting(true)
    try {
      // Simple 1:1 column mapping — CSV headers match DB columns
      const mapping: Record<string, string> = {}
      // We'll let the backend figure out the mapping from CSV headers
      const res = await window.electronAPI.invoke('import:csv', connectionId, tableName, mapping, 'skip')
      if ('cancelled' in res) { setImporting(false); return }
      const msg = `Inserted ${res.inserted} rows` + (res.skipped > 0 ? `, ${res.skipped} skipped` : '') + (res.errors.length > 0 ? `, ${res.errors.length} errors` : '')
      setResult(msg)
      if (res.errors.length === 0) setTimeout(onClose, 1500)
    } catch (err) {
      setResult(`Error: ${(err as Error).message}`)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bg-secondary border border-border rounded-xl w-[400px]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">Import Data</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X size={16} /></button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs text-text-muted mb-2">Import Type</label>
            <div className="flex gap-2">
              {(['sql', 'csv'] as ImportType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setImportType(t)}
                  className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${importType === t ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-muted hover:text-text-primary'}`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {importType === 'sql' && (
            <p className="text-xs text-text-secondary">Select a .sql file to execute all statements against the connected database.</p>
          )}

          {importType === 'csv' && (
            <div>
              <label className="block text-xs text-text-muted mb-1">Target Table</label>
              <input
                value={tableName}
                onChange={e => setTableName(e.target.value)}
                placeholder="table_name"
                className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
              />
              <p className="text-xs text-text-muted mt-1">CSV column headers must match table column names.</p>
            </div>
          )}

          {result && (
            <p className={`text-xs ${result.startsWith('Error') ? 'text-error' : 'text-success'}`}>{result}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-border">
          <button onClick={onClose} className="px-4 py-1.5 text-sm rounded-lg border border-border hover:bg-white/5">Cancel</button>
          <button
            onClick={importType === 'sql' ? handleImportSql : handleImportCsv}
            disabled={importing || (importType === 'csv' && !tableName.trim())}
            className="px-4 py-1.5 text-sm rounded-lg bg-accent text-white hover:bg-accent-hover disabled:opacity-50 flex items-center gap-1.5"
          >
            {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Import
          </button>
        </div>
      </div>
    </div>
  )
}
