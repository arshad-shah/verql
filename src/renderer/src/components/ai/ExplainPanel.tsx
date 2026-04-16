import { useState, useCallback } from 'react'
import { Sparkles, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import type { QueryResult } from '@shared/types'
import { useTabsStore } from '@/stores/tabs'

interface Props {
  tabId: string
  sql: string
  results: QueryResult
  explanation: string | null
}

export function ExplainPanel({ tabId, sql, results, explanation }: Props) {
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const setTabAiExplanation = useTabsStore(s => s.setTabAiExplanation)

  const handleExplain = useCallback(async () => {
    if (loading) return
    setLoading(true)
    setExpanded(true)
    try {
      const sampleRows = results.rows.slice(0, 5)
      const columns = results.fields.map(f => f.name)
      const result = await window.electronAPI.invoke('ai:explain-results', {
        sql,
        columns,
        rowCount: results.rowCount,
        sampleRows
      }) as { explanation: string }
      setTabAiExplanation(tabId, result.explanation)
    } catch (err) {
      setTabAiExplanation(tabId, `Failed to explain: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }, [tabId, sql, results, loading, setTabAiExplanation])

  if (!explanation && !loading) {
    return (
      <button
        onClick={handleExplain}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-accent transition-colors px-2 py-0.5"
        title="Explain these results with AI"
      >
        <Sparkles size={10} />
        Explain
      </button>
    )
  }

  return (
    <div className="border-t border-accent/30 bg-bg-secondary">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-hover transition-colors"
      >
        <Sparkles size={12} className="text-accent" />
        <span className="text-accent font-medium">AI Explanation</span>
        <div className="flex-1" />
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {expanded && (
        <div className="px-3 pb-2 text-sm text-text-secondary leading-relaxed">
          {loading ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 size={14} className="animate-spin text-accent" />
              <span className="text-text-muted">Analyzing results...</span>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{explanation}</p>
          )}
        </div>
      )}
    </div>
  )
}
