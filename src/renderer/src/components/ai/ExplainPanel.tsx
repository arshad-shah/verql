import { useState, useCallback } from 'react'
import { Sparkles, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import type { QueryResult } from '@shared/types'
import { useTabsStore } from '@/stores/tabs'
import { useExplainStore } from '@/stores/explain'
import { notifyError } from '@/lib/notify-error'
import { parseAppError } from '@/lib/db-error'

interface Props {
  tabId: string
  sql: string
  results: QueryResult
  explanation: string | null
}

/**
 * Inline AI-explain button. Lives in the Results status bar next to the
 * export controls. The actual explanation text renders separately via
 * <ExplainResult> so the status bar stays a single row regardless of state.
 */
export function ExplainPanel({ tabId, sql, results, explanation }: Props) {
  const loading = useExplainStore(s => s.loading[tabId] ?? false)
  const setLoading = useExplainStore(s => s.setLoading)
  const setTabAiExplanation = useTabsStore(s => s.setTabAiExplanation)

  const handleExplain = useCallback(async () => {
    if (loading) return
    setLoading(tabId, true)
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
      const parsed = parseAppError(err)
      setTabAiExplanation(tabId, `Failed to explain: ${parsed.message}`)
      notifyError(err, { titlePrefix: 'AI: Explain failed' })
    } finally {
      setLoading(tabId, false)
    }
  }, [tabId, sql, results, loading, setLoading, setTabAiExplanation])

  return (
    <button
      onClick={handleExplain}
      disabled={loading}
      className="flex items-center gap-1 text-xs text-text-muted hover:text-accent disabled:opacity-60 transition-colors px-2 py-0.5"
      title={explanation ? 'Re-run AI explanation' : 'Explain these results with AI'}
    >
      {loading
        ? <Loader2 size={10} className="animate-spin text-accent" />
        : <Sparkles size={10} className={explanation ? 'text-accent' : ''} />}
      Explain
    </button>
  )
}

/**
 * Collapsible block that shows the latest AI explanation for a tab. Renders
 * above the status bar — only when an explanation exists or a request is in
 * flight — so the grid keeps its full height when AI isn't being used.
 */
export function ExplainResult({ tabId, explanation }: { tabId: string; explanation: string | null }) {
  const loading = useExplainStore(s => s.loading[tabId] ?? false)
  const [expanded, setExpanded] = useState(true)

  if (!explanation && !loading) return null

  return (
    <div className="border-t border-accent/30 bg-bg-secondary shrink-0">
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
        <div className="px-3 pb-2 text-sm text-text-secondary leading-relaxed max-h-48 overflow-auto">
          {loading && !explanation ? (
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
