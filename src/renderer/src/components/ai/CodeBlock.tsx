import { useState, useEffect, useCallback } from 'react'
import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createOnigurumaEngine } from 'shiki/engine/oniguruma'
import DOMPurify from 'dompurify'
import { useTabsStore } from '@/stores/tabs'
import { useConnectionsStore } from '@/stores/connections'

const SUPPORTED_LANGS = ['sql', 'json', 'javascript'] as const
type SupportedLang = typeof SUPPORTED_LANGS[number]

let highlighterPromise: Promise<HighlighterCore> | null = null
function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [import('shiki/themes/github-dark-default.mjs')],
      langs: [
        import('shiki/langs/sql.mjs'),
        import('shiki/langs/json.mjs'),
        import('shiki/langs/javascript.mjs'),
      ],
      engine: createOnigurumaEngine(import('shiki/wasm')),
    })
  }
  return highlighterPromise
}

const LANG_LABELS: Record<string, string> = {
  sql: 'SQL',
  json: 'JSON',
  javascript: 'JavaScript',
  js: 'JavaScript',
}

interface CodeBlockProps {
  code: string
  language?: string
  showInsert?: boolean
  alwaysShowInsert?: boolean
}

export function CodeBlock({ code, language, showInsert = true, alwaysShowInsert = false }: CodeBlockProps) {
  const [html, setHtml] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const updateTabSql = useTabsStore(s => s.updateTabSql)
  const setTabDirty = useTabsStore(s => s.setTabDirty)
  const addQueryTab = useTabsStore(s => s.addQueryTab)
  const tabs = useTabsStore(s => s.tabs)
  const activeTabId = useTabsStore(s => s.activeTabId)
  const connectionId = useConnectionsStore(s => s.activeConnectionId)

  useEffect(() => {
    let cancelled = false
    const lang: SupportedLang = (SUPPORTED_LANGS as readonly string[]).includes(language || '')
      ? (language as SupportedLang)
      : 'sql'
    getHighlighter().then((hl) => {
      if (cancelled) return
      const result = hl.codeToHtml(code, { lang, theme: 'github-dark-default' })
      setHtml(DOMPurify.sanitize(result))
    }).catch(() => {})
    return () => { cancelled = true }
  }, [code, language])

  const insertIntoEditor = useCallback(() => {
    const activeTab = tabs.find(t => t.id === activeTabId && t.type === 'query')
    if (activeTab) {
      updateTabSql(activeTab.id, code)
      setTabDirty(activeTab.id, true)
    } else {
      const newId = addQueryTab(connectionId)
      updateTabSql(newId, code)
      setTabDirty(newId, true)
    }
  }, [code, tabs, activeTabId, connectionId, updateTabSql, setTabDirty, addQueryTab])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [code])

  const langLabel = LANG_LABELS[language || ''] || language || 'SQL'
  const showActions = alwaysShowInsert

  return (
    <div className={`${showActions ? '' : 'group'} my-2 rounded-lg border border-[var(--color-border)] overflow-hidden`}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border)]">
        <span className="text-[11px] text-[var(--color-text-secondary)]">{langLabel}</span>
        <div className={`flex items-center gap-1 ${showActions ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity'}`}>
          <button
            type="button"
            onClick={handleCopy}
            className="px-1.5 py-0.5 rounded text-[10px] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
          {showInsert && (
            <button
              type="button"
              onClick={insertIntoEditor}
              className="px-1.5 py-0.5 rounded text-[10px] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-hover)]"
            >
              Insert
            </button>
          )}
        </div>
      </div>
      {/* Code body */}
      {html ? (
        <div
          className="text-xs [&_pre]:!p-3 [&_pre]:!m-0 [&_pre]:!rounded-none [&_pre]:!text-xs [&_code]:!text-xs [&_code]:!whitespace-pre-wrap [&_code]:!break-words"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="bg-[var(--color-bg-inset)] p-3 text-xs whitespace-pre-wrap break-words">
          <code>{code}</code>
        </pre>
      )}
    </div>
  )
}
