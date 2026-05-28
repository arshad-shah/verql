import { useState, useCallback, type KeyboardEvent } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { notifyError } from '@/lib/notify-error'
import { IPC_CHANNELS } from '@shared/ipc'

interface Props {
  connectionId: string | null
  schema: string | null
  onSqlGenerated: (sql: string) => void
}

export function NLInputBar({ connectionId, schema, onSqlGenerated }: Props) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || !connectionId || loading) return
    setLoading(true)
    try {
      const result = await window.electronAPI.invoke(IPC_CHANNELS.AI_GENERATE_SQL, {
        prompt: prompt.trim(),
        connectionId,
        schema: schema ?? undefined
      }) as { sql: string }
      if (result.sql) {
        onSqlGenerated(result.sql)
        setPrompt('')
      }
    } catch (err) {
      notifyError(err, { titlePrefix: 'AI: Generate SQL failed' })
    } finally {
      setLoading(false)
    }
  }, [prompt, connectionId, schema, loading, onSqlGenerated])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleGenerate()
    }
  }, [handleGenerate])

  const disabled = !connectionId || loading
  const placeholder = connectionId
    ? 'Describe what you want to query in plain English…'
    : 'Connect to a database to generate SQL from plain English'

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border-default bg-bg-secondary shrink-0">
      <Sparkles size={14} className={connectionId ? 'text-accent shrink-0' : 'text-text-muted shrink-0'} />
      <input
        type="text"
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 bg-bg-primary border border-border-default rounded-md px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <button
        onClick={handleGenerate}
        disabled={disabled || !prompt.trim()}
        className="shrink-0 rounded-md bg-accent px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        {loading ? 'Generating…' : 'Generate'}
      </button>
    </div>
  )
}
