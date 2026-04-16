import { useState, useCallback, type KeyboardEvent } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'

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
      const result = await window.electronAPI.invoke('ai:generate-sql', {
        prompt: prompt.trim(),
        connectionId,
        schema: schema ?? undefined
      }) as { sql: string }
      if (result.sql) {
        onSqlGenerated(result.sql)
        setPrompt('')
      }
    } catch (err) {
      console.error('Failed to generate SQL:', err)
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

  if (!connectionId) return null

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-bg-secondary shrink-0">
      <Sparkles size={14} className="text-accent shrink-0" />
      <input
        type="text"
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Describe what you want to query in plain English..."
        disabled={loading}
        className="flex-1 bg-bg-primary border border-border rounded-md px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
      />
      <button
        onClick={handleGenerate}
        disabled={!prompt.trim() || loading}
        className="shrink-0 rounded-md bg-accent px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : null}
        {loading ? 'Generating...' : 'Generate'}
      </button>
    </div>
  )
}
