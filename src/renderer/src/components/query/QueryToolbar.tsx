import { Play, Square, FileSearch, Loader2 } from 'lucide-react'

interface Props {
  onExecute: () => void
  onCancel: () => void
  onExplain: () => void
  isExecuting: boolean
  duration: number | null
  rowCount: number | null
  error: string | null
}

export function QueryToolbar({ onExecute, onCancel, onExplain, isExecuting, duration, rowCount, error }: Props) {
  return (
    <div className="flex items-center gap-2 flex-1">
      {isExecuting ? (
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-md bg-error/10 text-error hover:bg-error/20 transition-colors"
        >
          <Square size={12} /> Cancel
        </button>
      ) : (
        <button
          onClick={onExecute}
          className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-md bg-success/10 text-success hover:bg-success/20 transition-colors"
        >
          <Play size={12} /> Run
        </button>
      )}

      <button
        onClick={onExplain}
        disabled={isExecuting}
        className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-md border border-border text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors disabled:opacity-50"
      >
        <FileSearch size={12} /> Explain
      </button>

      <div className="ml-auto flex items-center gap-3 text-xs">
        {isExecuting && (
          <span className="text-text-muted flex items-center gap-1">
            <Loader2 size={12} className="animate-spin" /> Executing...
          </span>
        )}
        {!isExecuting && duration !== null && (
          <span className="text-success">{rowCount} rows · {duration}ms</span>
        )}
        {!isExecuting && error && (
          <span className="text-error truncate max-w-xs" title={error}>{error}</span>
        )}
      </div>
    </div>
  )
}
