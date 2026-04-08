import { useState } from 'react'
import { Download } from 'lucide-react'
import type { QueryResult } from '@shared/types'

interface Props {
  results: QueryResult
}

export function ResultsStatusBar({ results }: Props) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true)
    try {
      const fields = results.fields.map(f => f.name)
      await window.electronAPI.invoke('export:query-result', results.rows, fields, format)
    } catch {
      // ignore — user may have cancelled
    }
    setExporting(false)
  }

  return (
    <div className="flex items-center justify-between px-3 py-1 border-t border-border bg-bg-secondary text-xs shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-success">
          {results.rowCount} {results.rowCount === 1 ? 'row' : 'rows'}
        </span>
        <span className="text-text-muted">·</span>
        <span className="text-text-secondary">{results.duration}ms</span>
        {results.affectedRows > 0 && (
          <>
            <span className="text-text-muted">·</span>
            <span className="text-warning">{results.affectedRows} affected</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-text-muted">{results.fields.length} columns</span>
        <span className="text-text-muted">·</span>
        <button
          onClick={() => handleExport('csv')}
          disabled={exporting}
          className="text-text-muted hover:text-text-primary transition-colors flex items-center gap-1"
          title="Export as CSV"
        >
          <Download size={10} /> CSV
        </button>
        <button
          onClick={() => handleExport('json')}
          disabled={exporting}
          className="text-text-muted hover:text-text-primary transition-colors flex items-center gap-1"
          title="Export as JSON"
        >
          <Download size={10} /> JSON
        </button>
      </div>
    </div>
  )
}
